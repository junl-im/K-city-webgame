import {describe,it,expect} from 'vitest';
import {goVoice,turnVoices,roundVoices} from '../voiceEvents.js';

describe('game voice cues',()=>{
 it('calls first ppeok once and keeps other simultaneous events',()=>{
  expect(turnVoices({openingPpeok:{player:'human'},ppeok:true,specialEvents:[{kind:'ppeok'},{kind:'sweep'}],stolenPee:['a']})).toEqual(['first_ppeok','sweep','take']);
 });
 it('only announces real transfers and uses the human perspective',()=>{
  expect(turnVoices({stolenPee:['a'],missionCompleted:true,missionTransfer:{to:'computer',cardIds:['b']}},'computer')).toEqual(['give','mission']);
  expect(turnVoices({missionTransfer:{to:'human',cardIds:[]}},'human')).toEqual([]);
 });
 it('maps combos, bonus, go counts and actual settlement baks',()=>{
  expect(turnVoices({bonusCards:['bonus-pee-1']},'human',[{label:'청단'},{label:'고도리'}])).toEqual(['bonus','cheongdan','godori']);
  expect([goVoice(1),goVoice(7),goVoice(11),goVoice(0)]).toEqual(['go1','go7','go_more',null]);
  expect(roundVoices({phase:'round-ended',winner:'human',settlement:{baks:[{code:'pi-bak'},{code:'gwang-bak'}]}})).toEqual(['pibak','gwangbak','win']);
  expect(roundVoices({phase:'round-ended',winner:'computer',settlement:{baks:[{code:'meong-bak'}]}})).toEqual(['meongtta','lose']);
  expect(roundVoices({phase:'round-ended',winner:'human',settlement:{baks:[{code:'go-bak'}]}})).toEqual(['gobak','win']);
  expect(roundVoices({phase:'round-ended',roundResult:'nagari'})).toEqual(['nagari']);
 });
});
