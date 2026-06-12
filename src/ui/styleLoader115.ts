import type { HealthLevel } from './technicalHealth';

export type StyleRoute115 = 'title' | 'login' | 'town' | 'field';
export type StyleLoaderState115 = 'idle' | 'critical-loading' | 'route-loading' | 'ready' | 'error';

export interface StyleLoaderReport115 {
  level: HealthLevel;
  state: StyleLoaderState115;
  route: StyleRoute115;
  loaded: number;
  total: number;
  failed: number;
  pending: number;
  estimatedDeferredKB: number;
  message: string;
  hint: string;
}

type LazyStyleModule115 = {
  id: string;
  label: string;
  estimatedKB: number;
  group: 'critical' | 'town' | 'field' | 'deep';
  load: () => Promise<unknown>;
};

const LAZY_STYLES_115: LazyStyleModule115[] = [
  { id: '098', label: 'visual clean', estimatedKB: 18, group: 'critical', load: () => import('../styles/alpha098.css') },
  { id: '100', label: 'field HUD base', estimatedKB: 23, group: 'critical', load: () => import('../styles/alpha100.css') },
  { id: '112', label: 'mobile runtime', estimatedKB: 24, group: 'critical', load: () => import('../styles/alpha112.css') },
  { id: '113', label: 'runtime cleanup', estimatedKB: 24, group: 'critical', load: () => import('../styles/alpha113.css') },
  { id: '099', label: 'art performance', estimatedKB: 21, group: 'town', load: () => import('../styles/alpha099.css') },
  { id: '101', label: 'performance polish', estimatedKB: 18, group: 'town', load: () => import('../styles/alpha101.css') },
  { id: '102', label: 'asset kit', estimatedKB: 22, group: 'town', load: () => import('../styles/alpha102.css') },
  { id: '103', label: 'portrait field UX', estimatedKB: 28, group: 'field', load: () => import('../styles/alpha103.css') },
  { id: '104', label: 'quality pass', estimatedKB: 30, group: 'field', load: () => import('../styles/alpha104.css') },
  { id: '105', label: 'engine quality', estimatedKB: 25, group: 'field', load: () => import('../styles/alpha105.css') },
  { id: '106', label: 'engine optimization', estimatedKB: 24, group: 'field', load: () => import('../styles/alpha106.css') },
  { id: '107', label: 'final optimization', estimatedKB: 24, group: 'field', load: () => import('../styles/alpha107.css') },
  { id: '108', label: 'mobile quality', estimatedKB: 26, group: 'field', load: () => import('../styles/alpha108.css') },
  { id: '109', label: 'maintenance', estimatedKB: 26, group: 'deep', load: () => import('../styles/alpha109.css') },
  { id: '110', label: 'field layout', estimatedKB: 28, group: 'deep', load: () => import('../styles/alpha110.css') }
];

const loadedIds115 = new Set<string>();
const failedIds115 = new Set<string>();
const queuedGroups115 = new Set<string>();
let state115: StyleLoaderState115 = 'idle';
let installed115 = false;
let lastRoute115: StyleRoute115 = 'title';
let chain115: Promise<void> = Promise.resolve();
let deepDrainTimer115 = 0;

/**
 * Alpha 1.15: 1.14의 CSS lazy loading을 route-aware 방식으로 개선합니다.
 * 첫 화면은 critical CSS만 빠르게 붙이고, town/field/deep 보정 CSS는 실제 경로 진입 또는 여유 시간에만 로드합니다.
 */
export function installStyleLoader115(root: Document = document) {
  if (!installed115) {
    installed115 = true;
    root.body.classList.add('css-runtime-115', 'css-route-aware-115', 'css-critical-loading-115');
    lastRoute115 = detectRoute115(root);
    root.body.dataset.styleRoute115 = lastRoute115;
    scheduleGroupLoad115(root, 'critical');
    scheduleDeferredDrain115(root);
  }
  return inspectStyleLoader115(root);
}

/** 라우트 변화와 CSS 로더 상태를 body dataset/class에 반영합니다. */
export function syncStyleLoader115(root: Document = document) {
  const route = detectRoute115(root);
  lastRoute115 = route;
  root.body.dataset.styleRoute115 = route;

  if (route === 'town') scheduleGroupLoad115(root, 'town');
  if (route === 'field') {
    scheduleGroupLoad115(root, 'town');
    scheduleGroupLoad115(root, 'field');
    if (!shouldHoldDeepStyles115()) scheduleGroupLoad115(root, 'deep');
  }

  const report = inspectStyleLoader115(root);
  root.body.dataset.styleLoader115 = report.state;
  root.body.dataset.styleLoaded115 = String(report.loaded);
  root.body.dataset.styleTotal115 = String(report.total);
  root.body.classList.toggle('css-critical-loading-115', report.state === 'idle' || report.state === 'critical-loading');
  root.body.classList.toggle('css-route-loading-115', report.state === 'route-loading');
  root.body.classList.toggle('css-route-ready-115', report.state === 'ready');
  root.body.classList.toggle('css-route-error-115', report.state === 'error');
  root.documentElement.style.setProperty('--css-lazy-progress-115', report.total ? String(report.loaded / report.total) : '1');
  return report;
}

/** System Doctor에 표시할 1.15 route-aware CSS 진단입니다. */
export function inspectStyleLoader115(root: Document = document): StyleLoaderReport115 {
  const route = detectRoute115(root);
  const total = LAZY_STYLES_115.length;
  const loaded = loadedIds115.size;
  const failed = failedIds115.size;
  const pending = Math.max(0, total - loaded - failed);
  const criticalTotal = LAZY_STYLES_115.filter((item) => item.group === 'critical').length;
  const criticalLoaded = LAZY_STYLES_115.filter((item) => item.group === 'critical' && loadedIds115.has(item.id)).length;
  const estimatedDeferredKB = LAZY_STYLES_115.reduce((sum, item) => sum + item.estimatedKB, 0);
  const state = state115;
  const level: HealthLevel = failed > 0 ? 'warn' : criticalLoaded >= criticalTotal ? 'ok' : 'warn';
  const message = failed > 0
    ? `CSS ${failed}개 로드 실패 · ${loaded}/${total}`
    : loaded >= total
      ? `경로별 CSS ${loaded}/${total} 완료`
      : `핵심 CSS ${criticalLoaded}/${criticalTotal} · 전체 ${loaded}/${total}`;
  const hint = `${route} 경로 · 약 ${estimatedDeferredKB}KB 지연 로드 · pending ${pending}`;
  return { level, state, route, loaded, total, failed, pending, estimatedDeferredKB, message, hint };
}

function detectRoute115(root: Document): StyleRoute115 {
  const body = root.body;
  if (body.classList.contains('field-active')) return 'field';
  if (body.classList.contains('town-active')) return 'town';
  const title = root.querySelector<HTMLElement>('#titleScreen');
  const login = root.querySelector<HTMLElement>('#loginScreen');
  if (title && !title.classList.contains('hidden')) return 'title';
  if (login && !login.classList.contains('hidden')) return 'login';
  return lastRoute115 || 'title';
}

function scheduleGroupLoad115(root: Document, group: LazyStyleModule115['group']) {
  if (queuedGroups115.has(group)) return;
  const targets = LAZY_STYLES_115.filter((item) => item.group === group && !loadedIds115.has(item.id) && !failedIds115.has(item.id));
  if (!targets.length) return;
  queuedGroups115.add(group);

  const start = () => {
    chain115 = chain115.then(() => loadGroup115(root, group, targets));
  };

  if (group === 'critical') {
    window.setTimeout(start, 20);
    return;
  }

  const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(start, { timeout: group === 'deep' ? 1800 : 600 });
  else window.setTimeout(start, group === 'deep' ? 900 : 120);
}

async function loadGroup115(root: Document, group: LazyStyleModule115['group'], targets: LazyStyleModule115[]) {
  state115 = group === 'critical' ? 'critical-loading' : 'route-loading';
  syncStyleLoader115(root);
  for (const style of targets) {
    if (loadedIds115.has(style.id) || failedIds115.has(style.id)) continue;
    try {
      await style.load();
      loadedIds115.add(style.id);
    } catch {
      failedIds115.add(style.id);
    }
    syncStyleLoader115(root);
    await yieldToMain115();
  }
  queuedGroups115.delete(group);
  state115 = failedIds115.size > 0 ? 'error' : loadedIds115.size >= LAZY_STYLES_115.length ? 'ready' : 'idle';
  if (loadedIds115.size >= LAZY_STYLES_115.length) root.body.classList.add('css-lazy-settled-115');
  syncStyleLoader115(root);
}

function scheduleDeferredDrain115(root: Document) {
  if (deepDrainTimer115) window.clearTimeout(deepDrainTimer115);
  deepDrainTimer115 = window.setTimeout(() => {
    if (shouldHoldDeepStyles115()) return;
    const route = detectRoute115(root);
    if (route === 'title' || route === 'login') return;
    scheduleGroupLoad115(root, 'town');
    scheduleGroupLoad115(root, 'field');
    scheduleGroupLoad115(root, 'deep');
  }, 2600);
}

function shouldHoldDeepStyles115() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData) return true;
  if (/slow-2g|2g/i.test(nav.connection?.effectiveType || '')) return true;
  return false;
}

function yieldToMain115() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}
