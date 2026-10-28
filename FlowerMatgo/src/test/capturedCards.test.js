import { describe, expect, it } from 'vitest';
import { groupedCaptures } from '../capturedCards.js';
import { createInitialGame } from '../engine/gameState';
import { HWATU_CARDS } from '../engine/cards';

describe('먹은 패의 실제 그림 분류', () => {
  it('화투 48장을 광·열끗·띠·피 어느 한 곳에만 빠짐없이 표시', () => {
    const game=createInitialGame(555);
    game.humanCaptured=HWATU_CARDS.map(c=>c.id);
    const groups=groupedCaptures(game,'human');
    expect(groups.map(g=>g.cards.length)).toEqual([5,9,10,24]);
    expect(new Set(groups.flatMap(g=>g.cards)).size).toBe(48);
  });
  it('국진을 쌍피로 전환하면 열끗에서 피로 이동하고 보너스피도 표시', () => {
    const game=createInitialGame(123);
    game.humanCaptured=['m09-01','bonus-pee-1','m01-01'];
    game.humanGookjinAsDoubleJunk=false;
    expect(groupedCaptures(game,'human').map(g=>g.cards.length)).toEqual([1,1,0,1]);
    game.humanGookjinAsDoubleJunk=true;
    expect(groupedCaptures(game,'human').map(g=>g.cards.length)).toEqual([1,0,0,2]);
  });
  it('상대가 먹은 패도 별도로 올바르게 분류', () => {
    const game=createInitialGame(99);
    game.humanCaptured=[];
    game.computerCaptured=['m01-01','m02-02'];
    expect(groupedCaptures(game,'computer').map(g=>g.cards.length)).toEqual([1,0,1,0]);
  });
});
