/**
 * server.js
 *
 * Minimal static file server + CORS proxy for local development.
 * The /proxy?url=... endpoint fetches the target URL server-side,
 * bypassing browser CORS restrictions.
 *
 * Usage: node server.js
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const PORT = 3000;
const ROOT = fileURLToPath(new URL('.', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // ── Proxy endpoint ──────────────────────────────────────────────────────────
  if (reqUrl.pathname === '/proxy') {
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      res.writeHead(400);
      return res.end('Missing url parameter');
    }
    try {
      const upstream = await fetch(target, {
        headers: { 'User-Agent': 'EDS-Health-Checker/1.0' },
      });
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'text/html',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(body);
    } catch (err) {
      res.writeHead(502);
      return res.end(err.message);
    }
  }

  // ── Static files ────────────────────────────────────────────────────────────
  const filePath = join(ROOT, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(` INFO  Accepting connections at http://localhost:${PORT}`);
});
