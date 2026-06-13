export type ResilienceRoute133 = 'title' | 'login' | 'town' | 'field';
export type ResilienceLevel133 = 'ok' | 'warn' | 'danger';

export type ResilienceTargets133 = {
  appShell?: HTMLElement | null;
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

export type ResilienceCloudStatus133 = {
  paused?: boolean;
  queued?: boolean;
  nextWriteMs?: number;
  lastError?: string;
  writes?: number;
  reads?: number;
  readCacheHits?: number;
  mode?: string;
};

export type ResilienceReport133 = {
  level: ResilienceLevel133;
  message: string;
  hint: string;
  route: ResilienceRoute133;
  problems: string[];
};

type SoulWindow133 = Window & {
  __soulResilience133?: {
    installedAt: number;
    route: ResilienceRoute133;
    backupWrites: number;
    duplicateCanvasPruned: number;
    swMessages: number;
    lastRouteSyncAt: number;
    lastNetworkOnline: boolean;
    lastError: string;
    lastReport?: ResilienceReport133;
  };
};

const ROSTER_KEY_133 = 'sol-online-alpha-roster-v1';
const LEGACY_SAVE_KEY_133 = 'sol-online-alpha-save-v1';
const ROSTER_BACKUP_KEY_133 = 'sol-online-alpha-roster-v1-backup-133';
const LEGACY_BACKUP_KEY_133 = 'sol-online-alpha-save-v1-backup-133';
const ROUTE_CLASSES_133 = ['route-title-133', 'route-login-133', 'route-town-133', 'route-field-133'];
const VISUAL_DOWNGRADE_CLASSES_133 = [
  'lite-render-091',
  'lite-render-098',
  'art-lite-099',
  'field-lite-100',
  'perf-lite-101',
  'asset-lite-102',
  'field-lite-103',
  'quality-lite-104',
  'engine-lite-105',
  'asset-atlas-lite-106',
  'field-lite-106',
  'final-lite-107',
  'soul-lite-108',
  'maintenance-lite-109',
  'field-layout-lite-110',
  'runtime-lite-112',
  'maintenance-lite-113',
  'asset-delivery-lite-115',
  'viewport-lock-117',
  'single-visual-117',
  'scene-stability-118'
];
const STALE_STORAGE_FLAGS_133 = [
  'soul-online-force-lite-106',
  'soul-online-atlas-mode-106',
  'soul-online-render-tier-112',
  'soul-online-use-lite-atlas-115',
  'soul-online-force-high-atlas-115',
  'soul-online-allow-legacy-css'
];

let installed133 = false;
let observer133: MutationObserver | null = null;
let sweepTimer133 = 0;
let lastReport133: ResilienceReport133 = {
  level: 'warn',
  message: '1.33 복구 커널 대기',
  hint: '설치 전',
  route: 'title',
  problems: ['설치 전']
};

export function installResiliencePlan133(documentRef: Document, targets: ResilienceTargets133 = {}) {
  const win = documentRef.defaultView as SoulWindow133 | null;
  if (!win) return inspectResiliencePlan133(documentRef, targets);
  if (installed133) {
    syncResilienceRoute133(documentRef, inferRoute133(documentRef), targets);
    return inspectResiliencePlan133(documentRef, targets);
  }

  installed133 = true;
  win.__soulResilience133 = {
    installedAt: performance.now(),
    route: inferRoute133(documentRef),
    backupWrites: 0,
    duplicateCanvasPruned: 0,
    swMessages: 0,
    lastRouteSyncAt: 0,
    lastNetworkOnline: navigator.onLine,
    lastError: ''
  };

  documentRef.documentElement.classList.add('soul-resilience-133');
  documentRef.body.classList.add('fantasy-ui-133', 'resilience-plan-133', 'visual-quality-preserved-133', 'firebase-freeplan-safe-133');
  documentRef.body.dataset.alphaVersion = '1.39.0';
  documentRef.body.dataset.visualPolicy133 = 'high-fidelity-preserved';

  purgeStaleStorageFlags133();
  removeVisualDowngradeState133(documentRef);
  mirrorLocalSave133(documentRef);
  hardenLoginFallback133(documentRef);
  requestServiceWorkerCleanup133(win);

  observer133 = new MutationObserver(() => scheduleSweep133(documentRef, targets, 90));
  observer133.observe(documentRef.body, { attributes: true, attributeFilter: ['class', 'data-route-129', 'data-route-130', 'data-route-133'] });

  const sweep = () => scheduleSweep133(documentRef, targets, 80);
  win.addEventListener('online', sweep, { passive: true });
  win.addEventListener('offline', sweep, { passive: true });
  win.addEventListener('pageshow', sweep, { passive: true });
  win.addEventListener('visibilitychange', () => {
    mirrorLocalSave133(documentRef);
    sweep();
  }, { passive: true });
  win.addEventListener('pagehide', () => mirrorLocalSave133(documentRef), { passive: true });
  win.addEventListener('beforeunload', () => mirrorLocalSave133(documentRef), { passive: true });
  win.addEventListener('error', (event) => {
    if (win.__soulResilience133) win.__soulResilience133.lastError = event.message || 'runtime error';
    documentRef.body.classList.add('runtime-error-recovered-133');
    sweep();
  });
  win.addEventListener('unhandledrejection', (event) => {
    if (win.__soulResilience133) win.__soulResilience133.lastError = event.reason instanceof Error ? event.reason.message : String(event.reason || 'promise rejection');
    documentRef.body.classList.add('runtime-error-recovered-133');
    sweep();
  });

  syncResilienceRoute133(documentRef, inferRoute133(documentRef), targets);
  win.setTimeout(() => syncResilienceRoute133(documentRef, inferRoute133(documentRef), targets), 900);
  return inspectResiliencePlan133(documentRef, targets);
}

export function syncResilienceRoute133(documentRef: Document, route: ResilienceRoute133 | string, targets: ResilienceTargets133 = {}) {
  const normalized = normalizeRoute133(route);
  const win = documentRef.defaultView as SoulWindow133 | null;
  if (!win) return;
  if (!win.__soulResilience133) {
    win.__soulResilience133 = {
      installedAt: performance.now(),
      route: normalized,
      backupWrites: 0,
      duplicateCanvasPruned: 0,
      swMessages: 0,
      lastRouteSyncAt: 0,
      lastNetworkOnline: navigator.onLine,
      lastError: ''
    };
  }

  documentRef.body.dataset.route133 = normalized;
  documentRef.body.classList.remove(...ROUTE_CLASSES_133);
  documentRef.body.classList.add(`route-${normalized}-133`);
  documentRef.body.classList.toggle('network-offline-133', !navigator.onLine);
  documentRef.body.classList.toggle('network-online-133', navigator.onLine);

  removeVisualDowngradeState133(documentRef);
  hardenLoginFallback133(documentRef);
  pruneDuplicateCanvas133(documentRef, targets);
  applySceneHints133(documentRef, normalized, targets);

  win.__soulResilience133.route = normalized;
  win.__soulResilience133.lastRouteSyncAt = performance.now();
  win.__soulResilience133.lastNetworkOnline = navigator.onLine;
  win.__soulResilience133.lastReport = inspectResiliencePlan133(documentRef, targets);
}

export function inspectResiliencePlan133(documentRef: Document, targets: ResilienceTargets133 = {}, cloudStatus?: ResilienceCloudStatus133): ResilienceReport133 {
  const win = documentRef.defaultView as SoulWindow133 | null;
  const state = win?.__soulResilience133;
  const route = normalizeRoute133(state?.route || inferRoute133(documentRef));
  const problems: string[] = [];
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const start = targets.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  const local = documentRef.querySelector<HTMLButtonElement>('#localLoginBtn');
  const root = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  const canvasCount = root?.querySelectorAll('canvas').length || 0;
  const staleClasses = VISUAL_DOWNGRADE_CLASSES_133.filter((className) => documentRef.body.classList.contains(className));
  const routeScenes = visibleScenes133(documentRef, targets);
  const titleBackgroundOk = title ? (getComputedStyle(title).backgroundImage.includes('title-keyvisual-060') || Boolean(documentRef.querySelector('link[href*="title-keyvisual-060"]'))) : false;

  if (!title) problems.push('타이틀 DOM 없음');
  if (!login) problems.push('로그인 DOM 없음');
  if (!start || start.disabled) problems.push('START 버튼 대기');
  if (route === 'login' && (!local || local.disabled)) problems.push('로컬 접속 버튼 대기');
  if (canvasCount > 1) problems.push(`중복 canvas ${canvasCount}`);
  if (routeScenes.length > 1) problems.push(`동시 장면 ${routeScenes.join('/')}`);
  if (staleClasses.length) problems.push(`화질저하 class ${staleClasses.length}`);
  if (route === 'title' && !titleBackgroundOk) problems.push('시작 키비주얼 확인 필요');
  if (cloudStatus?.paused) problems.push('클라우드 쓰기 보류');
  if (cloudStatus?.lastError) problems.push(`최근 클라우드 ${cloudStatus.lastError}`);

  const backupInfo = state ? `backup ${state.backupWrites}` : 'backup 대기';
  const swInfo = state ? `sw ${state.swMessages}` : 'sw 대기';
  const cloudInfo = cloudStatus
    ? `${cloudStatus.mode || 'local-first'} · write ${cloudStatus.writes || 0} · read ${cloudStatus.reads || 0}/${cloudStatus.readCacheHits || 0}`
    : 'cloud 상태 대기';
  const networkInfo = navigator.onLine ? 'online' : 'offline local';
  const level: ResilienceLevel133 = problems.some((problem) => /DOM 없음|START|로컬 접속/.test(problem)) ? 'danger' : problems.length ? 'warn' : 'ok';
  const report: ResilienceReport133 = {
    level,
    message: problems.length ? '대안책 보정 작동' : '대안책 정상 대기',
    hint: `${networkInfo} · ${backupInfo} · ${swInfo} · ${cloudInfo}${problems.length ? ` · ${problems.join(' · ')}` : ''}`,
    route,
    problems
  };
  lastReport133 = report;
  if (state) state.lastReport = report;
  return report;
}

export function lastResilienceReport133() {
  return lastReport133;
}

function normalizeRoute133(route: string): ResilienceRoute133 {
  if (route === 'login' || route === 'town' || route === 'field') return route;
  return 'title';
}

function inferRoute133(documentRef: Document): ResilienceRoute133 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.dataset.route129 === 'field' || body.dataset.route130 === 'field') return 'field';
  if (body.classList.contains('town-active') || body.dataset.route129 === 'town' || body.dataset.route130 === 'town') return 'town';
  const login = documentRef.querySelector<HTMLElement>('#loginScreen');
  if (login && !login.classList.contains('hidden') && login.getAttribute('aria-hidden') !== 'true') return 'login';
  return 'title';
}

function scheduleSweep133(documentRef: Document, targets: ResilienceTargets133, delay: number) {
  const win = documentRef.defaultView as SoulWindow133 | null;
  if (!win) return;
  if (sweepTimer133) win.clearTimeout(sweepTimer133);
  sweepTimer133 = win.setTimeout(() => {
    sweepTimer133 = 0;
    syncResilienceRoute133(documentRef, inferRoute133(documentRef), targets);
  }, delay);
}

function removeVisualDowngradeState133(documentRef: Document) {
  documentRef.body.classList.remove(...VISUAL_DOWNGRADE_CLASSES_133);
  documentRef.documentElement.classList.remove(...VISUAL_DOWNGRADE_CLASSES_133);
  documentRef.body.classList.add('standard-2p5d-133', 'visual-quality-preserved-133');
}

function purgeStaleStorageFlags133() {
  for (const key of STALE_STORAGE_FLAGS_133) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}

function mirrorLocalSave133(documentRef: Document) {
  const win = documentRef.defaultView as SoulWindow133 | null;
  try {
    const roster = localStorage.getItem(ROSTER_KEY_133);
    if (roster) localStorage.setItem(ROSTER_BACKUP_KEY_133, roster);
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY_133);
    if (legacy) localStorage.setItem(LEGACY_BACKUP_KEY_133, legacy);
    if ((roster || legacy) && win?.__soulResilience133) win.__soulResilience133.backupWrites += 1;
  } catch (error) {
    if (win?.__soulResilience133) win.__soulResilience133.lastError = error instanceof Error ? error.message : 'local backup failed';
  }
}

function hardenLoginFallback133(documentRef: Document) {
  const buttons = documentRef.querySelectorAll<HTMLButtonElement>('#startGameBtn,#guestLoginBtn,#localLoginBtn,#serverNextBtn,#characterNextBtn,#connectCharacterBtn,#newCharacterBtn');
  buttons.forEach((button) => {
    button.disabled = false;
    button.removeAttribute('aria-disabled');
    button.style.touchAction = 'manipulation';
  });
  const status = documentRef.querySelector<HTMLElement>('#loginStatus');
  if (status && !navigator.onLine) status.textContent = '오프라인 상태입니다. 로컬 저장으로 먼저 접속할 수 있습니다.';
}

function requestServiceWorkerCleanup133(win: SoulWindow133) {
  const controller = win.navigator.serviceWorker?.controller;
  if (!controller) return;
  try {
    controller.postMessage({ type: 'SOUL_CLEAR_OLD_CACHES', source: 'resilience-133' });
    if (win.__soulResilience133) win.__soulResilience133.swMessages += 1;
  } catch { /* ignore */ }
}

function pruneDuplicateCanvas133(documentRef: Document, targets: ResilienceTargets133) {
  const win = documentRef.defaultView as SoulWindow133 | null;
  const root = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  if (!root) return;
  const canvases = Array.from(root.querySelectorAll('canvas'));
  if (canvases.length <= 1) return;
  canvases.slice(0, -1).forEach((canvas) => canvas.remove());
  if (win?.__soulResilience133) win.__soulResilience133.duplicateCanvasPruned += canvases.length - 1;
}

function applySceneHints133(documentRef: Document, route: ResilienceRoute133, targets: ResilienceTargets133) {
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const gameRoot = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  setVisibilityHint133(title, route === 'title');
  setVisibilityHint133(login, route === 'login');
  setVisibilityHint133(town, route === 'town');
  if (gameRoot) {
    gameRoot.toggleAttribute('data-soul-visible-133', route === 'field');
    if (route !== 'field' && gameRoot.querySelectorAll('canvas').length === 0) gameRoot.style.pointerEvents = 'none';
    else gameRoot.style.pointerEvents = '';
  }
}

function setVisibilityHint133(node: HTMLElement | null | undefined, visible: boolean) {
  if (!node) return;
  node.toggleAttribute('data-soul-visible-133', visible);
}

function visibleScenes133(documentRef: Document, targets: ResilienceTargets133) {
  const pairs: Array<[ResilienceRoute133, HTMLElement | null | undefined]> = [
    ['title', targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen')],
    ['login', targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen')],
    ['town', targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen')]
  ];
  const gameRoot = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  const visible = pairs.filter(([, node]) => isVisible133(node)).map(([name]) => name);
  if (gameRoot && isVisible133(gameRoot) && documentRef.body.classList.contains('field-active')) visible.push('field');
  return visible;
}

function isVisible133(node: HTMLElement | null | undefined) {
  if (!node) return false;
  if (node.classList.contains('hidden') || node.getAttribute('aria-hidden') === 'true') return false;
  const style = getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}
