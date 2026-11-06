import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=source.indexOf('    sendForestSpear(e){');
const end=source.indexOf('    updateBosses(dt){',start);
assert.ok(start>0&&end>start,'Chapter 1 boss and sentinel need unique attacks');
globalThis.window={matchMedia:()=>({matches:false})};
let renderCount=0;
const banners=[];
const Battle=new Function('renderHUD','showBanner',
  'return class ChapterOneBattle {'+source.slice(start,end)+'}')(
  ()=>{renderCount++;},msg=>banners.push(msg));

function effect(){return {active:true,setDisplaySize(){return this},setAngle(){return this},
  setAlpha(){return this},setDepth(){return this},destroy(){this.active=false}};}
function stageFight(){
  const fight=Object.create(Battle.prototype),tweens=[],effects=[];
  Object.assign(fight,{hp:1000,ended:false,synergies:new Set(),
    cameras:{main:{shake(){}}},
    add:{image(){const e=effect();effects.push(e);return e;}},
    tweens:{add(value){tweens.push(value);}},
    finish(win){this.ended=true;this.won=win;}});
  return {fight,tweens,effects};
}
{
  const {fight,tweens,effects}=stageFight();
  fight.sendForestSpear({x:160,y:220});
  assert.equal(tweens.length,1,'Sentinel launches one visible painted spear');
  assert.equal(fight.hp,1000,'Spear must not deal invisible pre-impact damage');
  tweens[0].onComplete();
  assert.equal(fight.hp,955,'Spear hits once and only after crossing the field');
  assert.equal(effects[0].active,false,'Spear illustration is disposed after the strike');
}
{
  const {fight,tweens,effects}=stageFight();
  const boss={x:150,y:240,enraged:false};
  fight.rootCrownCharge(boss);
  assert.equal(tweens.length,3,'Root giant attacks with a three-lane visible formation');
  assert.equal(boss.surge,1100,'Root giant retains a bounded dash');
  assert.equal(fight.hp,1000,'Root attacks must wait until vines touch the rampart');
  tweens[0].onComplete();tweens[1].onComplete();
  assert.equal(fight.hp,1000,'First two warning vines are visual, not extra strikes');
  tweens[2].onComplete();
  assert.equal(fight.hp,945,'Final root strike damages exactly once');
  assert.ok(effects.every(item=>!item.active),'Root spears must be cleaned up');
}
{
  const {fight,tweens}=stageFight();
  fight.rootCrownCharge({x:210,y:230,enraged:true});
  tweens[2].onComplete();
  assert.equal(fight.hp,925,'Enraged roots raise damage but not impact count');
}
{
  const {fight,tweens}=stageFight();
  fight.synergies.add('fortress');
  fight.rootCrownCharge({x:210,y:230,enraged:true});
  tweens[2].onComplete();
  assert.equal(fight.hp,968,'Defensive synergy mitigates enraged root damage');
}
assert.equal(renderCount,4,'Only completed single impacts update the fortress HUD');
assert.ok(banners.some(s=>s.includes('가시창'))&&banners.some(s=>s.includes('뿌리창')));
console.log('ForestGuard v5.2 Chapter 1: sentinel spear / staged root crown / mitigation PASS');
