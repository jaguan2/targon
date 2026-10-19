import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const files = {};
async function collect(directory, prefix = '') {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name;
    if (item.isDirectory()) await collect(join(directory, item.name), `${name}/`);
    else if (item.isFile()) files[name] = new Uint8Array(await readFile(join(directory, item.name)));
  }
}
await collect(join(root, 'dist'));
if (!files['index.html']) throw new Error('No web build found. Run npm run build:web first.');
const output = join(root, 'release', `Targon-${pkg.version}-web.zip`);
await mkdir(join(root, 'release'), { recursive: true });
await writeFile(output, zipSync(files, { level: 9 }));
console.log(`Web hosting bundle: ${output}`);
