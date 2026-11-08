import { describe, expect, it } from 'vitest';
import { groupFloorCards } from '../floorLayout.js';

describe('바닥 패 묶음 표시',()=>{
  it('처음 깔린 같은 월 세 장을 하나로 묶고 다른 패는 그대로 둔다',()=>{
    const floor=['m01-01','m01-02','m01-03','m02-01','m02-02','m03-01'];
    const before=[...floor];
    expect(groupFloorCards(floor)).toEqual([
      {kind:'triple',ids:['m01-01','m01-02','m01-03']},
      {kind:'single',ids:['m02-01']},{kind:'single',ids:['m02-02']},{kind:'single',ids:['m03-01']}
    ]);
    expect(floor).toEqual(before);
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
