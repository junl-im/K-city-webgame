import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const face = readFileSync(new URL('../../public/assets/hwatu-character-original-v19.webp', import.meta.url));
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const markup = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

describe('v19 원판+우리 캐릭터 48장 아틀라스', () => {
  it('최종 확인된 48장 그림 바이트를 고정해 예전패로 뒤바뀌지 않게 한다', () => {
    expect(createHash('sha256').update(face).digest('hex'))
      .toBe('3c92d7b101f24fa296e06af38d421cbf80009e187723279e7f6efba41accca95');
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).not.toContain('hwatu-strict90-labeled-atlas-v3.webp');
    expect(css).toContain('background-size:400% 1200%');
  });

  it('48장 각 패는 4열×12행의 월별 4장 위치로 정확히 렌더링된다', () => {
    expect(markup).toContain('((artworkOrdinal(id, ordinal) - 1) / 3 * 100)');
    expect(markup).toContain('((month - 1) / 11 * 100)');
    expect(css).toContain('aspect-ratio:248 / 340');
  });

  it('광 원화에 인쇄된 光 글씨를 중복으로 덧씌우지 않고 쌍피 특수표시는 유지한다', () => {
    expect(markup).not.toContain('visual.brightText ?');
    expect(markup).toContain('visual.doubleJunkText ?');
    expect(css).toContain('.hwatu--month-11.hwatu--ordinal-02 .hwatu__face::after');
    expect(css).toContain('.hwatu--month-12.hwatu--ordinal-04 .hwatu__face::after');
  });
});
