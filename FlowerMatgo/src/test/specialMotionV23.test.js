import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CAPTURE_STAGGER_MS, MAX_CAPTURE_SPRITES, TURN_STAGES,
  captureVisualType
} from '../turnPresentation.js';

const ui = readFileSync(new URL('../main.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../style.css',import.meta.url),'utf8');
const animation = readFileSync(new URL('../turnPresentation.js',import.meta.url),'utf8');

describe('꽃맞고 v23 특별 패의 타격감과 획득 연출', () => {
  it('획득패는 실제 네 종류의 획득 칸으로 이동한다', () => {
    expect(captureVisualType('m01-01')).toBe('bright');
    expect(captureVisualType('m11-02')).toBe('junk');
    expect(captureVisualType('m09-01')).toBe('animal');
    expect(captureVisualType('m09-01',true)).toBe('junk');
    expect(captureVisualType('missing')).toBeNull();
    expect(ui).toContain('data-capture-type="${group.id}"');
    expect(animation).toContain('destination.querySelector(`[data-capture-type="${type}"]`)');
  });

  it('최대 여섯 장을 순차 연출하더라도 패판은 마지막에 갱신한다', () => {
    expect(MAX_CAPTURE_SPRITES).toBe(6);
    expect(CAPTURE_STAGGER_MS).toBe(38);
    expect(TURN_STAGES.collect + (MAX_CAPTURE_SPRITES-1)*CAPTURE_STAGGER_MS + 350)
      .toBeLessThan(TURN_STAGES.complete);
    expect(animation).toContain('prioritized.slice(0,MAX_CAPTURE_SPRITES)');
    expect(animation).toContain('spawnPairContact(root,playedFloorCard,target,TURN_STAGES.land)');
  });

  it('폭탄·싹쓸이의 손그림 잔상, 짧은 연속 소리, 캐릭터 환호가 서로 연결된다', () => {
    expect(animation).toContain("kind === 'bomb' || kind === 'sweep'");
    expect(animation).toContain("? 'mascot--big-win' : 'mascot--cheering'");
    expect(css).toContain("background:url('/assets/flower-special-burst-v22.webp')");
    expect(css).toContain('.turn-impact__echo--2');
    expect(css).toContain('@keyframes mascot-flower-celebration');
    expect(ui).toContain("kind === 'bomb' ? [.055,.125]");
    expect(ui).toContain("const SAVE_KEY = 'gomfox-flower-matgo-v01'");
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
  });
});
