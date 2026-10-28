import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const layout=readFileSync(new URL('../main.js',import.meta.url),'utf8');

describe('v21 손그림 꽃놀이마당 및 터치 배치',()=>{
  it('게임판은 전용 수채화 원화를 쓰며 화투패 48장은 승인 원화를 유지한다',()=>{
    expect(css).toContain("url('/assets/flower-festival-table-handpainted-v21.webp')");
    expect(css).toContain("url('/assets/hwatu-character-original-v19.webp')");
    const image=statSync(new URL('../../public/assets/flower-festival-table-handpainted-v21.webp',import.meta.url));
    expect(image.size).toBeGreaterThan(20_000);
    expect(image.size).toBeLessThan(750_000);
    expect(layout).toContain('data-density=');
  });

  it('좁은 모바일에도 기본 바닥패가 줄어들고 버튼은 눌릴 영역을 남긴다',()=>{
    expect(css).toContain('.floor-area[data-density="normal"] .hwatu');
    expect(css).toContain('min-height:29px');
    expect(css).toContain('max-width:370px');
    expect(css).toContain('max-height:600px');
    expect(css).toContain('.action-chip:focus-visible');
  });
});
