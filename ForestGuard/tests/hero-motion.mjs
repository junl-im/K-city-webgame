import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../visuals.js',import.meta.url),'utf8');
const noop=()=>{};
const fakeContext=()=>new Proxy({},{
  get(target,key){return key in target?target[key]:noop;},
  set(target,key,value){target[key]=value;return true;}
});
const textures={
  data:new Map(),
  exists(key){return this.data.has(key);},
  get(){return {getSourceImage(){return {};}};},
  addCanvas(key,canvas){this.data.set(key,canvas);}
};
for(const id of ['fox','bear','rabbit','cat'])textures.data.set('hero-'+id,{});
textures.data.set('evo-0',{});
textures.data.set('enemy-sprout',{});
const window={};
const document={createElement(tag){
  assert.equal(tag,'canvas');
  return {width:0,height:0,getContext:fakeContext};
}};
runInNewContext(source,{window,document});
const visuals=window.ForestGuardVisuals;
visuals.build({textures});
const defenders=['fox','megafox','bear','rabbit','cat'];
const states=['idle','run','attack','hurt','victory'];
for(const id of defenders)for(const state of states)for(let f=0;f<6;f++)
  assert.ok(textures.exists('motion-'+id+'-'+state+'-'+f),
    'Missing six-frame painted action: '+id+'/'+state+'/'+f);
for(const state of states){
  assert.ok(textures.exists('motion-sprout-'+state+'-3'));
  assert.equal(textures.exists('motion-sprout-'+state+'-4'),false,
    'Enemy textures should stay at four frames for mobile memory');
}
const sprite={
  active:true,scene:{textures},texture:{key:''},data:new Map(),
  getData(key){return this.data.get(key);},
  setData(key,value){this.data.set(key,value);},
  setTexture(key){this.texture.key=key;}
};
visuals.trigger(sprite,'attack',1465,1000);
for(let f=0;f<6;f++){
  visuals.animate(sprite,'fox','idle',1000+f*75);
  assert.equal(sprite.texture.key,'motion-fox-attack-'+f,
    'Hero attack frames must progress from windup to release');
}
visuals.animate(sprite,'fox','idle',1470);
assert.match(sprite.texture.key,/^motion-fox-idle-/);
assert.ok(!source.includes('<svg')&&!source.includes('data:image/svg+xml'));
console.log('ForestGuard five hero 6-frame action sets and 4-frame enemy fallback: PASS');
