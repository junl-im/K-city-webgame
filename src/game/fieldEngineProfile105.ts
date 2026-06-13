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
 * Alpha 1.29: 그래픽 품질을 낮추는 lite/balanced 자동 전환을 중단합니다.
 * 접속/렉 개선은 로딩 순서, 캐시, 중복 mount 제거로 해결하고 2.5D 비주얼은 quality 단일 프로필로 유지합니다.
 */
export function detectFieldEngineTier105(): FieldEngineTier105 {
  return 'quality';
}

export function getFieldEngineProfile105(): FieldEngineProfile105 {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return {
    tier: 'quality',
    // 너무 큰 렌더 타깃만 방지하고, 1.23 이후 복구한 2.5D 선명도는 유지한다.
    resolution: Math.min(Math.max(dpr, 1), 1.5),
    maxFPS: 50,
    antialias: true,
    textureConcurrency: 2,
    sortInterval: 0.16,
    emitInterval: 0.16,
    fxChildren: 34,
    fxBurst: 11,
    hiddenMobFrameModulo: 3,
    floatTextScale: 0.9
  };
}
