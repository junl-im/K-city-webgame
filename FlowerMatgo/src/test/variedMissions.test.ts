import {beforeAll,describe,it,expect} from 'vitest';
import {createInitialGame,playTurn,scoreFor,setMissionEnabled,isValidGameState} from '../engine/gameState';
import {createCardMission,missionMultiplierFor} from '../engine/rules/missions';
import {createMatgoDeck} from '../engine/deck';
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
 it('피 뺏기와 주기는 실제 피를 옮기고 모든 패를 보존한다',()=>{let g=playTurn(arranged({kind:'steal',value:1}),'human','m01-01').state;expect(g.humanCaptured).toContain('m02-04');expect(isValidGameState(g)).toBe(true);let give=arranged({kind:'give',value:1});give.humanCaptured=['m02-04'];give.computerCaptured=[];g=playTurn(give,'human','m01-01').state;expect(g.computerCaptured).toContain('m02-04');expect(isValidGameState(g)).toBe(true)});
 it('미션을 끈 상태에서 목표 패를 획득하면 효과 없이 종료되고 다시 켤 수 없다',()=>{let g=setMissionEnabled(arranged({kind:'points',value:3}),false);g=playTurn(g,'human','m01-01').state;expect(g.humanMissionPoints||0).toBe(0);expect(g.mission?.resolvedBy).toBe('human');expect(()=>setMissionEnabled(g,true)).toThrow()});
});
