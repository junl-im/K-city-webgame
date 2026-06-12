import type { HealthLevel } from './technicalHealth';

export type RuntimeTier112 = 'lite' | 'balanced' | 'quality';
export type RuntimeRoute112 = 'title' | 'login' | 'town' | 'field';

export interface MobileRuntimeReport112 {
  level: HealthLevel;
  tier: RuntimeTier112;
  route: RuntimeRoute112;
  viewport: string;
  dpr: number;
  cssBudgetKB: number;
  imageCount: number;
  lazyImageCount: number;
  reduceMotion: boolean;
  dataSaver: boolean;
  message: string;
  hint: string;
}

type RuntimeInstallOptions112 = {
  root?: HTMLElement;
  titleScreen?: HTMLElement;
  loginScreen?: HTMLElement;
  townScreen?: HTMLElement;
  gameRoot?: HTMLElement;
};

type NavigatorWithHints112 = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    downlink?: number;
  };
};

let installed112 = false;
let resizeTimer112 = 0;

/**
 * 1.12 모바일 런타임 가드입니다.
 * 주소창 높이 변화, DPR, 데이터 절약 모드, 저사양 단말 힌트를 하나의 body 상태로 합칩니다.
 */
export function installMobileRuntime112(root: Document = document, options: RuntimeInstallOptions112 = {}) {
  if (installed112) return syncMobileRuntime112(root, options);
  installed112 = true;
  root.body.classList.add('mobile-runtime-112');
  syncMobileRuntime112(root, options);

  const schedule = () => {
    window.clearTimeout(resizeTimer112);
    resizeTimer112 = window.setTimeout(() => syncMobileRuntime112(root, options), 80);
  };

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  root.addEventListener('visibilitychange', () => syncMobileRuntime112(root, options));

  // 모바일 브라우저에서 길게 누르기 메뉴나 더블탭 확대가 HUD 입력을 가로채는 것을 줄입니다.
  root.addEventListener('contextmenu', (event) => {
    if ((event.target as HTMLElement).closest('.game-root, .hud-top, .action-dock, .joystick, .skill-dock')) event.preventDefault();
  });

  return inspectMobileRuntime112(root, options);
}

/** 현재 라우트와 단말 상태를 body class/data로 반영합니다. */
export function syncMobileRuntime112(root: Document = document, options: RuntimeInstallOptions112 = {}) {
  const report = inspectMobileRuntime112(root, options);
  const body = root.body;
  body.classList.toggle('runtime-lite-112', report.tier === 'lite');
  body.classList.toggle('runtime-balanced-112', report.tier === 'balanced');
  body.classList.toggle('runtime-quality-112', report.tier === 'quality');
  body.classList.toggle('runtime-data-saver-112', report.dataSaver);
  body.classList.toggle('runtime-reduced-motion-112', report.reduceMotion || report.tier === 'lite');
  body.dataset.runtimeTier112 = report.tier;
  body.dataset.runtimeRoute112 = report.route;
  body.dataset.runtimeHealth112 = report.level;

  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth || root.documentElement.clientWidth || 0);
  const height = Math.round(vv?.height || window.innerHeight || root.documentElement.clientHeight || 0);
  const safeBottom = Math.max(8, Math.round(Math.min(28, height * 0.018)));
  root.documentElement.style.setProperty('--vvw-112', `${width}px`);
  root.documentElement.style.setProperty('--vvh-112', `${height}px`);
  root.documentElement.style.setProperty('--runtime-dpr-112', String(report.dpr));
  root.documentElement.style.setProperty('--runtime-safe-gap-112', `${safeBottom}px`);
  applyImageRuntimePolicy112(root, report.tier);
  return report;
}

/** System Doctor용 런타임 진단입니다. */
export function inspectMobileRuntime112(root: Document = document, options: RuntimeInstallOptions112 = {}): MobileRuntimeReport112 {
  const nav = navigator as NavigatorWithHints112;
  const route = detectRoute112(root, options);
  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth || root.documentElement.clientWidth || 0);
  const height = Math.round(vv?.height || window.innerHeight || root.documentElement.clientHeight || 0);
  const dpr = Math.round(Math.min(3, window.devicePixelRatio || 1) * 100) / 100;
  const dataSaver = Boolean(nav.connection?.saveData);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const memory = nav.deviceMemory || 4;
  const effectiveType = nav.connection?.effectiveType || 'unknown';
  const cssBudgetKB = estimateCssKB112(root);
  const images = Array.from(root.images || []);
  const lazyImageCount = images.filter((image) => image.loading === 'lazy').length;
  const tier = classifyRuntimeTier112({ width, height, dpr, memory, dataSaver, effectiveType });
  const level: HealthLevel = cssBudgetKB > 1180 || width < 330 ? 'warn' : 'ok';
  const viewport = `${width}x${height}`;
  const message = `${tier.toUpperCase()} · ${viewport}`;
  const hint = `DPR ${dpr} · CSS ${cssBudgetKB}KB · IMG ${lazyImageCount}/${images.length} lazy · ${dataSaver ? 'Data Saver' : effectiveType}`;

  return {
    level,
    tier,
    route,
    viewport,
    dpr,
    cssBudgetKB,
    imageCount: images.length,
    lazyImageCount,
    reduceMotion,
    dataSaver,
    message,
    hint
  };
}

function detectRoute112(root: Document, options: RuntimeInstallOptions112): RuntimeRoute112 {
  if (root.body.classList.contains('field-active')) return 'field';
  if (root.body.classList.contains('town-active')) return 'town';
  if (options.titleScreen && !options.titleScreen.classList.contains('hidden')) return 'title';
  if (options.loginScreen && !options.loginScreen.classList.contains('hidden')) return 'login';
  return 'login';
}

function classifyRuntimeTier112(input: { width: number; height: number; dpr: number; memory: number; dataSaver: boolean; effectiveType: string }): RuntimeTier112 {
  if (input.dataSaver) return 'lite';
  if (input.width <= 360 || input.height <= 620) return 'lite';
  if (input.memory <= 2) return 'lite';
  if (/2g|slow-2g/i.test(input.effectiveType)) return 'lite';
  if (input.width >= 430 && input.memory >= 6 && input.dpr >= 2) return 'quality';
  return 'balanced';
}

function estimateCssKB112(root: Document) {
  let chars = 0;
  for (const sheet of Array.from(root.styleSheets || [])) {
    try {
      chars += Array.from(sheet.cssRules || []).reduce((sum, rule) => sum + rule.cssText.length, 0);
    } catch {
      // Cross-origin stylesheet은 읽을 수 없으므로 performance entry에서 보정합니다.
    }
  }
  const perfBytes = (() => {
    try {
      return (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter((entry) => entry.initiatorType === 'css' || /\.css(\?|$)/i.test(entry.name))
        .reduce((sum, entry) => sum + Math.max(entry.transferSize || 0, entry.encodedBodySize || 0), 0);
    } catch {
      return 0;
    }
  })();
  return Math.round((Math.max(chars, perfBytes) / 1024) * 10) / 10;
}

function applyImageRuntimePolicy112(root: Document, tier: RuntimeTier112) {
  const images = Array.from(root.images || []);
  images.forEach((image, index) => {
    image.decoding = 'async';
    if (tier === 'lite' || index > 6) image.loading = 'lazy';
    if (index < 4 && tier !== 'lite') image.setAttribute('fetchpriority', 'high');
    else image.setAttribute('fetchpriority', 'low');
  });
}
