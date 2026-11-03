import { describe,it,expect } from 'vitest';
import { handHint } from '../handHint.js';
const game={phase:'playing',humanHand:['m01-03','m01-04','m02-01','bonus-pee-1'],humanCaptured:['m01-01','m01-02'],floorCards:['m02-02']};
describe('손패 상태 표시',()=>{
 it('같은 월 네 장이 모두 내 손과 획득패에 있으면 빛나지 않는 죽은 패로 구분한다',()=>expect(handHint(game,'m01-03')).toBe('dead'));
 it('바닥에서 먹을 수 있는 패는 별도로 강조한다',()=>expect(handHint(game,'m02-01')).toBe('match'));
 it('보너스피를 낼 수 있는 패로 표시한다',()=>expect(handHint(game,'bonus-pee-1')).toBe('bonus'));
 it('상대가 두 장을 가져가도 손에 나머지 두 장이 있으면 죽은 패다',()=>expect(handHint({...game,humanCaptured:[],computerCaptured:['m01-01','m01-02']},'m01-03')).toBe('dead'));
 it('양쪽이 한 장씩 가져가도 죽은 패다',()=>expect(handHint({...game,humanCaptured:['m01-01'],computerCaptured:['m01-02']},'m01-04')).toBe('dead'));
 it('두 장 모두 획득된 상태가 아니면 죽은 패로 표시하지 않는다',()=>expect(handHint({...game,humanCaptured:['m01-01']},'m01-03')).toBe('none'));
});
