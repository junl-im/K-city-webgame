export type PerfTier101 = 'lite' | 'balanced' | 'quality';

export type PerfReport101 = {
  tier: PerfTier101;
  label: string;
  level: 'ok' | 'warn';
  hint: string;
  memory: number;
  cores: number;
  saveData: boolean;
  network: string;
  forcedLite: boolean;
  imageCount: number;
  heavyDomCount: number;
};

type NavigatorWithBudget101 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function flag101(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

function setFlag101(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    // Private-mode storage may be unavailable. Body classes still provide a runtime hint.
  }
}

export function detectPerfTier101(): PerfTier101 {
  const nav = navigator as NavigatorWithBudget101;
  const memory = nav.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  const forcedLite = flag101('soul-online-perf-lite-101') || flag101('soul-online-lite-render-091') || flag101('soul-online-field-lite-100');
  const forcedQuality = flag101('soul-online-perf-quality-101');
  if (!forcedQuality && (forcedLite || saveData || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network))) return 'lite';
  if (!forcedQuality && (memory <= 4 || cores <= 4 || /3g/.test(network))) return 'balanced';
  return 'quality';
}

export function installPerformanceTuner101(doc: Document = document) {
  const apply = () => {
    const tier = detectPerfTier101();
    doc.body.classList.toggle('perf-lite-101', tier === 'lite');
    doc.body.classList.toggle('perf-balanced-101', tier === 'balanced');
    doc.body.classList.toggle('perf-quality-101', tier === 'quality');
    doc.body.classList.toggle('art-lite-099', tier === 'lite');
    doc.body.classList.toggle('field-lite-100', tier !== 'quality');
    // Let SolGame read the same decision before it creates the Pixi application.
    setFlag101('soul-online-field-lite-100', tier === 'lite');
    setFlag101('soul-online-perf-lite-101', tier === 'lite');
    const root = doc.documentElement;
    root.style.setProperty('--so-field-fx-scale', tier === 'lite' ? '0.72' : tier === 'balanced' ? '0.86' : '1');
    root.style.setProperty('--so-panel-blur-101', tier === 'lite' ? '0px' : tier === 'balanced' ? '5px' : '10px');
  };
  apply();
  window.addEventListener('online', apply, { passive: true });
  window.addEventListener('offline', apply, { passive: true });
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', apply);
  return apply;
}

export function syncPerformanceRoute101(route: 'title' | 'login' | 'town' | 'field' | 'unknown', doc: Document = document) {
  doc.body.classList.toggle('perf-route-field-101', route === 'field');
  doc.body.classList.toggle('perf-route-town-101', route === 'town');
  doc.body.classList.toggle('perf-route-entry-101', route === 'title' || route === 'login');
  if (route !== 'field') doc.body.classList.remove('field-input-overlap-risk-101');
  requestAnimationFrame(() => {
    const watched = Array.from(doc.querySelectorAll<HTMLElement>('.field-hud-shell-100, .field-control-cluster, .attack-button, .skill-dock, .potion-dock, .joystick, .field-quest-tracker, .target-card'));
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const overflow = watched.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.right > vw + 2 || rect.bottom > vh + 2 || rect.left < -2 || rect.top < -2;
    }).length;
    doc.body.classList.toggle('field-input-overlap-risk-101', overflow > 0);
  });
}

export function applyImageDecodePolicy101(root: ParentNode = document) {
  let changed = 0;
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (!img.loading) { img.loading = 'lazy'; changed += 1; }
    if (!img.decoding) { img.decoding = 'async'; changed += 1; }
    img.setAttribute('fetchpriority', img.closest('.title-screen, .field-hud-shell-100') ? 'high' : 'low');
  });
  return changed;
}

export function inspectPerformance101(doc: Document = document): PerfReport101 {
  const nav = navigator as NavigatorWithBudget101;
  const tier = detectPerfTier101();
  const memory = nav.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || 'unknown';
  const imageCount = doc.images.length;
  const heavyDomCount = doc.querySelectorAll('.field-hud-shell-100, .town-clean-hub-098, .visual-immersion-board, .system-doctor-087, .sheet-panel, .town-content-panel').length;
  const level = tier === 'quality' || heavyDomCount < 7 ? 'ok' : 'warn';
  const label = tier === 'lite' ? '라이트 렌더' : tier === 'balanced' ? '균형 렌더' : '고품질 렌더';
  return {
    tier,
    label,
    level,
    hint: `mem ${memory}GB · core ${cores} · ${network} · img ${imageCount} · heavy ${heavyDomCount}`,
    memory,
    cores,
    saveData,
    network,
    forcedLite: flag101('soul-online-perf-lite-101'),
    imageCount,
    heavyDomCount
  };
}
