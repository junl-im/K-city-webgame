import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ui = readFileSync(new URL('../main.js',import.meta.url),'utf8');
const motion = readFileSync(new URL('../turnPresentation.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../style.css',import.meta.url),'utf8');

describe('꽃맞고 v30 모바일 카드 터치 피드백',()=>{
  it('손가락을 누르면 엔진의 같은 무늬 판정으로 바닥패만 예고한다',()=>{
    expect(ui).toContain("document.addEventListener('pointerdown',e=>{");
    expect(ui).toContain('getMatchingFloorCards(app.game.floorCards,hand.dataset.card)');
    expect(ui).toContain("hand.classList.add('hwatu--finger-pressed')");
    expect(ui).toContain("item.classList.add('hwatu--finger-match')");
  });
  it('손을 떼거나 터치가 취소되면 예고가 사라지고 단일 탭 규칙은 유지된다',()=>{
    expect(ui).toContain("['pointerup','pointercancel']");
    expect(ui).toContain('setTimeout(clearPressedCardPreview,160)');
    expect(ui).toContain('mutate(target.dataset.action,target.dataset.value,target.dataset.card)');
    expect(ui).toContain('turnTransition || app.screen !== \'game\'');
  });
  it('획득된 카드가 들어가는 실제 획득패 종류는 한 번만 반응한다',()=>{
    expect(motion).toContain('const bouncedGroups = new Set()');
    expect(motion).toContain('const arrival = group || destination');
    expect(motion).toContain('if (!bouncedGroups.has(arrival))');
    expect(motion).toContain('arrival.animate?.([');
  });
  it('기존 캐릭터 화투 원화와 모션 감소 설정을 보존한다',()=>{
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).toContain('.hwatu--finger-match:not(.hwatu--departing)');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(motion).toContain("'(prefers-reduced-motion: reduce)'");
  });
});
