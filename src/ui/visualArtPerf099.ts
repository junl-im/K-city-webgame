type VisualArtRefs099 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
  titleAudioButton?: HTMLButtonElement | null;
  closeButtons?: HTMLButtonElement[];
};

export type VisualArtAudit099 = {
  route: 'title' | 'login' | 'town' | 'field';
  artReady: boolean;
  startReady: boolean;
  overflowCount: number;
  budget: 'luxury' | 'balanced' | 'lite';
  message: string;
  level: 'ok' | 'warn';
};

let refs: VisualArtRefs099 | null = null;
let installed = false;
let syncQueued = false;
let lastBudget: VisualArtAudit099['budget'] = 'balanced';

export function installVisualArtPerf099(nextRefs: VisualArtRefs099) {
  refs = nextRefs;
  document.body.classList.add('fantasy-ui-099', 'visual-art-099', 'mobile-optimized-099');
  installCriticalArtPreloads099();
  applyDomImagePolicy099(document);
  decorate099(nextRefs);
  syncVisualArtPerf099(nextRefs);
  if (!installed) {
    installed = true;
    const queue = () => queueVisualSync099();
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('orientationchange', () => window.setTimeout(queue, 90), { passive: true });
    document.addEventListener('visibilitychange', () => {
      document.body.classList.toggle('tab-hidden-099', document.hidden);
      if (!document.hidden) queueVisualSync099();
    });
    window.setTimeout(() => applyDomImagePolicy099(document), 900);
  }
}

export function queueVisualSync099() {
  if (syncQueued) return;
  syncQueued = true;
  window.requestAnimationFrame(() => {
    syncQueued = false;
    if (refs) syncVisualArtPerf099(refs);
  });
}

export function syncVisualArtPerf099(nextRefs: VisualArtRefs099 = refs as VisualArtRefs099) {
  if (!nextRefs) return;
  refs = nextRefs;
  decorate099(nextRefs);
  const route = detectRoute099(nextRefs);
  document.body.classList.remove('route-title-099', 'route-login-099', 'route-town-099', 'route-field-099');
  document.body.classList.add(`route-${route}-099`);
  document.body.dataset.visualRoute099 = route;
  const budget = detectArtBudget099();
  lastBudget = budget;
  document.body.classList.toggle('art-lite-099', budget === 'lite');
  document.body.classList.toggle('art-balanced-099', budget === 'balanced');
  document.body.classList.toggle('art-luxury-099', budget === 'luxury');
  document.body.classList.toggle('field-compact-099', route === 'field' && (window.innerWidth < 430 || window.innerHeight < 720));
  document.body.classList.toggle('short-viewport-099', window.innerHeight < 680);
  document.body.classList.toggle('narrow-viewport-099', window.innerWidth < 390);
}

export function inspectVisualArt099(nextRefs: VisualArtRefs099 = refs as VisualArtRefs099): VisualArtAudit099 {
  const route = nextRefs ? detectRoute099(nextRefs) : 'title';
  const artReady = Boolean(nextRefs?.titleScreen.classList.contains('title-art-099')) && Boolean(nextRefs?.townScreen.classList.contains('town-art-099'));
  const startReady = isVisible099(nextRefs?.startButton || null);
  const overflowCount = countOverflow099();
  const ok = artReady && startReady && overflowCount === 0;
  return {
    route,
    artReady,
    startReady,
    overflowCount,
    budget: lastBudget,
    level: ok ? 'ok' : 'warn',
    message: ok ? `0.99 아트/성능 정상 · ${lastBudget}` : `0.99 점검 필요 · overflow ${overflowCount} · ${lastBudget}`
  };
}

function decorate099({ titleScreen, loginScreen, townScreen, startButton, titleAudioButton, closeButtons = [] }: VisualArtRefs099) {
  titleScreen.classList.add('title-art-099');
  loginScreen.classList.add('login-art-099');
  townScreen.classList.add('town-art-099');
  const shell = titleScreen.querySelector<HTMLElement>('.entry-clean-098');
  shell?.classList.add('entry-art-099');
  const card = titleScreen.querySelector<HTMLElement>('.entry-card-098');
  card?.classList.add('entry-card-099');
  const actions = titleScreen.querySelector<HTMLElement>('.entry-actions-098');
  if (actions) actions.classList.add('entry-actions-099');
  startButton.classList.add('start-game-btn-099');
  startButton.textContent = 'TOUCH TO START';
  titleAudioButton?.classList.add('title-audio-099');
  closeButtons.forEach((button) => {
    button.classList.add('close-gem-099');
    button.setAttribute('aria-label', button.getAttribute('aria-label') || '닫기');
  });
}

function detectRoute099({ titleScreen, loginScreen, townScreen, gameRoot }: VisualArtRefs099): VisualArtAudit099['route'] {
  if (document.body.classList.contains('field-active') || gameRoot.childElementCount > 0) return 'field';
  if (!townScreen.classList.contains('hidden')) return 'town';
  if (!loginScreen.classList.contains('hidden')) return 'login';
  if (!titleScreen.classList.contains('hidden')) return 'title';
  return 'title';
}

function detectArtBudget099(): VisualArtAudit099['budget'] {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  const forcedLite = localStorageSafeGet099('soul-online-lite-render-091') === '1';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (forcedLite || saveData || reduceMotion || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network)) return 'lite';
  if (memory >= 6 && cores >= 6 && (window.devicePixelRatio || 1) <= 3 && window.innerWidth >= 390) return 'luxury';
  return 'balanced';
}

function installCriticalArtPreloads099() {
  const head = document.head;
  const assets = [
    '/assets/ui/fantasy/099/title-artgrade-lq-099.webp',
    '/assets/ui/fantasy/099/title-artgrade-099.webp',
    '/assets/ui/fantasy/099/panel-parchment-099.webp',
    '/assets/ui/fantasy/099/button-azure-099.webp'
  ];
  for (const href of assets) {
    if (head.querySelector(`link[data-so099-preload="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute('data-so099-preload', href);
    if (href.includes('-lq-') || href.includes('button') || href.includes('panel')) link.setAttribute('fetchpriority', 'low');
    head.appendChild(link);
  }
}

function applyDomImagePolicy099(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    if (!img.closest('.entry-art-099') && !img.closest('.title-screen')) img.loading = 'lazy';
  });
}

function countOverflow099() {
  const selectors = [
    '.entry-art-099', '.login-panel', '.town-clean-hub-098', '#townContentPanel', '.sheet', '.item-detail-card',
    '.hud-top', '.resource-strip', '.target-card', '.field-quest-tracker', '.field-minimap', '.joystick', '.potion-dock', '.skill-dock', '.action-dock'
  ];
  const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
  let count = 0;
  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (!isVisible099(el)) return;
      const rect = el.getBoundingClientRect();
      const pad = 3;
      if (rect.left < -pad || rect.top < -pad || rect.right > viewportW + pad || rect.bottom > viewportH + pad) count += 1;
    });
  }
  return count;
}

function isVisible099(node: Element | null): boolean {
  if (!node) return false;
  const el = node as HTMLElement;
  if (el.classList.contains('hidden')) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

function localStorageSafeGet099(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
