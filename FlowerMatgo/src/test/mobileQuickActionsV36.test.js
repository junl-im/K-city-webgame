import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const game = ui.slice(ui.indexOf('function gameScreen() {'), ui.indexOf('function gameOverlay('));
describe('꽃맞고 모바일 조작 버튼', () => {
  it('자동 버튼과 현재 가능한 행동을 직접 노출하고 특수 묶음은 표시하지 않는다', () => {
    expect(game).toContain('data-action="automode"');
    expect(game).toContain('${specialActionButtons}');
    expect(game).not.toContain('<details class="action-special-menu">');
    expect(game).not.toContain('sound-control--top');
  });
  it('폭탄, 흔들기, 뒤집기, 국진을 상황에 맞춰 제공한다', () => {
    for (const kind of ['bomb','shake','flip','gookjin']) expect(ui).toContain('data-action="' + kind + '"');
    expect(ui).toContain("g.phase === 'playing' && g.currentPlayer === 'human'");
  });
  it('기존 그림 자산과 손패 입력을 유지한다', () => {
    expect(css).toContain('hwatu-character-original-v19.webp');
    expect(css).toContain('flower-game-floor-mat-v18.webp');
    expect(ui).toContain("case 'play': humanPlay(cardId);return;");
  });
});
