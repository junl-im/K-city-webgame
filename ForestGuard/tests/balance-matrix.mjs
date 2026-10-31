import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Test the game's real WaveDirector methods, rather than copying their formula into a test.
const js=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=js.indexOf('  class WaveDirector {');
const end=js.indexOf('  class ForestBattle ',start);
assert.ok(start>0&&end>start,'WaveDirector class not found');
const WaveDirector=new Function('renderHUD','showBanner',js.slice(start,end)+';return WaveDirector;')(()=>{},()=>{});
const stageMatch=js.match(/const STAGES = \[([\s\S]*?)\]\.map\(/);
assert.ok(stageMatch,'Stages source definition missing');
const stages=new Function('return ['+stageMatch[1]+']')();
assert.equal(stages.length,12);
const seedRandom=(()=>{let s=0x4fc1926;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};})();
const original=Math.random;Math.random=seedRandom;
const reports=[];
try {
  for(let id=0;id<stages.length;id++){
    const stage={id,waves:stages[id][1]};
    const scene={stage,ward:0,wardCharges:0,synergies:new Set(),hp:3000,maxHP:3000};
    const director=new WaveDirector(scene);
    const mid=Math.max(4,Math.ceil(stage.waves*.55));
    let guardian=0,elite=0,boss=0,firstWave=0;
    for(let w=1;w<=stage.waves;w++){
      director.begin();
      assert.equal(director.current,w,'Unexpected current wave');
      assert.ok(director.count>=5&&director.count<70,'Wave count out of sanity range');
      const kinds=[];
      for(let i=0;i<director.count;i++){
        director.spawned=i;
        const type=director.nextType();
        assert.ok(['sprout','runner','brute','thorn','spore','imp','crystal','shroom','guardian','boss'].includes(type));
        kinds.push(type);
      }
      if(w===1){
        firstWave=director.count;
        assert.equal(firstWave,5+Math.min(2,Math.floor(id/4)));
        assert.ok(kinds.every(type=>['sprout','runner'].includes(type)),'First wave must allow solo archer');
      }
      if(w===mid){
        assert.equal(kinds.at(-1),'guardian','Midboss must close middle wave');
        assert.equal(kinds.filter(x=>x==='guardian').length,1);
        guardian++;
      }
      if(w===stage.waves){
        assert.equal(kinds.at(-1),id%4===3?'boss':'shroom','Final wave must have a climax');
      }
      elite+=kinds.filter(x=>x==='shroom').length;
      boss+=kinds.filter(x=>x==='boss').length;
      assert.ok(kinds.filter(x=>['guardian','shroom','boss'].includes(x)).length<=1,'No overlapping big enemies per wave');
      director.spawned=director.count;director.active=false;
    }
    assert.equal(guardian,1,'Every stage must have exactly one midboss');
    assert.equal(boss,id%4===3?1:0,'Chapter boss count');
    assert.ok(elite>=1,'A stage needs a regular elite event');
    reports.push({stage:id+1,waves:stage.waves,firstWave,midWave:mid,elites:elite,boss});
  }
} finally {Math.random=original;}
console.log('ForestGuard 12-stage wave schedule: PASS');
console.log(JSON.stringify(reports));
