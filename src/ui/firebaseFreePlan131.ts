export type FirebasePlanLevel131 = 'ok' | 'warn' | 'danger';

export type FirebaseFreePlanStatus131 = {
  paused?: boolean;
  lastError?: string;
  queued?: boolean;
  nextWriteMs?: number;
  writes?: number;
  writeSuccesses?: number;
  reads?: number;
  readCacheHits?: number;
  readPaused?: boolean;
  readFailures?: number;
  writeFailures?: number;
  mode?: string;
};

export type FirebaseFreePlanReport131 = {
  message: string;
  level: FirebasePlanLevel131;
  hint: string;
  queued: boolean;
};

type SoulWindow131 = Window & {
  __soulFirebaseFreePlan131?: {
    installedAt: number;
    cacheDeleted: number;
    lastOnline: boolean;
    lastStatus?: FirebaseFreePlanStatus131;
    lastReport?: FirebaseFreePlanReport131;
  };
};

const CURRENT_CACHE_131 = 'soul-online-alpha-v1-35';
let installed131 = false;
let lastReport131: FirebaseFreePlanReport131 = {
  message: 'Firebase 무료 플랜 가드 대기',
  level: 'warn',
  hint: '설치 전',
  queued: false
};

export function installFirebaseFreePlanGuard131(documentRef: Document) {
  if (installed131) return;
  installed131 = true;
  const win = documentRef.defaultView as SoulWindow131 | null;
  if (!win) return;

  win.__soulFirebaseFreePlan131 = {
    installedAt: performance.now(),
    cacheDeleted: 0,
    lastOnline: navigator.onLine
  };

  documentRef.body.classList.add('firebase-free-plan-131', 'visual-quality-preserved-131');
  documentRef.body.dataset.alphaVersion = '1.35.0';
  applyNetworkState131(documentRef);

  win.addEventListener('online', () => applyNetworkState131(documentRef), { passive: true });
  win.addEventListener('offline', () => applyNetworkState131(documentRef), { passive: true });
  win.addEventListener('pageshow', () => applyNetworkState131(documentRef), { passive: true });
  win.addEventListener('storage', () => applyNetworkState131(documentRef), { passive: true });

  pruneOldRuntimeCaches131(win).catch(() => undefined);
}

export function rememberFirebaseFreePlanStatus131(documentRef: Document, status?: FirebaseFreePlanStatus131) {
  const win = documentRef.defaultView as SoulWindow131 | null;
  if (!win?.__soulFirebaseFreePlan131) return;
  win.__soulFirebaseFreePlan131.lastStatus = status;
  documentRef.body.classList.toggle('cloud-save-queued-131', Boolean(status?.queued));
  documentRef.body.classList.toggle('cloud-save-paused-131', Boolean(status?.paused));
  if (status?.lastError) documentRef.body.dataset.cloudLastError131 = status.lastError.slice(0, 80);
  else delete documentRef.body.dataset.cloudLastError131;
}

export function inspectFirebaseFreePlan131(documentRef: Document, status?: FirebaseFreePlanStatus131): FirebaseFreePlanReport131 {
  const win = documentRef.defaultView as SoulWindow131 | null;
  const stored = win?.__soulFirebaseFreePlan131;
  const effective = status || stored?.lastStatus || {};
  rememberFirebaseFreePlanStatus131(documentRef, effective);

  const problems: string[] = [];
  const online = navigator.onLine;
  const swControlled = Boolean(navigator.serviceWorker?.controller);
  const queued = Boolean(effective.queued);
  const paused = Boolean(effective.paused);
  const error = effective.lastError || '';

  if (!online) problems.push('오프라인 로컬 모드');
  if (paused) problems.push('클라우드 쓰기 일시 보류');
  if (effective.readPaused) problems.push('클라우드 읽기 일시 보류');
  if (error) problems.push(`최근 오류 ${error}`);
  if (!swControlled) problems.push('서비스워커 제어 대기');

  const writeInfo = typeof effective.writes === 'number'
    ? `write ${effective.writeSuccesses || 0}/${effective.writes}`
    : 'write 대기';
  const readInfo = typeof effective.reads === 'number'
    ? `read ${effective.reads} · cache ${effective.readCacheHits || 0}${effective.readFailures ? ` · fail ${effective.readFailures}` : ''}`
    : 'read 대기';
  const queueInfo = queued
    ? `queue ${Math.max(0, Math.ceil((effective.nextWriteMs || 0) / 1000))}s`
    : 'queue 없음';
  const cacheInfo = stored ? `old cache ${stored.cacheDeleted}` : 'cache 점검 대기';

  const level: FirebasePlanLevel131 = error ? 'warn' : 'ok';
  const report: FirebaseFreePlanReport131 = {
    message: queued ? '로컬 우선 · 클라우드 예약' : online ? '무료 플랜 보호 정상' : '오프라인 로컬 플레이',
    level,
    hint: `${writeInfo} · ${readInfo} · ${queueInfo} · ${cacheInfo}${swControlled ? '' : ' · SW ready 대기'}`,
    queued
  };
  lastReport131 = report;
  if (stored) stored.lastReport = report;
  return report;
}

export function lastFirebaseFreePlanReport131() {
  return lastReport131;
}

function applyNetworkState131(documentRef: Document) {
  const win = documentRef.defaultView as SoulWindow131 | null;
  const online = navigator.onLine;
  documentRef.body.classList.toggle('network-offline-131', !online);
  documentRef.body.classList.toggle('network-online-131', online);
  if (win?.__soulFirebaseFreePlan131) win.__soulFirebaseFreePlan131.lastOnline = online;
}

async function pruneOldRuntimeCaches131(win: SoulWindow131) {
  if (!('caches' in win)) return;
  const keys = await win.caches.keys();
  let deleted = 0;
  await Promise.all(keys.map(async (key) => {
    if (!key.startsWith('soul-online-alpha-') || key === CURRENT_CACHE_131) return;
    const ok = await win.caches.delete(key);
    if (ok) deleted += 1;
  }));
  if (win.__soulFirebaseFreePlan131) win.__soulFirebaseFreePlan131.cacheDeleted = deleted;
}
