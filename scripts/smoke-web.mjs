import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const archive = process.argv[2] ?? new URL(`../release/Star-${pkg.version}-web.zip`, import.meta.url);
const files = unzipSync(new Uint8Array(await readFile(archive)));
assert(files['index.html'], 'The archive must have index.html at its root.');
for (const mount of ['/', '/star/']) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const name = pathname.startsWith(mount) ? pathname.slice(mount.length) || 'index.html' : '';
    const content = files[name];
    if (!content) { response.writeHead(404); response.end(); return; }
    const type = name.endsWith('.html') ? 'text/html' : name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type });
    response.end(content);
  });
  try {
    await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
    const base = `http://127.0.0.1:${server.address().port}${mount}`;
    const response = await fetch(base);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert(html.includes('<div id="root"></div>'));
    assert(!html.includes('/src/main.tsx'));
    const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
    assert(refs.some((ref) => ref.endsWith('.js')), 'Missing JavaScript entry point.');
    assert(refs.some((ref) => ref.endsWith('.css')), 'Missing stylesheet.');
    for (const ref of refs) {
      const asset = await fetch(new URL(ref, base));
      assert.equal(asset.status, 200, `Asset does not load at ${mount}: ${ref}`);
      assert((await asset.arrayBuffer()).byteLength > 0);
    }
    console.log(`Web bundle verified at ${mount}: HTML, JavaScript and CSS load over HTTP.`);
  } finally {
    await new Promise((accept, reject) => server.close((error) => error ? reject(error) : accept()));
  }
}
assert(strFromU8(files['index.html']).includes('<title>Star'));
