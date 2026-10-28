import { describe, expect, it } from 'vitest';
import { canEmergencyRecharge, cheapestRoundCost, hasEnoughForTable } from '../rechargePolicy.js';

describe('비상시에만 가능한 무료 충전', () => {
  it('모든 난이도의 최소 점당금액으로도 시작할 수 없을 때만 열어준다', () => {
    expect(cheapestRoundCost()).toBe(70);
    expect(canEmergencyRecharge(0)).toBe(true);
    expect(canEmergencyRecharge(69)).toBe(true);
    expect(canEmergencyRecharge(70)).toBe(false);
    expect(canEmergencyRecharge(699)).toBe(false);
    expect(canEmergencyRecharge(1000000)).toBe(false);
    expect(canEmergencyRecharge(-1)).toBe(false);
    expect(canEmergencyRecharge(Number.NaN)).toBe(false);
  });

  it('현재 선택한 판의 참가비 판단과 긴급 충전 조건을 구분한다', () => {
    expect(hasEnoughForTable(500, 100)).toBe(false);
    expect(canEmergencyRecharge(500)).toBe(false);
    expect(hasEnoughForTable(500, 10)).toBe(true);
    expect(hasEnoughForTable(700, 100)).toBe(true);
  });
});
