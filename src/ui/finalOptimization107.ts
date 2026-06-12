type FinalTier107 = 'lite' | 'balanced' | 'quality';
type HealthLevel107 = 'ok' | 'warn';

type InstallTargets107 = {
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  closeButtons?: HTMLElement[];
};

type NavigatorBudget107 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

type PerformanceMemory107 = Performance & {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
};

function flag107(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

function nav107() {
  return navigator as NavigatorBudget107;
}

export function detectFinalTier107(): FinalTier107 {
  const nav = nav107();
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const network = nav.connection?.effectiveType || '';
  const saveData = Boolean(nav.connection?.saveData);
  const shortViewport = Math.min(window.innerWidth, window.innerHeight) <= 390 || window.innerHeight <= 720;
  const forcedLite = flag107('soul-online-final-lite-107') || flag107('soul-online-lite-atlas-106') || flag107('soul-online-engine-lite-105') || flag107('soul-online-lite-render-091');
  const forcedQuality = flag107('soul-online-final-quality-107') || flag107('soul-online-engine-quality-105');
  if (!forcedQuality && (forcedLite || saveData || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network) || shortViewport)) return 'lite';
  if (!forcedQuality && (memory <= 4 || cores <= 4 || /3g/.test(network) || window.innerWidth <= 430 || window.innerHeight <= 780)) return 'balanced';
  return 'quality';
}

function route107(doc: Document) {
  const body = doc.body;
  if (body.classList.contains('field-active')) return 'field';
  if (body.classList.contains('town-active')) return 'town';
  if (!doc.querySelector('#titleScreen')?.classList.contains('hidden')) return 'title';
  return 'login';
}

function visible107(el: HTMLElement) {
  if (el.offsetParent === null) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || '1') > 0.01;
}

function overflowCount107(doc: Document) {
  const selectors = [
    '.hud-top', '.resource-strip', '.target-card', '.field-quest-tracker', '.field-chain-meter', '.field-minimap', '.combat-log',
    '.joystick', '.potion-dock', '.skill-dock', '.action-dock', '.town-clean-hub-098', '.town-content-panel', '.town-drawer',
    '#sheet', '#townContentPanel', '#itemDetailModal', '.entry-clean-098', '.entry-frame-097'
  ];
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);
  let count = 0;
  for (const selector of selectors) {
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>(selector))) {
      if (!visible107(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const allowWide = selector === '.combat-log' || selector === '#sheet' || selector === '#townContentPanel' || selector === '#itemDetailModal';
      const edge = allowWide ? 8 : 3;
      if (rect.left < -edge || rect.top < -edge || rect.right > vw + edge || rect.bottom > vh + edge) count += 1;
    }
  }
  return count;
}

function domBudget107(doc: Document) {
  const nodes = doc.querySelectorAll('*').length;
  const images = doc.images.length;
  const visiblePanels = Array.from(doc.querySelectorAll<HTMLElement>('.sheet:not(.hidden), .town-drawer:not(.hidden), #itemDetailModal:not(.hidden), .town-more-menu:not(.hidden)')).filter(visible107).length;
  return { nodes, images, visiblePanels };
}

function memoryText107() {
  const memory = (performance as PerformanceMemory107).memory;
  if (!memory) return '메모리 미지원';
  const used = Math.round(memory.usedJSHeapSize / 1048576);
  const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
  return `${used}/${limit}MB`;
}

export function installFinalOptimization107(doc: Document, targets: InstallTargets107) {
  doc.body.classList.add('fantasy-ui-107', 'final-opt-107');
  targets.titleScreen.classList.add('title-screen-107');
  targets.loginScreen.classList.add('login-screen-107');
  targets.townScreen.classList.add('town-screen-107');
  targets.root.classList.add('safe-root-107');
  targets.closeButtons?.forEach((button) => button.classList.add('close-gem-107'));
  applyFinalImagePolicy107(doc);
  syncFinalOptimization107(doc);
  window.addEventListener('resize', () => syncFinalOptimization107(doc), { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(() => syncFinalOptimization107(doc), 120), { passive: true });
}

export function syncFinalOptimization107(doc: Document) {
  const body = doc.body;
  const route = route107(doc);
  const tier = detectFinalTier107();
  body.dataset.finalTier107 = tier;
  body.classList.toggle('route-field-107', route === 'field');
  body.classList.toggle('route-town-107', route === 'town');
  body.classList.toggle('route-title-107', route === 'title');
  body.classList.toggle('route-login-107', route === 'login');
  body.classList.toggle('final-lite-107', tier === 'lite');
  body.classList.toggle('final-balanced-107', tier === 'balanced');
  body.classList.toggle('final-quality-107', tier === 'quality');
  body.classList.toggle('field-lite-107', route === 'field' && tier === 'lite');
  body.classList.toggle('field-compact-107', route === 'field' && (tier !== 'quality' || window.innerWidth <= 430 || window.innerHeight <= 780));
  body.classList.toggle('portrait-compact-107', window.innerWidth <= 430 || window.innerHeight <= 760);
  body.classList.remove('landscape-guard-107');
  const overflow = overflowCount107(doc);
  body.classList.toggle('ui-overflow-107', overflow > 0);
  const root = doc.querySelector<HTMLElement>('#game-root');
  if (root) {
    root.dataset.finalRoute107 = route;
    root.dataset.finalTier107 = tier;
  }
}

export function inspectFinalOptimization107(doc: Document) {
  const tier = detectFinalTier107();
  const route = route107(doc);
  const overflow = overflowCount107(doc);
  const budget = domBudget107(doc);
  const nav = nav107();
  const level: HealthLevel107 = overflow > 0 || budget.nodes > 2600 || (tier === 'lite' && budget.images > 90) ? 'warn' : 'ok';
  const message = overflow > 0 ? `UI 이탈 ${overflow}개` : tier === 'lite' ? '최종 라이트 최적화' : tier === 'balanced' ? '균형 최적화' : '고품질 최적화';
  return {
    level,
    tier,
    route,
    overflow,
    nodes: budget.nodes,
    images: budget.images,
    visiblePanels: budget.visiblePanels,
    message,
    hint: `route ${route} · ${tier} · DOM ${budget.nodes} · img ${budget.images} · mem ${memoryText107()} · core ${nav.hardwareConcurrency || 0}`
  };
}

export function applyFinalImagePolicy107(doc: Document) {
  doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    const isHero = Boolean(img.closest('#titleScreen, .title-screen, .entry-clean-098'));
    if (isHero) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
      img.loading = 'eager';
    } else {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low';
      img.loading = 'lazy';
    }
  });
}
