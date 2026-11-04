import { describe,it,expect } from 'vitest';
import { eventAnnouncement,piTransferAnnouncement } from '../specialPresentation.js';
describe('피 이동 문구',()=>{
 it('실제 피가 이동한 수와 대상만 표시한다',()=>{
  const result={specialEvents:[{kind:'jjok',label:'쪽',stolenPee:['m01-03']}],stolenPee:['m01-03']};
  expect(eventAnnouncement(result,'human')).toBe('쪽! · 상대 피 1장 뺏기!');
  expect(eventAnnouncement(result,'computer')).toBe('상대 쪽! · 내 피 1장 뺏김!');
  expect(eventAnnouncement({specialEvents:[{kind:'sweep',label:'싹쓸이',stolenPee:[]}],stolenPee:[]},'human')).toBe('싹쓸이!');
 });
 it('미션 피 주기와 뺏기를 플레이어 기준으로 표시한다',()=>{
  expect(piTransferAnnouncement({missionTransfer:{from:'human',to:'computer',cardIds:['m01-03']}})).toBe('내 피 1장 상대에게 이동');
  expect(piTransferAnnouncement({missionTransfer:{from:'computer',to:'human',cardIds:['m01-03']}})).toBe('상대 피 1장 내게 이동');
  expect(piTransferAnnouncement({missionTransfer:null})).toBe('');
 });
});
