export type SoulRoute108 = 'title' | 'login' | 'town' | 'field';
export type QualityLevel108 = 'ok' | 'warn';

export type QualityReport108 = {
  route: SoulRoute108;
  tier: 'lite' | 'balanced' | 'quality';
  overflowCount: number;
  decoratedControls: number;
  legacyVisible: number;
  portraitLocked: boolean;
  compact: boolean;
  level: QualityLevel108;
  message: string;
  hint: string;
};

type InstallTargets108 = {
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton?: HTMLElement;
  titleAudioButton?: HTMLElement | null;
  closeButtons?: HTMLElement[];
};

type NavigatorQuality108 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

const ROUTE_CLASSES_108 = ['route-title-108', 'route-login-108', 'route-town-108', 'route-field-108'];
const FIELD_SELECTORS_108 = [
  '.hud-top',
  '.resource-strip',
  '#targetCard',
  '#fieldQuestTracker',
  '#fieldMiniMap',
  '#combatLogToggle',
  '#combatLog',
  '#joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock'
];
const SAFE_AUDIT_SELECTORS_108 = [
  '#targetCard',
  '#fieldQuestTracker',
  '#fieldMiniMap',
  '#joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock',
  '.hud-top',
  '.resource-strip',
  '.town-clean-hub-098',
  '.town-content-panel',
  '.sheet',
  '.item-detail-modal'
];
const LEGACY_LAYER_SELECTORS_108 = [
  '.town-game-lobby-070',
  '.town-premium-lobby-072',
  '.town-master-lobby-074',
  '.town-topbar',
  '.town-layout',
  '.town-bottom-menu',
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
  '.town-hotspot-layer-070'
];

let installed108 = false;
let lastTier108: QualityReport108['tier'] = 'balanced';
let lastRoute108: SoulRoute108 = 'title';
let resizeTimer108 = 0;

function flag108(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

function setFlag108(key: string, value: boolean) {
  try { window.localStorage.setItem(key, value ? '1' : '0'); } catch { /* ignored */ }
}

export function detectMobileQualityTier108(): QualityReport108['tier'] {
  if (typeof window === 'undefined') return 'balanced';
  const nav = navigator as NavigatorQuality108;
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const network = nav.connection?.effectiveType || '';
  const saveData = Boolean(nav.connection?.saveData);
  const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  const shortPortrait = (window.innerHeight || 0) <= 760 || minSide <= 390;
  if (flag108('soul-online-quality-mode-108')) return 'quality';
  if (
    flag108('soul-online-lite-mode-108')
    || flag108('soul-online-final-lite-107')
    || flag108('soul-online-lite-atlas-106')
    || flag108('soul-online-lite-render-091')
    || saveData
    || memory <= 2
    || cores <= 2
    || /slow-2g|2g/.test(network)
    || minSide <= 360
  ) return 'lite';
  if (memory <= 4 || cores <= 4 || /3g/.test(network) || shortPortrait) return 'balanced';
  return 'quality';
}

function route108(doc: Document): SoulRoute108 {
  const body = doc.body;
  if (body.classList.contains('field-active') || !doc.querySelector('#game-root')?.classList.contains('hidden')) return 'field';
  if (body.classList.contains('town-active') || !doc.querySelector('#townScreen')?.classList.contains('hidden')) return 'town';
  if (doc.querySelector('#titleScreen')?.classList.contains('hidden')) return 'login';
  return 'title';
}

function visible108(el: Element) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.classList.contains('hidden')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0.01 && el.offsetWidth > 0 && el.offsetHeight > 0;
}

function applyTierClasses108(doc: Document) {
  const tier = detectMobileQualityTier108();
  lastTier108 = tier;
  doc.body.classList.toggle('soul-lite-108', tier === 'lite');
  doc.body.classList.toggle('soul-balanced-108', tier === 'balanced');
  doc.body.classList.toggle('soul-quality-108', tier === 'quality');
  doc.body.classList.toggle('soul-compact-108', (window.innerWidth || 0) <= 430 || (window.innerHeight || 0) <= 760);
  doc.body.classList.toggle('soul-tiny-108', (window.innerWidth || 0) <= 370 || (window.innerHeight || 0) <= 680);
  doc.documentElement.style.setProperty('--so108-vw', `${window.innerWidth || 0}px`);
  doc.documentElement.style.setProperty('--so108-vh', `${window.innerHeight || 0}px`);
  return tier;
}

function applyRouteClasses108(doc: Document) {
  const route = route108(doc);
  lastRoute108 = route;
  doc.body.classList.remove(...ROUTE_CLASSES_108);
  doc.body.classList.add(`route-${route}-108`);
  doc.body.classList.toggle('field-ui-active-108', route === 'field');
  doc.body.classList.toggle('town-ui-active-108', route === 'town');
  return route;
}

function decorateControls108(doc: Document, targets?: InstallTargets108) {
  const fieldNodes = FIELD_SELECTORS_108.flatMap((selector) => [...doc.querySelectorAll<HTMLElement>(selector)]);
  fieldNodes.forEach((node) => node.classList.add('so108-field-node'));
  doc.querySelector('#targetCard')?.classList.add('so108-monster-card');
  doc.querySelector('#fieldQuestTracker')?.classList.add('so108-quest-card');
  doc.querySelector('#fieldMiniMap')?.classList.add('so108-minimap');
  doc.querySelector('#attackBtn')?.classList.add('so108-attack-orb');
  doc.querySelector('#autoHuntBtn')?.classList.add('so108-menu-orb');
  doc.querySelector('#fieldMenuBtn')?.classList.add('so108-menu-orb');
  doc.querySelector('#inventoryBtn')?.classList.add('so108-menu-orb');
  doc.querySelector('#sleepModeBtn')?.classList.add('so108-menu-orb');
  doc.querySelectorAll('[data-skill-slot]').forEach((node) => node.classList.add('so108-skill-orb'));
  doc.querySelector('#joystick')?.classList.add('so108-joystick');
  doc.querySelectorAll('.icon-btn, .sheet-close, [aria-label="닫기"]').forEach((node) => node.classList.add('so108-close-button'));
  targets?.closeButtons?.forEach((node) => node.classList.add('so108-close-button'));
  targets?.startButton?.classList.add('so108-start-button');
  targets?.titleAudioButton?.classList.add('so108-title-audio');
  doc.querySelectorAll('img').forEach((img) => {
    img.loading = img.loading || 'lazy';
    img.decoding = 'async';
  });
  return fieldNodes.length;
}

function suppressLegacyLayers108(doc: Document) {
  let count = 0;
  for (const selector of LEGACY_LAYER_SELECTORS_108) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (visible108(node)) count += 1;
      node.setAttribute('data-suppressed-108', 'true');
    });
  }
  return count;
}

function auditOverflow108(doc: Document) {
  const margin = 3;
  const width = window.innerWidth || doc.documentElement.clientWidth || 0;
  const height = window.innerHeight || doc.documentElement.clientHeight || 0;
  let count = 0;
  for (const selector of SAFE_AUDIT_SELECTORS_108) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (!visible108(node)) {
        node.classList.remove('so108-overflow-risk');
        return;
      }
      const rect = node.getBoundingClientRect();
      const overflow = rect.left < -margin || rect.top < -margin || rect.right > width + margin || rect.bottom > height + margin;
      node.classList.toggle('so108-overflow-risk', overflow);
      if (overflow) count += 1;
    });
  }
  doc.body.classList.toggle('so108-overflow-risk', count > 0);
  return count;
}

function requestPortraitLock108() {
  // 1.10: orientation lock disabled.
}

function syncInternal108(doc: Document, targets?: InstallTargets108) {
  applyTierClasses108(doc);
  const route = applyRouteClasses108(doc);
  decorateControls108(doc, targets);
  suppressLegacyLayers108(doc);
  const overflow = auditOverflow108(doc);
  doc.body.classList.toggle('so108-field-overflow', route === 'field' && overflow > 0);
  doc.body.classList.remove('so108-portrait-warn');
}

export function installMobileQuality108(doc: Document, targets: InstallTargets108) {
  if (installed108) {
    syncInternal108(doc, targets);
    return;
  }
  installed108 = true;
  doc.body.classList.add('fantasy-ui-108', 'mobile-quality-108');
  doc.documentElement.classList.add('soul-online-portrait-108');
  targets.root.classList.add('root-quality-108');
  targets.titleScreen.classList.add('title-screen-108');
  targets.loginScreen.classList.add('login-screen-108');
  targets.townScreen.classList.add('town-screen-108');
  targets.gameRoot.classList.add('field-root-108');
  syncInternal108(doc, targets);
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer108);
    resizeTimer108 = window.setTimeout(() => syncInternal108(doc, targets), 90);
  }, { passive: true });
  window.addEventListener('orientationchange', () => {
      window.clearTimeout(resizeTimer108);
    resizeTimer108 = window.setTimeout(() => syncInternal108(doc, targets), 120);
  }, { passive: true });
}

export function syncMobileQuality108(doc: Document) {
  if (!installed108) return;
  syncInternal108(doc);
}

export function setMobileQualityMode108(mode: 'auto' | 'lite' | 'quality') {
  if (mode === 'auto') {
    setFlag108('soul-online-lite-mode-108', false);
    setFlag108('soul-online-quality-mode-108', false);
  } else if (mode === 'lite') {
    setFlag108('soul-online-lite-mode-108', true);
    setFlag108('soul-online-quality-mode-108', false);
  } else {
    setFlag108('soul-online-lite-mode-108', false);
    setFlag108('soul-online-quality-mode-108', true);
  }
}

export function inspectMobileQuality108(doc: Document): QualityReport108 {
  const route = route108(doc);
  const tier = detectMobileQualityTier108();
  const overflowCount = auditOverflow108(doc);
  const legacyVisible = LEGACY_LAYER_SELECTORS_108.reduce((total, selector) => total + [...doc.querySelectorAll(selector)].filter(visible108).length, 0);
  const decoratedControls = [...doc.querySelectorAll('.so108-attack-orb, .so108-skill-orb, .so108-menu-orb, .so108-close-button')].length;
  const portraitLocked = doc.body.classList.contains('portrait-lock-103') || doc.documentElement.classList.contains('soul-online-portrait-108');
  const compact = doc.body.classList.contains('soul-compact-108');
  const level: QualityLevel108 = overflowCount === 0 && legacyVisible === 0 ? 'ok' : 'warn';
  return {
    route,
    tier,
    overflowCount,
    decoratedControls,
    legacyVisible,
    portraitLocked,
    compact,
    level,
    message: level === 'ok' ? '1.08 모바일 UI 안정' : `1.08 UI 점검 필요 ${overflowCount + legacyVisible}`,
    hint: `${route} · ${tier} · overflow ${overflowCount} · legacy ${legacyVisible} · decorated ${decoratedControls}`
  };
}
