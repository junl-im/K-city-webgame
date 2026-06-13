export type LoginRoute130 = 'title' | 'login' | 'town' | 'field';

export type LoginConnectionTargets130 = {
  appShell?: HTMLElement | null;
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
};

type SoulWindow130 = Window & {
  SOUL_LOGIN_RECOVERY_130?: boolean;
  SOUL_LOGIN_ROUTE_130?: LoginRoute130;
  SOUL_PRESTART_ROUTE_120?: string;
};

type Inspect130 = {
  message: string;
  level: 'ok' | 'warn' | 'danger';
  hint: string;
};

let installed130 = false;
let route130: LoginRoute130 = 'title';
let loginFallbacks130 = 0;
let correctedButtons130 = 0;
let correctedScenes130 = 0;
let lastAction130 = 'boot';
let lastError130 = '';
let lastClickAt130 = 0;
let watchdogTimer130 = 0;

const LOGIN_BUTTON_SELECTOR_130 = '#guestLoginBtn,#googleLoginBtn,#localLoginBtn,#serverNextBtn,#characterNextBtn,#connectCharacterBtn,#newCharacterBtn,#cancelCreateBtn';

export function installLoginConnection130(documentRef: Document, targets: LoginConnectionTargets130) {
  if (installed130) return inspectLoginConnection130(documentRef, targets);
  installed130 = true;
  const win = documentRef.defaultView as SoulWindow130 | null;
  route130 = readRoute130(documentRef);
  if (win) {
    win.SOUL_LOGIN_RECOVERY_130 = true;
    win.SOUL_LOGIN_ROUTE_130 = route130;
  }

  documentRef.documentElement.classList.add('soul-login-recovery-130');
  documentRef.body.classList.add('fantasy-ui-130', 'login-connection-130', 'visual-quality-preserved-130');
  documentRef.body.dataset.alphaVersion = '1.40.0';

  repairLoginButtons130(documentRef);
  ensureLoginFlowPage130(documentRef, 'login');
  syncLoginConnectionRoute130(documentRef, route130, targets);

  documentRef.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.id === 'startGameBtn') {
      lastAction130 = 'start';
      lastClickAt130 = performance.now();
      window.setTimeout(() => {
        if (targets.loginScreen.classList.contains('hidden') && !documentRef.body.classList.contains('route-login-120')) {
          syncLoginConnectionRoute130(documentRef, 'login', targets);
          ensureLoginFlowPage130(documentRef, 'login');
          loginFallbacks130 += 1;
        }
      }, 180);
      return;
    }

    if (button.id === 'guestLoginBtn' || button.id === 'localLoginBtn' || button.id === 'googleLoginBtn') {
      lastAction130 = button.id;
      armLoginWatchdog130(documentRef, button.id === 'googleLoginBtn' ? 5200 : 2600);
    }

    if (button.id === 'serverNextBtn' || button.id === 'connectCharacterBtn' || button.id === 'characterNextBtn') {
      lastAction130 = button.id;
      armLoginWatchdog130(documentRef, 4200);
    }
  }, true);

  documentRef.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (!button) return;
    // 메인 핸들러가 아직 붙기 전에 사용자가 빠르게 누른 경우를 위한 최소 복구.
    window.setTimeout(() => repairLoginButtons130(documentRef), 1000);
    if (button.id === 'localLoginBtn') {
      window.setTimeout(() => {
        const active = activeFlow130(documentRef);
        if (active === 'login' && isDisabledLike130(documentRef.querySelector<HTMLButtonElement>('#localLoginBtn'))) {
          setLoginStatus130(documentRef, '로컬 저장으로 접속합니다.');
          ensureLoginFlowPage130(documentRef, 'server');
          repairLoginButtons130(documentRef);
          loginFallbacks130 += 1;
        }
      }, 900);
    }
  }, true);

  const repair = () => {
    repairLoginButtons130(documentRef);
    if (readRoute130(documentRef) === 'login') ensureLoginFlowPage130(documentRef, activeFlow130(documentRef) || 'login');
  };
  win?.addEventListener('pageshow', repair, { passive: true });
  win?.addEventListener('visibilitychange', repair, { passive: true });
  win?.addEventListener('error', (event) => {
    lastError130 = event.message || 'runtime error';
    documentRef.body.classList.add('login-runtime-warning-130');
    armLoginWatchdog130(documentRef, 900);
  });
  win?.addEventListener('unhandledrejection', (event) => {
    lastError130 = event.reason instanceof Error ? event.reason.message : String(event.reason || 'promise rejection');
    documentRef.body.classList.add('login-runtime-warning-130');
    armLoginWatchdog130(documentRef, 900);
  });

  window.setTimeout(repair, 250);
  window.setTimeout(repair, 1600);
  return inspectLoginConnection130(documentRef, targets);
}

export function syncLoginConnectionRoute130(documentRef: Document, route: LoginRoute130, targets: LoginConnectionTargets130) {
  route130 = route;
  const win = documentRef.defaultView as SoulWindow130 | null;
  if (win) {
    win.SOUL_LOGIN_ROUTE_130 = route;
    win.SOUL_PRESTART_ROUTE_120 = route;
  }
  documentRef.body.classList.remove('route-title-130', 'route-login-130', 'route-town-130', 'route-field-130');
  documentRef.body.classList.add(`route-${route}-130`);
  setSceneVisible130(targets.titleScreen, route === 'title');
  setSceneVisible130(targets.loginScreen, route === 'login');
  setSceneVisible130(targets.townScreen, route === 'town');
  targets.gameRoot.classList.toggle('hidden', route !== 'field');
  targets.gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');
  targets.gameRoot.style.pointerEvents = route === 'field' ? 'auto' : 'none';
  documentRef.body.classList.toggle('prestart-login-120', route === 'login');
  documentRef.body.classList.toggle('town-active', route === 'town');
  documentRef.body.classList.toggle('field-active', route === 'field');
  repairLoginButtons130(documentRef);
  if (route === 'login') ensureLoginFlowPage130(documentRef, activeFlow130(documentRef) || 'login');
}

export function inspectLoginConnection130(documentRef: Document, targets?: Partial<LoginConnectionTargets130>): Inspect130 {
  const route = readRoute130(documentRef);
  const activeFlow = activeFlow130(documentRef) || 'none';
  const buttons = Array.from(documentRef.querySelectorAll<HTMLButtonElement>(LOGIN_BUTTON_SELECTOR_130));
  const disabled = buttons.filter((button) => button.disabled).length;
  const visibleScenes = [
    targets?.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen'),
    targets?.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen'),
    targets?.townScreen || documentRef.querySelector<HTMLElement>('#townScreen')
  ].filter((node) => node && isVisible130(node)).length + (documentRef.body.classList.contains('field-active') ? 1 : 0);
  const level: Inspect130['level'] = visibleScenes > 1 || lastError130 ? 'warn' : 'ok';
  return {
    message: level === 'ok' ? '로그인 연결 안정' : '로그인 연결 점검',
    level,
    hint: `route ${route} · flow ${activeFlow} · disabled ${disabled} · fallback ${loginFallbacks130} · fix ${correctedButtons130}/${correctedScenes130}${lastError130 ? ` · ${lastError130}` : ''}`
  };
}

export function forceLoginFallback130(documentRef: Document, reason = 'network-delay') {
  loginFallbacks130 += 1;
  documentRef.body.classList.add('login-fallback-130');
  setLoginStatus130(documentRef, reason === 'network-delay'
    ? '클라우드 응답이 지연되어 로컬 접속으로 먼저 진행합니다.'
    : '접속 흐름을 복구했습니다.');
  ensureLoginFlowPage130(documentRef, 'server');
  repairLoginButtons130(documentRef);
}

function armLoginWatchdog130(documentRef: Document, delayMs: number) {
  if (watchdogTimer130) window.clearTimeout(watchdogTimer130);
  watchdogTimer130 = window.setTimeout(() => {
    watchdogTimer130 = 0;
    const route = readRoute130(documentRef);
    if (route !== 'login') return;
    const active = activeFlow130(documentRef);
    const disabledCount = documentRef.querySelectorAll(`${LOGIN_BUTTON_SELECTOR_130}:disabled`).length;
    if (disabledCount > 0 && (active === 'login' || active === 'server' || !active)) {
      forceLoginFallback130(documentRef, 'network-delay');
    } else {
      repairLoginButtons130(documentRef);
    }
  }, delayMs);
}

function readRoute130(documentRef: Document): LoginRoute130 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.classList.contains('route-field-130') || body.classList.contains('route-field-126')) return 'field';
  if (body.classList.contains('town-active') || body.classList.contains('route-town-130') || body.classList.contains('route-town-126')) return 'town';
  if (body.classList.contains('prestart-login-120') || body.classList.contains('route-login-130') || body.classList.contains('route-login-126') || body.classList.contains('route-login-120')) return 'login';
  return 'title';
}

function setSceneVisible130(node: HTMLElement, visible: boolean) {
  const wasVisible = isVisible130(node);
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  node.style.display = visible ? '' : 'none';
  node.style.opacity = visible ? '1' : '0';
  node.style.visibility = visible ? 'visible' : 'hidden';
  node.style.pointerEvents = visible ? 'auto' : 'none';
  if (wasVisible !== visible) correctedScenes130 += 1;
}

function ensureLoginFlowPage130(documentRef: Document, flow: string) {
  const pages = Array.from(documentRef.querySelectorAll<HTMLElement>('[data-flow-page]'));
  if (!pages.length) return;
  const next = pages.some((page) => page.dataset.flowPage === flow) ? flow : 'login';
  for (const page of pages) {
    const active = page.dataset.flowPage === next;
    page.classList.toggle('active', active);
    page.setAttribute('aria-hidden', active ? 'false' : 'true');
  }
  const hint = documentRef.querySelector<HTMLElement>('#loginFlowHint');
  if (hint && next === 'login') hint.textContent = '접속 방식을 선택하세요. 클라우드가 지연되면 로컬 접속으로 자동 복구합니다.';
  if (hint && next === 'server') hint.textContent = '서버를 선택하고 다음 단계로 이동합니다.';
}

function activeFlow130(documentRef: Document) {
  return documentRef.querySelector<HTMLElement>('[data-flow-page].active')?.dataset.flowPage || '';
}

function repairLoginButtons130(documentRef: Document) {
  documentRef.querySelectorAll<HTMLButtonElement>(LOGIN_BUTTON_SELECTOR_130).forEach((button) => {
    button.style.touchAction = 'manipulation';
    button.style.pointerEvents = 'auto';
    if (button.id === 'guestLoginBtn' || button.id === 'localLoginBtn' || button.id === 'googleLoginBtn') {
      if (button.disabled && performance.now() - lastClickAt130 > 1800) {
        button.disabled = false;
        correctedButtons130 += 1;
      }
    }
  });
  const start = documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  if (start) {
    start.disabled = false;
    start.removeAttribute('aria-disabled');
    start.style.touchAction = 'manipulation';
    start.style.pointerEvents = 'auto';
  }
}

function isDisabledLike130(button: HTMLButtonElement | null) {
  return Boolean(button?.disabled || button?.getAttribute('aria-disabled') === 'true');
}

function setLoginStatus130(documentRef: Document, text: string) {
  const status = documentRef.querySelector<HTMLElement>('#loginStatus');
  if (status) status.textContent = text;
}

function isVisible130(node: HTMLElement | null | undefined) {
  if (!node) return false;
  if (node.classList.contains('hidden')) return false;
  if (node.style.display === 'none' || node.style.visibility === 'hidden' || node.style.opacity === '0') return false;
  return true;
}
