import assert from 'node:assert/strict';
import { circuitReadings } from './dist/circuit-core.mjs';

const off = circuitReadings(9, 3, false);
assert.equal(off.current, 0);
assert.equal(off.power, 0);
assert.equal(off.brightness, 0);

const baseline = circuitReadings(4.5, 6, true);
assert.equal(baseline.current, 0.75);
assert.equal(baseline.power, 3.375);
assert.ok(baseline.brightness > 0 && baseline.brightness < 1);

const highVoltage = circuitReadings(9, 6, true);
assert.equal(highVoltage.current, 2 * baseline.current);
assert.equal(highVoltage.power, 4 * baseline.power);

const highResistance = circuitReadings(4.5, 12, true);
assert.equal(highResistance.current, baseline.current / 2);
assert.equal(highResistance.power, baseline.power / 2);

for (const [v,r,s] of [[-1,6,true],[3,0,true],[Infinity,6,true],[3,NaN,true],[3,6,undefined]]) {
  assert.throws(() => circuitReadings(v,r,s), /Invalid circuit parameters/);
}
console.log('PASS: open circuit, Ohm law, electrical power, lamp visualization and input validation');
