import { getCard } from '../cards';
import { createMatgoDeck } from '../deck';
import { isBonusPee } from '../rules/bonusPee';
import { calculateCapturedScore, calculatePlayerScore } from '../rules/scoring';
import { findBombOptions, findShakeOptions, stealPeeForBonus } from '../rules/specialRules';
import { missionRequiredCount } from '../rules/missions';
import type { GameState, PlayerId } from '../types';
import type { AiMove, MoveEvaluation } from './types';

const SET_TAGS = ['godori', 'hongdan', 'cheongdan', 'chodan'] as const;
const MATGO_DECK_SIZE = createMatgoDeck().length;

const playerCards = (state: GameState, player: PlayerId) => player === 'human'
  ? { hand: state.humanHand, captured: state.humanCaptured, opponentCaptured: state.computerCaptured, gookjin: state.humanGookjinAsDoubleJunk, bombSkips: state.humanBombSkips ?? 0, shakenMonths: state.humanShakenMonths ?? [], pendingShakeMonth: state.humanPendingShakeMonth ?? null }
  : { hand: state.computerHand, captured: state.computerCaptured, opponentCaptured: state.humanCaptured, gookjin: state.computerGookjinAsDoubleJunk, bombSkips: state.computerBombSkips ?? 0, shakenMonths: state.computerShakenMonths ?? [], pendingShakeMonth: state.computerPendingShakeMonth ?? null };

function cardValue(cardId: string): number {
  const card = getCard(cardId);
  if (!card) return 0;
  const base = card.type === 'bright' ? 8 : card.type === 'animal' ? 4.2 : card.type === 'ribbon' ? 3.2 : card.tags.includes('triple-junk') ? 3.8 : card.type === 'doubleJunk' ? 2.4 : 1.15;
  const special = card.tags.includes('godori') ? 1.4 : card.tags.includes('gookjin') ? 1.2 : 0;
  return base + special + (card.tags.includes('bonus-pee') ? 2.8 : 0);
}

function scoreDelta(captured: string[], added: string[], gookjin: boolean): number {
  const before = calculateCapturedScore(captured, { gookjinAsDoubleJunk: gookjin }).total;
  const after = calculateCapturedScore([...captured, ...added], { gookjinAsDoubleJunk: gookjin }).total;
  return after - before;
}

function tagCount(cardIds: string[], tag: string): number {
  return cardIds.filter(cardId => getCard(cardId)?.tags.includes(tag)).length;
}

function combinationProgress(captured: string[], added: string[]): number {
  let value = 0;
  const next = [...captured, ...added];
  for (const tag of SET_TAGS) {
    const before = tagCount(captured, tag);
    const after = tagCount(next, tag);
    if (after >= 3 && before < 3) value += tag === 'godori' ? 18 : 11;
    else if (after === 2 && before < 2) value += tag === 'godori' ? 7 : 4.5;
    else if (after === 1 && before === 0) value += 1.2;
  }
  const beforeScore = calculateCapturedScore(captured);
  const afterScore = calculateCapturedScore(next);
  if (afterScore.brightCount > beforeScore.brightCount) value += afterScore.brightCount >= 3 ? 7 : 2;
  if (afterScore.animalCount > beforeScore.animalCount) value += Math.max(1, afterScore.animalCount - 3) * 1.2;
  if (afterScore.ribbonCount > beforeScore.ribbonCount) value += Math.max(1, afterScore.ribbonCount - 3);
  if (afterScore.junkCount > beforeScore.junkCount) value += afterScore.junkCount >= 8 ? 2.3 : 0.5;
  return value;
}

function denialValue(opponentCaptured: string[], capturedIds: string[]): number {
  let value = 0;
  for (const tag of SET_TAGS) {
    const opponentCount = tagCount(opponentCaptured, tag);
    const deniedCount = tagCount(capturedIds, tag);
    if (deniedCount > 0 && opponentCount >= 2) value += tag === 'godori' ? 8 : 5;
  }
  return value;
}

function noHitProbability(totalUnknown: number, matchingUnknown: number, handSize: number): number {
  if (matchingUnknown <= 0 || handSize <= 0 || totalUnknown <= 0) return 1;
  let probability = 1;
  for (let index = 0; index < handSize; index += 1) {
    const remaining = totalUnknown - index;
    if (remaining <= 0) break;
    probability *= Math.max(0, remaining - matchingUnknown) / remaining;
  }
  return probability;
}

function opponentMatchRisk(state: GameState, player: PlayerId, cardId: string): number {
  const card = getCard(cardId);
  if (!card) return 0;
  const view = playerCards(state, player);
  const visible = [...view.hand, ...state.floorCards, ...state.humanCaptured, ...state.computerCaptured];
  const visibleMonth = visible.filter(id => getCard(id)?.month === card.month).length;
  const unknownTotal = Math.max(1, MATGO_DECK_SIZE - new Set(visible).size);
  const matchingUnknown = Math.max(0, 4 - visibleMonth);
  const opponentHandSize = player === 'human' ? state.computerHand.length : state.humanHand.length;
  const hitProbability = 1 - noHitProbability(unknownTotal, matchingUnknown, opponentHandSize);
  return hitProbability * (cardValue(cardId) + 2.4);
}

function missionCaptureValue(mission: GameState['mission'], captured: string[], added: string[]): number {
  if (!mission || mission.enabled === false || mission.resolvedBy || mission.unconditional || !mission.cardIds?.length) return 0;
  const targets=new Set(mission.cardIds), owned=new Set(captured);
  const gained=[...new Set(added)].filter(id=>targets.has(id) && !owned.has(id));
  if (!gained.length) return 0;
  const progress=mission.cardIds.filter(id=>owned.has(id)).length;
  const completes=progress+gained.length >= missionRequiredCount(mission);
  const effect=mission.effect;
  if (!effect) return gained.length*2;
  if (!completes) return (effect.kind==='points' && effect.value<0) || effect.kind==='give' ? 0 : gained.length*2;
  if (effect.kind==='points') return effect.value*13;
  if (effect.kind==='steal') return 6*effect.value;
  if (effect.kind==='give') return -6*effect.value;
  return Math.min(20,4*effect.value);
}

export function chooseAiFloorMatch(matches: string[], opponentCaptured: string[], captured: string[] = [], gookjinAsDoubleJunk = false, mission: GameState['mission'] = null): string | undefined {
  const value = (id: string) => cardValue(id) + denialValue(opponentCaptured, [id])
    + scoreDelta(captured, [id], gookjinAsDoubleJunk) * 13
    + combinationProgress(captured, [id]) * 1.15 + missionCaptureValue(mission,captured,[id]);
  return [...matches].sort((left, right) => value(right) - value(left))[0];
}

function capturedByCard(state: GameState, player: PlayerId, cardId: string): { capturedIds: string[]; playedMatchId?: string; matchCount: number } {
  const month = getCard(cardId)?.month;
  const matches = state.floorCards.filter(floorId => getCard(floorId)?.month === month);
  if (matches.length === 0) return { capturedIds: [], matchCount: 0 };
  if (matches.length === 2) {
    const view = playerCards(state, player);
    const selected = chooseAiFloorMatch(matches, view.opponentCaptured, [...view.captured,cardId], view.gookjin, state.mission);
    return { capturedIds: selected ? [selected, cardId] : [cardId], playedMatchId: selected, matchCount: 2 };
  }
  const pile=matches.length===3 ? (state.ppeokPiles || []).find(item=>item.month===month && item.cardIds.every(id=>matches.includes(id))) : null;
  const attached=(pile?.bonusCardIds || []).filter(id=>state.floorCards.includes(id));
  return { capturedIds: [...matches, ...attached, cardId], matchCount: matches.length };
}

function evaluateCard(state: GameState, player: PlayerId, cardId: string): MoveEvaluation {
  const view = playerCards(state, player);
  if (isBonusPee(cardId)) {
    const opponentGookjin=player==='human' ? state.computerGookjinAsDoubleJunk : state.humanGookjinAsDoubleJunk;
    const stolenPee=stealPeeForBonus(view.opponentCaptured,opponentGookjin).stolenCardId;
    const capturedIds = [cardId, ...(stolenPee ? [stolenPee] : [])];
    const immediateValue = capturedIds.reduce((sum, id) => sum + cardValue(id), 0)
      + scoreDelta(view.captured, capturedIds, view.gookjin || stolenPee==='m09-01') * 13;
    const combinationValue = combinationProgress(view.captured, capturedIds);
    return {
      move: { kind: 'card', cardId }, immediateValue, opponentRisk: -2.5, combinationValue,
      total: immediateValue + combinationValue * 1.15 + 8.5,
      reason: `보너스패로 피 ${stolenPee ? '뺏기 및 ' : ''}한 번 더 진행`
    };
  }
  const capture = capturedByCard(state, player, cardId);
  const capturedValue = capture.capturedIds.reduce((sum, id) => sum + cardValue(id), 0);
  const scoreValue = scoreDelta(view.captured, capture.capturedIds, view.gookjin) * 13;
  const immediateValue = capturedValue + scoreValue;
  const combinationValue = combinationProgress(view.captured, capture.capturedIds) + denialValue(view.opponentCaptured, capture.capturedIds)
    + missionCaptureValue(state.mission, view.captured, capture.capturedIds);
  const duplicateCount = view.hand.filter(id => getCard(id)?.month === getCard(cardId)?.month).length;
  const bombPreservation = capture.matchCount === 0 && duplicateCount >= 2 ? (duplicateCount - 1) * 1.8 : 0;
  const opponentRisk = capture.matchCount === 0 ? opponentMatchRisk(state, player, cardId) + bombPreservation : -capture.matchCount * 0.9;
  const ppeokRisk = capture.matchCount === 1 ? opponentMatchRisk(state, player, cardId) * 0.55 : 0;
  const total = immediateValue + combinationValue * 1.15 - opponentRisk * 1.25 - ppeokRisk;
  const move: AiMove = { kind: 'card', cardId, ...(capture.playedMatchId ? { playedMatchId: capture.playedMatchId } : {}) };
  return {
    move, immediateValue, opponentRisk: opponentRisk + ppeokRisk, combinationValue, total,
    reason: capture.matchCount ? `즉시 ${capture.matchCount}장 매칭` : `상대 매칭 위험 ${opponentRisk.toFixed(1)}`
  };
}

function evaluateBomb(state: GameState, player: PlayerId, month: number): MoveEvaluation | null {
  const view = playerCards(state, player);
  const option = findBombOptions(view.hand, state.floorCards).find(candidate => candidate.month === month);
  if (!option) return null;
  const capturedIds = [...option.handCardIds, ...option.floorCardIds];
  const immediateValue = capturedIds.reduce((sum, id) => sum + cardValue(id), 0) + scoreDelta(view.captured, capturedIds, view.gookjin) * 13;
  const combinationValue = combinationProgress(view.captured, capturedIds) + denialValue(view.opponentCaptured, capturedIds);
  const opponentRisk = -option.floorCardIds.reduce((sum, id) => sum + opponentMatchRisk(state, player, id), 0) * 0.35;
  const tempoValue = (option.handCardIds.length - 1) * 3.2 + (view.hand.length <= 5 ? 2.5 : 0);
  return {
    move: { kind: 'bomb', month }, immediateValue, opponentRisk, combinationValue,
    total: immediateValue + combinationValue * 1.15 - opponentRisk * 1.25 + tempoValue,
    reason: `${option.kind === 'two-card-bomb' ? '두장폭탄' : option.kind === 'four-card-bomb' ? '4장 흔들기·폭탄' : '폭탄'}으로 ${capturedIds.length}장 확보`
  };
}

function evaluateShake(state: GameState, player: PlayerId, month: number): MoveEvaluation | null {
  const view = playerCards(state, player);
  const option = findShakeOptions(view.hand, state.floorCards, view.shakenMonths).find(candidate => candidate.month === month);
  if (!option) return null;
  const currentScore = calculatePlayerScore(state, player).total;
  const combinationValue = combinationProgress(view.captured, option.handCardIds);
  return {
    move: { kind: 'shake', month }, immediateValue: 0, opponentRisk: 1.5, combinationValue,
    total: 32 + currentScore * 2 + combinationValue - 1.5,
    reason: `${month}월 세 장을 흔들어 최종 배수 확보`
  };
}

export function evaluateMoves(state: GameState, player: PlayerId): MoveEvaluation[] {
  const view = playerCards(state, player);
  const playableCards = view.pendingShakeMonth
    ? view.hand.filter(cardId => getCard(cardId)?.month === view.pendingShakeMonth)
    : view.hand;
  const cards = playableCards.map(cardId => evaluateCard(state, player, cardId));
  if (view.pendingShakeMonth) return cards.sort((left, right) => right.total - left.total);
  const savedBombTurns: MoveEvaluation[] = view.bombSkips > 0 ? [{
    move: { kind: 'flip-only' }, immediateValue: 0, opponentRisk: 0, combinationValue: 0,
    total: view.hand.length <= 1 ? 5 : 1 + view.bombSkips * 0.25,
    reason: '보관한 폭탄 빈 차례로 덱만 뒤집기'
  }] : [];
  const bombs = findBombOptions(view.hand, state.floorCards)
    .map(option => evaluateBomb(state, player, option.month))
    .filter(evaluation => evaluation !== null);
  const shakes = findShakeOptions(view.hand, state.floorCards, view.shakenMonths)
    .map(option => evaluateShake(state, player, option.month))
    .filter(evaluation => evaluation !== null);
  return [...cards, ...bombs, ...shakes, ...savedBombTurns].sort((left, right) => right.total - left.total);
}

export function estimatePlayerThreat(state: GameState, player: PlayerId): number {
  const view = playerCards(state, player);
  const score = calculatePlayerScore(state, player);
  let threat = score.total * 1.7;
  if (score.junkCount >= 8) threat += (score.junkCount - 7) * 1.4;
  if (score.brightCount >= 2) threat += 2.2;
  if (score.animalCount >= 4) threat += 1.6;
  if (score.ribbonCount >= 4) threat += 1.4;
  for (const tag of SET_TAGS) if (tagCount(view.captured, tag) === 2) threat += tag === 'godori' ? 3.4 : 2;
  return threat;
}
