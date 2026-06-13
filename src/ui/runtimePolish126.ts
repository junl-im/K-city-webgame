export type RuntimePolishReport126 = {
  label: string;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
};

type RuntimeRoute126 = 'title' | 'login' | 'town' | 'field';

type RuntimeOptions126 = {
  appShell?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

type SoulRuntimeWindow126 = Window & {
  SOUL_RUNTIME_POLISH_126?: boolean;
  SOUL_RUNTIME_ROUTE_126?: RuntimeRoute126;
};

let installed126 = false;
let lastRoute126: RuntimeRoute126 = 'title';
let repairCount126 = 0;
let orphanCanvasRemoved126 = 0;
let ghostLayerHidden126 = 0;
let lastRepairAt126 = 0;
let lastMessage126 = '대기';
let lastWarn126 = '';
let scheduled126 = 0;

const GHOST_SELECTOR_126 = [
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

const TOUCH_SELECTOR_126 = [
  '#startGameBtn',
  '#guestLoginBtn',
  '#googleLoginBtn',
  '#localLoginBtn',
  '#serverNextBtn',
  '#characterNextBtn',
  '#connectCharacterBtn',
  '#newCharacterBtn',
  '#returnTownBtn',
  '#attackBtn',
  '#hpPotionBtn',
  '#mpPotionBtn',
  '#inventoryBtn',
  '#cardsBtn',
  '#miniMapToggle',
  '[data-skill-slot]',
  '[data-zone-id]',
  '[data-town-zone-enter]',
  '[data-town-content]',
  '.town-action-btn',
  '.quick-action-btn'
].join(',');

export function installRuntimePolish126(documentRef: Document, options: RuntimeOptions126 = {}) {
  if (installed126) {
    repairRuntime126(documentRef, options);
    return inspectRuntimePolish126(documentRef);
  }
  installed126 = true;
  const win = documentRef.defaultView as SoulRuntimeWindow126 | null;
  if (win) win.SOUL_RUNTIME_POLISH_126 = true;

  documentRef.documentElement.classList.add('soul-runtime-polish-126');
  documentRef.body.classList.add('fantasy-ui-126', 'runtime-polish-126', 'boot-safe-126', 'single-2p5d-runtime-126');
  documentRef.body.dataset.alphaVersion = '1.26.0';

  const schedule = () => scheduleRuntimeRepair126(documentRef, options, 90);
  win?.addEventListener('pageshow', schedule, { passive: true });
  win?.addEventListener('visibilitychange', schedule, { passive: true });
  win?.addEventListener('resize', schedule, { passive: true });
  win?.addEventListener('orientationchange', () => scheduleRuntimeRepair126(documentRef, options, 180), { passive: true });
  documentRef.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest?.<HTMLElement>(TOUCH_SELECTOR_126);
    if (!button) return;
    button.dataset.lastPointer126 = String(Math.round(performance.now()));
  }, { passive: true, capture: true });

  repairRuntime126(documentRef, options);
  win?.setTimeout(() => repairRuntime126(documentRef, options), 260);
  win?.setTimeout(() => repairRuntime126(documentRef, options), 1600);
  return inspectRuntimePolish126(documentRef);
}

export function syncRuntimeRoute126(documentRef: Document, route: RuntimeRoute126, options: RuntimeOptions126 = {}) {
  lastRoute126 = route;
  const win = documentRef.defaultView as SoulRuntimeWindow126 | null;
  if (win) win.SOUL_RUNTIME_ROUTE_126 = route;
  documentRef.body.classList.remove('route-title-126', 'route-login-126', 'route-town-126', 'route-field-126');
  documentRef.body.classList.add(`route-${route}-126`);
  repairRouteVisibility126(documentRef, route, options);
  scheduleRuntimeRepair126(documentRef, options, 80);
}

export function repairRuntime126(documentRef: Document, options: RuntimeOptions126 = {}) {
  repairCount126 += 1;
  lastRepairAt126 = performance.now();
  const route = inferRoute126(documentRef);
  lastRoute126 = route;
  clampAppShell126(documentRef, options.appShell || documentRef.querySelector<HTMLElement>('#app'));
  repairRouteVisibility126(documentRef, route, options);
  repairTouchTargets126(documentRef);
  ghostLayerHidden126 += hideGhostLayers126(documentRef);
  orphanCanvasRemoved126 += pruneOrphanCanvases126(options.gameRoot || documentRef.querySelector<HTMLElement>('#game-root'));
  documentRef.body.classList.toggle('runtime-canvas-pruned-126', orphanCanvasRemoved126 > 0);
  lastMessage126 = `${route} · repair ${repairCount126}`;
  return inspectRuntimePolish126(documentRef);
}

export function inspectRuntimePolish126(documentRef: Document): RuntimePolishReport126 {
  const route = inferRoute126(documentRef);
  const canvases = documentRef.querySelectorAll('#game-root canvas').length;
  const level: 'ok' | 'warn' = !installed126 || canvases > 1 || Boolean(lastWarn126) ? 'warn' : 'ok';
  return {
    label: '1.26 런타임 다듬기',
    level,
    message: installed126 ? `${lastMessage126} · canvas ${canvases}` : '미설치',
    hint: `route ${route} · orphan ${orphanCanvasRemoved126} · ghost ${ghostLayerHidden126} · ${Math.round(lastRepairAt126 || 0)}ms${lastWarn126 ? ` · ${lastWarn126}` : ''}`
  };
}

function scheduleRuntimeRepair126(documentRef: Document, options: RuntimeOptions126, delay: number) {
  const win = documentRef.defaultView;
  if (!win) return;
  if (scheduled126) win.clearTimeout(scheduled126);
  scheduled126 = win.setTimeout(() => {
    scheduled126 = 0;
    repairRuntime126(documentRef, options);
  }, delay);
}

function inferRoute126(documentRef: Document): RuntimeRoute126 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.classList.contains('route-field-126')) return 'field';
  if (body.classList.contains('town-active') || body.classList.contains('route-town-126')) return 'town';
  if (body.classList.contains('prestart-login-120') || body.classList.contains('route-login-120') || body.classList.contains('route-login-121') || body.classList.contains('route-login-122') || body.classList.contains('route-login-126')) return 'login';
  return 'title';
}

function repairRouteVisibility126(documentRef: Document, route: RuntimeRoute126, options: RuntimeOptions126) {
  const title = options.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = options.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = options.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const gameRoot = options.gameRoot || documentRef.querySelector<HTMLElement>('#game-root');
  documentRef.body.classList.remove('route-title-126', 'route-login-126', 'route-town-126', 'route-field-126');
  documentRef.body.classList.add(`route-${route}-126`);

  setVisible126(title, route === 'title');
  setVisible126(login, route === 'login');
  setVisible126(town, route === 'town');
  if (gameRoot) gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');
}

function setVisible126(node: HTMLElement | null, visible: boolean) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  if (visible) {
    node.style.removeProperty('display');
    node.style.removeProperty('opacity');
    node.style.removeProperty('visibility');
    node.style.removeProperty('pointer-events');
  } else {
    node.style.display = 'none';
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
  }
}

function clampAppShell126(documentRef: Document, appShell: HTMLElement | null) {
  if (!appShell) return;
  const root = documentRef.documentElement;
  if (!root.style.getPropertyValue('--soul-locked-w-120')) {
    const win = documentRef.defaultView;
    const vv = win?.visualViewport;
    const w = Math.max(320, Math.round((vv?.width || win?.innerWidth || 360)));
    root.style.setProperty('--soul-locked-w-120', `${Math.min(480, w)}px`);
  }
  if (!root.style.getPropertyValue('--soul-locked-h-120')) {
    const win = documentRef.defaultView;
    const vv = win?.visualViewport;
    const h = Math.max(520, Math.round((vv?.height || win?.innerHeight || 720)));
    root.style.setProperty('--soul-locked-h-120', `${h}px`);
  }
  appShell.style.maxWidth = '480px';
}

function repairTouchTargets126(documentRef: Document) {
  documentRef.querySelectorAll<HTMLElement>(TOUCH_SELECTOR_126).forEach((node) => {
    node.style.touchAction = 'manipulation';
    node.style.setProperty('-webkit-tap-highlight-color', 'transparent');
    node.dataset.touchReady126 = '1';
  });
}

function hideGhostLayers126(documentRef: Document) {
  let hidden = 0;
  documentRef.querySelectorAll<HTMLElement>(GHOST_SELECTOR_126).forEach((node) => {
    if (node.dataset.keepGhost126 === '1') return;
    if (node.style.display !== 'none') hidden += 1;
    node.style.display = 'none';
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
  });
  return hidden;
}

function pruneOrphanCanvases126(gameRoot: HTMLElement | null) {
  if (!gameRoot) return 0;
  const canvases = Array.from(gameRoot.querySelectorAll<HTMLCanvasElement>('canvas'));
  if (canvases.length <= 1) return 0;
  let removed = 0;
  canvases.slice(0, -1).forEach((canvas) => {
    canvas.remove();
    removed += 1;
  });
  return removed;
}
