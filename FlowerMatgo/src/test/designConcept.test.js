import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

describe('꽃놀이마당 디자인과 화투패 불변 조건', () => {
  it('산뜻한 꽃놀이 배경을 사용하되 기존 화투 앞면 원화는 유지한다', () => {
    expect(css).toContain("url('/assets/flower-festival-table-v1.webp')");
    expect(css).toContain("url('/assets/hwatu-character-original-v19.webp')");
    expect(statSync(new URL('../../public/assets/flower-festival-table-v1.webp', import.meta.url)).size)
      .toBeLessThan(400_000);
  });

  it('첫인상은 꽃놀이 친구들과 익숙한 승인 패 미리보기로 구성한다', () => {
    expect(source).toContain('오늘도 꽃놀이마당 OPEN');
    expect(source).toContain('hero-card-fan');
    expect(source).toContain("card('m03-01')");
    expect(source).toContain('opponent-card__speech');
    expect(source).toContain('result-mascot');
  });
});
