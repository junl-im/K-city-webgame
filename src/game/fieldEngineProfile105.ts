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
  const forcedLite = flag105('soul-online-final-lite-107') || flag105('soul-online-engine-lite-105') || flag105('soul-online-lite-atlas-106') || flag105('soul-online-field-lite-100') || flag105('soul-online-perf-lite-101') || flag105('soul-online-lite-render-091');
  const forcedQuality = flag105('soul-online-final-quality-107') || flag105('soul-online-engine-quality-105') || flag105('soul-online-perf-quality-101');
  const narrow = typeof window !== 'undefined' && (window.innerWidth <= 390 || window.innerHeight <= 720);
  const portraitCompact = typeof window !== 'undefined' && (window.innerWidth <= 430 || window.innerHeight <= 780);
  if (!forcedQuality && (forcedLite || saveData || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network) || narrow)) return 'lite';
  if (!forcedQuality && (memory <= 4 || cores <= 4 || /3g/.test(network) || portraitCompact)) return 'balanced';
  return 'quality';
}

export function getFieldEngineProfile105(): FieldEngineProfile105 {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const tier = detectFieldEngineTier105();
  if (tier === 'lite') {
    return { tier, resolution: Math.min(dpr, 0.62), maxFPS: 26, antialias: false, textureConcurrency: 1, sortInterval: 0.36, emitInterval: 0.34, fxChildren: 10, fxBurst: 3, hiddenMobFrameModulo: 8, floatTextScale: 0.60 };
  }
  if (tier === 'balanced') {
    return { tier, resolution: Math.min(dpr, 0.82), maxFPS: 38, antialias: false, textureConcurrency: 1, sortInterval: 0.22, emitInterval: 0.20, fxChildren: 22, fxBurst: 7, hiddenMobFrameModulo: 5, floatTextScale: 0.76 };
  }
  return { tier, resolution: Math.min(dpr, 1.08), maxFPS: 54, antialias: dpr <= 1.25, textureConcurrency: 2, sortInterval: 0.11, emitInterval: 0.12, fxChildren: 46, fxBurst: 16, hiddenMobFrameModulo: 2, floatTextScale: 0.92 };
}
