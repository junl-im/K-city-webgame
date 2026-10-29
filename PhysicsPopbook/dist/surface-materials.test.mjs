import assert from 'node:assert/strict';
import {surfaceTextureBounds,stageMaterialForEverydayLesson,inclineStandGeometry,paintPendulumMount} from './surface-materials.mjs';

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

const penCalls=[];
const mockCanvas=new Proxy({},{
  get(target,key){
    if(key in target)return target[key];
    if(key==='createLinearGradient')return ()=>({addColorStop(){}});
    return (...args)=>{penCalls.push([key,...args]);};
  },
  set(target,key,value){target[key]=value;return true;}
});
assert.equal(paintPendulumMount(mockCanvas,null,-18,-176),true);
const woodSupports=penCalls.filter(call=>call[0]==='roundRect');
assert.ok(woodSupports.length>=3,'Pendulum rack needs post, overhead beam and shelf foot');
assert.ok(woodSupports.some(call=>call[2]<=-220&&call[2]+call[4]>215),
  'Vertical post must visibly reach the stage top');
assert.ok(penCalls.some(call=>call[0]==='arc'&&call[1]===-18&&call[2]===-176),
  'Metal hinge must be centered exactly at the physical pivot');
