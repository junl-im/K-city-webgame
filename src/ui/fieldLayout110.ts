export type FieldLayoutTier110 = 'lite' | 'balanced' | 'quality';
export type FieldLayoutReport110 = {
  tier: FieldLayoutTier110;
  route: 'title' | 'login' | 'town' | 'field';
  overflowCount: number;
  overlapCount: number;
  minimapHidden: boolean;
  profileReady: boolean;
  message: string;
  level: 'ok' | 'warn';
  hint: string;
};

type InstallTargets110 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton?: HTMLElement;
  closeButtons?: HTMLElement[];
};

type NavigatorBudget110 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

const ROUTE_CLASSES_110 = ['route-title-110', 'route-login-110', 'route-town-110', 'route-field-110'];
const FIELD_NODES_110 = [
  '.hud-top',
  '#targetCard',
  '#fieldQuestTracker',
  '#fieldChainMeter',
  '#combatLog',
  '#combatLogToggle',
  '#joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock',
  '#attackBtn',
  '#autoHuntBtn',
  '#fieldMenuBtn',
  '#inventoryBtn',
  '#sleepModeBtn',
  '[data-skill-slot]'
];
const SAFE_NODES_110 = [
  '.hud-top',
  '#targetCard',
  '#fieldQuestTracker',
  '#joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock',
  '#attackBtn',
  '#autoHuntBtn',
  '#fieldMenuBtn',
  '#inventoryBtn',
  '#sleepModeBtn',
  '.sheet:not(.hidden)',
  '#townContentPanel:not(.hidden)',
  '.item-detail-card'
];
const OVERLAP_NODES_110 = ['#attackBtn', '#autoHuntBtn', '#fieldMenuBtn', '#inventoryBtn', '#sleepModeBtn', '.skill-btn', '.potion-btn', '#joystick', '#targetCard', '#fieldQuestTracker'];
const LEGACY_TOWN_110 = [
  '.town-game-lobby-070',
  '.town-premium-lobby-072',
  '.town-master-lobby-074',
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
  '.town-bottom-menu',
  '.town-topbar'
];

let installed110 = false;
let timer110 = 0;
let observer110: MutationObserver | null = null;

function nav110() {
  return navigator as NavigatorBudget110;
}

function flag110(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

export function detectFieldLayoutTier110(): FieldLayoutTier110 {
  if (typeof window === 'undefined') return 'balanced';
  const nav = nav110();
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const network = nav.connection?.effectiveType || '';
  const saveData = Boolean(nav.connection?.saveData);
  const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  if (flag110('soul-online-quality-mode-110')) return 'quality';
  if (flag110('soul-online-lite-mode-110') || saveData || memory <= 2 || cores <= 2 || /slow-2g|2g/.test(network) || minSide <= 360) return 'lite';
  if (memory <= 4 || cores <= 4 || /3g/.test(network) || minSide <= 430) return 'balanced';
  return 'quality';
}

function visible110(node: Element) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.classList.contains('hidden')) return false;
  if (node.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0.01 && node.offsetWidth > 0 && node.offsetHeight > 0;
}

function route110(doc: Document): FieldLayoutReport110['route'] {
  if (doc.body.classList.contains('field-active') || !doc.querySelector('#game-root')?.classList.contains('hidden')) return 'field';
  if (doc.body.classList.contains('town-active') || !doc.querySelector('#townScreen')?.classList.contains('hidden')) return 'town';
  if (!doc.querySelector('#titleScreen')?.classList.contains('hidden')) return 'title';
  return 'login';
}

function requestPortraitLock110() {
  // 1.10: orientation is adaptive. Never call screen.orientation.lock().
}

function applyRouteAndTier110(doc: Document) {
  const route = route110(doc);
  const tier = detectFieldLayoutTier110();
  doc.body.classList.remove(...ROUTE_CLASSES_110);
  doc.body.classList.add(`route-${route}-110`);
  doc.body.dataset.fieldLayoutTier110 = tier;
  doc.body.classList.toggle('field-layout-lite-110', tier === 'lite');
  doc.body.classList.toggle('field-layout-balanced-110', tier === 'balanced');
  doc.body.classList.toggle('field-layout-quality-110', tier === 'quality');
  doc.body.classList.toggle('field-compact-110', (window.innerWidth || 0) <= 430 || (window.innerHeight || 0) <= 760);
  doc.body.classList.toggle('field-tiny-110', (window.innerWidth || 0) <= 370 || (window.innerHeight || 0) <= 680);
  doc.body.classList.toggle('field-landscape-110', (window.innerWidth || 0) > (window.innerHeight || 0));
  doc.documentElement.style.setProperty('--so110-vw', `${window.innerWidth || 0}px`);
  doc.documentElement.style.setProperty('--so110-vh', `${window.innerHeight || 0}px`);
  return { route, tier };
}

function decorate110(doc: Document, targets?: InstallTargets110) {
  FIELD_NODES_110.forEach((selector) => doc.querySelectorAll<HTMLElement>(selector).forEach((node) => node.classList.add('so110-field-node')));
  doc.querySelector('#targetCard')?.classList.add('so110-target-center');
  doc.querySelector('#fieldQuestTracker')?.classList.add('so110-quest-left');
  doc.querySelector('#joystick')?.classList.add('so110-joystick');
  doc.querySelector('.skill-dock')?.classList.add('so110-skill-stack');
  doc.querySelector('.action-dock')?.classList.add('so110-action-grid');
  doc.querySelector('.potion-dock')?.classList.add('so110-potion-bar');
  doc.querySelector('#classPortrait')?.classList.add('so110-profile-ready');
  doc.querySelector('#fieldMiniMap')?.setAttribute('aria-hidden', 'true');
  doc.querySelector('#fieldMiniMap')?.classList.add('so110-minimap-removed');
  doc.querySelector('.resource-strip')?.setAttribute('aria-hidden', 'true');
  doc.querySelector('.resource-strip')?.classList.add('so110-resource-removed');
  targets?.titleScreen.classList.add('title-screen-110');
  targets?.loginScreen.classList.add('login-screen-110');
  targets?.townScreen.classList.add('town-screen-110');
  targets?.gameRoot.classList.add('game-root-110');
  targets?.startButton?.classList.add('start-game-btn-110');
  targets?.closeButtons?.forEach((button) => button.classList.add('close-btn-110'));
  doc.querySelectorAll('.icon-btn[aria-label="닫기"], #closeSheet, #closeTownContent, #closeItemDetail').forEach((node) => node.classList.add('close-btn-110'));
  doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => { img.decoding = 'async'; if (!img.loading) img.loading = 'lazy'; });
}

function suppressLegacy110(doc: Document) {
  for (const selector of LEGACY_TOWN_110) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      node.dataset.suppressed110 = 'true';
      node.setAttribute('aria-hidden', 'true');
      node.inert = true;
    });
  }
}

function auditOverflow110(doc: Document) {
  const vw = Math.max(1, window.innerWidth || doc.documentElement.clientWidth || 0);
  const vh = Math.max(1, window.innerHeight || doc.documentElement.clientHeight || 0);
  let count = 0;
  SAFE_NODES_110.forEach((selector) => {
    doc.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (!visible110(node)) { node.classList.remove('so110-overflow-risk'); return; }
      const rect = node.getBoundingClientRect();
      const overflow = rect.left < -4 || rect.top < -4 || rect.right > vw + 4 || rect.bottom > vh + 4;
      node.classList.toggle('so110-overflow-risk', overflow);
      if (overflow) count += 1;
    });
  });
  doc.body.classList.toggle('so110-overflow-risk', count > 0);
  return count;
}

function rectsOverlap110(a: DOMRect, b: DOMRect) {
  const pad = 4;
  return a.left < b.right - pad && a.right > b.left + pad && a.top < b.bottom - pad && a.bottom > b.top + pad;
}

function auditOverlap110(doc: Document) {
  const nodes = OVERLAP_NODES_110.flatMap((selector) => [...doc.querySelectorAll<HTMLElement>(selector)]).filter(visible110);
  const pairs = new Set<string>();
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i];
    const ar = a.getBoundingClientRect();
    if (ar.width <= 0 || ar.height <= 0) continue;
    for (let j = i + 1; j < nodes.length; j += 1) {
      const b = nodes[j];
      const br = b.getBoundingClientRect();
      if (br.width <= 0 || br.height <= 0) continue;
      const skip = (a.closest('.action-dock') && b.closest('.action-dock')) || (a.closest('.skill-dock') && b.closest('.skill-dock')) || (a.closest('.potion-dock') && b.closest('.potion-dock'));
      if (skip) continue;
      if (rectsOverlap110(ar, br)) {
        a.classList.add('so110-overlap-risk');
        b.classList.add('so110-overlap-risk');
        pairs.add(`${i}-${j}`);
      }
    }
  }
  if (!pairs.size) doc.querySelectorAll('.so110-overlap-risk').forEach((node) => node.classList.remove('so110-overlap-risk'));
  doc.body.classList.toggle('so110-overlap-risk', pairs.size > 0);
  return pairs.size;
}

function syncInternal110(doc: Document, targets?: InstallTargets110) {
  applyRouteAndTier110(doc);
  suppressLegacy110(doc);
  decorate110(doc, targets);
  auditOverflow110(doc);
  auditOverlap110(doc);
}

export function installFieldLayout110(doc: Document, targets: InstallTargets110) {
  if (installed110) { syncInternal110(doc, targets); return; }
  installed110 = true;
  doc.body.classList.add('fantasy-ui-110', 'field-layout-110');
  doc.documentElement.classList.add('soul-online-portrait-110');
  syncInternal110(doc, targets);
  const schedule = () => {
    window.clearTimeout(timer110);
    timer110 = window.setTimeout(() => syncInternal110(doc, targets), 90);
  };
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  observer110 = new MutationObserver(schedule);
  observer110.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
}

export function syncFieldLayout110(doc: Document) {
  if (!installed110) return;
  syncInternal110(doc);
}

export function inspectFieldLayout110(doc: Document): FieldLayoutReport110 {
  const { route, tier } = applyRouteAndTier110(doc);
  const overflowCount = auditOverflow110(doc);
  const overlapCount = auditOverlap110(doc);
  const minimapHidden = !visible110(doc.querySelector('#fieldMiniMap') || doc.createElement('i'));
  const profile = doc.querySelector('#classPortrait');
  const profileReady = Boolean(profile && window.getComputedStyle(profile).backgroundImage !== 'none');
  const level: FieldLayoutReport110['level'] = overflowCount === 0 && overlapCount === 0 && minimapHidden && profileReady ? 'ok' : 'warn';
  const message = level === 'ok' ? '1.10 필드 UI 정렬 정상' : overflowCount > 0 ? `화면 이탈 ${overflowCount}개` : overlapCount > 0 ? `UI 겹침 ${overlapCount}쌍` : !minimapHidden ? '미니맵 제거 필요' : '프로필 이미지 확인 필요';
  return { tier, route, overflowCount, overlapCount, minimapHidden, profileReady, message, level, hint: `${route} · ${tier} · overflow ${overflowCount} · overlap ${overlapCount} · minimap ${minimapHidden ? 'off' : 'on'} · profile ${profileReady ? 'ready' : 'empty'}` };
}
