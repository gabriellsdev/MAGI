import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import type {
  AgentId,
  AgentStructuredOutput,
  DeliberationRound,
  MagiSynthesisResult,
  MagiExecutionMetadata,
  EpistemicClaim,
  EpistemicAudit,
} from '../domain/types.js';
import { MagiSynthesisOutputSchema } from '../domain/schemas.js';
import { getLanguageInstruction } from './language-detector.js';
import { calculateGeminiCost } from '../providers/gemini/gemini.config.js';

export interface MagiCoreSynthesizeOptions {
  language?: string;
  startTime?: number;
}

export class MagiCore {
  private provider: ILanguageModelProvider;
  private model?: string;

  constructor(provider: ILanguageModelProvider, model?: string) {
    this.provider = provider;
    this.model = model;
  }

  async synthesize(
    question: string,
    initialAnalysis: Record<AgentId, AgentStructuredOutput>,
    rounds: DeliberationRound[],
    options: MagiCoreSynthesizeOptions = {}
  ): Promise<MagiSynthesisResult> {
    const startTime = options.startTime ?? Date.now();
    const language = options.language || 'English';
    const langInstruction = getLanguageInstruction(language);

    const systemInstruction =
      `You are MAGI CORE, the central synthesis arbiter of the MAGI supercomputer system.\n` +
      `You receive the independent analyses from MELCHIOR-1 (analytical), BALTHASAR-2 (critical/risk), and CASPER-3 (pragmatic/alternative), along with any deliberation rounds.\n\n` +
      `CORE MANDATE:\n` +
      `1. DO NOT SIMPLY SELECT THE MAJORITY OPINION. Democratic vote counting is strictly prohibited.\n` +
      `2. Evaluate the inherent strength of the arguments, the validity of underlying assumptions, and the severity of identified risks.\n` +
      `3. If a minority agent (such as Balthasar) identifies an unmitigated catastrophic failure mode or if Melchior proves an empirical contradiction, that objection holds decisive weight regardless of other votes.\n` +
      `4. Score each agent's argument quality objectively from 1 to 10.\n` +
      `5. Perform an EPISTEMIC AUDIT: evaluate facts vs unverified assumptions. Give decisive advantage to empirical facts over unsupported speculation.\n` +
      `6. Deliver an authoritative synthesis that reconciles logic, risk, and pragmatic reality into a definitive verdict.\n\n` +
      langInstruction;

    const roundsSummary = rounds.length === 0
      ? 'No deliberation rounds were required (immediate consensus was achieved in Round 0).'
      : rounds
          .map(r => {
            return `--- DELIBERATION ROUND ${r.roundNumber} ---\n` +
              `Disagreement reason: ${r.disagreementReport.reason}\n` +
              Object.entries(r.agentOutputs)
                .map(([id, out]) => {
                  const critiques = out.critiquesOfPeers?.length
                    ? `\n  Critiques: ${out.critiquesOfPeers.map(c => `[vs ${c.targetAgent}: ${c.rebuttal}]`).join('; ')}`
                    : '';
                  const claims = out.claims?.length
                    ? `\n  Claims: ${out.claims.map(c => `[${c.type}] ${c.statement} (Conf: ${c.confidence})`).join('; ')}`
                    : '';
                  return `* ${id}: Stance=${out.stance}, Conf=${out.confidence}\n  Summary: ${out.summary}${critiques}${claims}`;
                })
                .join('\n');
          })
          .join('\n\n');

    const initialSummary = Object.entries(initialAnalysis)
      .map(([id, out]) => {
        const claims = out.claims?.length
          ? `\n  - Epistemic Claims: ${out.claims.map(c => `[${c.type}] ${c.statement} (Conf: ${c.confidence})`).join('; ')}`
          : '';
        return `* ${id} (Round 0):\n` +
          `  - Stance: ${out.stance} (Confidence: ${out.confidence})\n` +
          `  - Summary: ${out.summary}\n` +
          `  - Key Arguments: ${out.keyArguments.join('; ')}\n` +
          `  - Identified Risks: ${out.identifiedRisks.join('; ')}\n` +
          `  - Recommendation: ${out.recommendedAction}${claims}`;
      })
      .join('\n\n');

    const userPrompt =
      `ORIGINAL QUESTION SUBMITTED TO MAGI:\n"${question}"\n\n` +
      `INITIAL INDEPENDENT ANALYSES (ROUND 0):\n${initialSummary}\n\n` +
      `DELIBERATION TRAJECTORY:\n${roundsSummary}\n\n` +
      `Synthesize the final judgment according to the schema in ${language}.`;

    const response = await this.provider.generateStructured({
      model: this.model,
      systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
      schema: MagiSynthesisOutputSchema,
      schemaName: 'MagiSynthesisOutput',
      config: { temperature: 0.1 },
    });

    const parsed = response.data;
    const durationMs = Date.now() - startTime;

    // Aggregate tokens across all stages (initial, deliberation rounds, and core synthesis)
    let promptTokens = response.usage?.promptTokens || 0;
    let completionTokens = response.usage?.completionTokens || 0;

    Object.values(initialAnalysis).forEach(out => {
      if (out.tokensUsed) {
        promptTokens += out.tokensUsed.promptTokens || 0;
        completionTokens += out.tokensUsed.completionTokens || 0;
      }
    });

    rounds.forEach(r => {
      Object.values(r.agentOutputs).forEach(out => {
        if (out.tokensUsed) {
          promptTokens += out.tokensUsed.promptTokens || 0;
          completionTokens += out.tokensUsed.completionTokens || 0;
        }
      });
    });

    const totalTokensUsed = promptTokens + completionTokens;
    const resolvedModel = this.model || (this.provider as any).defaultModel || 'gemini-3.1-pro-preview';
    const estimatedCostUsd = calculateGeminiCost(resolvedModel, promptTokens, completionTokens);

    // Compute or fall back epistemic audit across all initial & deliberation claims
    let epistemicAudit: EpistemicAudit | undefined = parsed.epistemicAudit;
    if (!epistemicAudit) {
      const allClaims: { agentId: AgentId; claim: EpistemicClaim }[] = [];
      Object.entries(initialAnalysis).forEach(([id, out]) => {
        out.claims?.forEach(claim => allClaims.push({ agentId: id as AgentId, claim }));
      });
      rounds.forEach(r => {
        Object.entries(r.agentOutputs).forEach(([id, out]) => {
          out.claims?.forEach(claim => allClaims.push({ agentId: id as AgentId, claim }));
        });
      });

      if (allClaims.length > 0) {
        const factCount = allClaims.filter(c => c.claim.type === 'FACT').length;
        const unverifiedAssumptionsCount = allClaims.filter(
          c => c.claim.type === 'ASSUMPTION' || (c.claim.requiresEvidence && c.claim.type !== 'FACT')
        ).length;

        const ratio = factCount / (factCount + unverifiedAssumptionsCount || 1);
        const evidenceConfidenceScore = Math.min(10, Math.max(1, Math.round(ratio * 9 + 1)));

        const agentFactScores: Record<AgentId, number> = { MELCHIOR: 0, BALTHASAR: 0, CASPER: 0 };
        allClaims.forEach(({ agentId, claim }) => {
          if (claim.type === 'FACT') agentFactScores[agentId] += 2;
          if (claim.type === 'INFERENCE') agentFactScores[agentId] += 1;
        });

        let strongestAgent: AgentId = 'MELCHIOR';
        let highestScore = -1;
        (Object.keys(agentFactScores) as AgentId[]).forEach(id => {
          if (agentFactScores[id] > highestScore) {
            highestScore = agentFactScores[id];
            strongestAgent = id;
          }
        });

        epistemicAudit = {
          factCount,
          unverifiedAssumptionsCount,
          evidenceConfidenceScore,
          strongestEvidenceAgent: strongestAgent,
        };
      }
    }

    const metadata: MagiExecutionMetadata = {
      timestamp: new Date().toISOString(),
      durationMs,
      model: resolvedModel,
      provider: this.provider.providerId,
      language,
      promptTokens,
      completionTokens,
      totalTokensUsed,
      estimatedCostUsd,
    };

    return {
      question,
      finalDecision: parsed.finalDecision,
      coreVerdict: parsed.coreVerdict,
      argumentQualityScore: parsed.argumentQualityScore,
      decisiveFactors: parsed.decisiveFactors,
      synthesisSummary: parsed.synthesisSummary,
      dissentingOpinionsNoted: parsed.dissentingOpinionsNoted,
      deliberationRoundsCount: rounds.length,
      initialAnalysis,
      rounds,
      epistemicAudit,
      totalTokensUsed,
      estimatedCostUsd,
      metadata,
    };
  }
}
