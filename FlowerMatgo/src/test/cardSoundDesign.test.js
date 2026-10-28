import { describe, expect, it } from 'vitest';
import { CARD_SOUND_PROFILES, cardSoundProfile } from '../cardSoundDesign.js';

describe('패 충돌·뒤집기·획득 소리 구분', () => {
  it('짝패 타격음은 일반 바닥 착지보다 두껍고 밝게 표현한다', () => {
    expect(cardSoundProfile('pair').frequency).toBeGreaterThan(cardSoundProfile('land').frequency);
    expect(cardSoundProfile('pair').bass).toBeGreaterThan(cardSoundProfile('land').bass);
  });

  it('뒤집기는 짧고 높은 소리, 획득은 좀 더 묵직한 소리다', () => {
    expect(cardSoundProfile('flip').duration).toBeLessThan(cardSoundProfile('capture').duration);
    expect(cardSoundProfile('flip').frequency).toBeGreaterThan(cardSoundProfile('capture').frequency);
    expect(cardSoundProfile('capture').bass).toBeGreaterThan(cardSoundProfile('land').bass);
  });

  it('예상치 못한 종류는 안전하게 일반 착지음으로 처리한다', () => {
    expect(cardSoundProfile('unknown')).toEqual(CARD_SOUND_PROFILES.land);
    expect(Object.keys(CARD_SOUND_PROFILES)).toEqual(expect.arrayContaining(['land','pair','flip','capture','special']));
  });

  it('광·쌍피·폭탄·뻑·싹쓸이·따닥·쪽이 독립적인 사운드 패턴을 가진다', () => {
    for (const kind of ['bright','double','bomb','ppeok','sweep','ttadak','jjok']) {
      expect(cardSoundProfile(kind)).not.toEqual(CARD_SOUND_PROFILES.land);
    }
    expect(cardSoundProfile('bright').frequency).toBeGreaterThan(cardSoundProfile('double').frequency);
    expect(cardSoundProfile('bomb').bass).toBeLessThan(cardSoundProfile('sweep').bass);
    expect(cardSoundProfile('ppeok').frequency).toBeLessThan(cardSoundProfile('pair').frequency);
  });
});
