export type EngineTier105 = 'lite' | 'balanced' | 'quality';
export type EngineRoute105 = 'title' | 'login' | 'town' | 'field';

export type EngineQualityReport105 = {
  tier: EngineTier105;
  route: EngineRoute105;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
  overflowCount: number;
  controlCount: number;
  heavyCssCount: number;
  decodedImages: number;
  imageCount: number;
};

type NavigatorBudget105 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

type EngineRefs105 = {
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  closeButtons?: Array<HTMLElement | null>;
};

let installed105 = false;
let queued105 = false;
let refs105: EngineRefs105 = {};
let lastReport105: EngineQualityReport105 | null = null;

const SAFE_SELECTORS_105 = [
  '.entry-quality-104',
  '.login-panel',
  '.town-clean-hub-098',
  '#townContentPanel:not(.hidden)',
  '#sheet[aria-hidden="false"]',
  '.hud-top',
  '.resource-strip',
  '.target-card',
  '.field-quest-tracker',
  '.field-minimap',
  '.joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock',
  '#itemDetailModal:not(.hidden)'
] as const;

const CONTROL_SELECTORS_105 = [
  'button',
  '[role="button"]',
  '.skill-btn',
  '.dock-btn',
  '.potion-btn',
  '.icon-btn'
] as const;

function storageFlag105(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

function setStorageFlag105(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    // storage may be unavailable in private mode
  }
}

export function detectEngineTier105(): EngineTier105 {
  const nav = navigator as NavigatorBudget105;
  const memory = nav.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  const forcedLite = storageFlag105('soul-online-lite-render-091') || storageFlag105('soul-online-field-lite-100') || storageFlag105('soul-online-perf-lite-101') || storageFlag105('soul-online-engine-lite-105');
  const forcedQuality = storageFlag105('soul-online-perf-quality-101') || storageFlag105('soul-online-engine-quality-105');
  const narrow = window.innerWidth <= 390 || window.innerHeight <= 700;
  if (!forcedQuality && (forcedLite || saveData || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network) || narrow)) return 'lite';
  if (!forcedQuality && (memory <= 4 || cores <= 4 || /3g/.test(network) || window.innerWidth <= 430)) return 'balanced';
  return 'quality';
}

export function detectRoute105(doc: Document = document): EngineRoute105 {
  if (doc.body.classList.contains('field-active')) return 'field';
  if (doc.body.classList.contains('town-active')) return 'town';
  const title = refs105.titleScreen || doc.querySelector<HTMLElement>('#titleScreen');
  const login = refs105.loginScreen || doc.querySelector<HTMLElement>('#loginScreen');
  if (title && !title.classList.contains('hidden')) return 'title';
  if (login && !login.classList.contains('hidden')) return 'login';
  return 'town';
}

export function installEngineQuality105(doc: Document = document, refs: EngineRefs105 = {}) {
  refs105 = refs;
  doc.body.classList.add('fantasy-ui-105', 'engine-quality-105');
  injectPreloads105(doc);
  applyImagePolicy105(doc);
  decorateStaticUi105(doc);
  syncEngineQuality105(doc);
  if (installed105) return;
  installed105 = true;
  const queue = () => queueEngineQuality105(doc);
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(queue, 120), { passive: true });
  window.addEventListener('pageshow', queue, { passive: true });
  window.addEventListener('online', queue, { passive: true });
  window.addEventListener('offline', queue, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!doc.hidden) queue(); });
  doc.addEventListener('pointerdown', queue, { passive: true });
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', queue);
  new MutationObserver(queue).observe(doc.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: false });
  window.setTimeout(queue, 240);
  window.setTimeout(queue, 1100);
}

export function queueEngineQuality105(doc: Document = document) {
  if (queued105) return;
  queued105 = true;
  window.requestAnimationFrame(() => {
    queued105 = false;
    syncEngineQuality105(doc);
  });
}

export function syncEngineQuality105(doc: Document = document) {
  const tier = detectEngineTier105();
  const route = detectRoute105(doc);
  const portrait = window.innerHeight >= window.innerWidth;
  doc.body.dataset.engineTier105 = tier;
  doc.body.dataset.engineRoute105 = route;
  doc.body.classList.toggle('engine-lite-105', tier === 'lite');
  doc.body.classList.toggle('engine-balanced-105', tier === 'balanced');
  doc.body.classList.toggle('engine-quality-tier-105', tier === 'quality');
  doc.body.classList.toggle('route-field-105', route === 'field');
  doc.body.classList.toggle('route-town-105', route === 'town');
  doc.body.classList.toggle('route-title-105', route === 'title');
  doc.body.classList.toggle('route-login-105', route === 'login');
  doc.body.classList.toggle('portrait-ok-105', portrait);
  doc.body.classList.toggle('landscape-block-105', !portrait);
  doc.body.classList.toggle('compact-105', window.innerWidth <= 390 || window.innerHeight <= 700);
  doc.body.classList.toggle('short-105', window.innerHeight <= 650);
  doc.documentElement.style.setProperty('--so-render-scale-105', tier === 'lite' ? '0.72' : tier === 'balanced' ? '0.88' : '1');
  doc.documentElement.style.setProperty('--so-ui-blur-105', tier === 'lite' ? '0px' : tier === 'balanced' ? '3px' : '7px');
  doc.documentElement.style.setProperty('--so-fx-opacity-105', tier === 'lite' ? '0.55' : tier === 'balanced' ? '0.78' : '1');
  setStorageFlag105('soul-online-engine-lite-105', tier === 'lite');
  setStorageFlag105('soul-online-field-lite-100', tier === 'lite');
  decorateStaticUi105(doc);
  applyImagePolicy105(doc);
  lastReport105 = inspectEngineQuality105(doc);
  doc.body.classList.toggle('engine-overflow-105', lastReport105.overflowCount > 0);
  return lastReport105;
}

export function inspectEngineQuality105(doc: Document = document): EngineQualityReport105 {
  const tier = detectEngineTier105();
  const route = detectRoute105(doc);
  const overflowCount = countOverflow105(doc);
  const controlCount = doc.querySelectorAll(CONTROL_SELECTORS_105.join(',')).length;
  const imageCount = doc.images.length;
  const decodedImages = Array.from(doc.images).filter((img) => img.complete && img.naturalWidth > 0).length;
  const heavyCssCount = Array.from(doc.styleSheets).length;
  const level: 'ok' | 'warn' = overflowCount > 0 || (tier !== 'quality' && controlCount > 90) ? 'warn' : 'ok';
  const message = level === 'ok' ? '엔진/화면 안정' : '모바일 예산 주의';
  const hint = `${route} · ${tier} · overflow ${overflowCount} · controls ${controlCount} · img ${decodedImages}/${imageCount}`;
  return { tier, route, level, message, hint, overflowCount, controlCount, heavyCssCount, decodedImages, imageCount };
}

function injectPreloads105(doc: Document) {
  const head = doc.head;
  const assets = [
    '/assets/ui/fantasy/105/panel-parchment-105.webp',
    '/assets/ui/fantasy/105/panel-night-105.webp',
    '/assets/ui/fantasy/105/attack-orb-105.webp',
    '/assets/ui/fantasy/105/skill-orb-105.webp'
  ];
  for (const href of assets) {
    if (head.querySelector(`link[href="${href}"]`)) continue;
    const link = doc.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.type = 'image/webp';
    head.appendChild(link);
  }
}

function decorateStaticUi105(doc: Document) {
  const root = refs105.root || doc.querySelector<HTMLElement>('#game-root');
  root?.classList.add('engine-root-105');
  (refs105.titleScreen || doc.querySelector<HTMLElement>('#titleScreen'))?.classList.add('title-quality-105');
  (refs105.loginScreen || doc.querySelector<HTMLElement>('#loginScreen'))?.classList.add('login-quality-105');
  (refs105.townScreen || doc.querySelector<HTMLElement>('#townScreen'))?.classList.add('town-quality-105');
  doc.querySelectorAll<HTMLElement>('.hud-top, .resource-strip, .target-card, .field-quest-tracker, .field-minimap, .combat-log, .field-chain-meter').forEach((node) => node.classList.add('readable-field-105'));
  doc.querySelectorAll<HTMLElement>('.login-panel, .town-clean-hub-098, #townContentPanel, #sheet, #itemDetailModal').forEach((node) => node.classList.add('readable-panel-105'));
  doc.querySelectorAll<HTMLElement>('.skill-btn').forEach((node) => node.classList.add('skill-btn-105'));
  doc.querySelectorAll<HTMLElement>('.dock-btn, .potion-btn, .wide-action, .town-clean-hunt-098, .town-clean-quick-098 button, .town-clean-bottom-098 button').forEach((node) => node.classList.add('control-art-105'));
  doc.querySelectorAll<HTMLElement>('.icon-btn, #closeSheet, #closeTownContent, #closeItemDetail').forEach((node) => node.classList.add('close-gem-105'));
}

function applyImagePolicy105(doc: Document) {
  const route = detectRoute105(doc);
  const tier = detectEngineTier105();
  Array.from(doc.images).forEach((img) => {
    img.decoding = 'async';
    img.draggable = false;
    if (!img.loading) img.loading = route === 'title' && img.closest('#titleScreen') ? 'eager' : 'lazy';
    img.setAttribute('fetchpriority', img.closest('#titleScreen, .hud-top, .target-card') ? 'high' : tier === 'lite' ? 'low' : 'auto');
  });
}

function countOverflow105(doc: Document) {
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);
  let count = 0;
  for (const selector of SAFE_SELECTORS_105) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (!isVisible105(node)) return;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (rect.left < -2 || rect.top < -2 || rect.right > vw + 2 || rect.bottom > vh + 2) count += 1;
    });
  }
  return count;
}

function isVisible105(node: HTMLElement) {
  if (node.classList.contains('hidden')) return false;
  if (node.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.02;
}
