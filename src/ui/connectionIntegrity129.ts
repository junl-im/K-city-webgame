export type ConnectionRoute129 = 'title' | 'login' | 'town' | 'field';
export type ConnectionLevel129 = 'ok' | 'warn' | 'danger';

export type ConnectionContext129 = {
  appShell?: HTMLElement | null;
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

export type ConnectionReport129 = {
  level: ConnectionLevel129;
  message: string;
  hint: string;
  route: ConnectionRoute129;
  problems: string[];
};

type SoulWindow129 = Window & {
  __soulConnectionIntegrity129?: {
    installedAt: number;
    route: ConnectionRoute129;
    syncCount: number;
    lastSyncAt: number;
    duplicateCanvasPruned: number;
    duplicateListenerGuards: number;
    lastProblems: string[];
  };
  __soulTextureCache125?: {
    hits: number;
    loads: number;
    failures: number;
    size: number;
  };
  SOUL_ONLINE_BOOT_VERSION?: string;
};

const REQUIRED_SELECTORS_129: Array<[string, string]> = [
  ['#app', '앱 셸'],
  ['#titleScreen', '타이틀'],
  ['#startGameBtn', 'START'],
  ['#loginScreen', '로그인'],
  ['#guestLoginBtn', '게스트 로그인'],
  ['#localLoginBtn', '로컬 로그인'],
  ['#townScreen', '마을'],
  ['#game-root', '필드 루트'],
  ['#returnTownBtn', '마을로'],
  ['#attackBtn', '공격'],
  ['#joystick', '조이스틱'],
  ['#targetCard', '타깃 카드'],
  ['#fieldQuestTracker', '퀘스트 미니창']
];

const VISUAL_DOWNGRADE_CLASSES_129 = [
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

const STALE_FLAGS_129 = [
  'soul-online-field-lite-100',
  'soul-online-force-lite-106',
  'soul-online-atlas-mode-106',
  'soul-online-render-tier-112',
  'soul-online-use-lite-atlas-115',
  'soul-online-force-high-atlas-115'
];

const ROUTE_CLASSES_129 = ['route-title-129', 'route-login-129', 'route-town-129', 'route-field-129'];

let installed129 = false;
let observer129: MutationObserver | null = null;
let repairTimer129 = 0;
let lastReport129: ConnectionReport129 | null = null;

export function installConnectionIntegrity129(documentRef: Document, context: ConnectionContext129 = {}) {
  const win = documentRef.defaultView as SoulWindow129 | null;
  if (!win) return inspectConnectionIntegrity129(documentRef, context);

  if (installed129) {
    syncConnectionRoute129(documentRef, inferRoute129(documentRef), context);
    return inspectConnectionIntegrity129(documentRef, context);
  }
  installed129 = true;

  win.__soulConnectionIntegrity129 = {
    installedAt: performance.now(),
    route: inferRoute129(documentRef),
    syncCount: 0,
    lastSyncAt: 0,
    duplicateCanvasPruned: 0,
    duplicateListenerGuards: 0,
    lastProblems: []
  };

  documentRef.documentElement.classList.add('soul-connection-integrity-129');
  documentRef.body.classList.add('fantasy-ui-129', 'connection-integrity-129', 'visual-quality-preserved-129');
  documentRef.body.dataset.alphaVersion = '1.39.0';
  removeVisualDowngradeState129(documentRef);
  purgeStaleFlags129();
  hardenTapTargets129(documentRef);

  observer129 = new MutationObserver(() => {
    removeVisualDowngradeState129(documentRef);
    scheduleRepair129(documentRef, context, 80);
  });
  observer129.observe(documentRef.body, { attributes: true, attributeFilter: ['class', 'data-route-128', 'data-route-129'] });

  win.addEventListener('pageshow', () => scheduleRepair129(documentRef, context, 80), { passive: true });
  win.addEventListener('visibilitychange', () => scheduleRepair129(documentRef, context, 120), { passive: true });
  win.addEventListener('online', () => scheduleRepair129(documentRef, context, 120), { passive: true });
  win.addEventListener('offline', () => scheduleRepair129(documentRef, context, 120), { passive: true });

  installButtonGuard129(documentRef, context.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn'));
  syncConnectionRoute129(documentRef, inferRoute129(documentRef), context);
  return inspectConnectionIntegrity129(documentRef, context);
}

export function syncConnectionRoute129(documentRef: Document, route: ConnectionRoute129 | string, context: ConnectionContext129 = {}) {
  const nextRoute = normalizeRoute129(route);
  const win = documentRef.defaultView as SoulWindow129 | null;
  if (!win) return;
  if (!win.__soulConnectionIntegrity129) {
    win.__soulConnectionIntegrity129 = {
      installedAt: performance.now(),
      route: nextRoute,
      syncCount: 0,
      lastSyncAt: 0,
      duplicateCanvasPruned: 0,
      duplicateListenerGuards: 0,
      lastProblems: []
    };
  }

  documentRef.body.dataset.route129 = nextRoute;
  documentRef.body.classList.remove(...ROUTE_CLASSES_129);
  documentRef.body.classList.add(`route-${nextRoute}-129`);
  removeVisualDowngradeState129(documentRef);
  applySceneVisibility129(nextRoute, context, documentRef);
  pruneDuplicateCanvas129(context, documentRef);
  hardenTapTargets129(documentRef);

  win.__soulConnectionIntegrity129.route = nextRoute;
  win.__soulConnectionIntegrity129.syncCount += 1;
  win.__soulConnectionIntegrity129.lastSyncAt = performance.now();
  const report = inspectConnectionIntegrity129(documentRef, context);
  win.__soulConnectionIntegrity129.lastProblems = report.problems;
}

export function inspectConnectionIntegrity129(documentRef: Document, context: ConnectionContext129 = {}): ConnectionReport129 {
  const win = documentRef.defaultView as SoulWindow129 | null;
  const route = normalizeRoute129(win?.__soulConnectionIntegrity129?.route || inferRoute129(documentRef));
  const problems: string[] = [];
  const missing = missingRequired129(documentRef);
  const duplicateIds = duplicateIds129(documentRef);
  const visibleScenes = visibleScenes129(context, documentRef);
  const canvasCount = (context.gameRoot || context.root || documentRef.querySelector('#game-root'))?.querySelectorAll('canvas').length || 0;
  const downGradeClasses = VISUAL_DOWNGRADE_CLASSES_129.filter((className) => documentRef.body.classList.contains(className));
  const titleReady = titleKeyvisualReady129(documentRef);
  const startReady = startButtonReady129(context.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn'));

  if (missing.length) problems.push(`필수 DOM ${missing.join(', ')}`);
  if (duplicateIds.length) problems.push(`중복 id ${duplicateIds.join(', ')}`);
  if (visibleScenes.length > 1) problems.push(`동시 장면 ${visibleScenes.join('/')}`);
  if (canvasCount > 1) problems.push(`canvas ${canvasCount}`);
  if (downGradeClasses.length) problems.push(`화질저하 class ${downGradeClasses.length}`);
  if (route === 'title' && !titleReady) problems.push('타이틀 키비주얼 로딩');
  if (!startReady) problems.push('START 버튼 대기');

  const texture = win?.__soulTextureCache125;
  const textureHint = texture ? `2.5D cache ${texture.size} · load ${texture.loads} · hit ${texture.hits} · fail ${texture.failures}` : '2.5D cache 필드 진입 전';
  const swHint = `SW ${navigator.serviceWorker?.controller ? 'controlled' : 'ready 대기'}`;
  const routeHint = `route ${route} · scene ${visibleScenes.join('/') || 'none'} · canvas ${canvasCount}`;
  const level: ConnectionLevel129 = problems.some((problem) => /필수 DOM|START|중복 id/.test(problem)) ? 'danger' : problems.length ? 'warn' : 'ok';

  const report: ConnectionReport129 = {
    level,
    message: problems.length ? '연결성 보정 필요' : '연결성 정상',
    hint: problems.length ? `${problems.join(' · ')} · ${routeHint}` : `${routeHint} · ${swHint} · ${textureHint}`,
    route,
    problems
  };
  lastReport129 = report;
  return report;
}

function scheduleRepair129(documentRef: Document, context: ConnectionContext129, delay: number) {
  const win = documentRef.defaultView;
  if (!win) return;
  if (repairTimer129) win.clearTimeout(repairTimer129);
  repairTimer129 = win.setTimeout(() => {
    repairTimer129 = 0;
    syncConnectionRoute129(documentRef, inferRoute129(documentRef), context);
  }, delay);
}

function normalizeRoute129(route: string): ConnectionRoute129 {
  if (route === 'login' || route === 'town' || route === 'field') return route;
  return 'title';
}

function inferRoute129(documentRef: Document): ConnectionRoute129 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.classList.contains('route-field-128') || body.classList.contains('route-field-126')) return 'field';
  if (body.classList.contains('town-active') || body.classList.contains('route-town-128') || body.classList.contains('route-town-126')) return 'town';
  const login = documentRef.querySelector<HTMLElement>('#loginScreen');
  const title = documentRef.querySelector<HTMLElement>('#titleScreen');
  if (login && !login.classList.contains('hidden') && login.getAttribute('aria-hidden') !== 'true') return 'login';
  if (title && !title.classList.contains('hidden') && title.getAttribute('aria-hidden') !== 'true') return 'title';
  return 'title';
}

function applySceneVisibility129(route: ConnectionRoute129, context: ConnectionContext129, documentRef: Document) {
  const title = context.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = context.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = context.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const gameRoot = context.gameRoot || context.root || documentRef.querySelector<HTMLElement>('#game-root');
  setScene129(title, route === 'title');
  setScene129(login, route === 'login');
  setScene129(town, route === 'town');
  if (gameRoot) {
    const hasCanvas = Boolean(gameRoot.querySelector('canvas'));
    gameRoot.classList.toggle('hidden', route !== 'field' && !hasCanvas);
    gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');
  }
}

function setScene129(node: HTMLElement | null, visible: boolean) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  (node as HTMLElement & { inert?: boolean }).inert = !visible;
  if (visible) {
    node.style.removeProperty('display');
    node.style.removeProperty('visibility');
    node.style.removeProperty('opacity');
    node.style.removeProperty('pointer-events');
  } else {
    node.style.display = 'none';
    node.style.visibility = 'hidden';
    node.style.opacity = '0';
    node.style.pointerEvents = 'none';
  }
}

function pruneDuplicateCanvas129(context: ConnectionContext129, documentRef: Document) {
  const win = documentRef.defaultView as SoulWindow129 | null;
  const root = context.gameRoot || context.root || documentRef.querySelector<HTMLElement>('#game-root');
  if (!root) return;
  const canvases = [...root.querySelectorAll('canvas')];
  if (canvases.length <= 1) return;
  canvases.slice(0, -1).forEach((canvas) => canvas.remove());
  if (win?.__soulConnectionIntegrity129) win.__soulConnectionIntegrity129.duplicateCanvasPruned += canvases.length - 1;
}

function removeVisualDowngradeState129(documentRef: Document) {
  documentRef.body.classList.remove(...VISUAL_DOWNGRADE_CLASSES_129);
  documentRef.body.classList.add('standard-2p5d-129', 'visual-quality-preserved-129');
}

function purgeStaleFlags129() {
  try {
    for (const key of STALE_FLAGS_129) localStorage.removeItem(key);
  } catch {
    // localStorage 제한 환경에서는 조용히 통과한다.
  }
}

function hardenTapTargets129(documentRef: Document) {
  documentRef.querySelectorAll<HTMLElement>('button, [role="button"], [data-zone-id], [data-town-content], [data-skill-slot]').forEach((node) => {
    node.style.touchAction = 'manipulation';
    node.style.setProperty('-webkit-tap-highlight-color', 'transparent');
    node.dataset.inputReady129 = '1';
  });
}

function installButtonGuard129(documentRef: Document, startButton: HTMLButtonElement | null) {
  if (!startButton || startButton.dataset.guard129 === '1') return;
  const win = documentRef.defaultView as SoulWindow129 | null;
  startButton.dataset.guard129 = '1';
  startButton.addEventListener('click', () => {
    startButton.dataset.lastClick129 = String(Math.round(performance.now()));
    if (win?.__soulConnectionIntegrity129) win.__soulConnectionIntegrity129.duplicateListenerGuards += 1;
  }, { passive: true, capture: true });
}

function missingRequired129(documentRef: Document) {
  return REQUIRED_SELECTORS_129.filter(([selector]) => !documentRef.querySelector(selector)).map(([, label]) => label);
}

function duplicateIds129(documentRef: Document) {
  const counts = new Map<string, number>();
  documentRef.querySelectorAll<HTMLElement>('[id]').forEach((node) => counts.set(node.id, (counts.get(node.id) || 0) + 1));
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id, count]) => `${id}x${count}`);
}

function visibleScenes129(context: ConnectionContext129, documentRef: Document) {
  const scenes: string[] = [];
  const title = context.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = context.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = context.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const root = context.gameRoot || context.root || documentRef.querySelector<HTMLElement>('#game-root');
  if (isVisibleScene129(title)) scenes.push('title');
  if (isVisibleScene129(login)) scenes.push('login');
  if (isVisibleScene129(town)) scenes.push('town');
  if (root && root.querySelector('canvas') && root.getAttribute('aria-hidden') !== 'true') scenes.push('field');
  return scenes;
}

function isVisibleScene129(node: HTMLElement | null) {
  if (!node || node.classList.contains('hidden') || node.getAttribute('aria-hidden') === 'true') return false;
  if (node.style.display === 'none' || node.style.visibility === 'hidden' || node.style.opacity === '0') return false;
  return true;
}

function titleKeyvisualReady129(documentRef: Document) {
  const image = documentRef.querySelector<HTMLImageElement>('.title-revival-keyart-127, .title-keyart-129');
  if (!image) return true;
  return Boolean((image.complete && image.naturalWidth > 0) || image.currentSrc || image.src);
}

function startButtonReady129(button: HTMLButtonElement | null) {
  if (!button) return false;
  return !button.disabled && button.getAttribute('aria-hidden') !== 'true';
}

export function lastConnectionReport129() {
  return lastReport129;
}
