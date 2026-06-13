export type VisualAssetRoute136 = 'title' | 'login' | 'town' | 'field';
export type VisualAssetLevel136 = 'ok' | 'warn' | 'danger';

export type VisualAssetTargets136 = {
  appShell?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
};

export type VisualAssetReport136 = {
  level: VisualAssetLevel136;
  message: string;
  hint: string;
  route: VisualAssetRoute136;
  problems: string[];
  assetCount: number;
  repairedTexts: number;
};

type SoulWindow136 = Window & {
  __soulVisualAssetKit136?: {
    installedAt: number;
    route: VisualAssetRoute136;
    preloads: number;
    repairedTexts: number;
    prunedGhosts: number;
    lastReport?: VisualAssetReport136;
  };
};

const KIT_ASSETS_136 = [
  '/assets/ui/soul136/title-card-polished-136.webp',
  '/assets/ui/soul136/login-panel-soft-136.webp',
  '/assets/ui/soul136/server-panel-soft-136.webp',
  '/assets/ui/soul136/quest-panel-clean-136.webp',
  '/assets/ui/soul136/inventory-panel-clean-136.webp',
  '/assets/ui/soul136/town-hero-profile-clean-136.webp',
  '/assets/ui/soul136/town-menu-grid-clean-136.webp',
  '/assets/ui/soul136/town-quest-list-clean-136.webp',
  '/assets/ui/soul136/town-banner-clean-136.webp',
  '/assets/ui/soul136/town-chat-clean-136.webp',
  '/assets/ui/soul136/town-action-ring-136.webp',
  '/assets/ui/soul136/bottom-menu-icon-kit-136.webp'
] as const;

const OPTIONAL_ASSETS_136 = [
  '/assets/ui/soul136/reference-ui-board-a-136.webp',
  '/assets/ui/soul136/reference-town-board-b-136.webp',
  '/assets/ui/soul136/action-wheel-kit-136.webp',
  '/assets/ui/soul136/town-skill-row-136.webp',
  '/assets/ui/soul136/currency-bar-136.webp',
  '/assets/ui/soul136/right-rail-icon-kit-136.webp',
  '/assets/ui/soul136/mascot-ornament-136.webp'
] as const;

const ROUTE_CLASSES_136 = ['route-title-136', 'route-login-136', 'route-town-136', 'route-field-136'];
const GHOST_SELECTORS_136 = [
  '.title-hero-rune',
  '.title-character-companion',
  '.title-hero-glow',
  '.pet-panel',
  '.field-pet',
  '.companion-layer',
  '.orientation-guard',
  '.legacy-orb-layer',
  '[data-legacy-visual="pet"]',
  '[data-legacy-visual="rune"]',
  '[data-town-content="pet"]'
];
const DOWNGRADE_CLASSES_136 = [
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
const STALE_STORAGE_136 = [
  'soul-online-force-lite-106',
  'soul-online-atlas-mode-106',
  'soul-online-render-tier-112',
  'soul-online-use-lite-atlas-115',
  'soul-online-force-high-atlas-115'
];

let installed136 = false;
let observer136: MutationObserver | null = null;
let sweepTimer136 = 0;
let lastReport136: VisualAssetReport136 = {
  level: 'warn',
  message: '1.36 확장 레퍼런스 UI 대기',
  hint: '설치 전',
  route: 'title',
  problems: ['설치 전'],
  assetCount: 0,
  repairedTexts: 0
};

export function installVisualAssetKit136(documentRef: Document, targets: VisualAssetTargets136 = {}) {
  const win = documentRef.defaultView as SoulWindow136 | null;
  if (!win) return inspectVisualAssetKit136(documentRef, targets);
  if (installed136) {
    syncVisualAssetRoute136(documentRef, inferRoute136(documentRef), targets);
    return inspectVisualAssetKit136(documentRef, targets);
  }

  installed136 = true;
  win.__soulVisualAssetKit136 = {
    installedAt: performance.now(),
    route: inferRoute136(documentRef),
    preloads: 0,
    repairedTexts: 0,
    prunedGhosts: 0
  };

  documentRef.documentElement.classList.add('soul-visual-asset-kit-136');
  documentRef.body.classList.add('fantasy-ui-136', 'visual-asset-kit-136', 'visual-quality-preserved-136', 'ui-reference-expanded-136');
  documentRef.body.dataset.alphaVersion = '1.36.0';
  documentRef.body.dataset.visualPolicy136 = 'reference-assets-expanded';
  purgeStaleStorage136();
  stripDowngradeClasses136(documentRef);
  ensurePreloads136(documentRef, win);
  repairUserFacingText136(documentRef, win);
  stampAssetClasses136(documentRef);
  installDesignBadge136(documentRef);
  pruneGhostLayers136(documentRef, win);

  observer136 = new MutationObserver(() => scheduleSweep136(documentRef, targets, 120));
  observer136.observe(documentRef.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'disabled', 'aria-disabled'] });

  const sweep = () => scheduleSweep136(documentRef, targets, 100);
  win.addEventListener('pageshow', sweep, { passive: true });
  win.addEventListener('online', sweep, { passive: true });
  win.addEventListener('offline', sweep, { passive: true });
  win.addEventListener('visibilitychange', sweep, { passive: true });

  syncVisualAssetRoute136(documentRef, inferRoute136(documentRef), targets);
  win.setTimeout(() => syncVisualAssetRoute136(documentRef, inferRoute136(documentRef), targets), 650);
  return inspectVisualAssetKit136(documentRef, targets);
}

export function syncVisualAssetRoute136(documentRef: Document, route: VisualAssetRoute136 | string, targets: VisualAssetTargets136 = {}) {
  const normalized = normalizeRoute136(route);
  const win = documentRef.defaultView as SoulWindow136 | null;
  if (!win) return;
  if (!win.__soulVisualAssetKit136) {
    win.__soulVisualAssetKit136 = {
      installedAt: performance.now(),
      route: normalized,
      preloads: 0,
      repairedTexts: 0,
      prunedGhosts: 0
    };
  }

  documentRef.body.dataset.route136 = normalized;
  documentRef.body.classList.remove(...ROUTE_CLASSES_136);
  documentRef.body.classList.add(`route-${normalized}-136`);
  documentRef.body.classList.toggle('network-offline-136', !navigator.onLine);
  documentRef.body.classList.toggle('network-online-136', navigator.onLine);
  stripDowngradeClasses136(documentRef);
  repairUserFacingText136(documentRef, win);
  pruneGhostLayers136(documentRef, win);
  applySceneVisibility136(documentRef, normalized, targets);
  updateDesignBadge136(documentRef, normalized);
  win.__soulVisualAssetKit136.route = normalized;
  win.__soulVisualAssetKit136.lastReport = inspectVisualAssetKit136(documentRef, targets);
}

export function inspectVisualAssetKit136(documentRef: Document, targets: VisualAssetTargets136 = {}): VisualAssetReport136 {
  const win = documentRef.defaultView as SoulWindow136 | null;
  const state = win?.__soulVisualAssetKit136;
  const route = normalizeRoute136(state?.route || inferRoute136(documentRef));
  const problems: string[] = [];
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const start = targets.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  const root = targets.gameRoot || documentRef.querySelector<HTMLElement>('#game-root');
  const visible = visibleScenes136(documentRef, targets);
  const downgraded = DOWNGRADE_CLASSES_136.filter((name) => documentRef.body.classList.contains(name));
  const preloads = KIT_ASSETS_136.filter((href) => Boolean(documentRef.querySelector(`link[href="${href}"]`)));
  const canvasCount = root?.querySelectorAll('canvas').length || 0;
  const titleBg = title ? getComputedStyle(title).backgroundImage : '';

  if (!documentRef.body.classList.contains('visual-asset-kit-136')) problems.push('1.36 확장 키트 미설치');
  if (!title || (!titleBg.includes('soul136/title') && !titleBg.includes('soul135/title'))) problems.push('타이틀 키아트 대기');
  if (!login) problems.push('로그인 DOM 없음');
  if (!town) problems.push('마을 DOM 없음');
  if (!start || start.disabled) problems.push('START 버튼 대기');
  if (visible.length > 1) problems.push(`장면 중첩 ${visible.join('/')}`);
  if (downgraded.length) problems.push(`화질저하 class ${downgraded.length}`);
  if (canvasCount > 1) problems.push(`중복 canvas ${canvasCount}`);
  if (preloads.length < 5) problems.push('확장 UI 에셋 preload 부족');
  if (!documentRef.querySelector('.soul-design-badge-136')) problems.push('1.36 디자인 상태 pill 없음');

  const level: VisualAssetLevel136 = problems.some((problem) => /DOM 없음|중복 canvas|화질저하/.test(problem)) ? 'danger' : problems.length ? 'warn' : 'ok';
  const report: VisualAssetReport136 = {
    level,
    message: level === 'ok' ? '1.36 레퍼런스 확장 UI 적용' : level === 'warn' ? '1.36 UI 보정 중' : '1.36 UI 연결 점검 필요',
    hint: problems.length ? problems.join(' · ') : `route ${route} · assets ${preloads.length}/${KIT_ASSETS_136.length}`,
    route,
    problems,
    assetCount: preloads.length,
    repairedTexts: state?.repairedTexts || 0
  };
  lastReport136 = report;
  return report;
}

function ensurePreloads136(documentRef: Document, win: SoulWindow136) {
  let added = 0;
  for (const href of KIT_ASSETS_136) {
    if (documentRef.querySelector(`link[href="${href}"]`)) continue;
    const link = documentRef.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    if (href.includes('title-card')) link.setAttribute('fetchpriority', 'high');
    documentRef.head.appendChild(link);
    added += 1;
  }
  // 보조 에셋은 첫 화면을 막지 않도록 낮은 우선순위 preload로만 등록한다.
  for (const href of OPTIONAL_ASSETS_136) {
    if (documentRef.querySelector(`link[href="${href}"]`)) continue;
    const link = documentRef.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute('fetchpriority', 'low');
    documentRef.head.appendChild(link);
    added += 1;
  }
  if (win.__soulVisualAssetKit136) win.__soulVisualAssetKit136.preloads += added;
}

function repairUserFacingText136(documentRef: Document, win: SoulWindow136) {
  const pairs: Array<[string, string]> = [
    ['#loginFlowHint', '접속이 지연되어도 로컬 게스트로 먼저 시작할 수 있습니다.'],
    ['#loginStatus', '접속 방식을 선택하세요. 서버가 느리면 로컬 모드로 바로 진행됩니다.'],
    ['#guestLoginBtn', '게스트 접속'],
    ['#googleLoginBtn', 'Google 로그인'],
    ['#localLoginBtn', '로컬 저장으로 계속'],
    ['#serverNextBtn', '입장하기'],
    ['#enterTownBtn', '마을 입장'],
    ['#connectCharacterBtn', '캐릭터 접속'],
    ['#newCharacterBtn', '새 캐릭터'],
    ['#characterNextBtn', '캐릭터 생성 완료']
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
  for (const node of Array.from(documentRef.querySelectorAll<HTMLElement>('button,span,b,em'))) {
    const text = (node.textContent || '').trim();
    if (text === '펫') {
      node.textContent = '동료';
      node.dataset.soul136TextRepaired = 'pet-to-companion';
      fixed += 1;
    }
  }
  const versionNodes = Array.from(documentRef.querySelectorAll<HTMLElement>('.title-mini-nav span'));
  const version = versionNodes.find((node) => /^v\d+\.\d+\.\d+/.test((node.textContent || '').trim()));
  if (version && version.textContent !== 'v1.36.0') {
    version.textContent = 'v1.36.0';
    fixed += 1;
  }
  if (win.__soulVisualAssetKit136) win.__soulVisualAssetKit136.repairedTexts += fixed;
}

function stampAssetClasses136(documentRef: Document) {
  documentRef.querySelector('#titleScreen')?.classList.add('title-reference-136');
  documentRef.querySelector('#loginScreen')?.classList.add('login-reference-136');
  documentRef.querySelector('#townScreen')?.classList.add('town-reference-136');
  documentRef.querySelector('#sheet')?.classList.add('sheet-reference-136');
  documentRef.querySelector('#itemDetailModal')?.classList.add('modal-reference-136');
  for (const node of Array.from(documentRef.querySelectorAll<HTMLElement>('.wide-action,.server-card,.class-card,[data-town-content],[data-open-field-menu],[data-zone-id]'))) {
    node.classList.add('asset-polished-136');
  }
  documentRef.body.classList.add('text-repair-136');
}

function installDesignBadge136(documentRef: Document) {
  if (documentRef.querySelector('.soul-design-badge-136')) return;
  const badge = documentRef.createElement('div');
  badge.className = 'soul-design-badge-136';
  badge.setAttribute('aria-live', 'polite');
  badge.textContent = navigator.onLine ? '1.36 Reference UI · 원화 품질 유지' : '1.36 Reference UI · 로컬 진행';
  documentRef.body.appendChild(badge);
}

function updateDesignBadge136(documentRef: Document, route: VisualAssetRoute136) {
  const badge = documentRef.querySelector<HTMLElement>('.soul-design-badge-136');
  if (!badge) return;
  const label = route === 'title' ? '타이틀 키아트' : route === 'login' ? '접속 준비' : route === 'town' ? '루미나 마을' : '2.5D 필드';
  badge.textContent = navigator.onLine ? `${label} · Reference UI 1.36` : `${label} · 로컬/오프라인 진행`;
}

function pruneGhostLayers136(documentRef: Document, win: SoulWindow136) {
  let count = 0;
  for (const selector of GHOST_SELECTORS_136) {
    for (const node of Array.from(documentRef.querySelectorAll<HTMLElement>(selector))) {
      node.setAttribute('aria-hidden', 'true');
      node.dataset.soul136Hidden = 'ghost-pruned';
      if (node.style.display !== 'none') {
        node.style.display = 'none';
        count += 1;
      }
    }
  }
  if (win.__soulVisualAssetKit136) win.__soulVisualAssetKit136.prunedGhosts += count;
}

function stripDowngradeClasses136(documentRef: Document) {
  for (const className of DOWNGRADE_CLASSES_136) documentRef.body.classList.remove(className);
}

function purgeStaleStorage136() {
  for (const key of STALE_STORAGE_136) {
    try { localStorage.removeItem(key); } catch { /* private mode */ }
  }
}

function applySceneVisibility136(documentRef: Document, route: VisualAssetRoute136, targets: VisualAssetTargets136 = {}) {
  const title = targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const login = targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const town = targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const scenes: Array<[VisualAssetRoute136, HTMLElement | null | undefined]> = [['title', title], ['login', login], ['town', town]];
  for (const [name, node] of scenes) {
    if (!node) continue;
    const visible = name === route || (name === 'town' && route === 'field');
    node.classList.toggle('hidden', !visible);
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }
}

function visibleScenes136(documentRef: Document, targets: VisualAssetTargets136 = {}) {
  const scenes: Array<[VisualAssetRoute136, HTMLElement | null | undefined]> = [
    ['title', targets.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen')],
    ['login', targets.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen')],
    ['town', targets.townScreen || documentRef.querySelector<HTMLElement>('#townScreen')]
  ];
  return scenes.filter(([, node]) => node && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && Number(getComputedStyle(node).opacity || '1') > 0.01).map(([name]) => name);
}

function scheduleSweep136(documentRef: Document, targets: VisualAssetTargets136, delay: number) {
  const win = documentRef.defaultView as SoulWindow136 | null;
  if (!win) return;
  if (sweepTimer136) win.clearTimeout(sweepTimer136);
  sweepTimer136 = win.setTimeout(() => {
    sweepTimer136 = 0;
    syncVisualAssetRoute136(documentRef, inferRoute136(documentRef), targets);
  }, delay);
}

function inferRoute136(documentRef: Document): VisualAssetRoute136 {
  if (documentRef.body.classList.contains('field-active') || documentRef.body.dataset.route135 === 'field' || documentRef.body.dataset.route134 === 'field') return 'field';
  if (documentRef.body.classList.contains('town-active') || documentRef.body.dataset.route135 === 'town' || documentRef.body.dataset.route134 === 'town') return 'town';
  if (documentRef.body.classList.contains('prestart-login-120') || documentRef.body.dataset.route135 === 'login' || documentRef.body.dataset.route134 === 'login') return 'login';
  const title = documentRef.querySelector<HTMLElement>('#titleScreen');
  return title && !title.classList.contains('hidden') ? 'title' : 'login';
}

function normalizeRoute136(route: VisualAssetRoute136 | string): VisualAssetRoute136 {
  return route === 'field' || route === 'town' || route === 'login' || route === 'title' ? route : 'title';
}

export function lastVisualAssetReport136() {
  return lastReport136;
}
