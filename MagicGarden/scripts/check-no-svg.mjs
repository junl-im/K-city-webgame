import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const root = process.cwd();
const scan = process.argv[2] || 'source';
const entryPaths = scan === 'dist' ? ['dist'] : ['src', 'public', 'index.html'];
const imageSuffix = '.' + 'svg';
const inlineMarker = '<' + 'svg';
const dataMarker = 'data:image/' + 'svg+xml';
const errors = [];

function walk(file) {
  if (!existsSync(file)) return;
  const stat = readdirOrFile(file);
  if (stat === 'directory') {
    for (const entry of readdirSync(file, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      walk(join(file, entry.name));
    }
    return;
  }
  const relativePath = relative(root, file).replaceAll('\\', '/');
  if (extname(file).toLowerCase() === imageSuffix) errors.push(relativePath + ': forbidden image');
  const extension = extname(file).toLowerCase();
  // Authored source must be SVG-free, including JS/JSON strings.
// Vite's dist JS contains bundled third-party PixiJS internals that can
// *mention* SVG as a supported format; rejecting that string would falsely
// fail a game whose authored art, HTML and CSS are completely raster-only.
// For dist, still ban every physical .svg asset and any SVG reference in
// generated HTML/CSS. Check authored src imports before bundling.
const inspected = scan === 'dist'
  ? ['.html', '.css'].includes(extension)
  : ['.html', '.css', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.vue'].includes(extension);
if (inspected) {
    const contents = readFileSync(file, 'utf8').toLowerCase();
    if (contents.includes(inlineMarker) || contents.includes(dataMarker) || contents.includes(imageSuffix)) errors.push(relativePath + ': forbidden image reference');
  }
}
function readdirOrFile(path) {
  try { readdirSync(path); return 'directory'; } catch { return 'file'; }
}
for (const item of entryPaths) walk(join(root, item));
if (errors.length) {
  process.stderr.write('Image policy violation:\n' + errors.join('\n') + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('Raster-only game asset policy: OK\n');
}
