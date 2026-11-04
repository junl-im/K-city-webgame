import {describe,it,expect} from 'vitest';
import {createCardMission} from '../engine/rules/missions';
import {getCard} from '../engine/cards';
import {missionView} from '../missionView.js';
describe('미션 목표 다양화',()=>{
 it('시드별로 아홉 종류가 나오고 모든 목표패는 해당 종류에 맞는다',()=>{
  const seen=new Set(); const seasons={spring:[3,4,5],summer:[6,7,8],autumn:[9,10,11],winter:[12,1,2]};
  for(let seed=1;seed<=5000;seed++){const m=createCardMission(seed);if(!m||m.unconditional)continue;seen.add(m.targetTheme);expect(m.cardIds).toHaveLength(3);expect(new Set(m.cardIds).size).toBe(3);expect([2,3]).toContain(m.requiredCount);for(const id of m.cardIds){const c=getCard(id);if(m.targetTheme==='junk')expect(['junk','doubleJunk']).toContain(c.type);else if(seasons[m.targetTheme])expect(seasons[m.targetTheme]).toContain(c.month);else if(m.targetTheme!=='mixed')expect(c.type).toBe(m.targetTheme)}}
  expect(seen).toEqual(new Set(['mixed','bright','animal','ribbon','junk','spring','summer','autumn','winter']));
 });
 it('기존 저장 미션은 일반 미션으로 보이고 기존 상태가 유지된다',()=>{
  const v=missionView({phase:'playing',humanCaptured:['m01-01'],computerCaptured:[],mission:{kind:'gakpae',cardIds:['m01-01','m02-01','m03-01'],requiredCount:2,effect:{kind:'points',value:1},enabled:true}});
  expect(v.targetTheme).toBe('mixed');expect(v.humanCount).toBe(1);expect(v.status).toBe('active');
 });
});
