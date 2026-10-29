import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const v36 = css.split('/* v36 — mobile quick controls')[1];
const game = ui.slice(ui.indexOf('function gameScreen() {'), ui.indexOf('function gameOverlay('));
describe('꽃맞고 v36 모바일 조작 버튼', () => {
  it('자동/소리 상시 노출과 특수 동작 조건부 메뉴', () => {
    expect(game).toContain('const specialActionButtons = gameButtons(g)');
    expect(game).toContain('const specialActionCount = (specialActionButtons.match(/<button/g) || []).length');
    expect(game).toContain('data-action="automode"');
    expect(game).toContain('data-action="sound"');
    expect(game).toContain('<details class="action-special-menu">');
    expect(game).toContain('aria-label="특수 동작 선택"');
    expect(game).toContain('${specialActionCount ? ');
  });
  it('기존 특수 동작을 모두 제공한다', () => {
    for (const kind of ['bomb','shake','flip','gookjin']) {
      expect(ui).toContain('data-action="' + kind + '"');
    }
    expect(game).toContain('action-row__desktop-special');
    expect(v36).toContain('.action-row__desktop-special {display:contents;}');
    expect(v36).toContain('.scene--game .action-row__desktop-special {display:none;}');
  });
  it('닫힌 메뉴는 숨기고 열린 메뉴에서만 큰 터치 버튼을 노출한다', () => {
    expect(v36).toContain('.action-special-menu:not([open]) .action-special-menu__list {display:none;}');
    expect(v36).toContain('bottom:calc(100% + 9px)');
    expect(v36).toContain('min-height:44px');
    expect(v36).toContain('touch-action:manipulation');
  });
  it('320~430px에서 스크롤 없는 자동/특수/소리 버튼이 공존한다', () => {
    expect(v36).toContain('overflow:visible');
    expect(v36).toContain('flex:1 1 0;min-width:0;max-width:210px');
    for (const width of [320,360,390,430]) {
      const room = width-10-42-12;
      expect(room/2).toBeGreaterThanOrEqual(125);
    }
  });
  it('사용자 승인 원화와 원래 게임 입력을 보존한다', () => {
    expect(css).toContain('hwatu-character-original-v19.webp');
    expect(css).toContain('flower-game-floor-mat-v18.webp');
    expect(v36).toContain("url('/assets/flower-handpainted-paper-v17.webp')");
    expect(v36).not.toContain('.svg');
    expect(ui).toContain("case 'play': humanPlay(cardId);return;");
  });
});
