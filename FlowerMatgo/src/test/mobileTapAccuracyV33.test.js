import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const tail = css.split('/* v33 — on small screens, a real hand-painted')[1];

describe('꽃맞고 v33: 좁은 화면의 겹친 손패 정확도와 접촉 연출', () => {
  it('모바일 손가락과 펜 입력을 누르기 시작한 패에 고정한다', () => {
    expect(ui).toContain("e.pointerType === 'touch' || e.pointerType === 'pen'");
    expect(ui).toContain('hand.setPointerCapture?.(e.pointerId)');
    expect(ui).toContain("hand.classList.add('hwatu--finger-pressed')");
    expect(ui).toContain('getMatchingFloorCards(app.game.floorCards,hand.dataset.card)');
  });

  it('지원하지 않는 브라우저는 터치 고정 실패를 안전하게 무시하고 기존 한 번 탭을 사용한다', () => {
    expect(ui).toContain('catch { /* Pointer capture is optional;');
    expect(ui).toContain("case 'play': humanPlay(cardId);return;");
    expect(ui).toContain('document.addEventListener(\'click\',e=>{');
  });

  it('같은 패 착지 시 WebP 손그림을 사용하며 기하학 링을 모바일에서 숨긴다', () => {
    expect(tail).toContain("background:url('/assets/flower-special-burst-v22.webp')");
    expect(tail).toContain('.turn-pair-contact::before,.turn-pair-contact::after,');
    expect(tail).toContain('.turn-pair-contact i {display:none;}');
    expect(tail).toContain('animation:flower-card-contact-v33');
    expect(tail).not.toMatch(/\.svg/);
  });

  it('동작 줄이기와 원본 화투패 보존을 지킨다', () => {
    expect(tail).toContain('@media (prefers-reduced-motion:reduce)');
    expect(tail).toContain('.turn-pair-contact {animation:none;opacity:0;}');
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
  });
});
