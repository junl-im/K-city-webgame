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
 script=script.replace(marker,' window.__simulateAdventureImpactForTest=(hit)=>{const b=game.blocks.find(v=>v.hp>20);game.phase="flying";game.shotBaseline={foes:game.foes.filter(f=>f.alive).length,blockHp:game.blocks.reduce((a,v)=>a+Math.max(0,v.hp),0),blockCounts:["wood","stone","iron"].map(t=>game.blocks.filter(v=>v.type===t).length),playerHp:game.playerHp,aiHp:game.aiHp};if(hit&&b)b.hp-=12;game.lastImpact={x:840,y:410};game.projectiles=[];finishFlight();return game.hitStreak;}; window.__damageDuelForTest=(owner)=>{const x=owner==="ai"?1018:190;applyExplosion({x,y:terrainY(x)-29,weapon:"normal"});return game.popups.at(-1);}; window.__weaponSocketForTest=(hero,owner="player")=>{const before=game.hero;game.hero=hero;const p=muzzleFor(owner,game.angle);game.hero=before;return p;}; window.__spawnFollowPopupForTest=()=>{const f=game.foes.find(x=>x.alive);spawnCombatPopup(f,"-17","blast");return {x:f.x,y:f.y};}; window.__moveFollowTargetForTest=(dx)=>{const f=game.foes.find(x=>x.alive);M.Body.setPosition(f.body,{x:f.body.position.x+dx,y:f.body.position.y});}; window.__materialHitForTest=()=>{const b=game.blocks.find(v=>v.type==="wood"&&v.hp>20);const pre=damageTier(b);markBlockImpact(b,pre,27);return {x:b.body.position.x,y:b.body.position.y};};  window.__moveMaterialForTest=(dx)=>{const b=game.blocks.find(v=>v.type==="wood"&&v.hp>20);M.Body.setPosition(b.body,{x:b.body.position.x+dx,y:b.body.position.y});};  window.__finishForTest=showResult; window.__hitFoeForTest=(damage)=>{const f=game.foes.find(x=>x.alive);if(!f)return;f.hp-=damage;f.hitAnim=.64;f.hitFlash=.3;f.attackAnim=0;if(f.hp<=0)defeatFoe(f);}; window.__damageBlockForTest=(damage)=>{const b=game.blocks.find(x=>x.type===\'wood\');if(!b)return -1;const prev=damageTier(b);b.hp-=damage;markBlockImpact(b,prev,damage);return damageTier(b);}; requestAnimationFrame(frame);\n})();');
}
new Function(script);
assert(!html.includes('<svg')&&!html.includes('.svg')&&!html.includes('image/svg+xml'),'No SVG assets or inline SVG permitted');
assert(html.includes('Artillery_Illustrated_UI_v1_1.png'),'The painted v1.1 UI atlas should be referenced');
assert(html.includes('Artillery_Combat_Poses_v1_2.png'),'The transparent combat pose atlas should be referenced');
assert(html.includes('first-screen viewport-fit redesign'),'Entry menu must have viewport fit rules');
assert(html.includes('bear:-1,rabbit:1,cat:-1'),'Hero art must map intrinsic left/right facing');
assert(html.includes('if((f.kind||0)===0)ctx.scale(-1,1)'),'Acorn guardian should face attacking player');
assert(html.includes('Illustrated Canvas 2D projectile silhouettes'),'Projectile renderer should contain hero-specific artwork');
assert(html.includes('scenery-integrated title'),'First screen should use transparent scenery-integrated game UI');
assert(html.includes('CannonTale v1.8: illustrated menu'),'Scenic fantasy homepage needs active CSS');

assert(html.includes('v2.0.2 -- real illustrated HUD buttons'),'Full illustrative HUD should replace generic CSS buttons');
for(const name of [
 'hud_fire_ready.webp','hud_fire_charge.webp','hud_fire_pressed.webp','hud_fire_disabled.webp',
 'hud_ability_ready.webp','hud_ability_used.webp','hud_view_ready.webp',
 'hud_weapon_normal.webp','hud_weapon_bomb.webp','hud_weapon_split.webp'
]){
 assert(html.includes('art/'+name),'Every illustrated HUD state must reference the actual '+name+' asset');
}
assert(html.includes('#controls #fire.charging')&&html.includes('hud_fire_charge.webp'),
 'Holding the FIRE button should show its dedicated charging artwork');
assert(html.includes('#controls #fire.recent-shot')&&html.includes('hud_fire_pressed.webp'),
 'A freshly fired shell needs visibly different pressed artwork');
assert(html.includes('#controls #fire:disabled')&&html.includes('hud_fire_disabled.webp'),
 'Disabled FIRE must use its original monochrome drawing');
assert(html.includes('#controls .weapon[data-weapon="split"]'),
 'Split and bomb projectile selections must have distinct artwork selectors');


assert(html.includes('<picture class="ct-home-scene"'),'Home must actually render a responsive PC/mobile artwork picture');
assert(html.includes('srcset="art/home_mobile_v2.webp"'),'Portrait must load the prepared vertical background art');
assert(html.includes('src="art/home_pc_v2.webp"'),'Landscape must load the prepared horizontal background art');
for(const asset of ['title_logo.png','mode_adventure.png','mode_duel.png','hero_chooser.png','stage_chooser.png']){
 assert(html.includes('art/'+asset),'Home must use the real original hand-painted '+asset+' instead of CSS-only placeholders');
}
assert(html.includes('#menu #welcomeTitle .menu-logo-main'),'Artwork title must visually replace duplicate text');
assert(html.includes('#menu .mode-card>*')||html.includes('#menu .mode-card>*{'),'Painted mode button labels must not double-render underneath the PNG text');
assert(html.includes('#menu.overlay[hidden]{display:none!important}'),'Home overlay must not block gameplay after mode start');
assert(html.includes('.app:has(#menu:not([hidden])) .top'),'Top HUD must disappear only while main menu is open');

assert(html.includes('menu-logo-main')&&html.includes('캐논테일'),'New illustrated game title must remain visible');
assert(html.includes('background-image:var(--stage-art)'),'Reuse existing project scenery atlases for home background');
assert(html.includes('grid-template-areas:"title" "art" "mode"'),'Mobile home must arrange illustrated content into a single viewport');
assert(html.includes('game.mode===\'duel\'?2.45:2.85'),'Post-impact countdown must be shortened');
assert(html.includes('v1.8 combat HUD'),'Combat controls should share fantasy illustration styling');
assert(html.includes('v1.9 selected-hero information'),'Hero choices need visible real skill descriptions');
assert(html.includes('v1.9 -- end-of-battle'),'Battle outcome art must use existing illustrations');
assert(html.includes('#controls #fire.charging'),'Charging state must stay visually distinct from ready and fired');
assert(html.includes('#stageMap .stage-tile.selected'),'Stage selection needs a highlighted illustrated tile');
assert(html.includes('#result .result-panel'),'End-of-battle should share the fantasy parchment theme');
assert(html.includes('id="adventureBtn"')&&html.includes('id="duelBtn"'),'Illustrated mode buttons must keep interactive IDs');
assert(!/<svg|image\/svg\+xml/.test(html),'CannonTale must stay SVG-free');
assert(html.includes("duelPilot(pilot,x-dir*42"),'Duel must use independent crew portraits rather than full handheld weapon figures');
assert(html.includes('const transition=attacking?'),'Authored foe attack/idle poses must blend through phase transitions');
assert(html.includes('const heroMotionKeys={'),'All four heroes require independently timed six-step recoil');
assert(html.includes('function drawChargeReadiness()'),'Charging should show an in-world muzzle effect');
assert(html.includes('function refreshHeroPreview()'),'Main hero artwork should respond to selection');
assert(html.includes("'player',900"),'Predicted range must sample full high-angle trajectory');
assert(/#menu \.menu-panel\{[^}]*overflow:hidden/.test(html),'Menu must not scroll off screen');
assert(html.includes('grid-template-areas:"eyebrow modes"'),'Landscape layout must use 2-column design');
const handlers={};
const elements=new Map();
const noOp=()=>{};
let imageDrawCalls=0,mediumTrajectoryStrokes=0,duelPilotDrawCalls=0,previewDraws=[],badgeDraws=[];
const ctx=new Proxy({}, {get:(obj,key)=>key==='createLinearGradient'?()=>({addColorStop:noOp}):key==='measureText'?text=>({width:String(text).length*11}):key==='drawImage'?(...args)=>{imageDrawCalls++;if(args.length===9&&args[7]===52&&args[8]===56)duelPilotDrawCalls++;}:key==='stroke'?()=>{if(obj.strokeStyle==='#f4e6b9b0'&&obj.lineWidth>=3&&obj.lineWidth<=5)mediumTrajectoryStrokes++;}:key==='clearRect'||key==='save'||key==='restore'||key==='translate'||key==='setTransform'||key==='beginPath'||key==='moveTo'||key==='lineTo'||key==='stroke'||key==='fill'||key==='ellipse'||key==='arc'||key==='roundRect'||key==='fillRect'||key==='fillText'||key==='strokeText'||key==='closePath'||key==='scale'||key==='rotate'||key==='rect'||key==='clip'||key==='bezierCurveTo'?noOp:obj[key],set:(obj,k,v)=>(obj[k]=v,true)});
const previewCtx=new Proxy(ctx,{get:(obj,key)=>key==='drawImage'?(...args)=>previewDraws.push(args):key==='clearRect'?noOp:obj[key]});
function el(id){if(!elements.has(id)){const listeners={},item={id,hidden:false,disabled:false,style:{},value:'',textContent:'',dataset:{},clientWidth:id==='field'?1280:id==='heroPreviewCanvas'?210:0,clientHeight:id==='field'?620:id==='heroPreviewCanvas'?120:0,width:0,height:0,tagName:'DIV',classList:{toggle:noOp},addEventListener(type,fn){listeners[type]=fn;},dispatch(type,event={}){listeners[type]?.({target:item,...event});},click(){this.dispatch('click');},getContext:()=>id==='heroPreviewCanvas'?previewCtx:id.startsWith('heroBadge')?new Proxy(ctx,{get:(obj,key)=>key==='drawImage'?(...args)=>badgeDraws.push({id,args}):obj[key]}):ctx,getBoundingClientRect(){return{left:0,top:0,width:this.clientWidth,height:this.clientHeight};},setPointerCapture:noOp};elements.set(id,item);}return elements.get(id);}
const weapons=['normal','bomb','split'].map(type=>{const b=el('weapon-'+type);b.dataset.weapon=type;return b;});
const heroes=['fox','bear','rabbit','cat'].map(type=>{const b=el('hero-'+type);b.dataset.hero=type;return b;});
const stages=[0,1,2,3].map(type=>{const b=el('stage-'+type);b.dataset.stage=String(type);return b;});
for(const id of ['stageMap','result','help','exitConfirm','enemyEntrance','shotReview'])el(id).hidden=true;
for(const id of ['materialArtwork','combatArtwork']){const art=el(id);art.complete=true;art.naturalWidth=id==='combatArtwork'?1262:1536;art.naturalHeight=id==='combatArtwork'?1246:1024;}
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
function waitForReview(limit=820){
 for(let i=0;i<limit;i++){frames(1);if(state().phase==='review')return;}
 throw Error('Shot review never started');
}
frames(2);
assert.equal(state().mode,'menu');
function assertContainedPreview(hero){
 const args=previewDraws.at(-1);
 assert(args&&args.length===9,'Selected hero must draw a single cropped bitmap cell');
 const [source,sx,sy,sw,sh,dx,dy,dw,dh]=args,preview=el('heroPreviewCanvas');
 assert.equal(sx,hero==='bear'||hero==='cat'?source.naturalWidth/2:0,'Atlas must use only the selected hero half');
 assert.equal(sy,0);
 assert(dx>=0&&dy>=0&&dx+dw<=preview.clientWidth+.01&&dy+dh<=preview.clientHeight+.01,
  'Full character and equipped weapon must fit inside the preview without clipping');
 assert(Math.abs(dw/dh-sw/sh)<.0001,'Hero preview must preserve original body proportions');
}
assertContainedPreview('fox');
assert.equal(badgeDraws.length,4,'Four character faces must be drawn into their dedicated portrait canvases');
for(const shot of badgeDraws){
 assert.equal(shot.args.length,9,'A face portrait uses a cropped source rect');
 const [art,sx,sy,sw,sh]=shot.args;
 assert(sw<art.naturalWidth*.42&&sx>=0&&sx+sw<=art.naturalWidth,'Face crop must stay within a single character cell');
}
assert.equal(el('stageShotPreview').textContent.includes('3발'),true,'First stage is 3 rounds, not global ammo cap');
assert.equal(el('heroPreview').dataset.hero,'fox','Restored selected hero must appear in opening artwork');
el('hero-cat').click();
assert.equal(el('heroPreview').dataset.hero,'cat','Selecting cat must change main illustration');
assert(el('heroPreviewWeapon').textContent.includes('지팡이'),'Hero preview must match actual cat weapon');
assert(el('heroPreviewSkill').textContent.includes('발사 전 · 바람 전환'),'Cat skill preview must match its real pre-shot ability');
assertContainedPreview('cat');
el('hero-rabbit').click();
assert(el('heroPreviewWeapon').textContent.includes('분열 발사기'),'Rabbit preview weapon should match projectiles');
assert(el('heroPreviewSkill').textContent.includes('비행 중 · 오중 분열'),'Rabbit skill preview must match the mid-flight split');
assertContainedPreview('rabbit');
el('hero-fox').click();
assert.equal(el('heroPreview').dataset.hero,'fox','Hero can be switched back without reload');assertContainedPreview('fox');
el('hero-bear').click();assertContainedPreview('bear');
el('hero-fox').click();
el('heroPreviewCanvas').clientWidth=120;el('heroPreviewCanvas').clientHeight=52;frames(3);
assertContainedPreview('fox');
el('heroPreviewCanvas').clientWidth=210;el('heroPreviewCanvas').clientHeight=120;frames(3);
assertContainedPreview('fox');
el('adventureStage').value='3';el('adventureStage').dispatch('change');
assert(el('stageShotPreview').textContent.includes('5발'),'Boss stage must preview five shots');
assert.equal(el('menu').dataset.stage,'3','Boss stage selection must update scenic home artwork');
el('adventureStage').value='0';el('adventureStage').dispatch('change');
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
assert.equal(state().hitStreak,0,'Starting a new game must clear hit streak');
window.__materialHitForTest();
const materialPopupStart=state().popupPositions.at(-1);
assert(materialPopupStart.value.startsWith('-'),'Wood hit must produce material-specific damage number');
window.__moveMaterialForTest(44);frames(2);
const materialPopupMoved=state().popupPositions.at(-1);
assert(materialPopupMoved.x>materialPopupStart.x+15,'Wood damage number should follow physics body position');
const socketFox=window.__weaponSocketForTest('fox');
const socketCat=window.__weaponSocketForTest('cat');
const socketBear=window.__weaponSocketForTest('bear');
const socketRabbit=window.__weaponSocketForTest('rabbit');
assert(socketFox.x!==socketRabbit.x&&socketCat.y<socketFox.y&&socketBear.weapon==='cannon',
 'Every hero muzzle must follow its own hand or weapon socket');
window.__spawnFollowPopupForTest();
const popupBefore=state().popupPositions.at(-1);
window.__moveFollowTargetForTest(32);frames(3);
const popupAfter=state().popupPositions.at(-1);
assert(popupAfter.x>popupBefore.x+12,'Floating damage must follow a knocked-back enemy');
assert(popupAfter.y<popupBefore.y+32,'Damage must stay near the moving enemy');
assert(el('distanceValue').textContent.includes('예상'),'Angle-based predicted distance must be present');
const oldAngle=Number(el('angle').value);
el('field').dispatch('pointerdown',{pointerId:12,clientX:650,clientY:290});
el('field').dispatch('pointermove',{pointerId:12,clientX:655,clientY:210});
el('field').dispatch('pointerup',{pointerId:12,clientX:655,clientY:210});
assert(Number(el('angle').value)>oldAngle,'Upward dragging on battlefield must increase angle');
el('angle').value='43';el('angle').dispatch('input');
assert(mediumTrajectoryStrokes>0,'Medium-contrast aiming trajectory should actually render');
assert.equal(state().materialReady,true,'The 3-stage material atlas must load');
assert.equal(state().combatReady,true,'All four new enemies must have distinct bitmap battle poses');
assert(state().foePoses.every(p=>p==='idle'),'Enemies should begin in their idle pose');
assert.equal(state().materialTiers.length,4,'Each fortress piece must have a material tier');
assert.equal(state().introVisible,true,'The painted enemy encounter must appear briefly');
frames(600);
assert.equal(state().foes,2,'Adventure structures must remain stable before the first shot');
assert.equal(state().introVisible,false,'Enemy intro must auto-dismiss to free the combat viewport');
assert(state().foeAttacks>=1,'Idle enemies must show their threatening attack animation');
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
let peakRotated=0,peakBlasts=0;
for(let i=0;i<820;i++){frames(1);peakRotated=Math.max(peakRotated,state().rotatingBlocks||0);peakBlasts=Math.max(peakBlasts,state().blastCores||0);if(state().phase==='review')break;}
assert.equal(state().shots,1);
assert(peakBlasts>0,'v0.9 projectile impact must create animated blast cores');
assert.equal(state().phase,'review','Adventure should hold the impact instead of returning to the launcher');
assert.equal(state().reviewVisible,true,'The impact review ribbon must remain visible');
assert.equal(el('reviewCountdown').hidden,false,'Count number must show before transition');
assert(Number(el('reviewCountdown').textContent)>0,'Countdown must show positive integer');
assert(Number.isFinite(state().reviewFocusX),'The camera should retain a real impact focus');
assert(el('reviewTitle').textContent.length>0,'Shot outcome must be summarized');
assert(state().rubbleCount>=0,'The review must preserve its rubble state safely');
assert(state().foePoses.every(p=>['idle','attack','hurt','death'].includes(p)),'Every enemy animation state must be defined');
frames(125);
assert.equal(state().phase,'review','Adventure impact should remain visible until player confirmation');
if(state().foes>0 && state().shots<state().maxShots){
 assert.equal(el('angle').disabled,false,'Angle slider must be operable after first shot');
 assert.equal(el('power').disabled,false,'Power slider must be operable after first shot');
 assert.equal(el('fire').disabled,false,'Fire button must be operable after first shot');
 assert.equal(el('weapon-normal').disabled,false,'Ammo selectors must be operable after first shot');
}
el('reviewContinue').click();
assert(['aim','result'].includes(state().phase),'Confirming review returns to aim or mission result');
assert.equal(state().reviewVisible,false,'Review ribbon should close after confirmation');
if(/v0_[234567]/.test(versionedPath))assert(peakRotated>0,'Explosion should rotate at least one structure piece');
el('homeBtn').click();
// A quick touch must reuse the previous power; it must not default to 20%.
el('adventureBtn').click();frames(3);
const savedTapPower=Number(el('power').value);
el('fire').dispatch('pointerdown',{pointerId:66,button:0});
frames(3);
el('fire').dispatch('pointerup',{pointerId:66});
assert.equal(state().shots,1,'Quick tap must fire exactly one projectile');
assert.equal(Number(el('power').value),savedTapPower,'Quick tap must preserve previous power');
el('fire').click();
assert.equal(state().shots,1,'Synthetic click after quick tap must not fire twice');
el('homeBtn').click();
// Hold to charge power; release must fire exactly one projectile even when click follows.
el('adventureBtn').click();frames(3);
el('field').clientWidth=390;el('field').clientHeight=355;frames(3);
el('fire').dispatch('pointerdown',{pointerId:7,button:0});
assert.equal(el('chargeGauge').hidden,false,'Hold should reveal illustrated charge meter');
assert.equal(state().heroMotionFrame,-1,'Holding FIRE must put hero into charge pose');
frames(60);
assert(Number.isFinite(state().chargeAimX),'Charging must track the predicted landing x');
assert(state().camera>25,'Narrow-screen camera must pan toward predicted impact while FIRE is held');
assert(Number(el('fireLabel').textContent.replace(/[^0-9]/g,''))>20,'Charge should rise while holding');
el('fire').dispatch('pointerup',{pointerId:7});
assert.equal(state().shots,1,'Releasing a charged button must fire');
assert.equal(state().heroMotionFrame,0,'Weapon launch starts six-stage attack motion');
frames(9);
assert(state().heroMotionFrame>=1&&state().heroMotionFrame<=5,'Attack frames must advance during recoil animation');
el('fire').click();
assert.equal(state().shots,1,'Synthetic click after pointerup must never double-fire');
assert.equal(el('chargeGauge').hidden,true,'Power meter closes when launched');
el('field').clientWidth=1280;el('field').clientHeight=620;frames(3);
el('homeBtn').click();
// Mobile interruptions must cancel charging without dispatching a phantom shot.
el('adventureBtn').click();frames(3);
el('fire').dispatch('pointerdown',{pointerId:29,button:0});
frames(16);
assert.equal(state().chargeActive,true);
handlers.blur();
assert.equal(state().chargeActive,false,'Blur must disarm an interrupted charge');
el('fire').dispatch('pointerup',{pointerId:29});
el('fire').click();
assert.equal(state().shots,0,'Blur must suppress follow-up synthetic click');
el('fire').dispatch('pointerdown',{pointerId:30,button:0});
frames(9);
handlers.resize();
assert.equal(state().chargeActive,false,'Screen rotation must disarm an interrupted charge');
el('fire').dispatch('pointerup',{pointerId:30});
el('fire').click();
assert.equal(state().shots,0,'Resizing must not accidentally fire');
el('homeBtn').click();
// Regression: first shot must not require another outcome-button tap to enable the next shot.
el('adventureStage').value='0';
el('adventureBtn').click();frames(4);
el('angle').value='82';el('angle').dispatch('input');
el('power').value='20';el('power').dispatch('input');
el('fire').click();waitForReview();
assert.equal(state().phase,'review','A short first shot should hold its results');
assert.equal(state().foes,2,'Short vertical shot must not end the mission');
assert.equal(el('fire').disabled,false,'Second fire must be enabled');
assert.equal(el('angle').disabled,false,'Angle slider must not stay locked');
assert.equal(el('power').disabled,false,'Power slider must not stay locked');
el('fire').click();
assert.equal(state().shots,2,'Firing should immediately launch the next shot');
assert.equal(state().phase,'flying','Second shot must really fly');
el('homeBtn').click();
// Regression: editing a slider resumes aiming without requiring the result ribbon.
el('adventureBtn').click();frames(4);
el('angle').value='82';el('angle').dispatch('input');
el('power').value='20';el('power').dispatch('input');
el('fire').click();waitForReview();
assert.equal(state().phase,'review');
el('angle').value='67';el('angle').dispatch('input');
assert.equal(state().phase,'aim','Changing angle should return to aiming');
assert.equal(el('fire').disabled,false);
el('fire').click();assert.equal(state().shots,2);
el('homeBtn').click();
if(/v0_[67]/.test(versionedPath)){
 el('adventureBtn').click();frames(3);
 assert.equal(window.__simulateAdventureImpactForTest(true),1,'First hit starts the streak');
 el('reviewContinue').click();assert.equal(state().phase,'aim');
 assert.equal(window.__simulateAdventureImpactForTest(true),2,'Second hit builds the streak');
 assert(el('reviewTitle').textContent.includes('2연속 명중'),'Result should reward the streak');
 el('reviewContinue').click();assert.equal(state().phase,'aim');
 assert.equal(window.__simulateAdventureImpactForTest(false),0,'Miss resets the streak');
 el('homeBtn').click();
 el('adventureBtn').click();frames(3);
 assert.equal(window.__damageBlockForTest(26),1,'Timber must reach painted cracked tier');
 assert.equal(window.__damageBlockForTest(27),2,'Timber must reach painted fractured tier');
 window.__hitFoeForTest(10);
 assert.equal(state().foePoses[0],'hurt','Impact must interrupt attack and show hurt artwork');
 window.__hitFoeForTest(500);
 assert.equal(state().foePoses[0],'death','Defeat must show its own collapse artwork');
 frames(65);
 assert.equal(state().foePoses[0],'death','Defeated pose should persist during the review window');
 frames(320);
 assert(state().rubbleCount>0,'Fallen material shards must remain on the battlefield');
 el('homeBtn').click();
}
if(/v0_[4567]/.test(versionedPath)){
 for(const [stage,foes] of [[1,3],[2,3],[3,2]]){
  el('adventureStage').value=String(stage);
  el('adventureBtn').click();
  frames(600);
  assert.equal(state().stage,stage,'Selected adventure stage should launch');
  assert.equal(state().foes,foes,'Adventure foes should survive until a player shot: stage '+stage);
  if(stage===3){assert.equal(state().bossHp,160);assert.equal(state().maxShots,5);assert(state().materials.iron>=2,'Boss fortification needs iron pieces');}
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
 assert.equal(el('result').dataset.outcome,'won','Victory artwork state should be set');
 assert.equal(el('result').dataset.mode,'adventure','Result art must reflect adventure mode');
 assert.equal(state().savedBest[2],3,'A successful stage must save its best grade');
 assert.equal(state().savedWins,6,'Victory total must increase');
 assert.equal(el('adventureStage').value,'3','The menu must recommend the next stage');
 assert.equal(JSON.parse(saved.get('wind-artillery-progress-v06')).wins,6,'Victory must be persisted to storage');
 el('resultHomeBtn').click();
}
el('duelBtn').click();
frames(4);
assert(duelPilotDrawCalls>=2,'Both duel sides must render cropped pilots without duplicate weapon sprites');
assert.equal(state().mode,'duel');
assert.equal(state().turn,'player');
const popup=window.__damageDuelForTest('ai');
assert.equal(popup.x,1018,'Duel damage must float next to the actual struck AI');
assert(popup.y<590&&popup.y>0,'Duel damage must appear above the character');
assert(state().popupPositions.some(p=>p.x===1018&&p.value.startsWith('-')),'Opponent popup must attach to struck AI');
if(/v0_[4567]/.test(versionedPath))assert.equal(state().difficulty,'hard');
el('fire').click();
assert.equal(state().shots,1);
frames(850);
assert(['aim','result','aiWait','flying','review'].includes(state().phase));
if(state().aiShots>0)assert(['normal','bomb','split'].includes(state().aiWeapon)&&state().aiTactic,'AI should select a tactical projectile');
assert(state().turn==='player'||state().turn==='ai');
const desktop=state();
el('field').clientWidth=390;el('field').clientHeight=355;
frames(5);
assert.deepEqual(state().canvas,[390,355]);
el('overview').click();frames(5);
assert.deepEqual(state().canvas,[390,355]);
el('field').clientWidth=360;el('field').clientHeight=640;frames(5);
assert.deepEqual(state().canvas,[360,640],'Portrait 360x640 canvas must match its container');
el('field').clientWidth=844;el('field').clientHeight=390;frames(5);
assert.deepEqual(state().canvas,[844,390],'Landscape 844x390 canvas must match its container');
assert(html.includes('spawnCollapseFragments(b)'),'Broken blocks should create large independent falling chunks');
assert(html.includes('drawFoeElementalAttack(f,attackSurge)'),'The four monsters should emit state-specific attack FX');
assert(html.includes('shatteredDescription'),'The impact report should list material-specific destruction');
// Post-impact review automatically returns to aiming without a 7-second forced delay.
el('homeBtn').click();
el('adventureStage').value='0';el('adventureBtn').click();frames(3);
el('angle').value='82';el('angle').dispatch('input');
el('power').value='20';el('power').dispatch('input');
el('fire').click();waitForReview();
assert.equal(state().phase,'review','Short-shot impact should open the review overlay');
frames(185);
assert.equal(state().phase,'aim','Review should return to aiming in under about 3 seconds');
assert.equal(el('fire').disabled,false,'FIRE must be active again after automatic result review');
el('homeBtn').click();
// Runtime compact fallback: an unusually short Android web viewport must use compact density.
el('homeBtn').click();
const menuPanelClasses=new Set();
const menuProbe={clientHeight:300,get scrollHeight(){return menuPanelClasses.has('menu-ultra')?280:menuPanelClasses.has('menu-tight')?350:460;},classList:{add:x=>menuPanelClasses.add(x),remove:(...xs)=>xs.forEach(x=>menuPanelClasses.delete(x))}};
document.querySelector=q=>q==='#menu .menu-panel'?menuProbe:null;
el('menu').clientWidth=360;el('menu').clientHeight=500;frames(2);
assert(menuPanelClasses.has('menu-tight')&&menuPanelClasses.has('menu-ultra'),'Very short mobile viewport must engage both compact fallbacks');
menuProbe.clientHeight=500;el('menu').clientHeight=720;frames(2);
assert(!menuPanelClasses.has('menu-tight')&&!menuPanelClasses.has('menu-ultra'),'Larger viewports must restore illustrated layout');
console.log(JSON.stringify({status:'passed',file:testFile,adventure:'launch + flight + settle',peakRotated,duel:'launch + turn simulation',resize:'390x355',desktop},null,2));
if(/v0_[34567]/.test(versionedPath))assert(imageDrawCalls>0,'The game must render sprite atlas on canvas');
