import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const snippet=(start,end)=>{
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>0&&b>a,'Method boundary not found: '+start);
  return src.slice(a,b);
};
const warningMessages=[];
const MockTerrain=new Function('showBanner',
  'return class TerrainTest {'+snippet('    tickTerrain(dt){','    updateBosses(dt){')+'}')(
  message=>warningMessages.push(message));
const variants=[
  {id:5,name:'bridge',types:[{type:'runner',x:220,y:360,rooted:0}],assert(s){
    assert.equal(s.enemies[0].rooted,1250);
    assert.equal(s.damageDone,48);
  }},
  {id:6,name:'spores',types:[{type:'runner',x:220,y:350,surge:0},{type:'imp',x:120,y:200,surge:0},{type:'boss',x:150,y:140,surge:0}],assert(s){
    assert.equal(s.enemies[0].surge,680);assert.equal(s.enemies[1].surge,680);assert.equal(s.enemies[2].surge,0);
  }},
  {id:9,name:'crystal',types:[{type:'crystal',x:200,y:220,armor:.34,crystalShatterUntil:0}],assert(s){
    assert.equal(s.enemies[0].crystalShatterUntil,52600);
    assert.ok(Math.abs(s.enemies[0].armor-.19)<.001);
  }}
];
for(const variant of variants){
  const e=variant.types.map(v=>({...v,untargetable:false,maxHP:300,hp:300}));
  const s=Object.create(MockTerrain.prototype);
  Object.assign(s,{terrainConfig:{interval:variant.id===5?16500:variant.id===6?18000:18500},
    terrainTimer:1150,terrainWarned:false,terrainWarning:false,terrainEvents:0,
    terrainCueUntil:0,terrainCueText:'',stage:{id:variant.id},gameClock:50000,
    enemies:e,wave:{active:true,current:3},visuals:[],damageDone:0,
    syncBattleOverlay(){},
    terrainVisual(kind){this.visuals.push(kind);},
    hitEnemy(target,damage,kind){assert.equal(kind,'terrain');target.hp-=damage;this.damageDone+=damage;}
  });
  s.tickTerrain(1);
  assert.equal(s.terrainEvents,0,'Pre-event warning must not execute immediately');
  assert.equal(s.terrainWarning,true,'Event announced');
  assert.ok(s.terrainCueText.includes('발동'));
  s.tickTerrain(1149);
  assert.equal(s.terrainEvents,1,'Terrain action exactly once');
  assert.equal(s.terrainTimer,s.terrainConfig.interval);
  assert.equal(s.terrainWarning,false);
  assert.equal(s.visuals.length,1,'One visual cue');
  variant.assert(s);
  s.wave.current=1;s.tickTerrain(10000);
  assert.equal(s.terrainEvents,1,'No hazard before recruitment');
}
assert.equal(warningMessages.length,6);
const hudSnippet=snippet('    syncBattleOverlay(){','    terrainVisual(');
const dom=new Map(), box=key=>{
  if(!dom.has(key))dom.set(key,{hidden:true,className:'',textContent:'',
    style:{},attrs:{},setAttribute(key,value){this.attrs[key]=value},
    classList:{states:{},toggle(key,on){this.states[key]=on}}});
  return dom.get(key);
};
const BossHud=new Function('$','return class HudTest {'+hudSnippet+'}')(box);
const view=Object.create(BossHud.prototype);
Object.assign(view,{stage:{id:3},enemies:[],terrainConfig:null,gameClock:0,terrainCueUntil:0});
view.syncBattleOverlay();assert.equal(box('boss-hud').hidden,true);
const boss={type:'boss',hp:840,maxHP:1400,warning:900,untargetable:false};
view.enemies=[boss];view.syncBattleOverlay();
assert.equal(box('boss-hud').hidden,false);
assert.equal(box('boss-role').textContent,'최종 보스');
assert.equal(box('boss-bar').style.width,'60%');
assert.equal(box('boss-meter').attrs['aria-valuenow'],'840');
assert.match(box('boss-warning-note').textContent,/공격 예고/);
view.enemies=[];view.syncBattleOverlay();assert.equal(box('boss-hud').hidden,true);
console.log('ForestGuard stage terrain + boss HUD behavior: PASS');
