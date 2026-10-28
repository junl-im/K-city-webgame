import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCard, HWATU_CARDS } from '../engine/cards';
import { cardBookLabel, cardVisualDetails } from '../cardDisplay.js';

describe('전통 화투패 인쇄·특수패 인지성', () => {
  it('홍단 3장·청단 3장만 띠 안에 글씨를 넣는다', () => {
    const printed = HWATU_CARDS.filter(c => cardVisualDetails(c).ribbonText)
      .map(c => [c.id, cardVisualDetails(c).ribbonText]);
    expect(printed).toEqual([
      ['m01-02', '홍단'], ['m02-02', '홍단'], ['m03-02', '홍단'],
      ['m06-02', '청단'], ['m09-02', '청단'], ['m10-02', '청단']
    ]);
    for (const month of [4, 5, 7]) {
      expect(cardVisualDetails(getCard(`m${String(month).padStart(2, '0')}-02`)).ribbonText).toBe('');
    }
    expect(cardVisualDetails(getCard('m12-03')).ribbonText).toBe('');
  });

  it('광 5장에는 光, 똥·비 쌍피 2장에는 쌍피 표기가 붙는다', () => {
    expect(HWATU_CARDS.filter(c => cardVisualDetails(c).brightText === '光').map(c => c.month))
      .toEqual([1, 3, 8, 11, 12]);
    expect(HWATU_CARDS.filter(c => cardVisualDetails(c).doubleJunkText === '쌍피').map(c => c.id))
      .toEqual(['m11-02', 'm12-04']);
    expect(getCard('m11-02')?.name).toBe('똥쌍피');
    expect(getCard('m12-04')?.name).toBe('비쌍피');
  });

  it('국진은 열끗을 기본으로 하고 선택하면 쌍피 표시로만 변경한다', () => {
    const gookjin = getCard('m09-01');
    expect(gookjin.type).toBe('animal');
    expect(cardVisualDetails(gookjin).doubleJunkText).toBe('');
    expect(cardVisualDetails(gookjin, { gookjinAsDoubleJunk: true }).doubleJunkText).toBe('쌍피');
    expect(cardBookLabel(gookjin)).toContain('쌍피 전환 가능');
  });

  it('8월의 흑백 억새 피도 도감에서 구분되고, 인쇄 글씨를 중복 렌더하지 않는다', () => {
    expect(cardBookLabel(getCard('m08-03'))).toContain('흑백');
    expect(cardBookLabel(getCard('m08-04'))).toContain('흑백');
    const css = readFileSync('src/style.css', 'utf8');
    const markup = readFileSync('src/main.js', 'utf8');
    expect(css).toContain('hwatu-character-original-v19.webp');
    expect(markup).not.toContain('hwatu__ribbon-mark');
  });

  it('똥쌍피와 비쌍피의 전통 색 구획은 이전 화투패 위에서 유지한다', () => {
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toContain('.hwatu--month-11.hwatu--ordinal-02 .hwatu__face::after');
    expect(css).toContain('.hwatu--month-12.hwatu--ordinal-04 .hwatu__face::after');
    expect(css).toContain('.hwatu--month-12.hwatu--ordinal-04 .hwatu__double-mark {display:none;}');
  });
});
