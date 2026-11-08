import { describe, expect, it } from 'vitest';
import { groupFloorCards } from '../floorLayout.js';

describe('바닥 패 묶음 표시',()=>{
  it('처음 깔린 같은 월 두 장과 세 장을 각각 묶고 다른 패는 그대로 둔다',()=>{
    const floor=['m01-01','m01-02','m01-03','m02-01','m02-02','m03-01'];
    const before=[...floor];
    expect(groupFloorCards(floor)).toEqual([
      {kind:'triple',ids:['m01-01','m01-02','m01-03']},
      {kind:'pair',ids:['m02-01','m02-02']},{kind:'single',ids:['m03-01']}
    ]);
    expect(floor).toEqual(before);
  });
  it('같은 월 세 장이 흩어져 입력돼도 각 묶음을 유지한다',()=>{
    const floor=['m08-03','m08-04','m03-02','m08-01','m10-03','m12-01','m12-03','m12-04'];
    expect(groupFloorCards(floor)).toEqual([
      {kind:'triple',ids:['m08-03','m08-04','m08-01']},
      {kind:'single',ids:['m03-02']},{kind:'single',ids:['m10-03']},
      {kind:'triple',ids:['m12-01','m12-03','m12-04']}
    ]);
  });
  it('서로 다른 두 쌍의 패 번호를 각각 보존한다',()=>{
    const floor=['m08-03','m08-04','m03-02','m11-01','m10-03','m12-01','m12-03','m04-02'];
    const result=groupFloorCards(floor);
    expect(result.filter(group=>group.kind==='pair').map(group=>group.ids)).toEqual([['m08-03','m08-04'],['m12-01','m12-03']]);
    expect(result.flatMap(group=>group.ids).sort()).toEqual([...floor].sort());
  });
  it('실제 뻑에 포함된 보너스패는 같은 묶음에 표시하고 중복하지 않는다',()=>{
    const floor=['bonus-pee-1','m01-01','m01-02','m01-03','m02-01'];
    const groups=groupFloorCards(floor,[{cardIds:['m01-01','m01-02','m01-03'],bonusCardIds:['bonus-pee-1']}]);
    expect(groups).toEqual([{kind:'ppeok',ids:floor.slice(0,4)},{kind:'single',ids:['m02-01']}]);
    expect(groups.flatMap(group=>group.ids)).toEqual(floor);
  });
  it('떨어진 메타데이터와 같은 월 네 장은 실제 뻑으로 표시하지 않는다',()=>{
    const floor=['m01-01','m01-02','m01-03','m01-04'];
    expect(groupFloorCards(floor,[{cardIds:['m02-01','m02-02','m02-03']}])).toHaveLength(4);
  });
});
