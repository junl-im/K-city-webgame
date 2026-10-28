import { describe, expect, it } from 'vitest';
import { ALLOWED_STAKES, STAKES, canUseStake, normalizeStake } from '../stakeRules.js';

describe('난이도별 점당 놀이머니 제한', () => {
  it('초보는 10·100, 중수는 100·1,000, 고수는 1,000·10,000으로 제한', () => {
    expect(ALLOWED_STAKES).toEqual({easy:[10,100],normal:[100,1000],hard:[1000,10000]});
    for (const difficulty of Object.keys(ALLOWED_STAKES)) {
      for (const stake of STAKES) {
        expect(canUseStake(difficulty, stake)).toBe(ALLOWED_STAKES[difficulty].includes(stake));
      }
    }
  });
  it('난이도 변경이나 예전 저장값에서도 제한 밖 판돈을 자동 보정', () => {
    expect(normalizeStake('hard',100)).toBe(1000);
    expect(normalizeStake('normal',10000)).toBe(100);
    expect(normalizeStake('easy',100)).toBe(100);
    expect(normalizeStake('unknown',500)).toBe(100);
  });
});
