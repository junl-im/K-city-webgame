import assert from 'node:assert/strict';
import { isWalkable, nearestWalkable, planGardenRoute, segmentIsWalkable } from '../src/garden-navigation.ts';
const cases = [
  ['town', {x:619,y:585}, {x:1180,y:520}],
  ['town', {x:619,y:585}, {x:900,y:390}],
  ['town', {x:1100,y:360}, {x:740,y:360}],
  ['farm', {x:218,y:562}, {x:1110,y:562}],
  ['farm', {x:218,y:562}, {x:573,y:558}],
  ['farm', {x:1100,y:680}, {x:218,y:562}],
  ['lab', {x:610,y:562}, {x:1020,y:430}],
  ['nursery', {x:610,y:562}, {x:1020,y:430}],
];
let checks = 0;
for (const [zone,start,target] of cases) {
  const goal = nearestWalkable(zone, target);
  assert.ok(goal && isWalkable(zone,goal.x,goal.y), `${zone}: goal must be walkable`);
  const route = planGardenRoute(zone,start,target);
  assert.ok(route.length > 0, `${zone}: route not found`);
  let from = start;
  for (const to of route) {
    assert.ok(segmentIsWalkable(zone, from, to), `${zone}: blocked route segment ${JSON.stringify({from,to})}`);
    from = to;
  }
  assert.ok(Math.hypot(from.x-goal.x,from.y-goal.y) < .01);
  checks += 4;
}
assert.equal(isWalkable('town',900,390),false);
assert.equal(isWalkable('farm',365,460),false);
assert.equal(isWalkable('lab',660,485),false);
assert.equal(isWalkable('nursery',685,485),false);
assert.equal(isWalkable('town',619,585),true);
assert.equal(isWalkable('farm',218,562),true);
assert.equal(isWalkable('farm',NaN,500),false);
assert.equal(segmentIsWalkable('farm',{x:218,y:562},{x:1110,y:562}),false);
assert.deepEqual(planGardenRoute('farm',{x:218,y:562},{x:218,y:562}),[]);
checks+=9;
console.log(`Navigation and collision checks passed (${checks} assertions).`);
