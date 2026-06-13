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
 * Alpha 1.23: 단말/네트워크별 저화질/고화질 분기는 사용하지 않습니다.
 * 타입 호환성은 기존 'balanced' 값을 유지하되, 의미상으로는 2.5D 표준 단일 프로필입니다.
 */
export function detectFieldEngineTier105(): FieldEngineTier105 {
  return 'balanced';
}

export function getFieldEngineProfile105(): FieldEngineProfile105 {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return {
    tier: 'balanced',
    resolution: Math.min(dpr, 1),
    maxFPS: 45,
    antialias: true,
    textureConcurrency: 2,
    sortInterval: 0.2,
    emitInterval: 0.18,
    fxChildren: 28,
    fxBurst: 9,
    hiddenMobFrameModulo: 4,
    floatTextScale: 0.82
  };
}
