import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const overlay = ui.slice(ui.indexOf('function gameOverlay(g) {'), ui.indexOf('function helpOverlay() {'));
const card = ui.slice(ui.indexOf('function card(id, options = {})'), ui.indexOf('function cardBack('));
const styles = css.split('/* v37 — thumb-friendly match selection')[1];

describe('꽃맞고 v37 모바일 카드 선택 및 고/스톱', () => {
  it('두 패 선택은 분명한 제목과 2개의 큰 실제 화투 이미지로 구성된다', () => {
    expect(overlay).toContain('role="dialog" aria-modal="true" aria-labelledby="match-choice-title"');
    expect(overlay).toContain('class="modal-box modal-box--match"');
    expect(overlay).toContain('class="match-choices" role="group"');
    expect(overlay).toContain('selectedMatch.matches.map((id,index)=>');
    expect(overlay).toContain("card(id,{action:'pickmatch'})");
    expect(overlay).toContain('class="match-choice__name"');
    expect(overlay).toContain('spokenCardName(getCard(id))');
    expect(overlay).toContain("'cancelmatch'");
    expect(styles).toContain('width:clamp(72px,25vw,116px)');
  });
  it('선택패 접근성 문구는 내기가 아닌 먹기로 표시된다', () => {
    expect(card).toContain("options.action==='pickmatch'?'먹기':'내기'");
    expect(ui).toContain("case 'pickmatch': if (selectedMatch) humanPlay(selectedMatch.cardId,cardId)");
    expect(ui).toContain("case 'cancelmatch': selectedMatch=null;render();return;");
  });
  it('고/스톱은 큰 두 버튼과 현재 점수를 노출하며 게임 판정은 그대로 사용한다', () => {
    expect(overlay).toContain('class="modal-box modal-box--choice" role="dialog" aria-modal="true"');
    expect(overlay).toContain('class="decision-score"');
    expect(overlay).toContain("scoreOf(g,'human').total");
    expect(overlay).toContain('data-action="go"');
    expect(overlay).toContain('data-action="stop"');
    expect(ui).toContain("if (action==='go') next=chooseGo(g,'human')");
    expect(ui).toContain("else if (action==='stop') next=chooseStop(g,'human')");
    expect(styles).toContain('min-height:clamp(84px,15svh,112px)');
  });
  it('20초 선택 타이머와 작은 휴대폰의 세로 공간을 보존한다', () => {
    expect(overlay).toContain('data-turn-seconds');
    expect(overlay).toContain('${HUMAN_TURN_SECONDS}');
    expect(overlay).toContain('시간 종료 시 스톱');
    expect(styles).toContain('max-height:calc(100svh - 32px)');
    expect(styles).toContain('@media (max-width:650px) and (max-height:600px)');
    expect(styles).toContain('width:clamp(57px,17svh,78px)');
    for (const width of [320,360,390,430]) {
      const cardWidth=Math.max(72,Math.min(width*.25,116));
      expect(cardWidth*2+18+20).toBeLessThan(width);
    }
  });
  it('승인된 WebP 화투와 게임판을 변경하거나 SVG를 도입하지 않는다', () => {
    expect(css).toContain("hwatu-character-original-v19.webp");
    expect(css).toContain("flower-game-floor-mat-v18.webp");
    expect(styles).toContain("flower-handpainted-paper-v17.webp");
    expect(styles).not.toMatch(/\.svg/);
    expect(styles).toContain('@media (prefers-reduced-motion:reduce)');
  });
});
