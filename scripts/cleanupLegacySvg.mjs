import { rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  'src/assets/map',
  'src/assets/map/decor',
  'src/assets/sprites',
  'public/assets/soulpack/props'
];
const uiPatterns = [/^title-hero.*\.svg$/i, /^town-panorama-.*\.svg$/i];
const dirsWithPatterns = [{ dir: 'src/assets/ui', patterns: uiPatterns }];

for (const dir of roots) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (file.toLowerCase().endsWith('.svg')) {
      rmSync(join(dir, file), { force: true });
    }
  }
}
for (const { dir, patterns } of dirsWithPatterns) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (patterns.some((pattern) => pattern.test(file))) rmSync(join(dir, file), { force: true });
  }
}
