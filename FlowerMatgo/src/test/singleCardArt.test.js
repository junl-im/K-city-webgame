import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const source = readFileSync('src/main.js', 'utf8');
const styles = readFileSync('src/style.css', 'utf8');

describe('확정된 화투패 원화 한 종류만 사용', () => {
  it('게임과 도감에 화투 원화 전환 버튼·동작이 존재하지 않는다', () => {
    expect(source).not.toContain('data-action="cardart"');
    expect(source).not.toContain("case 'cardart'");
    expect(styles).not.toContain('data-card-art="classic"');
    expect(styles).toContain("hwatu-character-original-v19.webp");
    expect(styles).not.toContain("hwatu-strict90-labeled-atlas-v3.webp");
  });

  it('구 아틀라스 파일을 배포 원본에 포함하지 않는다', () => {
    for (const name of [
      'hwatu-atlas.png', 'hwatu-back.png',
      'hwatu-cute-atlas-v1.webp', 'hwatu-strict90-atlas-v2.webp'
    ]) {
      expect(existsSync(`public/assets/${name}`)).toBe(false);
      expect(styles.includes(name)).toBe(false);
    }
    expect(existsSync('public/assets/hwatu-character-original-v19.webp')).toBe(true);
    // v3 is retained as a rollback copy, never loaded into a card face.
    expect(existsSync('public/assets/hwatu-strict90-labeled-atlas-v3.webp')).toBe(true);
    expect(existsSync('public/assets/hwatu-back-mascots-v1.webp')).toBe(true);
  });

  it('첫 화면의 불필요한 문구와 기본 우클릭·드래그를 제거한다', () => {
    for (const text of ['✿ AI 3단계', '✿ 무료 머니', '✿ 모바일 맞춤', '© 곰같은여우 · 꽃맞고']) {
      expect(source).not.toContain(text);
    }
    expect(source).toContain("'contextmenu','dragstart','selectstart'");
    expect(styles).toContain('user-select:none');
  });
});
