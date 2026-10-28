import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HWATU_CARDS } from '../engine/cards';
import { hwatuFamily, spokenActionText, spokenCardName } from '../cardNames.js';
import { cardBookLabel } from '../cardDisplay.js';

const ui = readFileSync(new URL('../main.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../style.css',import.meta.url),'utf8');

describe('꽃맞고 v24 익숙한 패 이름과 큰 놀이판', () => {
  it('게임 안내는 월 숫자보다 익숙한 화투 별칭을 사용한다', () => {
    expect(hwatuFamily(1)).toBe('솔');
    expect(hwatuFamily(2)).toBe('매조');
    expect(hwatuFamily(4)).toBe('흑싸리');
    expect(hwatuFamily(8)).toBe('공산');
    expect(hwatuFamily(11)).toBe('똥');
    expect(hwatuFamily(12)).toBe('비');
    expect(hwatuFamily(0)).toBe('화투');
    expect(spokenActionText('11월 폭탄! 12월 패를 뒤집었습니다.')).toBe('똥 폭탄! 비 패를 뒤집었습니다.');
    expect(spokenActionText('1월·2월·3월 홍단')).toBe('솔·매조·벚꽃 홍단');
  });

  it('광과 쌍피, 48장 카드의 읽는 이름을 구분한다', () => {
    expect(spokenCardName('m01-01')).toBe('솔광');
    expect(spokenCardName('m11-01')).toBe('똥광');
    expect(spokenCardName('m12-01')).toBe('비광');
    expect(spokenCardName('m11-02')).toBe('똥쌍피');
    expect(spokenCardName('m12-04')).toBe('비쌍피');
    expect(spokenCardName('m09-01',{gookjinAsDoubleJunk:true})).toBe('국진 쌍피');
    expect(spokenCardName('m01-03')).toBe('솔 피');
    expect(spokenCardName('m02-02')).toBe('매조 홍단');
    expect(cardBookLabel(HWATU_CARDS.find(card => card.id==='m08-03'))).toBe('공산 흑백 억새 피');
    expect(HWATU_CARDS).toHaveLength(48);
    expect(HWATU_CARDS.every(card => !/^\d+월/.test(spokenCardName(card)))).toBe(true);
  });

  it('폭탄 버튼과 도감, 실제 패 이름은 새 명칭을 쓰되 엔진의 월 인덱스는 보존한다', () => {
    expect(ui).toContain('hwatuFamily(b.month)} 폭탄');
    expect(ui).toContain('hwatuFamily(b.month)} 흔들기');
    expect(ui).toContain('data-value="${b.month}"');
    expect(ui).toContain('spokenCardName(item,');
    expect(ui).toContain('spokenActionText(g.lastAction)');
    expect(ui).toContain("const SAVE_KEY = 'gomfox-flower-matgo-v01'");
  });

  it('모바일 패판 중심 레이아웃과 원본 카드 48장 원화를 유지한다', () => {
    expect(css).toContain('/* v24 — play surface is the hero:');
    expect(css).toContain('grid-template-rows:clamp(42px,6.5svh,54px)');
    expect(css).toContain('.scene--game .floor-area[data-density="normal"] .hwatu');
    expect(css).toContain('.scene--game .game-message {');
    expect(css).toContain('clip-path:inset(50%)');
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(ui).toContain('data-capture-type="${group.id}"');
  });
});
