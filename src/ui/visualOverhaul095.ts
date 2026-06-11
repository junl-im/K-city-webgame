type VisualOverhaulContext095 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
  closeButtons?: HTMLButtonElement[];
};

const VERSIONED_SCREEN_RE = /^(title-screen|login-screen|town-screen)-0\d{2}$/;
const FANTASY_BODY_RE = /^fantasy-ui-0\d{2}$/;

let installed095 = false;
let scheduled095 = 0;
let lastContext095: VisualOverhaulContext095 | null = null;
let resizeHandler095: (() => void) | null = null;
let mutationObserver095: MutationObserver | null = null;

function removeLegacyVersionClasses(element: HTMLElement, keep: string) {
  for (const className of Array.from(element.classList)) {
    if (VERSIONED_SCREEN_RE.test(className) && className !== keep) {
      element.classList.remove(className);
    }
  }
  element.classList.add(keep);
}

function removeLegacyBodyClasses() {
  for (const className of Array.from(document.body.classList)) {
    if (FANTASY_BODY_RE.test(className) && className !== 'fantasy-ui-095') {
      document.body.classList.remove(className);
    }
  }
  document.body.classList.add('fantasy-ui-095', 'visual-overhaul-095');
}

function normalizeCloseButton(button: HTMLButtonElement) {
  if (button.dataset.closeIcon095 === 'ready') return;
  button.dataset.closeIcon095 = 'ready';
  button.classList.add('close-crystal-095');
  button.setAttribute('aria-label', button.getAttribute('aria-label') || '닫기');
  button.innerHTML = '<span aria-hidden="true">×</span>';
}

function updateViewportFlags() {
  const w = window.innerWidth || document.documentElement.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight;
  document.documentElement.style.setProperty('--soul-vw-095', `${w}px`);
  document.documentElement.style.setProperty('--soul-vh-095', `${h}px`);
  document.body.classList.toggle('mobile-compact-095', w <= 640);
  document.body.classList.toggle('mobile-tiny-095', w <= 380 || h <= 690);
  document.body.classList.toggle('mobile-short-095', h <= 720);
  document.body.classList.toggle('landscape-compact-095', w > h && h <= 620);
}

function routeState(ctx: VisualOverhaulContext095) {
  if (document.body.classList.contains('field-active')) return 'field';
  if (document.body.classList.contains('town-active') && !ctx.townScreen.classList.contains('hidden')) return 'town';
  if (!ctx.loginScreen.classList.contains('hidden')) return 'login';
  return 'title';
}

function applyRouteClasses(ctx: VisualOverhaulContext095) {
  const route = routeState(ctx);
  document.body.classList.toggle('route-title-095', route === 'title');
  document.body.classList.toggle('route-login-095', route === 'login');
  document.body.classList.toggle('route-town-095', route === 'town');
  document.body.classList.toggle('route-field-095', route === 'field');
  document.body.dataset.visualRoute095 = route;

  ctx.titleScreen.setAttribute('aria-hidden', route === 'title' ? 'false' : 'true');
  if (route !== 'title') ctx.titleScreen.classList.add('hidden');
  ctx.loginScreen.setAttribute('aria-hidden', route === 'login' ? 'false' : 'true');
  ctx.townScreen.setAttribute('aria-hidden', route === 'town' ? 'false' : 'true');
  ctx.gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');

  if (route !== 'town') {
    document.body.classList.remove('town-drawer-open', 'town-more-open');
  }
  if (route !== 'field') {
    document.body.classList.remove('sheet-open');
  }
}

function schedule(ctx: VisualOverhaulContext095) {
  lastContext095 = ctx;
  if (scheduled095) return;
  scheduled095 = window.requestAnimationFrame(() => {
    scheduled095 = 0;
    if (lastContext095) syncVisualOverhaul095(lastContext095);
  });
}

export function installVisualOverhaul095(ctx: VisualOverhaulContext095) {
  lastContext095 = ctx;
  removeLegacyBodyClasses();
  removeLegacyVersionClasses(ctx.titleScreen, 'title-screen-095');
  removeLegacyVersionClasses(ctx.loginScreen, 'login-screen-095');
  removeLegacyVersionClasses(ctx.townScreen, 'town-screen-095');
  ctx.titleScreen.classList.add('entry-poster-095');
  ctx.loginScreen.classList.add('login-consolidated-095');
  ctx.townScreen.classList.add('town-consolidated-095');
  ctx.gameRoot.classList.add('field-root-095');
  ctx.startButton.classList.add('start-game-btn-095');
  ctx.closeButtons?.forEach(normalizeCloseButton);

  updateViewportFlags();
  applyRouteClasses(ctx);

  if (!installed095) {
    installed095 = true;
    resizeHandler095 = () => {
      updateViewportFlags();
      if (lastContext095) schedule(lastContext095);
    };
    window.addEventListener('resize', resizeHandler095, { passive: true });
    window.addEventListener('orientationchange', resizeHandler095, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && lastContext095) schedule(lastContext095);
    });
  }

  mutationObserver095?.disconnect();
  mutationObserver095 = new MutationObserver(() => schedule(ctx));
  mutationObserver095.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  mutationObserver095.observe(ctx.titleScreen, { attributes: true, attributeFilter: ['class'] });
  mutationObserver095.observe(ctx.loginScreen, { attributes: true, attributeFilter: ['class'] });
  mutationObserver095.observe(ctx.townScreen, { attributes: true, attributeFilter: ['class'] });

  return () => {
    if (resizeHandler095) {
      window.removeEventListener('resize', resizeHandler095);
      window.removeEventListener('orientationchange', resizeHandler095);
    }
    mutationObserver095?.disconnect();
    installed095 = false;
  };
}

export function syncVisualOverhaul095(ctx: VisualOverhaulContext095) {
  removeLegacyBodyClasses();
  removeLegacyVersionClasses(ctx.titleScreen, 'title-screen-095');
  removeLegacyVersionClasses(ctx.loginScreen, 'login-screen-095');
  removeLegacyVersionClasses(ctx.townScreen, 'town-screen-095');
  updateViewportFlags();
  ctx.closeButtons?.forEach(normalizeCloseButton);
  applyRouteClasses(ctx);
}
