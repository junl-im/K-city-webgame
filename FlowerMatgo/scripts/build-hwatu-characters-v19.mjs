import { createRequire } from 'node:module';
import { join } from 'node:path';
const sharp = createRequire(import.meta.url)('sharp');

// Raster-only extraction of the 48 supplied illustrations: no motifs are redrawn.
const sourceDir = join(process.cwd(), 'artwork/concepts');
const destination = join(process.cwd(), 'public/assets/hwatu-character-original-v19.webp');
const sheets = [
  'hwatu-rectified-01-03-v19.png',
  'hwatu-rectified-04-06-v19.png',
  'hwatu-rectified-07-09-v19.png',
  'hwatu-rectified-10-12-v19.png',
];
const TILE_WIDTH = 248;
const TILE_HEIGHT = 340;

function spans(counts, threshold) {
  const spans = [];
  let start = -1;
  for (let i = 0; i <= counts.length; i++) {
    const active = i < counts.length && counts[i] >= threshold;
    if (active && start < 0) start = i;
    if (!active && start >= 0) {
      if (i - start >= 8) spans.push([start, i - 1]);
      start = -1;
    }
  }
  return spans;
}

async function extractCards(path) {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const columnsCount = new Uint32Array(info.width);
  const rowsCount = new Uint32Array(info.height);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const pixel = (y * info.width + x) * 3;
      const r = data[pixel], g = data[pixel + 1], b = data[pixel + 2];
      if (r > 170 && r > g * 1.65 && r > b * 1.7 && g < 115) {
        columnsCount[x]++;
        rowsCount[y]++;
      }
    }
  }
  const columns = spans(columnsCount, 12);
  const rows = spans(rowsCount, 12);
  if (columns.length !== 4 || rows.length !== 3) {
    throw new Error(`${path}: expected 4 × 3 cards; got ${columns.length} × ${rows.length}`);
  }
  const cards = [];
  for (const [top, bottom] of rows) {
    for (const [left, right] of columns) {
      const box = {
        left: Math.max(0, left - 1), top: Math.max(0, top - 1),
        width: Math.min(info.width, right + 2) - Math.max(0, left - 1),
        height: Math.min(info.height, bottom + 2) - Math.max(0, top - 1),
      };
      cards.push(await sharp(path).extract(box)
        .resize(TILE_WIDTH, TILE_HEIGHT, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer());
    }
  }
  return cards;
}

const cardImages = [];
for (const sheet of sheets) cardImages.push(...await extractCards(join(sourceDir, sheet)));
if (cardImages.length !== 48) throw new Error(`Expected 48 cards, found ${cardImages.length}`);
const layers = cardImages.map((input, index) => ({
  input, left: (index % 4) * TILE_WIDTH, top: Math.floor(index / 4) * TILE_HEIGHT,
}));
await sharp({ create: {
  width: TILE_WIDTH * 4, height: TILE_HEIGHT * 12,
  channels: 4, background: '#ffffff',
} }).composite(layers).webp({ quality: 93, effort: 6 }).toFile(destination);
console.log(`${destination} (${TILE_WIDTH * 4} × ${TILE_HEIGHT * 12}; ${cardImages.length} cards)`);
