import { describe, expect, it } from 'vitest';
import { specialPresentation } from '../specialPresentation.js';

describe('특수 화투 효과 분류', () => {
  it('없는 결과·일반 피에는 별도의 효과가 없다', () => {
    expect(specialPresentation(null)).toBeNull();
    expect(specialPresentation({captured: []})).toBeNull();
    expect(specialPresentation({captured: ['m01-03', 'm01-04']})).toBeNull();
  });

  it('실제 획득한 카드 종류로 광·쌍피를 판별한다', () => {
    expect(specialPresentation({captured:['m01-01']})).toEqual({kind:'bright',sound:'bright',text:'광 획득!'});
    expect(specialPresentation({captured:['m12-01']})).toMatchObject({kind:'bright'});
    expect(specialPresentation({captured:['m11-02']})).toEqual({kind:'double',sound:'double',text:'쌍피 획득!'});
    expect(specialPresentation({captured:['m12-04']})).toMatchObject({kind:'double'});
    expect(specialPresentation({captured:['bonus-pee-1']})).toMatchObject({kind:'double'});
    expect(specialPresentation({captured:['m11-02','m03-01']})).toMatchObject({kind:'bright'});
  });

  it('엔진의 특수 사건 종류를 각각 구분하며 원래 라벨을 보존한다', () => {
    for (const [eventKind,expectedKind] of [
      ['bomb','bomb'],['sweep','sweep'],['ppeok','ppeok'],
      ['ppeok-capture','ppeok'],['self-ppeok','ppeok'],['ttadak','ttadak'],['jjok','jjok']
    ]) {
      expect(specialPresentation({specialEvents:[{kind:eventKind,label:'발생!'}],captured:['m01-01']}))
        .toEqual({kind:expectedKind,sound:expectedKind,text:'발생!'});
    }
  });

  it('한 턴의 여러 사건은 강한 연출을 우선 적용하고 라벨은 모두 표시한다', () => {
    expect(specialPresentation({specialEvents:[
      {kind:'jjok',label:'쪽!'},{kind:'sweep',label:'싹쓸이!'},{kind:'bomb',label:'폭탄!'}
    ]})).toEqual({kind:'bomb',sound:'bomb',text:'쪽! · 싹쓸이! · 폭탄!'});
    expect(specialPresentation({ppeok:true,captured:[]})).toMatchObject({kind:'ppeok',text:'뻑!'});
    expect(specialPresentation({specialEvents:[{kind:'unknown',label:'보너스!'}]}))
      .toMatchObject({kind:'special',text:'보너스!'});
  });
});
