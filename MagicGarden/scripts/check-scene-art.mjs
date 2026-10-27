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
