import { closeSync, openSync, readSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = process.argv[2] === 'dist' ? 'dist' : 'public';
const expected = ['town-scene-v1.png', 'farm-scene-v1.png'];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

for (const name of expected) {
  const file = join(projectRoot, outputRoot, 'assets', name);
  const size = statSync(file).size;
  if (size < 1024 || size > 12 * 1024 * 1024) {
    throw new Error(`${name}: unexpected scene image size (${size} bytes)`);
  }
  const fd = openSync(file, 'r');
  const header = Buffer.alloc(24);
  let length;
  try { length = readSync(fd, header, 0, header.length, 0); }
  finally { closeSync(fd); }
  if (length !== 24 || !header.subarray(0, 8).equals(pngSignature) || header.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`${name}: not a valid PNG header`);
  }
  const width = header.readUInt32BE(16);
  const height = header.readUInt32BE(20);
  if (width < 320 || height < 240 || width > 8192 || height > 8192) {
    throw new Error(`${name}: unexpected dimensions ${width}x${height}`);
  }
  process.stdout.write(`${name}: ${width}x${height}, ${(size / 1024 / 1024).toFixed(2)} MiB — OK\n`);
}

const optimized = [
  'town-scene-v1.webp',
  'farm-scene-v1.webp',
  'lab-scene-v1.webp',
  'nursery-scene-v1.webp',
  'friends-atlas-v1.webp',
  'fox-four-directions-v1.webp',
];
for (const name of optimized) {
  const file = join(projectRoot, outputRoot, 'assets', name);
  const size = statSync(file).size;
  if (size < 20_000 || size > 3_000_000) throw new Error(`${name}: unexpected optimized image size (${size} bytes)`);
  const fd = openSync(file, 'r');
  const header = Buffer.alloc(16);
  let length;
  try { length = readSync(fd, header, 0, header.length, 0); }
  finally { closeSync(fd); }
  const frameType = header.toString('ascii', 12, 16);
  if (length !== 16 || header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP' || !['VP8 ', 'VP8L', 'VP8X'].includes(frameType)) {
    throw new Error(`${name}: invalid WebP header`);
  }
  if (name === 'fox-four-directions-v1.webp') {
    // Four equally sized 256x256 frames are arranged in a 512x512 WebP atlas.
    if (frameType !== 'VP8X') throw new Error('fox atlas: expected extended WebP');
    const fd2 = openSync(file, 'r');
    const extended = Buffer.alloc(30);
    try { readSync(fd2, extended, 0, extended.length, 0); }
    finally { closeSync(fd2); }
    const width = extended.readUIntLE(24, 3) + 1;
    const height = extended.readUIntLE(27, 3) + 1;
    if (width !== 512 || height !== 512) throw new Error(`fox atlas: expected 512x512, got ${width}x${height}`);
  }
  process.stdout.write(`${name}: ${(size / 1024).toFixed(0)} KiB, WebP — OK\n`);
}
