import { matgoRulesForPointValue } from './engine/rules/settings';
// Warning means a loss at the current scores would trigger a bak. It is not
// a prediction and must stay in sync with settlement's existing conditions.
export function currentBakWarnings(own, opponent, ownCardCount, pointValue) {
  if (!ownCardCount) return [];
  const warnings=[];
  if (opponent.junkCount >= matgoRulesForPointValue(pointValue).junkStart && own.junkCount >= 1 && own.junkCount <= 7) warnings.push('피박 주의');
  if (opponent.brightCount === 5 || (opponent.brightCount >= 3 && own.brightCount === 0)) warnings.push('광박 주의');
  return warnings;
}
