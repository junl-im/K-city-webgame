import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const v34 = css.split('/* v34 — use the otherwise empty phone-table width')[1];

function clamp(min, preferred, max) {
  return Math.max(min, Math.min(preferred, max));
}

describe('꽃맞고 v34: 모바일 화면을 더 크게 채우는 패', () => {
  it('320~430px 세로폰에서 손패 열 장이 안전 여백 안에 들어온다', () => {
    for (const width of [320, 340, 360, 375, 390, 412, 430]) {
      const cardWidth = clamp(58, width * .186, 80);
      const overlap = clamp(-43, -width * .1, -32);
      const totalWidth = cardWidth * 10 + overlap * 9;
      expect(totalWidth).toBeLessThanOrEqual(width - 10);
      const v32Width = clamp(54, width * .17, 70);
      expect(cardWidth).toBeGreaterThan(v32Width);
    }
    expect(v34).toContain('width:clamp(58px,18.6vw,80px)');
    expect(v34).toContain('margin-left:clamp(-43px,-10vw,-32px)');
  });

  it('바닥패는 기본→혼잡→많이 혼잡한 순서로 커지지 않게 맞춘다', () => {
    for (const width of [320, 360, 390, 430]) {
      const normal = clamp(55, width * .173, 74);
      const busy = clamp(48, width * .152, 65);
      const packed = clamp(43, width * .132, 57);
      expect(normal).toBeGreaterThan(busy);
      expect(busy).toBeGreaterThan(packed);
      expect(normal).toBeGreaterThan(clamp(50, width * .158, 68));
    }
  });

  it('짧은 화면에서는 높이별 조정을 유지하고 접는 화면은 과밀해지지 않는다', () => {
    expect(v34).toContain('(min-height:701px)');
    expect(v34).toContain('(min-height:561px) and (max-height:700px)');
    expect(v34).toContain('(max-width:319px) and (min-height:561px)');
    for (const width of [280, 300, 319]) {
      const cardWidth = clamp(45, width * .16, 52);
      expect(cardWidth * 10 - 27 * 9).toBeLessThanOrEqual(width - 10);
    }
    expect(v34).not.toContain('(max-height:560px) {');
  });

  it('터치 화면의 고정된 hover 점프를 막고 기존 원화·SVG 금지 원칙을 지킨다', () => {
    expect(v34).toContain('(hover:none) and (pointer:coarse)');
    expect(v34).toContain(':hover:not(.hwatu--finger-pressed)');
    expect(v34).not.toMatch(/\.svg|background-image:\s*(?:linear|radial)-gradient/);
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain("url('/assets/flower-game-floor-mat-v18.webp')");
  });
});
