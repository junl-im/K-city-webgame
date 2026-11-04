import { describe, it, expect, beforeAll } from 'vitest';
import { createInitialGame, playTurn, setMissionEnabled, scoreFor } from '../engine/gameState';
import { createCardMission, isMissionComplete } from '../engine/rules/missions';
import { createMatgoDeck } from '../engine/deck';
import { missionView } from '../missionView.js';
import { opponentSetWarnings } from '../opponentSetWarnings.js';

beforeAll(()=>{if(!globalThis.crypto?.randomUUID) Object.defineProperty(globalThis,'crypto',{value:{randomUUID:()=> '00000000-0000-4000-8000-000000000000'}})});
function arranged(ids, required, enabled=true) {
 const g=createInitialGame(707,'normal',100,'human');
 const fixed=['m01-01','m01-02','m04-01'];
 const remaining=createMatgoDeck().filter(id=>!fixed.includes(id));
 g.humanHand=['m01-01',...remaining.splice(0,9)];g.computerHand=remaining.splice(0,10);
 g.floorCards=['m01-02',...remaining.splice(0,7)];g.drawPile=['m04-01',...remaining];
 g.humanCaptured=[];g.computerCaptured=[];g.phase='playing';g.currentPlayer='human';
 g.mission={kind:'gakpae',cardIds:ids,requiredCount:required,effect:{kind:'points',value:3},enabled};return g;
}
describe('다장 미션',()=>{
 it('새 미션은 목표 3장 중 2장 또는 3장이 필요하고 미션 없음도 있다',()=>{
  const missions=Array.from({length:3000},(_,i)=>createCardMission(i+1));
  expect(missions.some(m=>!m)).toBe(true);
  expect(missions.some(m=>m?.unconditional)).toBe(true);
  const cardMissions=missions.filter(m=>m && !m.unconditional);
  expect(new Set(cardMissions.map(m=>m.requiredCount))).toEqual(new Set([2,3]));
  for(const m of cardMissions) expect(m.cardIds).toHaveLength(3);
 });
 it('목표 하나만 먹으면 진행 상태이며 보상 없이 스위치를 조작할 수 있다',()=>{
  const g=playTurn(arranged(['m01-01','m03-01','m08-01'],2),'human','m01-01').state;
  expect(g.mission.resolvedBy).toBeUndefined();expect(g.humanMissionPoints||0).toBe(0);
  expect(isMissionComplete(g.mission,g.humanCaptured,g.computerCaptured)).toBe(false);
  expect(setMissionEnabled(g,false).mission.enabled).toBe(false);
 });
 it('한 턴에 두 목표를 획득하면 2장 미션을 한 번만 달성한다',()=>{
  const result=playTurn(arranged(['m01-01','m01-02','m03-01'],2),'human','m01-01');
  expect(result.state.mission.resolvedBy).toBe('human');expect(result.state.humanMissionPoints).toBe(3);
  expect(result.missionCompleted).toBe(true);expect(scoreFor(result.state,'human').total).toBeGreaterThanOrEqual(3);
 });
 it('3장 미션은 두 장을 먹어도 보상을 주지 않고, 3장째에만 완료한다',()=>{
  let g=arranged(['m01-01','m01-02','m03-01'],3);
  let partial=playTurn(g,'human','m01-01').state;expect(partial.humanMissionPoints||0).toBe(0);expect(partial.mission.resolvedBy).toBeUndefined();
  g=arranged(['m01-01','m01-02','m03-01'],3);
  for(const z of ['humanHand','computerHand','floorCards','drawPile']) {const i=g[z].indexOf('m03-01');if(i>=0)g[z].splice(i,1)}
  g.humanCaptured.push('m03-01');g=playTurn(g,'human','m01-01').state;
  expect(g.humanMissionPoints).toBe(3);expect(g.mission.resolvedBy).toBe('human');
 });
 it('상대가 목표패를 보유해도 내 진행 수에 합산하지 않는다',()=>{
  let g=arranged(['m01-01','m01-02','m03-01'],3);
  for(const z of ['humanHand','computerHand','floorCards','drawPile']) {const i=g[z].indexOf('m03-01');if(i>=0)g[z].splice(i,1)}
  g.computerCaptured.push('m03-01');const result=playTurn(g,'human','m01-01');
  expect(result.state.humanMissionPoints||0).toBe(0);expect(result.state.mission.resolvedBy).toBeUndefined();
  expect(isMissionComplete(result.state.mission,result.state.humanCaptured,result.state.computerCaptured)).toBe(true);
 });
 it('서로 나눠 가진 실패 상태에서 미션 피를 뺏으면 완료로 바뀌고 보상은 한 번만 적용된다',()=>{
  let g=createInitialGame(717,'normal',100,'human');
  const zones=['humanHand','computerHand','floorCards','drawPile','humanCaptured','computerCaptured'] as const;
  const move=(id:string,to:typeof zones[number])=>{for(const z of zones){const i=g[z].indexOf(id);if(i>=0)g[z].splice(i,1)}g[to].push(id)};
  move('m03-03','humanCaptured');move('m04-03','humanCaptured');move('m02-03','computerCaptured');move('bonus-pee-1','humanHand');
  g.phase='playing';g.currentPlayer='human';g.mission={kind:'gakpae',cardIds:['m03-03','m04-03','m02-03'],requiredCount:3,effect:{kind:'points',value:3},enabled:true};
  expect(missionView(g)?.status).toBe('failed');
  const result=playTurn(g,'human','bonus-pee-1');g=result.state;
  expect(g.humanCaptured).toContain('m02-03');expect(g.computerCaptured).not.toContain('m02-03');
  expect(missionView(g)?.status).toBe('complete');expect(g.mission.resolvedBy).toBe('human');expect(g.humanMissionPoints).toBe(3);
  const after=playTurn(g,'human',g.humanHand[0]).state;expect(after.humanMissionPoints).toBe(3);expect(missionView(after)?.status).toBe('complete');
 });
 it('완료 전 미션패가 아직 남으면 진행 상태를 유지한다',()=>{
  const g=arranged(['m01-01','m01-02','m03-01'],3);expect(missionView(g)?.status).toBe('active');
 });
 it('2장 목표 미션은 한 장을 얻은 후에도 껐다 켤 수 있다',()=>{
  let g=playTurn(arranged(['m01-01','m03-01','m08-01'],2),'human','m01-01').state;
  g=setMissionEnabled(g,false);g=setMissionEnabled(JSON.parse(JSON.stringify(g)),true);
  expect(g.mission.enabled).toBe(true);expect(g.mission.resolvedBy).toBeUndefined();
 });
 it('꺼진 미션이 기준에 도달해도 효과가 적용되지 않는다',()=>{
  const g=playTurn(arranged(['m01-01','m01-02','m03-01'],2,false),'human','m01-01').state;
  expect(g.humanMissionPoints||0).toBe(0);expect(g.mission.resolvedBy).toBe('human');
 });
});
describe('상대 조합 비상',()=>{
 it.each([['hongdan','홍단 비상'],['cheongdan','청단 비상'],['chodan','초단 비상'],['godori','고도리 비상']])('%s는 2장일 때만 표시하고 완성·봉쇄 시 숨긴다',async(tag,label)=>{
  const { HWATU_CARDS }=await import('../engine/cards');const ids=HWATU_CARDS.filter(c=>c.tags.includes(tag)).map(c=>c.id);
  expect(opponentSetWarnings({computerCaptured:ids.slice(0,2),humanCaptured:[]}).map(w=>w.label)).toContain(label);
  expect(opponentSetWarnings({computerCaptured:ids,humanCaptured:[]}).map(w=>w.label)).not.toContain(label);
  expect(opponentSetWarnings({computerCaptured:ids.slice(0,2),humanCaptured:[ids[2]]}).map(w=>w.label)).not.toContain(label);
 });
});
