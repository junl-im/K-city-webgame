import assert from 'node:assert/strict';
import {surfaceTextureBounds,stageMaterialForEverydayLesson} from './surface-materials.mjs';

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
