import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const file = (name) => readFileSync(new URL('../' + name, import.meta.url));
const main = file('src/main.ts').toString('utf8');
const names = [
  'ui-v26-gate-town', 'ui-v26-gate-farm', 'ui-v26-gate-lab',
  'ui-v26-gate-nursery', 'ui-v26-station-lab', 'ui-v26-station-nursery',
];
const sourceHashes = new Set(), webpHashes = new Set();
let pngBytes = 0, webpBytes = 0;
for (const name of names) {
  const png = file('public/assets/' + name + '.png');
  const webp = file('public/assets/' + name + '.webp');
  if (png.subarray(1,4).toString() !== 'PNG') throw Error('Invalid PNG: ' + name);
  if (webp.subarray(0,4).toString() !== 'RIFF' || webp.subarray(8,12).toString() !== 'WEBP') throw Error('Invalid WebP: ' + name);
  const p = createHash('sha256').update(png).digest('hex');
  const w = createHash('sha256').update(webp).digest('hex');
  if (sourceHashes.has(p) || webpHashes.has(w)) throw Error('World sign reused: ' + name);
  sourceHashes.add(p); webpHashes.add(w);
  if (!main.includes("'" + name + ".webp'")) throw Error('Sign not mapped: ' + name);
  if (webp.length >= png.length / 4) throw Error('Sign runtime image not compressed: ' + name);
  pngBytes += png.length; webpBytes += webp.length;
}
if (!main.includes('sprite.scale.set(scale)') || !main.includes('Math.min(maxWidth / texture.width, maxHeight / texture.height)')) throw Error('Sign art must fit uniformly without stretching');
if (main.includes("loadSignArt('ui-button-wood-v1.webp'") || main.includes("loadSignArt('ui-button-green-v1.webp'")) throw Error('Shared stretched sign is still in use');
if (!main.includes('refreshWorldSignArt(next)')) throw Error('Zone changes must update their individual signs');
console.log('6 world-space hand-painted signs verified: ' + (pngBytes / 1048576).toFixed(1) + ' MiB originals -> ' + (webpBytes / 1024).toFixed(0) + ' KiB runtime');
