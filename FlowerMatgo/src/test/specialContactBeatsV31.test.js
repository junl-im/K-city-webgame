import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPECIAL_CONTACT_MS, TURN_STAGES, specialContactBeats } from '../turnPresentation.js';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const presentation = readFileSync(new URL('../turnPresentation.js', import.meta.url), 'utf8');

describe('v31 폭탄·따닥·뻑의 손그림 접촉감', () => {
  it('폭탄은 낸 패의 수만큼 서로 어긋나게 착지하고 무제한 복제되지 않는다', () => {
    const beats = specialContactBeats('bomb', 3, 61);
    expect(beats).toHaveLength(3);
    expect(beats.map(x => x.at)).toEqual([TURN_STAGES.land, TURN_STAGES.land + 61, TURN_STAGES.land + 122]);
    expect(beats[0].dx).not.toBe(beats[1].dx);
    expect(specialContactBeats('bomb', 100, 60)).toHaveLength(4);
    expect(specialContactBeats('bomb', 0)).toHaveLength(1);
  });

  it('따닥은 짧은 두 번, 뻑은 한 번의 반동이며 일반 수는 별도 도장이 없다', () => {
    const ttadak = specialContactBeats('ttadak');
    expect(ttadak).toHaveLength(2);
    expect(ttadak[1].at - ttadak[0].at).toBe(95);
    expect(ttadak[0].dx).toBeLessThan(0);
    expect(ttadak[1].dx).toBeGreaterThan(0);
    expect(specialContactBeats('ppeok')).toEqual([{ at: TURN_STAGES.collect, dx: 0, dy: 0, kind: 'ppeok' }]);
    expect(specialContactBeats('land')).toEqual([]);
  });

  it('모바일의 특수 도장은 다음 판 갱신 전에 사라지고 기존 원화만 사용한다', () => {
    expect(SPECIAL_CONTACT_MS).toBe(480);
    expect(TURN_STAGES.collect + 95 + SPECIAL_CONTACT_MS).toBeLessThan(TURN_STAGES.complete);
    expect(presentation).toContain('spawnSpecialContacts(root, target, specialContactBeats(');
    expect(presentation).toContain("root.querySelector('.scene--game.is-resolving')");
    expect(css).toContain("background:url('/assets/flower-special-burst-v22.webp')");
    expect(css).toContain('.turn-special-tap--bomb');
    expect(css).toContain('.turn-special-tap--ppeok');
    expect(css).toContain('.turn-special-tap--ttadak');
    expect(css).toContain('.turn-special-tap {display:none;}');
  });
});
