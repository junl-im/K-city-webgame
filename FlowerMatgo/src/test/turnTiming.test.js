import { describe, expect, it } from 'vitest';
import { HUMAN_TURN_MS, HUMAN_TURN_SECONDS, humanTurnSignature, secondsLeft } from '../turnTiming.js';

const state = (overrides = {}) => ({
  gameUuid: 'round-one', turnNumber: 3, currentPlayer: 'human',
  phase: 'playing', pendingDecision: null, ...overrides
});

describe('20초 턴 제한 및 자동 플레이 시계', () => {
  it('내 턴과 내 고/스톱·총통 결정에만 타이머를 연다', () => {
    expect(humanTurnSignature('game',state())).toBe('round-one:3:playing:move');
    expect(humanTurnSignature('game',state({currentPlayer:'computer'}))).toBeNull();
    expect(humanTurnSignature('home',state())).toBeNull();
    expect(humanTurnSignature('game',state({phase:'round-ended'}))).toBeNull();
    expect(humanTurnSignature('game',state({phase:'awaiting-go-stop',pendingDecision:'human'}))).toBe('round-one:3:awaiting-go-stop:decision');
    expect(humanTurnSignature('game',state({phase:'awaiting-chongtong',pendingDecision:'human'}))).toBe('round-one:3:awaiting-chongtong:decision');
    expect(humanTurnSignature('game',state({phase:'awaiting-go-stop',pendingDecision:'computer'}))).toBeNull();
  });

  it('한 턴 식별자가 일반 UI 렌더링 때문에 달라지지 않는다', () => {
    const initial = humanTurnSignature('game',state());
    expect(humanTurnSignature('game',state({lastAction:'소리 꺼짐',wallet:150}))).toBe(initial);
    expect(humanTurnSignature('game',state({turnNumber:4}))).not.toBe(initial);
  });

  it('시간을 0~20초 범위에서 올림 표시한다', () => {
    expect(HUMAN_TURN_SECONDS).toBe(20);
    expect(HUMAN_TURN_MS).toBe(20_000);
    expect(secondsLeft(20_100)).toBe(20);
    expect(secondsLeft(19_001)).toBe(20);
    expect(secondsLeft(19_000)).toBe(19);
    expect(secondsLeft(1)).toBe(1);
    expect(secondsLeft(0)).toBe(0);
    expect(secondsLeft(-100)).toBe(0);
  });
});
