export type ReleaseRoute134 = 'title' | 'login' | 'town' | 'field';
export type ReleaseLevel134 = 'ok' | 'warn' | 'danger';

export type ReleaseTargets134 = {
  appShell?: HTMLElement | null;
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

export type ReleaseReport134 = {
  level: ReleaseLevel134;
  message: string;
  hint: string;
  route: ReleaseRoute134;
  problems: string[];
};

type SoulWindow134 = Window & {
  __soulReleaseControl134?: {
    installedAt: number;
    route: ReleaseRoute134;
    duplicateCanvasPruned: number;
    blockedDoubleTaps: number;
    repairedButtons: number;
    backupWrites: number;
    lastActionAt: number;
    lastError: string;
    lastReport?: ReleaseReport134;
  };
};

const ROUTE_CLASSES_134 = ['route-title-134', 'route-login-134', 'route-town-134', 'route-field-134'];
const QUALITY_DOWNGRADE_CLASSES_134 = [
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
const STALE_FLAGS_134 = [
  'soul-online-force-lite-106',
  'soul-online-atlas-mode-106',
  'soul-online-render-tier-112',
  'soul-online-use-lite-atlas-115',
  'soul-online-force-high-atlas-115',
  'soul-online-allow-legacy-css'
];
const LOCKED_BUTTON_SELECTOR_134 = [
  '#startGameBtn',
  '#guestLoginBtn',
  '#googleLoginBtn',
  '#localLoginBtn',
  '#serverNextBtn',
  '#characterNextBtn',
  '#connectCharacterBtn',
  '#newCharacterBtn',
  '#enterTownBtn',
  '[data-zone-enter]',
  '[data-town-nav]',
  '[data-town-open]',
  '[data-action]'
].join(',');
const ROSTER_KEY_134 = 'sol-online-alpha-roster-v1';
const LEGACY_SAVE_KEY_134 = 'sol-online-alpha-save-v1';
const ROSTER_BACKUP_KEY_134 = 'sol-online-alpha-roster-v1-backup-134';
const LEGACY_BACKUP_KEY_134 = 'sol-online-alpha-save-v1-backup-134';

let installed134 = false;
let mutationObserver134: MutationObserver | null = null;
let sweepTimer134 = 0;
let lastReport134: ReleaseReport134 = {
  level: 'warn',
  message: '1.34 릴리즈 가드 대기',
  hint: '설치 전',
  route: 'title',
  problems: ['설치 전']
};

export function installReleaseControl134(documentRef: Document, targets: ReleaseTargets134 = {}) {
  const win = documentRef.defaultView as SoulWindow134 | null;
  if (!win) return inspectReleaseControl134(documentRef, targets);
  if (installed134) {
    syncReleaseRoute134(documentRef, inferRoute134(documentRef), targets);
    return inspectReleaseControl134(documentRef, targets);
  }

  installed134 = true;
  win.__soulReleaseControl134 = {
    installedAt: performance.now(),
    route: inferRoute134(documentRef),
    duplicateCanvasPruned: 0,
    blockedDoubleTaps: 0,
    repairedButtons: 0,
    backupWrites: 0,
    lastActionAt: 0,
    lastError: ''
  };

  documentRef.documentElement.classList.add('soul-release-control-134');
  documentRef.body.classList.add('fantasy-ui-134', 'release-control-134', 'visual-quality-preserved-134', 'firebase-freeplan-safe-134');
  documentRef.body.dataset.alphaVersion = '1.35.0';
  documentRef.body.dataset.visualPolicy134 = 'high-fidelity-preserved';
  purgeStaleFlags134();
  stripQualityDowngrade134(documentRef);
  installDoubleTapGuard134(documentRef, win);
  ensureReleaseHud134(documentRef);
  mirrorLocalSave134(documentRef);

  mutationObserver134 = new MutationObserver(() => scheduleSweep134(documentRef, targets, 120));
  mutationObserver134.observe(documentRef.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['class', 'style', 'disabled', 'aria-disabled'] });

  const sweep = () => scheduleSweep134(documentRef, targets, 120);
  win.addEventListener('online', sweep, { passive: true });
  win.addEventListener('offline', sweep, { passive: true });
  win.addEventListener('pageshow', sweep, { passive: true });
  win.addEventListener('visibilitychange', () => {
    mirrorLocalSave134(documentRef);
    sweep();
  }, { passive: true });
  win.addEventListener('pagehide', () => mirrorLocalSave134(documentRef), { passive: true });
  win.addEventListener('beforeunload', () => mirrorLocalSave134(documentRef), { passive: true });
  win.addEventListener('error', (event) => {
    if (win.__soulReleaseControl134) win.__soulReleaseControl134.lastError = event.message || 'runtime error';
    documentRef.body.classList.add('release-runtime-warning-134');
    sweep();
  });
  win.addEventListener('unhandledrejection', (event) => {
    if (win.__soulReleaseControl134) win.__soulReleaseControl134.lastError = event.reason instanceof Error ? event.reason.message : String(event.reason || 'promise rejection');
    documentRef.body.classList.add('release-runtime-warning-134');
    sweep();
  });

  syncReleaseRoute134(documentRef, inferRoute134(documentRef), targets);
  win.setTimeout(() => syncReleaseRoute134(documentRef, inferRoute134(documentRef), targets), 900);
  return inspectReleaseControl134(documentRef, targets);
}

export function syncReleaseRoute134(documentRef: Document, route: ReleaseRoute134 | string, targets: ReleaseTargets134 = {}) {
  const normalized = normalizeRoute134(route);
  const win = documentRef.defaultView as SoulWindow134 | null;
  if (!win) return;
  if (!win.__soulReleaseControl134) {
    win.__soulReleaseControl134 = {
      installedAt: performance.now(),
      route: normalized,
      duplicateCanvasPruned: 0,
      blockedDoubleTaps: 0,
      repairedButtons: 0,
      backupWrites: 0,
      lastActionAt: 0,
      lastError: ''
    };
  }

  documentRef.body.dataset.route134 = normalized;
  documentRef.body.classList.remove(...ROUTE_CLASSES_134);
  documentRef.body.classList.add(`route-${normalized}-134`);
  documentRef.body.classList.toggle('network-offline-134', !navigator.onLine);
  documentRef.body.classList.toggle('network-online-134', navigator.onLine);

  stripQualityDowngrade134(documentRef);
  repairDisabledButtons134(documentRef, normalized, win);
  pruneDuplicateCanvas134(documentRef, targets, win);
  applySceneState134(documentRef, normalized, targets);
  updateReleaseHud134(documentRef, normalized);

  win.__soulReleaseControl134.route = normalized;
  win.__soulReleaseControl134.lastReport = inspectReleaseControl134(documentRef, targets);
}

export function inspectReleaseControl134(documentRef: Document, targets: ReleaseTargets134 = {}): ReleaseReport134 {
  const win = documentRef.defaultView as SoulWindow134 | null;
  const state = win?.__soulReleaseControl134;
  const route = normalizeRoute134(state?.route || inferRoute134(documentRef));
  const problems: string[] = [];
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const root = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  const start = targets.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  const localButton = documentRef.querySelector<HTMLButtonElement>('#localLoginBtn');
  const visibleScenes = visibleScenes134(documentRef, targets);
  const canvasCount = root?.querySelectorAll('canvas').length || 0;
  const qualityDowngrade = QUALITY_DOWNGRADE_CLASSES_134.filter((className) => documentRef.body.classList.contains(className));
  const titleVisualOk = Boolean(title && (getComputedStyle(title).backgroundImage.includes('title-keyvisual-060') || documentRef.querySelector('link[href*="title-keyvisual-060"]')));
  const hasRoster = safeStorageGet134(ROSTER_KEY_134) !== null;
  const hasBackup = safeStorageGet134(ROSTER_BACKUP_KEY_134) !== null;

  if (!title) problems.push('타이틀 DOM 없음');
  if (!login) problems.push('로그인 DOM 없음');
  if (!town) problems.push('마을 DOM 없음');
  if (!start || start.disabled) problems.push('START 버튼 대기');
  if (route === 'login' && (!localButton || localButton.disabled)) problems.push('로컬 접속 버튼 대기');
  if (visibleScenes.length > 1) problems.push(`동시 장면 ${visibleScenes.join('/')}`);
  if (canvasCount > 1) problems.push(`중복 canvas ${canvasCount}`);
  if (qualityDowngrade.length) problems.push(`화질저하 class ${qualityDowngrade.length}`);
  if (route === 'title' && !titleVisualOk) problems.push('시작 키비주얼 확인 필요');
  if (hasRoster && !hasBackup) problems.push('로컬 백업 대기');
  if (state?.lastError) problems.push(`최근 오류 ${state.lastError}`);

  const level: ReleaseLevel134 = problems.some((problem) => /DOM 없음|중복 canvas|동시 장면|START/.test(problem)) ? 'danger' : problems.length ? 'warn' : 'ok';
  lastReport134 = {
    level,
    message: level === 'ok' ? '1.34 릴리즈 안정' : level === 'warn' ? '1.34 릴리즈 보정 중' : '1.34 릴리즈 점검 필요',
    hint: `route ${route} · canvas ${canvasCount} · block ${state?.blockedDoubleTaps || 0} · repair ${state?.repairedButtons || 0} · backup ${state?.backupWrites || 0} · ${navigator.onLine ? 'online' : 'offline local'}`,
    route,
    problems
  };
  return lastReport134;
}

function installDoubleTapGuard134(documentRef: Document, win: SoulWindow134) {
  documentRef.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>(LOCKED_BUTTON_SELECTOR_134);
    if (!button) return;
    const now = performance.now();
    const lockMs = Number(button.dataset.soulLockMs134 || (button.id === 'startGameBtn' ? 520 : 760));
    const last = Number(button.dataset.soulLastClick134 || '0');
    if (last && now - last < lockMs) {
      event.preventDefault();
      event.stopPropagation();
      if (win.__soulReleaseControl134) win.__soulReleaseControl134.blockedDoubleTaps += 1;
      button.classList.add('tap-blocked-134');
      window.setTimeout(() => button.classList.remove('tap-blocked-134'), 260);
      return;
    }
    button.dataset.soulLastClick134 = String(now);
    if (win.__soulReleaseControl134) win.__soulReleaseControl134.lastActionAt = now;
  }, true);
}

function repairDisabledButtons134(documentRef: Document, route: ReleaseRoute134, win: SoulWindow134) {
  const selectors = route === 'title'
    ? ['#startGameBtn']
    : route === 'login'
      ? ['#guestLoginBtn', '#localLoginBtn', '#serverNextBtn', '#characterNextBtn', '#connectCharacterBtn', '#newCharacterBtn']
      : ['#enterTownBtn', '[data-zone-enter]', '[data-town-nav]', '[data-town-open]'];
  for (const selector of selectors) {
    documentRef.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
      if (!button.disabled && button.getAttribute('aria-disabled') !== 'true') return;
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      button.classList.add('release-repaired-button-134');
      if (win.__soulReleaseControl134) win.__soulReleaseControl134.repairedButtons += 1;
    });
  }
}

function pruneDuplicateCanvas134(documentRef: Document, targets: ReleaseTargets134, win: SoulWindow134) {
  const root = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  if (!root) return;
  const canvases = Array.from(root.querySelectorAll<HTMLCanvasElement>('canvas'));
  if (canvases.length <= 1) return;
  canvases.slice(0, -1).forEach((canvas) => canvas.remove());
  if (win.__soulReleaseControl134) win.__soulReleaseControl134.duplicateCanvasPruned += canvases.length - 1;
  documentRef.body.classList.add('duplicate-canvas-pruned-134');
}

function applySceneState134(documentRef: Document, route: ReleaseRoute134, targets: ReleaseTargets134) {
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const root = targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root');
  setVisible134(title, route === 'title');
  setVisible134(login, route === 'login');
  setVisible134(town, route === 'town');
  if (root) {
    const visible = route === 'field';
    root.classList.toggle('hidden', !visible);
    root.setAttribute('aria-hidden', visible ? 'false' : 'true');
    root.style.pointerEvents = visible ? 'auto' : 'none';
  }
}

function setVisible134(node: HTMLElement | null | undefined, visible: boolean) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  node.style.display = visible ? '' : 'none';
  node.style.opacity = visible ? '1' : '0';
  node.style.visibility = visible ? 'visible' : 'hidden';
  node.style.pointerEvents = visible ? 'auto' : 'none';
}

function ensureReleaseHud134(documentRef: Document) {
  if (documentRef.querySelector('#soulReleaseStatus134')) return;
  const node = documentRef.createElement('div');
  node.id = 'soulReleaseStatus134';
  node.className = 'soul-release-status-134';
  node.setAttribute('aria-live', 'polite');
  node.textContent = navigator.onLine ? '온라인 접속 안정화' : '오프라인 로컬 모드';
  documentRef.body.appendChild(node);
}

function updateReleaseHud134(documentRef: Document, route: ReleaseRoute134) {
  const node = documentRef.querySelector<HTMLElement>('#soulReleaseStatus134');
  if (!node) return;
  node.textContent = navigator.onLine ? '온라인 접속 안정화' : '오프라인 로컬 모드';
  node.classList.toggle('show', route === 'login' || !navigator.onLine || documentRef.body.classList.contains('release-runtime-warning-134'));
}

function mirrorLocalSave134(documentRef: Document) {
  const win = documentRef.defaultView as SoulWindow134 | null;
  try {
    const roster = localStorage.getItem(ROSTER_KEY_134);
    if (roster) {
      localStorage.setItem(ROSTER_BACKUP_KEY_134, roster);
      if (win?.__soulReleaseControl134) win.__soulReleaseControl134.backupWrites += 1;
    }
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY_134);
    if (legacy) localStorage.setItem(LEGACY_BACKUP_KEY_134, legacy);
  } catch {
    documentRef.body.classList.add('storage-backup-warning-134');
  }
}

function scheduleSweep134(documentRef: Document, targets: ReleaseTargets134, delayMs: number) {
  if (sweepTimer134) window.clearTimeout(sweepTimer134);
  sweepTimer134 = window.setTimeout(() => {
    sweepTimer134 = 0;
    syncReleaseRoute134(documentRef, inferRoute134(documentRef), targets);
  }, delayMs);
}

function inferRoute134(documentRef: Document): ReleaseRoute134 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.classList.contains('route-field-133') || body.classList.contains('route-field-130')) return 'field';
  if (body.classList.contains('town-active') || body.classList.contains('route-town-133') || body.classList.contains('route-town-130')) return 'town';
  if (body.classList.contains('prestart-login-120') || body.classList.contains('route-login-133') || body.classList.contains('route-login-130')) return 'login';
  return 'title';
}

function normalizeRoute134(route: ReleaseRoute134 | string): ReleaseRoute134 {
  if (route === 'field' || route === 'town' || route === 'login' || route === 'title') return route;
  return 'title';
}

function stripQualityDowngrade134(documentRef: Document) {
  documentRef.body.classList.remove(...QUALITY_DOWNGRADE_CLASSES_134);
  documentRef.documentElement.classList.remove(...QUALITY_DOWNGRADE_CLASSES_134);
  documentRef.body.classList.add('visual-quality-preserved-134');
}

function purgeStaleFlags134() {
  for (const key of STALE_FLAGS_134) {
    try { localStorage.removeItem(key); } catch { /* ignore storage privacy mode */ }
  }
}

function visibleScenes134(documentRef: Document, targets: ReleaseTargets134) {
  const entries: Array<[string, HTMLElement | null | undefined]> = [
    ['title', targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen')],
    ['login', targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen')],
    ['town', targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen')],
    ['field', targets.gameRoot || targets.root || documentRef.querySelector<HTMLElement>('#game-root')]
  ];
  return entries.filter(([, node]) => node && isVisible134(node)).map(([name]) => name);
}

function isVisible134(node: HTMLElement) {
  const style = getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && !node.classList.contains('hidden') && node.getAttribute('aria-hidden') !== 'true';
}

function safeStorageGet134(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
