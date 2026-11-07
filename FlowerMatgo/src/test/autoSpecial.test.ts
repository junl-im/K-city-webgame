import { describe, expect, it } from 'vitest';
import { automaticSpecial } from '../autoSpecial.js';
import { createInitialGame, declareShake, playBomb } from '../engine/gameState';

function game(hand: string[],floor: string[]) {
  const state=createInitialGame(12345,'normal',1000,'human');
  state.phase='playing';state.currentPlayer='human';state.pendingDecision=null;
  state.humanHand=hand;state.floorCards=floor;state.humanPendingShakeMonth=null;state.humanShakenMonths=[];
  return state;
}
describe('자동 치기 특수 선택',()=>{
  it('같은 월 손패 세 장과 바닥 한 장이 있으면 폭탄을 내고 빈 패를 만든다',()=>{
    const state=game(['m01-01','m01-02','m01-03','m02-01'],['m01-04']);
    const move=automaticSpecial(state);
    expect(move).toEqual({kind:'bomb',month:1});
    const result=playBomb(state,'human',move.month);
    expect(result.state.humanHand).toEqual(['m02-01']);
    expect(result.state.humanBombSkips).toBe(2);
    expect(result.specialEvents?.some(event=>event.kind==='bomb')).toBe(true);
  });
  it('폭탄이 없을 때는 세 장을 흔들고 한 장을 낼 수 있게 한다',()=>{
    const state=game(['m01-01','m01-02','m01-03','m02-01'],['m03-01']);
    const move=automaticSpecial(state);
    expect(move).toEqual({kind:'shake',month:1});
    const next=declareShake(state,'human',move.month);
    expect(next.humanPendingShakeMonth).toBe(1);
    expect(automaticSpecial(next)).toBeNull();
    state.humanShakenMonths=[1];expect(automaticSpecial(state)).toBeNull();
  });
  it('현재 선택한 월과 다른 월이나 상대 차례에는 끼어들지 않는다',()=>{
    const state=game(['m01-01','m01-02','m01-03'],['m01-04']);
    expect(automaticSpecial(state,2)).toBeNull();
    state.currentPlayer='computer';expect(automaticSpecial(state)).toBeNull();
  });
});
