import { describe, expect, it } from 'vitest';
import {
  createInitialGame, chooseGo, chooseStop, chooseChongtong,
  declareShake, playBomb, playFlipOnlyTurn, playTurn, isValidGameState
} from '../engine/gameState';
import { chooseAiMove, chooseAiChongtong } from '../engine/ai/strategy';
import { getCard } from '../engine/cards';
import type { GameState, PlayerId } from '../engine/types';

describe('완성된 한 판 실제 진행', () => {
  it('세 난이도에서 30개 시드의 게임이 정상적으로 끝난다', () => {
    let completed = 0;
    const difficulties = ['easy', 'normal', 'hard'] as const;
    for (const difficulty of difficulties) {
      for (let seed = 1; seed <= 10; seed++) {
        let game: GameState = createInitialGame(seed * 17, difficulty, 100, seed % 2 ? 'human' : 'computer');
        for (let step = 0; step < 90 && game.phase !== 'round-ended'; step++) {
          if (game.phase === 'awaiting-go-stop') {
            const player = game.pendingDecision as PlayerId;
            game = chooseStop(game, player);
          } else if (game.phase === 'awaiting-chongtong') {
            const player = game.pendingDecision as PlayerId;
            game = chooseChongtong(game, player, chooseAiChongtong(game, difficulty));
          } else {
            const player = game.currentPlayer;
            const move = chooseAiMove(game, player, difficulty).move;
            expect(move).toBeTruthy();
            if (!move) break;
            if (move.kind === 'bomb') game = playBomb(game, player, move.month).state;
            else if (move.kind === 'flip-only') game = playFlipOnlyTurn(game, player).state;
            else if (move.kind === 'shake') {
              game = declareShake(game, player, move.month);
              const hand = player === 'human' ? game.humanHand : game.computerHand;
              const cardId = hand.find(id => getCard(id)?.month === move.month);
              expect(cardId).toBeTruthy();
              if (cardId) game = playTurn(game, player, cardId).state;
            } else game = playTurn(game, player, move.cardId, { playedMatchId: move.playedMatchId }).state;
          }
          expect(isValidGameState(game)).toBe(true);
        }
        expect(game.phase).toBe('round-ended');
        completed++;
      }
    }
    expect(completed).toBe(30);
  });
});
