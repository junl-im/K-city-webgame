import { describe, it, expect } from 'vitest';
import { createInitialGame, setMissionEnabled } from '../engine/gameState';
import { isMissionComplete, missionMultiplierFor } from '../engine/rules/missions';
import { missionView } from '../missionView.js';
describe('무조건 미션',()=>{
 it.each([2,3])('패 없이 ×%i를 승자 누구에게나 적용하고 끝나기 전 전환한다',value=>{
  let g=createInitialGame(911,'normal',100,'human');
  g.mission={kind:'gakpae',cardIds:[],unconditional:true,effect:{kind:'multiplier',value},enabled:true};
  expect(missionView(g).unconditional).toBe(true);
  expect(isMissionComplete(g.mission,[],[])).toBe(false);
  expect(missionMultiplierFor(g.mission,[],[],'human')).toBe(value);
  expect(missionMultiplierFor(g.mission,[],[],'computer')).toBe(value);
  g=setMissionEnabled(g,false);expect(missionMultiplierFor(g.mission,[],[],'human')).toBe(1);
  g=setMissionEnabled(g,true);expect(missionMultiplierFor(g.mission,[],[],'computer')).toBe(value);
 });
});
