import { getPortraitFrame137, syncPortraitGuard137 } from '../core/PortraitGuard';
export type RecoveryRoute120 = 'title' | 'login' | 'town' | 'field';

type RecoveryTargets120 = {
  appShell?: HTMLElement | null;
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
};

type SoulWindow120 = Window & {
  SOUL_PRESTART_ROUTE_120?: RecoveryRoute120;
  SOUL_RECOVERY_BOOTED_120?: boolean;
  SOUL_RECOVERY_STARTED_AT_120?: number;
};

let installed120 = false;
let locked120 = false;
let lockedWidth120 = 0;
let lockedHeight120 = 0;

export function installRecoveryKernel120(documentRef: Document, targets: RecoveryTargets120) {
  if (installed120) return;
  installed120 = true;
  const win = documentRef.defaultView as SoulWindow120 | null;
  if (!win) return;
  win.SOUL_RECOVERY_BOOTED_120 = true;
  win.SOUL_RECOVERY_STARTED_AT_120 = Date.now();
  documentRef.documentElement.classList.add('soul-recovery-kernel-120');
  documentRef.body.classList.add('recovery-kernel-120');
  lockInitialViewport120(documentRef, targets);

  targets.startButton.disabled = false;
  targets.startButton.removeAttribute('aria-disabled');
  targets.startButton.dataset.recoveryReady120 = 'true';

  const initialRoute = win.SOUL_PRESTART_ROUTE_120 || (documentRef.body.classList.contains('prestart-login-120') ? 'login' : 'title');
  syncRecoveryRoute120(documentRef, initialRoute, targets);

  win.addEventListener('error', () => {
    documentRef.body.classList.add('recovery-runtime-warning-120');
  });
  win.addEventListener('unhandledrejection', () => {
    documentRef.body.classList.add('recovery-runtime-warning-120');
  });

  // 주소창 접힘, 회전, visualViewport 변경이 와도 게임 기준 크기를 다시 잡지 않는다.
  const keep = () => lockInitialViewport120(documentRef, targets);
  win.addEventListener('resize', keep, { passive: true });
  win.addEventListener('orientationchange', keep, { passive: true });
  win.visualViewport?.addEventListener('resize', keep, { passive: true });
}

export function lockInitialViewport120(documentRef: Document, targets?: Partial<RecoveryTargets120>) {
  const win = documentRef.defaultView;
  if (!win) return;

  // 1.37: 인앱/가로 viewport에서는 기존의 단순 width/height 고정 대신 PortraitGuard의 세로 프레임을 우선한다.
  const frame137 = getPortraitFrame137(documentRef);
  if (documentRef.body.classList.contains('portrait-guard-137') || frame137.inApp || frame137.landscape) {
    syncPortraitGuard137(documentRef, targets);
    lockedWidth120 = frame137.width;
    lockedHeight120 = frame137.height;
    locked120 = true;
  } else if (!locked120) {
    const visual = win.visualViewport;
    lockedWidth120 = Math.max(320, Math.round(visual?.width || win.innerWidth || documentRef.documentElement.clientWidth || 360));
    lockedHeight120 = Math.max(520, Math.round(visual?.height || win.innerHeight || documentRef.documentElement.clientHeight || 720));
    locked120 = true;
  }

  const appWidth = Math.min(480, lockedWidth120);
  const root = documentRef.documentElement;
  root.style.setProperty('--soul-locked-w-120', `${appWidth}px`);
  root.style.setProperty('--soul-locked-h-120', `${lockedHeight120}px`);
  root.style.setProperty('--soul-current-w', `${appWidth}px`);
  root.style.setProperty('--soul-current-h', `${lockedHeight120}px`);
  root.style.setProperty('--soul-boot-w', `${appWidth}px`);
  root.style.setProperty('--soul-boot-h', `${lockedHeight120}px`);
  const app = targets?.appShell || documentRef.querySelector<HTMLElement>('#app');
  if (app) {
    app.style.width = `${appWidth}px`;
    app.style.height = `${lockedHeight120}px`;
  }
}

export function syncRecoveryRoute120(documentRef: Document, route: RecoveryRoute120, targets: RecoveryTargets120) {
  const win = documentRef.defaultView as SoulWindow120 | null;
  if (win) win.SOUL_PRESTART_ROUTE_120 = route;
  documentRef.body.classList.remove(
    'route-title-119', 'route-login-119', 'route-town-119', 'route-field-119',
    'route-title-120', 'route-login-120', 'route-town-120', 'route-field-120',
    'field-active', 'town-active'
  );
  documentRef.body.classList.add(`route-${route}-120`);
  if (route === 'title') documentRef.body.classList.add('route-title-119');
  if (route === 'login') documentRef.body.classList.add('route-login-119');
  if (route === 'town') {
    documentRef.body.classList.add('route-town-119', 'town-active');
  }
  if (route === 'field') documentRef.body.classList.add('field-active');

  setVisible120(targets.titleScreen, route === 'title');
  setVisible120(targets.loginScreen, route === 'login');
  setVisible120(targets.townScreen, route === 'town');
  targets.gameRoot.classList.toggle('hidden', route !== 'field');
  targets.gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');
  documentRef.body.classList.toggle('prestart-login-120', route === 'login');
  lockInitialViewport120(documentRef, targets);
}

export function showLoginNow120(documentRef: Document, targets: RecoveryTargets120) {
  documentRef.body.classList.add('boot-interactive-120');
  syncRecoveryRoute120(documentRef, 'login', targets);
}

export function inspectRecoveryKernel120(documentRef: Document) {
  const body = documentRef.body;
  const route = body.classList.contains('route-field-120') || body.classList.contains('field-active')
    ? 'field'
    : body.classList.contains('route-town-120') || body.classList.contains('town-active')
      ? 'town'
      : body.classList.contains('route-login-120') || body.classList.contains('route-login-119')
        ? 'login'
        : 'title';
  return {
    label: '1.20 복구 커널',
    ok: installed120,
    message: installed120
      ? `초기 실행 경로 ${route} · 고정 ${lockedWidth120 || 0}x${lockedHeight120 || 0}`
      : '복구 커널 미설치',
    route,
    locked: locked120
  };
}

function setVisible120(el: HTMLElement, visible: boolean) {
  el.classList.toggle('hidden', !visible);
  el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  el.style.display = visible ? '' : 'none';
  el.style.opacity = visible ? '1' : '0';
  el.style.visibility = visible ? 'visible' : 'hidden';
  el.style.pointerEvents = visible ? 'auto' : 'none';
}
