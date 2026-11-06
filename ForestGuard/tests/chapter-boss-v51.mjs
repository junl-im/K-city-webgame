import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=source.indexOf('    startMoleBurrow(e){');
const end=source.indexOf('    updateBosses(dt){',start);
assert.ok(start>0&&end>start,'Independent chapter boss abilities must exist');
const banners=[];
globalThis.window={matchMedia:()=>({matches:false})};
const V={trigger(){return true},duration(){return 390}};
const Fight=new Function('V','renderHUD','showBanner',
  'return class ChapterBossFight {'+source.slice(start,end)+'}')(
  V,()=>{},msg=>banners.push(msg));

function node(x,y){return {x,y,active:true,alpha:1,setDepth(){return this},
  setAlpha(v){this.alpha=v;return this},setStrokeStyle(){return this},
  setDisplaySize(){return this},destroy(){this.active=false}};}
function scene(){
  const animations=[];
  const fight=Object.create(Fight.prototype);
  Object.assign(fight,{enemies:[],ended:false,gameClock:5000,hp:1000,
    synergies:new Set(),cameras:{main:{shake(){}}},
    add:{ellipse:(x,y)=>node(x,y),image:(x,y)=>node(x,y)},
    tweens:{add:config=>{animations.push(config)}},finish(win){this.ended=true;this.won=win}});
  return {fight,animations};
}

{
  const {fight,animations}=scene();
  const enemy={baseX:80,x:80,y:200,type:'boss',enraged:false,
    spr:node(80,200),life:node(80,180),lifeBg:node(80,180)};
  fight.enemies=[enemy];fight.startMoleBurrow(enemy);
  assert.equal(enemy.untargetable,true);
  assert.equal(enemy.hidden,1250);
  assert.equal(enemy.baseX,320,'Mole must cross to the other lane');
  assert.ok(enemy.burrowMarker.active,'Mole exit warning must remain visible');
  assert.equal(animations.length,4,'Four small finite dirt fragments');
  assert.equal(fight.hp,1000,'Burrowing alone must not damage the fortress');
  fight.finishMoleBurrow(enemy);
  assert.equal(enemy.burrowActive,false);
  assert.equal(fight.hp,962,'Visible emergence applies one base earthquake');
  assert.equal(enemy.burrowMarker,null,'No stale warning ellipse after emerge');
}
{
  const {fight,animations}=scene();
  fight.ringBlackBell({x:200,y:210,enraged:false});
  assert.equal(fight.hp,1000,'The bell must not hit before sound arrives');
  assert.equal(animations.length,3,'Three bounded painted sound waves');
  animations[0].onComplete();animations[1].onComplete();
  assert.equal(fight.hp,1000,'Earlier purple rings are visual, not double damage');
  animations[2].onComplete();
  assert.equal(fight.hp,910,'Final wave applies exactly one bell strike');
}
assert.ok(banners.some(text=>text.includes('가면 두더지')));
assert.ok(banners.some(text=>text.includes('검은 종')));
console.log('ForestGuard v5.1 chapter bosses: burrow / delayed 3-wave bell PASS');
