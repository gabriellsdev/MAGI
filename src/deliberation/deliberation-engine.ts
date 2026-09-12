import type { IAgent } from '../agents/agent.interface.js';
import type { IDisagreementDetector } from './disagreement-detector.interface.js';
import { RuleBasedDisagreementDetector } from './rule-based-disagreement-detector.js';
import { MagiCore } from './magi-core.js';
import { detectOrResolveLanguage } from './language-detector.js';
import type {
  AgentId,
  AgentStructuredOutput,
  DeliberationRound,
  DisagreementReport,
  MagiSynthesisResult,
} from '../domain/types.js';

export interface DeliberationEngineHooks {
  onRoundStart?: (roundNumber: number, title: string) => void;
  onAgentStart?: (roundNumber: number, agentId: AgentId) => void;
  onAgentCompleted?: (roundNumber: number, output: AgentStructuredOutput) => void;
  onDisagreementDetected?: (roundNumber: number, report: DisagreementReport) => void;
  onConsensusReached?: (roundNumber: number, report: DisagreementReport) => void;
  onCoreSynthesisStart?: () => void;
}

export interface DeliberationEngineConfig {
  melchior: IAgent;
  balthasar: IAgent;
  casper: IAgent;
  magiCore: MagiCore;
  disagreementDetector?: IDisagreementDetector;
  hooks?: DeliberationEngineHooks;
  maxDeliberationRounds?: number; // default: 2 (per requirements)
}

export interface DeliberationRunOptions {
  language?: string;
}

export class DeliberationEngine {
  private melchior: IAgent;
  private balthasar: IAgent;
  private casper: IAgent;
  private magiCore: MagiCore;
  private detector: IDisagreementDetector;
  private hooks: DeliberationEngineHooks;
  private readonly maxRounds: number;

  constructor(config: DeliberationEngineConfig) {
    this.melchior = config.melchior;
    this.balthasar = config.balthasar;
    this.casper = config.casper;
    this.magiCore = config.magiCore;
    this.detector = config.disagreementDetector ?? new RuleBasedDisagreementDetector();
    this.hooks = config.hooks ?? {};
    this.maxRounds = config.maxDeliberationRounds ?? 2;
  }

  async run(question: string, options: DeliberationRunOptions = {}): Promise<MagiSynthesisResult> {
    const startTime = Date.now();
    const resolvedLanguage = detectOrResolveLanguage(question, options.language);
    const agentOpts = { language: resolvedLanguage };
    const rounds: DeliberationRound[] = [];

    // ==========================================
    // STAGE 1: ROUND 0 — INDEPENDENT ANALYSIS
    // ==========================================
    this.hooks.onRoundStart?.(0, `Initial Independent Analysis [${resolvedLanguage}]`);
    this.hooks.onAgentStart?.(0, 'MELCHIOR');
    this.hooks.onAgentStart?.(0, 'BALTHASAR');
    this.hooks.onAgentStart?.(0, 'CASPER');

    const [melchior0, balthasar0, casper0] = await Promise.all([
      this.melchior.analyze(question, agentOpts).then(out => {
        this.hooks.onAgentCompleted?.(0, out);
        return out;
      }),
      this.balthasar.analyze(question, agentOpts).then(out => {
        this.hooks.onAgentCompleted?.(0, out);
        return out;
      }),
      this.casper.analyze(question, agentOpts).then(out => {
        this.hooks.onAgentCompleted?.(0, out);
        return out;
      }),
    ]);

    const initialAnalysis: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: melchior0,
      BALTHASAR: balthasar0,
      CASPER: casper0,
    };

    // Evaluate disagreement on Round 0
    let disagreementReport = await this.detector.evaluate(initialAnalysis, question);

    if (!disagreementReport.hasSignificantDisagreement) {
      this.hooks.onConsensusReached?.(0, disagreementReport);
      return this.executeSynthesis(question, initialAnalysis, rounds, resolvedLanguage, startTime);
    }

    this.hooks.onDisagreementDetected?.(0, disagreementReport);

    // ==========================================
    // STAGE 2: DELIBERATION ROUND 1
    // ==========================================
    this.hooks.onRoundStart?.(1, `Deliberation Round 1: Peer Critique & Defense [${resolvedLanguage}]`);
    this.hooks.onAgentStart?.(1, 'MELCHIOR');
    this.hooks.onAgentStart?.(1, 'BALTHASAR');
    this.hooks.onAgentStart?.(1, 'CASPER');

    const [melchior1, balthasar1, casper1] = await Promise.all([
      this.melchior.deliberate(question, 1, initialAnalysis, agentOpts).then(out => {
        this.hooks.onAgentCompleted?.(1, out);
        return out;
      }),
      this.balthasar.deliberate(question, 1, initialAnalysis, agentOpts).then(out => {
        this.hooks.onAgentCompleted?.(1, out);
        return out;
      }),
      this.casper.deliberate(question, 1, initialAnalysis, agentOpts).then(out => {
        this.hooks.onAgentCompleted?.(1, out);
        return out;
      }),
    ]);

    const round1Outputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: melchior1,
      BALTHASAR: balthasar1,
      CASPER: casper1,
    };

    disagreementReport = await this.detector.evaluate(round1Outputs, question);
    rounds.push({
      roundNumber: 1,
      agentOutputs: round1Outputs,
      disagreementReport,
    });

    if (!disagreementReport.hasSignificantDisagreement) {
      this.hooks.onConsensusReached?.(1, disagreementReport);
      return this.executeSynthesis(question, initialAnalysis, rounds, resolvedLanguage, startTime);
    }

    this.hooks.onDisagreementDetected?.(1, disagreementReport);

    // ==========================================
    // STAGE 3: DELIBERATION ROUND 2 (MAX CAP)
    // ==========================================
    const elapsedBeforeRound2 = Date.now() - startTime;
    // On Vercel, functions have a 60s hard timeout. If Round 0 and Round 1 took > 38s,
    // proceed directly to synthesis so that the connection is never killed mid-round.
    const isServerlessTimeoutRisk = (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) && elapsedBeforeRound2 > 38000;

    if (this.maxRounds >= 2 && !isServerlessTimeoutRisk) {
      this.hooks.onRoundStart?.(2, `Deliberation Round 2: Final Rebuttal & Stance Lock [${resolvedLanguage}]`);
      this.hooks.onAgentStart?.(2, 'MELCHIOR');
      this.hooks.onAgentStart?.(2, 'BALTHASAR');
      this.hooks.onAgentStart?.(2, 'CASPER');

      const [melchior2, balthasar2, casper2] = await Promise.all([
        this.melchior.deliberate(question, 2, round1Outputs, agentOpts).then(out => {
          this.hooks.onAgentCompleted?.(2, out);
          return out;
        }),
        this.balthasar.deliberate(question, 2, round1Outputs, agentOpts).then(out => {
          this.hooks.onAgentCompleted?.(2, out);
          return out;
        }),
        this.casper.deliberate(question, 2, round1Outputs, agentOpts).then(out => {
          this.hooks.onAgentCompleted?.(2, out);
          return out;
        }),
      ]);

      const round2Outputs: Record<AgentId, AgentStructuredOutput> = {
        MELCHIOR: melchior2,
        BALTHASAR: balthasar2,
        CASPER: casper2,
      };

      disagreementReport = await this.detector.evaluate(round2Outputs, question);
      rounds.push({
        roundNumber: 2,
        agentOutputs: round2Outputs,
        disagreementReport,
      });

      if (!disagreementReport.hasSignificantDisagreement) {
        this.hooks.onConsensusReached?.(2, disagreementReport);
      } else {
        this.hooks.onDisagreementDetected?.(2, disagreementReport);
      }
    }

    // Hard termination: proceed to MAGI Core synthesis regardless of consensus status
    return this.executeSynthesis(question, initialAnalysis, rounds, resolvedLanguage, startTime);
  }

  private async executeSynthesis(
    question: string,
    initialAnalysis: Record<AgentId, AgentStructuredOutput>,
    rounds: DeliberationRound[],
    language: string,
    startTime: number
  ): Promise<MagiSynthesisResult> {
    this.hooks.onCoreSynthesisStart?.();
    return this.magiCore.synthesize(question, initialAnalysis, rounds, {
      language,
      startTime,
    });
  }
}
