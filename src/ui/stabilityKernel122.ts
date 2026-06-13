export type StabilityRoute122 = 'title' | 'login' | 'town' | 'field';

type StabilityTargets122 = {
  appShell?: HTMLElement | null;
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
};

type SoulWindow122 = Window & {
  SOUL_STABILITY_KERNEL_122?: boolean;
  SOUL_STABILITY_ROUTE_122?: StabilityRoute122;
  SOUL_START_LOCK_122?: boolean;
  SOUL_STABILITY_BOOTED_AT_122?: number;
  SOUL_STABILITY_SIZE_122?: { width: number; height: number };
};

let installed122 = false;
let route122: StabilityRoute122 = 'title';
let bootedAt122 = 0;
let lockedWidth122 = 0;
let lockedHeight122 = 0;
let correctedScenes122 = 0;
let hiddenGhosts122 = 0;
let lastStartAt122 = 0;
let lastCollisionAuditAt122 = 0;
let lastCollisionCount122 = 0;
let lastError122 = '';

const ALLOWED_ROUTE_CLASSES_122 = new Set([
  'route-title-119', 'route-login-119', 'route-town-119', 'route-field-119',
  'route-title-120', 'route-login-120', 'route-town-120', 'route-field-120',
  'route-title-121', 'route-login-121', 'route-town-121', 'route-field-121',
  'route-title-122', 'route-login-122', 'route-town-122', 'route-field-122'
]);

const BANNED_BODY_CLASS_RE_122 = /^(lite-render|quality-render|quality-mode|lite-mode|field-low-power|is-rotating|viewport-lock-117|scene-stability-118|single-visual-117|legacy-visual-enabled-120|legacy-visual-enabled-119)$/;

const GHOST_SELECTOR_122 = [
  '.title-character-companion',
  '.town-lobby-pet-070',
  '.field-pet',
  '[class*="companion"]',
  '[class*="rune"]',
  '.orientation-guard',
  '.rotate-guide',
  '.legacy-visual-layer',
  '.title-hero-glow',
  '[data-legacy-layer="true"]'
].join(',');

export function installStabilityKernel122(documentRef: Document, targets: StabilityTargets122) {
  if (installed122) return inspectStabilityKernel122(documentRef);
  installed122 = true;
  bootedAt122 = performance.now();
  const win = documentRef.defaultView as SoulWindow122 | null;
  if (win) {
    win.SOUL_STABILITY_KERNEL_122 = true;
    win.SOUL_STABILITY_BOOTED_AT_122 = Date.now();
  }

  documentRef.documentElement.classList.add('soul-stability-122');
  documentRef.body.classList.add('fantasy-ui-122', 'stability-kernel-122', 'boot-safe-122', 'single-route-122', 'no-pet-116');
  documentRef.body.dataset.alphaVersion = '1.23.0';

  stripBadBodyClasses122(documentRef);
  lockViewportOnce122(documentRef, targets);
  makeStartButtonSafe122(documentRef, targets.startButton);
  hideGhostLayers122(documentRef);

  route122 = readRoute122(documentRef);
  syncStabilityRoute122(documentRef, route122, targets);

  const repair = () => {
    stripBadBodyClasses122(documentRef);
    lockViewportOnce122(documentRef, targets);
    enforceSingleScene122(documentRef, route122, targets);
    hideGhostLayers122(documentRef);
  };

  win?.addEventListener('pageshow', repair, { passive: true });
  win?.addEventListener('visibilitychange', repair, { passive: true });
  win?.addEventListener('orientationchange', () => window.setTimeout(repair, 80), { passive: true });
  win?.addEventListener('error', (event) => {
    lastError122 = event.message || 'runtime error';
    documentRef.body.classList.add('stability-runtime-warning-122');
  });
  win?.addEventListener('unhandledrejection', (event) => {
    lastError122 = event.reason instanceof Error ? event.reason.message : String(event.reason || 'promise rejection');
    documentRef.body.classList.add('stability-runtime-warning-122');
  });

  win?.setTimeout(repair, 120);
  win?.setTimeout(repair, 900);
  return inspectStabilityKernel122(documentRef);
}

export function guardStartTap122(documentRef: Document, cooldownMs = 650) {
  const now = performance.now();
  if (now - lastStartAt122 < cooldownMs) {
    documentRef.body.classList.add('start-deduped-122');
    return false;
  }
  lastStartAt122 = now;
  documentRef.body.classList.remove('start-deduped-122');
  return true;
}

export function syncStabilityRoute122(documentRef: Document, route: StabilityRoute122, targets: StabilityTargets122) {
  route122 = route;
  const win = documentRef.defaultView as SoulWindow122 | null;
  if (win) win.SOUL_STABILITY_ROUTE_122 = route;

  stripBadBodyClasses122(documentRef);
  lockViewportOnce122(documentRef, targets);

  documentRef.body.classList.remove('route-title-122', 'route-login-122', 'route-town-122', 'route-field-122');
  documentRef.body.classList.add(`route-${route}-122`);
  documentRef.body.classList.toggle('town-active', route === 'town');
  documentRef.body.classList.toggle('field-active', route === 'field');
  documentRef.body.dataset.route122 = route;

  enforceSingleScene122(documentRef, route, targets);
  hideGhostLayers122(documentRef);
  makeButtonsTouchable122(documentRef);
}

export function auditFieldCollision122(documentRef: Document) {
  if (!documentRef.body.classList.contains('field-active')) return { ok: true, collisions: 0, message: '필드 비활성' };
  const now = performance.now();
  if (now - lastCollisionAuditAt122 < 260) {
    return { ok: lastCollisionCount122 === 0, collisions: lastCollisionCount122, message: lastCollisionCount122 ? `버튼 충돌 ${lastCollisionCount122}건 보정 유지` : '필드 버튼 충돌 없음' };
  }
  lastCollisionAuditAt122 = now;

  const nodes = Array.from(documentRef.querySelectorAll<HTMLElement>('#returnTownBtn, #joystick, #attackBtn, #inventoryBtn, #cardsBtn, [data-skill-slot], #hpPotionBtn, #mpPotionBtn'));
  const rects = nodes
    .filter((node) => node.offsetParent !== null)
    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
    .filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);

  let collisions = 0;
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      if (overlap122(rects[i].rect, rects[j].rect, 8)) collisions += 1;
    }
  }
  lastCollisionCount122 = collisions;
  documentRef.body.classList.toggle('field-collision-risk-122', collisions > 0);
  return { ok: collisions === 0, collisions, message: collisions ? `버튼 충돌 ${collisions}건 자동 보정` : '필드 버튼 충돌 없음' };
}

export function inspectStabilityKernel122(documentRef: Document) {
  const collision = auditFieldCollision122(documentRef);
  const visibleScenes = countVisibleScenes122(documentRef);
  const level = !installed122 || visibleScenes > 1 || lastError122 ? 'warn' as const : collision.ok ? 'ok' as const : 'warn' as const;
  const bootMs = installed122 ? Math.round(performance.now() - bootedAt122) : 0;
  return {
    label: '1.22 안정화',
    level,
    message: installed122 ? `${route122} · 장면 ${visibleScenes}/1 · ${collision.message}` : '미설치',
    hint: `${lockedWidth122 || 0}x${lockedHeight122 || 0} · 보정 ${correctedScenes122} · 고스트 ${hiddenGhosts122} · ${bootMs}ms${lastError122 ? ` · ${lastError122}` : ''}`
  };
}

function stripBadBodyClasses122(documentRef: Document) {
  const body = documentRef.body;
  for (const name of Array.from(body.classList)) {
    if (BANNED_BODY_CLASS_RE_122.test(name)) body.classList.remove(name);
    if (/^route-(title|login|town|field)-/.test(name) && !ALLOWED_ROUTE_CLASSES_122.has(name)) body.classList.remove(name);
  }
}

function lockViewportOnce122(documentRef: Document, targets?: Partial<StabilityTargets122>) {
  const win = documentRef.defaultView as SoulWindow122 | null;
  if (!win) return;
  if (!lockedWidth122 || !lockedHeight122) {
    const visual = win.visualViewport;
    lockedWidth122 = Math.max(320, Math.round(visual?.width || win.innerWidth || documentRef.documentElement.clientWidth || 390));
    lockedHeight122 = Math.max(520, Math.round(visual?.height || win.innerHeight || documentRef.documentElement.clientHeight || 720));
    win.SOUL_STABILITY_SIZE_122 = { width: lockedWidth122, height: lockedHeight122 };
  }
  const appWidth = Math.min(480, lockedWidth122);
  const root = documentRef.documentElement;
  root.style.setProperty('--soul-locked-w-122', `${appWidth}px`);
  root.style.setProperty('--soul-locked-h-122', `${lockedHeight122}px`);
  root.style.setProperty('--soul-current-w', `${appWidth}px`);
  root.style.setProperty('--soul-current-h', `${lockedHeight122}px`);
  root.style.setProperty('--soul-safe-h-122', `${Math.max(520, lockedHeight122)}px`);
  const app = targets?.appShell || documentRef.querySelector<HTMLElement>('#app');
  if (app) {
    app.style.width = `${appWidth}px`;
    app.style.height = `${lockedHeight122}px`;
    app.style.maxWidth = '480px';
  }
}

function enforceSingleScene122(_documentRef: Document, route: StabilityRoute122, targets: StabilityTargets122) {
  const states: Array<[HTMLElement, boolean]> = [
    [targets.titleScreen, route === 'title'],
    [targets.loginScreen, route === 'login'],
    [targets.townScreen, route === 'town'],
    [targets.gameRoot, route === 'field']
  ];
  for (const [node, visible] of states) {
    if ((node.style.display === 'none') === visible) correctedScenes122 += 1;
    node.classList.toggle('hidden', !visible);
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
    node.style.display = visible ? '' : 'none';
    node.style.opacity = visible ? '1' : '0';
    node.style.visibility = visible ? 'visible' : 'hidden';
    node.style.pointerEvents = visible ? 'auto' : 'none';
  }
}

function hideGhostLayers122(documentRef: Document) {
  let count = 0;
  documentRef.querySelectorAll<HTMLElement>(GHOST_SELECTOR_122).forEach((node) => {
    if (node.id === 'game-root' || node.id === 'titleScreen' || node.id === 'loginScreen' || node.id === 'townScreen') return;
    node.setAttribute('aria-hidden', 'true');
    node.style.display = 'none';
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
    count += 1;
  });
  hiddenGhosts122 = Math.max(hiddenGhosts122, count);
}

function makeStartButtonSafe122(documentRef: Document, button: HTMLButtonElement) {
  button.disabled = false;
  button.removeAttribute('aria-disabled');
  button.dataset.stabilityReady122 = 'true';
  button.style.touchAction = 'manipulation';
  button.style.pointerEvents = 'auto';
  makeButtonsTouchable122(documentRef);
}

function makeButtonsTouchable122(documentRef: Document) {
  documentRef.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    if (button.id === 'startGameBtn') {
      button.disabled = false;
      button.removeAttribute('aria-disabled');
    }
    button.style.touchAction = 'manipulation';
  });
}

function readRoute122(documentRef: Document): StabilityRoute122 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.classList.contains('route-field-121') || body.classList.contains('route-field-120')) return 'field';
  if (body.classList.contains('town-active') || body.classList.contains('route-town-121') || body.classList.contains('route-town-120')) return 'town';
  if (body.classList.contains('prestart-login-120') || body.classList.contains('route-login-121') || body.classList.contains('route-login-120')) return 'login';
  return 'title';
}

function countVisibleScenes122(documentRef: Document) {
  return ['#titleScreen', '#loginScreen', '#townScreen', '#game-root']
    .map((selector) => documentRef.querySelector<HTMLElement>(selector))
    .filter((node): node is HTMLElement => Boolean(node))
    .filter((node) => node.offsetParent !== null && node.style.visibility !== 'hidden' && node.style.opacity !== '0')
    .length;
}

function overlap122(a: DOMRect, b: DOMRect, gap: number) {
  return !(a.right + gap <= b.left || b.right + gap <= a.left || a.bottom + gap <= b.top || b.bottom + gap <= a.top);
}
