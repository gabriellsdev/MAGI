// Domain exports
export * from './domain/types.js';
export * from './domain/schemas.js';
export * from './domain/errors.js';

// Provider exports
export * from './providers/provider.interface.js';
export * from './providers/gemini/gemini.config.js';
export * from './providers/gemini/gemini.provider.js';
export * from './providers/mock/mock.provider.js';
export * from './providers/mock/fixtures.js';
export * from './providers/cache/cached.provider.js';

// Agent exports
export * from './agents/agent.interface.js';
export * from './agents/base.agent.js';
export * from './agents/melchior.agent.js';
export * from './agents/balthasar.agent.js';
export * from './agents/casper.agent.js';

// Deliberation exports
export * from './deliberation/disagreement-detector.interface.js';
export * from './deliberation/rule-based-disagreement-detector.js';
export * from './deliberation/llm-disagreement-arbiter.js';
export * from './deliberation/hybrid-disagreement-detector.js';
export * from './deliberation/language-detector.js';
export * from './deliberation/magi-core.js';
export * from './deliberation/deliberation-engine.js';
export * from './providers/retry.utils.js';

// Evaluation exports
export * from './evaluation/evaluation.types.js';
export * from './evaluation/llm-judge.js';
export * from './evaluation/eval-runner.js';
export * from './evaluation/ablation.types.js';
export * from './evaluation/ablation-runner.js';

// Routing & Observability exports
export * from './routing/adaptive-router.js';
export * from './observability/observability-tracker.js';

// Convenience System Factory
import { MelchiorAgent } from './agents/melchior.agent.js';
import { BalthasarAgent } from './agents/balthasar.agent.js';
import { CasperAgent } from './agents/casper.agent.js';
import { MagiCore } from './deliberation/magi-core.js';
import { DeliberationEngine, type DeliberationEngineHooks } from './deliberation/deliberation-engine.js';
import type { ILanguageModelProvider } from './providers/provider.interface.js';
import type { IDisagreementDetector } from './deliberation/disagreement-detector.interface.js';
import { HybridDisagreementDetector } from './deliberation/hybrid-disagreement-detector.js';
import { GeminiProvider } from './providers/gemini/gemini.provider.js';
import { AdaptiveRouter } from './routing/adaptive-router.js';
import type { AgentId } from './domain/types.js';

export interface MagiSystemOptions {
  provider?: ILanguageModelProvider;
  agentModels?: Partial<Record<AgentId, string>>;
  agentProviders?: Partial<Record<AgentId, ILanguageModelProvider>>;
  disagreementDetector?: IDisagreementDetector;
  useArbiter?: boolean;
  arbiterModel?: string;
  hooks?: DeliberationEngineHooks;
  model?: string;
}

export function createMagiSystem(options: MagiSystemOptions = {}): DeliberationEngine {
  const provider = options.provider ?? new GeminiProvider({ defaultModel: options.model });

  const melchiorProvider = options.agentProviders?.MELCHIOR ?? provider;
  const balthasarProvider = options.agentProviders?.BALTHASAR ?? provider;
  const casperProvider = options.agentProviders?.CASPER ?? provider;

  const melchiorModel = options.agentModels?.MELCHIOR ?? options.model;
  const balthasarModel = options.agentModels?.BALTHASAR ?? options.model;
  const casperModel = options.agentModels?.CASPER ?? options.model;

  const melchior = new MelchiorAgent(melchiorProvider, melchiorModel);
  const balthasar = new BalthasarAgent(balthasarProvider, balthasarModel);
  const casper = new CasperAgent(casperProvider, casperModel);
  const magiCore = new MagiCore(provider, options.model);

  let detector: IDisagreementDetector | undefined = options.disagreementDetector;
  if (!detector && options.useArbiter) {
    detector = new HybridDisagreementDetector({
      provider,
      arbiterOptions: { model: options.arbiterModel ?? options.model },
    });
  }

  return new DeliberationEngine({
    melchior,
    balthasar,
    casper,
    magiCore,
    disagreementDetector: detector,
    hooks: options.hooks,
  });
}

export function createAdaptiveMagiSystem(options: MagiSystemOptions = {}): AdaptiveRouter {
  const provider = options.provider ?? new GeminiProvider({ defaultModel: options.model });
  const deliberationEngine = createMagiSystem(options);
  return new AdaptiveRouter({
    provider,
    deliberationEngine,
    model: options.model,
  });
}
