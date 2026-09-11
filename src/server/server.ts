import 'dotenv/config';
import * as http from 'node:http';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMagiSystem } from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import { getThematicFixture } from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { runComparison } from '../comparison/comparison-engine.js';
import { runBenchmarkSuite } from '../benchmark/benchmark-runner.js';
import { persistenceService } from '../db/supabase.service.js';
import { InMemoryRateLimiter } from './rate-limiter.js';
import { readJsonBody, validateDeliberationInput } from './validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Rate limiter: 15 deliberation/comparison requests per minute per IP
export const deliberationLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  message: 'MAGI Deliberation rate limit exceeded. Please wait 60 seconds before initiating another deliberation.',
});

// Rate limiter: 60 read/benchmark requests per minute per IP
export const generalLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  message: 'Request rate limit reached. Please slow down.',
});

function createMockProviderForQuestion(question: string, options?: { delayMs?: number }) {
  const mock = new MockLanguageModelProvider();
  const fixture = getThematicFixture(question);
  const delay = options?.delayMs || 0;

  mock.onGenerate(async req => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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

  return mock;
}

function sanitizeErrorMessage(err: any): string {
  const msg = err?.message || 'Internal error';
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource exhausted')) {
    return 'Google Gemini API quota exceeded or rate limited. Try again in a few moments or switch to Mock mode.';
  }
  if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
    return 'Gemini API authentication failed. Verify GEMINI_API_KEY in environment settings.';
  }
  if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('timeout')) {
    return 'Deliberation request timed out waiting for AI provider response.';
  }
  return msg;
}

export function createMagiRequestHandler() {
  return async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    // Enable CORS for API clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Fast-Mock');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    try {
      // -------------------------------------------------------------
      // API: GET /api/health
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/health') {
        const payload = {
          status: 'ok',
          version: '2.2.0',
          geminiConfigured: !!process.env.GEMINI_API_KEY,
          supabaseConfigured: persistenceService.isConfigured(),
          defaultModel: process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview',
          timestamp: new Date().toISOString(),
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/history (Recent Deliberations from Supabase)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/history') {
        if (!generalLimiter.apply(req, res)) return;

        const limit = Math.min(Number(parsedUrl.searchParams.get('limit') || '10'), 50);
        const history = await persistenceService.getRecentDeliberations(limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ history, configured: persistenceService.isConfigured() }));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/benchmark
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/benchmark') {
        if (!generalLimiter.apply(req, res)) return;

        const isMock = parsedUrl.searchParams.get('mock') === 'true' || (!process.env.GEMINI_API_KEY && parsedUrl.searchParams.get('mock') !== 'false');
        const summary = await runBenchmarkSuite({ useMock: isMock });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/compare (Single Gemini vs MAGI Triad)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/compare') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        try {
          const isMock = val.data.mock === true || (!process.env.GEMINI_API_KEY && val.data.mock !== false);
          const report = await runComparison(val.data.question, { useMock: isMock, language: val.data.language });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(report));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/deliberate/stream (Server-Sent Events)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/deliberate/stream') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        const isMock = val.data.mock === true || (!process.env.GEMINI_API_KEY && val.data.mock !== false);
        const language = val.data.language || undefined;
        const model = val.data.model || process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview';

        // Set up SSE headers with anti-buffering headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        // Send immediate SSE keep-alive comment to keep serverless/reverse proxies open
        res.write(': keep-alive\n\n');
        const pingInterval = setInterval(() => {
          try {
            res.write(': ping\n\n');
          } catch {
            clearInterval(pingInterval);
          }
        }, 5000);

        req.on('close', () => {
          clearInterval(pingInterval);
        });

        const sendEvent = (event: string, payload: any) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        const isFast = process.env.NODE_ENV === 'test' || req.headers['x-fast-mock'] === 'true' || parsedUrl.searchParams.get('fast') === 'true';
        const delayMs = isFast ? 0 : 750;

        try {
          const provider = isMock
            ? createMockProviderForQuestion(val.data.question, { delayMs })
            : new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, defaultModel: model });

          const magi = createMagiSystem({
            provider,
            model,
            hooks: {
              onRoundStart: (roundNumber, title) => {
                sendEvent('round_start', { roundNumber, title });
              },
              onAgentStart: (roundNumber, agentId) => {
                sendEvent('agent_start', { roundNumber, agentId });
              },
              onAgentCompleted: (roundNumber, output) => {
                sendEvent('agent_complete', { roundNumber, output });
              },
              onDisagreementDetected: (roundNumber, report) => {
                sendEvent('disagreement', { roundNumber, report });
              },
              onConsensusReached: (roundNumber, report) => {
                sendEvent('consensus', { roundNumber, report });
              },
              onCoreSynthesisStart: () => {
                sendEvent('synthesis_start', {});
              },
            },
          });

          const result = await magi.run(val.data.question, { language });
          sendEvent('complete', { result });

          // Persist deliberation trajectory and agent analyses to Supabase
          persistenceService.saveDeliberation(result).catch(err => {
            console.warn('[MAGI PERSISTENCE] Background save error:', err);
          });
        } catch (err: any) {
          sendEvent('error', { error: sanitizeErrorMessage(err) });
        } finally {
          clearInterval(pingInterval);
          res.end();
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/deliberate (Standard JSON)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/deliberate') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        const isMock = val.data.mock === true || (!process.env.GEMINI_API_KEY && val.data.mock !== false);
        const language = val.data.language || undefined;
        const model = val.data.model || process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview';

        try {
          const provider = isMock
            ? createMockProviderForQuestion(val.data.question)
            : new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, defaultModel: model });

          const magi = createMagiSystem({
            provider,
            model,
          });

          const result = await magi.run(val.data.question, { language });

          // Persist deliberation trajectory and agent analyses to Supabase
          persistenceService.saveDeliberation(result).catch(err => {
            console.warn('[MAGI PERSISTENCE] Background save error:', err);
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: sanitizeErrorMessage(error),
          }));
        }
        return;
      }

      // -------------------------------------------------------------
      // Static File Serving (from public/)
      // -------------------------------------------------------------
      if (req.method === 'GET') {
        let filePath = pathname === '/' ? '/index.html' : pathname;
        const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(PUBLIC_DIR, safePath);

        try {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }

          const ext = path.extname(fullPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          const content = await fs.readFile(fullPath);

          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
          return;
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          return;
        }
      }

      // Fallback
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Server error' }));
    }
  };
}

export function createServer() {
  const handler = createMagiRequestHandler();
  return http.createServer(handler);
}

// If invoked directly from terminal
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const server = createServer();
  server.listen(PORT, () => {
    console.log('\n\x1b[1m\x1b[36m' + `
  ███╗   ███╗ █████╗  ██████╗ ██╗
  ████╗ ████║██╔══██╗██╔════╝ ██║
  ██╔████╔██║███████║██║  ███╗██║
  ██║╚██╔╝██║██╔══██║██║   ██║██║
  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
  SUPERCOMPUTER DELIBERATION SYSTEM — V2.2 PRODUCTION
    ` + '\x1b[0m');
    console.log(`\x1b[32m[ONLINE]\x1b[0m MAGI Web Server active at: \x1b[1m\x1b[35mhttp://localhost:${PORT}\x1b[0m`);
    console.log(`  • Web Interface:    http://localhost:${PORT}/`);
    console.log(`  • Health Check:     http://localhost:${PORT}/api/health`);
    console.log(`  • Deliberate API:   POST http://localhost:${PORT}/api/deliberate`);
    console.log(`  • Streaming SSE:    POST http://localhost:${PORT}/api/deliberate/stream`);
    console.log(`  • Model Comparison: POST http://localhost:${PORT}/api/compare`);
    console.log(`  • Delib. History:   GET http://localhost:${PORT}/api/history`);
    console.log(`  • Benchmark Suite:  GET http://localhost:${PORT}/api/benchmark\n`);
  });
}
