import assert from 'node:assert/strict';
import { creekSurfacePose, creekFallPose, creekShouldAnimate, creekSurfaceCount, creekCascadeCount } from '../src/creek-flow.ts';
let assertions = 0;
for (const ms of [0, 16.67, 250, 1000, 4500, 6200, 12400, 90000]) {
  for (let i = 0; i < 32; i++) {
    const point=creekSurfacePose(i,ms);
    for (const v of [point.x,point.y,point.angle]) { assert.ok(Number.isFinite(v));assertions++; }
    assert.ok(point.x>-10&&point.x<510,'Surface x outside creek corridor');assertions++;
    assert.ok(point.y>468&&point.y<808,'Surface y outside creek corridor');assertions++;
  }
  for (let i=0;i<12;i++) {
    const point=creekFallPose(i,ms);
    assert.ok(point.x>=155&&point.x<=338);assertions++;
    assert.ok(point.y>=140&&point.y<=312);assertions++;
    assert.ok(Number.isFinite(point.angle));assertions++;
  }
}
assert.equal(creekShouldAnimate('town',false,true),true);assertions++;
assert.equal(creekShouldAnimate('farm',false,true),false);assertions++;
assert.equal(creekShouldAnimate('lab',false,true),false);assertions++;
assert.equal(creekShouldAnimate('nursery',false,true),false);assertions++;
assert.equal(creekShouldAnimate('town',true,true),false);assertions++;
assert.equal(creekShouldAnimate('town',false,false),false);assertions++;
assert.equal(creekSurfaceCount(false),32);assertions++;
assert.equal(creekSurfaceCount(true),0);assertions++;
assert.equal(creekCascadeCount(false),12);assertions++;
assert.equal(creekCascadeCount(true),0);assertions++;
console.log(`Creek animation geometry + reduced motion: ${assertions} assertions passed`);
