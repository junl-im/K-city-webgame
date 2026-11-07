import { describe, expect, it } from 'vitest';
import { humanPlayComment } from '../playComment.js';

const state = overrides => ({phase:'playing',currentPlayer:'human',humanHand:['m01-01','m02-01'],floorCards:['m02-02'],...overrides});
describe('손패 상황 대사',()=>{
  it('다른 먹을 패가 있는데 짝 없는 패를 내면 알려준다',()=>{
    expect(humanPlayComment(state(),'m01-01')).toBe('missed_match');
    expect(humanPlayComment(state(),'m02-01')).toBeNull();
  });
  it('낼 수 있는 패에 짝이 하나도 없으면 별도 대사를 사용한다',()=>{
    expect(humanPlayComment(state({floorCards:['m03-01']}),'m01-01')).toBe('no_match');
    expect(humanPlayComment(state({humanPendingShakeMonth:1}),'m01-01')).toBe('no_match');
  });
  it('보너스패와 상대 차례는 손패 실수로 취급하지 않는다',()=>{
    expect(humanPlayComment(state({humanHand:['bonus-pee-1']}),'bonus-pee-1')).toBeNull();
    expect(humanPlayComment(state({currentPlayer:'computer'}),'m01-01')).toBeNull();
  });
});
