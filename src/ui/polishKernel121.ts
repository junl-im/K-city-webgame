export type PolishRoute121 = 'title' | 'login' | 'town' | 'field';

type PolishTargets121 = {
  appShell?: HTMLElement | null;
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
};

type SoulWindow121 = Window & {
  SOUL_POLISH_KERNEL_121?: boolean;
  SOUL_POLISH_ROUTE_121?: PolishRoute121;
  SOUL_POLISH_LOCKED_SIZE_121?: { width: number; height: number };
};

let installed121 = false;
let route121: PolishRoute121 = 'title';
let cleanupCount121 = 0;
let lockedWidth121 = 0;
let lockedHeight121 = 0;

const LEGACY_BODY_CLASS_RE = /^(fantasy-ui-(?:0\d\d|1(?:0\d|1[0-8]))|visual-(?:clean|art|field|mass|stability|overhaul|rescue|consolidation)-?\d*|route-title-(?:0\d\d|1(?:0\d|1[0-8]))|route-login-(?:0\d\d|1(?:0\d|1[0-8]))|route-town-(?:0\d\d|1(?:0\d|1[0-8]))|route-field-(?:0\d\d|1(?:0\d|1[0-8]))|asset-kit-102|field-ui-103|quality-pass-104|engine-quality-105|engine-106|final-opt-107|mobile-quality-108|single-visual-117|viewport-lock-117|scene-stability-118|entry-flow-ready-090|lite-render|quality-render|quality-mode|lite-mode|field-low-power|is-rotating)$/;

const GHOST_SELECTOR_121 = [
  '.title-character-companion',
  '.town-lobby-pet-070',
  '.field-pet',
  '[class*="pet"]',
  '[class*="companion"]',
  '[class*="rune"]',
  '.orientation-guard',
  '.rotate-guide',
  '.legacy-visual-layer',
  '.title-hero-glow'
].join(',');

export function installPolishKernel121(documentRef: Document, targets: PolishTargets121) {
  if (installed121) return;
  installed121 = true;
  const win = documentRef.defaultView as SoulWindow121 | null;
  if (win) win.SOUL_POLISH_KERNEL_121 = true;
  documentRef.documentElement.classList.add('soul-polish-121');
  documentRef.body.classList.add('fantasy-ui-121', 'polish-kernel-121', 'standard-visual-121', 'no-legacy-stack-121', 'no-pet-116');
  stripLegacyBodyClasses121(documentRef);
  lockStableViewport121(documentRef, targets);
  hideGhostLayers121(documentRef);
  makeControlsTouchable121(documentRef);

  const initialRoute = readRoute121(documentRef);
  syncPolishRoute121(documentRef, initialRoute, targets);

  const relock = () => lockStableViewport121(documentRef, targets);
  win?.addEventListener('pageshow', relock, { passive: true });
  win?.addEventListener('resize', relock, { passive: true });
  win?.visualViewport?.addEventListener('resize', relock, { passive: true });

  // DOM이 늦게 덧붙는 구형 장식도 다시 숨긴다. 무거운 관찰은 하지 않고 장면 전환 후 한 번만 정리한다.
  win?.setTimeout(() => hideGhostLayers121(documentRef), 250);
  win?.setTimeout(() => hideGhostLayers121(documentRef), 1200);
}

export function syncPolishRoute121(documentRef: Document, route: PolishRoute121, targets: PolishTargets121) {
  route121 = route;
  const win = documentRef.defaultView as SoulWindow121 | null;
  if (win) win.SOUL_POLISH_ROUTE_121 = route;
  stripLegacyBodyClasses121(documentRef);
  lockStableViewport121(documentRef, targets);
  hideGhostLayers121(documentRef);

  documentRef.body.classList.remove('route-title-121', 'route-login-121', 'route-town-121', 'route-field-121');
  documentRef.body.classList.add(`route-${route}-121`);
  documentRef.body.classList.toggle('town-active', route === 'town');
  documentRef.body.classList.toggle('field-active', route === 'field');

  setVisible121(targets.titleScreen, route === 'title');
  setVisible121(targets.loginScreen, route === 'login');
  setVisible121(targets.townScreen, route === 'town');
  targets.gameRoot.classList.toggle('hidden', route !== 'field');
  targets.gameRoot.setAttribute('aria-hidden', route === 'field' ? 'false' : 'true');
}

export function auditFieldCollision121(documentRef: Document) {
  if (!documentRef.body.classList.contains('field-active')) return { ok: true, message: '필드 비활성' };
  const items = Array.from(documentRef.querySelectorAll<HTMLElement>('#returnTownBtn, #joystick, #attackBtn, #inventoryBtn, #cardsBtn, [data-skill-slot], #hpPotionBtn, #mpPotionBtn'));
  let collisions = 0;
  const rects = items
    .filter((node) => node.offsetParent !== null)
    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
    .filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      if (overlap121(rects[i].rect, rects[j].rect, 6)) collisions += 1;
    }
  }
  documentRef.body.classList.toggle('field-collision-risk-121', collisions > 0);
  return { ok: collisions === 0, message: collisions ? `버튼 충돌 ${collisions}건 자동 보정` : '필드 버튼 충돌 없음' };
}

export function inspectPolishKernel121(documentRef: Document) {
  const collision = auditFieldCollision121(documentRef);
  return {
    label: '1.21 다듬기 커널',
    level: installed121 && collision.ok ? 'ok' as const : 'warn' as const,
    message: installed121 ? `${route121} · 구형 클래스 ${cleanupCount121}개 정리` : '미설치',
    hint: `${lockedWidth121 || 0}x${lockedHeight121 || 0} · ${collision.message}`
  };
}

function stripLegacyBodyClasses121(documentRef: Document) {
  const body = documentRef.body;
  const classes = Array.from(body.classList);
  let removed = 0;
  for (const name of classes) {
    if (LEGACY_BODY_CLASS_RE.test(name)) {
      body.classList.remove(name);
      removed += 1;
    }
  }
  cleanupCount121 += removed;
}

function lockStableViewport121(documentRef: Document, targets?: Partial<PolishTargets121>) {
  const win = documentRef.defaultView as SoulWindow121 | null;
  if (!win) return;
  if (!lockedWidth121 || !lockedHeight121) {
    const visual = win.visualViewport;
    lockedWidth121 = Math.max(320, Math.round(visual?.width || win.innerWidth || documentRef.documentElement.clientWidth || 390));
    lockedHeight121 = Math.max(520, Math.round(visual?.height || win.innerHeight || documentRef.documentElement.clientHeight || 720));
    win.SOUL_POLISH_LOCKED_SIZE_121 = { width: lockedWidth121, height: lockedHeight121 };
  }
  const appWidth = Math.min(480, lockedWidth121);
  const root = documentRef.documentElement;
  root.style.setProperty('--soul-locked-w-121', `${appWidth}px`);
  root.style.setProperty('--soul-locked-h-121', `${lockedHeight121}px`);
  root.style.setProperty('--soul-current-w', `${appWidth}px`);
  root.style.setProperty('--soul-current-h', `${lockedHeight121}px`);
  const app = targets?.appShell || documentRef.querySelector<HTMLElement>('#app');
  if (app) {
    app.style.width = `${appWidth}px`;
    app.style.height = `${lockedHeight121}px`;
  }
}

function hideGhostLayers121(documentRef: Document) {
  documentRef.querySelectorAll<HTMLElement>(GHOST_SELECTOR_121).forEach((node) => {
    node.setAttribute('aria-hidden', 'true');
    node.style.display = 'none';
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
  });
}

function makeControlsTouchable121(documentRef: Document) {
  documentRef.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    if (button.id === 'startGameBtn') button.disabled = false;
    button.style.touchAction = 'manipulation';
  });
}

function readRoute121(documentRef: Document): PolishRoute121 {
  const body = documentRef.body;
  if (body.classList.contains('field-active') || body.classList.contains('route-field-120')) return 'field';
  if (body.classList.contains('town-active') || body.classList.contains('route-town-120')) return 'town';
  if (body.classList.contains('route-login-120') || body.classList.contains('prestart-login-120')) return 'login';
  return 'title';
}

function setVisible121(el: HTMLElement, visible: boolean) {
  el.classList.toggle('hidden', !visible);
  el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  el.style.display = visible ? '' : 'none';
  el.style.opacity = visible ? '1' : '0';
  el.style.visibility = visible ? 'visible' : 'hidden';
  el.style.pointerEvents = visible ? 'auto' : 'none';
}

function overlap121(a: DOMRect, b: DOMRect, gap: number) {
  return !(a.right + gap <= b.left || b.right + gap <= a.left || a.bottom + gap <= b.top || b.bottom + gap <= a.top);
}
