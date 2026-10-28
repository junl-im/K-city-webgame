import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getCard } from '../engine/cards';
import { createInitialGame } from '../engine/gameState';
import {
  createOpeningFlow,
  revealDealerCards,
  OPENING_SHUFFLE_MS,
  OPENING_REVEAL_MS,
  OPENING_DEAL_MS
} from '../openingFlow.js';

const ui = readFileSync(new URL('../main.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../style.css',import.meta.url),'utf8');

describe('꽃맞고 v28 첫 판 선 뽑기와 패섞기', () => {
  it('첫 판은 서로 다른 12무늬 패를 섞어 플레이어가 고르게 한다', () => {
    const flow = createOpeningFlow(45798,{daytime:true});
    expect(flow.phase).toBe('shuffle');
    expect(flow.winner).toBe(null);
    expect(flow.dealerCards).toHaveLength(12);
    expect(new Set(flow.dealerCards.map(id=>getCard(id).month)).size).toBe(12);
    expect(flow.dealerCards).toEqual(createOpeningFlow(45798,{daytime:true}).dealerCards);
  });

  it('선택한 패와 컴퓨터가 뽑은 패는 서로 다르고 승자가 한 명으로 확정된다', () => {
    for (const daytime of [true,false]) {
      const first = createOpeningFlow(65432,{daytime});
      for (let selected = 0; selected < 12; selected++) {
        const result = revealDealerCards({...first,phase:'pick'},selected);
        expect(result.humanIndex).toBe(selected);
        expect(result.computerIndex).not.toBe(selected);
        expect(['human','computer']).toContain(result.winner);
        const mine = getCard(result.dealerCards[selected]).month;
        const theirs = getCard(result.dealerCards[result.computerIndex]).month;
        expect(result.winner).toBe((daytime ? mine > theirs : mine < theirs) ? 'human' : 'computer');
        const started = createInitialGame(result.seed,'normal',100,result.winner,1);
        expect(started.startingPlayer).toBe(result.winner);
        expect(started.startingPlayerConfirmed).toBe(true);
      }
    }
  });

  it('전 판 승자 선공, 나가리는 이전 선공 유지, 새 게임은 다시 뽑는다', () => {
    const previous = {phase:'round-ended',winner:'computer',startingPlayer:'human'};
    const rematch = createOpeningFlow(76543,{previousGame:previous,rematch:true});
    expect(rematch.rematch).toBe(true);
    expect(rematch.dealerCards).toEqual([]);
    expect(rematch.winner).toBe('computer');
    const drawn = createOpeningFlow(76543,{previousGame:{...previous,winner:null},rematch:true});
    expect(drawn.winner).toBe('human');
    expect(createOpeningFlow(76543,{previousGame:previous,rematch:false}).dealerCards).toHaveLength(12);
  });

  it('잘못된 선택과 중복 확정은 거부한다', () => {
    const flow = createOpeningFlow(11111,{daytime:true});
    expect(()=>revealDealerCards(flow,0)).toThrow();
    expect(()=>revealDealerCards({...flow,phase:'pick'},-1)).toThrow();
    expect(()=>revealDealerCards({...flow,phase:'pick'},12)).toThrow();
    expect(()=>revealDealerCards({...flow,phase:'pick'},1.5)).toThrow();
    expect(()=>revealDealerCards({...flow,phase:'reveal'},2)).toThrow();
  });

  it('선공 발표와 배분을 충분히 보여주되 실게임 타이머와 구분한다', () => {
    expect(OPENING_SHUFFLE_MS).toBeGreaterThanOrEqual(1100);
    expect(OPENING_REVEAL_MS).toBeGreaterThanOrEqual(1400);
    expect(OPENING_DEAL_MS).toBeGreaterThanOrEqual(1700);
    expect(ui).toContain("app.screen='opening'");
    expect(ui).toContain("app.screen = 'game'");
    expect(ui).toContain("case 'pick-dealer': pickOpeningDealer(Number(value));return;");
    expect(ui).toContain('선 뽑기에서 이겨 먼저 칩니다.');
    expect(ui).toContain("const key = humanTurnSignature(app.screen, app.game)");
    expect(ui).toContain("const SAVE_KEY = 'gomfox-flower-matgo-v01'");
  });

  it('오리지널 화투패 뒷면과 v19 캐릭터 원화를 사용하고 SVG 자산을 추가하지 않는다', () => {
    expect(css).toContain('/* v28 — playable first-deal ritual');
    expect(css).toContain("'/assets/flower-festival-table-handpainted-v21.webp'");
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain("background-image:url('/assets/hwatu-back-mascots-v1.webp')");
    expect(ui).toContain('class="opening-dealer-grid"');
    expect(ui).toContain('class="opening-deal"');
    expect(ui).not.toContain('<svg');
  });
});
