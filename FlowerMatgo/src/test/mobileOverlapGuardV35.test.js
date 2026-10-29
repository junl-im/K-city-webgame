import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const v35 = css.split('/* v35 mobile safe-layout guard')[1];
const clamp = (low, value, high) => Math.max(low, Math.min(value, high));
const bands = [
  [561, 600, 45], [601, 650, 49], [651, 700, 59],
  [701, 740, 60], [741, 790, 67], [791, 800, 76],
];
const cardRatio = 340 / 248;

describe('꽃맞고 v35 모바일 UI 겹침 방지', () => {
  it('561~800px 높이에서 손패가 확보된 세로 공간보다 커지지 않는다', () => {
    for (const [start, end, maxCard] of bands) {
      for (const h of [start, Math.floor((start + end) / 2), end]) {
        const bottom = h <= 700 ? clamp(166, h * .285, 197)
          : clamp(202, h * .285, 238);
        const fixedRows = h <= 700 ? 21 + 40 + 34 : 24 + 48 + 38;
        const available = bottom - fixedRows - 7; // player border/padding budget
        for (const w of [320, 360, 390, 430]) {
          const natural = h <= 700
            ? clamp(54, w * .172, 69)
            : clamp(58, w * .186, 80);
          const cardHeight = Math.min(natural, maxCard) * cardRatio;
          expect(cardHeight, `${w}×${h}`).toBeLessThan(available - 1);
        }
      }
      expect(v35).toContain(`max-width:${maxCard}px`);
    }
  });

  it('좁고 낮은 화면에서도 손패 10장 전체를 가로로 수용한다', () => {
    for (const w of [320, 360, 390, 430]) {
      for (const [start, , cap] of bands) {
        const natural = start <= 700
          ? clamp(54, w * .172, 69)
          : clamp(58, w * .186, 80);
        const size = Math.min(natural, cap);
        let overlap;
        if (start <= 650) overlap = clamp(-29, -w * .075, -18);
        else if (start <= 700) overlap = clamp(-31, -w * .086, -24);
        else if (start <= 740 && w >= 400) overlap = -25;
        else overlap = clamp(-43, -w * .1, -32);
        expect(size * 10 + overlap * 9, `${w} / h=${start}`)
          .toBeLessThanOrEqual(w - 10);
      }
    }
  });

  it('상단 금액이 네비게이션 버튼을 밀어내지 않게 한다', () => {
    expect(v35).toContain('.scene--game .game-wallet b');
    expect(v35).toContain('text-overflow:ellipsis');
    expect(v35).toContain('max-width:clamp(70px,30vw,126px)');
    expect(v35).toContain('.scene--game .nav-round {flex-shrink:0;}');
  });

  it('원화 보존과 움직임 제어를 유지한다', () => {
    expect(css).toContain("hwatu-character-original-v19.webp");
    expect(css).toContain("flower-game-floor-mat-v18.webp");
    expect(v35).toContain('max-height:800px');
    expect(v35).toContain('translateY(-2px)');
    expect(v35).not.toMatch(/\\.svg|background-image:\\s*(?:linear|radial)-gradient/);
  });
});
