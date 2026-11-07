import { describe, expect, it } from 'vitest';
import { specialPresentation, eventAnnouncement } from '../specialPresentation.js';

describe('특수 화투 효과 분류', () => {
  it('보너스 연출에서 이미 보인 피 이동은 빼고 다른 피 이동과 특수 상황은 남긴다', () => {
    const result={bonusStolenPee:['m01-03'],stolenPee:['m01-03','m02-03'],specialEvents:[{kind:'jjok',label:'쪽'}]};
    expect(eventAnnouncement(result,'human',{omitBonusTransfer:true})).toBe('쪽! · 상대 피 1장 뺏기!');
    expect(eventAnnouncement({...result,stolenPee:['m01-03'],specialEvents:[]},'human',{omitBonusTransfer:true})).toBeNull();
    expect(eventAnnouncement(result,'human')).toBe('쪽! · 상대 피 2장 뺏기!');
  });
  it('동시에 발생한 쪽과 싹쓸이를 빠짐없이 표시하고 상대를 구분한다', () => {
    const result={specialEvents:[{kind:'jjok',label:'쪽'},{kind:'sweep',label:'싹쓸이'}]};
    expect(eventAnnouncement(result)).toBe('쪽! · 싹쓸이!');
    expect(eventAnnouncement(result,'computer')).toBe('상대 쪽! · 싹쓸이!');
    expect(eventAnnouncement({ppeok:true})).toBe('뻑!');
    expect(eventAnnouncement({captured:[]})).toBeNull();
  });
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
