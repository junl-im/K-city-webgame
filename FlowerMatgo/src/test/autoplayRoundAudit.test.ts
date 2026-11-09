import { describe, expect, it } from 'vitest';
import { automaticMove, automaticSpecial } from '../autoSpecial.js';
import { chooseAiFloorMatch } from '../engine/ai/evaluator';
import { chooseAiMove } from '../engine/ai/strategy';
import { chooseChongtong, chooseGo, chooseStop, createInitialGame, declareShake, getBombDrawChoice, getDrawFloorChoice, getFlipOnlyDrawChoice, getMatchingFloorCards, isValidGameState, playBomb, playFlipOnlyTurn, playTurn } from '../engine/gameState';
import type { GameState, PlayerId } from '../engine/types';

function best(state: GameState, player: PlayerId, ids: string[], extra: string[] = []) {
  const human=player==='human';
  return chooseAiFloorMatch(ids,human?state.computerCaptured:state.humanCaptured,
    [...(human?state.humanCaptured:state.computerCaptured),...extra],
    human?state.humanGookjinAsDoubleJunk:state.computerGookjinAsDoubleJunk,state.mission);
}

describe('자동치기 전체 판 점검',()=>{
  it('여러 시드에서 모든 차례가 끝나고 패가 중복되거나 사라지지 않는다',()=>{
    for(let seed=1;seed<=120;seed++){
      let g=createInitialGame(seed*97,'hard',1000,'human');
      for(let step=0;g.phase!=='round-ended' && step<100;step++){
        expect(isValidGameState(g),`seed ${seed}, step ${step}`).toBe(true);
        if(g.phase==='awaiting-chongtong'){g=chooseChongtong(g,g.pendingDecision!,'stop');continue;}
        if(g.phase==='awaiting-go-stop'){
          const player=g.pendingDecision!, human=player==='human';
          const remaining=(human?g.humanHand:g.computerHand).length+(human?g.humanBombSkips:g.computerBombSkips);
          const goCount=human?g.humanGoCount:g.computerGoCount;
          g=seed%3===0 && remaining>3 && goCount<2 ? chooseGo(g,player) : chooseStop(g,player);
          continue;
        }
        const player=g.currentPlayer;
        const move=player==='human' ? automaticSpecial(g) || automaticMove(g) : chooseAiMove(g,player,'hard').move;
        expect(move,`seed ${seed}, step ${step}: no move`).toBeTruthy();
        if(!move) break;
        if(move.kind==='bomb'){
          const choice=getBombDrawChoice(g,player,move.month);
          g=playBomb(g,player,move.month,choice?best(g,player,choice.candidateIds,[choice.drawnCardId]):undefined).state;
        } else if(move.kind==='flip-only'){
          const choice=getFlipOnlyDrawChoice(g);
          g=playFlipOnlyTurn(g,player,choice?best(g,player,choice.candidateIds,[choice.drawnCardId]):undefined).state;
        } else {
          if(move.kind==='shake') g=declareShake(g,player,move.month);
          const cardId=move.kind==='card' ? move.cardId : (player==='human'?g.humanHand:g.computerHand).find(id=>id.startsWith(`m${String(move.month).padStart(2,'0')}-`))!;
          const matches=getMatchingFloorCards(g.floorCards,cardId);
          const matchId=move.kind==='card' && move.playedMatchId ? move.playedMatchId : matches.length===2?best(g,player,matches,[cardId]):undefined;
          const draw=getDrawFloorChoice(g,cardId,matchId);
          g=playTurn(g,player,cardId,{playedMatchId:matchId,drawnMatchId:draw?best(g,player,draw.candidateIds,[draw.drawnCardId]):undefined}).state;
        }
      }
      expect(g.phase,`seed ${seed} stalled`).toBe('round-ended');
      expect(isValidGameState(g),`seed ${seed} final cards`).toBe(true);
    }
  });
});
