import {beforeAll,describe,it,expect} from 'vitest';
import {createInitialGame,playTurn,scoreFor,setMissionEnabled,isValidGameState,chooseStop} from '../engine/gameState';
import {createCardMission,missionMultiplierFor} from '../engine/rules/missions';
import {createMatgoDeck} from '../engine/deck';
import {estimatePlayerThreat} from '../engine/ai/evaluator';
import {calculatePlayerScore} from '../engine/rules/scoring';
import type {CardMission} from '../engine/types';
beforeAll(()=>{if(!globalThis.crypto?.randomUUID) Object.defineProperty(globalThis,'crypto',{value:{randomUUID:()=> '00000000-0000-4000-8000-000000000000'}})});
function arranged(effect: NonNullable<CardMission['effect']>, enabled=true){
 const g=createInitialGame(707,'normal',100,'human'); const fixed=['m01-01','m01-02','m04-01','m02-04']; const remaining=createMatgoDeck().filter(x=>!fixed.includes(x));
 g.humanHand=['m01-01',...remaining.splice(0,9)];g.computerHand=remaining.splice(0,10);g.floorCards=['m01-02',...remaining.splice(0,7)];g.drawPile=['m04-01',...remaining];g.humanCaptured=[];g.computerCaptured=['m02-04'];g.phase='playing';g.currentPlayer='human';g.mission={kind:'gakpae',cardIds:['m01-01'],effect,enabled};return g;
}
describe('판마다 달라지는 미션',()=>{
 it('여러 시드에서 없음과 모든 효과·배수가 등장한다',()=>{const effects=new Set(Array.from({length:3000},(_,i)=>{const m=createCardMission(i+1);return m?.effect ? `${m.effect.kind}:${m.effect.value}`:'none'})); for(const key of ['none','points:1','points:2','points:3','points:-1','points:-2','points:-3','steal:1','give:1',...[2,3,4,5,6,7,8].map(x=>`multiplier:${x}`)]) expect(effects.has(key),key).toBe(true)});
 it.each([-3,-2,-1,1,2,3])('획득 즉시 점수 %i점이 한 번 적용되고 저장된다',points=>{const result=playTurn(arranged({kind:'points',value:points}),'human','m01-01');expect(result.state.mission?.resolvedBy).toBe('human');expect(result.state.humanMissionPoints).toBe(points);expect(scoreFor(result.state,'human').total).toBe(Math.max(0,points));expect(isValidGameState(JSON.parse(JSON.stringify(result.state)))).toBe(true);expect(()=>setMissionEnabled(result.state,false)).toThrow()});
 it.each([2,3,4,5,6,7,8])('획득한 사람의 승리 정산에만 ×%i가 적용된다',value=>{const g=playTurn(arranged({kind:'multiplier',value}),'human','m01-01').state;expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(value);expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'computer')).toBe(1)});
 it('피 뺏기와 주기는 실제 피를 옮기고 모든 패를 보존한다',()=>{const stolen=playTurn(arranged({kind:'steal',value:1}),'human','m01-01');expect(stolen.missionTransfer).toEqual({from:'computer',to:'human',cardIds:['m02-04']});let g=stolen.state;expect(g.humanCaptured).toContain('m02-04');expect(isValidGameState(g)).toBe(true);let give=arranged({kind:'give',value:1});give.humanCaptured=['m02-04'];give.computerCaptured=[];g=playTurn(give,'human','m01-01').state;expect(g.computerCaptured).toContain('m02-04');expect(isValidGameState(g)).toBe(true)});
 it('미션을 끈 상태에서 목표 패를 획득하면 효과 없이 종료되고 다시 켤 수 없다',()=>{let g=setMissionEnabled(arranged({kind:'points',value:3}),false);g=playTurn(g,'human','m01-01').state;expect(g.humanMissionPoints||0).toBe(0);expect(g.mission?.resolvedBy).toBe('human');expect(()=>setMissionEnabled(g,true)).toThrow()});
 it.each([2,3,4,5,6,7,8])('꺼진 ×%i 미션은 목표 패를 얻은 뒤 실제 승리 정산에도 적용되지 않는다',value=>{
  let g=setMissionEnabled(arranged({kind:'multiplier',value}),false);
  g=playTurn(g,'human','m01-01').state;
  expect(g.mission?.resolvedBy).toBe('human');
  expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(1);
  g.phase='awaiting-go-stop';g.pendingDecision='human';
  expect(chooseStop(g,'human').settlement?.missionMultiplier).toBe(1);
 });
 it('AI 위험도와 화면·게임 판단은 같은 미션 점수를 사용한다',()=>{
  const g=arranged({kind:'points',value:3});
  const base=estimatePlayerThreat(g,'human');
  g.humanMissionPoints=3;
  expect(calculatePlayerScore(g,'human').total).toBe(scoreFor(g,'human').total);
  expect(estimatePlayerThreat(g,'human')).toBeCloseTo(base+3*1.7);
  g.humanMissionPoints=-3;
  expect(calculatePlayerScore(g,'human').total).toBe(0);
 });


 it('세 장 미션은 일부 획득 후에도 끄고 켤 수 있으며 배수가 상태에 맞게 바뀐다',()=>{
  let g=arranged({kind:'points',value:1});
  g.mission={kind:'gakpae',cardIds:['m01-01','m03-01','m08-01']};
  g=playTurn(g,'human','m01-01').state;
  expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(2);
  g=setMissionEnabled(g,false);
  expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(1);
  g=setMissionEnabled(JSON.parse(JSON.stringify(g)),true);
  expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(2);
  g.phase='awaiting-go-stop';g.pendingDecision='human';
  expect(chooseStop(g,'human').settlement?.missionMultiplier).toBe(2);
 });
 it('모든 미션패가 양쪽에 획득되면 완료되어 바꿀 수 없다',()=>{
  let g=arranged({kind:'points',value:1});
  g.mission={kind:'gakpae',cardIds:['m01-01','m03-01','m08-01']};
  g.humanCaptured=['m01-01','m03-01'];g.computerCaptured=['m08-01'];
  expect(()=>setMissionEnabled(g,false)).toThrow();
 });
 it('꺼진 세 장 미션도 완료 전에는 다시 켤 수 있다',()=>{
  let g=arranged({kind:'points',value:1});
  g.mission={kind:'gakpae',cardIds:['m01-01','m03-01','m08-01']};
  g=setMissionEnabled(g,false);g=playTurn(g,'human','m01-01').state;
  expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(1);
  g=setMissionEnabled(g,true);
  expect(missionMultiplierFor(g.mission,g.humanCaptured,g.computerCaptured,'human')).toBe(2);
 });

});
