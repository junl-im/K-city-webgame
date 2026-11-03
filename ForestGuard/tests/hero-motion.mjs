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
for(const id of ['shroom','guardian'])textures.data.set('enemy-'+id,{});
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
for(const id of defenders)for(const state of states){
  const count=state==='attack'?8:6;
  for(let f=0;f<count;f++)assert.ok(textures.exists('motion-'+id+'-'+state+'-'+f),
    'Missing painted pose: '+id+'/'+state+'/'+f);
  assert.equal(textures.exists('motion-'+id+'-'+state+'-'+count),false);
}
for(const state of states){
  assert.ok(textures.exists('motion-sprout-'+state+'-3'));
  assert.equal(textures.exists('motion-sprout-'+state+'-4'),false,
    'Ordinary enemies should keep four frames for mobile memory');
}
for(const id of ['shroom','guardian'])for(const state of ['attack','hurt']){
  assert.ok(textures.exists('motion-'+id+'-'+state+'-5'));
  assert.equal(textures.exists('motion-'+id+'-'+state+'-6'),false);
}
const sprite={
  active:true,scene:{textures},texture:{key:''},data:new Map(),
  getData(key){return this.data.get(key);},
  setData(key,value){this.data.set(key,value);},
  setTexture(key){this.texture.key=key;}
};
assert.equal(visuals.duration('fox','attack'),520);
visuals.trigger(sprite,'attack',1520,1000);
for(let f=0;f<8;f++){
  visuals.animate(sprite,'fox','idle',1000+f*65);
  assert.equal(sprite.texture.key,'motion-fox-attack-'+f,
    'Hero attack frames must progress from windup to release');
}
visuals.animate(sprite,'fox','idle',1525);
assert.match(sprite.texture.key,/^motion-fox-idle-/);
assert.ok(!source.includes('<svg')&&!source.includes('data:image/svg+xml'));
console.log('ForestGuard five hero 8-beat attacks, elite 6-frame impacts, and mobile fallback: PASS');
