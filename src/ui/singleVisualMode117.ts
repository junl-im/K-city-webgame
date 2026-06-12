import type { HealthLevel } from './technicalHealth';

export interface SingleVisualReport117 {
  level: HealthLevel;
  mode: 'standard';
  legacyLayerCount: number;
  duplicatedTitleClasses: number;
  disabledFlags: number;
  message: string;
  hint: string;
}

type SingleVisualOptions117 = {
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLElement | null;
};

const LEGACY_LAYER_SELECTORS_117 = [
  '.title-character-companion',
  '.title-hero-glow',
  '.title-hero-rune',
  '.title-soul-ring',
  '.town-lobby-pet-070',
  '.orientation-guard'
];

const MODE_STORAGE_KEYS_117 = [
  'soul-online-lite-render-091',
  'soul-online-field-lite-100',
  'soul-online-perf-lite-101',
  'soul-online-perf-quality-101',
  'soul-online-engine-lite-105',
  'soul-online-engine-quality-105',
  'soul-online-lite-atlas-106',
  'soul-online-force-hq-atlas-106',
  'soul-online-final-lite-107',
  'soul-online-final-quality-107',
  'soul-online-lite-mode-108',
  'soul-online-quality-mode-108',
  'soul-online-maintenance-lite-109',
  'soul-online-maintenance-quality-109',
  'soul-online-lite-mode-110',
  'soul-online-quality-mode-110',
  'soul-online-full-atlas-115'
];

let installed117 = false;
let disabledFlags117 = 0;

/**
 * Alpha 1.17: Lite/High/Quality 분기를 제거하고 하나의 표준 화면 모드로 고정합니다.
 * 뒤늦게 로드되는 구형 배경 레이어와 펫/동행자 더미도 숨겨 이미지가 겹쳤다가 사라지는 현상을 줄입니다.
 */
export function installSingleVisualMode117(root: Document = document, options: SingleVisualOptions117 = {}) {
  if (!installed117) {
    installed117 = true;
    disabledFlags117 = clearModeFlags117();
    root.body.classList.add('single-visual-117', 'standard-render-117', 'no-pet-117', 'no-legacy-flicker-117');
    root.body.dataset.visualMode117 = 'standard';
    normalizeStaticLayers117(root, options);
    window.setTimeout(() => syncSingleVisualMode117(root, options), 50);
    window.setTimeout(() => syncSingleVisualMode117(root, options), 600);
    new MutationObserver(() => syncSingleVisualMode117(root, options)).observe(root.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
  }
  return syncSingleVisualMode117(root, options);
}

export function syncSingleVisualMode117(root: Document = document, options: SingleVisualOptions117 = {}) {
  root.body.classList.add('single-visual-117', 'standard-render-117', 'no-pet-117', 'no-legacy-flicker-117');
  root.body.dataset.visualMode117 = 'standard';
  root.body.dataset.runtimeTier112 = 'standard';
  root.body.dataset.engineTier105 = 'standard';
  root.body.dataset.maintenanceTier113 = 'standard';
  root.body.classList.remove(
    'perf-lite-101', 'perf-quality-101', 'engine-lite-105', 'engine-quality-tier-105',
    'final-lite-107', 'final-quality-107', 'mobile-lite-108', 'mobile-quality-tier-108',
    'maintenance-lite-109', 'maintenance-quality-109', 'field-layout-lite-110', 'field-layout-quality-110',
    'runtime-lite-112', 'runtime-quality-112', 'landscape-guard-103', 'landscape-block-105',
    'maintenance-landscape-109', 'so108-portrait-warn', 'forced-landscape-safe'
  );
  root.body.classList.add('engine-balanced-105', 'final-balanced-107', 'maintenance-balanced-109', 'field-layout-balanced-110');
  normalizeStaticLayers117(root, options);
  return inspectSingleVisualMode117(root, options);
}

export function inspectSingleVisualMode117(root: Document = document, _options: SingleVisualOptions117 = {}): SingleVisualReport117 {
  const legacyLayerCount = LEGACY_LAYER_SELECTORS_117.reduce((total, selector) => {
    return total + Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(isVisible117).length;
  }, 0);
  const titleBg = root.querySelector<HTMLElement>('#titleScreen .title-bg');
  const duplicatedTitleClasses = titleBg ? Array.from(titleBg.classList).filter((name) => /^title-bg-\d+/.test(name)).length : 0;
  const level: HealthLevel = legacyLayerCount === 0 && duplicatedTitleClasses <= 1 ? 'ok' : 'warn';
  const message = level === 'ok' ? '단일 표준 화면 모드' : `중복 레이어 정리 ${legacyLayerCount + duplicatedTitleClasses}건`;
  const hint = `standard atlas · legacy ${legacyLayerCount} · title classes ${duplicatedTitleClasses} · flags cleared ${disabledFlags117}`;
  return { level, mode: 'standard', legacyLayerCount, duplicatedTitleClasses, disabledFlags: disabledFlags117, message, hint };
}

function normalizeStaticLayers117(root: Document, options: SingleVisualOptions117) {
  stripNumberedClasses117(options.titleScreen || root.querySelector<HTMLElement>('#titleScreen'), ['title-screen-']);
  stripNumberedClasses117(root.querySelector<HTMLElement>('#titleScreen .title-bg'), ['title-bg-']);
  stripNumberedClasses117(root.querySelector<HTMLElement>('#titleScreen .title-hero'), ['title-hero-']);
  stripNumberedClasses117(root.querySelector<HTMLElement>('#titleScreen .title-character'), ['title-character-']);
  stripNumberedClasses117(root.querySelector<HTMLElement>('#townScreen'), ['town-screen-']);
  root.querySelectorAll<HTMLElement>('.town-panorama-049, .town-panorama-050, .town-panorama-052, .town-panorama-053, .town-panorama-056, .town-panorama-057, .town-panorama-058, .town-panorama-059, .town-panorama-060, .town-panorama-061, .town-panorama-062, .town-panorama-063, .town-panorama-064, .town-panorama-065, .town-panorama-066, .town-panorama-067, .town-panorama-068, .town-panorama-069, .town-panorama-070')
    .forEach((node) => stripNumberedClasses117(node, ['town-panorama-']));

  root.querySelectorAll<HTMLElement>(LEGACY_LAYER_SELECTORS_117.join(',')).forEach((node) => {
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('tabindex', '-1');
    node.dataset.singleModeHidden117 = 'true';
  });

  const version = root.querySelector<HTMLElement>('.title-mini-nav span:last-child');
  if (version) version.textContent = 'v1.17.0';
  if (options.startButton) options.startButton.dataset.singleMode117 = 'start';
}

function stripNumberedClasses117(element: HTMLElement | null | undefined, prefixes: string[]) {
  if (!element) return;
  const keep = new Set(['title-screen', 'title-bg', 'title-bg-visual', 'title-hero', 'title-character', 'title-character-visual', 'town-screen']);
  const nextClassNames = Array.from(element.classList).filter((name) => {
    if (keep.has(name)) return true;
    return !prefixes.some((prefix) => new RegExp(`^${escapeRegExp117(prefix)}\\d+$`).test(name));
  });
  element.className = nextClassNames.join(' ');
  element.classList.add('single-layer-117');
}

function clearModeFlags117() {
  let count = 0;
  try {
    for (const key of MODE_STORAGE_KEYS_117) {
      if (window.localStorage.getItem(key) !== null) count += 1;
      window.localStorage.removeItem(key);
    }
    window.localStorage.setItem('soul-online-visual-mode-117', 'standard');
  } catch {
    // Storage 접근이 제한된 환경에서는 런타임 class override만 적용합니다.
  }
  return count;
}

function isVisible117(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.01 && rect.width > 2 && rect.height > 2;
}

function escapeRegExp117(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
