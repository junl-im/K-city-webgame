import type { HealthLevel } from './technicalHealth';

export type StyleLoaderState114 = 'idle' | 'loading' | 'ready' | 'error';

export interface StyleLoaderReport114 {
  level: HealthLevel;
  state: StyleLoaderState114;
  loaded: number;
  total: number;
  failed: number;
  estimatedLegacyKB: number;
  message: string;
  hint: string;
}

type LazyStyleModule114 = {
  id: string;
  label: string;
  estimatedKB: number;
  load: () => Promise<unknown>;
};

const LAZY_STYLES_114: LazyStyleModule114[] = [
  { id: '098', label: 'visual clean', estimatedKB: 18, load: () => import('../styles/alpha098.css') },
  { id: '099', label: 'art perf', estimatedKB: 21, load: () => import('../styles/alpha099.css') },
  { id: '100', label: 'field HUD', estimatedKB: 23, load: () => import('../styles/alpha100.css') },
  { id: '101', label: 'performance polish', estimatedKB: 18, load: () => import('../styles/alpha101.css') },
  { id: '102', label: 'asset kit', estimatedKB: 22, load: () => import('../styles/alpha102.css') },
  { id: '103', label: 'portrait field UX', estimatedKB: 28, load: () => import('../styles/alpha103.css') },
  { id: '104', label: 'quality pass', estimatedKB: 30, load: () => import('../styles/alpha104.css') },
  { id: '105', label: 'engine quality', estimatedKB: 25, load: () => import('../styles/alpha105.css') },
  { id: '106', label: 'engine optimization', estimatedKB: 24, load: () => import('../styles/alpha106.css') },
  { id: '107', label: 'final optimization', estimatedKB: 24, load: () => import('../styles/alpha107.css') },
  { id: '108', label: 'mobile quality', estimatedKB: 26, load: () => import('../styles/alpha108.css') },
  { id: '109', label: 'maintenance', estimatedKB: 26, load: () => import('../styles/alpha109.css') },
  { id: '110', label: 'field layout', estimatedKB: 28, load: () => import('../styles/alpha110.css') },
  { id: '112', label: 'mobile runtime', estimatedKB: 24, load: () => import('../styles/alpha112.css') },
  { id: '113', label: 'runtime cleanup', estimatedKB: 24, load: () => import('../styles/alpha113.css') }
];

const loadedIds114 = new Set<string>();
const failedIds114 = new Set<string>();
let state114: StyleLoaderState114 = 'idle';
let loadPromise114: Promise<StyleLoaderReport114> | null = null;
let installed114 = false;

/**
 * Alpha 1.14: 0.98~1.13 보정 CSS를 초기 정적 번들에서 분리합니다.
 * 기본 화면은 styles.css + alpha114.css가 담당하고, 오래된 보정 레이어는 첫 프레임 이후 순서대로 붙입니다.
 */
export function installStyleLoader114(root: Document = document) {
  if (!installed114) {
    installed114 = true;
    root.body.classList.add('css-runtime-114', 'css-lazy-loading-114');
    root.body.dataset.styleLoader114 = state114;
    scheduleLazyStyleLoad114(root);
  }
  return inspectStyleLoader114(root);
}

/** 라우트 변경/팝업 오픈 시점에 CSS 로더 상태를 body에 반영합니다. */
export function syncStyleLoader114(root: Document = document) {
  const report = inspectStyleLoader114(root);
  root.body.dataset.styleLoader114 = report.state;
  root.body.dataset.styleLoaded114 = String(report.loaded);
  root.body.dataset.styleTotal114 = String(report.total);
  root.body.classList.toggle('css-lazy-loading-114', report.state === 'loading' || report.state === 'idle');
  root.body.classList.toggle('css-lazy-ready-114', report.state === 'ready');
  root.body.classList.toggle('css-lazy-error-114', report.state === 'error');
  root.documentElement.style.setProperty('--css-lazy-progress-114', report.total ? String(report.loaded / report.total) : '1');
  return report;
}

/** System Doctor에 표시할 1.14 CSS 분리 진단입니다. */
export function inspectStyleLoader114(root: Document = document): StyleLoaderReport114 {
  const total = LAZY_STYLES_114.length;
  const loaded = loadedIds114.size;
  const failed = failedIds114.size;
  const estimatedLegacyKB = LAZY_STYLES_114.reduce((sum, item) => sum + item.estimatedKB, 0);
  const level: HealthLevel = failed > 0 ? 'warn' : loaded >= total ? 'ok' : 'warn';
  const state = state114;
  const message = state === 'ready'
    ? `보정 CSS ${loaded}/${total} 분리 로드 완료`
    : state === 'error'
      ? `보정 CSS ${failed}개 로드 실패`
      : `보정 CSS ${loaded}/${total} 로딩 중`;
  const hint = `초기 번들에서 약 ${estimatedLegacyKB}KB 분리 · 상태 ${root.body.dataset.styleLoader114 || state}`;
  return { level, state, loaded, total, failed, estimatedLegacyKB, message, hint };
}

export function loadLegacyStyleStack114(root: Document = document) {
  if (!loadPromise114) loadPromise114 = loadAllStyles114(root);
  return loadPromise114;
}

function scheduleLazyStyleLoad114(root: Document) {
  const start = () => {
    void loadLegacyStyleStack114(root);
  };
  const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(start, { timeout: 350 });
  else window.setTimeout(start, 40);
}

async function loadAllStyles114(root: Document): Promise<StyleLoaderReport114> {
  if (state114 === 'ready') return inspectStyleLoader114(root);
  state114 = 'loading';
  syncStyleLoader114(root);

  for (const style of LAZY_STYLES_114) {
    if (loadedIds114.has(style.id)) continue;
    try {
      await style.load();
      loadedIds114.add(style.id);
    } catch {
      failedIds114.add(style.id);
    }
    syncStyleLoader114(root);
  }

  state114 = failedIds114.size > 0 ? 'error' : 'ready';
  root.body.classList.add('css-lazy-settled-114');
  return syncStyleLoader114(root);
}
