import { getCard } from './engine/cards';
import { evaluateCardMission, isMissionComplete, missionRequiredCount } from './engine/rules/missions';

// Presentation only: old saves without a mission remain unchanged.
export function missionView(game) {
  const mission = game?.mission;
  if (mission?.kind !== 'gakpae' || !Array.isArray(mission.cardIds) ||
      (!mission.unconditional && !mission.cardIds.length) || mission.cardIds.some(id => !getCard(id))) return null;
  const human = Array.isArray(game.humanCaptured) ? game.humanCaptured : [];
  const computer = Array.isArray(game.computerCaptured) ? game.computerCaptured : [];
  const progress = evaluateCardMission(mission, human, computer);
  const legacyComplete = !mission.effect && mission.cardIds.length > 0 && (progress.humanCardIds.length === mission.cardIds.length || progress.computerCardIds.length === mission.cardIds.length);
  const failed = !mission.unconditional && !mission.resolvedBy && !legacyComplete && (isMissionComplete(mission, human, computer) || game.phase === 'round-ended');
  const status = mission.resolvedBy || legacyComplete ? (mission.enabled === false ? 'skipped' : 'complete') : failed ? 'failed' : 'active';
  return {
    effect: mission.effect || null,
    targetTheme: mission.targetTheme || 'mixed',
    unconditional: !!mission.unconditional,
    requiredCount: mission.unconditional ? null : missionRequiredCount(mission),
    failed,
    status,
    enabled: mission.enabled !== false,
    resolvedBy: mission.resolvedBy || null,
    locked: isMissionComplete(mission, human, computer) || game.phase === 'round-ended',
    targets: mission.cardIds.map(id => ({
      id,
      owner: human.includes(id) ? 'human' : computer.includes(id) ? 'computer' : null
    })),
    humanCount: progress.humanCardIds.length,
    computerCount: progress.computerCardIds.length,
    humanMultiplier: progress.humanMultiplier,
    computerMultiplier: progress.computerMultiplier
  };
}
