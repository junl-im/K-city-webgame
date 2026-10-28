import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const motion=readFileSync(new URL('../turnPresentation.js',import.meta.url),'utf8');

describe('꽃맞고 v17 화투 착지/획득 피드백', () => {
  it('점수와 패 변경이 끝나기 전 바닥패 충돌 → 더미 뒤집기를 각각 표현한다', () => {
    expect(motion).toContain('spawnPairContact(root,playedFloorCard,target,TURN_STAGES.land)');
    expect(motion).toContain('pulseDeck(root,TURN_STAGES.draw-45)');
    expect(motion).toContain('spawnPairContact(root,drawnFloorCard,measure(drawnFloorCard),TURN_STAGES.flip+25,true)');
    expect(motion).toContain('spawnCaptureSweep(root, cue.capturedIds');
  });

  it('캐릭터는 애니메이션만 더하고 원본 화투와 게임 기록은 보존한다', () => {
    expect(ui).toContain('player-mini-avatar');
    expect(ui).toContain("celebrant.classList.add('mascot--cheering')");
    expect(ui).toContain("const SAVE_KEY = 'gomfox-flower-matgo-v01'");
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain('.turn-pair-contact');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
  });
});
