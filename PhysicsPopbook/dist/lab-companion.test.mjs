import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COMPANION_ART, companionCue } from './lab-companion.mjs';

const lessons = ['gravity','orbit','light','circuit','mechanics','magnet','sound','inertia','friction','buoyancy','pendulum','heat'];
const base = {
  lesson:'gravity',status:'idle',air:false,orbitRadius:1,mechanicsMode:'lever',
  circuitClosed:false,magnetMaterial:'iron',soundFrequency:340,extraMode:'gentle'
};

for (const lesson of lessons) {
  const cue = companionCue({...base,lesson});
  assert.ok(cue.name && cue.speech,`${lesson} must have a friendly guide`);
  assert.ok(cue.mobileSpeech.length<=22,`${lesson} must fit in a mobile speech bubble`);
  assert.ok(['curious','excited','yay'].includes(cue.mood));
  assert.match(COMPANION_ART[cue.animal],/\.webp$/);
  assert.ok(existsSync(fileURLToPath(new URL(COMPANION_ART[cue.animal],import.meta.url))),`${lesson} mascot artwork must exist`);
  const excited=companionCue({...base,lesson,status:'running'});
  const done=companionCue({...base,lesson,status:'done'});
  assert.equal(excited.mood,'excited');
  assert.equal(done.mood,'yay');
}

const toyAtlas=fileURLToPath(new URL('./assets/physics-toys-atlas-v10.webp',import.meta.url));
assert.ok(existsSync(toyAtlas),'Raster science toy atlas must be bundled for mobile');
assert.ok(statSync(toyAtlas).size<600*1024,'Atlas should remain economical for phone downloads');

function says(partial,lesson=partial.lesson) {
  return companionCue({...base,...partial,lesson}).speech;
}

assert.notEqual(says({lesson:'gravity',air:false,status:'done'}),says({lesson:'gravity',air:true,status:'done'}));
assert.notEqual(says({lesson:'orbit',orbitRadius:1}),says({lesson:'orbit',orbitRadius:1.5}));
assert.notEqual(says({lesson:'circuit',circuitClosed:true}),says({lesson:'circuit',circuitClosed:false}));
assert.notEqual(says({lesson:'magnet',magnetMaterial:'wood'}),says({lesson:'magnet',magnetMaterial:'iron'}));
assert.notEqual(says({lesson:'sound',soundFrequency:110}),says({lesson:'sound',soundFrequency:700}));
assert.notEqual(says({lesson:'friction',extraMode:'ice'}),says({lesson:'friction',extraMode:'rough'}));
assert.notEqual(says({lesson:'pendulum',extraMode:'moon'}),says({lesson:'pendulum',extraMode:'earth'}));
assert.notEqual(says({lesson:'buoyancy',extraMode:'stone'}),says({lesson:'buoyancy',extraMode:'duck'}));

console.log('All 12 companion scenes and condition-dependent messages passed');
