import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const motion=readFileSync(new URL('../turnPresentation.js',import.meta.url),'utf8');

describe('v20 패 던지기와 모바일 밀집판',()=>{
  it('비행이 끝난 다음 더미패가 뒤집히고 획득한 패가 수납된다',()=>{
    expect(motion).toContain('isDraw ? TURN_STAGES.flip - TURN_STAGES.draw : TURN_STAGES.land');
    expect(motion).toContain('cardHeightForWidth(width)');
    expect(motion).not.toContain('width*290/186');
  });
  it('바닥패 증가량에 따라 모바일 전용 밀집 레이아웃을 고른다',()=>{
    expect(js).toContain("floor.length >= 13 ? 'packed' : floor.length >= 9 ? 'busy' : 'normal'");
    expect(css).toContain('.floor-area[data-density="busy"] .hwatu');
    expect(css).toContain('.floor-area[data-density="packed"] .hwatu');
    expect(css).toContain('.my-hand .hwatu--interactive:focus-visible');
  });
  it('게임에 표시되는 패는 v19 아틀라스만 사용한다',()=>{
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).not.toContain('hwatu-strict90-labeled-atlas-v3.webp');
  });
});
