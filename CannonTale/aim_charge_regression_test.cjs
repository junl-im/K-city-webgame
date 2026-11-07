// Angle-only duel sight regression. Extracts the real ballistic functions
// instead of maintaining a second test-only approximation of CannonTale.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const take=(from,to)=>{
 const start=html.indexOf(from),end=html.indexOf(to,start+from.length);
 assert(start>=0&&end>start,`Missing source section ${from} .. ${to}`);
 return html.slice(start,end);
};
assert(!html.includes('id="aimAdjust"')&&!html.includes('data-aim-step'),
 'Angle and distance adjustment buttons must not return');
assert(html.includes('id="angle"')&&html.includes('id="power"'),
 'Preserve accessible hidden range inputs for keyboard and prior saves');
const source=`
const W=1200,H=640,G=465,WIND_FORCE=46,WIND_LIFT_FORCE=38,TIMING_STEER_FORCE=136,DUEL_SIGHT_POWER=81.7,DUEL_WIND_FORCE=22;
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const game={mode:'duel',hero:'fox',aiHero:'bear',angle:43,wind:0,windLift:0,
 chargedPower:20,chargeDirection:1,chargeSweepTime:0,
 chargeConfirmTime:0,chargeConfirmImpact:null,phase:'aim',terrain:null,blocks:[],foes:[]};
${take('function terrainY(','function powerVelocity(')}
${take('function projectileSpeed(','function launch(')}
${take('function predict(','function chooseAiShot(')}
${take(' function precisionGrade(',' function lockPrecision(')}
game.terrain=initialTerrain('duel');
function sample(angle,charge=60,wind=0,needle=.5){
 game.angle=angle;game.wind=wind;
 const p=duelRangeReferencePoint(angle),grade=precisionGrade(needle);
 const launchPower=duelMeterLaunchPower(charge,grade);
 const trueFlight=predict(angle,launchPower,wind,'player',900,(needle-.5)*2,0,true);
 const end=trueFlight.impact||trueFlight.edgeExit||trueFlight.at(-1);
 return {sight:p.x,raw:p.rawX,land:end.x,launchPower,
  powerDamage:shotDamageScale(charge,grade.accuracy)};
}
function sweep(){
 game.angle=36;game.chargeSweepTime=0;game.chargedPower=20;
 const sights=[],charges=[];
 for(let i=0;i<162;i++){
  advanceChargePower(1/60);
  sights.push(duelRangeReferencePoint(game.angle).x);
  charges.push(game.chargedPower);
 }
 return {sights,charges};
}
({sample,sweep,range:(angle,power)=>duelRawRangeX(angle,power),
 fixedSight:(angle,charge,wind)=>{game.angle=angle;game.wind=wind;game.chargedPower=charge;return duelRangeReferencePoint(angle).x;},
 trueHit:(angle,charge,wind,needle=.5)=>{game.angle=angle;game.wind=wind;
   const p=duelMeterLaunchPower(charge,precisionGrade(needle));
   const path=predict(angle,p,wind,'player',640,(needle-.5)*2,0,false);
   return path.impact?.kind==='foe';},
 windPhysics:(angle,power,wind)=>{game.angle=angle;game.wind=wind;
   const path=predict(angle,power,wind,'player',900,0,0,true);
   return (path.impact||path.edgeExit||path.at(-1)).x;},
 steer:(bias,wind)=>timingSideSpeed(bias,wind)})
`;
const {sample,sweep,range,fixedSight,windPhysics,trueHit,steer}=vm.runInNewContext(source,{assert}, {timeout:10000});
const low=sample(8),medium=sample(44),high=sample(88);
assert(medium.sight>low.sight+350,
 'A middle elevation must reach much farther than a grazing shot');
assert(medium.sight>high.sight+350,
 'A near-vertical shot must fall far short of the medium elevation');
assert(medium.sight>=1018+70,
 'The farthest angle must permit compensation behind the enemy camp');
let maximum={angle:0,x:0},last=null;
for(let angle=8;angle<=88;angle++){
 const s=sample(angle);
 if(s.sight>maximum.x)maximum={angle,x:s.sight};
 if(last!==null)assert(Math.abs(s.sight-last)<36,
  'Small angle movements must produce continuous distance shifts');
 last=s.sight;
 for(const charge of [20,40,60,80,100]){
  for(const wind of [-4,0,4]){
   assert.equal(fixedSight(angle,charge,wind),s.sight,
    'The neutral range cursor must depend ONLY on the angle');
  }
 }
}
assert(maximum.angle>=32&&maximum.angle<=56,
 'The maximum range must occur at a physical mid-angle');
for(let angle=8;angle<maximum.angle;angle++){
 assert(sample(angle+1).sight>=sample(angle).sight-.8,
  'Distance must generally grow as a low shot approaches the optimal angle');
}
for(let angle=maximum.angle;angle<88;angle++){
 assert(sample(angle+1).sight<=sample(angle).sight+.8,
  'Distance must generally shrink beyond the optimal elevation');
}
const meter=sweep();
assert(meter.charges.every(n=>n>=20&&n<=100&&Number.isFinite(n)),'Charge stays in bounds');
assert(Math.min(...meter.charges)<=20.01&&Math.max(...meter.charges)>=99.9,
 'The timed charge must cover both ends of the scale');
assert(meter.charges.some(n=>Math.abs(n-Math.round(n))>.01),
 'Charge should update smoothly, not jump by whole numbers');
assert(meter.sights.every(x=>x===meter.sights[0]),
 'The angle-only sight stays stationary while the charge meter sweeps');
assert(sample(40,100).powerDamage>sample(40,20).powerDamage,
 'More charge must increase actual shell damage');
assert(sample(40,80,0,.5).powerDamage>sample(40,80,0,.1).powerDamage,
 'Better precision must increase actual shell damage');
assert(sample(40,100).launchPower>sample(40,20).launchPower,
 'Charging must also influence the fired shell velocity');
assert(sample(40,70,0,.5).launchPower>sample(40,70,0,.1).launchPower,
 'Precision timing must alter the real shell speed');
assert(steer(-.8,0)<0&&steer(.8,0)>0,
 'Left/right precision timing must steer the actual muzzle velocity');
const windLeft=sample(22,60,-4,.5),windCalm=sample(22,60,0,.5),windRight=sample(22,60,4,.5);
assert(windLeft.land<windCalm.land-40,
 'Leftward wind 4 must carry the projectile meaningfully left');
assert(windRight.land>windCalm.land+40,
 'Rightward wind 4 must carry the projectile meaningfully right');
assert.equal(windLeft.sight,windCalm.sight,
 'Wind must not move the neutral sight while the real shell drifts');
let compensable=false,actualHit=false;
for(let angle=19;angle<=68;angle+=.25){
 const p=sample(angle,60,-4,.5);
 if(Math.abs(p.land-1018)<20&&p.sight>1018){compensable=true;break;}
}
for(let angle=8;angle<=88;angle+=.1){
 if(trueHit(angle,60,-4,.5)&&sample(angle,60,-4,.5).sight>1018){actualHit=true;break;}
}
assert(compensable,
 'A leftward wind of strength 4 must be compensable by aiming farther right using angle ALONE');
assert(actualHit,
 'The same angle-only correction must produce an actual enemy collider hit, not just matching horizontal distances');
console.log('CannonTale angle-only / wind / charge regression OK:',JSON.stringify({
 sight:{low:Math.round(low.sight),middle:Math.round(medium.sight),high:Math.round(high.sight),
  bestAngle:maximum.angle,bestRange:Math.round(maximum.x)},
 wind4:{left:Math.round(windLeft.land),calm:Math.round(windCalm.land),right:Math.round(windRight.land)},
 compensable,damage:{weak:sample(40,20).powerDamage,strong:sample(40,100).powerDamage},
 meter:{min:Math.min(...meter.charges),max:Math.max(...meter.charges)}
}));
