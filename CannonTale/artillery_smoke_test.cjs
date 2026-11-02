const fs=require('fs');
const assert=require('assert');
const testFile=process.env.ARTILLERY_HTML||'index.html';
const versionedPath=testFile.replace(/index\.html$/,'Artillery_Prototype_v0_7.html');
const html=fs.readFileSync(__dirname+'/'+testFile,'utf8');
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let script=inlineScripts.at(-1)[1];
// Test-only instrumentation: exercise result persistence without adding a public cheat hook to the game.
if(/v0_[67]/.test(versionedPath)){
 const marker=' requestAnimationFrame(frame);\n})();';
 assert(script.includes(marker),'Expected a stable v0.6 boot marker');
 script=script.replace(marker,' window.__finishForTest=showResult; requestAnimationFrame(frame);\n})();');
}
new Function(script);
const handlers={};
const elements=new Map();
const noOp=()=>{};
let imageDrawCalls=0;
const ctx=new Proxy({}, {get:(obj,key)=>key==='createLinearGradient'?()=>({addColorStop:noOp}):key==='measureText'?text=>({width:String(text).length*11}):key==='drawImage'?()=>{imageDrawCalls++;}:key==='save'||key==='restore'||key==='translate'||key==='setTransform'||key==='beginPath'||key==='moveTo'||key==='lineTo'||key==='stroke'||key==='fill'||key==='ellipse'||key==='arc'||key==='roundRect'||key==='fillRect'||key==='fillText'||key==='strokeText'||key==='closePath'||key==='scale'||key==='rotate'?noOp:obj[key],set:(obj,k,v)=>(obj[k]=v,true)});
function el(id){if(!elements.has(id)){const listeners={},item={id,hidden:false,disabled:false,style:{},value:'',textContent:'',dataset:{},clientWidth:id==='field'?1280:0,clientHeight:id==='field'?620:0,width:0,height:0,tagName:'DIV',classList:{toggle:noOp},addEventListener(type,fn){listeners[type]=fn;},dispatch(type,event={}){listeners[type]?.({target:item,...event});},click(){this.dispatch('click');},getContext:()=>ctx,getBoundingClientRect(){return{left:0,top:0,width:this.clientWidth,height:this.clientHeight};},setPointerCapture:noOp};elements.set(id,item);}return elements.get(id);}
const weapons=['normal','bomb','split'].map(type=>{const b=el('weapon-'+type);b.dataset.weapon=type;return b;});
const heroes=['fox','bear','rabbit','cat'].map(type=>{const b=el('hero-'+type);b.dataset.hero=type;return b;});
const stages=[0,1,2,3].map(type=>{const b=el('stage-'+type);b.dataset.stage=String(type);return b;});
for(const id of ['stageMap','result','help','exitConfirm'])el(id).hidden=true;
const document={referrer:'',getElementById:el,querySelectorAll:selector=>selector==='[data-weapon]'?weapons:selector==='[data-hero]'?heroes:selector==='[data-stage]'?stages:[]};
if(/v0_[34]/.test(versionedPath)){const art=el('menuArtwork');art.complete=true;art.naturalWidth=1200;art.naturalHeight=549;}
if(/v0_[567]/.test(versionedPath)){for(const type of ['menuArtwork','rosterArtwork']){const art=el(type);art.complete=true;art.naturalWidth=1200;art.naturalHeight=549;}}
if((versionedPath).includes('v0_7')){const art=el('stageArtwork');art.complete=true;art.naturalWidth=1536;art.naturalHeight=1024;}
if((versionedPath).includes('v0_7')){const art=el('enemyArtwork');art.complete=true;art.naturalWidth=1536;art.naturalHeight=1024;}
const saved=new Map();
if(/v0_[67]/.test(versionedPath))saved.set('wind-artillery-progress-v06',JSON.stringify({best:[3,2,0,0],wins:5,lastStage:0,hero:'fox',difficulty:'normal'}));
const window={Matter:require('./matter.min.js'),addEventListener:(type,fn)=>handlers[type]=fn,history:{replaceState:noOp,pushState:noOp,go:noOp},location:{href:'https://junl-im.github.io/K-city-webgame/CannonTale/',assign:noOp},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,val)=>saved.set(key,val)}};
let callback=null,now=0;
function requestAnimationFrame(fn){callback=fn;}
new Function('document','window','requestAnimationFrame','devicePixelRatio',script)(document,window,requestAnimationFrame,1);
function frames(n){for(let i=0;i<n;i++){now+=1000/60;const run=callback;callback=null;assert(run,'Animation frame not scheduled');run(now);}}
function state(){return window.__artilleryDebug();}
frames(2);
assert.equal(state().mode,'menu');
assert.equal(state().exitOpen,false);
handlers.popstate();assert.equal(state().exitOpen,true,'Browser Back at the menu must request exit');
el('exitStayBtn').click();assert.equal(state().exitOpen,false,'Cancel preserves the menu');
el('helpBtn').click();assert.equal(el('help').hidden,false);
handlers.popstate();assert.equal(el('help').hidden,true,'Back must close Help before leaving');
if(/v0_[67]/.test(versionedPath)){
 assert.deepEqual(state().savedBest,[3,2,0,0]);
 assert.equal(state().savedWins,5);
 assert(el('progressSummary').textContent.includes('승리 5회'),'Saved records should appear on home screen');
}
if((versionedPath).includes('v0_7')){
 assert.equal(state().sceneReady,true,'Stage illustration atlas should render');
 assert.equal(state().enemyReady,true,'Enemy illustration atlas should render');
 el('stageMapBtn').click();assert.equal(state().stageMapOpen,true,'Region map should open');
 handlers.popstate();assert.equal(state().stageMapOpen,false,'Back must dismiss stage map');
 el('stageMapBtn').click();
 assert(el('stageGrade0').textContent.includes('최고 등급 3/3'));
 el('stage-3').click();assert.equal(state().stageMapOpen,false);
 assert.equal(el('adventureStage').value,'3','Selecting map tile changes stage');
 el('stageMapBtn').click();el('stage-0').click();
}
el('adventureBtn').click();
frames(5);
assert.equal(state().mode,'adventure');
handlers.popstate();assert.equal(state().mode,'menu','Back from a running battle returns to the menu');
el('adventureBtn').click();frames(5);
assert.equal(state().foes,2);
assert.equal(state().phase,'aim');
frames(600);
assert.equal(state().foes,2,'Adventure structures must remain stable before the first shot');
if(/v0_[234567]/.test(versionedPath)){
 el('angle').value='28';el('angle').dispatch('input');
 el('power').value='78';el('power').dispatch('input');
 el('weapon-bomb').click();
}
el('fire').click();
assert.equal(state().shots,1);
if(/v0_[67]/.test(versionedPath)){
 assert.equal(state().actorMotion,'attack','The firing hero must enter attack motion');
 assert(state().actorMotionLife>0);
}
let peakRotated=0;
for(let i=0;i<650;i++){frames(1);peakRotated=Math.max(peakRotated,state().rotatingBlocks||0);}
assert.equal(state().shots,1);
assert(['aim','result'].includes(state().phase),'Adventure shot must finish');
if(/v0_[234567]/.test(versionedPath))assert(peakRotated>0,'Explosion should rotate at least one structure piece');
el('homeBtn').click();
if(/v0_[4567]/.test(versionedPath)){
 for(const [stage,foes] of [[1,3],[2,3],[3,2]]){
  el('adventureStage').value=String(stage);
  el('adventureBtn').click();
  frames(600);
  assert.equal(state().stage,stage,'Selected adventure stage should launch');
  assert.equal(state().foes,foes,'Adventure foes should survive until a player shot: stage '+stage);
  if(stage===3){assert.equal(state().bossHp,160);assert.equal(state().maxShots,5);}
  el('homeBtn').click();
 }
 el('duelDifficulty').value='hard';
 el('soundBtn').click();
 assert.equal(state().sound,true);
 el('soundBtn').click();
 assert.equal(state().sound,false);
}
if(/v0_[567]/.test(versionedPath)){
  for(const name of ['fox','bear','rabbit','cat']){
    el('hero-'+name).click();
    el('adventureStage').value='0';
    el('adventureBtn').click();
    frames(3);
    assert.equal(state().hero,name,'Selected hero should start adventure');
    if(name==='cat'){
      const oldWind=state().wind;
      el('abilityBtn').click();
      assert.equal(state().abilityUsed,true);
      assert(Math.abs(state().wind-oldWind)>.1,'Cat ability must change wind');
    }else if(name==='bear'){
      el('abilityBtn').click();
      assert.equal(state().abilityArmed,true);
      el('fire').click();
      assert.equal(state().projectilePierce,2,'Bear shot has two piercing charges');
    }else{
      el('fire').click();frames(3);
      el('abilityBtn').click();
      assert.equal(state().abilityUsed,true,'Flying ability should activate');
      if(name==='rabbit')assert(state().projectiles>=5,'Rabbit makes five projectiles');
    }
    assert.equal(state().abilityCount,1);
    if(/v0_[67]/.test(versionedPath))assert(state().skillEffects>0,'Ability must spawn a character-specific visual effect');
    el('homeBtn').click();
  }
}
if(/v0_[67]/.test(versionedPath)){
 assert.equal(JSON.parse(saved.get('wind-artillery-progress-v06')).hero,'cat','Hero choice must persist');
 assert.deepEqual(state().savedBest.slice(0,2),[3,2],'Prior progress must not be lost');
 el('adventureStage').value='2';el('adventureBtn').click();frames(3);
 window.__finishForTest(true);
 assert.equal(state().savedBest[2],3,'A successful stage must save its best grade');
 assert.equal(state().savedWins,6,'Victory total must increase');
 assert.equal(el('adventureStage').value,'3','The menu must recommend the next stage');
 assert.equal(JSON.parse(saved.get('wind-artillery-progress-v06')).wins,6,'Victory must be persisted to storage');
 el('resultHomeBtn').click();
}
el('duelBtn').click();
frames(4);
assert.equal(state().mode,'duel');
assert.equal(state().turn,'player');
if(/v0_[4567]/.test(versionedPath))assert.equal(state().difficulty,'hard');
el('fire').click();
assert.equal(state().shots,1);
frames(850);
assert(['aim','result','aiWait','flying'].includes(state().phase));
assert(state().turn==='player'||state().turn==='ai');
const desktop=state();
el('field').clientWidth=390;el('field').clientHeight=355;
frames(5);
assert.deepEqual(state().canvas,[390,355]);
el('overview').click();frames(5);
assert.deepEqual(state().canvas,[390,355]);
console.log(JSON.stringify({status:'passed',file:testFile,adventure:'launch + flight + settle',peakRotated,duel:'launch + turn simulation',resize:'390x355',desktop},null,2));
if(/v0_[34567]/.test(versionedPath))assert(imageDrawCalls>0,'The game must render sprite atlas on canvas');
