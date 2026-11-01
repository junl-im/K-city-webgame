import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=src.indexOf('    completeDraft(id,automatic=false){');
const end=src.indexOf('    showDraft(forceReroll=false){',start);
assert.ok(start>0&&end>start,'Timed growth methods must exist');
const messages=[];
const fake={countdown:{textContent:''},fill:{style:{width:''}}};
const dom={visibilityState:'visible'};
const modal={title:'성장의 순간!'};
let closed=0,renders=0;
const Tester=new Function('DRAFT_TIMEOUT','$','document','activeModal','renderHUD','showBanner','closeModal',
  'return class TestGrowth {'+src.slice(start,end)+'}')(
    10000,key=>key==='draft-countdown'?fake.countdown:key==='draft-progress-fill'?fake.fill:null,
    dom,modal,()=>renders++,message=>messages.push(message),()=>closed++);
function newBattle(){
  const s=Object.create(Tester.prototype);
  Object.assign(s,{ended:false,pendingRecruit:false,drafting:true,manualPause:false,autoPause:false,
    draftRemaining:10000,draftLastSecond:-1,
    draftChoices:[{id:'power',title:'공격 강화'},{id:'crit',title:'치명타 강화',rare:true},{id:'flame',title:'불꽃 활'}],
    applied:[],betweenWaves:0,comboFor:id=>id==='flame'?'불꽃폭풍':null,applyCard(id){this.applied.push(id)}});
  return s;
}
const a=newBattle();
a.tickDraft(100);assert.equal(a.draftRemaining,9900);
a.manualPause=true;for(let i=0;i<30;i++)a.tickDraft(100);assert.equal(a.draftRemaining,9900);
a.manualPause=false;dom.visibilityState='hidden';a.tickDraft(100);
assert.equal(a.draftRemaining,9900,'Hidden tab cannot advance timed choice');
dom.visibilityState='visible';for(let i=0;i<99;i++)a.tickDraft(100);
assert.deepEqual(a.applied,['flame'],'Auto choice prefers available combo');
assert.equal(a.drafting,false);assert.equal(a.draftChoices,null);
assert.equal(a.betweenWaves,700);assert.equal(closed,1);assert.equal(renders,1);
assert.equal(a.completeDraft('power'),false,'Cannot choose twice');
assert.equal(messages.length,1);
const b=newBattle();assert.equal(b.completeDraft('crit'),true);
assert.deepEqual(b.applied,['crit'],'Manual choice overrides recommendation');
assert.equal(b.draftRemaining,0);assert.equal(b.drafting,false);
assert.match(src,/if\(forceReroll\|\|!this\.draftChoices\)/);
console.log('ForestGuard growth draft timer/manual selection: PASS');
