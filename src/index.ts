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
export * from './deliberation/language-detector.js';
export * from './deliberation/magi-core.js';
export * from './deliberation/deliberation-engine.js';
export * from './providers/retry.utils.js';

// Evaluation exports
export * from './evaluation/evaluation.types.js';
export * from './evaluation/llm-judge.js';
export * from './evaluation/eval-runner.js';

// Convenience System Factory
import { MelchiorAgent } from './agents/melchior.agent.js';
import { BalthasarAgent } from './agents/balthasar.agent.js';
import { CasperAgent } from './agents/casper.agent.js';
import { MagiCore } from './deliberation/magi-core.js';
import { DeliberationEngine, type DeliberationEngineHooks } from './deliberation/deliberation-engine.js';
import type { ILanguageModelProvider } from './providers/provider.interface.js';
import type { IDisagreementDetector } from './deliberation/disagreement-detector.interface.js';
import { GeminiProvider } from './providers/gemini/gemini.provider.js';

export interface MagiSystemOptions {
  provider?: ILanguageModelProvider;
  disagreementDetector?: IDisagreementDetector;
  hooks?: DeliberationEngineHooks;
  model?: string;
}

export function createMagiSystem(options: MagiSystemOptions = {}): DeliberationEngine {
  const provider = options.provider ?? new GeminiProvider({ defaultModel: options.model });
  const melchior = new MelchiorAgent(provider, options.model);
  const balthasar = new BalthasarAgent(provider, options.model);
  const casper = new CasperAgent(provider, options.model);
  const magiCore = new MagiCore(provider, options.model);

  return new DeliberationEngine({
    melchior,
    balthasar,
    casper,
    magiCore,
    disagreementDetector: options.disagreementDetector,
    hooks: options.hooks,
  });
}
