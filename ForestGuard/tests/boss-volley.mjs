import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const begin=js.indexOf('    sporeVolley(e){'),end=js.indexOf('    updateBosses(dt){',begin);
assert.ok(begin>0&&end>begin,'Boss volley method must be present');
const behavior=js.slice(begin,end);
globalThis.window={matchMedia:()=>({matches:false})};
const state={hud:0,banners:[]};
const Boss=new Function('renderHUD','showBanner','return class BossTest{'+behavior+'}')(
  ()=>state.hud++,text=>state.banners.push(text)
);
function makeScene(fortress=false){
  const enemy={x:210,y:260,type:'shroom'};
  const tweens=[],images=[];
  const b=Object.create(Boss.prototype);
  Object.assign(b,{enemies:[enemy],hp:1000,ended:false,synergies:new Set(fortress?['fortress']:[]),
    cameras:{main:{shake(){}}},
    add:{image(x,y,texture){const obj={x,y,texture,active:true,setDisplaySize(){return this},setDepth(){return this},destroy(){this.active=false}};images.push(obj);return obj},
      ellipse(x,y,width,height){return {x,y,width,height,setStrokeStyle(){return this},setDepth(){return this},destroy(){}}}},
    tweens:{add(config){tweens.push(config)}},finish(){this.ended=true}
  });
  return {boss:b,enemy,tweens,images};
}
for(const fort of [false,true]){
 const {boss,enemy,tweens,images}=makeScene(fort);
 boss.sporeVolley(enemy);
 assert.equal(boss.hp,fort?983:972,'Expected fixed and synergy-adjusted damage');
 assert.equal(images.length,3,'Exactly three illustrated spore missiles');
 assert.equal(tweens.length,3,'Missile visuals must use three bounded tweens');
 assert.ok(images.every(x=>x.texture==='shard-spore'));
 boss.sporeVolley({...enemy});assert.equal(images.length,3,'Removed enemy cannot fire');
 boss.ended=true;boss.sporeVolley(enemy);assert.equal(images.length,3,'Finished scene cannot fire');
}
assert.equal(state.hud,2);
assert.equal(state.banners.length,2);
assert.match(js,/\['boss','guardian','shroom'\]\.includes\(enemy\.type\)/,'Manual volley should interrupt giant');
assert.match(js,/createCanvasTexture\(scene,key,128,128/,'Attack texture remains same dimensions');
console.log('ForestGuard midboss 3-projectile warning and defense: PASS');
