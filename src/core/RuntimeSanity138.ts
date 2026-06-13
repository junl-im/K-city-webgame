import type { HealthLevel } from '../ui/technicalHealth';

export type SoulRoute138 = 'title' | 'login' | 'town' | 'field';

export interface RuntimeSanityTargets138 {
  appShell?: HTMLElement | null;
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | HTMLElement | null;
}

export interface RuntimeSanityFrame138 {
  baseWidth: number;
  baseHeight: number;
  liveWidth: number;
  liveHeight: number;
  scale: number;
  landscape: boolean;
  inApp: boolean;
  apiSuppressed: boolean;
}

export interface RuntimeSanityReport138 extends RuntimeSanityFrame138 {
  level: HealthLevel;
  message: string;
  hint: string;
  route: SoulRoute138;
  visibleScenes: number;
  canvasCount: number;
  automaticWorkflowCount?: number;
}

type SoulWindow138 = Window & {
  SOUL_INAPP_CSS_ONLY_137?: boolean;
  SOUL_SUPPRESS_VIEWPORT_APIS_137?: boolean;
  SOUL_PORTRAIT_FRAME_137?: { width: number; height: number; liveWidth?: number; liveHeight?: number; landscape?: boolean; inApp?: boolean };
  SOUL_RUNTIME_SANITY_138?: boolean;
  SOUL_PORTRAIT_BASE_138?: { width: number; height: number };
  SOUL_PORTRAIT_FRAME_138?: RuntimeSanityFrame138;
  SOUL_ROUTE_TO_138?: (route: SoulRoute138) => void;
  SOUL_SYNC_RUNTIME_138?: () => RuntimeSanityReport138;
};

const INAPP_RE_138 = /KAKAOTALK|KAKAOSTORY|DaumApps|NAVER\(|FBAN|FBAV|Instagram|Line\/|; wv\)|\bwv\b|Twitter|EverytimeApp|Whale\//i;
const MIN_W_138 = 220;
const MAX_W_138 = 480;
const MIN_H_138 = 360;
const WATCHDOG_MS_138 = 1200;
const WATCHDOG_LIMIT_138 = 28;

let installed138 = false;
let watchdogCount138 = 0;
let watchdogTimer138 = 0;
let targets138: RuntimeSanityTargets138 = {};
let originalRequestFullscreen138: ((options?: FullscreenOptions) => Promise<void>) | null = null;

export function isInAppBrowser138(win: Window = window): boolean {
  const nav = win.navigator;
  const ua = `${nav.userAgent || ''} ${(nav as Navigator & { vendor?: string }).vendor || ''}`;
  return INAPP_RE_138.test(ua);
}

export function installRuntimeSanity138(root: Document = document, targets: RuntimeSanityTargets138 = {}): RuntimeSanityReport138 {
  targets138 = { ...targets138, ...targets };
  const win = root.defaultView as SoulWindow138 | null;
  if (!win) return inspectRuntimeSanity138(root, targets138);

  if (!installed138) {
    installed138 = true;
    win.SOUL_RUNTIME_SANITY_138 = true;
    win.SOUL_ROUTE_TO_138 = (route: SoulRoute138) => routeTo138(route, root, targets138);
    win.SOUL_SYNC_RUNTIME_138 = () => inspectRuntimeSanity138(root, targets138);

    root.documentElement.classList.add('runtime-sanity-root-138');
    root.body.classList.add('runtime-sanity-138', 'portrait-cage-138', 'visual-quality-preserved-138');

    suppressViewportApisForInApp138(win, root);
    syncRuntimeSanity138(root, targets138);

    const schedule = () => window.setTimeout(() => syncRuntimeSanity138(root, targets138), 0);
    win.addEventListener('resize', schedule, { passive: true });
    win.addEventListener('orientationchange', schedule, { passive: true });
    win.visualViewport?.addEventListener('resize', schedule, { passive: true });
    root.addEventListener('visibilitychange', schedule);
    startWatchdog138(root, targets138);
  }

  return inspectRuntimeSanity138(root, targets138);
}

export function syncRuntimeSanity138(root: Document = document, targets: RuntimeSanityTargets138 = {}): RuntimeSanityFrame138 {
  targets138 = { ...targets138, ...targets };
  const frame = syncPortraitCage138(root, targets138);
  reconcileRoute138(root, targets138);
  reviveCriticalControls138(root, targets138);
  cleanupDuplicateCanvas138(root, targets138);
  return frame;
}

export function routeTo138(route: SoulRoute138, root: Document = document, targets: RuntimeSanityTargets138 = {}): void {
  targets138 = { ...targets138, ...targets };
  applyRouteClasses138(root.body, route);
  applySceneVisibility138(route, root, targets138);
  reviveCriticalControls138(root, targets138);
  syncPortraitCage138(root, targets138);
}

export function inspectRuntimeSanity138(root: Document = document, targets: RuntimeSanityTargets138 = {}): RuntimeSanityReport138 {
  const frame = syncRuntimeSanity138(root, targets);
  const route = currentRoute138(root);
  const visibleScenes = visibleSceneCount138(root, targets);
  const canvasCount = (targets.gameRoot || root.querySelector('#game-root'))?.querySelectorAll('canvas').length || 0;
  const startReady = Boolean((targets.startButton || root.querySelector('#startGameBtn')) && !(targets.startButton as HTMLButtonElement | null)?.disabled);
  const routeOk = visibleScenes <= 1 || route === 'field';
  const level: HealthLevel = frame.baseWidth >= MIN_W_138 && frame.baseHeight >= MIN_H_138 && routeOk && canvasCount <= 1 ? 'ok' : 'warn';
  const message = frame.inApp
    ? '인앱 CSS-only 세로 고정'
    : frame.landscape
      ? '가로 viewport 안 세로 프레임'
      : '세로 프레임 정상';
  const hint = `route ${route} · frame ${frame.baseWidth}x${frame.baseHeight} · live ${frame.liveWidth}x${frame.liveHeight} · scale ${frame.scale.toFixed(2)} · scenes ${visibleScenes} · canvas ${canvasCount} · start ${startReady ? 'ready' : 'repairing'}`;
  return { ...frame, level, message, hint, route, visibleScenes, canvasCount };
}

function syncPortraitCage138(root: Document, targets: RuntimeSanityTargets138): RuntimeSanityFrame138 {
  const win = root.defaultView as SoulWindow138 | null;
  const vv = win?.visualViewport;
  const liveWidth = Math.max(1, Math.round(vv?.width || win?.innerWidth || root.documentElement.clientWidth || 360));
  const liveHeight = Math.max(1, Math.round(vv?.height || win?.innerHeight || root.documentElement.clientHeight || 740));
  const landscape = liveWidth > liveHeight;
  const inApp = win ? isInAppBrowser138(win) || Boolean(win.SOUL_INAPP_CSS_ONLY_137) : false;

  if (win && !win.SOUL_PORTRAIT_BASE_138) {
    const frame137 = win.SOUL_PORTRAIT_FRAME_137;
    const seedW = Math.round(frame137?.width || (landscape ? Math.min(390, Math.floor(Math.max(liveWidth, liveHeight) * 9 / 16)) : liveWidth));
    const seedH = Math.round(frame137?.height || (landscape ? Math.max(liveWidth, liveHeight) : liveHeight));
    const baseWidth = Math.max(MIN_W_138, Math.min(MAX_W_138, seedW));
    const minPortraitHeight = Math.max(MIN_H_138, Math.round(baseWidth * 16 / 9));
    const baseHeight = Math.max(minPortraitHeight, seedH);
    win.SOUL_PORTRAIT_BASE_138 = { width: baseWidth, height: baseHeight };
  }

  const base = win?.SOUL_PORTRAIT_BASE_138 || { width: Math.max(MIN_W_138, Math.min(MAX_W_138, liveWidth)), height: Math.max(MIN_H_138, liveHeight) };
  const scale = Math.max(0.35, Math.min(1, liveWidth / base.width, liveHeight / base.height));
  const frame: RuntimeSanityFrame138 = {
    baseWidth: Math.round(base.width),
    baseHeight: Math.round(base.height),
    liveWidth,
    liveHeight,
    scale: Number(scale.toFixed(4)),
    landscape,
    inApp,
    apiSuppressed: inApp
  };

  if (win) {
    win.SOUL_PORTRAIT_FRAME_138 = frame;
    win.SOUL_SUPPRESS_VIEWPORT_APIS_137 = inApp || Boolean(win.SOUL_SUPPRESS_VIEWPORT_APIS_137);
    if (inApp) win.SOUL_INAPP_CSS_ONLY_137 = true;
  }

  const html = root.documentElement;
  const body = root.body;
  html.classList.add('runtime-sanity-root-138');
  body.classList.add('runtime-sanity-138', 'portrait-cage-138', 'visual-quality-preserved-138');
  html.classList.toggle('inapp-css-only-138', inApp);
  body.classList.toggle('inapp-css-only-138', inApp);
  html.classList.toggle('landscape-cage-138', landscape);
  body.classList.toggle('landscape-cage-138', landscape);
  body.classList.toggle('portrait-live-138', !landscape);
  body.dataset.portraitGuard138 = inApp ? 'inapp-css-only' : landscape ? 'landscape-cage' : 'normal-portrait';

  html.style.setProperty('--soul-portrait-base-w-138', `${frame.baseWidth}px`);
  html.style.setProperty('--soul-portrait-base-h-138', `${frame.baseHeight}px`);
  html.style.setProperty('--soul-portrait-scale-138', `${frame.scale}`);
  html.style.setProperty('--soul-portrait-live-w-138', `${frame.liveWidth}px`);
  html.style.setProperty('--soul-portrait-live-h-138', `${frame.liveHeight}px`);
  html.style.setProperty('--soul-portrait-frame-w', `${frame.baseWidth}px`);
  html.style.setProperty('--soul-portrait-frame-h', `${frame.baseHeight}px`);
  html.style.setProperty('--soul-locked-w-120', `${frame.baseWidth}px`);
  html.style.setProperty('--soul-locked-h-120', `${frame.baseHeight}px`);

  const app = targets.appShell || root.querySelector<HTMLElement>('#app');
  if (app) {
    app.style.width = `${frame.baseWidth}px`;
    app.style.height = `${frame.baseHeight}px`;
    app.style.transform = `translate3d(-50%, -50%, 0) scale(${frame.scale})`;
  }

  root.querySelectorAll<HTMLElement>('#townFullscreenBtn,[data-action="fullscreen"],.fullscreen-btn,.orientation-guard,.orientation-lock,.rotate-device').forEach((node) => {
    if (inApp || node.matches('.orientation-guard,.orientation-lock,.rotate-device')) {
      node.setAttribute('aria-hidden', 'true');
      node.setAttribute('tabindex', '-1');
    }
  });

  return frame;
}

function suppressViewportApisForInApp138(win: SoulWindow138, root: Document) {
  if (!isInAppBrowser138(win)) return;
  win.SOUL_INAPP_CSS_ONLY_137 = true;
  win.SOUL_SUPPRESS_VIEWPORT_APIS_137 = true;
  root.documentElement.classList.add('inapp-css-only-138');
  root.body.classList.add('inapp-css-only-138', 'viewport-api-suppressed-138');

  const proto = Element.prototype as Element & { requestFullscreen?: (options?: FullscreenOptions) => Promise<void> };
  if (!originalRequestFullscreen138 && typeof proto.requestFullscreen === 'function') {
    originalRequestFullscreen138 = proto.requestFullscreen;
    try {
      proto.requestFullscreen = function requestFullscreenSuppressed138() {
        return Promise.resolve();
      };
    } catch {
      // Some browsers expose requestFullscreen as read-only. In that case the game still avoids calling it.
    }
  }
}

function reconcileRoute138(root: Document, targets: RuntimeSanityTargets138) {
  const body = root.body;
  const forced = (body.dataset.soulRoute138 as SoulRoute138 | undefined) || undefined;
  let route: SoulRoute138 = forced || 'title';
  if (!forced) {
    if (body.classList.contains('field-active') || !isHidden138(targets.gameRoot || root.querySelector('#game-root'))) route = 'field';
    else if (body.classList.contains('town-active') || body.classList.contains('route-town-137')) route = 'town';
    else if (body.classList.contains('prestart-login-120') || body.classList.contains('route-login-137') || body.classList.contains('route-login-138')) route = 'login';
  }
  applyRouteClasses138(body, route);
  applySceneVisibility138(route, root, targets);
}

function currentRoute138(root: Document): SoulRoute138 {
  const body = root.body;
  if (body.classList.contains('route-field-138')) return 'field';
  if (body.classList.contains('route-town-138')) return 'town';
  if (body.classList.contains('route-login-138')) return 'login';
  return 'title';
}

function applyRouteClasses138(body: HTMLElement, route: SoulRoute138) {
  body.dataset.soulRoute138 = route;
  for (const name of Array.from(body.classList)) {
    if (/^route-(title|login|town|field)-13[3-8]$/.test(name) || /^route-(title|login|town|field)-12[0-9]$/.test(name)) {
      body.classList.remove(name);
    }
  }
  body.classList.add(`route-${route}-138`, `route-${route}-137`);
  if (route === 'login') body.classList.add('prestart-login-120');
  if (route !== 'login') body.classList.remove('prestart-login-120');
}

function applySceneVisibility138(route: SoulRoute138, root: Document, targets: RuntimeSanityTargets138) {
  const title = targets.titleScreen || root.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || root.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || root.querySelector<HTMLElement>('#townScreen');
  const gameRoot = targets.gameRoot || root.querySelector<HTMLElement>('#game-root');
  setScene138(title, route === 'title');
  setScene138(login, route === 'login');
  setScene138(town, route === 'town');
  setScene138(gameRoot, route === 'field');
  if (route === 'login') ensureLoginFlow138(root);
}

function setScene138(node: HTMLElement | null | undefined, visible: boolean) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  node.style.display = visible ? 'block' : 'none';
  node.style.opacity = visible ? '1' : '0';
  node.style.visibility = visible ? 'visible' : 'hidden';
  node.style.pointerEvents = visible ? 'auto' : 'none';
}

function ensureLoginFlow138(root: Document) {
  const active = root.querySelector<HTMLElement>('[data-flow-page].active');
  if (!active) {
    root.querySelectorAll<HTMLElement>('[data-flow-page]').forEach((page, index) => {
      const on = index === 0 || page.dataset.flowPage === 'login';
      page.classList.toggle('active', on);
      page.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }
  const status = root.querySelector<HTMLElement>('#loginStatus');
  if (status && !status.textContent?.trim()) status.textContent = '접속 방식을 선택하세요.';
}

function reviveCriticalControls138(root: Document, targets: RuntimeSanityTargets138) {
  const selectors = ['#startGameBtn', '#guestLoginBtn', '#googleLoginBtn', '#localLoginBtn', '#serverNextBtn', '#characterNextBtn', '#connectCharacterBtn', '#newCharacterBtn', '#enterTownBtn'];
  for (const selector of selectors) {
    const node = root.querySelector<HTMLButtonElement>(selector);
    if (!node) continue;
    node.disabled = false;
    node.removeAttribute('aria-disabled');
    node.style.pointerEvents = 'auto';
    if (selector === '#startGameBtn') {
      node.style.display = 'inline-flex';
      node.style.visibility = 'visible';
      node.style.opacity = '1';
    }
  }
  const start = targets.startButton || root.querySelector<HTMLElement>('#startGameBtn');
  if (start && !start.dataset.routeGuard138) {
    start.dataset.routeGuard138 = '1';
    start.addEventListener('click', (event) => {
      event.preventDefault();
      routeTo138('login', root, targets138);
    }, { passive: false });
  }
}

function cleanupDuplicateCanvas138(root: Document, targets: RuntimeSanityTargets138) {
  const gameRoot = targets.gameRoot || root.querySelector<HTMLElement>('#game-root');
  if (!gameRoot) return;
  const canvases = Array.from(gameRoot.querySelectorAll('canvas'));
  if (canvases.length <= 1) return;
  canvases.slice(0, -1).forEach((canvas) => canvas.remove());
  root.body.classList.add('canvas-dedupe-138');
}

function visibleSceneCount138(root: Document, targets: RuntimeSanityTargets138): number {
  const nodes = [targets.titleScreen || root.querySelector('#titleScreen'), targets.loginScreen || root.querySelector('#loginScreen'), targets.townScreen || root.querySelector('#townScreen'), targets.gameRoot || root.querySelector('#game-root')]
    .filter((node): node is HTMLElement => Boolean(node));
  return nodes.filter((node) => !isHidden138(node)).length;
}

function isHidden138(node: Element | null | undefined): boolean {
  if (!node) return true;
  const el = node as HTMLElement;
  if (el.classList.contains('hidden') || el.getAttribute('aria-hidden') === 'true') return true;
  const style = window.getComputedStyle(el);
  return style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0;
}

function startWatchdog138(root: Document, targets: RuntimeSanityTargets138) {
  window.clearTimeout(watchdogTimer138);
  watchdogCount138 = 0;
  const tick = () => {
    watchdogCount138 += 1;
    try {
      syncRuntimeSanity138(root, targets);
      if (visibleSceneCount138(root, targets) === 0) routeTo138('title', root, targets);
    } catch (error) {
      console.warn('[SoulOnline 1.38] runtime sanity watchdog skipped', error);
    }
    if (watchdogCount138 < WATCHDOG_LIMIT_138) watchdogTimer138 = window.setTimeout(tick, WATCHDOG_MS_138);
  };
  watchdogTimer138 = window.setTimeout(tick, WATCHDOG_MS_138);
}
