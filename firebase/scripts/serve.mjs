// Tiny static file server for the demo build (no dependencies).
//   node scripts/serve.mjs [dir=../public-demo] [port=5173]
// Exports serve(dir, port) for tests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

export function serve(dir, port) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    const file = join(root, path || 'index.html');
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      const page = !extname(file); // unknown paths without an extension get the app, like Hosting's cleanUrls
      const body = await readFile(file).catch((e) => (page ? readFile(join(root, 'index.html')) : Promise.reject(e)));
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || TYPES['.html'], 'Cache-Control': 'no-cache' }).end(body);
    } catch {
      res.writeHead(404).end('Not found. Build first: npm run build:demo (in firebase/)');
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || fileURLToPath(new URL('../../public-demo', import.meta.url));
  const port = Number(process.argv[3] || 5173);
  await serve(dir, port);
  console.log(`\nDemo app (sample data only): http://localhost:${port}/\nStop with Ctrl+C.\n`);
}
