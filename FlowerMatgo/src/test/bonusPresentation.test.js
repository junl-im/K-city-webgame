import { describe, expect, it } from 'vitest';
import { BONUS_FACE_HOLD_MS, BONUS_FLIP_MS, BONUS_COLLECT_MS, BONUS_DRAW_CYCLE_MS, TURN_STAGES, bonusDrawTimeline, bonusRevealRect, drawnBonusCards } from '../turnPresentation.js';

describe('뒤집은 보너스패 연출 순서',()=>{
  it('손에서 낸 보너스는 뒤집은 보너스로 중복 표시하지 않는다',()=>{
    expect(drawnBonusCards({playedCardId:'bonus-pee-1',bonusCards:['bonus-pee-1']})).toEqual([]);
    expect(bonusDrawTimeline({playedCardId:'bonus-pee-1',bonusCards:['bonus-pee-1']}).offset).toBe(0);
  });
  it('연속 보너스는 함께 펼쳐지고 각각 1초 이상 보인 뒤 획득한다',()=>{
    const result={playedCardId:'m01-01',bonusCards:['bonus-pee-1','bonus-double-pee-1'],drawnCardId:'m02-01'};
    const timeline=bonusDrawTimeline(result);
    expect(timeline.steps.map(s=>s.id)).toEqual(result.bonusCards);
    expect(BONUS_FACE_HOLD_MS).toBe(1000);
    expect(timeline.steps[0].move-timeline.steps[0].flip).toBeGreaterThan(BONUS_FLIP_MS+BONUS_FACE_HOLD_MS);
    expect(timeline.steps[1].move-timeline.steps[1].flip).toBe(BONUS_FLIP_MS+BONUS_FACE_HOLD_MS);
    expect(timeline.steps[1].flip).toBeLessThan(timeline.steps[0].move);
    expect(timeline.finalDraw).toBe(timeline.steps[1].move+BONUS_COLLECT_MS);
    expect(timeline.complete).toBe(TURN_STAGES.complete+timeline.offset);
  });
  it('작은 화면에서도 공개할 보너스패를 바닥 중앙과 화면 안에 둔다',()=>{
    const rect=bonusRevealRect({left:70,top:260,width:235,height:260},320,568);
    expect(rect.left).toBeGreaterThan(70);
    expect(rect.left+rect.width).toBeLessThan(320);
    expect(rect.top).toBeGreaterThanOrEqual(50);
    expect(rect.top+rect.height).toBeLessThan(568);
  });
});
