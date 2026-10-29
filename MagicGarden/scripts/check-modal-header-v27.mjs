import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root));
const code = read('src/main.ts').toString('utf8');
const css = read('src/unique-surfaces-v23.css').toString('utf8');
const keys = ["bag","map","book","help","lab","nursery","save"];
const hashes = { png:new Set(), webp:new Set() };
for (const key of keys) {
  const pngPath = `public/assets/ui-v27-modal-${key}.png`;
  const webpPath = `public/assets/ui-v27-modal-${key}.webp`;
  const png = read(pngPath), webp = read(webpPath);
  if (png.length < 40000 || webp.length < 10000 || webp.length >= png.length / 3) {
    throw new Error(`v27 missing or poorly compressed: ${key}`);
  }
  for (const [format, bytes] of [['png',png],['webp',webp]]) {
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (hashes[format].has(digest)) throw new Error(`v27 shared ${format} artwork: ${key}`);
    hashes[format].add(digest);
  }
  if (!css.includes(`data-surface="${key}"`) || !css.includes(`ui-v27-modal-${key}.webp`)) {
    throw new Error(`v27 CSS mapping missing: ${key}`);
  }
  if (!code.includes(`': '${key}'`)) {
    throw new Error(`v27 live modal selector missing: ${key}`);
  }
}
if (!code.includes('modalRoot.dataset.surface') || !css.includes('background-size:100% auto!important')) {
  throw new Error('v27 source violates modal mapping or uniform aspect-preserving scale');
}
if (css.includes('ui-v27-modal') && /ui-v27-modal[^\n]*100%\s+100%/.test(css)) {
  throw new Error('v27 modal artwork must not stretch both dimensions');
}
console.log('Magic Garden v27: seven distinct PNG/WebP modal headers, aspect preserved, selectors wired.');
