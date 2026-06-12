import type { HealthLevel } from './technicalHealth';

export type MaintenanceRoute113 = 'title' | 'login' | 'town' | 'field';
export type MaintenanceTier113 = 'lite' | 'balanced' | 'quality';

export interface MaintenanceReport113 {
  level: HealthLevel;
  route: MaintenanceRoute113;
  tier: MaintenanceTier113;
  viewport: string;
  cssEstimatedKB: number;
  fixedCount: number;
  overflowCount: number;
  activePanelCount: number;
  imagePolicyScore: number;
  message: string;
  hint: string;
}

type MaintenanceOptions113 = {
  root?: HTMLElement;
  titleScreen?: HTMLElement;
  loginScreen?: HTMLElement;
  townScreen?: HTMLElement;
  gameRoot?: HTMLElement;
  sheet?: HTMLElement;
  townPanel?: HTMLElement;
  itemDetailModal?: HTMLElement;
};

type NavigatorHints113 = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

const FIXED_SELECTORS_113 = [
  '.hud-top',
  '.resource-strip',
  '.target-card',
  '.field-quest-tracker',
  '.field-minimap',
  '.combat-log',
  '.combat-log-toggle',
  '.joystick',
  '.action-dock',
  '.skill-dock',
  '.sheet',
  '.town-content-panel',
  '.item-detail-modal',
  '.create-modal',
  '.scene-transition',
  '.toast'
];

const PANEL_SELECTORS_113 = ['.sheet', '.town-content-panel', '.item-detail-modal', '.create-modal'];

let installed113 = false;
let resizeTimer113 = 0;
let observer113: MutationObserver | null = null;
let lastSyncAt113 = 0;

/**
 * 1.13 유지보수 런타임 레이어입니다.
 * 누적된 구형 DOM/CSS 위에 최종 안전 상태만 얹어 화면 이탈, 팝업 겹침, 이미지 로딩 정책을 점검합니다.
 */
export function installMaintenance113(root: Document = document, options: MaintenanceOptions113 = {}) {
  if (installed113) return syncMaintenance113(root, options);
  installed113 = true;
  root.body.classList.add('maintenance-113', 'runtime-cleanup-113');
  annotateInteractiveElements113(root);
  syncMaintenance113(root, options);

  const schedule = () => scheduleMaintenanceSync113(root, options, 90);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  root.addEventListener('visibilitychange', () => syncMaintenance113(root, options));
  root.addEventListener('pointerdown', (event) => markRecentInput113(event), { passive: true });

  observer113 = new MutationObserver(() => scheduleMaintenanceSync113(root, options, 40));
  observer113.observe(root.body, { attributes: true, attributeFilter: ['class', 'data-runtime-tier112', 'data-runtime-route112'] });
  [options.titleScreen, options.loginScreen, options.townScreen, options.sheet, options.townPanel, options.itemDetailModal]
    .filter((entry): entry is HTMLElement => Boolean(entry))
    .forEach((element) => observer113?.observe(element, { attributes: true, attributeFilter: ['class', 'aria-hidden'] }));

  return inspectMaintenance113(root, options);
}

/** 현재 화면 크기/라우트/런타임 등급을 body dataset과 CSS 변수로 동기화합니다. */
export function syncMaintenance113(root: Document = document, options: MaintenanceOptions113 = {}) {
  const now = performance.now();
  if (now - lastSyncAt113 < 24) return inspectMaintenance113(root, options);
  lastSyncAt113 = now;

  annotateInteractiveElements113(root);
  const report = inspectMaintenance113(root, options);
  const body = root.body;
  body.classList.toggle('maintenance-lite-113', report.tier === 'lite');
  body.classList.toggle('maintenance-balanced-113', report.tier === 'balanced');
  body.classList.toggle('maintenance-quality-113', report.tier === 'quality');
  body.classList.toggle('maintenance-compact-113', isCompactViewport113());
  body.classList.toggle('maintenance-overflow-risk-113', report.overflowCount > 0);
  body.classList.toggle('maintenance-panel-stack-113', report.activePanelCount > 1);
  body.dataset.maintenance113 = report.level;
  body.dataset.maintenanceRoute113 = report.route;
  body.dataset.maintenanceTier113 = report.tier;

  const viewport = currentViewport113(root);
  const shortSide = Math.min(viewport.width, viewport.height);
  const uiScale = report.tier === 'lite'
    ? clamp113(shortSide / 390, 0.86, 0.96)
    : clamp113(shortSide / 430, 0.94, 1.04);
  root.documentElement.style.setProperty('--ui-scale-113', uiScale.toFixed(3));
  root.documentElement.style.setProperty('--ui-safe-inline-113', `${Math.max(10, Math.round(viewport.width * 0.032))}px`);
  root.documentElement.style.setProperty('--ui-safe-block-113', `${Math.max(10, Math.round(viewport.height * 0.018))}px`);
  root.documentElement.style.setProperty('--ui-vvh-113', `${viewport.height}px`);
  root.documentElement.style.setProperty('--ui-vvw-113', `${viewport.width}px`);

  applyPanelStackPolicy113(root);
  applyImagePolicy113(root, report.tier, report.route);
  return report;
}

/** System Doctor용 1.13 진단입니다. */
export function inspectMaintenance113(root: Document = document, options: MaintenanceOptions113 = {}): MaintenanceReport113 {
  const viewportSize = currentViewport113(root);
  const route = detectRoute113(root, options);
  const tier = detectTier113(root);
  const visibleFixed = Array.from(root.querySelectorAll<HTMLElement>(FIXED_SELECTORS_113.join(','))).filter(isVisible113);
  const overflowCount = visibleFixed.reduce((count, element) => count + (isOverflowing113(element, viewportSize.width, viewportSize.height) ? 1 : 0), 0);
  const activePanelCount = Array.from(root.querySelectorAll<HTMLElement>(PANEL_SELECTORS_113.join(','))).filter(isVisible113).length;
  const cssEstimatedKB = estimateCssKB113(root);
  const images = Array.from(root.images || []);
  const policyImages = images.filter((image) => image.decoding === 'async' && (image.loading === 'lazy' || image.getAttribute('fetchpriority'))).length;
  const imagePolicyScore = images.length ? Math.round((policyImages / images.length) * 100) : 100;
  const level: HealthLevel = overflowCount > 0 || activePanelCount > 2 || cssEstimatedKB > 1320 ? 'warn' : 'ok';
  const viewport = `${Math.round(viewportSize.width)}x${Math.round(viewportSize.height)}`;
  const message = level === 'ok' ? '1.13 정리 레이어 정상' : `정리 필요 ${overflowCount}건`;
  const hint = `route ${route} · ${tier} · fixed ${visibleFixed.length} · panels ${activePanelCount} · css ${cssEstimatedKB}KB · img ${imagePolicyScore}%`;
  return { level, route, tier, viewport, cssEstimatedKB, fixedCount: visibleFixed.length, overflowCount, activePanelCount, imagePolicyScore, message, hint };
}

function scheduleMaintenanceSync113(root: Document, options: MaintenanceOptions113, delay: number) {
  window.clearTimeout(resizeTimer113);
  resizeTimer113 = window.setTimeout(() => syncMaintenance113(root, options), delay);
}

function annotateInteractiveElements113(root: Document) {
  root.querySelectorAll<HTMLElement>('button, [role="button"], .dock-btn, .skill-btn, .menu-card').forEach((element) => {
    element.dataset.interactive113 = 'true';
  });
  root.querySelectorAll<HTMLElement>(PANEL_SELECTORS_113.join(',')).forEach((element) => {
    element.dataset.panelGuard113 = 'true';
  });
}

function markRecentInput113(event: PointerEvent) {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-interactive113="true"]');
  if (!target) return;
  target.classList.add('input-pop-113');
  window.setTimeout(() => target.classList.remove('input-pop-113'), 180);
}

function applyPanelStackPolicy113(root: Document) {
  const panels = Array.from(root.querySelectorAll<HTMLElement>(PANEL_SELECTORS_113.join(','))).filter(isVisible113);
  panels.forEach((panel, index) => {
    panel.dataset.panelDepth113 = String(index + 1);
    panel.style.setProperty('--panel-depth-113', String(index));
  });
}

function applyImagePolicy113(root: Document, tier: MaintenanceTier113, route: MaintenanceRoute113) {
  const images = Array.from(root.images || []);
  images.forEach((image, index) => {
    image.decoding = 'async';
    const visiblePriority = route === 'title' ? 2 : 4;
    if (tier === 'lite' || index > visiblePriority) image.loading = 'lazy';
    if (tier !== 'lite' && index <= visiblePriority) image.setAttribute('fetchpriority', 'high');
    else image.setAttribute('fetchpriority', 'low');
  });
}

function detectRoute113(root: Document, options: MaintenanceOptions113): MaintenanceRoute113 {
  if (root.body.classList.contains('field-active')) return 'field';
  if (root.body.classList.contains('town-active')) return 'town';
  if (options.titleScreen && !options.titleScreen.classList.contains('hidden')) return 'title';
  if (options.loginScreen && !options.loginScreen.classList.contains('hidden')) return 'login';
  return 'login';
}

function detectTier113(root: Document): MaintenanceTier113 {
  const runtimeTier = root.body.dataset.runtimeTier112;
  if (runtimeTier === 'lite' || runtimeTier === 'balanced' || runtimeTier === 'quality') return runtimeTier;
  const nav = navigator as NavigatorHints113;
  const viewport = currentViewport113(root);
  const memory = nav.deviceMemory || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  if (saveData || memory <= 2 || viewport.width <= 360 || viewport.height <= 620 || /2g|slow-2g/i.test(network)) return 'lite';
  if (memory >= 6 && viewport.width >= 430 && (window.devicePixelRatio || 1) >= 2) return 'quality';
  return 'balanced';
}

function currentViewport113(root: Document) {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width || window.innerWidth || root.documentElement.clientWidth || 0),
    height: Math.round(vv?.height || window.innerHeight || root.documentElement.clientHeight || 0)
  };
}

function isCompactViewport113() {
  const width = window.visualViewport?.width || window.innerWidth || 0;
  const height = window.visualViewport?.height || window.innerHeight || 0;
  return width <= 380 || height <= 690;
}

function isVisible113(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return !element.classList.contains('hidden') && element.getAttribute('aria-hidden') !== 'true' && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2 && Number(style.opacity || '1') > 0.02;
}

function isOverflowing113(element: HTMLElement, width: number, height: number) {
  const rect = element.getBoundingClientRect();
  const margin = 3;
  return rect.left < -margin || rect.top < -margin || rect.right > width + margin || rect.bottom > height + margin;
}

function estimateCssKB113(root: Document) {
  let chars = 0;
  for (const sheet of Array.from(root.styleSheets || [])) {
    try {
      chars += Array.from(sheet.cssRules || []).reduce((sum, rule) => sum + rule.cssText.length, 0);
    } catch {
      // Vite dev 서버나 외부 CSS처럼 읽을 수 없는 시트는 performance entry에서 보정합니다.
    }
  }
  const transferBytes = (() => {
    try {
      return (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter((entry) => entry.initiatorType === 'css' || /\.css(?:\?|$)/i.test(entry.name))
        .reduce((sum, entry) => sum + Math.max(entry.transferSize || 0, entry.encodedBodySize || 0), 0);
    } catch {
      return 0;
    }
  })();
  return Math.round((Math.max(chars, transferBytes) / 1024) * 10) / 10;
}

function clamp113(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
