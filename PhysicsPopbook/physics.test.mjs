import assert from 'node:assert/strict';
import { GRAVITY, simulateFall, idealFallTime, createBody, stepBody } from './dist/physics-core.mjs';

for (const height of [2, 10, 20]) {
  for (const planet of ['earth', 'moon']) {
    const vacuum = simulateFall({ height, planet, air: false });
    assert.equal(vacuum.ball, vacuum.feather, `${planet} vacuum must land simultaneously`);
    assert.ok(Math.abs(vacuum.ball - idealFallTime(height, GRAVITY[planet])) < 0.002);
  }
}

const earthAir = simulateFall({ height: 10, planet: 'earth', air: true });
assert.ok(earthAir.feather > earthAir.ball + 1, 'air must slow the feather considerably');
const moonAirRequest = simulateFall({ height: 10, planet: 'moon', air: true });
assert.equal(moonAirRequest.air, false, 'Moon should force vacuum');

const stationary = createBody();
stepBody(stationary, 'ball', 0, 9.81, 10, false, 0);
assert.equal(stationary.distance, 0);

console.log('PASS: vacuum synchronization, Earth/Moon gravity, air drag, safe time step');
