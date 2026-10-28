import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const mobileV29 = css.split('/* v29 — portrait-first, card-led gameplay.')[1];

describe('꽃맞고 v29: 모바일 패판과 손패 중심 플레이', () => {
  it('기존 손그림 화투패와 판을 보존한다', () => {
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain("url('/assets/flower-game-floor-mat-v18.webp')");
    expect(mobileV29).toContain("url('/assets/flower-handpainted-paper-v17.webp')");
    expect(mobileV29).not.toMatch(/url\([^)]*\.svg/);
  });

  it('일반 휴대전화의 10장 손패가 화면을 가로로 넘치지 않는다', () => {
    for (const width of [320, 340, 360, 375, 390, 412, 430]) {
      const cardWidth = Math.min(63, Math.max(47, width * .1535));
      const overlap = Math.min(-16, Math.max(-29, width * -.066));
      const handWidth = cardWidth * 10 + overlap * 9;
      expect(handWidth).toBeLessThanOrEqual(width - 10);
    }
    expect(mobileV29).toContain('width:clamp(47px,15.35vw,63px)');
    expect(mobileV29).toContain('margin-left:clamp(-29px,-6.6vw,-16px)');
  });

  it('일반/혼잡 바닥패가 커지고 높이가 낮은 기기에는 별도 레이아웃이 있다', () => {
    expect(mobileV29).toContain('width:clamp(47px,15.2vw,62px)');
    expect(mobileV29).toContain('width:clamp(44px,13.8vw,57px)');
    expect(mobileV29).toContain('width:clamp(39px,12vw,51px)');
    expect(mobileV29).toContain('@media (max-width:650px) and (max-height:700px)');
    expect(mobileV29).toContain('@media (max-width:340px)');
  });

  it('타이머·자동모드·획득패 모아보기·특수패 조작이 유지된다', () => {
    expect(ui).toContain('data-turn-seconds');
    expect(ui).toContain('data-action="automode"');
    expect(ui).toContain('capturedRack(g)');
    expect(ui).toContain('capturedSummary(g,\'computer\')');
    expect(ui).toContain('gameButtons(g)');
    expect(mobileV29).toContain('min-height:35px');
  });
});
