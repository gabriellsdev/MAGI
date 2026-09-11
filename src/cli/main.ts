import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from 'node:fs/promises';
import { createMagiSystem } from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import type { AgentStructuredOutput, DisagreementReport, MagiSynthesisResult } from '../domain/types.js';

function formatStance(stance: string): string {
  switch (stance) {
    case 'APPROVE':
      return '\x1b[32m[APPROVE]\x1b[0m';
    case 'REJECT':
      return '\x1b[31m[REJECT]\x1b[0m';
    case 'CONDITIONAL':
      return '\x1b[33m[CONDITIONAL]\x1b[0m';
    case 'PIVOT':
      return '\x1b[36m[PIVOT]\x1b[0m';
    default:
      return `[${stance}]`;
  }
}

function printHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  \x1b[1m\x1b[35m${title.toUpperCase()}\x1b[0m`);
  console.log('='.repeat(70));
}

function printAgentOutput(round: number, out: AgentStructuredOutput) {
  const color = out.agentId === 'MELCHIOR' ? '\x1b[34m' : out.agentId === 'BALTHASAR' ? '\x1b[33m' : '\x1b[32m';
  console.log(`\n${color}▶ ${out.agentId}-V1\x1b[0m ${formatStance(out.stance)} (Confidence: ${(out.confidence * 100).toFixed(0)}%)`);
  console.log(`  Summary: ${out.summary}`);
  console.log(`  Arguments:`);
  out.keyArguments.forEach(arg => console.log(`    • ${arg}`));
  if (out.identifiedRisks.length > 0) {
    console.log(`  Risks:`);
    out.identifiedRisks.forEach(r => console.log(`    ⚠ ${r}`));
  }
  if (out.critiquesOfPeers?.length) {
    console.log(`  Critiques:`);
    out.critiquesOfPeers.forEach(c => console.log(`    ↳ vs ${c.targetAgent}: ${c.rebuttal}`));
  }
}

function printHelp() {
  console.log(`
MAGI Deliberation Supercomputer System — V1.1

Usage:
  npx tsx src/cli/main.ts [options] ["Your question here"]

Options:
  --mock               Run hermetic offline mock mode with fixture responses
  --json               Output raw structured JSON to stdout
  --output <file.json> Write complete synthesis JSON result to specified file
  --lang <code>        Force specific language (e.g. pt, es, en, ja, de, fr)
  --api-key <key>      Explicit Gemini API key
  --help, -h           Show this help message

Examples:
  npx tsx src/cli/main.ts "Should we migrate to microservices?"
  npx tsx src/cli/main.ts --lang pt "Devemos reescrever a arquitetura em Rust?"
  npx tsx src/cli/main.ts --mock --json
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const isMock = args.includes('--mock');
  const isJsonOnly = args.includes('--json');

  // Extract --output <path>
  let outputPath: string | undefined;
  const outputIdx = args.indexOf('--output');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputPath = args[outputIdx + 1];
  }

  // Extract --lang <code>
  let languageOverride: string | undefined;
  const langIdx = args.indexOf('--lang');
  if (langIdx !== -1 && args[langIdx + 1]) {
    languageOverride = args[langIdx + 1];
  }

  // Extract --api-key <key>
  let apiKeyOverride: string | undefined;
  const apiKeyIdx = args.indexOf('--api-key');
  if (apiKeyIdx !== -1 && args[apiKeyIdx + 1]) {
    apiKeyOverride = args[apiKeyIdx + 1];
  }

  // Filter out flag tokens
  const nonFlagTokens: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === '--mock' || token === '--json' || token === '-h' || token === '--help') {
      continue;
    }
    if (token === '--output' || token === '--lang' || token === '--api-key') {
      i++; // Skip argument value
      continue;
    }
    nonFlagTokens.push(token);
  }

  let question = nonFlagTokens.join(' ').trim();

  // Dynamic user query: If no question was passed via arguments and not running --json, prompt interactively
  if (!question) {
    if (isJsonOnly) {
      console.error(JSON.stringify({ error: 'No question provided. Pass question as argument when using --json.' }));
      process.exit(1);
    }

    console.log('\n\x1b[1m\x1b[36m' + `
  ███╗   ███╗ █████╗  ██████╗ ██╗
  ████╗ ████║██╔══██╗██╔════╝ ██║
  ██╔████╔██║███████║██║  ███╗██║
  ██║╚██╔╝██║██╔══██║██║   ██║██║
  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
  SUPERCOMPUTER DELIBERATION SYSTEM — V1.1
    ` + '\x1b[0m');

    const rl = readline.createInterface({ input, output });
    try {
      question = await rl.question('\x1b[1m\x1b[33mMAGI > Enter your question for deliberation:\x1b[0m ');
      question = question.trim();
    } finally {
      rl.close();
    }

    if (!question) {
      console.log('\x1b[31mNo question provided. Exiting.\x1b[0m');
      return;
    }
  }

  // Provider resolution
  let provider;
  if (isMock) {
    const mock = new MockLanguageModelProvider();
    mock.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }
      const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.MELCHIOR : resolvedInRoundOneFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.BALTHASAR : resolvedInRoundOneFixtures.round0.BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.CASPER : resolvedInRoundOneFixtures.round0.CASPER;
      }
      return undefined;
    });
    provider = mock;
  } else {
    const key = apiKeyOverride || process.env.GEMINI_API_KEY;
    if (!key) {
      console.error(`\n\x1b[31m[ERROR] GEMINI_API_KEY is not configured.\x1b[0m`);
      console.error(`Please set your API key in the environment or a .env file:`);
      console.error(`  1. Copy .env.example to .env: copy .env.example .env`);
      console.error(`  2. Add your Gemini API key from https://aistudio.google.com/`);
      console.error(`  Or run with: --api-key YOUR_KEY`);
      console.error(`  Or run hermetic mock mode: npx tsx src/cli/main.ts --mock\n`);
      process.exit(1);
    }
    provider = new GeminiProvider({ apiKey: key, defaultModel: 'gemini-2.5-pro' });
  }

  if (!isJsonOnly) {
    if (nonFlagTokens.length > 0) {
      console.log('\n\x1b[1m\x1b[36m' + `
  ███╗   ███╗ █████╗  ██████╗ ██╗
  ████╗ ████║██╔══██╗██╔════╝ ██║
  ██╔████╔██║███████║██║  ███╗██║
  ██║╚██╔╝██║██╔══██║██║   ██║██║
  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
  SUPERCOMPUTER DELIBERATION SYSTEM — V1.1
      ` + '\x1b[0m');
    }
    console.log(`Query: "${question}"`);
    console.log(`Provider: ${isMock ? 'Hermetic Mock Provider (Fixtures)' : 'Google Gemini 2.5 Pro'}`);
  }

  const hooks = isJsonOnly ? {} : {
    onRoundStart: (round: number, title: string) => {
      printHeader(`Stage: ${title}`);
    },
    onAgentCompleted: (round: number, out: AgentStructuredOutput) => {
      printAgentOutput(round, out);
    },
    onDisagreementDetected: (round: number, report: DisagreementReport) => {
      console.log(`\n\x1b[33m⚡ Disagreement Flagged:\x1b[0m ${report.reason}`);
      console.log(`  Max confidence spread: ${report.metrics.maxConfidenceDelta}`);
    },
    onConsensusReached: (round: number, report: DisagreementReport) => {
      console.log(`\n\x1b[32m✔ Consensus Achieved:\x1b[0m ${report.reason}`);
    },
    onCoreSynthesisStart: () => {
      printHeader('MAGI Core: Final Deliberation & Synthesis');
    },
  };

  const magi = createMagiSystem({
    provider,
    hooks,
    model: 'gemini-2.5-pro',
  });

  const result: MagiSynthesisResult = await magi.run(question, { language: languageOverride });

  if (isJsonOnly) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHeader('MAGI CORE VERDICT');
    console.log(`\n\x1b[1mDecision:\x1b[0m ${result.finalDecision}`);
    console.log(`\x1b[1mVerdict:\x1b[0m \x1b[32m${result.coreVerdict}\x1b[0m`);
    console.log(`\x1b[1mDeliberation Rounds Elapsed:\x1b[0m ${result.deliberationRoundsCount}`);
    if (result.metadata) {
      console.log(`\x1b[1mLanguage:\x1b[0m ${result.metadata.language}`);
      console.log(`\x1b[1mExecution Duration:\x1b[0m ${result.metadata.durationMs} ms`);
    }

    console.log('\n\x1b[1mArgument Quality Scores (1-10):\x1b[0m');
    console.log(`  MELCHIOR-1:  ${result.argumentQualityScore.MELCHIOR}/10`);
    console.log(`  BALTHASAR-2: ${result.argumentQualityScore.BALTHASAR}/10`);
    console.log(`  CASPER-3:    ${result.argumentQualityScore.CASPER}/10`);

    console.log('\n\x1b[1mDecisive Factors:\x1b[0m');
    result.decisiveFactors.forEach(factor => console.log(`  • ${factor}`));

    console.log('\n\x1b[1mSynthesis Summary:\x1b[0m');
    console.log(`  ${result.synthesisSummary}`);

    if (result.dissentingOpinionsNoted.length > 0) {
      console.log('\n\x1b[1mDissenting Records Preserved:\x1b[0m');
      result.dissentingOpinionsNoted.forEach(note => console.log(`  ⚠ ${note}`));
    }
    console.log('\n' + '='.repeat(70) + '\n');
  }

  // Save to file if --output was specified
  if (outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    if (!isJsonOnly) {
      console.log(`\x1b[32m[SUCCESS] Full deliberation JSON written to:\x1b[0m ${outputPath}\n`);
    }
  }
}

main().catch(err => {
  console.error('\n\x1b[31mFATAL ERROR in MAGI System:\x1b[0m', err);
  process.exit(1);
});
