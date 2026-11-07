// Runs with only Node.js built-ins. Isolates the REAL aiming/charge functions
// from index.html so the reticle pacing can be tested without the art atlases
// or Matter.js required by the full gameplay regression suite.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const take=(from,to)=>{
 const start=html.indexOf(from),end=html.indexOf(to,start+from.length);
 assert(start>=0&&end>start,`Missing source section ${from} .. ${to}`);
 return html.slice(start,end);
};
assert(html.includes('id="power" type="range" min="20" max="100" step="0.01"'),
 'Fractional power must survive the hidden input control');
const source=`
const W=1200,H=640,G=465,WIND_FORCE=46,WIND_LIFT_FORCE=38,TIMING_STEER_FORCE=136;
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const game={mode:'duel',hero:'fox',aiHero:'bear',angle:43,wind:0,windLift:0,
 chargedPower:20,chargeDirection:1,chargeSweepTime:0,terrain:null,blocks:[],foes:[]};
${take('function terrainY(','function powerVelocity(')}
${take('function powerVelocity(','function launch(')}
${take('function predict(','function chooseAiShot(')}
game.terrain=initialTerrain('duel');
function aimX(power){return stableAimPoint(stableAimPath(game.angle,power,game.wind)).x;}
function minToEnemy(power){
 const path=stableAimPath(game.angle,power,game.wind),tx=1018,ty=terrainY(tx)-29;
 return Math.min(Math.abs(aimX(power)-tx),...path.map(p=>Math.hypot(p.x-tx,p.y-ty)));
}
function run(angle,wind){
 game.angle=angle;game.wind=wind;game.chargedPower=20;game.chargeDirection=1;game.chargeSweepTime=0;
 let nearSteps=[],farSteps=[],fractional=false,hitFrames=0,nearFrames=0,peakPower=20,reversed=false;
 let lastX=aimX(game.chargedPower);
 for(let i=0;i<2200;i++){
  const before=game.chargedPower,proximity=minToEnemy(before),rate=chargeSweepRate();
  advanceChargePower(1/60);
  const after=game.chargedPower,x=aimX(after),jump=Math.abs(x-lastX);
  if(proximity<90){nearSteps.push({jump,rate,before,after,proximity});nearFrames++;}
  if(proximity>260&&game.chargeDirection===1)farSteps.push({jump,rate});
  if(Math.abs(after-Math.round(after))>.03)fractional=true;
  if(predict(angle,after,wind,'player').impact?.kind==='foe')hitFrames++;
  if(after>peakPower)peakPower=after;
  if(game.chargeDirection<0){reversed=true;break;}
  assert(after>=20&&after<=100,'The dial must stay in its usable 20..100 range');
  assert(Number.isFinite(jump)&&Number.isFinite(rate),'No aim sample can become NaN');
  lastX=x;
 }
 return {angle,wind,nearSteps,farSteps,fractional,hitFrames,nearFrames,peakPower,reversed};
}
function findHit(wind,from=20,to=76){
 game.wind=wind;
 for(let a=from;a<=to;a+=2){
  for(let p=40;p<=100;p+=2){
   game.angle=a;
   if(predict(a,p,wind,'player').impact?.kind==='foe')return {angle:a,power:p};
  }
 }
 return null;
}
({run,findHit,probe:(angle,power,wind=0)=>{game.angle=angle;game.wind=wind;game.chargedPower=power;game.chargeDirection=1;return{rate:chargeSweepRate(),x:aimX(power),next:aimX(power+1)};}})
`;
const {run,findHit,probe}=vm.runInNewContext(source,{assert}, {timeout:10000});
const report=[];
for(const wind of [-3.5,0,3.5]){
 const hits=[findHit(wind,20,40),findHit(wind,42,76)].filter(Boolean);
 assert(hits.length,`An enemy hit must be reachable under wind ${wind}`);
 for(const hit of hits){
 const samples=run(hit.angle,wind);
 assert(samples.nearFrames>8,`Aiming must linger near the enemy, wind=${wind}`);
 assert(samples.fractional,'The sweep must use fractional power rather than 1% jumps');
 const peak=Math.max(...samples.nearSteps.map(x=>x.jump));
 const mean=samples.nearSteps.reduce((n,x)=>n+x.jump,0)/samples.nearSteps.length;
 assert(peak<12,`Aim marker cannot jump farther than 12 world units near enemy: ${peak}, wind=${wind}`);
 assert(mean<3,`Aim marker should travel ~2 world units per frame near enemy: ${mean}, wind=${wind}`);
 assert(samples.hitFrames>3,`A hittable arc must remain in the firing window for several frames: ${samples.hitFrames}`);
 assert(samples.reversed&&samples.peakPower>99.5,`The gauge must reach max and reverse direction: ${JSON.stringify({angle:hit.angle,wind,peak:samples.peakPower,reversed:samples.reversed,near:samples.nearFrames})}`);
 const near=probe(hit.angle,hit.power,wind);
 const far=probe(hit.angle,20,wind);
 assert(near.rate<far.rate,'Enemy proximity should slow the dial more than its initial power');
 report.push({wind,hit,peakNearJump:+peak.toFixed(2),meanNearJump:+mean.toFixed(2),nearFrames:samples.nearFrames,hitFrames:samples.hitFrames,farRate:+far.rate.toFixed(3),nearRate:+near.rate.toFixed(3)});
 }
}
console.log('CannonTale aim charge regression OK:',JSON.stringify(report));
