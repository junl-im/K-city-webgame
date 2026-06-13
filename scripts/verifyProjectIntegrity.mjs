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
  'src/assets/ui/title-keyvisual-060.webp',
  'public/assets/ui/soul135/title-keyart-reference-135.webp',
  'public/assets/ui/soul135/town-showcase-blur-bg.webp',
  'public/assets/ui/soul136/title-card-polished-136.webp',
  'public/assets/ui/soul136/town-hero-profile-clean-136.webp',
  'src/core/PortraitGuard.ts',
  'src/styles/alpha137.css',
  'src/core/RuntimeSanity138.ts',
  'src/styles/alpha138.css',
  'src/boot.ts',
  'src/styles/alpha140.css'
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
if (!sw.includes('soul-online-alpha-v1-40')) problems.push('service worker cache is not v1-40');
if (pkg.version !== '1.40.0') problems.push(`package version is ${pkg.version}, expected 1.40.0`);

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


const workflowDir = path.join(root, '.github', 'workflows');
const workflowWarnings = [];
if (!fs.existsSync(workflowDir)) {
  problems.push('missing .github/workflows directory');
} else {
  const workflowFiles = fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/i.test(name)).sort();
  const extraWorkflows = workflowFiles.filter((name) => name !== 'build.yml');
  if (!workflowFiles.includes('build.yml')) problems.push('missing .github/workflows/build.yml');
  if (extraWorkflows.length > 0) {
    problems.push(`clean reset allows only build.yml workflow; remove: ${extraWorkflows.join(', ')}`);
  }
  const autoWorkflows = [];
  for (const name of workflowFiles) {
    const text = fs.readFileSync(path.join(workflowDir, name), 'utf8');
    const hasPush = /^\s*push\s*:/m.test(text) || /^\s*-\s*push\s*$/m.test(text);
    const hasPullRequest = /^\s*pull_request\s*:/m.test(text) || /^\s*-\s*pull_request\s*$/m.test(text);
    if (hasPush || hasPullRequest) autoWorkflows.push(name);
  }
  if (autoWorkflows.length !== 1 || autoWorkflows[0] !== 'build.yml') {
    problems.push(`exactly one automatic workflow is allowed: build.yml; detected: ${autoWorkflows.join(', ') || 'none'}`);
  }
  const buildText = fs.existsSync(path.join(workflowDir, 'build.yml'))
    ? fs.readFileSync(path.join(workflowDir, 'build.yml'), 'utf8')
    : '';
  if (!buildText.includes('actions/checkout@v6')) problems.push('build.yml must use actions/checkout@v6');
  if (!buildText.includes('actions/setup-node@v5')) problems.push('build.yml must use actions/setup-node@v5');
  if (!buildText.includes('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24')) problems.push('build.yml must force Node24 action runtime');
}

const highFidelityAssets = countWebp(assetDir);
if (highFidelityAssets < 4) problems.push('2.5D high fidelity assets look incomplete');

if (problems.length) {
  console.error('[SoulOnline verifyProjectIntegrity] failed');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

if (workflowWarnings.length) {
  for (const warning of workflowWarnings) console.warn(`[SoulOnline verifyProjectIntegrity] warning · ${warning}`);
}
console.log(`[SoulOnline verifyProjectIntegrity] ok · version ${pkg.version} · 2.5D assets ${highFidelityAssets} · clean workflow build-only · ui135+ui136 reference kit · portrait137+runtime138+boot140`);
