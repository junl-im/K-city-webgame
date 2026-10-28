import assert from 'node:assert/strict';
import { mirrorLightPath } from './dist/mirror-core.mjs';

for (const angle of [0,10,25,35,55,70,80]) {
  const ray = mirrorLightPath(angle, 4);
  assert.equal(ray.incidenceDegrees, ray.reflectionDegrees);
  assert.ok(Math.abs(ray.source.x + ray.target.x) < 1e-10);
  assert.ok(Math.abs(ray.source.z - ray.target.z) < 1e-10);
  assert.ok(Math.abs(ray.incoming.z + ray.outgoing.z) < 1e-10);
  assert.ok(Math.abs(Math.hypot(ray.incoming.x, ray.incoming.z) - 1) < 1e-10);
  assert.ok(Math.abs(Math.hypot(ray.outgoing.x, ray.outgoing.z) - 1) < 1e-10);
}
assert.throws(() => mirrorLightPath(-2), /Invalid incidence angle/);
assert.throws(() => mirrorLightPath(90), /Invalid incidence angle/);
assert.throws(() => mirrorLightPath(35, 0), /Invalid ray length/);

console.log('PASS: mirror law, direction symmetry, unit vectors and input validation');
