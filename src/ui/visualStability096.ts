type VisualStabilityContext096 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
  closeButtons?: HTMLButtonElement[];
};

type VisualRoute096 = 'title' | 'login' | 'town' | 'field';

let installed096 = false;
let observer096: MutationObserver | null = null;
let resizeHandler096: (() => void) | null = null;
let scheduled096 = 0;
let lastContext096: VisualStabilityContext096 | null = null;

function routeFromDom(ctx: VisualStabilityContext096): VisualRoute096 {
  if (document.body.classList.contains('field-active')) return 'field';
  if (document.body.classList.contains('town-active') && !ctx.townScreen.classList.contains('hidden')) return 'town';
  if (!ctx.loginScreen.classList.contains('hidden')) return 'login';
  return 'title';
}

function setVisible(el: HTMLElement, visible: boolean) {
  el.classList.toggle('hidden', !visible);
  el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  el.toggleAttribute('inert', !visible);
}

function stripOldRouteClasses() {
  document.body.classList.remove(
    'route-title-096',
    'route-login-096',
    'route-town-096',
    'route-field-096',
    'town-layer-clean-096',
    'field-layer-clean-096'
  );
}

function normalizeScreenClasses(ctx: VisualStabilityContext096) {
  document.body.classList.add('visual-overhaul-096', 'mobile-game-shell-096');
  ctx.titleScreen.classList.add('entry-clean-096');
  ctx.loginScreen.classList.add('login-clean-096');
  ctx.townScreen.classList.add('town-clean-096');
  ctx.gameRoot.classList.add('field-clean-096');
  ctx.startButton.classList.add('start-cta-clean-096');
  ctx.startButton.textContent = 'TOUCH TO START';
  ctx.startButton.setAttribute('type', 'button');
}

function normalizeCloseButton(button: HTMLButtonElement) {
  button.classList.add('close-crystal-096');
  button.setAttribute('aria-label', button.getAttribute('aria-label') || '닫기');
  button.setAttribute('type', 'button');
  if (!button.querySelector('.close-crystal-mark-096')) {
    button.innerHTML = '<span class="close-crystal-mark-096" aria-hidden="true">×</span>';
  }
}

function normalizeAllCloseButtons(ctx: VisualStabilityContext096) {
  const dynamicButtons = Array.from(document.querySelectorAll<HTMLButtonElement>([
    '#closeSheet',
    '#closeTownContent',
    '#closeItemDetail',
    '.item-detail-close',
    '.sheet-head .icon-btn',
    '.town-drawer-head .icon-btn'
  ].join(',')));
  const merged = [...(ctx.closeButtons || []), ...dynamicButtons];
  Array.from(new Set(merged)).forEach(normalizeCloseButton);
}

function updateViewportVars096() {
  const w = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
  const h = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
  document.documentElement.style.setProperty('--soul-vw-096', `${w}px`);
  document.documentElement.style.setProperty('--soul-vh-096', `${h}px`);
  document.body.classList.toggle('portrait-096', h >= w);
  document.body.classList.toggle('landscape-096', w > h);
  document.body.classList.toggle('mobile-compact-096', w <= 640);
  document.body.classList.toggle('mobile-tiny-096', w <= 390 || h <= 700);
  document.body.classList.toggle('mobile-short-096', h <= 740);
}

function enforceScreenVisibility(ctx: VisualStabilityContext096, route: VisualRoute096) {
  setVisible(ctx.titleScreen, route === 'title');
  setVisible(ctx.loginScreen, route === 'login');
  setVisible(ctx.townScreen, route === 'town');
  ctx.gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');

  if (route !== 'town') {
    document.body.classList.remove('town-drawer-open', 'town-more-open');
  }
  if (route !== 'field') {
    document.body.classList.remove('sheet-open');
  }
}

function markTownLayer(ctx: VisualStabilityContext096) {
  const townLayer = ctx.townScreen.querySelector<HTMLElement>('.town-master-lobby-074');
  if (!townLayer) return;
  townLayer.classList.add('town-master-mobile-096');
}

function markFieldLayer(ctx: VisualStabilityContext096) {
  const fieldNodes = [
    ctx.gameRoot,
    document.querySelector<HTMLElement>('.hud-top'),
    document.querySelector<HTMLElement>('.resource-strip'),
    document.querySelector<HTMLElement>('.target-card'),
    document.querySelector<HTMLElement>('.field-quest-tracker'),
    document.querySelector<HTMLElement>('.field-minimap'),
    document.querySelector<HTMLElement>('.combat-log'),
    document.querySelector<HTMLElement>('.joystick'),
    document.querySelector<HTMLElement>('.potion-dock'),
    document.querySelector<HTMLElement>('.skill-dock'),
    document.querySelector<HTMLElement>('.action-dock')
  ].filter(Boolean) as HTMLElement[];
  fieldNodes.forEach((node) => node.classList.add('field-safe-096'));
}

export function syncVisualStability096(ctx: VisualStabilityContext096) {
  lastContext096 = ctx;
  normalizeScreenClasses(ctx);
  normalizeAllCloseButtons(ctx);
  updateViewportVars096();
  const route = routeFromDom(ctx);
  stripOldRouteClasses();
  document.body.classList.add(`route-${route}-096`);
  document.body.dataset.visualRoute096 = route;
  if (route === 'town') document.body.classList.add('town-layer-clean-096');
  if (route === 'field') document.body.classList.add('field-layer-clean-096');
  enforceScreenVisibility(ctx, route);
  markTownLayer(ctx);
  markFieldLayer(ctx);
}

function schedule096(ctx: VisualStabilityContext096) {
  lastContext096 = ctx;
  if (scheduled096) return;
  scheduled096 = window.requestAnimationFrame(() => {
    scheduled096 = 0;
    if (lastContext096) syncVisualStability096(lastContext096);
  });
}

export function installVisualStability096(ctx: VisualStabilityContext096) {
  syncVisualStability096(ctx);
  if (!installed096) {
    installed096 = true;
    resizeHandler096 = () => schedule096(ctx);
    window.addEventListener('resize', resizeHandler096, { passive: true });
    window.addEventListener('orientationchange', resizeHandler096, { passive: true });
    window.addEventListener('pageshow', () => schedule096(ctx), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) schedule096(ctx);
    });
  }
  observer096?.disconnect();
  observer096 = new MutationObserver(() => schedule096(ctx));
  observer096.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  observer096.observe(ctx.titleScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer096.observe(ctx.loginScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer096.observe(ctx.townScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  return () => {
    if (resizeHandler096) {
      window.removeEventListener('resize', resizeHandler096);
      window.removeEventListener('orientationchange', resizeHandler096);
    }
    observer096?.disconnect();
    observer096 = null;
    installed096 = false;
  };
}

export function inspectVisualStability096(ctx: VisualStabilityContext096) {
  const route = routeFromDom(ctx);
  const titleVisible = route === 'title' && !ctx.titleScreen.classList.contains('hidden');
  const startVisible = titleVisible && !ctx.startButton.disabled;
  const fieldOverflow = Array.from(document.querySelectorAll<HTMLElement>('.hud-top,.resource-strip,.target-card,.field-quest-tracker,.field-minimap,.combat-log,.joystick,.potion-dock,.skill-dock,.action-dock')).filter((node) => {
    const rect = node.getBoundingClientRect();
    return rect.left < -2 || rect.top < -2 || rect.right > window.innerWidth + 2 || rect.bottom > window.innerHeight + 2;
  }).length;
  return {
    route,
    titleVisible,
    startVisible,
    fieldOverflow,
    message: startVisible && fieldOverflow === 0 ? '0.96 화면 안정화 정상' : `0.96 점검: 시작=${startVisible ? '정상' : '확인 필요'}, 필드 이탈=${fieldOverflow}`
  };
}
