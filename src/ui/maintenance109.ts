export type Route109 = 'title' | 'login' | 'town' | 'field';
export type Tier109 = 'lite' | 'balanced' | 'quality';
export type MaintenanceLevel109 = 'ok' | 'warn';

export type MaintenanceReport109 = {
  route: Route109;
  tier: Tier109;
  overflowCount: number;
  legacyCount: number;
  activePanels: number;
  nodeCount: number;
  imageCount: number;
  cssSheetCount: number;
  portraitWarning: boolean;
  level: MaintenanceLevel109;
  message: string;
  hint: string;
};

type InstallTargets109 = {
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton?: HTMLElement;
  closeButtons?: HTMLElement[];
};

type NavigatorBudget109 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

const ROUTE_CLASSES_109 = ['route-title-109', 'route-login-109', 'route-town-109', 'route-field-109'];

const LEGACY_SELECTORS_109 = [
  '.town-game-lobby-070',
  '.town-premium-lobby-072',
  '.town-master-lobby-074',
  '.town-layout:not(.town-clean-hub-098)',
  '.town-bottom-menu',
  '.town-topbar',
  '.town-hotspot-layer-060',
  '.town-hotspot-layer-061',
  '.town-hotspot-layer-062',
  '.town-hotspot-layer-063',
  '.town-hotspot-layer-064',
  '.town-hotspot-layer-065',
  '.town-hotspot-layer-066',
  '.town-hotspot-layer-067',
  '.town-hotspot-layer-068',
  '.town-hotspot-layer-069',
  '.town-hotspot-layer-070',
  '.field-hud-shell-100 .field-hud-shell-100',
  '.entry-frame-097 .entry-frame-097',
  '.entry-clean-098 .entry-clean-098'
];

const FIELD_SELECTORS_109 = [
  '.hud-top',
  '.resource-strip',
  '#targetCard',
  '#fieldQuestTracker',
  '#fieldMiniMap',
  '#combatLog',
  '#combatLogToggle',
  '#joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock',
  '.field-chain-meter'
];

const SAFE_SELECTORS_109 = [
  ...FIELD_SELECTORS_109,
  '.town-clean-hub-098',
  '.town-content-panel',
  '#townContentPanel',
  '#sheet',
  '.sheet',
  '#itemDetailModal',
  '.item-detail-modal',
  '.system-doctor-panel',
  '.technical-health-panel',
  '.entry-clean-098',
  '.entry-frame-097',
  '#startGameBtn'
];

let installed109 = false;
let resizeTimer109 = 0;
let observer109: MutationObserver | null = null;
let lastRoute109: Route109 = 'title';
let lastTier109: Tier109 = 'balanced';

function nav109() {
  return navigator as NavigatorBudget109;
}

function flag109(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

function route109(doc: Document): Route109 {
  if (doc.body.classList.contains('field-active') || !doc.querySelector('#game-root')?.classList.contains('hidden')) return 'field';
  if (doc.body.classList.contains('town-active') || !doc.querySelector('#townScreen')?.classList.contains('hidden')) return 'town';
  if (!doc.querySelector('#titleScreen')?.classList.contains('hidden')) return 'title';
  return 'login';
}

export function detectMaintenanceTier109(): Tier109 {
  if (typeof window === 'undefined') return 'balanced';
  const nav = nav109();
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const network = nav.connection?.effectiveType || '';
  const saveData = Boolean(nav.connection?.saveData);
  const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  const shortPortrait = window.innerHeight <= 740 || minSide <= 390;
  const forcedLite = flag109('soul-online-final-lite-107') || flag109('soul-online-lite-atlas-106') || flag109('soul-online-lite-mode-108') || flag109('soul-online-maintenance-lite-109');
  const forcedQuality = flag109('soul-online-quality-mode-108') || flag109('soul-online-final-quality-107') || flag109('soul-online-maintenance-quality-109');
  if (!forcedQuality && (forcedLite || saveData || memory <= 2 || cores <= 2 || /slow-2g|2g/.test(network) || minSide <= 360)) return 'lite';
  if (!forcedQuality && (memory <= 4 || cores <= 4 || /3g/.test(network) || shortPortrait)) return 'balanced';
  return 'quality';
}

function isVisible109(el: Element) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.classList.contains('hidden')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0.01 && el.offsetWidth > 0 && el.offsetHeight > 0;
}

function requestPortraitLock109() {
  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: 'portrait-primary' | 'portrait') => Promise<void> };
    if (orientation?.lock) void orientation.lock('portrait-primary').catch(() => undefined);
  } catch { /* browser may not support orientation lock */ }
}

function applyRoute109(doc: Document) {
  const route = route109(doc);
  lastRoute109 = route;
  doc.body.classList.remove(...ROUTE_CLASSES_109);
  doc.body.classList.add(`route-${route}-109`);
  doc.body.classList.toggle('field-active-109', route === 'field');
  doc.body.classList.toggle('town-active-109', route === 'town');
  doc.body.classList.toggle('entry-active-109', route === 'title' || route === 'login');
  return route;
}

function applyTier109(doc: Document) {
  const tier = detectMaintenanceTier109();
  lastTier109 = tier;
  doc.body.dataset.maintenanceTier109 = tier;
  doc.body.classList.toggle('maintenance-lite-109', tier === 'lite');
  doc.body.classList.toggle('maintenance-balanced-109', tier === 'balanced');
  doc.body.classList.toggle('maintenance-quality-109', tier === 'quality');
  doc.body.classList.toggle('maintenance-compact-109', window.innerWidth <= 430 || window.innerHeight <= 760);
  doc.body.classList.toggle('maintenance-tiny-109', window.innerWidth <= 370 || window.innerHeight <= 680);
  doc.body.classList.toggle('maintenance-landscape-109', window.innerWidth > window.innerHeight);
  doc.documentElement.style.setProperty('--so109-vw', `${window.innerWidth || 0}px`);
  doc.documentElement.style.setProperty('--so109-vh', `${window.innerHeight || 0}px`);
  return tier;
}

function decorate109(doc: Document, targets?: InstallTargets109) {
  FIELD_SELECTORS_109.forEach((selector) => {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => node.classList.add('so109-field-node'));
  });
  doc.querySelector('#targetCard')?.classList.add('so109-monster-card');
  doc.querySelector('#fieldQuestTracker')?.classList.add('so109-quest-card');
  doc.querySelector('#fieldMiniMap')?.classList.add('so109-minimap');
  doc.querySelector('#attackBtn')?.classList.add('so109-attack-orb');
  doc.querySelector('#autoHuntBtn')?.classList.add('so109-menu-orb');
  doc.querySelector('#fieldMenuBtn')?.classList.add('so109-menu-orb');
  doc.querySelector('#inventoryBtn')?.classList.add('so109-menu-orb');
  doc.querySelector('#sleepModeBtn')?.classList.add('so109-menu-orb');
  doc.querySelectorAll('[data-skill-slot], .skill-btn').forEach((node) => node.classList.add('so109-skill-orb'));
  doc.querySelector('#joystick')?.classList.add('so109-joystick');
  targets?.startButton?.classList.add('so109-start-button');
  targets?.closeButtons?.forEach((node) => node.classList.add('so109-close-button'));
  doc.querySelectorAll('.icon-btn[aria-label="닫기"], .sheet-close, #closeSheet, #closeTownContent, #closeItemDetail').forEach((node) => node.classList.add('so109-close-button'));
}

function suppressLegacy109(doc: Document) {
  let visibleLegacy = 0;
  for (const selector of LEGACY_SELECTORS_109) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (isVisible109(node)) visibleLegacy += 1;
      node.setAttribute('data-suppressed-109', 'true');
      node.setAttribute('aria-hidden', 'true');
      node.inert = true;
    });
  }
  return visibleLegacy;
}

function auditOverflow109(doc: Document) {
  const vw = Math.max(1, window.innerWidth || doc.documentElement.clientWidth || 0);
  const vh = Math.max(1, window.innerHeight || doc.documentElement.clientHeight || 0);
  const edge = 3;
  let count = 0;
  for (const selector of SAFE_SELECTORS_109) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (!isVisible109(node)) {
        node.classList.remove('so109-overflow-risk');
        return;
      }
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const wideOverlay = selector === '#sheet' || selector === '.sheet' || selector === '#townContentPanel' || selector === '.town-content-panel' || selector === '#itemDetailModal';
      const margin = wideOverlay ? 10 : edge;
      const overflow = rect.left < -margin || rect.top < -margin || rect.right > vw + margin || rect.bottom > vh + margin;
      node.classList.toggle('so109-overflow-risk', overflow);
      if (overflow) count += 1;
    });
  }
  doc.body.classList.toggle('so109-overflow-risk', count > 0);
  doc.body.classList.toggle('ui-overflow-risk', count > 0);
  return count;
}

function countActivePanels109(doc: Document) {
  const selectors = ['.sheet:not(.hidden)', '#sheet:not(.hidden)', '#townContentPanel:not(.hidden)', '.town-content-panel:not(.hidden)', '#itemDetailModal:not(.hidden)', '.town-more-menu:not(.hidden)', '.exit-modal:not(.hidden)'];
  const nodes = selectors.flatMap((selector) => [...doc.querySelectorAll<HTMLElement>(selector)]);
  return nodes.filter(isVisible109).length;
}

function applyImagePolicy109(doc: Document) {
  doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    const isEntryArt = Boolean(img.closest('#titleScreen, .title-screen-108, .entry-clean-098, .entry-frame-097'));
    const isVisibleHero = isEntryArt && lastRoute109 === 'title';
    img.loading = isVisibleHero ? 'eager' : 'lazy';
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = isVisibleHero ? 'high' : 'low';
  });
}

function syncInternal109(doc: Document, targets?: InstallTargets109) {
  const route = applyRoute109(doc);
  applyTier109(doc);
  suppressLegacy109(doc);
  decorate109(doc, targets);
  const overflow = auditOverflow109(doc);
  applyImagePolicy109(doc);
  doc.body.classList.toggle('field-ui-clean-109', route === 'field' && overflow === 0);
  doc.body.classList.toggle('field-ui-needs-qa-109', route === 'field' && overflow > 0);
}

export function installMaintenance109(doc: Document, targets: InstallTargets109) {
  if (installed109) {
    syncInternal109(doc, targets);
    return;
  }
  installed109 = true;
  doc.body.classList.add('fantasy-ui-109', 'maintenance-109');
  doc.documentElement.classList.add('soul-online-portrait-109');
  targets.root.classList.add('root-maintenance-109');
  targets.titleScreen.classList.add('title-screen-109');
  targets.loginScreen.classList.add('login-screen-109');
  targets.townScreen.classList.add('town-screen-109');
  targets.gameRoot.classList.add('field-root-109');
  requestPortraitLock109();
  syncInternal109(doc, targets);
  const schedule = () => {
    window.clearTimeout(resizeTimer109);
    resizeTimer109 = window.setTimeout(() => syncInternal109(doc, targets), 110);
  };
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', () => {
    requestPortraitLock109();
    schedule();
  }, { passive: true });
  observer109 = new MutationObserver(schedule);
  observer109.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
}

export function syncMaintenance109(doc: Document) {
  if (!installed109) return;
  syncInternal109(doc);
}

export function inspectMaintenance109(doc: Document): MaintenanceReport109 {
  const route = route109(doc);
  const tier = detectMaintenanceTier109();
  const legacyCount = LEGACY_SELECTORS_109.reduce((total, selector) => total + [...doc.querySelectorAll(selector)].filter(isVisible109).length, 0);
  const overflowCount = auditOverflow109(doc);
  const activePanels = countActivePanels109(doc);
  const nodeCount = doc.querySelectorAll('*').length;
  const imageCount = doc.images.length;
  const cssSheetCount = doc.styleSheets.length;
  const portraitWarning = window.innerWidth > window.innerHeight;
  const budgetWarn = nodeCount > 2800 || imageCount > 120 || activePanels > 2;
  const level: MaintenanceLevel109 = overflowCount === 0 && legacyCount === 0 && !portraitWarning && !budgetWarn ? 'ok' : 'warn';
  const message = level === 'ok'
    ? '1.09 품질 유지 정상'
    : overflowCount > 0
      ? `UI 이탈 ${overflowCount}개`
      : legacyCount > 0
        ? `구형 레이어 ${legacyCount}개`
        : portraitWarning
          ? '세로모드 전환 필요'
          : 'DOM/이미지 예산 주의';
  return {
    route,
    tier,
    overflowCount,
    legacyCount,
    activePanels,
    nodeCount,
    imageCount,
    cssSheetCount,
    portraitWarning,
    level,
    message,
    hint: `${route} · ${tier} · overflow ${overflowCount} · legacy ${legacyCount} · panels ${activePanels} · DOM ${nodeCount} · img ${imageCount} · css ${cssSheetCount}`
  };
}
