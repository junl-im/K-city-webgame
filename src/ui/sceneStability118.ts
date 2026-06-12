import { getLockedViewport117 } from './viewportLock117';
import type { HealthLevel } from './technicalHealth';

export type SceneRoute118 = 'title' | 'login' | 'town' | 'field' | 'unknown';

export interface SceneStabilityReport118 {
  level: HealthLevel;
  route: SceneRoute118;
  ghostSurfaceCount: number;
  legacyLayerCount: number;
  collisionCount: number;
  lockSize: string;
  liveSize: string;
  message: string;
  hint: string;
}

type SceneStabilityOptions118 = {
  appShell?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  startButton?: HTMLElement | null;
};

type SurfaceKey118 = 'title' | 'login' | 'town' | 'field';

type Surface118 = {
  key: SurfaceKey118;
  node: HTMLElement | null | undefined;
};

const LEGACY_GHOST_SELECTORS_118 = [
  '.title-character-companion',
  '.title-hero-glow',
  '.title-hero-rune',
  '.title-soul-ring',
  '.title-orb',
  '.town-lobby-pet-070',
  '.orientation-guard',
  '[data-removed-pet116]',
  '[data-single-mode-hidden117="true"]'
];

const LEGACY_MODE_CLASSES_118 = [
  'perf-lite-101', 'perf-quality-101', 'soul-lite-108', 'soul-quality-108',
  'engine-lite-105', 'engine-quality-tier-105', 'final-lite-107', 'final-quality-107',
  'maintenance-lite-109', 'maintenance-quality-109', 'maintenance-lite-113', 'maintenance-quality-113',
  'runtime-lite-112', 'runtime-quality-112', 'field-layout-lite-110', 'field-layout-quality-110',
  'asset-atlas-lite-106', 'asset-atlas-hq-106', 'field-lite-100', 'field-lite-103', 'field-lite-106', 'field-lite-107'
];

const CONTROL_COLLISION_PAIRS_118: Array<[string, string]> = [
  ['.joystick', '.potion-dock'],
  ['.joystick', '.action-dock'],
  ['.joystick', '#returnTownBtn'],
  ['.action-dock', '.potion-dock'],
  ['.action-dock', '.skill-dock'],
  ['.hud-top', '.field-quest-tracker'],
  ['.hud-top', '.target-card'],
  ['.target-card', '.field-quest-tracker']
];

let installed118 = false;
let observer118: MutationObserver | null = null;
let syncTimer118 = 0;
let lastSyncAt118 = 0;
let lastRoute118: SceneRoute118 = 'unknown';

/**
 * Alpha 1.18: 장면이 바뀌는 순간 구형 화면/배경 레이어가 한 프레임 보이는 문제를 막습니다.
 * - 실행 당시 논리 해상도를 유지하되 #app을 현재 브라우저 창 가운데에 고정합니다.
 * - title/login/town/field 중 현재 장면 하나만 표시되도록 고스트 화면을 숨깁니다.
 * - Lite/Quality 구형 class가 다시 붙어도 즉시 제거해 단일 표준 모드를 유지합니다.
 * - 사냥터 컨트롤 충돌을 감지하면 CSS 보정 class를 켭니다.
 */
export function installSceneStability118(root: Document = document, options: SceneStabilityOptions118 = {}) {
  if (!installed118) {
    installed118 = true;
    root.documentElement.classList.add('viewport-frame-root-118');
    root.body.classList.add('scene-stability-118', 'viewport-frame-118', 'standard-only-118');
    normalizeMotionAndViewport118(root);
    syncSceneStability118(root, options);

    const schedule = () => scheduleSync118(root, options, 40);
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    window.visualViewport?.addEventListener('resize', schedule, { passive: true });
    root.addEventListener('visibilitychange', () => syncSceneStability118(root, options));

    observer118 = new MutationObserver(() => scheduleSync118(root, options, 30));
    observer118.observe(root.body, {
      attributes: true,
      attributeFilter: ['class', 'data-runtime-route112', 'data-visual-mode117'],
      childList: true,
      subtree: true
    });

    // 초기 장면 전환 보정은 브라우저가 첫 스타일 계산을 끝낸 뒤 몇 번 더 확인합니다.
    window.setTimeout(() => syncSceneStability118(root, options), 80);
    window.setTimeout(() => syncSceneStability118(root, options), 420);
    window.setTimeout(() => syncSceneStability118(root, options), 1200);
  }
  return inspectSceneStability118(root, options);
}

export function syncSceneStability118(root: Document = document, options: SceneStabilityOptions118 = {}) {
  const now = performance.now();
  if (now - lastSyncAt118 < 14) return inspectSceneStability118(root, options);
  lastSyncAt118 = now;

  root.documentElement.classList.add('viewport-frame-root-118');
  root.body.classList.add('scene-stability-118', 'viewport-frame-118', 'standard-only-118');
  root.body.classList.remove(...LEGACY_MODE_CLASSES_118);
  root.body.dataset.visualMode117 = 'standard';
  root.body.dataset.visualMode118 = 'standard';
  root.body.dataset.runtimeTier112 = 'standard';
  root.body.dataset.engineTier105 = 'standard';
  root.body.dataset.maintenanceTier113 = 'standard';

  const route = detectRoute118(root, options);
  lastRoute118 = route;
  root.body.dataset.sceneRoute118 = route;
  root.body.classList.toggle('scene-title-118', route === 'title');
  root.body.classList.toggle('scene-login-118', route === 'login');
  root.body.classList.toggle('scene-town-118', route === 'town');
  root.body.classList.toggle('scene-field-118', route === 'field');

  applyViewportFrame118(root, options);
  applySurfaceVisibility118(root, options, route);
  hideLegacyGhostLayers118(root);
  normalizeTitleVersion118(root, options);
  const collisions = countControlCollisions118(root, route);
  root.body.classList.toggle('control-collision-118', route === 'field' && collisions > 0);
  root.body.classList.toggle('control-short-118', route === 'field' && readLiveViewport118(root).height <= 690);
  root.body.classList.toggle('control-narrow-118', route === 'field' && readLiveViewport118(root).width <= 370);

  const report = inspectSceneStability118(root, options);
  root.body.classList.toggle('scene-stability-warning-118', report.level !== 'ok');
  return report;
}

export function inspectSceneStability118(root: Document = document, options: SceneStabilityOptions118 = {}): SceneStabilityReport118 {
  const route = detectRoute118(root, options) || lastRoute118;
  const surfaces = getSurfaces118(root, options);
  const activeKey = surfaceKeyForRoute118(route);
  let ghostSurfaceCount = 0;
  for (const surface of surfaces) {
    if (!surface.node || surface.key === activeKey) continue;
    if (isVisible118(surface.node)) ghostSurfaceCount += 1;
  }
  const legacyLayerCount = LEGACY_GHOST_SELECTORS_118.reduce((total, selector) => {
    return total + Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(isVisible118).length;
  }, 0);
  const collisionCount = countControlCollisions118(root, route);
  const lock = getLockedViewport117(root);
  const live = readLiveViewport118(root);
  const level: HealthLevel = ghostSurfaceCount > 0 || legacyLayerCount > 0 || collisionCount > 0 ? 'warn' : 'ok';
  const message = level === 'ok'
    ? '장면/레이어 안정화 정상'
    : `고스트/충돌 보정 ${ghostSurfaceCount + legacyLayerCount + collisionCount}건`;
  const lockSize = `${lock.width}x${lock.height}`;
  const liveSize = `${Math.round(live.width)}x${Math.round(live.height)}`;
  const hint = `route ${route} · ghost ${ghostSurfaceCount} · legacy ${legacyLayerCount} · collision ${collisionCount} · fixed ${lockSize}`;
  return { level, route, ghostSurfaceCount, legacyLayerCount, collisionCount, lockSize, liveSize, message, hint };
}

function scheduleSync118(root: Document, options: SceneStabilityOptions118, delay: number) {
  window.clearTimeout(syncTimer118);
  syncTimer118 = window.setTimeout(() => syncSceneStability118(root, options), delay);
}

function detectRoute118(root: Document, options: SceneStabilityOptions118): SceneRoute118 {
  if (root.body.classList.contains('field-active')) return 'field';
  if (root.body.classList.contains('town-active')) return 'town';
  if (options.titleScreen && !options.titleScreen.classList.contains('hidden')) return 'title';
  if (options.loginScreen && !options.loginScreen.classList.contains('hidden')) return 'login';
  const title = options.titleScreen || root.querySelector<HTMLElement>('#titleScreen');
  const login = options.loginScreen || root.querySelector<HTMLElement>('#loginScreen');
  const town = options.townScreen || root.querySelector<HTMLElement>('#townScreen');
  if (title && !title.classList.contains('hidden')) return 'title';
  if (login && !login.classList.contains('hidden')) return 'login';
  if (town && !town.classList.contains('hidden')) return 'town';
  return lastRoute118 === 'unknown' ? 'title' : lastRoute118;
}

function surfaceKeyForRoute118(route: SceneRoute118): SurfaceKey118 | null {
  if (route === 'title' || route === 'login' || route === 'town' || route === 'field') return route;
  return null;
}

function getSurfaces118(root: Document, options: SceneStabilityOptions118): Surface118[] {
  return [
    { key: 'title', node: options.titleScreen || root.querySelector<HTMLElement>('#titleScreen') },
    { key: 'login', node: options.loginScreen || root.querySelector<HTMLElement>('#loginScreen') },
    { key: 'town', node: options.townScreen || root.querySelector<HTMLElement>('#townScreen') },
    { key: 'field', node: options.gameRoot || root.querySelector<HTMLElement>('#game-root') }
  ];
}

function applySurfaceVisibility118(root: Document, options: SceneStabilityOptions118, route: SceneRoute118) {
  const activeKey = surfaceKeyForRoute118(route);
  for (const surface of getSurfaces118(root, options)) {
    const node = surface.node;
    if (!node) continue;
    const active = activeKey === surface.key;
    node.toggleAttribute('data-scene-active118', active);
    node.toggleAttribute('data-scene-hidden118', !active);
    node.setAttribute('aria-hidden', active ? 'false' : 'true');
    if (active) node.removeAttribute('inert');
    else node.setAttribute('inert', '');
  }
}

function hideLegacyGhostLayers118(root: Document) {
  root.querySelectorAll<HTMLElement>(LEGACY_GHOST_SELECTORS_118.join(',')).forEach((node) => {
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('tabindex', '-1');
    node.dataset.sceneHidden118 = 'legacy';
  });

  // title-bg/title-hero처럼 번호가 많이 누적된 class는 CSS 우선순위 싸움을 일으키므로 기준 class만 남깁니다.
  stripNumberedClasses118(root.querySelector<HTMLElement>('#titleScreen .title-bg'), ['title-bg-'], ['title-bg', 'title-bg-visual', 'single-layer-117']);
  stripNumberedClasses118(root.querySelector<HTMLElement>('#titleScreen .title-hero'), ['title-hero-'], ['title-hero', 'single-layer-117']);
  stripNumberedClasses118(root.querySelector<HTMLElement>('#titleScreen .title-character'), ['title-character-'], ['title-character', 'title-character-visual', 'single-layer-117']);
}

function stripNumberedClasses118(element: HTMLElement | null, prefixes: string[], keep: string[]) {
  if (!element) return;
  const keepSet = new Set(keep);
  const next = Array.from(element.classList).filter((className) => {
    if (keepSet.has(className)) return true;
    return !prefixes.some((prefix) => new RegExp(`^${escapeRegExp118(prefix)}\\d+$`).test(className));
  });
  element.className = Array.from(new Set(next)).join(' ');
  element.classList.add('single-layer-118');
}

function applyViewportFrame118(root: Document, options: SceneStabilityOptions118) {
  const lock = getLockedViewport117(root);
  const live = readLiveViewport118(root);
  root.documentElement.style.setProperty('--so118-lock-w', `${lock.width}px`);
  root.documentElement.style.setProperty('--so118-lock-h', `${lock.height}px`);
  root.documentElement.style.setProperty('--so118-live-w', `${Math.round(live.width)}px`);
  root.documentElement.style.setProperty('--so118-live-h', `${Math.round(live.height)}px`);
  root.documentElement.style.setProperty('--so118-frame-left', `${Math.round(live.width / 2)}px`);
  root.documentElement.style.setProperty('--so118-frame-top', `${Math.round(live.height / 2)}px`);

  const app = options.appShell || root.querySelector<HTMLElement>('#app');
  app?.style.setProperty('--so118-lock-w', `${lock.width}px`);
  app?.style.setProperty('--so118-lock-h', `${lock.height}px`);
}

function readLiveViewport118(root: Document) {
  const vv = window.visualViewport;
  return {
    width: vv?.width || window.innerWidth || root.documentElement.clientWidth || 360,
    height: vv?.height || window.innerHeight || root.documentElement.clientHeight || 740
  };
}

function countControlCollisions118(root: Document, route: SceneRoute118) {
  if (route !== 'field') return 0;
  return CONTROL_COLLISION_PAIRS_118.reduce((count, [a, b]) => {
    return count + (overlap118(root.querySelector<HTMLElement>(a), root.querySelector<HTMLElement>(b)) ? 1 : 0);
  }, 0);
}

function normalizeTitleVersion118(root: Document, options: SceneStabilityOptions118) {
  const version = root.querySelector<HTMLElement>('.title-mini-nav span:last-child');
  if (version) version.textContent = 'v1.18.0';
  const start = options.startButton || root.querySelector<HTMLElement>('#startGameBtn');
  if (start) {
    start.dataset.sceneStable118 = 'start';
    start.setAttribute('aria-label', '소울 온라인 시작');
  }
}

function normalizeMotionAndViewport118(root: Document) {
  setMeta118(root, 'viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  setMeta118(root, 'screen-orientation', 'any');
  setMeta118(root, 'x5-orientation', 'auto');
  setMeta118(root, 'x5-fullscreen', 'false');
  setMeta118(root, 'full-screen', 'no');
}

function setMeta118(root: Document, name: string, content: string) {
  let meta = root.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = root.createElement('meta');
    meta.name = name;
    root.head.appendChild(meta);
  }
  meta.content = content;
}

function isVisible118(element: HTMLElement | null): element is HTMLElement {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && Number(style.opacity || 1) > 0.01
    && rect.width > 2
    && rect.height > 2;
}

function overlap118(a: HTMLElement | null, b: HTMLElement | null) {
  if (!isVisible118(a) || !isVisible118(b)) return false;
  const ar = a.getBoundingClientRect();
  const br = b.getBoundingClientRect();
  const pad = 4;
  return ar.left < br.right - pad && ar.right > br.left + pad && ar.top < br.bottom - pad && ar.bottom > br.top + pad;
}

function escapeRegExp118(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
