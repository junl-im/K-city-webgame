import {describe,it,expect} from 'vitest';
import {currentBakWarnings} from '../bakWarnings.js';
const score=(junkCount,brightCount)=>({junkCount,brightCount});
describe('현재 패 기준 박 주의',()=>{
 it('상대가 피 열 장 이상이고 내 피가 한 장부터 일곱 장일 때만 경고한다',()=>{
  expect(currentBakWarnings(score(1,1),score(10,0),1,100)).toContain('피박 주의');
  expect(currentBakWarnings(score(7,1),score(10,0),7,100)).toContain('피박 주의');
  expect(currentBakWarnings(score(0,1),score(10,0),1,100)).not.toContain('피박 주의');
  expect(currentBakWarnings(score(8,1),score(10,0),8,100)).not.toContain('피박 주의');
  expect(currentBakWarnings(score(1,1),score(9,0),1,100)).not.toContain('피박 주의');
 });
 it('상대 광 조건 및 정산 면제 상태를 구분한다',()=>{
  expect(currentBakWarnings(score(3,0),score(0,3),3,100)).toContain('광박 주의');
  expect(currentBakWarnings(score(3,1),score(0,3),3,100)).not.toContain('광박 주의');
  expect(currentBakWarnings(score(0,0),score(10,3),0,100)).toEqual([]);
 });
});
