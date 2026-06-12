type PortraitFieldRefs103 = {
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  closeButtons?: Array<HTMLElement | null>;
};

export type PortraitFieldReport103 = {
  route: 'title' | 'login' | 'town' | 'field';
  portraitLocked: boolean;
  landscape: boolean;
  overflowCount: number;
  monsterCardReady: boolean;
  controlReady: boolean;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
};

let installed = false;
let queued = false;
let refs103: PortraitFieldRefs103 = {};
let lastLockAttempt = 0;
let lastReport: PortraitFieldReport103 | null = null;

const FIELD_NODES_103 = [
  '.hud-top',
  '.resource-strip',
  '.field-minimap',
  '.target-card',
  '.field-quest-tracker',
  '.field-chain-meter',
  '.combat-log-toggle',
  '.combat-log',
  '.joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock'
] as const;

export function installPortraitFieldUx103(documentRef: Document, refs: PortraitFieldRefs103 = {}) {
  refs103 = refs;
  documentRef.body.classList.add('fantasy-ui-103', 'portrait-lock-103', 'field-ui-103');
  ensureHeadPortraitHints103(documentRef);
  ensureFieldShell103(documentRef);
  decorateFieldControls103(documentRef);
  syncPortraitFieldUx103(documentRef);

  if (installed) return;
  installed = true;
  const queue = () => queuePortraitFieldSync103(documentRef);
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(queue, 120), { passive: true });
  window.addEventListener('pageshow', queue, { passive: true });
  documentRef.addEventListener('visibilitychange', () => { if (!documentRef.hidden) queue(); });
  documentRef.addEventListener('pointerdown', () => {
    void requestPortraitLock103();
    queue();
  }, { passive: true });
  documentRef.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, [role="button"], a, input, select, textarea')) void requestPortraitLock103();
  }, { passive: true });
  new MutationObserver(queue).observe(documentRef.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: false });
  window.setTimeout(queue, 180);
  window.setTimeout(queue, 900);
}

export function syncPortraitFieldUx103(documentRef: Document = document) {
  const route = detectRoute103(documentRef);
  clearRouteClasses103(documentRef.body);
  documentRef.body.classList.add(`route-${route}-103`);
  documentRef.body.dataset.route103 = route;

  const landscape = isLandscape103();
  documentRef.body.classList.toggle('landscape-guard-103', landscape);
  documentRef.body.classList.toggle('portrait-ready-103', !landscape);
  documentRef.body.classList.toggle('field-compact-103', route === 'field' && (window.innerWidth <= 430 || window.innerHeight <= 740));
  documentRef.body.classList.toggle('field-ultra-compact-103', route === 'field' && window.innerWidth <= 370);
  documentRef.body.classList.toggle('field-short-103', route === 'field' && window.innerHeight <= 680);
  documentRef.body.classList.toggle('field-tall-103', route === 'field' && window.innerHeight >= 780);

  ensureFieldShell103(documentRef);
  decorateFieldControls103(documentRef);
  applyTextContrast103(documentRef, route);
  applyLiteBudget103(documentRef, route);
  updateOrientationGuard103(documentRef, landscape);
  lastReport = inspectPortraitFieldUx103(documentRef);
  documentRef.body.classList.toggle('field-overflow-103', lastReport.overflowCount > 0);
}

export function queuePortraitFieldSync103(documentRef: Document = document) {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    syncPortraitFieldUx103(documentRef);
  });
}

export function inspectPortraitFieldUx103(documentRef: Document = document): PortraitFieldReport103 {
  const route = detectRoute103(documentRef);
  const landscape = isLandscape103();
  const overflowCount = route === 'field' ? countOverflow103(documentRef) : 0;
  const monsterCardReady = Boolean(documentRef.querySelector('.target-card.monster-card-103'));
  const controlReady = Boolean(documentRef.querySelector('.action-dock.field-action-grid-103')) && Boolean(documentRef.querySelector('.skill-dock.field-skill-stack-103'));
  const portraitLocked = documentRef.body.classList.contains('portrait-lock-103') && !landscape;
  const ok = route !== 'field' ? !landscape : !landscape && overflowCount === 0 && monsterCardReady && controlReady;
  const report: PortraitFieldReport103 = {
    route,
    portraitLocked,
    landscape,
    overflowCount,
    monsterCardReady,
    controlReady,
    level: ok ? 'ok' : 'warn',
    message: ok ? '1.03 세로/필드 UI 정상' : `1.03 세로/필드 UI 점검 · overflow ${overflowCount}`,
    hint: landscape ? '브라우저가 가로 회전을 허용했습니다. 세로 안내/잠금 가드가 활성화됩니다.' : `route ${route} · monster ${monsterCardReady ? 'ok' : 'missing'} · controls ${controlReady ? 'ok' : 'missing'}`
  };
  lastReport = report;
  return report;
}

export function lastPortraitFieldReport103() {
  return lastReport;
}

async function requestPortraitLock103() {
  const now = Date.now();
  if (now - lastLockAttempt < 1500) return;
  lastLockAttempt = now;
  const screenWithOrientation = window.screen as Screen & {
    orientation?: ScreenOrientation & { lock?: (orientation: 'portrait' | 'portrait-primary') => Promise<void> };
  };
  try {
    await screenWithOrientation.orientation?.lock?.('portrait-primary');
  } catch {
    try { await screenWithOrientation.orientation?.lock?.('portrait'); } catch {}
  }
}

function ensureHeadPortraitHints103(documentRef: Document) {
  const hints: Array<[string, string]> = [
    ['screen-orientation', 'portrait'],
    ['x5-orientation', 'portrait'],
    ['x5-fullscreen', 'true'],
    ['full-screen', 'yes'],
    ['browsermode', 'application']
  ];
  for (const [name, content] of hints) {
    let meta = documentRef.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!meta) {
      meta = documentRef.createElement('meta');
      meta.name = name;
      documentRef.head.appendChild(meta);
    }
    meta.content = content;
  }
}

function ensureFieldShell103(documentRef: Document) {
  let shell = documentRef.querySelector<HTMLElement>('.field-hud-shell-100');
  if (!shell) {
    shell = documentRef.createElement('section');
    shell.className = 'field-hud-shell-100 field-hud-shell-103';
    shell.id = 'fieldHudShell100';
    shell.setAttribute('aria-label', '사냥터 전투 UI');
    shell.setAttribute('aria-hidden', 'true');
    (documentRef.querySelector('#app') || documentRef.body).appendChild(shell);
  }
  shell.classList.add('field-hud-shell-103');
  const fieldActive = detectRoute103(documentRef) === 'field';
  shell.setAttribute('aria-hidden', fieldActive ? 'false' : 'true');
  for (const selector of FIELD_NODES_103) {
    const node = documentRef.querySelector<HTMLElement>(selector);
    if (!node || node.parentElement === shell) continue;
    shell.appendChild(node);
  }
}

function decorateFieldControls103(documentRef: Document) {
  documentRef.querySelector<HTMLElement>('.target-card')?.classList.add('monster-card-103', 'field-card-103');
  documentRef.querySelector<HTMLElement>('.hud-top')?.classList.add('field-player-card-103', 'field-card-103');
  documentRef.querySelector<HTMLElement>('.resource-strip')?.classList.add('field-resource-pill-103');
  documentRef.querySelector<HTMLElement>('.field-minimap')?.classList.add('field-minimap-103');
  documentRef.querySelector<HTMLElement>('.field-quest-tracker')?.classList.add('field-quest-103', 'field-card-103');
  documentRef.querySelector<HTMLElement>('.field-chain-meter')?.classList.add('field-chain-103');
  documentRef.querySelector<HTMLElement>('.joystick')?.classList.add('field-joystick-103');
  documentRef.querySelector<HTMLElement>('.potion-dock')?.classList.add('field-potions-103');
  documentRef.querySelector<HTMLElement>('.skill-dock')?.classList.add('field-skill-stack-103');
  documentRef.querySelector<HTMLElement>('.action-dock')?.classList.add('field-action-grid-103');
  documentRef.querySelector<HTMLElement>('.combat-log')?.classList.add('field-log-103');
  documentRef.querySelector<HTMLElement>('.combat-log-toggle')?.classList.add('field-log-toggle-103');
  const attack = documentRef.querySelector<HTMLButtonElement>('#attackBtn');
  attack?.classList.add('field-attack-103');
  const auto = documentRef.querySelector<HTMLButtonElement>('#autoHuntBtn');
  auto?.classList.add('field-auto-103');
  const menu = documentRef.querySelector<HTMLButtonElement>('#fieldMenuBtn');
  menu?.classList.add('field-menu-103');
  const inventory = documentRef.querySelector<HTMLButtonElement>('#inventoryBtn');
  inventory?.classList.add('field-bag-103');
  const sleep = documentRef.querySelector<HTMLButtonElement>('#sleepModeBtn');
  sleep?.classList.add('field-sleep-103');
  documentRef.querySelectorAll<HTMLButtonElement>('.skill-btn').forEach((button, index) => {
    button.classList.add('field-skill-103');
    button.style.setProperty('--skill-index-103', String(index));
  });
  documentRef.querySelectorAll<HTMLButtonElement>('.potion-btn').forEach((button) => button.classList.add('field-potion-103'));
  refs103.closeButtons?.forEach((button) => button?.classList.add('close-gem-103'));
  documentRef.querySelectorAll<HTMLButtonElement>('#closeSheet, #closeTownContent, #closeItemDetail, .item-detail-close').forEach((button) => button.classList.add('close-gem-103'));
}

function applyTextContrast103(documentRef: Document, route: PortraitFieldReport103['route']) {
  documentRef.body.classList.toggle('light-panel-contrast-103', route === 'town' || route === 'login');
  documentRef.body.classList.toggle('dark-field-contrast-103', route === 'field');
  documentRef.querySelectorAll<HTMLElement>('.sheet, .town-drawer, .item-detail-card, .town-clean-hub-098').forEach((node) => node.classList.add('readable-panel-103'));
}

function applyLiteBudget103(documentRef: Document, route: PortraitFieldReport103['route']) {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  let forced = false;
  try { forced = localStorage.getItem('soul-online-lite-render-091') === '1' || localStorage.getItem('soul-online-field-lite-100') === '1'; } catch {}
  const lite = forced || saveData || memory <= 3 || cores <= 4 || /2g|slow-2g|3g/.test(network) || (route === 'field' && (window.innerWidth <= 390 || window.innerHeight <= 700));
  documentRef.body.classList.toggle('field-lite-103', lite);
  documentRef.body.classList.toggle('field-balanced-103', !lite);
}

function updateOrientationGuard103(documentRef: Document, landscape: boolean) {
  const guard = documentRef.querySelector<HTMLElement>('.orientation-guard');
  if (!guard) return;
  guard.setAttribute('aria-hidden', landscape ? 'false' : 'true');
  if (landscape) {
    const title = guard.querySelector('b');
    const copy = guard.querySelector('span');
    if (title) title.textContent = '세로 모드 전용 게임입니다';
    if (copy) copy.textContent = '소울 온라인은 세로 화면에 최적화되어 있습니다. 기기를 세로로 돌리면 UI가 정상 배치됩니다.';
  }
}

function detectRoute103(documentRef: Document): PortraitFieldReport103['route'] {
  if (documentRef.body.classList.contains('field-active') || Boolean(refs103.gameRoot?.childElementCount)) return 'field';
  if (refs103.townScreen && !refs103.townScreen.classList.contains('hidden')) return 'town';
  if (refs103.loginScreen && !refs103.loginScreen.classList.contains('hidden')) return 'login';
  if (refs103.titleScreen && !refs103.titleScreen.classList.contains('hidden')) return 'title';
  if (documentRef.querySelector('#townScreen:not(.hidden)')) return 'town';
  if (documentRef.querySelector('#loginScreen:not(.hidden)')) return 'login';
  return 'title';
}

function clearRouteClasses103(body: HTMLElement) {
  const old = Array.from(body.classList).filter((name) => /^route-(title|login|town|field)-103$/.test(name));
  if (old.length) body.classList.remove(...old);
}

function isLandscape103() {
  return window.innerWidth > window.innerHeight && window.innerHeight < 720;
}

function countOverflow103(documentRef: Document) {
  const vw = window.innerWidth || documentRef.documentElement.clientWidth || 0;
  const vh = window.innerHeight || documentRef.documentElement.clientHeight || 0;
  if (!vw || !vh) return 0;
  const selectors = [
    '.field-player-card-103',
    '.field-resource-pill-103',
    '.monster-card-103',
    '.field-quest-103',
    '.field-minimap-103',
    '.field-joystick-103',
    '.field-potions-103',
    '.field-skill-stack-103',
    '.field-action-grid-103'
  ];
  let count = 0;
  for (const selector of selectors) {
    const node = documentRef.querySelector<HTMLElement>(selector);
    if (!node || node.offsetParent === null) continue;
    const rect = node.getBoundingClientRect();
    const tolerance = 3;
    if (rect.left < -tolerance || rect.top < -tolerance || rect.right > vw + tolerance || rect.bottom > vh + tolerance) count += 1;
  }
  return count;
}
