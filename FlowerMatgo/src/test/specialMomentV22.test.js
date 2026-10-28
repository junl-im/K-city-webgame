import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPECIAL_FLASH_MS, specialMoment } from '../specialMoment.js';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const presentation = readFileSync(new URL('../turnPresentation.js', import.meta.url), 'utf8');

describe('꽃맞고 v22 특별 상황 연출', () => {
  it('폭탄·싹쓸이는 크게, 뻑·따닥·쪽은 각각 구별해서 알린다', () => {
    expect(specialMoment('bomb', '폭탄!')).toMatchObject({ kind:'bomb', title:'폭탄!', major:true });
    expect(specialMoment('sweep', '싹쓸이!')).toMatchObject({ kind:'sweep', title:'싹쓸이!', major:true });
    expect(specialMoment('ppeok', '뻑!')).toMatchObject({ kind:'ppeok', title:'뻑!', major:false });
    expect(specialMoment('ttadak', '따닥!')).toMatchObject({ kind:'ttadak', title:'따닥!', major:false });
    expect(specialMoment('jjok', '쪽!')).toMatchObject({ kind:'jjok', title:'쪽!', major:false });
    expect(specialMoment('bright', '광 획득!').title).toBe('광 획득!');
    expect(specialMoment('double', '쌍피 획득!').title).toBe('쌍피 획득!');
    expect(SPECIAL_FLASH_MS).toBeGreaterThanOrEqual(1500);
  });

  it('기존 안내를 잃지 않고 정의되지 않은 상황도 표시한다', () => {
    expect(specialMoment('bomb', '폭탄! · 싹쓸이!').detail).toBe('폭탄! · 싹쓸이!');
    expect(specialMoment('unknown', '특별 보너스!')).toMatchObject({
      kind:'special', title:'특별 보너스!', major:false
    });
  });

  it('중요 순간의 일러스트와 캐릭터 반응은 패·세이브·착지 순서를 건드리지 않는다', () => {
    const asset = new URL('../../public/assets/flower-special-burst-v22.webp', import.meta.url);
    expect(statSync(asset).size).toBeLessThan(900_000);
    expect(css).toContain("background:url('/assets/flower-special-burst-v22.webp')");
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain('.scene--game .effect-burst__illustration');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(ui).toContain("const SAVE_KEY = 'gomfox-flower-matgo-v01'");
    expect(presentation).toContain('cheerOnSpecial(root,player,cue.visualKind,TURN_STAGES.collect+20)');
    expect(presentation).toContain('spawnPairContact(root,playedFloorCard,target,TURN_STAGES.land)');
    expect(presentation).toContain('spawnCaptureSweep(root, cue.capturedIds');
    expect(presentation).not.toContain('.svg');
  });
});
