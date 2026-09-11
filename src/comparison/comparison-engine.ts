import { z } from 'zod';
import { createMagiSystem } from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import {
  getThematicFixture,
  geminiBaselineSocietyResponse,
} from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import type {
  SingleModelResponse,
  ComparisonDifferential,
  MagiComparisonReport,
} from './comparison.types.js';

export const SingleBaselineSchema = z.object({
  summary: z.string().describe('Executive summary of single AI perspective'),
  pros: z.array(z.string()).describe('Main affirmative arguments'),
  cons: z.array(z.string()).describe('Main opposing arguments or risks'),
  verdict: z.string().describe('Final summary judgment'),
});

export interface ComparisonOptions {
  useMock?: boolean;
  language?: string;
}

export async function runComparison(
  question: string,
  options: ComparisonOptions = {}
): Promise<MagiComparisonReport> {
  const isMock = options.useMock ?? (!process.env.GEMINI_API_KEY);

  // 1. Generate / Retrieve Single Model Baseline Response
  let singleBaseline: SingleModelResponse;

  if (isMock) {
    const q = question.toLowerCase();
    if (q.includes('society') || q.includes('sociedade') || q.includes('magi supercomputer')) {
      singleBaseline = geminiBaselineSocietyResponse;
    } else {
      singleBaseline = {
        model: 'gemini-2.5-pro (single)',
        summary: `Standard single-model balanced assessment of "${question}".`,
        pros: ['Direct benefits and potential upside.', 'Standard industry adoption trends.'],
        cons: ['Implementation complexity.', 'Resource allocation constraints.'],
        verdict: 'Proceed with standard caution, balancing trade-offs.',
      };
    }
  } else {
    const provider = new GeminiProvider({ defaultModel: 'gemini-2.5-pro' });
    const prompt = `You are a senior strategic advisor. Provide an objective, balanced evaluation of:\n"${question}"\nOutput your pros, cons, executive summary, and final verdict according to schema.`;
    const res = await provider.generateStructured({
      systemInstruction: 'You are an objective AI advisor. Present a standard balanced perspective with pros, cons, and a verdict.',
      messages: [{ role: 'user', content: prompt }],
      schema: SingleBaselineSchema,
      schemaName: 'SingleBaselineEvaluation',
      config: { temperature: 0.2 },
    });
    singleBaseline = {
      model: 'gemini-2.5-pro',
      summary: res.data.summary,
      pros: res.data.pros,
      cons: res.data.cons,
      verdict: res.data.verdict,
    };
  }

  // 2. Run MAGI Tri-System Deliberation
  let magiProvider;
  if (isMock) {
    const mock = new MockLanguageModelProvider();
    const fixture = getThematicFixture(question);

    mock.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return fixture.synthesis;
      }
      const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
      const isRound2 = req.systemInstruction?.includes('DELIBERATION ROUND 2');
      const fAny = fixture as any;

      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        if (isRound2 && fAny.round2) return fAny.round2.MELCHIOR;
        if (isRound1 && fAny.round1) return fAny.round1.MELCHIOR;
        return (fAny.round0 || fAny.initial).MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        if (isRound2 && fAny.round2) return fAny.round2.BALTHASAR;
        if (isRound1 && fAny.round1) return fAny.round1.BALTHASAR;
        return (fAny.round0 || fAny.initial).BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        if (isRound2 && fAny.round2) return fAny.round2.CASPER;
        if (isRound1 && fAny.round1) return fAny.round1.CASPER;
        return (fAny.round0 || fAny.initial).CASPER;
      }
      return undefined;
    });
    magiProvider = mock;
  } else {
    magiProvider = new GeminiProvider({ defaultModel: 'gemini-2.5-pro' });
  }

  const magi = createMagiSystem({ provider: magiProvider });
  const magiResult = await magi.run(question, { language: options.language });

  // 3. Compute Comparative Differential
  const balthasarRisks = [
    ...magiResult.initialAnalysis.BALTHASAR.identifiedRisks,
    ...(magiResult.rounds.flatMap(r => r.agentOutputs.BALTHASAR?.identifiedRisks || [])),
  ];
  const uniqueRisks = Array.from(new Set(balthasarRisks));

  const casperAlternatives = [
    ...magiResult.initialAnalysis.CASPER.keyArguments,
    ...(magiResult.rounds.flatMap(r => r.agentOutputs.CASPER?.keyArguments || [])),
  ];
  const uniqueAlternatives = Array.from(new Set(casperAlternatives));

  const scores = magiResult.argumentQualityScore;
  const avgScore = parseFloat(
    ((scores.MELCHIOR + scores.BALTHASAR + scores.CASPER) / 3).toFixed(1)
  );

  const differential: ComparisonDifferential = {
    perspectivesCount: {
      single: 1,
      magi: 4, // Melchior + Balthasar + Casper + Core Arbiter
    },
    unmitigatedRisksCaughtByMagi: uniqueRisks,
    alternativeCompromisesIntroduced: uniqueAlternatives,
    deliberationRoundsUsed: magiResult.deliberationRoundsCount,
    epistemicAuditQualityAvg: avgScore,
  };

  return {
    question,
    singleBaseline,
    magiResult,
    differential,
  };
}
