import assert from 'node:assert/strict';
import {surfaceTextureBounds,stageMaterialForEverydayLesson,inclineStandGeometry} from './surface-materials.mjs';

const materialNames=['felt','ice','wood','soil'];
const cells=materialNames.map(name=>surfaceTextureBounds(1254,1254,name));
for(const c of cells){
  assert.ok(c.sx>=0&&c.sy>=0&&c.sw>0&&c.sh>0);
  assert.ok(c.sx+c.sw<=1254&&c.sy+c.sh<=1254);
}
assert.ok(cells[0].sx<627&&cells[0].sy<627);
assert.ok(cells[1].sx>=627&&cells[1].sy<627);
assert.ok(cells[2].sx<627&&cells[2].sy>=627);
assert.ok(cells[3].sx>=627&&cells[3].sy>=627);
assert.throws(()=>surfaceTextureBounds(1254,1254,'moon'));
assert.throws(()=>surfaceTextureBounds(0,0,'wood'));
assert.equal(stageMaterialForEverydayLesson('friction','ice'),'ice');
assert.equal(stageMaterialForEverydayLesson('friction','rough'),'felt');
assert.equal(stageMaterialForEverydayLesson('pendulum','earth'),'felt');
assert.equal(stageMaterialForEverydayLesson('heat','200'),'wood');

for(const degrees of [10,15,20,25,30,35,40]){
  const angle=degrees*Math.PI/180,dy=240*Math.sin(angle);
  const stand=inclineStandGeometry({x0:-240*Math.cos(angle),y0:22-dy,
    x1:240*Math.cos(angle),y1:22+dy});
  assert.equal(stand.centerX,0,'Support stays directly beneath the incline midpoint');
  assert.ok(Math.abs(stand.centerY-22)<1e-10);
  assert.ok(stand.postTop<stand.centerY+30,'Top of post overlaps the ramp underside');
  assert.ok(stand.postBottom>=215,'Post reaches the floor');
  assert.ok(stand.footTop<=215&&stand.footTop+stand.footHeight>215,
    'Foot visibly rests across the shelf surface');
}
