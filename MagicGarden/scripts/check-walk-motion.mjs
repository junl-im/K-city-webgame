import assert from 'node:assert/strict';
import { resolveHorizontalFacing, resolveWalkHeading } from '../src/walk-motion.ts';
const cases = [
  [-160, 12, 'down', 'left'], [160, -12, 'left', 'right'],
  [2, -180, 'right', 'up'], [-2, 180, 'up', 'down'],
  [1, 1, 'left', 'right'], [0, 0, 'up', 'up'],
  [NaN, 5, 'right', 'right'], [Infinity, -3, 'down', 'down'],
  [1, 1, 'down', 'down'], [1.04, 1, 'up', 'up'],
  [1.29, 1, 'down', 'down'], [1.31, 1, 'down', 'right'],
  [-1.31, 1, 'down', 'left'], [1, -1.31, 'right', 'up'],
  [-1, -1.31, 'left', 'up'], [-1.29, 1, 'right', 'left'],
  [0, -1, 'down', 'up'], [-1, 0, 'right', 'left'],
] as const;
for (const [dx, dy, prev, expected] of cases) assert.equal(resolveWalkHeading(dx, dy, prev), expected, `vector ${dx},${dy} from ${prev}`);
assert.equal(resolveHorizontalFacing(-130, 'left', 1), -1);
assert.equal(resolveHorizontalFacing(130, 'right', -1), 1);
assert.equal(resolveHorizontalFacing(1, 'up', -1), -1);
assert.equal(resolveHorizontalFacing(-1, 'down', 1), 1);
assert.equal(resolveHorizontalFacing(NaN, 'left', 1), 1);
console.log(`Direction checks passed (${cases.length + 5} cases).`);
