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
assert(script.includes(' window.__artilleryLoadoutDebug='),'Duel diagnostics hook must be present');
script=script.replace(' window.__artilleryLoadoutDebug=',
 ' window.__forceAiHeroForTest=(hero)=>{game.aiHero=hero;}; window.__forceAiAttackForTest=()=>{actorMotion("ai","attack",.48);}; window.__forceFoeFrameForTest=(kind,frame)=>{const f=game.foes[0];if(!f)return;f.kind=kind;f.alive=frame!==5;f.hp=55;f.deathTimer=frame===5?3.8:0;f.hitAnim=frame===4?.62:0;f.hitFlash=0;f.attackAnim=frame===1?.68:frame===2?.42:frame===3?.07:0;f.attackCooldown=99;}; window.__forceProjectileForTest=(hero,weapon)=>{game.projectiles=[{x:540,y:220,vx:170,vy:-20,r:weapon==="bomb"?13:10,hero,weapon,active:true,age:0,split:weapon==="split",trail:Array.from({length:7},(_,i)=>({x:480+i*8,y:242-i*3})),pierce:0,hitBlocks:[],hitFoes:[]}];}; window.__forceImpactForTest=(hero,weapon)=>{game.projectiles=[];game.blastCores=[{x:540,y:200,life:.48,total:.48,radius:weapon==="bomb"?69:41,hero,weapon,seed:0}];}; window.__artilleryLoadoutDebug=');
script=script.replace(' window.__artilleryLoadoutDebug=',
 ' window.__forceImpactAtTimeForTest=(hero,weapon,time)=>{const total=weapon==="bomb"?.65:.46;game.blastCores=[{x:540,y:200,life:total*(1-time),total,radius:weapon==="bomb"?69:41,hero,weapon,seed:0}];}; window.__impactMotesForTest=(hero,weapon)=>{spawnImpactMotes({x:530,y:270,hero,weapon},weapon==="bomb");return game.impactMotes.length;}; window.__impactMotePositionsForTest=()=>game.impactMotes.map(m=>({x:m.x,y:m.y,life:m.life})); window.__artilleryLoadoutDebug=');
script=script.replace(' window.__artilleryLoadoutDebug=',
 ' window.__probeMaterialColumnForTest=(type,tier)=>drawPaintedColumn({w:26,h:108,type},tier); window.__probeCollapseForTest=()=>{const b=game.blocks.find(v=>v.type==="wood");const old=damageTier(b);b.hp=-1;markBlockImpact(b,old,95);b.dead=true;M.Composite.remove(game.engine.world,b.body);game.blocks=game.blocks.filter(v=>!v.dead);return game.collapseGhosts.length;}; window.__collapseGhostCountForTest=()=>game.collapseGhosts.length; window.__artilleryLoadoutDebug=');
script=script.replace(' window.__artilleryLoadoutDebug=',
 ' window.__groundToastForTest=()=>groundToastLayout(); window.__materialSoundForTest=()=>({wood:soundShapes.wood,stone:soundShapes.stone,iron:soundShapes.iron}); window.__triggerMaterialSoundForTest=(name)=>{const saved=game.sound;game.sound=true;playSound(name);game.sound=saved;}; window.__directionalImpactForTest=(offset)=>{const b=game.blocks.find(v=>v.type==="stone");if(!b)return null;const originalHp=b.hp;b.hp=b.maxHp*.42;markBlockImpact(b,0,34,b.body.position.x+offset);const result={side:b.impactSide,scar:b.hp<b.maxHp};b.hp=originalHp;return result;}; window.__artilleryLoadoutDebug=');
script=script.replace(' window.__artilleryLoadoutDebug=',
 ' window.__fracturePartsForTest=(type,weapon="normal")=>{const b={w:28,h:104,type,impactSide:1,body:M.Bodies.rectangle(810,290,28,104)};spawnCollapseGhost(b,weapon);return {count:collapsePieces[type].length,total:game.collapseGhosts.at(-1).total};}; window.__weaponMaterialForTest=(type,weapon)=>materialWeaponFactor(type,weapon); window.__chainCollisionForTest=()=>{newGame("adventure",0);game.shots=1;const [a,b]=game.blocks;M.Body.setVelocity(a.body,{x:9,y:0});M.Body.setVelocity(b.body,{x:-9,y:0});const before=[a.hp,b.hp],initial=game.chainHits;M.Events.trigger(game.engine,"collisionStart",{pairs:[{bodyA:a.body,bodyB:b.body}]});const after=[a.hp,b.hp];M.Events.trigger(game.engine,"collisionStart",{pairs:[{bodyA:a.body,bodyB:b.body}]});return {before,after,cooled:[a.hp,b.hp],count:game.chainHits-initial};}; window.__crushCollisionForTest=()=>{newGame("adventure",0);game.shots=1;const block=game.blocks[0],foe=game.foes[0];M.Body.setPosition(block.body,{x:foe.x,y:foe.y-64});M.Body.setVelocity(block.body,{x:0,y:10});const before=foe.hp;M.Events.trigger(game.engine,"collisionStart",{pairs:[{bodyA:block.body,bodyB:foe.body}]});return {before,after:foe.hp,crushHits:game.crushHits,defeated:!foe.alive};}; window.__cleanupBrokenBlocksForTest=()=>{newGame("adventure",0);game.shots=1;const [a,b]=game.blocks;a.hp=1;M.Body.setVelocity(a.body,{x:9,y:0});M.Body.setVelocity(b.body,{x:-9,y:0});const before=game.blocks.length;M.Events.trigger(game.engine,"collisionStart",{pairs:[{bodyA:a.body,bodyB:b.body}]});const marked=a.dead;step(1/60);return {before,after:game.blocks.length,marked,ghosts:game.collapseGhosts.length};}; window.__artilleryLoadoutDebug=');
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
assert(html.includes('v2.0.3: fill the entire combat dock'),'Combat control dock should have the responsive full-width layout fix');
assert(/#shotReview\.shot-review\{[^}]*top:auto!important;[^}]*bottom:clamp\(/.test(html),'Post-impact result toast must appear at ground level rather than on top of the scene');
assert(/#battleWrap > #hint\.corner-hint\{[^}]*left:50%!important;[^}]*top:91%!important/.test(html),'The separate welcome hint must be centered inside the battlefield dirt rather than at the sky corner');
assert(html.includes('function groundToastLayout()'),'Transient gameplay toasts must share the lower-ground notification design');
assert(html.includes('function drawImpactScar(b,tier)'),'The hit side must leave a persistent directional crack on damaged structures');
assert(html.includes('if(tier!==previousTier||b.hp<=0)playSound(b.type)'),'Material damage must trigger a distinct wood/stone/iron audio cue');
assert(/#controls\.controls\{\s*width:100%;min-width:0;\s*grid-template-columns:minmax\(0,\.95fr\) minmax\(0,1\.25fr\) minmax\(0,1\.05fr\)/.test(html),'Desktop dock needs three explicitly flexible tracks; the former auto action track collapsed buttons');
assert(/@media \(max-width:780px\) and \(orientation:portrait\)\{\s*#controls\.controls\{\s*grid-template-columns:minmax\(0,1fr\)!important/.test(html),'Portrait dock should not reserve an unused 86px column');
for(const weapon of ['normal','bomb','split']){
 assert(html.includes('art/hud_weapon_'+weapon+'.webp'),'Selected ammunition must keep its painted bitmap');
}
assert(/#controls \.weapon\.selected\{\s*background:transparent url\("art\/hud_weapon_normal.webp"\)/.test(html),'The selected-ammo gradient must not conceal original bitmap artwork');
assert(/#controls #overview,#controls #abilityBtn\{\s*width:100%!important/.test(html),'Action icons must not collapse to zero width');
assert(html.includes('#controls #fire.recent-shot{'),'Pressed artwork must match the fired state even when FIRE is disabled');
assert(html.includes('#controls #fire:disabled:not(.recent-shot){'),'Long-flight disabled art must not override the pressed illustration');
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
assert(html.includes('art/duel_cannons_v21.webp'),'An original allied/enemy cannon atlas must be loaded');
assert(html.includes('art/duel_cannon_parts_v22.webp'),'The independently painted gun barrels and carriages must load');
assert(html.includes('art/fox_attack_v22.webp'),'Fox must use six independently painted attack poses');
for(const hero of ['bear','rabbit','cat']){
 assert(html.includes(`art/${hero}_attack_v23.webp`),`${hero} must have its own independently painted six-frame attack asset`);
 const bytes=fs.readFileSync(`${__dirname}/art/${hero}_attack_v23.webp`);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF',`${hero} attack asset must be a real WebP binary`);
 assert.equal(bytes.subarray(8,12).toString(),'WEBP',`${hero} attack asset must retain WebP format`);
}
assert(html.includes('function drawHeroAttackFrame(which,x,y,scale,dir,side)'),'All four heroes must use their individually painted animation frames');
for(const foe of ['acorn','golem','wind','boss']){
 assert(html.includes(`art/foe_${foe}_v24.webp`),`${foe} must have its own painted monster action sheet`);
 const bytes=fs.readFileSync(`${__dirname}/art/foe_${foe}_v24.webp`);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF',`${foe} action asset must be WebP`);
 assert.equal(bytes.subarray(8,12).toString(),'WEBP',`${foe} action asset must have a WebP signature`);
}
assert(html.includes('art/hero_ammunition_v25.webp'),'The twelve hand-painted weapon/ammo combinations must load');
const ammoBytes=fs.readFileSync(`${__dirname}/art/hero_ammunition_v25.webp`);
assert.equal(ammoBytes.subarray(0,4).toString(),'RIFF','Projectile atlas must be WebP');
assert.equal(ammoBytes.subarray(8,12).toString(),'WEBP','Projectile atlas must have a WebP signature');
assert(html.includes('drawPaintedAmmunition(p)'),'In-flight projectiles must use equipped-hero illustration');
assert(html.includes("m.hero==='cat'"),'Magic staff discharge should differ from the cannon muzzle');
assert(html.includes('function paintedFoeArtReady(kind)'),'Independent 6-frame monster art should take priority over legacy poses');
assert(html.includes('ctx.save();ctx.clip();ctx.drawImage(materialAtlas,'),'Physical fragments should have painted, clipped material textures');
assert(html.includes('ctx.rotate(dir*(16*Math.PI/180-a))'),'Only the barrel must rotate with the firing angle');
assert(html.includes('function cannonTrunnion(owner)'),'Muzzle and barrel pivot must share one source of truth');
assert(/#controls #abilityBtn:not\(:disabled\)\{[^}]*background:transparent url\("art\/hud_ability_ready\.webp"\)/.test(html),'An enabled special ability must retain its illustrated bitmap, not the obsolete solid gradient');
assert(html.includes('function duelActor(x,dir,own)'),'Duel visuals must be selected by the actual hero');
assert(html.includes("if(hero==='bear'){cannon("),'Only the bear should operate a field cannon');
assert(html.includes('duelHandMuzzles'),'Handheld weapons need their own launch points');
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
let imageDrawCalls=0,mediumTrajectoryStrokes=0,duelPilotDrawCalls=0,paintedCannonDrawCalls=0,previewDraws=[],badgeDraws=[];
let splitCarriageDraws=0,splitBarrelDraws=0;
const splitCannonColumns=new Set(),heroAttackFrames=Object.fromEntries(['fox','bear','rabbit','cat'].map(hero=>[hero,new Set()]));
const foeFrameIds=['foeAcornArtwork','foeGolemArtwork','foeWindArtwork','foeBossArtwork'];
const paintedFoeFrames=foeFrameIds.map(()=>new Set());
let paintedShardDrawCalls=0,legacyCombatDrawCalls=0;
const paintedColumnCells=new Set();
const paintedAmmunitionCells=new Set();
const paintedImpactCells=new Set();
const paintedImpactStageCells=new Set();
const flightRibbonColors=new Set();
function testDrawImage(...args){
 imageDrawCalls++;
 if(args.length===9&&args[7]===52&&args[8]===56)duelPilotDrawCalls++;
 if(args[0]?.id==='duelCannonArtwork')paintedCannonDrawCalls++;
 if(args[0]?.id==='duelCannonPartsArtwork'){
  splitCannonColumns.add(args[1]);
  if(args[2]===0)splitCarriageDraws++;
  else splitBarrelDraws++;
 }
 for(const hero of Object.keys(heroAttackFrames)){
  if(args[0]?.id===`${hero}AttackArtwork`)heroAttackFrames[hero].add(Math.floor(args[2]/512)*3+Math.floor(args[1]/512));
 }
 const foeIndex=foeFrameIds.indexOf(args[0]?.id);
 if(foeIndex>=0)paintedFoeFrames[foeIndex].add(Math.floor(args[2]/512)*3+Math.floor(args[1]/512));
 if(args[0]?.id==='combatArtwork')legacyCombatDrawCalls++;
 if(args[0]?.id==='materialArtwork'&&args[3]<=92&&args[2]>=680)paintedShardDrawCalls++;
 if(args[0]?.id==='materialColumnArtwork')paintedColumnCells.add(`${Math.floor(args[1]/(1262/3))},${Math.floor(args[2]/(1246/3))}`);
 if(args[0]?.id==='heroAmmunitionArtwork')paintedAmmunitionCells.add(`${Math.round(args[2]/(810/4))},${Math.round(args[1]/(1080/3))}`);
 if(args[0]?.id==='heroImpactArtwork')paintedImpactCells.add(`${Math.round(args[2]/384)},${Math.round(args[1]/384)}`);
 if(args[0]?.id==='heroImpactStagesArtwork')paintedImpactStageCells.add(`${Math.round(args[2]/240)},${Math.round(args[1]/240)}`);
}
const noOpKeys=new Set(['clearRect','save','restore','translate','setTransform','beginPath','moveTo','lineTo','fill','ellipse','arc','roundRect','fillText','strokeText','closePath','scale','rotate','rect','clip','bezierCurveTo','quadraticCurveTo']);
const ctx=new Proxy({}, {get:(obj,key)=>key==='createLinearGradient'?()=>({addColorStop:noOp}):key==='measureText'?text=>({width:String(text).length*11}):key==='drawImage'?testDrawImage:key==='stroke'?()=>{if(obj.strokeStyle==='#f4e6b9b0'&&obj.lineWidth>=3&&obj.lineWidth<=5)mediumTrajectoryStrokes++;if(['#ffcb79','#58616d','#c1a3f2','#91f7e4'].includes(obj.strokeStyle))flightRibbonColors.add(obj.strokeStyle);}:noOpKeys.has(key)?noOp:obj[key],set:(obj,k,v)=>(obj[k]=v,true)});
ctx.fillRect=noOp;
const previewCtx=new Proxy(ctx,{get:(obj,key)=>key==='drawImage'?(...args)=>previewDraws.push(args):key==='clearRect'?noOp:obj[key]});
function el(id){if(!elements.has(id)){const listeners={},classes=new Set(),item={id,hidden:false,disabled:false,style:{},value:'',textContent:'',dataset:{},clientWidth:id==='field'?1280:id==='heroPreviewCanvas'?210:0,clientHeight:id==='field'?620:id==='heroPreviewCanvas'?120:0,width:0,height:0,tagName:'DIV',classList:{toggle(cls,force){if(force===undefined)force=!classes.has(cls);if(force)classes.add(cls);else classes.delete(cls);return !!force;},contains(cls){return classes.has(cls);}},addEventListener(type,fn){listeners[type]=fn;},dispatch(type,event={}){listeners[type]?.({target:item,...event});},click(){this.dispatch('click');},getContext:()=>id==='heroPreviewCanvas'?previewCtx:id.startsWith('heroBadge')?new Proxy(ctx,{get:(obj,key)=>key==='drawImage'?(...args)=>badgeDraws.push({id,args}):obj[key]}):ctx,getBoundingClientRect(){return{left:0,top:0,width:this.clientWidth,height:this.clientHeight};},setPointerCapture:noOp};elements.set(id,item);}return elements.get(id);}
const weapons=['normal','bomb','split'].map(type=>{const b=el('weapon-'+type);b.dataset.weapon=type;return b;});
const heroes=['fox','bear','rabbit','cat'].map(type=>{const b=el('hero-'+type);b.dataset.hero=type;return b;});
const stages=[0,1,2,3].map(type=>{const b=el('stage-'+type);b.dataset.stage=String(type);return b;});
for(const id of ['stageMap','result','help','exitConfirm','enemyEntrance','shotReview'])el(id).hidden=true;
for(const id of ['materialArtwork','combatArtwork']){const art=el(id);art.complete=true;art.naturalWidth=id==='combatArtwork'?1262:1536;art.naturalHeight=id==='combatArtwork'?1246:1024;}
{const art=el('materialColumnArtwork');art.complete=true;art.naturalWidth=1262;art.naturalHeight=1246;}
{const art=el('duelCannonArtwork');art.complete=true;art.naturalWidth=1774;art.naturalHeight=887;}
{const art=el('duelCannonPartsArtwork');art.complete=true;art.naturalWidth=1774;art.naturalHeight=887;}
for(const hero of Object.keys(heroAttackFrames)){
 const art=el(`${hero}AttackArtwork`);art.complete=true;art.naturalWidth=1536;art.naturalHeight=1024;
}
for(const id of foeFrameIds){const art=el(id);art.complete=true;art.naturalWidth=1536;art.naturalHeight=1024;}
{const art=el('heroAmmunitionArtwork');art.complete=true;art.naturalWidth=1080;art.naturalHeight=810;}
{const art=el('heroImpactArtwork');art.complete=true;art.naturalWidth=768;art.naturalHeight=768;}
{const art=el('heroImpactStagesArtwork');art.complete=true;art.naturalWidth=720;art.naturalHeight=960;}
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
assert.equal(el('hint').hidden,false,'The entry hint should appear briefly in the ground zone');
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
assert.equal(el('hint').hidden,true,'The entry hint must vanish immediately after firing so it cannot obscure the impact result');
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
frames(1);
assert(el('fire').classList.contains('recent-shot')&&el('fire').disabled,
 'Firing must show pressed HUD artwork even while the button is temporarily disabled');
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
const activeDuelLoadout=window.__artilleryLoadoutDebug();
const expectedWeapons={fox:'slingshot',bear:'cannon',rabbit:'crossbow',cat:'staff'};
assert.equal(activeDuelLoadout.player.weapon,expectedWeapons[activeDuelLoadout.player.hero]);
assert.equal(activeDuelLoadout.ai.weapon,expectedWeapons[activeDuelLoadout.ai.hero]);
assert.notEqual(activeDuelLoadout.player.hero,activeDuelLoadout.ai.hero,'AI must select a distinct hero');
assert(activeDuelLoadout.paintedCannonReady,'Both original bitmap cannons must load successfully');
assert(activeDuelLoadout.splitCannonReady,'The rotating cannon-parts atlas must be loaded');
assert(activeDuelLoadout.foxAttackReady,'The transparent fox attack frames must be loaded');
assert.deepEqual(activeDuelLoadout.paintedAttackReady,{fox:true,bear:true,rabbit:true,cat:true},'All four independent attack sheets must load');
assert(activeDuelLoadout.paintedAmmunitionReady,'Each equipped character must use its painted ammunition graphics');
assert.deepEqual(activeDuelLoadout.ammunitionCells.columns,{normal:0,bomb:1,split:2},'Shell selection must choose the ammo column');
assert(activeDuelLoadout.playerMuzzle.weapon===activeDuelLoadout.player.weapon&&activeDuelLoadout.aiMuzzle.weapon===activeDuelLoadout.ai.weapon,
 'Duel muzzle positions must correspond to the wielded weapon');
if(activeDuelLoadout.player.hero==='bear'||activeDuelLoadout.ai.hero==='bear'){
 assert(splitCarriageDraws>=4&&splitBarrelDraws>=4&&duelPilotDrawCalls>=4,'Bear sides need independent illustrated wheel and barrel layers');
}
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
const portraitToast=window.__groundToastForTest();
assert(portraitToast.y>=640*.77&&portraitToast.y<=594,'Portrait notification must sit below the horizon near the ground');
assert(portraitToast.screenWidth<=360-1,'Portrait toast must fit inside the actual visible battlefield');
el('field').clientWidth=844;el('field').clientHeight=390;frames(5);
assert.deepEqual(state().canvas,[844,390],'Landscape 844x390 canvas must match its container');
const landscapeToast=window.__groundToastForTest();
assert(landscapeToast.y>=640*.77&&landscapeToast.y<=594,'Landscape notification must stay at ground level');
assert(landscapeToast.fontSize>=portraitToast.fontSize,'Landscape toast can use larger type without hiding the target area');
assert(html.includes('spawnCollapseFragments(b,direction,weapon)'),'Broken blocks should create large independent falling chunks biased by material, weapon and impact direction');
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
// Explicitly select the bear to prove that the golden allied cannon is actually drawn.
el('hero-bear').click();el('duelBtn').click();frames(4);
const bearLoadout=window.__artilleryLoadoutDebug();
assert.equal(bearLoadout.player.weapon,'cannon');
assert.notEqual(bearLoadout.ai.hero,'bear');
assert(splitCarriageDraws>=4&&splitBarrelDraws>=4&&splitCannonColumns.has(0),'The golden cannon must show both pivoted barrel and fixed wheels');
assert.equal(paintedCannonDrawCalls,0,'Full one-piece cannon artwork should be fallback only');
assert.equal(bearLoadout.playerMuzzle.weapon,'cannon');
const pivot=bearLoadout.playerPivot,muzzle=bearLoadout.playerMuzzle;
assert(Math.abs(muzzle.x-(pivot.x+Math.cos(43*Math.PI/180)*pivot.length))<.01,'Allied shell must spawn at its illustrated barrel tip');
assert(Math.abs(muzzle.y-(pivot.y-Math.sin(43*Math.PI/180)*pivot.length))<.01,'Allied shell must track the rotated gun elevation');
el('angle').value='68';el('angle').dispatch('input');frames(2);
const raised=window.__artilleryLoadoutDebug().playerMuzzle;
assert(raised.x<muzzle.x&&raised.y<muzzle.y,'Raising aim must move the actual cannon mouth up and back');
window.__forceAiHeroForTest('bear');frames(3);
assert(splitCannonColumns.has(887),'Enemy side must use the separately illustrated dark steel carriage and barrel');
el('homeBtn').click();el('hero-fox').click();el('duelBtn').click();frames(2);
el('fire').click();frames(30);
assert.deepEqual([...heroAttackFrames.fox].sort(),[0,1,2,3,4,5],'Fox must play six separate illustrated recoil frames');
for(const hero of ['bear','rabbit','cat']){
 el('homeBtn').click();el('hero-'+hero).click();el('adventureStage').value='0';el('adventureBtn').click();frames(2);
 el('fire').click();frames(30);
 assert.deepEqual([...heroAttackFrames[hero]].sort(),[0,1,2,3,4,5],`${hero} adventure launch must paint all six individual attack poses`);
}
// The opponent's handheld weapon and left-facing artwork must use the same animation path.
el('homeBtn').click();el('hero-bear').click();el('duelBtn').click();frames(2);
for(const hero of ['fox','rabbit','cat']){
 heroAttackFrames[hero].clear();
 window.__forceAiHeroForTest(hero);window.__forceAiAttackForTest();frames(30);
 assert.deepEqual([...heroAttackFrames[hero]].sort(),[0,1,2,3,4,5],`${hero} opponent must paint all six independent attack frames`);
}
el('homeBtn').click();el('adventureStage').value='0';el('adventureBtn').click();frames(2);
assert.deepEqual(state().paintedFoeReady,[true,true,true,true],'All four new monster action sheets must load');
for(let kind=0;kind<foeFrameIds.length;kind++){
 for(let pose=0;pose<6;pose++){
  window.__forceFoeFrameForTest(kind,pose);frames(1);
 }
 assert.deepEqual([...paintedFoeFrames[kind]].sort(),[0,1,2,3,4,5],`${foeFrameIds[kind]} must paint every frame from idle to defeat`);
}
assert.equal(legacyCombatDrawCalls,0,'Legacy monster atlas with unwanted paint remnants must not render when new sheets are loaded');
window.__damageBlockForTest(30);frames(3);
assert(paintedShardDrawCalls>0,'Wood debris should reuse the original damaged material painting');
const leftImpact=window.__directionalImpactForTest(-70),rightImpact=window.__directionalImpactForTest(70);
assert.equal(leftImpact.side,1,'Left-side impacts must crack and scatter toward the right');
assert.equal(rightImpact.side,-1,'Right-side impacts must crack and scatter toward the left');
assert(leftImpact.scar&&rightImpact.scar,'Both hit directions must leave visible material damage');
const materialSounds=window.__materialSoundForTest();
assert.deepEqual([materialSounds.wood.type,materialSounds.stone.type,materialSounds.iron.type],['triangle','sawtooth','sine'],'Timber, rock and steel must have separate sound timbres');
assert(materialSounds.wood.duration<materialSounds.stone.duration&&materialSounds.stone.duration<materialSounds.iron.duration,'Metallic clang should ring longer than cracking wood and stone');
const playedMaterials=[];
window.AudioContext=class{
 constructor(){this.currentTime=0;this.destination={};}
 createOscillator(){const note={type:'',frequency:{setValueAtTime(v){note.startFrequency=v;},exponentialRampToValueAtTime:noOp},connect:noOp,start(){playedMaterials.push({type:note.type,frequency:note.startFrequency});},stop:noOp};return note;}
 createGain(){return {gain:{setValueAtTime:noOp,exponentialRampToValueAtTime:noOp},connect:noOp};}
};
for(const material of ['wood','stone','iron'])window.__triggerMaterialSoundForTest(material);
assert.deepEqual(playedMaterials.map(x=>x.type),['triangle','sawtooth','sine','sine'],'Sound synthesis must actually produce three material timbres plus metallic ring');
assert.equal(playedMaterials.at(-1).frequency,1170,'Steel must add a high-frequency ringing harmonic');
window.__triggerMaterialSoundForTest('wood');
assert.equal(playedMaterials.length,4,'Simultaneous duplicate timber impacts must be rate-limited');
const columnImage=fs.readFileSync(__dirname+'/art/material_columns_v28.webp');
assert.equal(columnImage.toString('ascii',0,4),'RIFF','The pillar damage atlas must be a WebP bitmap');
assert.equal(columnImage.toString('ascii',8,12),'WEBP','The pillar damage atlas must retain its WebP signature');
for(const material of ['wood','stone','iron'])for(let tier=0;tier<3;tier++){
 assert(window.__probeMaterialColumnForTest(material,tier),`The ${material} pillar needs a real tier-${tier} painting`);
}
assert.deepEqual([...paintedColumnCells].sort(),Array.from({length:3},(_,x)=>Array.from({length:3},(_,y)=>`${x},${y}`)).flat().sort(),
 'Every material needs its own intact, damaged and critical pillar illustration');
el('materialColumnArtwork').complete=false;
assert.equal(window.__probeMaterialColumnForTest('wood',1),false,'Unavailable new pillar art must fall back to the legacy atlas');
el('materialColumnArtwork').complete=true;
assert(window.__probeCollapseForTest()>0,'Destroyed supports must show a short-lived painted split silhouette');
frames(27);
assert.equal(window.__collapseGhostCountForTest(),0,'Collapse silhouettes must clear within half a second');
for(const hero of ['fox','bear','rabbit','cat']){
 for(const weapon of ['normal','bomb','split']){
  window.__forceProjectileForTest(hero,weapon);frames(1);
 }
}
assert.deepEqual([...paintedAmmunitionCells].sort(),Array.from({length:4},(_,r)=>Array.from({length:3},(_,c)=>`${r},${c}`)).flat().sort(),
 'All 12 hero/ammunition combinations must draw their own painted atlas cell');
assert.deepEqual([...flightRibbonColors].sort(),['#ffcb79','#58616d','#c1a3f2','#91f7e4'].sort(),
 'Each character must leave a distinct flight ribbon behind their illustrated ammunition');
const paintedImpactFile=fs.readFileSync(__dirname+'/art/hero_impacts_v26.webp');
assert.equal(paintedImpactFile.toString('ascii',0,4),'RIFF','v2.6 impact art must be a real binary WebP');
assert.equal(paintedImpactFile.toString('ascii',8,12),'WEBP','v2.6 impact art must load as WebP');
const stageArt=el('heroImpactStagesArtwork');stageArt.complete=false;
for(const hero of ['fox','bear','rabbit','cat']){
 for(const weapon of ['normal','bomb','split']){
  window.__forceImpactForTest(hero,weapon);frames(1);
 }
}
assert.deepEqual([...paintedImpactCells].sort(),['0,0','0,1','1,0','1,1'].sort(),
 'All four character impacts must retain the v2.6 fallback when the animation asset is absent');
stageArt.complete=true;
const impactStagesFile=fs.readFileSync(__dirname+'/art/hero_impacts_v27.webp');
assert.equal(impactStagesFile.toString('ascii',0,4),'RIFF','v2.7 animation frames must be a real binary WebP');
assert.equal(impactStagesFile.toString('ascii',8,12),'WEBP','v2.7 animation frames must be genuine WebP');
for(const hero of ['fox','bear','rabbit','cat']){
 for(const weapon of ['normal','bomb','split']){
  for(const t of [.03,.38,.82]){window.__forceImpactAtTimeForTest(hero,weapon,t);frames(1);}
 }
}
assert.deepEqual([...paintedImpactStageCells].sort(),Array.from({length:4},(_,r)=>Array.from({length:3},(_,c)=>`${r},${c}`)).flat().sort(),
 'Every hero must render three distinct impact animation stages across all ammunition types');
const fragmentCount=window.__impactMotesForTest('cat','bomb');
assert(fragmentCount>=23,'Heavy shells must produce enough animated impact fragments');
const fragmentsBefore=window.__impactMotePositionsForTest();frames(4);
const fragmentsAfter=window.__impactMotePositionsForTest();
assert(fragmentsAfter.some((m,i)=>Math.abs(m.y-fragmentsBefore[i].y)>1),
 'Physical impact fragments must move independently under gravity after the explosion');
const fractureStyles=['wood','stone','iron'].map(type=>window.__fracturePartsForTest(type));
assert.deepEqual(fractureStyles.map(v=>v.count),[3,5,2],'Wood splinters, stone chunks and bent steel plates need distinct breakup silhouettes');
assert(fractureStyles[0].total<fractureStyles[1].total&&fractureStyles[1].total<fractureStyles[2].total,'Heavy materials must linger longer during collapse');
assert(window.__weaponMaterialForTest('wood','bomb')>window.__weaponMaterialForTest('wood','normal'),'Explosives should shatter timber more effectively');
assert(window.__weaponMaterialForTest('iron','pierce')>window.__weaponMaterialForTest('iron','bomb'),'Piercing shells should outperform blast against steel');
assert(window.__weaponMaterialForTest('stone','bomb')>window.__weaponMaterialForTest('stone','split'),'Stone should resist light split submunitions');
const chain=window.__chainCollisionForTest();
assert(chain.after.every((hp,i)=>hp<chain.before[i]),'Structural collision must damage both moving supports');
assert.deepEqual(chain.cooled,chain.after,'Repeated collision callbacks inside cooldown must not double-count the damage');
assert.equal(chain.count,1,'One collision pair should record a single chain reaction');
const crush=window.__crushCollisionForTest();
assert(crush.after<crush.before&&crush.crushHits===1,'A falling support must injure and count a crushed enemy');
assert(crush.defeated,'Strong overhead impact must be able to defeat a monster');
const cleanup=window.__cleanupBrokenBlocksForTest();
assert(cleanup.marked&&cleanup.after<cleanup.before,'Collision-destroyed supports must leave Matter and the active block list after stepping');
assert(cleanup.ghosts>0,'A collision-destroyed support must still show its painted breakup');
el('homeBtn').click();el('adventureBtn').click();
assert.equal(el('hint').hidden,false,'Entering a new battle should show the brief hint again');
frames(290);
assert.equal(el('hint').hidden,true,'The ground hint must automatically dismiss after roughly 4.5 seconds');
console.log(JSON.stringify({status:'passed',file:testFile,adventure:'launch + flight + settle',peakRotated,duel:'launch + turn simulation',resize:'390x355',desktop},null,2));
if(/v0_[34567]/.test(versionedPath))assert(imageDrawCalls>0,'The game must render sprite atlas on canvas');
