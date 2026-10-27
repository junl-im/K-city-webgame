import assert from 'node:assert/strict';
import { resolveHorizontalFacing, resolveWalkHeading } from '../src/walk-motion.ts';

assert.equal(resolveWalkHeading(-160, 12, 'down'), 'left');
assert.equal(resolveWalkHeading(160, -12, 'left'), 'right');
assert.equal(resolveWalkHeading(2, -180, 'right'), 'up');
assert.equal(resolveWalkHeading(-2, 180, 'up'), 'down');
assert.equal(resolveWalkHeading(1, 1, 'left'), 'left');
assert.equal(resolveHorizontalFacing(-130, 'left', 1), -1);
assert.equal(resolveHorizontalFacing(130, 'right', -1), 1);
assert.equal(resolveHorizontalFacing(1, 'up', -1), -1);
assert.equal(resolveHorizontalFacing(-1, 'down', 1), 1);
console.log('Direction and facing checks passed (9 cases).');
