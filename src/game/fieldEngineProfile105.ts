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

type NavigatorBudget105 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function flag105(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

export function detectFieldEngineTier105(): FieldEngineTier105 {
  const nav = typeof navigator !== 'undefined' ? navigator as NavigatorBudget105 : null;
  const memory = nav?.deviceMemory || 4;
  const cores = nav?.hardwareConcurrency || 4;
  const saveData = Boolean(nav?.connection?.saveData);
  const network = nav?.connection?.effectiveType || '';
  const forcedLite = flag105('soul-online-engine-lite-105') || flag105('soul-online-lite-atlas-106') || flag105('soul-online-field-lite-100') || flag105('soul-online-perf-lite-101') || flag105('soul-online-lite-render-091');
  const forcedQuality = flag105('soul-online-engine-quality-105') || flag105('soul-online-perf-quality-101');
  const narrow = typeof window !== 'undefined' && (window.innerWidth <= 390 || window.innerHeight <= 700);
  if (!forcedQuality && (forcedLite || saveData || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network) || narrow)) return 'lite';
  if (!forcedQuality && (memory <= 4 || cores <= 4 || /3g/.test(network) || (typeof window !== 'undefined' && window.innerWidth <= 430))) return 'balanced';
  return 'quality';
}

export function getFieldEngineProfile105(): FieldEngineProfile105 {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const tier = detectFieldEngineTier105();
  if (tier === 'lite') {
    return { tier, resolution: Math.min(dpr, 0.66), maxFPS: 28, antialias: false, textureConcurrency: 1, sortInterval: 0.30, emitInterval: 0.28, fxChildren: 12, fxBurst: 4, hiddenMobFrameModulo: 6, floatTextScale: 0.64 };
  }
  if (tier === 'balanced') {
    return { tier, resolution: Math.min(dpr, 0.9), maxFPS: 40, antialias: false, textureConcurrency: 1, sortInterval: 0.18, emitInterval: 0.16, fxChildren: 28, fxBurst: 9, hiddenMobFrameModulo: 4, floatTextScale: 0.82 };
  }
  return { tier, resolution: Math.min(dpr, 1.18), maxFPS: 56, antialias: dpr <= 1.5, textureConcurrency: 2, sortInterval: 0.09, emitInterval: 0.095, fxChildren: 56, fxBurst: 20, hiddenMobFrameModulo: 2, floatTextScale: 0.96 };
}
