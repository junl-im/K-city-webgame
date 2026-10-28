import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const v32 = css.split('/* v32 — pocket-size, card-first table.')[1];

function clamp(min, ideal, max) {
  return Math.max(min, Math.min(ideal, max));
}

describe('꽃맞고 v32: 작은 스마트폰에도 큰 손패/바닥패', () => {
  it('사용자가 확정한 v19 동물 화투와 손그림 배경을 그대로 사용한다', () => {
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain("url('/assets/flower-game-floor-mat-v18.webp')");
    expect(v32).not.toMatch(/url\([^)]*\.svg/);
    expect(v32).not.toContain('background-image:linear-gradient');
  });

  it('320~430px 세로폰에서 처음 손패 10장이 가로로 잘리지 않는다', () => {
    for (const width of [320, 340, 360, 375, 390, 412, 430]) {
      const cardWidth = clamp(54, width * .17, 70);
      const overlap = clamp(-38, width * -.088, -27);
      const handRowWidth = cardWidth * 10 + overlap * 9;
      expect(handRowWidth).toBeLessThanOrEqual(width - 10);
      expect(cardWidth).toBeGreaterThanOrEqual(54);
    }
    expect(v32).toContain('width:clamp(54px,17vw,70px)');
    expect(v32).toContain('margin-left:clamp(-38px,-8.8vw,-27px)');
  });

  it('일반 바닥패를 화면의 중심에 크게 띄우고, 패가 많을 때만 축소한다', () => {
    expect(v32).toContain('width:clamp(50px,15.8vw,68px)');
    expect(v32).toContain('width:clamp(45px,14.1vw,60px)');
    expect(v32).toContain('width:clamp(42px,12.5vw,55px)');
    for (const width of [320, 360, 390, 430]) {
      const normal = clamp(50, width * .158, 68);
      const busy = clamp(45, width * .141, 60);
      const packed = clamp(42, width * .125, 55);
      expect(normal).toBeGreaterThan(busy);
      expect(busy).toBeGreaterThan(packed);
    }
  });

  it('높이가 낮거나 안전영역이 있는 폰에서도 손패와 조작영역을 보존한다', () => {
    expect(v32).toContain('height:100svh');
    expect(v32).toContain('safe-area-inset-top');
    expect(v32).toContain('safe-area-inset-bottom');
    expect(v32).toContain('@media (max-width:650px) and (max-height:700px)');
    expect(v32).toContain('@media (max-width:650px) and (max-height:560px)');
    expect(v32).toContain('grid-template-rows:24px 48px minmax(0,1fr) 38px');
    expect(v32).toContain('grid-template-rows:21px 40px minmax(0,1fr) 34px');
    expect(v32).toContain('grid-template-rows:19px 35px minmax(0,1fr) 31px');
  });

  it('눈에 보이는 요소만 정리하고 필수 기능을 없애지 않는다', () => {
    expect(v32).toContain('.scene--game .opponent-hand .hwatu {display:none;}');
    expect(v32).toContain('.scene--game .opponent-hand__count');
    expect(v32).toContain('.scene--game .hand-heading {display:none;}');
    expect(ui).toContain('data-action="captures"');
    expect(ui).toContain('data-action="automode"');
    expect(ui).toContain('data-action="sound" aria-label=');
    expect(ui).toContain('data-turn-seconds');
    expect(ui).toContain('gameButtons(g)');
  });
});
