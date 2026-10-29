import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const js = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const result = js.slice(js.indexOf("  if (g.phase === 'round-ended') {", js.indexOf('function gameOverlay(g) {')), js.indexOf("  return '';", js.indexOf('function gameOverlay(g) {')));
const gain = js.slice(js.indexOf('function showScoreGain('), js.indexOf('function showScoreSet('));
const v38 = css.split('/* v38 — outcome-first result panel')[1];

describe('꽃맞고 v38 모바일 판 결과·점수 피드백', () => {
  it('승리·패배·나가리 세 결과를 실제 엔진 상태로 구분한다', () => {
    expect(result).toContain("const nagari = g.roundResult === 'nagari'");
    expect(result).toContain("const win = g.winner === 'human' && !nagari");
    expect(result).toContain("const outcome = nagari ? 'draw' : win ? 'win' : 'lose'");
    expect(result).toContain('result-box--${outcome}');
    expect(result).toContain('aria-labelledby="result-title"');
    expect(result).toContain('다시 승부!');
  });
  it('나와 상대 점수를 함께 큰 글씨로 보여주며 결과 금액은 기존 정산을 따른다', () => {
    expect(result).toContain("const myScore = scoreOf(g,'human').total");
    expect(result).toContain("const rivalScore = scoreOf(g,'computer').total");
    expect(result).toContain('class="result-duel" role="group"');
    expect(result).toContain('>${myScore}<small>점</small>');
    expect(result).toContain('>${rivalScore}<small>점</small>');
    expect(result).toContain("g.settlement?.displayAmount || 0");
    expect(result).toContain('g.settlement?.finalScore');
    expect(result).toContain('app.nextMultiplier');
  });
  it('승자의 실제 획득 패만 3장 미리 보여주며 나가리는 패 미리보기를 숨긴다', () => {
    expect(result).toContain("const winningCards = nagari ? [] : (win ? g.humanCaptured : g.computerCaptured).slice(-3)");
    expect(result).toContain('승자의 획득 화투패 일부');
    expect(result).toContain('winningCards.map(id=>card(id,{small:true');
    expect(v38).toContain('.result-card-peek__cards .hwatu');
    expect(v38).toContain('width:clamp(30px,9vw,40px)');
  });
  it('다음 판·메인·오링 충전이 유지되고 낮은 화면에선 결과창을 스크롤한다', () => {
    expect(result).toContain("btn('다음 판 치기','next','btn--primary btn--wide')");
    expect(result).toContain("canEmergencyRecharge(app.wallet)?btn('긴급 무료 충전 +30만 냥'");
    expect(result).toContain("btn('메인으로','home','btn--quiet')");
    expect(v38).toContain('max-height:calc(100svh - 20px)');
    expect(v38).toContain('overflow-x:hidden;overflow-y:auto');
    expect(v38).toContain('@media (max-width:650px) and (max-height:600px)');
  });
  it('가장자리 득점 글씨가 화면 밖으로 벗어나지 않고 모션 감소 설정을 존중한다', () => {
    expect(gain).toContain('const safeX = Math.max(50, Math.min(window.innerWidth - 50');
    expect(gain).toContain('const safeY = Math.max(90, Math.min(window.innerHeight - 40');
    expect(gain).toContain('pop.style.left = `${safeX}px`');
    expect(gain).toContain('pop.style.top = `${safeY}px`');
    expect(v38).toContain('@media (prefers-reduced-motion:reduce)');
    expect(v38).toContain('.score-gain {animation:none;opacity:1;}');
  });
  it('자체 제작 캐릭터·손그림 이미지 유지, 외부 게임 소스·SVG 추가 없음', () => {
    expect(css).toContain('hwatu-character-original-v19.webp');
    expect(css).toContain('flower-game-floor-mat-v18.webp');
    expect(v38).toContain('flower-handpainted-paper-v17.webp');
    expect(v38).toContain('flower-handpainted-button-v17.webp');
    expect(v38).not.toMatch(/\.svg/);
  });
});
