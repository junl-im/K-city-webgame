import assert from 'node:assert/strict';
import { isWalkable, nearestWalkable, planGardenRoute, segmentIsWalkable, routeIsWalkable } from '../src/garden-navigation.ts';
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

let regressionCases = 0;
for (const zone of ['town','farm','lab','nursery']) {
  const starts = zone === 'town' ? [{x:619,y:585},{x:1100,y:500}] : zone === 'farm' ? [{x:218,y:562},{x:1110,y:710}] : [{x:610,y:562},{x:1050,y:600}];
  const targets = [{x:145,y:490},{x:560,y:710},{x:1160,y:400},{x:1010,y:720}];
  for (const start of starts) for (const target of targets) {
    if (!isWalkable(zone,start.x,start.y)) continue;
    const route = planGardenRoute(zone,start,target);
    assert.ok(routeIsWalkable(zone,start,route), `${zone}: crosses obstacle`);
    if (route.length) {
      const end=route.at(-1), goal=nearestWalkable(zone,target);
      assert.ok(isWalkable(zone,end.x,end.y));
      assert.ok(Math.hypot(end.x-goal.x,end.y-goal.y)<.01);
    }
    regressionCases++;
  }
}
assert.equal(routeIsWalkable('farm',{x:218,y:562},[{x:1110,y:562}]),false);
assert.equal(routeIsWalkable('farm',{x:218,y:562},planGardenRoute('farm',{x:218,y:562},{x:1110,y:562})),true);
assert.equal(routeIsWalkable('town',{x:900,y:390},[]),false);
regressionCases+=3;
console.log(`Route continuity regression checks passed (${regressionCases} cases).`);
