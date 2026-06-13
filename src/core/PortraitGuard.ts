import type { HealthLevel } from '../ui/technicalHealth';

export type PortraitGuardMode137 = 'normal-portrait' | 'inapp-css-only' | 'landscape-cage';

export interface PortraitFrame137 {
  width: number;
  height: number;
  liveWidth: number;
  liveHeight: number;
  landscape: boolean;
  inApp: boolean;
  mode: PortraitGuardMode137;
  apiSuppressed: boolean;
}

export interface PortraitGuardReport137 extends PortraitFrame137 {
  level: HealthLevel;
  message: string;
  hint: string;
}

export interface PortraitGuardTargets137 {
  appShell?: HTMLElement | null;
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | HTMLElement | null;
}

type SoulWindow137 = Window & {
  SOUL_PORTRAIT_GUARD_137?: boolean;
  SOUL_INAPP_CSS_ONLY_137?: boolean;
  SOUL_SUPPRESS_VIEWPORT_APIS_137?: boolean;
  SOUL_PORTRAIT_FRAME_137?: PortraitFrame137;
  SOUL_GET_PORTRAIT_FRAME_137?: () => PortraitFrame137;
  SOUL_SYNC_PORTRAIT_FRAME_137?: () => PortraitFrame137;
};

const INAPP_RE_137 = /KAKAOTALK|KAKAOSTORY|DaumApps|NAVER\(|FBAN|FBAV|Instagram|Line\/|; wv\)|\bwv\b|Twitter|EverytimeApp|Whale\//i;
const MIN_W_137 = 220;
const MAX_W_137 = 480;
const MIN_H_137 = 360;

let installed137 = false;
let lastFrame137: PortraitFrame137 | null = null;
let syncTimer137 = 0;
let targetCache137: PortraitGuardTargets137 = {};

export function isInAppBrowser137(win: Window = window): boolean {
  const nav = win.navigator;
  const ua = `${nav.userAgent || ''} ${(nav as Navigator & { vendor?: string }).vendor || ''}`;
  return INAPP_RE_137.test(ua);
}

export function shouldSuppressViewportApi137(win: Window = window): boolean {
  return isInAppBrowser137(win) || Boolean((win as SoulWindow137).SOUL_INAPP_CSS_ONLY_137);
}

export function computePortraitFrame137(root: Document = document): PortraitFrame137 {
  const win = root.defaultView as SoulWindow137 | null;
  const vv = win?.visualViewport;
  const liveWidth = Math.max(1, Math.round(vv?.width || win?.innerWidth || root.documentElement.clientWidth || 360));
  const liveHeight = Math.max(1, Math.round(vv?.height || win?.innerHeight || root.documentElement.clientHeight || 740));
  const landscape = liveWidth > liveHeight;
  const inApp = win ? isInAppBrowser137(win) : false;
  let width: number;
  let height: number;

  if (landscape) {
    // 가로가 된 브라우저 안에서도 게임은 회전하지 않고 세로 카드처럼 중앙에 남긴다.
    height = Math.max(MIN_H_137, liveHeight);
    width = Math.max(MIN_W_137, Math.min(MAX_W_137, Math.floor(height * 9 / 16), liveWidth));
    if (width > liveWidth) width = liveWidth;
    if (height > liveHeight) height = liveHeight;
  } else {
    width = Math.max(MIN_W_137, Math.min(MAX_W_137, liveWidth));
    height = Math.max(MIN_H_137, liveHeight);
  }

  const mode: PortraitGuardMode137 = inApp
    ? 'inapp-css-only'
    : landscape
      ? 'landscape-cage'
      : 'normal-portrait';

  return {
    width: Math.round(width),
    height: Math.round(height),
    liveWidth,
    liveHeight,
    landscape,
    inApp,
    mode,
    apiSuppressed: inApp
  };
}

export function getPortraitFrame137(root: Document = document): PortraitFrame137 {
  if (!lastFrame137) lastFrame137 = computePortraitFrame137(root);
  return { ...lastFrame137 };
}

export function installPortraitGuard137(root: Document = document, targets: PortraitGuardTargets137 = {}): PortraitGuardReport137 {
  targetCache137 = { ...targetCache137, ...targets };
  const win = root.defaultView as SoulWindow137 | null;
  if (!win) return inspectPortraitGuard137(root);

  if (!installed137) {
    installed137 = true;
    win.SOUL_PORTRAIT_GUARD_137 = true;
    win.SOUL_GET_PORTRAIT_FRAME_137 = () => getPortraitFrame137(root);
    win.SOUL_SYNC_PORTRAIT_FRAME_137 = () => syncPortraitGuard137(root, targetCache137);

    root.documentElement.classList.add('portrait-guard-root-137');
    root.body.classList.add('portrait-guard-137', 'portrait-cage-137', 'visual-quality-preserved-137');
    if (shouldSuppressViewportApi137(win)) {
      win.SOUL_INAPP_CSS_ONLY_137 = true;
      win.SOUL_SUPPRESS_VIEWPORT_APIS_137 = true;
      root.documentElement.classList.add('inapp-css-only-137');
      root.body.classList.add('inapp-css-only-137', 'viewport-api-suppressed-137');
    }

    normalizePortraitMeta137(root, shouldSuppressViewportApi137(win));
    const schedule = () => schedulePortraitSync137(root, targetCache137, 0);
    win.addEventListener('resize', schedule, { passive: true });
    win.addEventListener('orientationchange', schedule, { passive: true });
    win.visualViewport?.addEventListener('resize', schedule, { passive: true });
    root.addEventListener('visibilitychange', schedule);
  }

  return inspectPortraitGuard137(root, targets);
}

export function syncPortraitGuard137(root: Document = document, targets: PortraitGuardTargets137 = {}): PortraitFrame137 {
  targetCache137 = { ...targetCache137, ...targets };
  const win = root.defaultView as SoulWindow137 | null;
  const frame = computePortraitFrame137(root);
  lastFrame137 = frame;
  if (win) {
    win.SOUL_PORTRAIT_FRAME_137 = { ...frame };
    win.SOUL_INAPP_CSS_ONLY_137 = frame.inApp;
    win.SOUL_SUPPRESS_VIEWPORT_APIS_137 = frame.apiSuppressed;
  }

  const html = root.documentElement;
  const body = root.body;
  html.style.setProperty('--soul-portrait-frame-w', `${frame.width}px`);
  html.style.setProperty('--soul-portrait-frame-h', `${frame.height}px`);
  html.style.setProperty('--soul-portrait-live-w', `${frame.liveWidth}px`);
  html.style.setProperty('--soul-portrait-live-h', `${frame.liveHeight}px`);
  html.style.setProperty('--soul-locked-w-120', `${frame.width}px`);
  html.style.setProperty('--soul-locked-h-120', `${frame.height}px`);
  html.style.setProperty('--soul-current-w', `${frame.width}px`);
  html.style.setProperty('--soul-current-h', `${frame.height}px`);
  html.style.setProperty('--app-width', `${frame.width}px`);
  html.style.setProperty('--app-height', `${frame.height}px`);
  html.style.setProperty('--so-vh', `${frame.height / 100}px`);

  body.dataset.portraitGuard137 = frame.mode;
  body.dataset.viewportOrientation137 = frame.landscape ? 'landscape-caged' : 'portrait';
  body.classList.toggle('inapp-css-only-137', frame.inApp);
  body.classList.toggle('viewport-api-suppressed-137', frame.apiSuppressed);
  body.classList.toggle('landscape-cage-137', frame.landscape);
  body.classList.toggle('portrait-live-137', !frame.landscape);
  html.classList.toggle('inapp-css-only-137', frame.inApp);
  html.classList.toggle('landscape-cage-137', frame.landscape);

  const nodes = [targets.appShell, targets.root, targets.titleScreen, targets.loginScreen, targets.townScreen, targets.gameRoot, root.querySelector<HTMLElement>('#app')]
    .filter((node): node is HTMLElement => Boolean(node));
  for (const node of nodes) {
    node.style.setProperty('--soul-portrait-frame-w', `${frame.width}px`);
    node.style.setProperty('--soul-portrait-frame-h', `${frame.height}px`);
  }
  const app = targets.appShell || root.querySelector<HTMLElement>('#app');
  if (app) {
    app.style.width = `${frame.width}px`;
    app.style.height = `${frame.height}px`;
  }

  // 인앱 브라우저에서 전체화면 버튼은 터치할 때 viewport 재계산을 유발할 수 있으므로 조용히 숨긴다.
  root.querySelectorAll<HTMLElement>('#townFullscreenBtn,[data-action="fullscreen"],.fullscreen-btn').forEach((node) => {
    if (frame.inApp) {
      node.setAttribute('aria-hidden', 'true');
      node.setAttribute('tabindex', '-1');
    }
  });

  return frame;
}

export function inspectPortraitGuard137(root: Document = document, targets: PortraitGuardTargets137 = {}): PortraitGuardReport137 {
  const frame = syncPortraitGuard137(root, targets);
  const level: HealthLevel = frame.width >= MIN_W_137 && frame.height >= MIN_H_137 ? 'ok' : 'warn';
  const message = frame.inApp
    ? '인앱 CSS-only 세로 프레임'
    : frame.landscape
      ? '가로 viewport 안 세로 프레임 유지'
      : '세로 프레임 정상';
  const hint = `${frame.mode} · frame ${frame.width}x${frame.height} · live ${frame.liveWidth}x${frame.liveHeight} · api ${frame.apiSuppressed ? 'off' : 'safe'}`;
  return { ...frame, level, message, hint };
}

function schedulePortraitSync137(root: Document, targets: PortraitGuardTargets137, delay: number) {
  window.clearTimeout(syncTimer137);
  syncTimer137 = window.setTimeout(() => syncPortraitGuard137(root, targets), delay);
}

function normalizePortraitMeta137(root: Document, suppressApi: boolean) {
  setMeta137(root, 'viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  setMeta137(root, 'screen-orientation', suppressApi ? 'portrait' : 'portrait-primary');
  setMeta137(root, 'x5-orientation', 'portrait');
  setMeta137(root, 'x5-fullscreen', 'false');
  setMeta137(root, 'full-screen', 'no');
}

function setMeta137(root: Document, name: string, content: string) {
  let meta = root.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = root.createElement('meta');
    meta.name = name;
    root.head.appendChild(meta);
  }
  meta.content = content;
}
