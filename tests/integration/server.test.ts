import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'node:http';
import { createServer } from '../../src/server/server.js';

describe('HTTP Server & API Endpoints (/api/deliberate, /api/health)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer();
    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/health should return system status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBe('2.2.0');
    expect(data.defaultModel).toBe('gemini-3.1-pro-preview');
  });

  it('POST /api/deliberate should return valid synthesis in mock mode', async () => {
    const payload = {
      question: 'Devemos adotar Rust no backend?',
      language: 'Portuguese',
      mock: true,
    };

    const res = await fetch(`${baseUrl}/api/deliberate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.question).toBe(payload.question);
    expect(data.finalDecision).toBeDefined();
    expect(data.coreVerdict).toBeDefined();
    expect(data.initialAnalysis.MELCHIOR).toBeDefined();
    expect(data.initialAnalysis.BALTHASAR).toBeDefined();
    expect(data.initialAnalysis.CASPER).toBeDefined();
    expect(data.metadata).toBeDefined();
    expect(data.metadata.provider).toBe('mock');
  });

  it('POST /api/deliberate should return 400 when question is missing or empty', async () => {
    const res = await fetch(`${baseUrl}/api/deliberate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '   ' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('GET / should serve the web application HTML', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');

    const html = await res.text();
    expect(html).toContain('MAGI SYSTEM');
    expect(html).toContain('anime-view');
    expect(html).toContain('btn-view-anime');
    expect(html).toContain('質 問');
    expect(html).toContain('解 決');
    expect(html).toContain('tactical-view');
    expect(html).toContain('diagnostic-view');
    expect(html).toContain('btn-view-tactical');
    expect(html).toContain('copy-ascii-btn');
    expect(html).toContain('MELCHIOR • 1');
    expect(html).toContain('BALTHASAR • 2');
    expect(html).toContain('CASPER • 3');
  });

  it('GET /style.css should serve the stylesheet', async () => {
    const res = await fetch(`${baseUrl}/style.css`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/css');
  });

  it('GET /api/history should return history array and configuration status', async () => {
    const res = await fetch(`${baseUrl}/api/history?limit=5`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.history)).toBe(true);
    expect(typeof data.configured).toBe('boolean');
  });
});
