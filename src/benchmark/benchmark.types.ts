import type { MagiSynthesisResult } from '../domain/types.js';

export type BenchmarkCategory =
  | 'SOCIETAL_GOVERNANCE'
  | 'SYSTEM_ARCHITECTURE'
  | 'AUTONOMOUS_RISK'
  | 'ETHICAL_DILEMMA';

export interface BenchmarkDilemma {
  id: string;
  title: string;
  category: BenchmarkCategory;
  question: string;
  description: string;
  expectedConflict: string;
}

export interface BenchmarkScorecard {
  dilemmaId: string;
  title: string;
  category: BenchmarkCategory;
  finalDecision: string;
  roundsCount: number;
  qualityScores: {
    MELCHIOR: number;
    BALTHASAR: number;
    CASPER: number;
  };
  durationMs: number;
  coreVerdict: string;
}

export interface BenchmarkSuiteSummary {
  timestamp: string;
  totalDilemmas: number;
  consensusRate: number; // 0.0 to 1.0
  averageRounds: number;
  averageDurationMs: number;
  scorecards: BenchmarkScorecard[];
}
