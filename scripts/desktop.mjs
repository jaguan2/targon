import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
// Electron-based terminals can export this flag. Remove it for this child
// only, so launching the app never requires editing the user's environment.
delete env.ELECTRON_RUN_AS_NODE;
delete env.VITE_DEV_SERVER_URL;

let server;
if (process.argv.includes('--dev')) {
  const { createServer } = await import('vite');
  server = await createServer({ root, clearScreen: false, server: { host: '127.0.0.1', port: 5174, strictPort: true } });
  await server.listen();
  env.VITE_DEV_SERVER_URL = 'http://127.0.0.1:5174';
  console.log('Desktop development server: http://127.0.0.1:5174');
}

const child = spawn(require('electron'), [root], { cwd: root, env, stdio: 'inherit', windowsHide: true });
let stopping = false;
async function stop(code) {
  if (stopping) return;
  stopping = true;
  if (child.exitCode === null && !child.killed) child.kill();
  await server?.close();
  process.exitCode = code;
}
child.on('error', async (error) => { console.error(error.message); await stop(1); });
child.on('exit', async (code) => { await stop(code ?? 1); });
process.on('SIGINT', () => { void stop(0); });
process.on('SIGTERM', () => { void stop(0); });
