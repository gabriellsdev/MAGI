import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AgentId, AgentStance } from './types.js';

export const AgentIdSchema = z.enum(['MELCHIOR', 'BALTHASAR', 'CASPER']) as z.ZodType<AgentId>;

export const AgentStanceSchema = z.enum([
  'APPROVE',
  'REJECT',
  'CONDITIONAL',
  'PIVOT',
  'INCONCLUSIVE',
]) as z.ZodType<AgentStance>;

export const EpistemicTypeSchema = z.enum([
  'FACT',
  'INFERENCE',
  'ASSUMPTION',
  'HEURISTIC',
  'SPECULATION',
]);

export const EpistemicClaimSchema = z.object({
  statement: z.string().describe('The core assertion or argument statement'),
  type: EpistemicTypeSchema.describe('Epistemic classification: FACT, INFERENCE, ASSUMPTION, HEURISTIC, or SPECULATION'),
  confidence: z.number().min(0).max(1).describe('Confidence level in this specific claim between 0.0 and 1.0'),
  requiresEvidence: z.boolean().describe('True if this claim relies on unverified empirical conditions'),
});

export const EpistemicAuditSchema = z.object({
  factCount: z.number().describe('Number of empirically grounded facts cited across proposals'),
  unverifiedAssumptionsCount: z.number().describe('Number of unverified assumptions flagged'),
  evidenceConfidenceScore: z.number().min(1).max(10).describe('Overall evidentiary rigor score (1-10)'),
  strongestEvidenceAgent: AgentIdSchema.describe('The agent whose argumentation demonstrated highest empirical rigor'),
});

export const AgentCritiqueSchema = z.object({
  targetAgent: AgentIdSchema,
  pointsOfAgreement: z.array(z.string()).describe('Specific points from the peer that you agree with'),
  pointsOfDisagreement: z.array(z.string()).describe('Specific premises or conclusions that you refute'),
  rebuttal: z.string().describe('Detailed logical rebuttal or counter-evidence'),
});

export const AgentStructuredOutputSchema = z.object({
  agentId: AgentIdSchema,
  stance: AgentStanceSchema.describe('Your final categorical stance on the subject'),
  confidence: z.number().min(0).max(1).describe('Confidence level in this stance between 0.0 and 1.0'),
  summary: z.string().describe('Concise executive summary of your reasoning'),
  keyArguments: z.array(z.string()).min(1).describe('List of foundational arguments supporting your stance'),
  criticalAssumptions: z.array(z.string()).describe('Underlying assumptions your reasoning depends on'),
  identifiedRisks: z.array(z.string()).describe('Potential failure modes, risks, or edge cases'),
  recommendedAction: z.string().describe('Concrete recommendation or path forward'),
  claims: z.array(EpistemicClaimSchema).optional().describe('Structured claims categorized by epistemic typology'),
  critiquesOfPeers: z.array(AgentCritiqueSchema).optional().describe('Critiques directed at peers during deliberation rounds'),
});

export const MagiSynthesisOutputSchema = z.object({
  finalDecision: z.enum([
    'CONSENSUS_REACHED',
    'CONDITIONAL_PASS',
    'DEADLOCK_RESOLVED',
    'REJECTED',
  ]).describe('Categorical judgment determined by MAGI Core'),
  coreVerdict: z.string().describe('One-sentence authoritative verdict'),
  argumentQualityScore: z.object({
    MELCHIOR: z.number().min(1).max(10).describe('Analytical soundness score (1-10)'),
    BALTHASAR: z.number().min(1).max(10).describe('Critical rigor score (1-10)'),
    CASPER: z.number().min(1).max(10).describe('Pragmatic viability score (1-10)'),
  }),
  decisiveFactors: z.array(z.string()).min(1).describe('Key evidence or arguments that decided the outcome'),
  synthesisSummary: z.string().describe('Comprehensive synthesis balancing logic, risks, and alternatives'),
  dissentingOpinionsNoted: z.array(z.string()).describe('Key minority concerns preserved in the final record'),
  epistemicAudit: EpistemicAuditSchema.optional().describe('Audit evaluating the strength of facts vs unverified assumptions'),
});

/**
 * Helper to convert Zod schema to an OpenAPI / JSON Schema definition
 * suitable for LLM providers (including Gemini's responseSchema).
 */
export function getProviderJsonSchema(schema: z.ZodTypeAny, schemaName: string): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, {
    name: schemaName,
    $refStrategy: 'none',
  });
  // If wrapped in definitions, return the inner schema
  if (jsonSchema.definitions && jsonSchema.definitions[schemaName]) {
    return jsonSchema.definitions[schemaName] as Record<string, unknown>;
  }
  return jsonSchema as Record<string, unknown>;
}
