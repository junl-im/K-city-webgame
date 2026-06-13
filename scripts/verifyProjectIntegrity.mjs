import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'package-lock.json',
  '.npmrc',
  '.nvmrc',
  'index.html',
  'public/sw.js',
  'src/main.ts',
  'src/assets/ui/title-keyvisual-060.webp'
];
const problems = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) problems.push(`missing ${file}`);
}

const lock = fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
const npmrc = fs.readFileSync(path.join(root, '.npmrc'), 'utf8');

const forbidden = ['applied-caas', 'internal.api.openai.org', 'localhost:', '127.0.0.1:'];
for (const token of forbidden) {
  if (lock.includes(token)) problems.push(`package-lock contains forbidden registry token: ${token}`);
}

if (!npmrc.includes('registry=https://registry.npmjs.org/')) problems.push('.npmrc registry is not npmjs');
if (!sw.includes('soul-online-alpha-v1-33')) problems.push('service worker cache is not v1-33');
if (pkg.version !== '1.33.0') problems.push(`package version is ${pkg.version}, expected 1.33.0`);

const assetDir = path.join(root, 'src/assets/2p5d');
function countWebp(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countWebp(target);
    else if (/\.webp$/i.test(entry.name)) count += 1;
  }
  return count;
}
const highFidelityAssets = countWebp(assetDir);
if (highFidelityAssets < 4) problems.push('2.5D high fidelity assets look incomplete');

if (problems.length) {
  console.error('[SoulOnline verifyProjectIntegrity] failed');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`[SoulOnline verifyProjectIntegrity] ok · version ${pkg.version} · 2.5D assets ${highFidelityAssets}`);
