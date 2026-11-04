import {describe,it,expect} from 'vitest';
import {missionView} from '../missionView.js';
const base={mission:{kind:'gakpae',cardIds:['m01-01','m02-01','m03-01']},humanCaptured:['m01-01'],computerCaptured:['m02-01']};
describe('기존 각패 미션 표시',()=>{
 it('실제 각자 보유 수와 정산 배수를 보여 주고 미획득 패 위치는 드러내지 않는다',()=>{
  const view=missionView({...base,humanHand:['m03-01']});
  expect(view.humanCount).toBe(1);expect(view.computerCount).toBe(1);
  expect(view.humanMultiplier).toBe(1);expect(view.computerMultiplier).toBe(1);
  expect(view.targets).toEqual([{id:'m01-01',owner:'human'},{id:'m02-01',owner:'computer'},{id:'m03-01',owner:null}]);
 });
 it('기존 저장 데이터가 미션이 없거나 잘못된 경우 안전하게 생략한다',()=>{
  expect(missionView({humanCaptured:[],computerCaptured:[]})).toBeNull();
  expect(missionView({...base,mission:{kind:'gakpae',cardIds:['bad-id']}})).toBeNull();
 });
 it('쌍방의 모든 미션 배수는 독립적으로 계산한다',()=>{
  expect(missionView({...base,humanCaptured:['m01-01','m02-01','m03-01'],computerCaptured:[]}).humanMultiplier).toBe(8);
 });
});
