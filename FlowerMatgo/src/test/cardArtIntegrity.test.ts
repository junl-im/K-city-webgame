import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HWATU_CARDS, BONUS_PEE_CARDS, cardsForMonth } from '../engine/cards';

describe('48장 동물 화투 원패 식별 계약', () => {
  it('한 월마다 4장, 12개월 48장 카드 ID가 스프라이트 순서와 일치한다', () => {
    expect(HWATU_CARDS).toHaveLength(48);
    expect(new Set(HWATU_CARDS.map(card => card.id)).size).toBe(48);
    for (let month = 1; month <= 12; month += 1) {
      expect(cardsForMonth(month).map(card => card.id)).toEqual(
        Array.from({ length: 4 }, (_, i) => `m${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)
      );
    }
  });

  it('광 5, 열끗 9, 띠 10, 피·쌍피 24와 정확한 띠 종류를 보장한다', () => {
    const count = (types: string[]) => HWATU_CARDS.filter(card => types.includes(card.type)).length;
    expect(count(['bright'])).toBe(5);
    expect(count(['animal'])).toBe(9);
    expect(count(['ribbon'])).toBe(10);
    expect(count(['junk', 'doubleJunk'])).toBe(24);
    expect(HWATU_CARDS.filter(card => card.name === '홍단').map(card => card.month)).toEqual([1, 2, 3]);
    expect(HWATU_CARDS.filter(card => card.name === '초단').map(card => card.month)).toEqual([4, 5, 7]);
    expect(HWATU_CARDS.filter(card => card.name === '청단').map(card => card.month)).toEqual([6, 9, 10]);
    expect(HWATU_CARDS.filter(card => card.name === '비띠').map(card => card.month)).toEqual([12]);
    expect(BONUS_PEE_CARDS).toHaveLength(3);
    expect(BONUS_PEE_CARDS.map(card => card.typeLabel)).toEqual(['쌍피', '쌍피', '삼피']);
  });

  it('캐릭터만 교체한 화투 그림 아틀라스는 정확한 4열 × 12행 WebP다', () => {
    const file = readFileSync(join(process.cwd(), 'public/assets/hwatu-character-original-v19.webp'));
    expect(file.toString('ascii', 0, 4)).toBe('RIFF');
    expect(file.toString('ascii', 8, 12)).toBe('WEBP');
    expect(file.toString('ascii', 12, 16)).toBe('VP8 ');
    // Lossy WebP key frame: three-byte start code 9d 01 2a precedes 14-bit dimensions.
    expect([...file.subarray(23, 26)]).toEqual([0x9d, 0x01, 0x2a]);
    const width = file.readUInt16LE(26) & 0x3fff;
    const height = file.readUInt16LE(28) & 0x3fff;
    expect([width, height]).toEqual([992, 4080]);
    expect(height / 12).toBe(340);
  });
});
