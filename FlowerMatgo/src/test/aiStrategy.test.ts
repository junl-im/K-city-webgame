import { describe, expect, it } from 'vitest';
import { chooseAiFloorMatch, evaluateMoves } from '../engine/ai/evaluator';
import { AI_DIFFICULTIES } from '../engine/ai/settings';
import { chooseAiGoStop, chooseAiGookjinAsDoubleJunk, chooseAiMove } from '../engine/ai/strategy';
import { createMatgoDeck } from '../engine/deck';
import { createInitialGame } from '../engine/gameState';

describe('규칙 기반 AI 수 선택', () => {
  it('두 장 중 먹을 패는 점수 가치가 높은 패를 자동으로 고른다', () => {
    expect(chooseAiFloorMatch(['m01-03', 'm01-01'], [])).toBe('m01-01');
  });

  it('두 장 중 선택할 때 내 홍단 완성 점수를 고려한다', () => {
    expect(chooseAiFloorMatch(['m01-01','m01-02'],[],['m02-02','m03-02'])).toBe('m01-02');
    expect(chooseAiFloorMatch(['m01-01','m01-02'],[],[])).toBe('m01-01');
  });

  it('선택할 수 있는 미션패의 보상과 감점을 구분한다', () => {
    const mission={kind:'gakpae' as const,cardIds:['m02-02','m01-02'],requiredCount:2,enabled:true,
      effect:{kind:'points' as const,value:3}};
    expect(chooseAiFloorMatch(['m01-01','m01-02'],[],['m02-02'],false,mission)).toBe('m01-02');
    expect(chooseAiFloorMatch(['m01-01','m01-02'],[],['m02-02'],false,{...mission,effect:{kind:'points',value:-3}})).toBe('m01-01');
    expect(chooseAiFloorMatch(['m01-01','m01-02'],[],['m02-02'],false,{...mission,enabled:false})).toBe('m01-01');
  });

  it('예전 저장에서 목표가 세 장이면 오래된 2장 설정 대신 세 장 완성을 기준으로 평가한다', () => {
    const mission={kind:'gakpae' as const,cardIds:['m02-03','m01-02','m03-02'],requiredCount:2,enabled:true,
      effect:{kind:'points' as const,value:3}};
    expect(chooseAiFloorMatch(['m01-01','m01-02'],[],['m02-03'],false,mission)).toBe('m01-01');
  });

  it('보너스로 빼앗을 수 있는 쌍피 국진은 평가에 포함하고 열끗 국진은 제외한다', () => {
    const game=createInitialGame(72,'hard',1000,'human');
    game.phase='playing';game.currentPlayer='human';game.humanHand=['bonus-pee-1'];
    game.floorCards=[];game.humanCaptured=[];game.computerCaptured=['m09-01'];game.mission=null;
    game.computerGookjinAsDoubleJunk=true;
    const converted=evaluateMoves(game,'human')[0];
    game.computerGookjinAsDoubleJunk=false;
    const animal=evaluateMoves(game,'human')[0];
    expect(converted.reason).toContain('뺏기');
    expect(animal.reason).not.toContain('뺏기');
    expect(converted.immediateValue).toBeGreaterThan(animal.immediateValue);
  });

  it('뻑에 붙어 있는 보너스패도 수의 가치에 포함한다', () => {
    const game=createInitialGame(71,'hard',1000,'human');
    game.phase='playing';game.currentPlayer='human';game.humanHand=['m01-04'];
    game.floorCards=['m01-01','m01-02','m01-03','bonus-pee-1'];
    game.humanCaptured=[];game.computerCaptured=[];game.mission=null;
    game.ppeokPiles=[{month:1,owner:'computer',cardIds:['m01-01','m01-02','m01-03'],bonusCardIds:['bonus-pee-1']}];
    const withBonus=evaluateMoves(game,'human').find(item=>item.move.kind==='card')!;
    game.floorCards=game.floorCards.filter(id=>id!=='bonus-pee-1');
    game.ppeokPiles[0].bonusCardIds=[];
    const withoutBonus=evaluateMoves(game,'human').find(item=>item.move.kind==='card')!;
    expect(withBonus.immediateValue).toBeGreaterThan(withoutBonus.immediateValue);
  });

  it('어려움은 평가 점수가 가장 높은 수를 항상 고른다', () => {
    const game = createInitialGame(301, 'hard');
    game.currentPlayer = 'computer';
    const choice = chooseAiMove(game, 'computer', 'hard');
    expect(choice.selectedOptimal).toBe(true);
    expect(choice.move).toEqual(choice.evaluations[0].move);
    expect(choice.evaluations[0]).toEqual(expect.objectContaining({
      immediateValue: expect.any(Number), opponentRisk: expect.any(Number), combinationValue: expect.any(Number)
    }));
  });

  it('초고수는 위험도와 족보 가능성을 다시 계산한 최적수를 항상 고른다', () => {
    const game = createInitialGame(304, 'expert');
    game.currentPlayer = 'computer';
    const choice = chooseAiMove(game, 'computer', 'expert');
    expect(choice.selectedOptimal).toBe(true);
    expect(choice.move).toEqual(choice.evaluations[0].move);
    expect(choice.difficulty).toBe('expert');
  });

  it('쉬움과 보통은 지정된 비율로 최적수를 선택한다', () => {
    const counts = { easy: 0, normal: 0 };
    for (let index = 0; index < 2_000; index += 1) {
      for (const difficulty of ['easy', 'normal'] as const) {
        const game = createInitialGame(1_000 + index, difficulty);
        game.currentPlayer = 'computer';
        if (chooseAiMove(game, 'computer', difficulty).selectedOptimal) counts[difficulty] += 1;
      }
    }
    expect(counts.easy / 2_000).toBeGreaterThan(AI_DIFFICULTIES.easy.optimalMoveProbability - 0.03);
    expect(counts.easy / 2_000).toBeLessThan(AI_DIFFICULTIES.easy.optimalMoveProbability + 0.03);
    expect(counts.normal / 2_000).toBeGreaterThan(AI_DIFFICULTIES.normal.optimalMoveProbability - 0.03);
    expect(counts.normal / 2_000).toBeLessThan(AI_DIFFICULTIES.normal.optimalMoveProbability + 0.03);
  });

  it('폭탄을 일반 패와 함께 비교해 더 가치가 높으면 선택한다', () => {
    const game = createInitialGame(302, 'hard');
    const fixed = ['m01-01', 'm01-02', 'm01-03', 'm01-04'];
    const remaining = createMatgoDeck().filter(id => !fixed.includes(id));
    game.computerHand = [fixed[0], fixed[1], ...remaining.splice(0, 8)];
    game.humanHand = remaining.splice(0, 10);
    game.floorCards = [fixed[2], fixed[3], ...remaining.splice(0, 6)];
    game.drawPile = remaining;
    game.currentPlayer = 'computer'; game.phase = 'playing';
    const choice = chooseAiMove(game, 'computer', 'hard');
    expect(choice.evaluations.some(evaluation => evaluation.move.kind === 'bomb')).toBe(true);
    expect(choice.move).toEqual(expect.objectContaining({ kind: 'bomb' }));
  });

  it('같은 월 세 장에 맞는 바닥패가 없으면 흔들기를 수 후보에 넣는다', () => {
    const game = createInitialGame(303, 'hard');
    const fixed = ['m04-01', 'm04-02', 'm04-03', 'm04-04'];
    const remaining = createMatgoDeck().filter(id => !fixed.includes(id));
    game.computerHand = [fixed[0], fixed[1], fixed[2], ...remaining.splice(0, 7)];
    game.humanHand = remaining.splice(0, 10);
    game.floorCards = remaining.splice(0, 8);
    game.drawPile = [fixed[3], ...remaining];
    game.currentPlayer = 'computer'; game.phase = 'playing';
    const choice = chooseAiMove(game, 'computer', 'hard');
    expect(choice.evaluations.some(evaluation => evaluation.move.kind === 'shake')).toBe(true);
    expect(choice.move).toEqual({ kind: 'shake', month: 4 });
  });

  it('쉬움은 진행할 패가 있을 때 약 80% 확률로 스톱한다', () => {
    let stops = 0;
    for (let index = 0; index < 2_000; index += 1) {
      const game = createInitialGame(5_000 + index, 'easy');
      if (chooseAiGoStop(game, 'computer', 'easy') === 'stop') stops += 1;
    }
    expect(stops / 2_000).toBeGreaterThan(0.77);
    expect(stops / 2_000).toBeLessThan(0.83);
  });

  it('자동 치기는 국진을 현재 점수가 더 높은 위치로 옮긴다', () => {
    expect(chooseAiGookjinAsDoubleJunk([
      'm09-01', 'm01-04', 'm02-04', 'm03-04', 'm04-04', 'm05-04', 'm06-04', 'm07-04', 'm08-04'
    ])).toBe(true);
    expect(chooseAiGookjinAsDoubleJunk(['m09-01', 'm02-01', 'm04-01', 'm06-01', 'm07-01'])).toBe(false);
  });
});
