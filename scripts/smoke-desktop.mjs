import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';

const executable = resolve(process.argv[2] ?? 'release/win-unpacked/Targon.exe');
const tempRoot = resolve(tmpdir());
const workspace = await mkdtemp(join(tempRoot, 'targon-desktop-smoke-'));
const reportPath = join(workspace, 'report.json');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
delete env.VITE_DEV_SERVER_URL;
try {
  const code = await new Promise((accept, reject) => {
    const child = spawn(executable, [`--smoke-test-report=${reportPath}`], { env, stdio: 'inherit', windowsHide: true });
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Desktop smoke test timed out.')); }, 45000);
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('exit', (exitCode) => { clearTimeout(timeout); accept(exitCode); });
  });
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  if (code !== 0 || !report.success) throw new Error(JSON.stringify(report));
  console.log(`Desktop startup verified: ${executable}`);
  console.log(JSON.stringify(report.checks));
} finally {
  // Resolve and check the owned temporary directory before recursive cleanup.
  const childPath = relative(tempRoot, resolve(workspace));
  if (!childPath || childPath.startsWith('..') || isAbsolute(childPath) || !childPath.startsWith('targon-desktop-smoke-')) {
    throw new Error('Refusing to clean a path outside the smoke-test workspace.');
  }
  await rm(workspace, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}
