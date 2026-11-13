import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {VOICE_CAST,VOICE_PACKS,VOICE_SCRIPTS,GO_SPOKEN,voicePackReady} from '../voiceDirector.js';
import {goVoice,openingVoice,roundVoices,turnVoices} from '../voiceEvents.js';
import {TRIO_VOICE_CANDIDATES,TRIO_CANDIDATE_COUNT} from '../voiceTrioCandidates.js';

// Rehearsal plan cannot silently diverge from the actual gameplay event IDs.
const path=fileURLToPath(new URL('../../scripts/voice_trio_v43.json',import.meta.url));
const plan=JSON.parse(readFileSync(path,'utf-8'));
const ids=new Set(plan.entries.map(x=>x.id));
describe('Flower Matgo v43 voice rehearsal coverage',()=>{
 it('covers all declared game voice IDs and 1-10 go with 88 exact variants',()=>{
  expect(plan.entries).toHaveLength(88);
  expect(ids.size).toBe(49);
  for(const event of [...Object.keys(VOICE_SCRIPTS),...Object.keys(GO_SPOKEN).map(n=>'go'+n)])expect(ids.has(event),event).toBe(true);
  expect(ids.has('stop')).toBe(true);
  expect(ids.has('win')).toBe(true);
  expect(ids.has('lose')).toBe(true);
  expect(ids.has('hurry')).toBe(true);
 });
 it('uses correct roles and scripts without speaker drift',()=>{
  const pairs=new Set();
  for(const entry of plan.entries){
   expect(VOICE_CAST[entry.role],entry.id).toBeTruthy();
   const key=entry.id+':'+entry.variant;
   expect(pairs.has(key),'duplicate '+key).toBe(false);
   pairs.add(key);
   if(entry.id.startsWith('go')&&/^go\d+$/.test(entry.id)){
    expect(entry.role).toBe('main');
    expect(entry.text).toBe(GO_SPOKEN[Number(entry.id.slice(2))]);
   }else{
    expect(entry.role).toBe(VOICE_SCRIPTS[entry.id].role);
    expect(entry.text).toBe(VOICE_SCRIPTS[entry.id].lines[entry.variant-1]);
   }
  }
  expect(plan.entries.filter(e=>e.role==='main')).toHaveLength(44);
  expect(plan.entries.filter(e=>e.role==='rival')).toHaveLength(26);
  expect(plan.entries.filter(e=>e.role==='host')).toHaveLength(18);
 });
 it('uses correct perspective when computer wins or steals a human pi',()=>{
  expect(VOICE_SCRIPTS.lose.role).toBe('rival');
  expect(VOICE_SCRIPTS.lose.lines[0]).toContain('이겼네');
  expect(VOICE_SCRIPTS.give.role).toBe('main');
  expect(roundVoices({phase:'round-ended',winner:'computer'})).toEqual(['lose']);
  expect(turnVoices({stolenPee:['p1']},'computer')).toEqual(['give']);
 });
 it('wires all 88 approved-name candidates to actual game event IDs without loading them yet',()=>{
  expect(TRIO_CANDIDATE_COUNT).toBe(88);
  expect(Object.keys(TRIO_VOICE_CANDIDATES.trio).sort()).toEqual([...ids].sort());
  for(const [id,variants] of Object.entries(TRIO_VOICE_CANDIDATES.trio)){
    const expected=plan.entries.filter(c=>c.id===id);
    expect(variants).toHaveLength(expected.length);
    for(const v of variants)expect(/^(main|rival|host)__[a-z0-9_]+__v0[12]$/.test(v.file)).toBe(true);
  }
 });
 it('blocks 3-person pack until native listening approval and preserves two published styles',()=>{
  expect(voicePackReady('legacy')).toBe(true);
  expect(voicePackReady('f2')).toBe(true);
  expect(voicePackReady('trio')).toBe(false);
  expect(VOICE_PACKS.trio.folder).toBe('rani-voice-trio-v1');
  expect(plan.ready_for_public_game).toBe(false);
  expect(plan.needs_native_listening_approval).toBe(true);
 });
 it('keeps the real opening, first-ppeok, go count and settlement cue mapping',()=>{
  expect(openingVoice('human','playing')).toBe('first_human');
  expect(goVoice(10)).toBe('go10');
  expect(turnVoices({openingPpeok:{},specialEvents:[{kind:'ppeok'}]})).toEqual(['first_ppeok']);
  expect(roundVoices({phase:'round-ended',roundResult:'nagari'})).toEqual(['nagari']);
 });
});
