export type DependencyAuditRoute128 = 'title' | 'login' | 'town' | 'field';
export type DependencyAuditLevel128 = 'ok' | 'warn' | 'danger';

export type DependencyAuditContext128 = {
  appShell?: HTMLElement | null;
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

type DependencyAuditSnapshot128 = {
  route: DependencyAuditRoute128;
  missingRequired: string[];
  duplicateIds: string[];
  legacyModeClasses: string[];
  visibleScenes: string[];
  canvasCount: number;
  serviceWorkerControlled: boolean;
  online: boolean;
  titleImageReady: boolean;
  startReady: boolean;
};

type DependencyAuditWindow128 = Window & {
  __soulDependencyAudit128?: {
    installedAt: number;
    lastSyncAt: number;
    route: DependencyAuditRoute128;
    lastSnapshot?: DependencyAuditSnapshot128;
  };
  __soulTextureCache125?: {
    hits: number;
    loads: number;
    failures: number;
    size: number;
  };
};

const REQUIRED_SELECTORS_128: Array<[string, string]> = [
  ['#app', '앱 셸'],
  ['#titleScreen', '타이틀 화면'],
  ['#startGameBtn', 'START 버튼'],
  ['#loginScreen', '로그인 화면'],
  ['#guestLoginBtn', '게스트 로그인'],
  ['#localLoginBtn', '로컬 로그인'],
  ['#townScreen', '마을 화면'],
  ['#game-root', 'Pixi 필드 루트'],
  ['#attackBtn', '공격 버튼'],
  ['#joystick', '조이스틱'],
  ['#fieldQuestTracker', '필드 퀘스트'],
  ['#targetCard', '몬스터 타깃 카드']
];

const LEGACY_MODE_CLASSES_128 = [
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
  'viewport-lock-117',
  'single-visual-117',
  'scene-stability-118'
];

const STALE_LOCAL_FLAGS_128 = [
  'soul-online-field-lite-100',
  'soul-online-force-lite-106',
  'soul-online-atlas-mode-106',
  'soul-online-render-tier-112',
  'soul-online-use-lite-atlas-115',
  'soul-online-force-high-atlas-115',
  'soul-online-allow-legacy-css'
];

function clampRoute128(route: string): DependencyAuditRoute128 {
  return route === 'login' || route === 'town' || route === 'field' ? route : 'title';
}

function safeClassRemove128(body: HTMLElement, classes: string[]) {
  for (const className of classes) body.classList.remove(className);
}

function purgeStaleLocalFlags128() {
  try {
    for (const key of STALE_LOCAL_FLAGS_128) localStorage.removeItem(key);
  } catch {
    // Safari private mode 같은 환경에서는 localStorage 접근 자체가 실패할 수 있다.
  }
}

function listDuplicateIds128(documentRef: Document) {
  const ids = new Map<string, number>();
  documentRef.querySelectorAll<HTMLElement>('[id]').forEach((node) => {
    ids.set(node.id, (ids.get(node.id) || 0) + 1);
  });
  return [...ids.entries()].filter(([, count]) => count > 1).map(([id, count]) => `${id} x${count}`);
}

function listMissingRequired128(documentRef: Document) {
  return REQUIRED_SELECTORS_128
    .filter(([selector]) => !documentRef.querySelector(selector))
    .map(([, label]) => label);
}

function routeFromBody128(documentRef: Document): DependencyAuditRoute128 {
  const body = documentRef.body;
  if (body.classList.contains('field-active')) return 'field';
  if (body.classList.contains('town-active')) return 'town';
  const title = documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = documentRef.querySelector<HTMLElement>('#loginScreen');
  if (login && !login.classList.contains('hidden')) return 'login';
  if (title && !title.classList.contains('hidden')) return 'title';
  return 'title';
}

function visibleSceneNames128(context: DependencyAuditContext128) {
  const visible: string[] = [];
  if (context.titleScreen && !context.titleScreen.classList.contains('hidden')) visible.push('title');
  if (context.loginScreen && !context.loginScreen.classList.contains('hidden')) visible.push('login');
  if (context.townScreen && !context.townScreen.classList.contains('hidden')) visible.push('town');
  const root = context.gameRoot || context.root;
  if (root && root.querySelector('canvas') && !root.classList.contains('hidden')) visible.push('field');
  return visible;
}

function enforceSceneVisibility128(route: DependencyAuditRoute128, context: DependencyAuditContext128) {
  const title = context.titleScreen;
  const login = context.loginScreen;
  const town = context.townScreen;
  const root = context.gameRoot || context.root;

  const showTitle = route === 'title';
  const showLogin = route === 'login';
  const showTown = route === 'town';
  const showField = route === 'field';

  if (title) {
    title.classList.toggle('hidden', !showTitle);
    title.setAttribute('aria-hidden', showTitle ? 'false' : 'true');
  }
  if (login) {
    login.classList.toggle('hidden', !showLogin);
    login.setAttribute('aria-hidden', showLogin ? 'false' : 'true');
  }
  if (town) {
    town.classList.toggle('hidden', !showTown);
    town.setAttribute('aria-hidden', showTown ? 'false' : 'true');
  }
  if (root) {
    root.classList.toggle('hidden', !showField && !root.querySelector('canvas'));
    root.setAttribute('aria-hidden', showField ? 'false' : 'true');
  }
}

function keepSingleCanvas128(context: DependencyAuditContext128) {
  const root = context.gameRoot || context.root;
  if (!root) return 0;
  const canvases = [...root.querySelectorAll('canvas')];
  if (canvases.length <= 1) return canvases.length;
  canvases.slice(0, -1).forEach((canvas) => canvas.remove());
  return 1;
}

function inspectTitleImage128(documentRef: Document) {
  const image = documentRef.querySelector<HTMLImageElement>('.title-revival-keyart-127');
  if (!image) return false;
  if ('complete' in image && image.complete && image.naturalWidth > 0) return true;
  return Boolean(image.getAttribute('src'));
}

export function installDependencyAudit128(documentRef: Document, context: DependencyAuditContext128 = {}) {
  const win = window as DependencyAuditWindow128;
  if (win.__soulDependencyAudit128) return;

  purgeStaleLocalFlags128();
  documentRef.body.classList.add('dependency-audit-128', 'visual-quality-preserved-128');
  safeClassRemove128(documentRef.body, LEGACY_MODE_CLASSES_128);

  win.__soulDependencyAudit128 = {
    installedAt: performance.now(),
    lastSyncAt: 0,
    route: routeFromBody128(documentRef)
  };

  window.addEventListener('online', () => documentRef.body.classList.add('network-online-128'));
  window.addEventListener('offline', () => documentRef.body.classList.remove('network-online-128'));
  documentRef.body.classList.toggle('network-online-128', navigator.onLine);

  // DOM이 흔들릴 때마다 무겁게 검사하지 않고, 핵심 class만 즉시 정리한다.
  const observer = new MutationObserver(() => {
    safeClassRemove128(documentRef.body, LEGACY_MODE_CLASSES_128);
  });
  observer.observe(documentRef.body, { attributes: true, attributeFilter: ['class'] });

  syncDependencyRoute128(documentRef, routeFromBody128(documentRef), context);
}

export function syncDependencyRoute128(documentRef: Document, route: DependencyAuditRoute128 | string, context: DependencyAuditContext128 = {}) {
  const nextRoute = clampRoute128(route);
  const win = window as DependencyAuditWindow128;
  if (!win.__soulDependencyAudit128) {
    win.__soulDependencyAudit128 = { installedAt: performance.now(), lastSyncAt: 0, route: nextRoute };
  }

  safeClassRemove128(documentRef.body, LEGACY_MODE_CLASSES_128);
  documentRef.body.dataset.route128 = nextRoute;
  documentRef.body.classList.toggle('route-title-128', nextRoute === 'title');
  documentRef.body.classList.toggle('route-login-128', nextRoute === 'login');
  documentRef.body.classList.toggle('route-town-128', nextRoute === 'town');
  documentRef.body.classList.toggle('route-field-128', nextRoute === 'field');

  enforceSceneVisibility128(nextRoute, context);
  keepSingleCanvas128(context);

  win.__soulDependencyAudit128.route = nextRoute;
  win.__soulDependencyAudit128.lastSyncAt = performance.now();
  win.__soulDependencyAudit128.lastSnapshot = createDependencySnapshot128(documentRef, context, nextRoute);
}

function createDependencySnapshot128(documentRef: Document, context: DependencyAuditContext128, route: DependencyAuditRoute128): DependencyAuditSnapshot128 {
  const legacyModeClasses = LEGACY_MODE_CLASSES_128.filter((className) => documentRef.body.classList.contains(className));
  const canvasCount = (context.gameRoot || context.root || documentRef.querySelector('#game-root'))?.querySelectorAll('canvas').length || 0;
  return {
    route,
    missingRequired: listMissingRequired128(documentRef),
    duplicateIds: listDuplicateIds128(documentRef),
    legacyModeClasses,
    visibleScenes: visibleSceneNames128(context),
    canvasCount,
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
    online: navigator.onLine,
    titleImageReady: inspectTitleImage128(documentRef),
    startReady: Boolean(context.startButton || documentRef.querySelector('#startGameBtn'))
  };
}

export function inspectDependencyAudit128(documentRef: Document, context: DependencyAuditContext128 = {}) {
  const win = window as DependencyAuditWindow128;
  const snapshot = createDependencySnapshot128(documentRef, context, win.__soulDependencyAudit128?.route || routeFromBody128(documentRef));
  if (win.__soulDependencyAudit128) win.__soulDependencyAudit128.lastSnapshot = snapshot;

  const problems: string[] = [];
  if (snapshot.missingRequired.length) problems.push(`필수 DOM ${snapshot.missingRequired.length}`);
  if (snapshot.duplicateIds.length) problems.push(`중복 ID ${snapshot.duplicateIds.length}`);
  if (snapshot.legacyModeClasses.length) problems.push(`구형 모드 class ${snapshot.legacyModeClasses.length}`);
  if (snapshot.visibleScenes.length > 1) problems.push(`동시 장면 ${snapshot.visibleScenes.join('/')}`);
  if (snapshot.canvasCount > 1) problems.push(`canvas ${snapshot.canvasCount}`);
  if (!snapshot.startReady) problems.push('START 미연결');
  if (snapshot.route === 'title' && !snapshot.titleImageReady) problems.push('타이틀 키비주얼 대기');

  let level: DependencyAuditLevel128 = 'ok';
  if (problems.length) level = problems.some((entry) => /필수 DOM|START|중복 ID/.test(entry)) ? 'danger' : 'warn';

  const texture = win.__soulTextureCache125;
  const textureHint = texture ? `2.5D cache ${texture.size} · load ${texture.loads} · hit ${texture.hits} · fail ${texture.failures}` : '2.5D cache 대기';
  const connectionHint = `${snapshot.online ? 'online' : 'offline'} · SW ${snapshot.serviceWorkerControlled ? 'controlled' : 'ready 대기'}`;
  const detailHint = problems.length ? problems.join(' · ') : `${connectionHint} · ${textureHint}`;

  return {
    level,
    message: problems.length ? '연결성 점검 필요' : '연결성 정상',
    hint: detailHint,
    snapshot
  };
}
