import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {bombFlightCardIds,TURN_STAGES} from '../turnPresentation.js';
import {newlyCompletedCombos} from '../scoreCombos.js';
import {specialMoment} from '../specialMoment.js';
import {calculateCapturedScore} from '../engine/rules/scoring';

describe('v25: real bomb cards are all thrown before the draw',()=>{
  it('throws three hand cards onto one matching floor card',()=>{
    expect(bombFlightCardIds('m01-02',
      ['m01-01','m01-02','m01-03','m01-04'],
      ['m01-02','m01-03','m01-04'],['m01-01']))
      .toEqual(['m01-02','m01-03','m01-04']);
  });
  it('throws two hand cards onto two matching floor cards',()=>{
    expect(bombFlightCardIds('m02-01',
      ['m02-01','m02-02','m02-03','m02-04'],
      ['m02-01','m02-02'],['m02-03','m02-04']))
      .toEqual(['m02-01','m02-02']);
  });
  it('infers hidden computer bombs and four-card bombs without floor',()=>{
    expect(bombFlightCardIds('m03-01',
      ['m03-04','m03-02','m03-01','m03-03'],[],[]))
      .toEqual(['m03-01','m03-04','m03-02','m03-03']);
    expect(bombFlightCardIds('m11-01',
      ['m11-01','m11-02','m11-03','m11-04'],[],['m11-04']))
      .toEqual(['m11-01','m11-02','m11-03']);
  });
  it('keeps extra throws ahead of the deck flip and never alters the real cards',()=>{
    const gap=Math.min(65,Math.floor((TURN_STAGES.draw-TURN_STAGES.land-16)/3));
    expect(TURN_STAGES.land + 3*gap).toBeLessThan(TURN_STAGES.draw);
    const source=readFileSync(new URL('../turnPresentation.js',import.meta.url),'utf8');
    expect(source).toContain('bombThrows.forEach((id,index) =>');
    expect(source).toContain("if (index && handCard) handCard.classList.add('hwatu--departing')");
    expect(source).toContain("recoilTable(root,cue.visualKind,TURN_STAGES.collect+16)");
  });
});

describe('v25: score-set callouts and familiar Korean labels',()=>{
  it('celebrates a newly completed 고도리 set only once',()=>{
    const before=calculateCapturedScore(['m02-01','m04-01']);
    const after=calculateCapturedScore(['m02-01','m04-01','m08-02']);
    expect(newlyCompletedCombos(before,after)).toEqual([{label:'고도리',points:5}]);
    expect(newlyCompletedCombos(after,after)).toEqual([]);
  });
  it('celebrates only the new 홍단 set and does not grant points',()=>{
    const before=calculateCapturedScore(['m01-02','m02-02']);
    const after=calculateCapturedScore(['m01-02','m02-02','m03-02']);
    expect(newlyCompletedCombos(before,after)).toEqual([{label:'홍단',points:3}]);
    expect(before.total).toBe(0);
    expect(after.total).toBe(3);
  });
  it('distinguishes 핵폭탄 and two-card bomb without month-number copy',()=>{
    expect(specialMoment('bomb','핵폭탄').title).toBe('핵폭탄!');
    expect(specialMoment('bomb','두장폭탄').title).toBe('두 장 폭탄!');
    expect(specialMoment('ttadak').detail).not.toMatch(/월/);
  });
  it('uses painted images for small pair feedback rather than new SVGs',()=>{
    const css=readFileSync(new URL('../style.css',import.meta.url),'utf8').replace(/\r\n/g,'\n');
    expect(css).toContain(".turn-pair-contact::before {\n  left:-43px");
    expect(css).toContain("background:url('/assets/flower-special-burst-v22.webp')");
    expect(css).not.toContain('flower-special-burst-v25.svg');
  });
});
