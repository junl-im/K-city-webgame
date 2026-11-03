import { createDeck, shuffleDeck } from '../deck';
import type { CardMission, PlayerId } from '../types';
import { randomInteger } from '../random';

export interface MissionProgress {
  humanCardIds: string[];
  computerCardIds: string[];
  humanMultiplier: number;
  computerMultiplier: number;
}

export function createCardMission(seed: number): CardMission | null {
  const shuffled = shuffleDeck(createDeck(), seed ^ 0x5f3759df);
  const effects: Array<CardMission['effect'] | null> = [
    null, {kind:'points',value:1}, {kind:'points',value:2}, {kind:'points',value:3},
    {kind:'points',value:-1}, {kind:'points',value:-2}, {kind:'points',value:-3},
    ...[2,3,4,5,6,7,8].map(value => ({kind:'multiplier' as const,value})),
    {kind:'steal',value:1}, {kind:'give',value:1}
  ];
  const choice = randomInteger(shuffled.seed ^ 0x7a8b91cd, effects.length);
  const effect = effects[choice.value];
  return effect ? {kind:'gakpae', cardIds:shuffled.cards.slice(0,1), effect, enabled:true} : null;
}

export function evaluateCardMission(
  mission: CardMission | null | undefined,
  humanCaptured: string[],
  computerCaptured: string[]
): MissionProgress {
  if (!mission) return { humanCardIds: [], computerCardIds: [], humanMultiplier: 1, computerMultiplier: 1 };
  const humanSet = new Set(humanCaptured);
  const computerSet = new Set(computerCaptured);
  const humanCardIds = mission.cardIds.filter(cardId => humanSet.has(cardId));
  const computerCardIds = mission.cardIds.filter(cardId => computerSet.has(cardId));
  return {
    humanCardIds,
    computerCardIds,
    humanMultiplier: mission.effect ? (mission.effect.kind === 'multiplier' && mission.resolvedBy === 'human' ? mission.effect.value : 1) : 2 ** humanCardIds.length,
    computerMultiplier: mission.effect ? (mission.effect.kind === 'multiplier' && mission.resolvedBy === 'computer' ? mission.effect.value : 1) : 2 ** computerCardIds.length
  };
}

export function missionMultiplierFor(
  mission: CardMission | null | undefined,
  humanCaptured: string[],
  computerCaptured: string[],
  player: PlayerId
): number {
  const progress = evaluateCardMission(mission, humanCaptured, computerCaptured);
  return player === 'human' ? progress.humanMultiplier : progress.computerMultiplier;
}

export function capturedMissionCards(mission: CardMission | null | undefined, capturedCardIds: string[]): string[] {
  if (!mission || (mission.effect && (!mission.enabled || mission.resolvedBy))) return [];
  const targets = new Set(mission.cardIds);
  return [...new Set(capturedCardIds.filter(cardId => targets.has(cardId)))];
}
