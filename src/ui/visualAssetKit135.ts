export type VisualAssetRoute135 = 'title' | 'login' | 'town' | 'field';
export type VisualAssetLevel135 = 'ok' | 'warn' | 'danger';

export type VisualAssetTargets135 = {
  appShell?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

export type VisualAssetReport135 = {
  level: VisualAssetLevel135;
  message: string;
  hint: string;
  route: VisualAssetRoute135;
  problems: string[];
  assetCount: number;
};

type SoulWindow135 = Window & {
  __soulVisualAssetKit135?: {
    installedAt: number;
    route: VisualAssetRoute135;
    preloads: number;
    repairedTexts: number;
    prunedGhosts: number;
    lastReport?: VisualAssetReport135;
  };
};

const KIT_ASSETS_135 = [
  '/assets/ui/soul135/title-keyart-reference-135.webp',
  '/assets/ui/soul135/town-showcase-blur-bg.webp',
  '/assets/ui/soul135/login-ready-panel.webp',
  '/assets/ui/soul135/town-player-card.webp',
  '/assets/ui/soul135/town-quest-panel.webp',
  '/assets/ui/soul135/action-dock.webp',
  '/assets/ui/soul135/bottom-icon-menu.webp'
];

const ROUTE_CLASSES_135 = ['route-title-135', 'route-login-135', 'route-town-135', 'route-field-135'];
const GHOST_SELECTORS_135 = [
  '.title-hero-rune',
  '.title-character-companion',
  '.title-hero-glow',
  '.pet-panel',
  '.field-pet',
  '.companion-layer',
  '.orientation-guard',
  '.legacy-orb-layer',
  '[data-legacy-visual="pet"]',
  '[data-legacy-visual="rune"]'
];
const DOWNGRADE_CLASSES_135 = [
  'lite-render-091',
  'lite-render-098',
  'art-lite-099',
  'field-lite-100',
  'perf-lite-101',
  'asset-lite-102',
  'quality-lite-104',
  'engine-lite-105',
  'asset-atlas-lite-106',
  'final-lite-107',
  'runtime-lite-112',
  'asset-delivery-lite-115'
];
const STALE_STORAGE_135 = [
  'soul-online-force-lite-106',
  'soul-online-atlas-mode-106',
  'soul-online-render-tier-112',
  'soul-online-use-lite-atlas-115',
  'soul-online-force-high-atlas-115'
];

let installed135 = false;
let observer135: MutationObserver | null = null;
let sweepTimer135 = 0;
let lastReport135: VisualAssetReport135 = {
  level: 'warn',
  message: '1.35 비주얼 에셋 키트 대기',
  hint: '설치 전',
  route: 'title',
  problems: ['설치 전'],
  assetCount: 0
};

export function installVisualAssetKit135(documentRef: Document, targets: VisualAssetTargets135 = {}) {
  const win = documentRef.defaultView as SoulWindow135 | null;
  if (!win) return inspectVisualAssetKit135(documentRef, targets);
  if (installed135) {
    syncVisualAssetRoute135(documentRef, inferRoute135(documentRef), targets);
    return inspectVisualAssetKit135(documentRef, targets);
  }

  installed135 = true;
  win.__soulVisualAssetKit135 = {
    installedAt: performance.now(),
    route: inferRoute135(documentRef),
    preloads: 0,
    repairedTexts: 0,
    prunedGhosts: 0
  };

  documentRef.documentElement.classList.add('soul-visual-asset-kit-135');
  documentRef.body.classList.add('fantasy-ui-135', 'visual-asset-kit-135', 'visual-quality-preserved-135', 'ui-sheet-upgrade-135');
  documentRef.body.dataset.alphaVersion = '1.40.0';
  documentRef.body.dataset.visualPolicy135 = 'reference-art-preserved';
  purgeStaleStorage135();
  stripDowngradeClasses135(documentRef);
  ensurePreloads135(documentRef, win);
  repairUserFacingText135(documentRef, win);
  installDesignBadge135(documentRef);
  pruneGhostLayers135(documentRef, win);
  stampAssetClasses135(documentRef);

  observer135 = new MutationObserver(() => scheduleSweep135(documentRef, targets, 140));
  observer135.observe(documentRef.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'disabled', 'aria-disabled'] });

  const sweep = () => scheduleSweep135(documentRef, targets, 120);
  win.addEventListener('pageshow', sweep, { passive: true });
  win.addEventListener('online', sweep, { passive: true });
  win.addEventListener('offline', sweep, { passive: true });
  win.addEventListener('visibilitychange', sweep, { passive: true });

  syncVisualAssetRoute135(documentRef, inferRoute135(documentRef), targets);
  win.setTimeout(() => syncVisualAssetRoute135(documentRef, inferRoute135(documentRef), targets), 800);
  return inspectVisualAssetKit135(documentRef, targets);
}

export function syncVisualAssetRoute135(documentRef: Document, route: VisualAssetRoute135 | string, targets: VisualAssetTargets135 = {}) {
  const normalized = normalizeRoute135(route);
  const win = documentRef.defaultView as SoulWindow135 | null;
  if (!win) return;
  if (!win.__soulVisualAssetKit135) {
    win.__soulVisualAssetKit135 = {
      installedAt: performance.now(),
      route: normalized,
      preloads: 0,
      repairedTexts: 0,
      prunedGhosts: 0
    };
  }

  documentRef.body.dataset.route135 = normalized;
  documentRef.body.classList.remove(...ROUTE_CLASSES_135);
  documentRef.body.classList.add(`route-${normalized}-135`);
  documentRef.body.classList.toggle('network-offline-135', !navigator.onLine);
  documentRef.body.classList.toggle('network-online-135', navigator.onLine);
  stripDowngradeClasses135(documentRef);
  repairUserFacingText135(documentRef, win);
  pruneGhostLayers135(documentRef, win);
  applySceneVisibility135(documentRef, normalized, targets);
  updateDesignBadge135(documentRef, normalized);
  win.__soulVisualAssetKit135.route = normalized;
  win.__soulVisualAssetKit135.lastReport = inspectVisualAssetKit135(documentRef, targets);
}

export function inspectVisualAssetKit135(documentRef: Document, targets: VisualAssetTargets135 = {}): VisualAssetReport135 {
  const win = documentRef.defaultView as SoulWindow135 | null;
  const state = win?.__soulVisualAssetKit135;
  const route = normalizeRoute135(state?.route || inferRoute135(documentRef));
  const problems: string[] = [];
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const start = targets.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  const root = targets.gameRoot || documentRef.querySelector<HTMLElement>('#game-root');
  const visible = visibleScenes135(documentRef, targets);
  const downgraded = DOWNGRADE_CLASSES_135.filter((name) => documentRef.body.classList.contains(name));
  const preloads = KIT_ASSETS_135.filter((href) => Boolean(documentRef.querySelector(`link[href="${href}"]`)));
  const canvasCount = root?.querySelectorAll('canvas').length || 0;
  const titleBg = title ? getComputedStyle(title).backgroundImage : '';

  if (!documentRef.body.classList.contains('visual-asset-kit-135')) problems.push('1.35 키트 미설치');
  if (!title || !titleBg.includes('soul135/title')) problems.push('타이틀 신규 키아트 대기');
  if (!login) problems.push('로그인 DOM 없음');
  if (!town) problems.push('마을 DOM 없음');
  if (!start || start.disabled) problems.push('START 버튼 대기');
  if (visible.length > 1) problems.push(`장면 중첩 ${visible.join('/')}`);
  if (downgraded.length) problems.push(`화질저하 class ${downgraded.length}`);
  if (canvasCount > 1) problems.push(`중복 canvas ${canvasCount}`);
  if (preloads.length < 3) problems.push('핵심 UI 에셋 preload 부족');
  if (!documentRef.querySelector('.soul-design-badge-135')) problems.push('디자인 상태 pill 없음');

  const level: VisualAssetLevel135 = problems.some((problem) => /DOM 없음|중복 canvas|화질저하/.test(problem)) ? 'danger' : problems.length ? 'warn' : 'ok';
  const report: VisualAssetReport135 = {
    level,
    message: level === 'ok' ? '1.35 레퍼런스 UI 적용' : level === 'warn' ? '1.35 UI 보정 중' : '1.35 UI 연결 점검 필요',
    hint: problems.length ? problems.join(' · ') : `route ${route} · assets ${preloads.length}/${KIT_ASSETS_135.length}`,
    route,
    problems,
    assetCount: preloads.length
  };
  lastReport135 = report;
  return report;
}

function ensurePreloads135(documentRef: Document, win: SoulWindow135) {
  let added = 0;
  for (const href of KIT_ASSETS_135) {
    if (documentRef.querySelector(`link[href="${href}"]`)) continue;
    const link = documentRef.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    if (href.includes('title')) link.setAttribute('fetchpriority', 'high');
    documentRef.head.appendChild(link);
    added += 1;
  }
  if (win.__soulVisualAssetKit135) win.__soulVisualAssetKit135.preloads += added;
}

function repairUserFacingText135(documentRef: Document, win: SoulWindow135) {
  const pairs: Array<[string, string]> = [
    ['#loginFlowHint', '접속이 지연되어도 로컬 게스트로 먼저 시작할 수 있습니다.'],
    ['#loginStatus', '접속 방식을 선택하세요. Firebase가 느리면 로컬 모드로 바로 진행됩니다.'],
    ['#serverNextBtn', '입장하기'],
    ['#enterTownBtn', '마을 입장'],
    ['#connectCharacterBtn', '캐릭터 접속'],
    ['#newCharacterBtn', '새 캐릭터']
  ];
  let fixed = 0;
  for (const [selector, text] of pairs) {
    const node = documentRef.querySelector<HTMLElement>(selector);
    if (!node) continue;
    if ((node.textContent || '').trim() !== text) {
      node.textContent = text;
      fixed += 1;
    }
  }
  const versionNodes = Array.from(documentRef.querySelectorAll<HTMLElement>('.title-mini-nav span'));
  const version = versionNodes.find((node) => /^v\d+\.\d+\.\d+/.test((node.textContent || '').trim()));
  if (version && version.textContent !== 'v1.40.0') {
    version.textContent = 'v1.40.0';
    fixed += 1;
  }
  if (win.__soulVisualAssetKit135) win.__soulVisualAssetKit135.repairedTexts += fixed;
}

function stampAssetClasses135(documentRef: Document) {
  documentRef.querySelector('#titleScreen')?.classList.add('title-reference-135');
  documentRef.querySelector('#loginScreen')?.classList.add('login-reference-135');
  documentRef.querySelector('#townScreen')?.classList.add('town-reference-135');
  documentRef.querySelector('#sheet')?.classList.add('sheet-reference-135');
  documentRef.querySelector('#itemDetailModal')?.classList.add('modal-reference-135');
  for (const node of Array.from(documentRef.querySelectorAll<HTMLElement>('.wide-action,.server-card,.class-card,[data-town-content],[data-open-field-menu]'))) {
    node.classList.add('asset-polished-135');
  }
}

function installDesignBadge135(documentRef: Document) {
  if (documentRef.querySelector('.soul-design-badge-135')) return;
  const badge = documentRef.createElement('div');
  badge.className = 'soul-design-badge-135';
  badge.setAttribute('aria-live', 'polite');
  badge.textContent = navigator.onLine ? 'High Art UI · 연결 안정' : '오프라인 모드 · 로컬 진행';
  documentRef.body.appendChild(badge);
}

function updateDesignBadge135(documentRef: Document, route: VisualAssetRoute135) {
  const badge = documentRef.querySelector<HTMLElement>('.soul-design-badge-135');
  if (!badge) return;
  const label = route === 'title' ? '타이틀 키아트' : route === 'login' ? '접속 준비' : route === 'town' ? '루미나 마을' : '2.5D 필드';
  badge.textContent = navigator.onLine ? `${label} · High Art UI` : `${label} · 로컬/오프라인 진행`;
}

function pruneGhostLayers135(documentRef: Document, win: SoulWindow135) {
  let count = 0;
  for (const selector of GHOST_SELECTORS_135) {
    for (const node of Array.from(documentRef.querySelectorAll<HTMLElement>(selector))) {
      node.setAttribute('aria-hidden', 'true');
      node.dataset.soul135Hidden = 'ghost-pruned';
      if (node.style.display !== 'none') {
        node.style.display = 'none';
        count += 1;
      }
    }
  }
  if (win.__soulVisualAssetKit135) win.__soulVisualAssetKit135.prunedGhosts += count;
}

function stripDowngradeClasses135(documentRef: Document) {
  for (const className of DOWNGRADE_CLASSES_135) documentRef.body.classList.remove(className);
}

function purgeStaleStorage135() {
  for (const key of STALE_STORAGE_135) {
    try { localStorage.removeItem(key); } catch { /* ignore private mode */ }
  }
}

function applySceneVisibility135(documentRef: Document, route: VisualAssetRoute135, targets: VisualAssetTargets135 = {}) {
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const scenes: Array<[VisualAssetRoute135, HTMLElement | null | undefined]> = [['title', title], ['login', login], ['town', town]];
  for (const [name, node] of scenes) {
    if (!node) continue;
    const visible = name === route || (name === 'town' && route === 'field');
    node.classList.toggle('hidden', !visible);
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }
}

function visibleScenes135(documentRef: Document, targets: VisualAssetTargets135 = {}) {
  const scenes: Array<[VisualAssetRoute135, HTMLElement | null | undefined]> = [
    ['title', targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen')],
    ['login', targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen')],
    ['town', targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen')]
  ];
  return scenes.filter(([, node]) => node && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && Number(getComputedStyle(node).opacity || '1') > 0.01).map(([name]) => name);
}

function scheduleSweep135(documentRef: Document, targets: VisualAssetTargets135, delay: number) {
  const win = documentRef.defaultView as SoulWindow135 | null;
  if (!win) return;
  if (sweepTimer135) win.clearTimeout(sweepTimer135);
  sweepTimer135 = win.setTimeout(() => {
    sweepTimer135 = 0;
    syncVisualAssetRoute135(documentRef, inferRoute135(documentRef), targets);
  }, delay);
}

function inferRoute135(documentRef: Document): VisualAssetRoute135 {
  if (documentRef.body.classList.contains('field-active') || documentRef.body.dataset.route134 === 'field') return 'field';
  if (documentRef.body.classList.contains('town-active') || documentRef.body.dataset.route134 === 'town') return 'town';
  if (documentRef.body.classList.contains('prestart-login-120') || documentRef.body.dataset.route134 === 'login') return 'login';
  const title = documentRef.querySelector<HTMLElement>('#titleScreen');
  return title && !title.classList.contains('hidden') ? 'title' : 'login';
}

function normalizeRoute135(route: VisualAssetRoute135 | string): VisualAssetRoute135 {
  return route === 'field' || route === 'town' || route === 'login' || route === 'title' ? route : 'title';
}

export function lastVisualAssetReport135() {
  return lastReport135;
}
