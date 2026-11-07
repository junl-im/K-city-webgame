import { matgoRulesForPointValue } from './engine/rules/settings';
import { isPiBak } from './engine/rules/piBak';
// Warning means a loss at the current scores would trigger a bak. It is not
// a prediction and must stay in sync with settlement's existing conditions.
export function currentBakWarnings(own, opponent, ownCardCount, pointValue) {
  if (!ownCardCount) return [];
  const warnings=[];
  if (isPiBak(opponent.junkCount,own.junkCount,matgoRulesForPointValue(pointValue).junkStart)) warnings.push('피박 주의');
  if (opponent.brightCount === 5 || (opponent.brightCount >= 3 && own.brightCount === 0)) warnings.push('광박 주의');
  return warnings;
}
