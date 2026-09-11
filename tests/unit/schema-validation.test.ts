import { describe, it, expect } from 'vitest';
import {
  AgentStructuredOutputSchema,
  MagiSynthesisOutputSchema,
  getProviderJsonSchema,
} from '../../src/domain/schemas.js';

describe('Domain Schema Validation', () => {
  it('should validate a valid AgentStructuredOutput', () => {
    const validOutput = {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.95,
      summary: 'Feasible and verified.',
      keyArguments: ['Direct empirical benchmark demonstrates 4x speedup.'],
      criticalAssumptions: ['Workload is CPU bound.'],
      identifiedRisks: ['Learning curve for new engineers.'],
      recommendedAction: 'Proceed with rollout.',
    };

    const parsed = AgentStructuredOutputSchema.parse(validOutput);
    expect(parsed.agentId).toBe('MELCHIOR');
    expect(parsed.confidence).toBe(0.95);
  });

  it('should reject invalid stance enum', () => {
    const invalidOutput = {
      agentId: 'MELCHIOR',
      stance: 'MAYBE_LATER', // Invalid
      confidence: 0.95,
      summary: 'Test',
      keyArguments: ['Arg 1'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Test',
    };

    expect(() => AgentStructuredOutputSchema.parse(invalidOutput)).toThrow();
  });

  it('should reject confidence outside 0.0 - 1.0', () => {
    const invalidConfidence = {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 1.5, // > 1.0
      summary: 'Test',
      keyArguments: ['Arg 1'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Test',
    };

    expect(() => AgentStructuredOutputSchema.parse(invalidConfidence)).toThrow();
  });

  it('should validate valid MagiSynthesisOutput', () => {
    const validSynthesis = {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Proceed with implementation.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 8,
        CASPER: 8,
      },
      decisiveFactors: ['High empirical benchmark performance.'],
      synthesisSummary: 'Full agreement across analytical, critical, and lateral axes.',
      dissentingOpinionsNoted: [],
    };

    const parsed = MagiSynthesisOutputSchema.parse(validSynthesis);
    expect(parsed.finalDecision).toBe('CONSENSUS_REACHED');
    expect(parsed.argumentQualityScore.MELCHIOR).toBe(9);
  });

  it('should produce a valid JSON schema for LLM providers', () => {
    const jsonSchema = getProviderJsonSchema(AgentStructuredOutputSchema, 'AgentStructuredOutput');
    expect(jsonSchema).toBeDefined();
    expect(typeof jsonSchema).toBe('object');
  });
});
