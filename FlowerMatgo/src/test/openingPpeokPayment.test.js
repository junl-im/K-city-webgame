import {describe,expect,it} from 'vitest';
import {settleOpeningPpeok} from '../openingPpeok.js';

describe('첫뻑 놀이머니',()=>{
 it.each([10,100,1000,10000])('점당 %i냥에 7점 보상을 한 번만 지급하고 새로고침해도 중복되지 않는다',pointValue=>{
  const before={gameUuid:'round',pointValue,humanOpeningPpeokCount:0,computerOpeningPpeokCount:0};
  const app={wallet:1000000,game:before};
  const next={...before,humanOpeningPpeokCount:1};
  expect(settleOpeningPpeok(app,next)).toEqual({player:'human',amount:pointValue*7});
  expect(app.wallet).toBe(1000000+pointValue*7);
  expect(settleOpeningPpeok(app,next)).toBeNull();
  const restored=JSON.parse(JSON.stringify({...app,game:next}));
  expect(settleOpeningPpeok(restored,next)).toBeNull();
  expect(restored.wallet).toBe(app.wallet);
 });
 it('상대 첫뻑은 보유 머니 한도에서 지불하고 음수가 되지 않는다',()=>{
  const before={gameUuid:'round',pointValue:1000,humanOpeningPpeokCount:0,computerOpeningPpeokCount:0};
  const app={wallet:5000,game:before};
  expect(settleOpeningPpeok(app,{...before,computerOpeningPpeokCount:1})).toEqual({player:'computer',amount:5000});
  expect(app.wallet).toBe(0);
 });
 it('기존 저장에 기록된 첫뻑을 새 기능에서 소급 지급하지 않는다',()=>{
  const game={gameUuid:'old',pointValue:100,humanOpeningPpeokCount:1,computerOpeningPpeokCount:0};
  const app={wallet:1000,game};
  expect(settleOpeningPpeok(app,game)).toBeNull();expect(app.wallet).toBe(1000);
 });
});
