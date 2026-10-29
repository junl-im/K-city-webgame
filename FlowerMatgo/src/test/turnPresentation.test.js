import { describe, expect, it } from 'vitest';
import { TURN_PRESENTATION_MS, TURN_STAGES, CARD_ASPECT, cardHeightForWidth, cardFlightFrames, captureSweepFrames, matchingFloorCardId, stackedLandingRect, resolveTurnLandings, emptyLandingRect, turnCue } from '../turnPresentation.js';

describe('화투패 타격감 시각 연출', () => {
  it('득점·뻑·특수 이벤트의 안내를 엔진 결과에만 따라 결정한다', () => {
    expect(turnCue(null)).toBeNull();
    expect(turnCue({ playedCardId: 'm01-01', drawnCardId: 'm06-02', captured: [] })).toMatchObject({
      played: 'm01-01', drawn: 'm06-02', captures: 0, text: '탁!', impact: 'land'
    });
    expect(turnCue({ captured: ['m01-03', 'm01-04'] })).toMatchObject({captures: 2, text:'착! 2장 획득', impact:'capture'});
    expect(turnCue({captured:['m01-03']})).toMatchObject({capturedIds:['m01-03'],captures:1,text:'쏙! 1장 획득'});
    expect(turnCue({captured:[], ppeok:true}).text).toBe('뻑!');
    expect(turnCue({specialEvents:[{label:'폭탄!'},{label:'고!'}],captured:['a']})).toMatchObject({text:'폭탄! · 고!',impact:'special'});
  });

  it('획득된 광·쌍피와 특수 사건은 각자 다른 화면·소리 연출을 사용한다', () => {
    expect(turnCue({captured:['m01-01']})).toMatchObject({text:'광 획득!',visualKind:'bright',soundKind:'bright'});
    expect(turnCue({captured:['m11-02']})).toMatchObject({text:'쌍피 획득!',visualKind:'double',soundKind:'double'});
    expect(turnCue({specialEvents:[{kind:'bomb',label:'폭탄!'}],captured:[]})).toMatchObject({visualKind:'bomb',soundKind:'bomb'});
    expect(turnCue({specialEvents:[{kind:'sweep',label:'싹쓸이!'}],captured:[]})).toMatchObject({visualKind:'sweep',soundKind:'sweep'});
  });

  it('손패에서 바닥으로 카드가 이동하는 좌표와 끝점이 정확하다', () => {
    const frames = cardFlightFrames({left:50,top:500,width:40,height:63},{left:210,top:140,width:60,height:94});
    expect(frames).toHaveLength(4);
    expect(frames[0].offset).toBe(0);
    expect(frames[3].offset).toBe(1);
    expect(frames[2].transform).toContain('translate3d(170px,-344.5px,0)');
    expect(cardFlightFrames({left:0,top:0,width:10,height:15},{left:0,top:0,width:60,height:90})[2].transform).toContain('scale(2.2)');
  });

  it('획득한 패가 실제 획득 위치로 날아가며 서서히 작아진다', () => {
    const frames=captureSweepFrames({left:100,top:150,width:50,height:79},{left:40,top:440,width:40,height:64},1);
    expect(frames).toHaveLength(4);
    expect(frames[2].transform).toContain('translate3d(');
    expect(frames[3].transform).toContain('scale(.58)');
    expect(frames[3].opacity).toBe(0);
  });

  it('내가 낸 월과 같은 실제 바닥패에 먼저 착지하고, 갱신을 위한 연출 시간을 확보한다', () => {
    expect(matchingFloorCardId('m02-01', ['m09-01','m02-04','m02-02'], ['m09-01','m02-02'])).toBe('m02-02');
    expect(matchingFloorCardId('m02-01', ['m09-01','m02-04'], ['m09-01'])).toBe('m02-04');
    expect(matchingFloorCardId('m02-01', ['m09-01'], ['m09-01'])).toBeNull();
    expect(matchingFloorCardId(null,['m09-01'])).toBeNull();
    expect(TURN_PRESENTATION_MS).toBeGreaterThanOrEqual(1250);
  });

  it('착! 맞는 순간 낸 카드가 기존 바닥패 위에 미세하게 엇갈려 두 장이 보인다', () => {
    const floor={left:100,top:230,width:50,height:78};
    const paired=stackedLandingRect(floor,true);
    expect(paired.left).toBeGreaterThan(floor.left);
    expect(paired.top).toBeLessThan(floor.top);
    expect(paired.width).toBe(floor.width);
    expect(stackedLandingRect(floor,false)).toBe(floor);
    expect(stackedLandingRect(null,true)).toBeNull();
    expect(stackedLandingRect({left:0,top:0,width:150,height:230},true).left).toBe(11);
  });

  it('선택한 바닥패에 맞추고 이미 먹은 패를 뒤집기 대상으로 다시 쓰지 않는다', () => {
    expect(resolveTurnLandings('m02-01','m02-03',['m02-02','m02-04'],['m02-01','m02-02','m02-03','m02-04'],{playedMatchId:'m02-04'})).toEqual({playedFloorId:'m02-04',drawnFloorId:'m02-02',drawnOnPlayed:false});
    expect(resolveTurnLandings('m02-01','m02-03',[],['m02-01','m02-03'])).toEqual({playedFloorId:null,drawnFloorId:null,drawnOnPlayed:true});
    expect(resolveTurnLandings('m02-01','m02-03',['m02-02'],[],{ppeok:true})).toEqual({playedFloorId:'m02-02',drawnFloorId:'m02-02',drawnOnPlayed:false});
    expect(resolveTurnLandings('m02-01','m03-01',['m02-02','m03-02'],['m02-01','m02-02','m03-01','m03-02'])).toEqual({playedFloorId:'m02-02',drawnFloorId:'m03-02',drawnOnPlayed:false});
    expect(resolveTurnLandings('m02-01','m03-01',['m02-02'],['m02-01','m02-02'])).toEqual({playedFloorId:'m02-02',drawnFloorId:null,drawnOnPlayed:false});
  });

  it('짝이 없는 패는 다른 바닥패와 겹치지 않는 빈 곳을 찾는다', () => {
    const bounds={left:0,top:0,width:200,height:160};
    const occupied=[{left:3,top:3,width:50,height:69}];
    const target=emptyLandingRect(bounds,occupied,50);
    expect(target).not.toBeNull();
    expect(target.left >= occupied[0].left+occupied[0].width-2 || target.top >= occupied[0].top+occupied[0].height-2).toBe(true);
    expect(emptyLandingRect({left:0,top:0,width:50,height:70},[{left:0,top:0,width:50,height:70}],50)).toBeNull();
  });

  it('착지→뒤집기→획득→패판 갱신 순서가 유지된다', () => {
    expect(TURN_STAGES.land).toBeLessThan(TURN_STAGES.draw);
    expect(TURN_STAGES.draw-TURN_STAGES.land).toBeGreaterThanOrEqual(140);
    expect(TURN_STAGES.draw).toBeLessThan(TURN_STAGES.flip);
    expect(TURN_STAGES.flip-TURN_STAGES.draw).toBeGreaterThanOrEqual(300);
    expect(TURN_STAGES.flip).toBeLessThan(TURN_STAGES.collect);
    expect(TURN_STAGES.flip + 270).toBeLessThan(TURN_STAGES.collect + 10);
    expect(TURN_STAGES.collect + 3 * 44 + 350).toBeLessThan(TURN_STAGES.complete);
    expect(TURN_PRESENTATION_MS).toBe(TURN_STAGES.complete);
  });

  it('v19 화투패 248:340 원화비율로 던짐·획득 끝점을 계산한다', () => {
    expect(CARD_ASPECT).toEqual({width:248,height:340});
    expect(cardHeightForWidth(248)).toBe(340);
    expect(cardHeightForWidth(62)).toBe(85);
    expect(cardHeightForWidth(40)).toBeCloseTo(54.8387,4);
  });
});
