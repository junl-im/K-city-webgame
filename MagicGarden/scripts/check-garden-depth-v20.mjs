import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FOREGROUND_PAINTINGS, foregroundDepth,footDepth,foregroundMotion} from '../src/garden-depth.ts';
import {isWalkable} from '../src/garden-navigation.ts';
const source=readFileSync('src/main.ts','utf8');
let checks=0;
for(const zone of ['town','farm','lab','nursery']){
 const arr=FOREGROUND_PAINTINGS.filter(p=>p.zone===zone);
 assert.ok(arr.length>=2,'Each zone needs nearby painted foreground details: '+zone);checks++;
 for(const p of arr) {
  assert.ok(p.x>=70&&p.x<=1210&&p.y>=350&&p.y<=742,'Sprite anchored inside the world');checks++;
  assert.ok(p.size>=35&&p.size<=65,'Foreground cluster size must stay unobtrusive');checks++;
  assert.ok(p.opacity>=.65&&p.opacity<=.9,'Keep original soft watercolor opacity');checks++;
  assert.ok(Math.abs(foregroundDepth(p)-p.y)<=3,'Y depth follows ground-contact point');checks++;
  const staticPose=foregroundMotion(p,1000,true);
  assert.equal(staticPose.rotation,0,'Reduced-motion support');checks++;
  const animatedPose=foregroundMotion(p,1000,false);
  assert.ok(animatedPose.opacity>=.6&&animatedPose.opacity<=.92);checks++;
 }
}
const front=FOREGROUND_PAINTINGS[0];
assert.ok(foregroundDepth(front)>footDepth(front.y-15)&&foregroundDepth(front)<footDepth(front.y+15),'Fox moves behind a nearby plant then in front');checks++;
assert.ok(source.includes("objects.addChild(sprite);\n      foregroundItems.push"),'Foreground paintings share fox sorting plane');checks++;
assert.ok(source.includes("sprite.eventMode='none'"),'Foreground must never block pointer taps');checks++;
assert.ok(source.includes("foregroundItems) item.sprite.visible=item.anchor.zone===next"),'Old-region sprites hidden');checks++;
assert.ok(source.includes("foregroundMotion(anchor,clock,prefersReducedMotion)"),'Motion only respects device setting');checks++;
assert.ok(!source.includes('gate.zIndex = 10_000')&&!source.includes('station.zIndex = 10_001'),'Signboards must not float above everything');checks++;
assert.ok(source.includes("foregroundDepth(anchor)"),'Every foreground raster uses ground depth');checks++;
assert.ok(source.includes("ambientUpdateElapsed>=50"),'No additional per-frame loop or download');checks++;
assert.ok(!readFileSync('src/garden-depth.ts','utf8').includes('data:image/svg'),'Raster-only art contract');checks++;
console.log('v20 depth-aware hand-painted foliage and signs: '+checks+' checks passed.');
