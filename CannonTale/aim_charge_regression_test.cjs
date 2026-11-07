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
 chargedPower:20,chargeDirection:1,chargeSweepTime:0,
 chargeConfirmTime:0,chargeConfirmImpact:null,phase:'aim',terrain:null,blocks:[],foes:[]};
${take('function terrainY(','function powerVelocity(')}
${take('function projectileSpeed(','function launch(')}
${take('function predict(','function chooseAiShot(')}
game.terrain=initialTerrain('duel');
function aimX(power){return stableAimPoint(stableAimPath(game.angle,power,game.wind)).x;}
function minToEnemy(power){
 const path=stableAimPath(game.angle,power,game.wind),tx=1018,ty=terrainY(tx)-29;
 return Math.min(Math.abs(aimX(power)-tx),...path.map(p=>Math.hypot(p.x-tx,p.y-ty)));
}
function run(angle,wind){
 game.angle=angle;game.wind=wind;game.chargedPower=20;game.chargeDirection=1;
 game.chargeSweepTime=0;game.chargeConfirmTime=0;game.chargeConfirmImpact=null;
 let evenRangeSteps=0,fractional=false,reversed=false,hitFrames=0;
 let peakPower=20;
 const speedLow=projectileSpeed(20),speedHigh=projectileSpeed(100);
 const nominalRange=(power)=>(projectileSpeed(power)**2-speedLow**2)/(speedHigh**2-speedLow**2);
 const expected=1/(1.35*60);
 for(let i=0;i<500;i++){
  const before=game.chargedPower;
  const directionBefore=game.chargeDirection;
  assert.equal(chargeSweepRate(),1,'The sweep rate must be uniformly 1');
  advanceChargePower(1/60);
  const after=game.chargedPower;
  assert(after>=20&&after<=100&&Number.isFinite(after),'The power sweep stays finite within bounds');
  assert.equal(game.phase,'aim','Charging must never automatically open precision timing');
  assert.equal(game.chargeConfirmTime,0,'No hit confirmation may start BEFORE a player release');
  if(Math.abs(after-Math.round(after))>.03)fractional=true;
  if(after>peakPower)peakPower=after;
  if(game.chargeDirection<0)reversed=true;
  if(duelHitAtChargePower(after))hitFrames++;
  if(directionBefore===game.chargeDirection&&after>20.001&&after<99.999){
   assert(Math.abs(Math.abs(nominalRange(after)-nominalRange(before))-expected)<.000001,
    'The aim-range sweep must NOT slow or jump across the high-power hinge or enemy');
   evenRangeSteps++;
  }
 }
 return {angle,wind,evenRangeSteps,fractional,reversed,peakPower,hitFrames};
}
function findHit(wind,from=20,to=76){
 game.wind=wind;
 for(let a=from;a<=to;a+=2){
  for(let p=40;p<=100;p+=2){
   game.angle=a;
   if(predict(a,p,0,'player',640,0,0).impact?.kind==='foe')return {angle:a,power:p};
  }
 }
 return null;
}
({run,findHit,probe:(angle,power,wind=0)=>{game.angle=angle;game.wind=wind;game.chargedPower=power;game.chargeDirection=1;return{rate:chargeSweepRate(),x:aimX(power),next:aimX(power+1)};}, windCheck:(angle,power)=>{game.angle=angle;game.wind=-4.2;const a=aimX(power);game.wind=4.2;const b=aimX(power);const windy=predict(angle,power,4.2,'player',900,0,0,true),calm=predict(angle,power,0,'player',900,0,0,true);return{a,b,windy:(windy.impact||windy.at(-1)).x,calm:(calm.impact||calm.at(-1)).x};}})
`;
const {run,findHit,probe,windCheck}=vm.runInNewContext(source,{assert}, {timeout:10000});
const report=[];
for(const wind of [-3.5,0,3.5]){
 const hits=[findHit(wind,20,40),findHit(wind,42,76)].filter(Boolean);
 assert(hits.length,`An enemy hit must be reachable under wind ${wind}`);
 for(const hit of hits){
 const samples=run(hit.angle,wind);
 assert(samples.fractional,'The sweep must use fractional power rather than 1% jumps');
 assert(samples.evenRangeSteps>480,`The neutral-range sweep must remain continuous: ${samples.evenRangeSteps}`);
 assert(samples.hitFrames>=1,`The sweep should pass the foe at its normal speed: ${JSON.stringify(samples)}`);
 assert(samples.reversed&&samples.peakPower>99.5,`The gauge must reach max and reverse: ${JSON.stringify(samples)}`);
 const near=probe(hit.angle,hit.power,wind);
 const far=probe(hit.angle,20,wind);
 assert.equal(near.rate,1,'Enemy proximity must NOT slow the range sweep');
 assert.equal(far.rate,1,'Initial sweeping must use the same rate as enemy proximity');
 const neutral=windCheck(hit.angle,hit.power);
 assert.equal(neutral.a,neutral.b,'Preview range may NEVER change when the wind changes');
 assert(Math.abs(neutral.windy-neutral.calm)>10,'Wind must still affect the actual shell flight');
 report.push({wind,hit,evenRangeSteps:samples.evenRangeSteps,hitFrames:samples.hitFrames,farRate:far.rate,nearRate:near.rate});
 }
}
console.log('CannonTale aim charge regression OK:',JSON.stringify(report));
