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
for(const id of ['sprout','runner','brute','boss','thorn','crystal','shroom','guardian','spore','imp'])
  textures.data.set('enemy-'+id,{});
const window={};
const document={createElement(tag){
  assert.equal(tag,'canvas');
  return {width:0,height:0,getContext:fakeContext};
}};
runInNewContext(source,{window,document});
const visuals=window.ForestGuardVisuals;
visuals.build({textures});
// A vivid red chroma chip must disappear while warm cloth and magic remain.
const rgba=Uint8ClampedArray.from([
  252,22,16,255, 250,166,50,255, 141,69,60,255, 170,70,55,100, 244,190,181,255
]);
let wrote=false;
const paint={getImageData(){return {data:rgba};},putImageData(){wrote=true;}};
const matte=visuals.cleanAttackFrame(paint,5,1);
assert.deepEqual({...matte},{removed:1,softened:1});
assert.ok(wrote);
assert.equal(rgba[3],0,'Stray pure-red background must vanish');
assert.equal(rgba[7],255,'Orange spell color must remain');
assert.equal(rgba[11],255,'Muted bear scarf must remain');
assert.equal(rgba[15],18,'Semi-transparent red matte must feather');
assert.equal(rgba[19],255,'Rabbit ear pink must remain');
const defenders=['fox','megafox','bear','rabbit','cat'];
const states=['idle','run','attack','hurt','victory'];
for(const id of defenders)for(const state of states){
  const count=state==='attack'?8:6;
  for(let f=0;f<count;f++)assert.ok(textures.exists('motion-'+id+'-'+state+'-'+f),
    'Missing painted pose: '+id+'/'+state+'/'+f);
  assert.equal(textures.exists('motion-'+id+'-'+state+'-'+count),false);
}
for(const state of states){
  const frames=state==='hurt'?5:state==='attack'?6:4;
  for(let f=0;f<frames;f++)assert.ok(textures.exists('motion-sprout-'+state+'-'+f),
    'Ordinary enemy '+state+' frame missing: '+f);
  assert.equal(textures.exists('motion-sprout-'+state+'-'+frames),false,
    'Ordinary enemies must use bounded frames for mobile memory');
}
for(const id of ['shroom','guardian','boss'])for(const state of ['attack','hurt','death']){
  assert.ok(textures.exists('motion-'+id+'-'+state+'-5'));
  assert.equal(textures.exists('motion-'+id+'-'+state+'-6'),false);
}
for(const id of ['sprout','runner','brute','thorn','crystal','spore','imp']){
  assert.equal(visuals.frameTotal(id,'attack'),6);
  assert.equal(visuals.duration(id,'attack'),390);
  assert.equal(visuals.frameTotal(id,'death'),5);
  for(let f=0;f<5;f++)assert.ok(textures.exists('motion-'+id+'-death-'+f),
    'Death texture missing: '+id+'/'+f);
  assert.equal(textures.exists('motion-'+id+'-death-5'),false);
}
assert.equal(visuals.duration('sprout','death'),425);
assert.equal(visuals.duration('shroom','death'),510);
assert.equal(visuals.frameTotal('sprout','hurt'),5);
assert.equal(visuals.frameTotal('shroom','hurt'),6);
assert.equal(visuals.duration('sprout','hurt'),400);
assert.equal(visuals.duration('shroom','hurt'),480);
assert.ok(visuals.enemyAttackOffset(.21,false)<0,
  'An ordinary monster should recoil slightly north during anticipation');
assert.ok(visuals.enemyAttackOffset(.71,false)>0,
  'The release should travel south toward the defending wall');
assert.ok(Math.abs(visuals.enemyAttackOffset(1,true))<.001,
  'Elite attack should settle at its original world position');
assert.equal(visuals.frameTotal('fox','death'),0);
assert.equal(textures.exists('motion-fox-death-0'),false);
assert.match(source,/globalCompositeOperation='destination-out'/,
  'Monster dissolve should cut the painted silhouette without a rectangular flash');
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
assert.equal(sprite.texture.key,'motion-fox-idle-0','Recovery must start at the resting pose');
visuals.animate(sprite,'fox','idle',1705);
assert.equal(sprite.texture.key,'motion-fox-idle-1','Resting frames continue smoothly after recovery');
assert.ok(!source.includes('<svg')&&!source.includes('data:image/svg+xml'));
console.log('ForestGuard v4.6 matte cleanup, chained motion recovery and ten enemy deaths: PASS');
