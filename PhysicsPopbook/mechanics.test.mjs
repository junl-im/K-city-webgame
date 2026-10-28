import assert from 'node:assert/strict';
import { mechanicsReadings } from './dist/mechanics-core.mjs';

for (const arm of [1,2,3,4]) {
  const d=mechanicsReadings({mode:'lever',loadNewtons:120,effortArmMeters:arm});
  assert.equal(d.advantage,arm);
  assert.equal(d.effortNewtons,120/arm);
  assert.equal(d.inputWorkJoules,d.outputWorkJoules);
}
for (const type of ['fixed','moving']) {
  const d=mechanicsReadings({mode:'pulley',loadNewtons:120,pulleyType:type});
  assert.equal(d.advantage,type==='fixed'?1:2);
  assert.equal(d.effortNewtons,type==='fixed'?120:60);
  assert.equal(d.inputTravelMeters,type==='fixed'?0.5:1);
  assert.equal(d.inputWorkJoules,d.outputWorkJoules);
}
for (const options of [
  {mode:'lever',loadNewtons:0},{mode:'pulley',loadNewtons:-10},{mode:'wrong',loadNewtons:100},
  {mode:'lever',loadNewtons:120,effortArmMeters:0},
  {mode:'pulley',loadNewtons:120,pulleyType:'invalid'}
]) assert.throws(()=>mechanicsReadings(options),/Invalid mechanics parameters/);
console.log('PASS: lever torque, fixed and moving pulleys, conserved ideal work, input validation');
