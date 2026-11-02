import {describe,it,expect} from 'vitest';
import {doubleOffer} from '../doubleStake.js';
const win = {phase:'round-ended',roundResult:'win',winner:'human',settlement:{displayAmount:1000}};
describe('승리금 묻고 더블',()=>{
  it('처음 승리금을 걸어 ×2, 다시 이기면 ×4로 이어간다',()=>{
    expect(doubleOffer(win)).toEqual({amount:1000,level:2});
    expect(doubleOffer({...win,doublePayout:2000,doubleLevel:2})).toEqual({amount:2000,level:4});
    expect(doubleOffer({...win,doublePayout:4000,doubleLevel:4})).toEqual({amount:4000,level:8});
  });
  it('이전 저장도 이어가고 패배·나가리·위험한 금액은 거절한다',()=>{
    expect(doubleOffer({...win,doublePayout:2000})).toEqual({amount:2000,level:4});
    expect(doubleOffer({...win,winner:'computer'})).toBeNull();
    expect(doubleOffer({...win,roundResult:'nagari'})).toBeNull();
    expect(doubleOffer({...win,doublePayout:Number.MAX_SAFE_INTEGER})).toBeNull();
  });
});
