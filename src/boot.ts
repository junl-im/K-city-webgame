import './styles/alpha141.css';

type Route141 = 'title' | 'login' | 'town' | 'field';

type SoulWindow141 = Window & {
  SOUL_BOOT_VERSION_141?: string;
  SOUL_MAIN_LOADING_141?: boolean;
  SOUL_MAIN_READY_141?: boolean;
  SOUL_MAIN_ERROR_141?: string;
  SOUL_ROUTE_TO_141?: (route: Route141) => void;
  SOUL_PRESTART_LOGIN_120?: () => void;
  SOUL_PRESTART_ROUTE_120?: string;
  SOUL_INAPP_CSS_ONLY_137?: boolean;
  SOUL_SUPPRESS_VIEWPORT_APIS_137?: boolean;
};

const w = window as SoulWindow141;
w.SOUL_BOOT_VERSION_141 = '1.41.0';

function qs<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function isInAppBrowser141() {
  const ua = `${navigator.userAgent || ''} ${navigator.vendor || ''}`;
  return /KAKAOTALK|KAKAOSTORY|DaumApps|NAVER\(|FBAN|FBAV|Instagram|Line\/|; wv\)|\bwv\b|Twitter|Whale\//i.test(ua);
}

function suppressViewportApisForInApp141() {
  if (!isInAppBrowser141()) return;
  w.SOUL_INAPP_CSS_ONLY_137 = true;
  w.SOUL_SUPPRESS_VIEWPORT_APIS_137 = true;
  try {
    const proto = Element.prototype as Element & { requestFullscreen?: () => Promise<void> };
    if (proto.requestFullscreen) proto.requestFullscreen = () => Promise.resolve();
  } catch {}
  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    if (orientation?.lock) orientation.lock = () => Promise.resolve();
  } catch {}
}

function liveSize141() {
  const vv = window.visualViewport;
  const width = Math.max(1, Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 360));
  const height = Math.max(1, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 740));
  return { width, height, landscape: width > height };
}

function computeFrame141() {
  const live = liveSize141();
  const maxWidth = 480;
  if (live.landscape) {
    const height = live.height;
    const width = Math.min(maxWidth, live.width, Math.max(220, Math.floor(height * 9 / 16)));
    return { width, height, landscape: true, liveWidth: live.width, liveHeight: live.height };
  }
  return {
    width: Math.min(maxWidth, Math.max(220, live.width)),
    height: Math.max(520, live.height),
    landscape: false,
    liveWidth: live.width,
    liveHeight: live.height
  };
}

function applyFrame141() {
  const inApp = isInAppBrowser141();
  const frame = computeFrame141();
  const root = document.documentElement;
  const body = document.body;
  root.classList.add('soul-boot-root-141');
  root.classList.toggle('soul-inapp-141', inApp);
  root.classList.toggle('soul-landscape-141', frame.landscape);
  root.style.setProperty('--soul-frame-w-141', `${frame.width}px`);
  root.style.setProperty('--soul-frame-h-141', `${frame.height}px`);
  // 구형 런타임 보정 모듈이 읽는 변수도 같은 값으로 고정한다.
  root.style.setProperty('--soul-locked-w-120', `${frame.width}px`);
  root.style.setProperty('--soul-locked-h-120', `${frame.height}px`);
  root.style.setProperty('--soul-portrait-frame-w', `${frame.width}px`);
  root.style.setProperty('--soul-portrait-frame-h', `${frame.height}px`);

  if (body) {
    body.classList.add('boot-gate-141', 'portrait-cage-141', 'visual-quality-preserved-141');
    body.classList.toggle('inapp-css-only-141', inApp);
    body.classList.toggle('landscape-cage-141', frame.landscape);
  }

  const app = qs<HTMLElement>('#app');
  if (app) {
    app.style.width = `${frame.width}px`;
    app.style.height = `${frame.height}px`;
  }
  return frame;
}

function showNode141(node: HTMLElement | null, visible: boolean) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  node.style.display = visible ? 'block' : 'none';
  node.style.opacity = visible ? '1' : '0';
  node.style.visibility = visible ? 'visible' : 'hidden';
  node.style.pointerEvents = visible ? 'auto' : 'none';
}

function setFlowPage141(pageName: string) {
  document.querySelectorAll<HTMLElement>('[data-flow-page]').forEach((page) => {
    const active = page.getAttribute('data-flow-page') === pageName;
    page.classList.toggle('active', active);
    page.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
}

function routeTo141(route: Route141) {
  const body = document.body;
  if (!body) return;

  const suffixes = ['119','120','121','122','126','127','133','134','135','136','137','138','140','141'];
  const routes: Route141[] = ['title', 'login', 'town', 'field'];
  for (const item of routes) for (const suffix of suffixes) body.classList.remove(`route-${item}-${suffix}`);

  body.classList.add(`route-${route}-141`);
  body.classList.toggle('prestart-login-120', route === 'login');
  w.SOUL_PRESTART_ROUTE_120 = route;

  showNode141(qs('#titleScreen'), route === 'title');
  showNode141(qs('#loginScreen'), route === 'login');
  showNode141(qs('#townScreen'), route === 'town');
  showNode141(qs('#game-root'), route === 'field');

  if (route === 'login') {
    setFlowPage141('login');
    const status = qs<HTMLElement>('#loginStatus');
    if (status && !status.textContent?.trim()) status.textContent = '접속 방식을 선택하세요.';
  }
  applyFrame141();
  repairStart141();
}

function repairStart141() {
  const start = qs<HTMLButtonElement>('#startGameBtn');
  if (!start) return;
  start.disabled = false;
  start.removeAttribute('aria-disabled');
  start.setAttribute('aria-label', '게임 시작');
  start.title = '게임 시작';
  start.style.pointerEvents = 'auto';
  start.style.visibility = 'visible';
  start.style.opacity = '1';
}

function loadMain141(reason: string) {
  if (w.SOUL_MAIN_READY_141 || w.SOUL_MAIN_LOADING_141) return;
  w.SOUL_MAIN_LOADING_141 = true;
  document.body.classList.add('main-loading-141');
  const status = qs<HTMLElement>('#loginStatus');
  if (status) status.textContent = '게임 모듈을 불러오는 중입니다.';

  import('./main')
    .then(() => {
      w.SOUL_MAIN_READY_141 = true;
      document.body.classList.remove('main-loading-141');
      document.body.classList.add('main-ready-141');
      console.info(`[SoulOnline 1.41] main loaded: ${reason}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      w.SOUL_MAIN_ERROR_141 = message;
      document.body.classList.remove('main-loading-141');
      document.body.classList.add('main-failed-141');
      if (status) status.textContent = '기본 접속 화면을 유지합니다. 새로고침 후 다시 시도하세요.';
      console.error('[SoulOnline 1.41] main load failed', error);
    });
}

let startTransitioning141 = false;
function startToLogin141(reason: string, event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (startTransitioning141) return;
  startTransitioning141 = true;
  routeTo141('login');
  try { w.SOUL_PRESTART_LOGIN_120?.(); } catch {}
  window.setTimeout(() => loadMain141(reason), 180);
  window.setTimeout(() => { startTransitioning141 = false; }, 1200);
}

function bind141() {
  suppressViewportApisForInApp141();
  applyFrame141();
  routeTo141('title');
  w.SOUL_ROUTE_TO_141 = routeTo141;
  // 구형 복구 함수가 호출되어도 1.41 라우터로 흘러오게 연결한다.
  w.SOUL_PRESTART_LOGIN_120 = () => routeTo141('login');

  const start = qs<HTMLButtonElement>('#startGameBtn');
  if (start) {
    const handler = (event: Event) => startToLogin141('start-button', event);
    start.addEventListener('pointerdown', handler, { capture: true, passive: false });
    start.addEventListener('click', handler, { capture: true, passive: false });
    start.addEventListener('touchend', handler, { capture: true, passive: false });
  }

  for (const id of ['guestLoginBtn', 'googleLoginBtn', 'localLoginBtn', 'serverNextBtn', 'connectCharacterBtn', 'newCharacterBtn', 'characterNextBtn']) {
    qs<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => loadMain141(id), { capture: true, passive: true });
  }

  window.addEventListener('resize', () => { applyFrame141(); repairStart141(); }, { passive: true });
  window.addEventListener('orientationchange', () => { applyFrame141(); repairStart141(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => { applyFrame141(); repairStart141(); }, { passive: true });

  window.setTimeout(() => { applyFrame141(); repairStart141(); }, 300);
  window.setTimeout(() => { applyFrame141(); repairStart141(); }, 1200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bind141, { once: true });
} else {
  bind141();
}
