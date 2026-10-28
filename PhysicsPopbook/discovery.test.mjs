import assert from 'node:assert/strict';
import { magnetReading, soundReading } from './dist/discovery-core.mjs';

assert.equal(magnetReading('iron', 1, 5).attraction, true);
assert.equal(magnetReading('wood', 1, 5).visualPull, 0);
assert.ok(magnetReading('iron', 1, 3).visualPull > magnetReading('iron', 5, 3).visualPull);
assert.equal(soundReading(340, 3).wavelengthMeters, 1);
assert.equal(soundReading(680, 3).wavelengthMeters, .5);
assert.ok(soundReading(170, 3).wavelengthMeters > soundReading(680, 3).wavelengthMeters);
assert.ok(soundReading(340, 5).visualAmplitude > soundReading(340, 1).visualAmplitude);
assert.throws(() => magnetReading('water'), RangeError);
assert.throws(() => soundReading(0), RangeError);
console.log('PASS: magnetic material/distance qualitative model and sound wavelength');
