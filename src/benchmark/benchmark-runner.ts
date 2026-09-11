import 'dotenv/config';
import { createMagiSystem } from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import {
  getThematicFixture,
  instantConsensusFixtures,
  persistentDeadlockFixtures,
} from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { STANDARD_BENCHMARK_SUITE } from './benchmark.suites.js';
import type {
  BenchmarkDilemma,
  BenchmarkScorecard,
  BenchmarkSuiteSummary,
} from './benchmark.types.js';

export interface BenchmarkRunnerOptions {
  dilemmas?: BenchmarkDilemma[];
  useMock?: boolean;
  verbose?: boolean;
}

export async function runBenchmarkSuite(
  options: BenchmarkRunnerOptions = {}
): Promise<BenchmarkSuiteSummary> {
  const dilemmas = options.dilemmas || STANDARD_BENCHMARK_SUITE;
  const isMock = options.useMock ?? (!process.env.GEMINI_API_KEY);
  const scorecards: BenchmarkScorecard[] = [];
  const startSuiteTime = Date.now();

  for (const dilemma of dilemmas) {
    let provider;
    if (isMock) {
      const mock = new MockLanguageModelProvider();
      const fixture = getThematicFixture(dilemma.question);

      mock.onGenerate(req => {
        if (req.schemaName === 'MagiSynthesisOutput') {
          return fixture.synthesis;
        }

        const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
        const isRound2 = req.systemInstruction?.includes('DELIBERATION ROUND 2');

        // Check if fixture has round2 (e.g. persistent deadlock)
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
      provider = mock;
    } else {
      provider = new GeminiProvider({ defaultModel: 'gemini-2.5-pro' });
    }

    const magi = createMagiSystem({ provider });
    const dilemmaStart = Date.now();
    const result = await magi.run(dilemma.question);
    const durationMs = Date.now() - dilemmaStart;

    scorecards.push({
      dilemmaId: dilemma.id,
      title: dilemma.title,
      category: dilemma.category,
      finalDecision: result.finalDecision,
      roundsCount: result.deliberationRoundsCount,
      qualityScores: result.argumentQualityScore,
      durationMs,
      coreVerdict: result.coreVerdict,
    });
  }

  const totalDilemmas = scorecards.length;
  const consensusCount = scorecards.filter(
    s => s.finalDecision === 'CONSENSUS_REACHED' || s.finalDecision === 'CONDITIONAL_PASS'
  ).length;

  const totalRounds = scorecards.reduce((acc, s) => acc + s.roundsCount, 0);
  const totalDuration = Date.now() - startSuiteTime;

  return {
    timestamp: new Date().toISOString(),
    totalDilemmas,
    consensusRate: totalDilemmas > 0 ? consensusCount / totalDilemmas : 0,
    averageRounds: totalDilemmas > 0 ? parseFloat((totalRounds / totalDilemmas).toFixed(2)) : 0,
    averageDurationMs: totalDilemmas > 0 ? Math.round(totalDuration / totalDilemmas) : 0,
    scorecards,
  };
}

// CLI Execution if invoked directly
if (process.argv[1]?.endsWith('benchmark-runner.ts') || process.argv[1]?.endsWith('benchmark-runner.js')) {
  (async () => {
    console.log('\n' + '='.repeat(75));
    console.log('  \x1b[1m\x1b[35mMAGI SUPERCOMPUTER // EVALUATION & BENCHMARK SUITE\x1b[0m');
    console.log('='.repeat(75) + '\n');

    const summary = await runBenchmarkSuite();

    console.log(`\x1b[1mTOTAL DILEMMAS EVALUATED:\x1b[0m ${summary.totalDilemmas}`);
    console.log(`\x1b[1mCONSENSUS RESOLUTION RATE:\x1b[0m ${(summary.consensusRate * 100).toFixed(0)}%`);
    console.log(`\x1b[1mAVG DELIBERATION ROUNDS:\x1b[0m  ${summary.averageRounds}`);
    console.log(`\x1b[1mAVG EXECUTION TIME:\x1b[0m       ${summary.averageDurationMs} ms\n`);

    console.log('-'.repeat(75));
    console.log('  DILEMMA SCORECARDS');
    console.log('-'.repeat(75));

    summary.scorecards.forEach(sc => {
      console.log(`\n\x1b[36m[${sc.category}]\x1b[0m \x1b[1m${sc.title}\x1b[0m`);
      console.log(`  Decision: \x1b[32m${sc.finalDecision}\x1b[0m | Rounds: ${sc.roundsCount} | Time: ${sc.durationMs}ms`);
      console.log(`  Scores: Melchior=${sc.qualityScores.MELCHIOR}/10 | Balthasar=${sc.qualityScores.BALTHASAR}/10 | Casper=${sc.qualityScores.CASPER}/10`);
      console.log(`  Verdict: ${sc.coreVerdict}`);
    });

    console.log('\n' + '='.repeat(75) + '\n');
  })().catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}
