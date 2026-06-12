import type { HealthLevel } from './technicalHealth';

export interface ViewportLockReport117 {
  level: HealthLevel;
  locked: boolean;
  width: number;
  height: number;
  currentWidth: number;
  currentHeight: number;
  resizeIgnored: number;
  message: string;
  hint: string;
}

type ViewportLockOptions117 = {
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
};

type LockedViewport117 = {
  width: number;
  height: number;
  dpr: number;
  orientation: 'portrait' | 'landscape' | 'square';
  capturedAt: number;
};

const MIN_W_117 = 280;
const MIN_H_117 = 480;
const MAX_W_117 = 720;
const MAX_H_117 = 1180;

let installed117 = false;
let lockedViewport117: LockedViewport117 | null = null;
let resizeIgnored117 = 0;
let lastSync117 = 0;

/**
 * Alpha 1.17: 실행 순간의 화면 크기를 게임 기준 크기로 고정합니다.
 * 모바일 주소창 접힘, 브라우저 회전, visualViewport 리사이즈가 들어와도
 * 레이아웃 기준값을 다시 계산하지 않아 UI가 갑자기 움직이거나 돌아가지 않게 합니다.
 */
export function installViewportLock117(root: Document = document, options: ViewportLockOptions117 = {}) {
  if (!installed117) {
    installed117 = true;
    lockedViewport117 = captureViewport117(root);
    root.documentElement.classList.add('viewport-lock-root-117');
    root.body.classList.add('viewport-lock-117', 'no-orientation-shift-117');
    root.body.dataset.viewportLock117 = 'locked';
    normalizeOrientationMeta117(root);
    applyViewportLock117(root, options);

    const markIgnoredResize = () => {
      resizeIgnored117 += 1;
      applyViewportLock117(root, options, true);
    };

    window.addEventListener('resize', markIgnoredResize, { passive: true });
    window.addEventListener('orientationchange', markIgnoredResize, { passive: true });
    window.visualViewport?.addEventListener('resize', markIgnoredResize, { passive: true });
    root.addEventListener('visibilitychange', () => applyViewportLock117(root, options, true));
    window.setTimeout(() => applyViewportLock117(root, options, true), 120);
    window.setTimeout(() => applyViewportLock117(root, options, true), 900);
  }
  return inspectViewportLock117(root);
}

/** 현재 잠금 크기를 다시 CSS 변수와 주요 루트 요소에 주입합니다. */
export function syncViewportLock117(root: Document = document, options: ViewportLockOptions117 = {}) {
  applyViewportLock117(root, options, true);
  return inspectViewportLock117(root);
}

/** PixiJS 초기화에서도 같은 고정 크기를 쓰기 위한 안전한 getter입니다. */
export function getLockedViewport117(root: Document = document) {
  if (!lockedViewport117) lockedViewport117 = captureViewport117(root);
  return { ...lockedViewport117 };
}

export function inspectViewportLock117(root: Document = document): ViewportLockReport117 {
  const lock = getLockedViewport117(root);
  const current = readCurrentViewport117(root);
  const changed = Math.abs(current.width - lock.width) > 2 || Math.abs(current.height - lock.height) > 2;
  const level: HealthLevel = lock.width >= MIN_W_117 && lock.height >= MIN_H_117 ? 'ok' : 'warn';
  const message = changed
    ? `실행 크기 고정 ${lock.width}×${lock.height}`
    : `실행 크기 유지 ${lock.width}×${lock.height}`;
  const hint = `current ${Math.round(current.width)}×${Math.round(current.height)} · ignored resize ${resizeIgnored117} · ${lock.orientation}`;
  return {
    level,
    locked: true,
    width: lock.width,
    height: lock.height,
    currentWidth: Math.round(current.width),
    currentHeight: Math.round(current.height),
    resizeIgnored: resizeIgnored117,
    message,
    hint
  };
}

function captureViewport117(root: Document): LockedViewport117 {
  const current = readCurrentViewport117(root);
  const width = clamp117(Math.round(current.width), MIN_W_117, MAX_W_117);
  const height = clamp117(Math.round(current.height), MIN_H_117, MAX_H_117);
  const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
  return {
    width,
    height,
    dpr: Math.max(1, Math.min(window.devicePixelRatio || 1, 2)),
    orientation,
    capturedAt: Date.now()
  };
}

function readCurrentViewport117(root: Document) {
  const vv = window.visualViewport;
  const width = vv?.width || window.innerWidth || root.documentElement.clientWidth || 360;
  const height = vv?.height || window.innerHeight || root.documentElement.clientHeight || 740;
  return { width, height };
}

function applyViewportLock117(root: Document, options: ViewportLockOptions117 = {}, fromResize = false) {
  const now = performance.now();
  if (fromResize && now - lastSync117 < 16) return;
  lastSync117 = now;
  const lock = getLockedViewport117(root);
  const docEl = root.documentElement;
  const body = root.body;
  const current = readCurrentViewport117(root);
  const scale = Math.min(1, current.width / lock.width, current.height / lock.height);

  docEl.style.setProperty('--so117-lock-w', `${lock.width}px`);
  docEl.style.setProperty('--so117-lock-h', `${lock.height}px`);
  docEl.style.setProperty('--so117-vw', `${lock.width}px`);
  docEl.style.setProperty('--so117-vh', `${lock.height}px`);
  docEl.style.setProperty('--so117-scale', String(Math.max(0.72, Math.round(scale * 1000) / 1000)));
  docEl.style.setProperty('--so-vh', `${lock.height / 100}px`);
  docEl.style.setProperty('--app-height', `${lock.height}px`);
  docEl.style.setProperty('--app-width', `${lock.width}px`);
  body.dataset.viewportLock117 = 'locked';
  body.dataset.viewportOrientation117 = lock.orientation;
  body.classList.add('viewport-lock-117', 'no-orientation-shift-117');
  body.classList.remove('landscape-guard-103', 'landscape-block-105', 'maintenance-landscape-109', 'so108-portrait-warn', 'forced-landscape-safe');

  const nodes = [options.root, options.titleScreen, options.loginScreen, options.townScreen, options.gameRoot, root.querySelector<HTMLElement>('#app')]
    .filter((node): node is HTMLElement => Boolean(node));
  nodes.forEach((node) => {
    node.style.setProperty('--so117-local-w', `${lock.width}px`);
    node.style.setProperty('--so117-local-h', `${lock.height}px`);
  });
}

function normalizeOrientationMeta117(root: Document) {
  setMeta117(root, 'viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  setMeta117(root, 'screen-orientation', 'any');
  setMeta117(root, 'x5-orientation', 'auto');
  setMeta117(root, 'x5-fullscreen', 'false');
  setMeta117(root, 'full-screen', 'no');
}

function setMeta117(root: Document, name: string, content: string) {
  let meta = root.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = root.createElement('meta');
    meta.name = name;
    root.head.appendChild(meta);
  }
  meta.content = content;
}

function clamp117(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
