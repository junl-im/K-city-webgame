import { ALLOWED_STAKES } from './stakeRules.js';

export const EMERGENCY_RECHARGE = 300000;
export const MINIMUM_ROUND_POINTS = 7;

// Emergency money is available only when the player cannot enter even the
// least expensive legal table. Merely selecting an expensive table does not
// unlock a top-up.
export const cheapestRoundCost = () => MINIMUM_ROUND_POINTS * Math.min(...Object.values(ALLOWED_STAKES).flat());

export function canEmergencyRecharge(wallet) {
  return Number.isFinite(wallet) && wallet >= 0 && wallet < cheapestRoundCost();
}

export function hasEnoughForTable(wallet, stake) {
  return Number.isFinite(wallet) && wallet >= MINIMUM_ROUND_POINTS * stake;
}
