import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {specialPresentation} from '../specialPresentation.js';
import {specialMoment} from '../specialMoment.js';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../main.js',import.meta.url),'utf8');

describe('v26: special events have distinct tactile identities',()=>{
  it('maps the engine events to their correct gestures',()=>{
    for (const kind of ['jjok','ttadak','ppeok','sweep']) {
      const event=specialPresentation({specialEvents:[{kind,label:kind}],captured:[]});
      expect(event?.kind).toBe(kind);
      expect(specialMoment(kind).kind).toBe(kind);
    }
  });
  it('uses different choreography for 쪽, 따닥, 뻑, 싹쓸이',()=>{
    expect(css).toContain('@keyframes flower-jjok-left');
    expect(css).toContain('@keyframes flower-jjok-right');
    expect(css).toContain('@keyframes flower-ttadak-print');
    expect(css).toContain('@keyframes flower-ppeok-rebound');
    expect(css).toContain('@keyframes flower-sweep-brush');
    expect(css).toContain("background:url('/assets/flower-special-burst-v22.webp')");
  });
  it('respects reduced motion and keeps actual game state independent',()=>{
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).toContain('.turn-impact--ppeok .turn-impact__illustration,');
    expect(css).toContain('.turn-impact--sweep .turn-impact__illustration {animation:none!important;opacity:.65;}');
    expect(ui).toContain('animateResolvedTurn({root:ROOT, result');
    expect(ui).toContain("const SAVE_KEY = 'gomfox-flower-matgo-v01'");
  });
});

describe('v26: compact mobile board leaves the cards tappable',()=>{
  it('shrinks nonessential enemy capture details without losing full gallery',()=>{
    expect(css).toContain('.scene--game .captured-grid .capture-cats {display:none;}');
    expect(css).toContain('.scene--game .field-row {flex-grow:1;}');
    expect(ui).toContain('data-action="captures" data-value="${who}"');
  });
});
