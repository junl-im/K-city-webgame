import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scene=readFileSync('src/main.ts','utf8');
const layout=readFileSync('src/painted-environment.ts','utf8');
const art=readFileSync('public/assets/illustrated-items-v18.webp');
let count=0;
assert.ok(art.toString('ascii',0,4)==='RIFF'&&art.toString('ascii',8,12)==='WEBP','Real painted WebP required');count++;
for(const zone of ['town','farm','lab','nursery']){
 const matches=layout.match(new RegExp("zone:'"+zone+"'","g"))||[];
 assert.ok(matches.length>=4,zone+' must get its own painted world art');count++;
}
assert.ok(scene.includes("Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/illustrated-items-v18.webp`)"),'Shared single raster atlas');count++;
assert.ok(scene.includes("import { PAINTED_AMBIENCE, ambiencePose"),'Environment motion imported');count++;
assert.ok(scene.includes("sprite.eventMode='none'"),'Paintings must never block taps');count++;
assert.ok(scene.includes('if(anchor.zone!==currentZone || !sprite.visible) continue'),'Other zones must not animate');count++;
assert.ok(scene.includes('ambientUpdateElapsed>=50'),'Cap mobile environment updates to 20fps');count++;
assert.ok(scene.includes('if(prefersReducedMotion) return;'),'Reduce motion reward animation');count++;
assert.ok(scene.includes('clearBurstEffects();'),'Remove lingering celebration sprites when changing regions');count++;
const effect=scene.split('function emitBurst(')[1]?.split('const player =')[0];
assert.ok(effect?.includes('new Sprite(texture)')&&!effect.includes('new Graphics()'),'Rewards require real painted art, never vector circles');count++;
const environs=scene.split('// v19: all floating petals')[1]?.split('const objects =')[0];
assert.ok(environs?.includes('new Sprite(texture)')&&!environs.includes('new Graphics()'),'Ambient decorations must be raster sprites');count++;
assert.ok(layout.includes('if(reducedMotion) return'),'Prefers reduced motion must have static frame');count++;
assert.ok(!layout.includes('data:image/svg')&&!layout.includes('<svg'),'No SVG graphics');count++;
console.log('v19 painted environment motion: '+count+' safeguards passed');
