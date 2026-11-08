import { describe, expect, it } from 'vitest';
import { automaticMove, automaticSpecial } from '../autoSpecial.js';
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
  it('손패 두 장과 바닥 두 장이면 두장폭탄을 선택한다',()=>{
    const state=game(['m01-01','m01-02','m02-01'],['m01-03','m01-04']);
    expect(automaticSpecial(state)).toEqual({kind:'bomb',month:1});
    const result=playBomb(state,'human',1);
    expect(result.captured).toEqual(expect.arrayContaining(['m01-01','m01-02','m01-03','m01-04']));
  });
  it('흔들기만 가능한 월보다 당장 먹을 수 있는 다른 월을 우선한다',()=>{
    const state=game(['m01-01','m01-02','m01-03','m02-01'],['m02-02']);
    expect(automaticSpecial(state)).toBeNull();
    expect(automaticMove(state)).toMatchObject({kind:'card',cardId:'m02-01'});
  });
  it('흔들기만 가능한 월보다 손의 보너스를 우선한다',()=>{
    const state=game(['m01-01','m01-02','m01-03','bonus-pee-1'],['m03-01']);
    expect(automaticSpecial(state)).toBeNull();
    expect(automaticMove(state)).toMatchObject({kind:'card',cardId:'bonus-pee-1'});
  });
  it('현재 선택한 월과 다른 월이나 상대 차례에는 끼어들지 않는다',()=>{
    const state=game(['m01-01','m01-02','m01-03'],['m01-04']);
    expect(automaticSpecial(state,2)).toBeNull();
    state.currentPlayer='computer';expect(automaticSpecial(state)).toBeNull();
  });
  it('일반 자동 수는 바닥에서 먹을 수 있는 패를 우선한다',()=>{
    const state=game(['m01-01','m02-01'],['m02-02']);
    expect(automaticMove(state)).toMatchObject({kind:'card',cardId:'m02-01'});
  });
  it('보너스패도 실제로 낼 수 있는 유효한 패로 다룬다',()=>{
    const state=game(['m01-01','bonus-pee-1'],['m03-02']);
    expect(automaticMove(state)).toMatchObject({kind:'card',cardId:'bonus-pee-1'});
  });
  it('흔든 월의 패만 낼 때는 다른 월의 짝을 고르지 않는다',()=>{
    const state=game(['m01-01','m01-02','m01-03','m02-01'],['m02-02']);
    state.humanPendingShakeMonth=1;
    const move=automaticMove(state,1);
    expect(move?.kind).toBe('card');
    if(move?.kind==='card') expect(move.cardId.startsWith('m01-')).toBe(true);
  });
  it('손패가 없고 폭탄 빈 차례가 남으면 뒤집기를 선택한다',()=>{
    const state=game([],['m02-02']);state.humanBombSkips=1;
    expect(automaticMove(state)).toEqual({kind:'flip-only'});
  });
});
