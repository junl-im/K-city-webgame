import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { floorDensity, capturedCardNotice } from '../floorLayout.js';

const ui = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const motion = readFileSync(new URL('../turnPresentation.js', import.meta.url), 'utf8');
const v39 = css.split('/* v39 — keep large original hwatu')[1];
const clamp=(lo,n,hi)=>Math.max(lo,Math.min(n,hi));

describe('꽃맞고 v39 모바일 후반 패판·획득 피드백', () => {
  it('패 수에 맞춰 5단계 밀도 선택이 정확하다', () => {
    for (const [count, expected] of [[0,'normal'],[8,'normal'],[9,'busy'],[12,'busy'],[13,'packed'],[16,'packed'],[17,'dense'],[21,'dense'],[22,'full'],[28,'full']]) {
      expect(floorDensity(count)).toBe(expected);
    }
    expect(floorDensity(-4)).toBe('normal');
    expect(floorDensity('unknown')).toBe('normal');
    expect(ui).toContain('data-density="${floorDensity(floor.length)}"');
  });
  it('가로 320~430px의 패가 17~24장으로 늘어도 3줄에 수용 가능하다', () => {
    for (const width of [320,340,360,390,412,430]) {
      const floorWidth=width-54;
      const denseSize=clamp(34,width*.106,42);
      const fullSize=clamp(29,width*.094,38);
      const denseColumns=Math.floor((floorWidth+3)/(denseSize+3));
      const fullColumns=Math.floor((floorWidth+2)/(fullSize+2));
      expect(denseColumns*3,width+' dense').toBeGreaterThanOrEqual(21);
      expect(fullColumns*3,width+' full').toBeGreaterThanOrEqual(24);
    }
    expect(v39).toContain('width:clamp(34px,10.6vw,42px)');
    expect(v39).toContain('width:clamp(29px,9.4vw,38px)');
  });
  it('높이 560~700px 이하는 후반 밀도를 다시 조정한다', () => {
    expect(v39).toContain('@media (max-width:650px) and (max-height:700px)');
    expect(v39).toContain('@media (max-width:650px) and (max-height:560px)');
    expect(v39).toContain('width:clamp(24px,7.8vw,30px)');
    expect(v39).toContain('width:clamp(28px,8.8vw,34px)');
  });
  it('불필요한 가로·세로 스크롤바를 숨겨 패판에 집중한다', () => {
    expect(v39).toContain('.scene--game .floor-area::-webkit-scrollbar {display:none;}');
    expect(v39).toContain('scrollbar-width:none');
    expect(v39).toContain('overscroll-behavior:contain');
  });
  it('획득패는 1번만 작은 안내로 띄우고 입력과 사운드를 막지 않는다', () => {
    expect(capturedCardNotice(0)).toBe('');
    expect(capturedCardNotice(1)).toBe('+1장 획득');
    expect(capturedCardNotice(4)).toBe('+4장 획득');
    expect(motion).toContain('function spawnCapturedNotice(root, destination, count, delay)');
    expect(motion).toContain('spawnCapturedNotice(root,destination,ids.length,TURN_STAGES.collect + 150)');
    expect(motion).toContain("sticker.setAttribute('aria-hidden','true')");
    expect(v39).toContain('pointer-events:none');
  });
  it('화투 원화와 점수·판정 규칙은 변경하지 않고 접근성·모션 설정을 유지한다', () => {
    expect(css).toContain('hwatu-character-original-v19.webp');
    expect(css).toContain('flower-game-floor-mat-v18.webp');
    expect(v39).toContain('flower-handpainted-paper-v17.webp');
    expect(v39).toContain('@media (prefers-reduced-motion:reduce)');
    expect(v39).not.toMatch(/\.svg/);
    expect(ui).toContain("case 'play': humanPlay(cardId);return;");
  });
});
