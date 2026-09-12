export type AgentId = 'MELCHIOR' | 'BALTHASAR' | 'CASPER';

export type AgentStance = 
  | 'APPROVE'           // Agrees with proposal/positive answer
  | 'REJECT'            // Disagrees with proposal/negative answer
  | 'CONDITIONAL'       // Valid only under strict specific constraints
  | 'PIVOT'             // Suggests fundamentally reframing or pursuing an alternative
  | 'INCONCLUSIVE';     // Insufficient evidence or paradoxical

import type { TokenUsage } from '../providers/provider.interface.js';

export type EpistemicType = 
  | 'FACT'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'HEURISTIC'
  | 'SPECULATION';

export interface EpistemicClaim {
  statement: string;
  type: EpistemicType;
  confidence: number;
  requiresEvidence: boolean;
}

export interface EpistemicAudit {
  factCount: number;
  unverifiedAssumptionsCount: number;
  evidenceConfidenceScore: number;
  strongestEvidenceAgent: AgentId;
}

export interface AgentCritique {
  targetAgent: AgentId;
  pointsOfAgreement: string[];
  pointsOfDisagreement: string[];
  rebuttal: string;
}

export interface AgentStructuredOutput {
  agentId: AgentId;
  stance: AgentStance;
  confidence: number; // Normalized float 0.0 to 1.0
  summary: string;
  keyArguments: string[];
  criticalAssumptions: string[];
  identifiedRisks: string[];
  recommendedAction: string;
  claims?: EpistemicClaim[];
  critiquesOfPeers?: AgentCritique[];
  language?: string;
  tokensUsed?: TokenUsage;
}

export interface DisagreementMetrics {
  stanceDivergence: boolean;
  maxConfidenceDelta: number;
  confidences: Record<AgentId, number>;
}

export interface DisagreementReport {
  hasSignificantDisagreement: boolean;
  reason: string;
  divergentAgents: AgentId[];
  metrics: DisagreementMetrics;
  substantiveTopics?: string[];
  isFilteredByArbiter?: boolean;
}

export interface DeliberationRound {
  roundNumber: 1 | 2;
  agentOutputs: Record<AgentId, AgentStructuredOutput>;
  disagreementReport: DisagreementReport;
}

export type MagiDecision = 
  | 'CONSENSUS_REACHED'
  | 'CONDITIONAL_PASS'
  | 'DEADLOCK_RESOLVED'
  | 'REJECTED';

export interface MagiExecutionMetadata {
  timestamp: string;
  durationMs: number;
  model: string;
  provider: string;
  language: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokensUsed?: number;
  estimatedCostUsd?: number;
}

export interface MagiSynthesisResult {
  question: string;
  finalDecision: MagiDecision;
  coreVerdict: string;
  argumentQualityScore: Record<AgentId, number>; // 1 to 10
  decisiveFactors: string[];
  synthesisSummary: string;
  dissentingOpinionsNoted: string[];
  deliberationRoundsCount: number;
  initialAnalysis: Record<AgentId, AgentStructuredOutput>;
  rounds: DeliberationRound[];
  epistemicAudit?: EpistemicAudit;
  totalTokensUsed?: number;
  estimatedCostUsd?: number;
  metadata?: MagiExecutionMetadata;
}
