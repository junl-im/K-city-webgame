export type FieldEngineTier105 = 'lite' | 'balanced' | 'quality';

export type FieldEngineProfile105 = {
  tier: FieldEngineTier105;
  resolution: number;
  maxFPS: number;
  antialias: boolean;
  textureConcurrency: number;
  sortInterval: number;
  emitInterval: number;
  fxChildren: number;
  fxBurst: number;
  hiddenMobFrameModulo: number;
  floatTextScale: number;
};

/**
 * Alpha 1.17: 단말/네트워크에 따라 Lite·Balanced·Quality로 갈라지던 엔진 모드를 제거합니다.
 * 실제 타입 호환성은 기존 'balanced' 값을 유지하되, 의미상으로는 항상 하나의 'standard' 프로필입니다.
 */
export function detectFieldEngineTier105(): FieldEngineTier105 {
  return 'balanced';
}

export function getFieldEngineProfile105(): FieldEngineProfile105 {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return {
    tier: 'balanced',
    resolution: Math.min(dpr, 0.92),
    maxFPS: 45,
    antialias: false,
    textureConcurrency: 1,
    sortInterval: 0.2,
    emitInterval: 0.18,
    fxChildren: 28,
    fxBurst: 9,
    hiddenMobFrameModulo: 4,
    floatTextScale: 0.82
  };
}
