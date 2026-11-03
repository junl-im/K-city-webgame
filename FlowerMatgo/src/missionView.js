import { getCard } from './engine/cards';
import { evaluateCardMission } from './engine/rules/missions';

// Presentation only: old saves without a mission remain unchanged.
export function missionView(game) {
  const mission = game?.mission;
  if (mission?.kind !== 'gakpae' || !Array.isArray(mission.cardIds) ||
      !mission.cardIds.length || mission.cardIds.some(id => !getCard(id))) return null;
  const human = Array.isArray(game.humanCaptured) ? game.humanCaptured : [];
  const computer = Array.isArray(game.computerCaptured) ? game.computerCaptured : [];
  const progress = evaluateCardMission(mission, human, computer);
  return {
    effect: mission.effect || null,
    enabled: mission.enabled !== false,
    resolvedBy: mission.resolvedBy || null,
    locked: !!mission.resolvedBy || (!mission.effect && mission.cardIds.some(id => human.includes(id) || computer.includes(id))),
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
