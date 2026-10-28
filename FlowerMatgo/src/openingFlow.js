import {
  createDealerSelectionCards,
  chooseComputerDealerIndex,
  determineDealerWinner
} from './engine/dealerSelection';

export const OPENING_SHUFFLE_MS = 1350;
export const OPENING_REVEAL_MS = 1700;
export const OPENING_DEAL_MS = 1850;

// The first game lets the player draw for the lead. A completed game's
// winner leads the rematch, while a drawn round keeps its previous lead.
export function createOpeningFlow(seed, { previousGame = null, rematch = false, daytime = true } = {}) {
  const previousStarter = rematch && previousGame?.phase === 'round-ended'
    ? (previousGame.winner || previousGame.startingPlayer)
    : null;
  return {
    seed,
    daytime,
    phase: 'shuffle',
    dealerCards: previousStarter ? [] : createDealerSelectionCards(seed),
    humanIndex: null,
    computerIndex: null,
    winner: previousStarter || null,
    rematch: Boolean(previousStarter)
  };
}

export function revealDealerCards(flow, humanIndex) {
  if (flow.phase !== 'pick' || !Number.isInteger(humanIndex) ||
      humanIndex < 0 || humanIndex >= flow.dealerCards.length) {
    throw new Error('선 정하기 패를 다시 골라줘.');
  }
  const computerIndex = chooseComputerDealerIndex(flow.dealerCards, humanIndex, flow.seed);
  const winner = determineDealerWinner(
    flow.dealerCards[humanIndex], flow.dealerCards[computerIndex], flow.daytime
  );
  if (!winner) throw new Error('선 정하기 결과가 같아 다시 뽑아야 해.');
  return { ...flow, phase: 'reveal', humanIndex, computerIndex, winner };
}
