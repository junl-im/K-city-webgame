import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

describe('꽃맞고 꽃놀이마당 게임 UI v16', () => {
  it('상대 동물의 승부 분위기에 따라 표정 모션을 달리하고 실제 점수는 그대로 보여준다', () => {
    expect(source).toContain('const opponentMood =');
    expect(source).toContain('opponent-hud--${opponentMood}');
    expect(source).toContain('${ai.total}');
    expect(css).toContain('.opponent-hud--thinking .opponent-avatar');
    expect(css).toContain('.opponent-hud--victory .opponent-avatar');
    expect(css).toContain('.opponent-hud--surprised .opponent-avatar');
  });

  it('선택판과 인게임에 입체 원화풍을 적용하지만 승인 화투 원판은 고정한다', () => {
    expect(css).toContain('v16 — 꽃놀이마당 인게임 아트 디렉션');
    expect(css).toContain('.scene--game .collection-rack');
    expect(css).toContain('.scene--game .my-hand');
    expect(css).toContain('.scene--game .action-chip:active');
    expect(css).toContain("background-image:url('/assets/hwatu-character-original-v19.webp')");
    expect(css).not.toContain('hwatu-cute-months04-06-v1');
  });

  it('모바일 화면을 초과하지 않고 효과를 줄여야 하는 이용자도 배려한다', () => {
    expect(css).toContain('height:100svh;max-height:100svh');
    expect(css).toContain('.scene--game .opponent-avatar {width:38px;}');
    expect(css).toContain('.scene--game .my-hand {height:46px;}');
    expect(css).toContain('.opponent-avatar,.opponent-hud__sparkle,.result-box .result-star {animation:none!important;}');
  });
});
