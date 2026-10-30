import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

describe('꽃맞고 v27 넓은 신맞고형 플레이 화면', () => {
  it('화투패는 자체 제작 v19 캐릭터 화풍만 사용하고 구패로 회귀하지 않는다', () => {
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(ui).toContain('hand.map(id=>card(id,');
    expect(ui).toContain('floor.map(id=>{const pile=');
    expect(css).toContain('/* v27 — Shin Matgo-inspired *play hierarchy*');
  });

  it('실제 패판과 손패를 확장하면서 획득패 보기와 자동모드를 남긴다', () => {
    expect(css).toContain('width:min(1260px,98%)');
    expect(css).toContain('width:clamp(70px,7.2vw,98px)');
    expect(css).toContain('width:clamp(62px,7vw,91px)');
    expect(css).toContain('width:clamp(43px,14vw,58px)');
    expect(css).toContain('grid-template-rows:clamp(39px,6.1svh,49px)');
    expect(ui).toContain('class="action-chip action-chip--auto');
    expect(ui).toContain('capturedRack(g,\'computer\')');
  });

  it('일반적인 작은 모바일 너비에서 10장의 손패가 화면 안에 들어온다', () => {
    for (const width of [320, 360, 375, 390, 430]) {
      const cardWidth = Math.min(58, Math.max(43, width * .14));
      const overlap = Math.min(-12, Math.max(-22, width * -.048));
      const handWidth = cardWidth * 10 + overlap * 9;
      expect(handWidth).toBeLessThanOrEqual(width - 8);
    }
  });
});
