import assert from 'node:assert/strict';
import { orbitalPeriodYears, orbitalAngle, orbitalPosition } from './dist/orbit-core.mjs';

assert.equal(orbitalPeriodYears(1), 1, 'At 1 AU, one Sun-centred year');
assert.ok(Math.abs(orbitalPeriodYears(1.6) - 2.0238577025) < .000001);
assert.ok(orbitalPeriodYears(.7) < orbitalPeriodYears(1));
assert.ok(orbitalPeriodYears(1.6) > orbitalPeriodYears(1));
assert.ok(Math.abs(orbitalAngle(1,1) - Math.PI*2) < 1e-10);
assert.ok(Math.abs(orbitalPosition(.25,1).x) < 1e-10);
assert.throws(() => orbitalPeriodYears(0), /Invalid orbit radius/);

console.log('PASS: Kepler period, orbital angle, near/far comparison and input validation');
