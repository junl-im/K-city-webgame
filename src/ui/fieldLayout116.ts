import type { HealthLevel } from './technicalHealth';

export type FieldLayoutRoute116 = 'title' | 'login' | 'town' | 'field';

export interface FieldLayoutReport116 {
  level: HealthLevel;
  route: FieldLayoutRoute116;
  viewport: string;
  overflowCount: number;
  collisionCount: number;
  petUiCount: number;
  message: string;
  hint: string;
}

type FieldLayoutOptions116 = {
  titleScreen?: HTMLElement;
  loginScreen?: HTMLElement;
  townScreen?: HTMLElement;
  gameRoot?: HTMLElement;
  startButton?: HTMLElement;
};

const SAFE_SELECTORS_116 = [
  '.hud-top',
  '.resource-strip',
  '.target-card',
  '.field-quest-tracker',
  '.field-chain-meter',
  '.joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock',
  '#returnTownBtn'
];

const PET_SELECTORS_116 = [
  '.town-lobby-pet-070',
  '.title-character-companion'
];

let installed116 = false;
let resizeTimer116 = 0;
let observer116: MutationObserver | null = null;
let lastSyncAt116 = 0;

/**
 * Alpha 1.16: 사용자가 지적한 실제 플레이 UI 배치 문제를 마지막 보정 레이어로 고정합니다.
 * - 시작 화면 TOUCH TO START 위치 안정화
 * - 필드 밝기 보정
 * - HUD / 퀘스트 / 몬스터 타깃 / 마을 버튼 / 조이스틱 / 우측 버튼 충돌 제거
 * - 아직 시스템화되지 않은 펫 UI 제거
 */
export function installFieldLayout116(root: Document = document, options: FieldLayoutOptions116 = {}) {
  if (installed116) return syncFieldLayout116(root, options);
  installed116 = true;
  root.body.classList.add('fantasy-ui-116', 'field-layout-116', 'title-layout-116', 'no-pet-116');
  annotate116(root);
  removePetPlaceholders116(root);
  syncFieldLayout116(root, options);

  const schedule = () => scheduleSync116(root, options, 60);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  root.addEventListener('visibilitychange', () => syncFieldLayout116(root, options));

  observer116 = new MutationObserver(() => scheduleSync116(root, options, 40));
  observer116.observe(root.body, { attributes: true, attributeFilter: ['class', 'data-runtime-tier112', 'data-runtime-route112'] });
  [options.titleScreen, options.loginScreen, options.townScreen, options.gameRoot, options.startButton]
    .filter((entry): entry is HTMLElement => Boolean(entry))
    .forEach((element) => observer116?.observe(element, { attributes: true, childList: false, subtree: false }));

  return inspectFieldLayout116(root, options);
}

export function syncFieldLayout116(root: Document = document, options: FieldLayoutOptions116 = {}) {
  const now = performance.now();
  if (now - lastSyncAt116 < 16) return inspectFieldLayout116(root, options);
  lastSyncAt116 = now;

  const viewport = currentViewport116(root);
  const route = detectRoute116(root, options);
  const compact = viewport.width <= 390 || viewport.height <= 700;
  const narrow = viewport.width <= 350;

  root.body.classList.add('fantasy-ui-116', 'field-layout-116', 'no-pet-116');
  root.body.classList.toggle('title-layout-116', route === 'title');
  root.body.classList.toggle('field-layout-active-116', route === 'field');
  root.body.classList.toggle('field-compact-116', compact);
  root.body.classList.toggle('field-narrow-116', narrow);
  root.body.dataset.fieldLayout116 = route;

  root.documentElement.style.setProperty('--so116-vw', `${Math.round(viewport.width)}px`);
  root.documentElement.style.setProperty('--so116-vh-px', `${Math.round(viewport.height)}px`);
  root.documentElement.style.setProperty('--so116-vh', `${Math.max(1, viewport.height / 100)}px`);
  root.documentElement.style.setProperty('--so116-control-scale', compact ? (narrow ? '0.90' : '0.94') : '1');

  annotate116(root);
  removePetPlaceholders116(root);
  normalizeTitle116(root);
  const report = inspectFieldLayout116(root, options);
  root.body.classList.toggle('field-layout-warning-116', report.level !== 'ok');
  return report;
}

export function inspectFieldLayout116(root: Document = document, options: FieldLayoutOptions116 = {}): FieldLayoutReport116 {
  const viewport = currentViewport116(root);
  const route = detectRoute116(root, options);
  const visible = Array.from(root.querySelectorAll<HTMLElement>(SAFE_SELECTORS_116.join(','))).filter(isVisible116);
  const petUiCount = Array.from(root.querySelectorAll<HTMLElement>(PET_SELECTORS_116.join(','))).filter(isVisible116).length;
  let overflowCount = 0;
  for (const element of visible) {
    const rect = element.getBoundingClientRect();
    if (rect.left < -2 || rect.top < -2 || rect.right > viewport.width + 2 || rect.bottom > viewport.height + 2) overflowCount += 1;
  }

  const collisionPairs: Array<[string, string]> = [
    ['.joystick', '.potion-dock'],
    ['.joystick', '.action-dock'],
    ['.joystick', '#returnTownBtn'],
    ['.action-dock', '.potion-dock'],
    ['.action-dock', '.skill-dock'],
    ['.hud-top', '.field-quest-tracker'],
    ['.hud-top', '.target-card'],
    ['.target-card', '.field-quest-tracker']
  ];
  const collisionCount = route === 'field'
    ? collisionPairs.reduce((count, [a, b]) => count + (overlap116(root.querySelector<HTMLElement>(a), root.querySelector<HTMLElement>(b)) ? 1 : 0), 0)
    : 0;

  const level: HealthLevel = overflowCount > 0 || collisionCount > 0 || petUiCount > 0 ? 'warn' : 'ok';
  const viewportText = `${Math.round(viewport.width)}x${Math.round(viewport.height)}`;
  const message = level === 'ok' ? '1.16 요청 UI 배치 정상' : `1.16 배치 확인 ${overflowCount + collisionCount + petUiCount}건`;
  const hint = `route ${route} · visible ${visible.length} · overflow ${overflowCount} · collision ${collisionCount} · pet ${petUiCount}`;
  return { level, route, viewport: viewportText, overflowCount, collisionCount, petUiCount, message, hint };
}

function scheduleSync116(root: Document, options: FieldLayoutOptions116, delay: number) {
  window.clearTimeout(resizeTimer116);
  resizeTimer116 = window.setTimeout(() => syncFieldLayout116(root, options), delay);
}

function currentViewport116(root: Document) {
  const vv = window.visualViewport;
  return {
    width: vv?.width || window.innerWidth || root.documentElement.clientWidth || 0,
    height: vv?.height || window.innerHeight || root.documentElement.clientHeight || 0
  };
}

function detectRoute116(root: Document, options: FieldLayoutOptions116): FieldLayoutRoute116 {
  if (root.body.classList.contains('field-active')) return 'field';
  if (root.body.classList.contains('town-active')) return 'town';
  if (options.titleScreen && !options.titleScreen.classList.contains('hidden')) return 'title';
  if (options.loginScreen && !options.loginScreen.classList.contains('hidden')) return 'login';
  return 'login';
}

function annotate116(root: Document) {
  root.querySelectorAll<HTMLElement>(SAFE_SELECTORS_116.join(',')).forEach((element) => {
    element.dataset.layout116 = 'safe';
  });
  root.querySelectorAll<HTMLElement>('.dock-btn, .skill-btn, .potion-btn, #returnTownBtn').forEach((element) => {
    element.dataset.touchTarget116 = 'true';
  });
}

function normalizeTitle116(root: Document) {
  const version = root.querySelector<HTMLElement>('.title-mini-nav span:last-child');
  if (version) version.textContent = 'v1.16.0';
  const start = root.querySelector<HTMLElement>('#startGameBtn');
  if (start) {
    start.setAttribute('aria-label', '게임 시작');
    start.dataset.layout116 = 'start-centered';
  }
}

function removePetPlaceholders116(root: Document) {
  root.querySelectorAll<HTMLElement>(PET_SELECTORS_116.join(',')).forEach((element) => {
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('tabindex', '-1');
    element.dataset.removedPet116 = 'true';
  });
}

function isVisible116(element: HTMLElement | null): element is HTMLElement {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 2 && rect.height > 2;
}

function overlap116(a: HTMLElement | null, b: HTMLElement | null) {
  if (!isVisible116(a) || !isVisible116(b)) return false;
  const ar = a.getBoundingClientRect();
  const br = b.getBoundingClientRect();
  const pad = 5;
  return ar.left < br.right - pad && ar.right > br.left + pad && ar.top < br.bottom - pad && ar.bottom > br.top + pad;
}
