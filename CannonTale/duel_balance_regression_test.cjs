// Reproduce the real CannonTale duel AI search and ballistic integrator with a
// deterministic random source. No browser, assets or external dependencies.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function take(from,to){
 const a=html.indexOf(from),b=html.indexOf(to,a+from.length);
 assert(a>=0&&b>a,`Missing game source ${from} .. ${to}`);
 return html.slice(a,b);
}
const source=`
 const W=1200,H=640,G=465,WIND_FORCE=46,WIND_LIFT_FORCE=38,TIMING_STEER_FORCE=136,DUEL_SIGHT_POWER=82,DUEL_WIND_FORCE=22,DUEL_MAX_HP=420;
 const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
 let seed=1;
 const rnd=(a,b)=>{seed=(seed*1664525+1013904223)>>>0;return a+(b-a)*seed/4294967296;};
 const game={mode:'duel',hero:'fox',aiHero:'bear',terrain:null,angle:43,
  wind:0,windLift:0,difficulty:'normal',playerHp:DUEL_MAX_HP,aiShots:0,lastPlayerVolleyDamage:0};
 ${take('function terrainY(','function powerVelocity(')}
 ${take('function projectileSpeed(','function launch(')}
 ${take('function predict(','function buildAdventure(')}
 game.terrain=initialTerrain('duel');
 function sample(difficulty,wind,lift,shots=4){
  // Same gust scenario starts from the same random state on all difficulties.
  seed=(0x9e3779b9^Math.round((wind+5)*1000)^(Math.round((lift+3)*1000)<<14))>>>0;
  game.difficulty=difficulty;game.wind=wind;game.windLift=lift;
  game.aiShots=0;game.playerHp=DUEL_MAX_HP;game.lastPlayerVolleyDamage=0;
  const result=[];
  for(let i=0;i<shots;i++){
   const shot=chooseAiShot();
   const path=predict(shot.angle,shot.power,wind,'ai',900,shot.timingBias,lift);
   const impact=path.impact||path.edgeExit||path[path.length-1];
   const dist=impact?Math.hypot(impact.x-190,impact.y-(terrainY(190)-29)):Infinity;
   const radius=shot.weapon==='bomb'?105:shot.weapon==='split'?55:62;
   const approximate=path.impact?.kind==='foe'||dist<radius+30;
   // One first-contact splash, before any split fragments. This is a
   // comparative estimate, not a full turn-by-turn combat win-rate model.
   const base={normal:78,bomb:62,split:40}[shot.weapon];
   const bonus=path.impact?.kind==='foe'?(dist<=11?1.38:1.16):1;
   const estimatedDamage=approximate?Math.min(100,Math.max(12,
    Math.round((1-dist/(radius+30))*base*bonus))):0;
   result.push({weapon:shot.weapon,angle:shot.angle,power:shot.power,
    direct:path.impact?.kind==='foe',splash:approximate,
    distance:dist,estimatedDamage,wind,lift});
  }
  return result;
 }
 ({sample});
`;
const {sample}=vm.runInNewContext(source,{}, {timeout:30000});
const report=[];
for(const difficulty of ['easy','normal','hard']){
 const samples=[];
 for(const wind of [-4.2,-2.6,2.6,4.2])
  for(const lift of [-1.7,1.7])samples.push(...sample(difficulty,wind,lift,4));
 const direct=samples.filter(s=>s.direct).length/samples.length;
 const splash=samples.filter(s=>s.splash).length/samples.length;
 const estimatedDamage=samples.reduce((total,s)=>total+s.estimatedDamage,0)/samples.length;
 const byWeapon=Object.fromEntries(['normal','bomb','split'].map(w=>[w,samples.filter(s=>s.weapon===w).length]));
 report.push({difficulty,samples:samples.length,direct:Math.round(direct*1000)/10,
  splash:Math.round(splash*1000)/10,estimatedDamage:Math.round(estimatedDamage*10)/10,weapons:byWeapon});
}
console.log('CannonTale AI duel baseline:',JSON.stringify(report));
assert(report.every(x=>x.samples===32),'Each difficulty needs the same wind/vertical-gust sample count');
assert(report.every(x=>x.splash>=x.direct),'A direct hit must always be considered inside splash coverage');
assert(report[0].estimatedDamage<report[1].estimatedDamage&&report[1].estimatedDamage<report[2].estimatedDamage,
 'Duel AI damage pressure must rise smoothly with difficulty');
assert(report[2].direct<=75,'Hard AI should not score almost-guaranteed direct hits across opposing gusts');
assert(report[2].estimatedDamage<52,'Hard AI average first-contact pressure needs counterplay time');
