import './styles/alpha140.css';

type SoulWindow140 = Window & {
  SOUL_MAIN_LOADING_140?: boolean;
  SOUL_MAIN_READY_140?: boolean;
  SOUL_MAIN_ERROR_140?: string;
  SOUL_ROUTE_TO_140?: (route: 'title' | 'login' | 'town' | 'field') => void;
  SOUL_PRESTART_LOGIN_120?: () => void;
  SOUL_PRESTART_ROUTE_120?: string;
  SOUL_GET_PORTRAIT_FRAME_137?: () => unknown;
  SOUL_INAPP_CSS_ONLY_137?: boolean;
  SOUL_SUPPRESS_VIEWPORT_APIS_137?: boolean;
};

const w = window as SoulWindow140;

type Route140 = 'title' | 'login' | 'town' | 'field';

function qs<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function isInAppBrowser140() {
  const ua = `${navigator.userAgent || ''} ${navigator.vendor || ''}`;
  return /KAKAOTALK|KAKAOSTORY|DaumApps|NAVER\(|FBAN|FBAV|Instagram|Line\/|; wv\)|\bwv\b|Twitter|Whale\//i.test(ua);
}

function liveSize140() {
  const vv = window.visualViewport;
  const width = Math.max(1, Math.round((vv?.width || window.innerWidth || document.documentElement.clientWidth || 360)));
  const height = Math.max(1, Math.round((vv?.height || window.innerHeight || document.documentElement.clientHeight || 720)));
  return { width, height, landscape: width > height };
}

function computeFrame140() {
  const live = liveSize140();
  const maxWidth = 480;
  if (live.landscape) {
    const frameHeight = live.height;
    const frameWidth = Math.min(maxWidth, Math.max(220, Math.floor(frameHeight * 9 / 16)), live.width);
    return { width: frameWidth, height: frameHeight, landscape: true };
  }
  return {
    width: Math.min(maxWidth, live.width),
    height: live.height,
    landscape: false
  };
}

function applyFrame140() {
  const inApp = isInAppBrowser140();
  const frame = computeFrame140();
  w.SOUL_INAPP_CSS_ONLY_137 = inApp;
  w.SOUL_SUPPRESS_VIEWPORT_APIS_137 = inApp;

  document.documentElement.classList.add('soul-boot-gate-140');
  document.documentElement.classList.toggle('soul-inapp-140', inApp);
  document.documentElement.classList.toggle('soul-landscape-140', frame.landscape);
  document.documentElement.style.setProperty('--soul-frame-w-140', `${frame.width}px`);
  document.documentElement.style.setProperty('--soul-frame-h-140', `${frame.height}px`);
  document.documentElement.style.setProperty('--soul-locked-w-120', `${frame.width}px`);
  document.documentElement.style.setProperty('--soul-locked-h-120', `${frame.height}px`);

  document.body?.classList.add('boot-gate-140', 'route-title-140', 'visual-quality-preserved-140');
  document.body?.classList.toggle('inapp-css-only-140', inApp);
  document.body?.classList.toggle('landscape-cage-140', frame.landscape);

  const app = qs<HTMLElement>('#app');
  if (app) {
    app.style.width = `${frame.width}px`;
    app.style.height = `${frame.height}px`;
    app.style.transform = 'translate3d(-50%,0,0)';
  }
  return frame;
}

function setVisible140(node: HTMLElement | null, visible: boolean) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  node.style.display = visible ? 'block' : 'none';
  node.style.opacity = visible ? '1' : '0';
  node.style.visibility = visible ? 'visible' : 'hidden';
  node.style.pointerEvents = visible ? 'auto' : 'none';
}

function routeTo140(route: Route140) {
  const body = document.body;
  if (!body) return;
  const routes: Route140[] = ['title', 'login', 'town', 'field'];
  for (const item of routes) {
    for (const suffix of ['120', '121', '122', '126', '127', '133', '134', '135', '136', '137', '138', '140']) {
      body.classList.remove(`route-${item}-${suffix}`);
    }
  }
  body.classList.add(`route-${route}-140`);
  if (route === 'login') {
    body.classList.add('prestart-login-120');
    w.SOUL_PRESTART_ROUTE_120 = 'login';
  } else {
    body.classList.remove('prestart-login-120');
  }

  setVisible140(qs('#titleScreen'), route === 'title');
  setVisible140(qs('#loginScreen'), route === 'login');
  setVisible140(qs('#townScreen'), route === 'town');
  setVisible140(qs('#game-root'), route === 'field');

  if (route === 'login') {
    const status = qs<HTMLElement>('#loginStatus');
    if (status && !status.textContent?.trim()) status.textContent = '접속 방식을 선택하세요.';
    const firstPage = qs<HTMLElement>('[data-flow-page="login"]');
    if (firstPage) {
      document.querySelectorAll<HTMLElement>('[data-flow-page]').forEach((page) => {
        const on = page === firstPage;
        page.classList.toggle('active', on);
        page.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    }
  }
  applyFrame140();
}

function repairTitle140() {
  const start = qs<HTMLButtonElement>('#startGameBtn');
  if (start) {
    start.disabled = false;
    start.removeAttribute('aria-disabled');
    start.setAttribute('aria-label', '게임 시작');
    start.title = '게임 시작';
    start.style.pointerEvents = 'auto';
    start.style.visibility = 'visible';
    start.style.opacity = '1';
  }
  const title = qs<HTMLElement>('#titleScreen');
  if (title && !document.body.classList.contains('prestart-login-120')) {
    setVisible140(title, true);
  }
  const root = qs<HTMLElement>('#game-root');
  if (root && !document.body.classList.contains('route-field-140')) {
    root.style.pointerEvents = 'none';
    root.style.display = 'none';
  }
}

function loadMain140(reason: string) {
  if (w.SOUL_MAIN_READY_140 || w.SOUL_MAIN_LOADING_140) return;
  w.SOUL_MAIN_LOADING_140 = true;
  document.body.classList.add('main-loading-140');
  const status = qs<HTMLElement>('#loginStatus');
  if (status && !status.textContent?.includes('로딩')) status.textContent = '게임 모듈을 불러오는 중입니다.';
  import('./main')
    .then(() => {
      w.SOUL_MAIN_READY_140 = true;
      document.body.classList.remove('main-loading-140');
      document.body.classList.add('main-ready-140');
      console.info(`[SoulOnline 1.40] main loaded: ${reason}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      w.SOUL_MAIN_ERROR_140 = message;
      document.body.classList.remove('main-loading-140');
      document.body.classList.add('main-failed-140');
      if (status) status.textContent = '기본 접속 화면을 유지합니다. 새로고침 후 다시 시도하세요.';
      console.error('[SoulOnline 1.40] main load failed', error);
    });
}

function showLoginAndLoad140(reason: string, event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  routeTo140('login');
  try { w.SOUL_PRESTART_LOGIN_120?.(); } catch {}
  window.setTimeout(() => loadMain140(reason), 60);
}

function bindGate140() {
  applyFrame140();
  repairTitle140();
  w.SOUL_ROUTE_TO_140 = routeTo140;

  const start = qs<HTMLButtonElement>('#startGameBtn');
  start?.addEventListener('click', (event) => showLoginAndLoad140('start-button', event), { capture: true });
  start?.addEventListener('pointerup', (event) => showLoginAndLoad140('start-pointer', event), { capture: true });

  const title = qs<HTMLElement>('#titleScreen');
  title?.addEventListener('pointerup', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button,a,input,select,textarea')) return;
    showLoginAndLoad140('title-tap', event);
  }, { capture: true });

  for (const id of ['guestLoginBtn', 'googleLoginBtn', 'localLoginBtn', 'serverNextBtn', 'connectCharacterBtn', 'newCharacterBtn', 'characterNextBtn']) {
    qs<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => loadMain140(id), { capture: true, passive: true });
  }

  window.addEventListener('resize', () => { applyFrame140(); repairTitle140(); }, { passive: true });
  window.addEventListener('orientationchange', () => { applyFrame140(); repairTitle140(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => { applyFrame140(); repairTitle140(); }, { passive: true });
  window.setTimeout(repairTitle140, 300);
  window.setTimeout(repairTitle140, 1200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindGate140, { once: true });
} else {
  bindGate140();
}
