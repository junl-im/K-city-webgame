type FieldHudRefs100 = {
  gameRoot?: HTMLElement | null;
};

export type FieldHudAudit100 = {
  shellReady: boolean;
  route: 'title' | 'login' | 'town' | 'field';
  overflowCount: number;
  budget: 'luxury' | 'balanced' | 'lite';
  message: string;
  level: 'ok' | 'warn';
};

let installed = false;
let syncQueued = false;
let refs: FieldHudRefs100 = {};
let lastBudget: FieldHudAudit100['budget'] = 'balanced';
const FIELD_SELECTORS_100 = [
  '.hud-top',
  '.resource-strip',
  '.target-card',
  '.field-quest-tracker',
  '.field-chain-meter',
  '.field-minimap',
  '.combat-log-toggle',
  '.combat-log',
  '.joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock'
] as const;

export function installFieldHudOverhaul100(nextRefs: FieldHudRefs100 = {}) {
  refs = nextRefs;
  document.body.classList.add('fantasy-ui-100', 'visual-field-100', 'mobile-field-100');
  ensurePreloads100();
  ensureFieldShell100();
  decorateFieldButtons100();
  applyDomImagePolicy100(document);
  syncFieldHudOverhaul100();
  if (!installed) {
    installed = true;
    const queue = () => queueFieldSync100();
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('orientationchange', () => window.setTimeout(queue, 80), { passive: true });
    document.addEventListener('visibilitychange', () => {
      document.body.classList.toggle('tab-hidden-100', document.hidden);
      if (!document.hidden) queue();
    });
    document.addEventListener('pointerdown', () => document.body.classList.add('field-touching-100'), { passive: true });
    document.addEventListener('pointerup', () => document.body.classList.remove('field-touching-100'), { passive: true });
    document.addEventListener('pointercancel', () => document.body.classList.remove('field-touching-100'), { passive: true });
    new MutationObserver(queue).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.setTimeout(queue, 400);
    window.setTimeout(() => applyDomImagePolicy100(document), 1200);
  }
}

export function syncFieldHudOverhaul100() {
  ensureFieldShell100();
  decorateFieldButtons100();
  clearRouteClasses100();
  const route = detectRoute100();
  document.body.classList.add(`route-${route}-100`);
  document.body.dataset.visualRoute100 = route;
  const budget = detectFieldBudget100();
  lastBudget = budget;
  persistFieldBudget100(budget);
  document.body.classList.toggle('field-lite-100', budget === 'lite');
  document.body.classList.toggle('field-balanced-100', budget === 'balanced');
  document.body.classList.toggle('field-luxury-100', budget === 'luxury');
  document.body.classList.toggle('field-compact-100', route === 'field' && (window.innerWidth <= 430 || window.innerHeight <= 720));
  document.body.classList.toggle('field-ultra-compact-100', route === 'field' && window.innerWidth <= 370);
  document.body.classList.toggle('perf-reduced-motion-100', budget === 'lite' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  if (route === 'field') applyFieldA11y100();
  document.body.classList.toggle('field-overflow-risk-100', countFieldOverflow100() > 0);
}

export function queueFieldSync100() {
  if (syncQueued) return;
  syncQueued = true;
  window.requestAnimationFrame(() => {
    syncQueued = false;
    syncFieldHudOverhaul100();
  });
}

export function inspectFieldHud100(): FieldHudAudit100 {
  const route = detectRoute100();
  const shellReady = Boolean(document.querySelector('.field-hud-shell-100'));
  const overflowCount = countFieldOverflow100();
  const ok = shellReady && (route !== 'field' || overflowCount === 0);
  return {
    shellReady,
    route,
    overflowCount,
    budget: lastBudget,
    level: ok ? 'ok' : 'warn',
    message: ok ? `1.00 사냥터 HUD 정상 · ${lastBudget}` : `1.00 사냥터 HUD 점검 · overflow ${overflowCount} · ${lastBudget}`
  };
}

function ensureFieldShell100() {
  let shell = document.querySelector<HTMLElement>('.field-hud-shell-100');
  if (!shell) {
    shell = document.createElement('section');
    shell.className = 'field-hud-shell-100';
    shell.id = 'fieldHudShell100';
    shell.setAttribute('aria-label', '사냥터 전투 UI');
    shell.setAttribute('aria-hidden', 'true');
    const app = document.querySelector('#app') || document.body;
    app.appendChild(shell);
  }
  const fieldActive = detectRoute100() === 'field';
  shell.setAttribute('aria-hidden', fieldActive ? 'false' : 'true');
  for (const selector of FIELD_SELECTORS_100) {
    const node = document.querySelector<HTMLElement>(selector);
    if (!node || node.parentElement === shell) continue;
    shell.appendChild(node);
  }
  shell.querySelectorAll<HTMLElement>(FIELD_SELECTORS_100.join(',')).forEach((node) => {
    node.classList.add('field-hud-node-100');
  });
}

function decorateFieldButtons100() {
  const attack = document.querySelector<HTMLButtonElement>('#attackBtn');
  const auto = document.querySelector<HTMLButtonElement>('#autoHuntBtn');
  const menu = document.querySelector<HTMLButtonElement>('#fieldMenuBtn');
  const hp = document.querySelector<HTMLButtonElement>('#hpPotionBtn');
  const mp = document.querySelector<HTMLButtonElement>('#mpPotionBtn');
  attack?.classList.add('field-attack-100');
  auto?.classList.add('field-auto-100');
  menu?.classList.add('field-menu-100');
  hp?.classList.add('field-potion-100');
  mp?.classList.add('field-potion-100');
  document.querySelectorAll<HTMLButtonElement>('.skill-btn').forEach((button, index) => {
    button.classList.add('field-skill-100');
    button.style.setProperty('--skill-index', String(index));
  });
  document.querySelectorAll<HTMLButtonElement>('#closeSheet, #closeTownContent, #closeItemDetail').forEach((button) => {
    button.classList.add('close-gem-100');
  });
}

function applyFieldA11y100() {
  const quest = document.querySelector<HTMLElement>('#fieldQuestTracker');
  quest?.setAttribute('role', 'status');
  const attack = document.querySelector<HTMLButtonElement>('#attackBtn');
  if (attack && !attack.getAttribute('aria-label')) attack.setAttribute('aria-label', '기본 공격');
  const shell = document.querySelector<HTMLElement>('.field-hud-shell-100');
  shell?.setAttribute('aria-hidden', 'false');
}

function detectRoute100(): FieldHudAudit100['route'] {
  if (document.body.classList.contains('field-active') || (refs.gameRoot?.childElementCount || 0) > 0) return 'field';
  const town = document.querySelector<HTMLElement>('#townScreen');
  const login = document.querySelector<HTMLElement>('#loginScreen');
  const title = document.querySelector<HTMLElement>('#titleScreen');
  if (town && !town.classList.contains('hidden')) return 'town';
  if (login && !login.classList.contains('hidden')) return 'login';
  if (title && !title.classList.contains('hidden')) return 'title';
  return 'title';
}

function clearRouteClasses100() {
  const old = Array.from(document.body.classList).filter((name) => /^route-(title|login|town|field)-100$/.test(name));
  if (old.length) document.body.classList.remove(...old);
}

function detectFieldBudget100(): FieldHudAudit100['budget'] {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  const forcedLite = safeGet100('soul-online-lite-render-091') === '1' || safeGet100('soul-online-field-lite-100') === '1';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (forcedLite || saveData || reduceMotion || memory <= 2 || cores <= 2 || /2g|slow-2g/.test(network)) return 'lite';
  if (memory >= 6 && cores >= 6 && window.innerWidth >= 720 && (window.devicePixelRatio || 1) <= 3) return 'luxury';
  return 'balanced';
}

function persistFieldBudget100(budget: FieldHudAudit100['budget']) {
  try {
    if (budget === 'lite') window.localStorage.setItem('soul-online-field-lite-100', '1');
    else if (safeGet100('soul-online-lite-render-091') !== '1') window.localStorage.removeItem('soul-online-field-lite-100');
  } catch {}
}

function ensurePreloads100() {
  const assets = [
    '/assets/ui/fantasy/100/field-panel-dark-100.webp',
    '/assets/ui/fantasy/100/field-quest-scroll-100.webp',
    '/assets/ui/fantasy/100/attack-orb-100.webp',
    '/assets/ui/fantasy/100/skill-orb-100.webp',
    '/assets/ui/fantasy/100/joystick-ring-100.webp'
  ];
  for (const href of assets) {
    if (document.head.querySelector(`link[data-so100-preload="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute('data-so100-preload', href);
    if (!href.includes('attack')) link.setAttribute('fetchpriority', 'low');
    document.head.appendChild(link);
  }
}

function applyDomImagePolicy100(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    if (!img.closest('.title-screen') && !img.closest('.hud-top')) img.loading = 'lazy';
  });
}

function countFieldOverflow100() {
  if (detectRoute100() !== 'field') return 0;
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const selectors = [
    '.hud-top', '.field-minimap', '.field-quest-tracker', '.target-card', '.field-chain-meter', '.joystick', '.potion-dock', '.skill-dock', '.action-dock', '.sheet.open', '#sheet[aria-hidden="false"]'
  ];
  let count = 0;
  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (!isVisible100(node)) return;
      const rect = node.getBoundingClientRect();
      const pad = 2;
      if (rect.left < -pad || rect.top < -pad || rect.right > vw + pad || rect.bottom > vh + pad) count += 1;
    });
  }
  return count;
}

function isVisible100(node: Element | null): boolean {
  if (!node) return false;
  const el = node as HTMLElement;
  if (el.classList.contains('hidden')) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

function safeGet100(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
