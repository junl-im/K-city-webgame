import type { HealthLevel } from './technicalHealth';

export interface ResourceBudgetReport091 {
  level: HealthLevel;
  resourceCount: number;
  totalMB: number;
  imageMB: number;
  scriptMB: number;
  cssMB: number;
  heavyResourceCount: number;
  cachedOpaqueCount: number;
  message: string;
  hint: string;
}

const HEAVY_RESOURCE_BYTES_091 = 1.5 * 1024 * 1024;
const WARN_TOTAL_MB_091 = 24;
const DANGER_TOTAL_MB_091 = 38;
const WARN_IMAGE_MB_091 = 18;
const DANGER_IMAGE_MB_091 = 30;

export function inspectResourceBudget091(): ResourceBudgetReport091 {
  const entries = getResourceEntries091();
  let totalBytes = 0;
  let imageBytes = 0;
  let scriptBytes = 0;
  let cssBytes = 0;
  let heavyResourceCount = 0;
  let cachedOpaqueCount = 0;

  for (const entry of entries) {
    const size = normalizedTransferSize091(entry);
    totalBytes += size;
    if (size <= 0 && entry.duration > 0) cachedOpaqueCount += 1;
    if (size >= HEAVY_RESOURCE_BYTES_091) heavyResourceCount += 1;

    const kind = resourceKind091(entry);
    if (kind === 'image') imageBytes += size;
    else if (kind === 'script') scriptBytes += size;
    else if (kind === 'style') cssBytes += size;
  }

  const totalMB = toMB091(totalBytes);
  const imageMB = toMB091(imageBytes);
  const scriptMB = toMB091(scriptBytes);
  const cssMB = toMB091(cssBytes);
  const level = classifyResourceBudget091(totalMB, imageMB, heavyResourceCount);
  const message = level === 'ok'
    ? `리소스 ${totalMB}MB · 예산 안정`
    : level === 'warn'
      ? `리소스 ${totalMB}MB · 이미지 ${imageMB}MB 주의`
      : `리소스 ${totalMB}MB · 라이트 모드 권장`;

  return {
    level,
    resourceCount: entries.length,
    totalMB,
    imageMB,
    scriptMB,
    cssMB,
    heavyResourceCount,
    cachedOpaqueCount,
    message,
    hint: `JS ${scriptMB}MB · CSS ${cssMB}MB · 대형 ${heavyResourceCount}개 · 캐시/불명 ${cachedOpaqueCount}개`
  };
}

export function applyResourceBudgetState091(report: ResourceBudgetReport091, liteMode: boolean) {
  document.body.classList.toggle('asset-budget-watch-091', report.level === 'warn');
  document.body.classList.toggle('asset-budget-danger-091', report.level === 'danger');
  document.body.classList.toggle('lite-render-091', liteMode);
  document.body.classList.toggle('perf-reduced-motion-091', liteMode || report.level === 'danger');
  document.body.dataset.resourceBudget091 = report.level;
  document.body.dataset.resourceMB091 = String(report.totalMB);
}

export function installDomImageBudgetPolicy091(root: ParentNode = document) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  let changed = 0;
  for (const image of images) {
    if (isCriticalDomImage091(image)) continue;
    if (image.loading !== 'lazy') {
      image.loading = 'lazy';
      changed += 1;
    }
    image.decoding = 'async';
    const priorityImage = image as HTMLImageElement & { fetchPriority?: 'high' | 'low' | 'auto' };
    if (!priorityImage.fetchPriority || priorityImage.fetchPriority === 'high') priorityImage.fetchPriority = 'low';
  }
  return changed;
}

export function shouldUseLiteRender091(report: ResourceBudgetReport091, fps: number, longTaskCount: number) {
  if (report.level === 'danger') return true;
  if (report.level === 'warn' && (fps < 45 || longTaskCount >= 5)) return true;
  return false;
}

export function formatBudgetDelta091(report: ResourceBudgetReport091) {
  const imageShare = report.totalMB > 0 ? Math.round((report.imageMB / report.totalMB) * 100) : 0;
  return `총 ${report.totalMB}MB · 이미지 ${imageShare}% · ${report.resourceCount}개 요청`;
}

function getResourceEntries091() {
  try {
    return (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter((entry) => {
      const name = entry.name || '';
      return /\.(png|jpe?g|webp|gif|svg|js|css|json|woff2?)(\?|$)/i.test(name) || ['img', 'script', 'css', 'fetch'].includes(entry.initiatorType);
    });
  } catch {
    return [];
  }
}

function normalizedTransferSize091(entry: PerformanceResourceTiming) {
  const transfer = entry.transferSize || 0;
  const encoded = entry.encodedBodySize || 0;
  const decoded = entry.decodedBodySize || 0;
  return Math.max(transfer, encoded, Math.min(decoded, HEAVY_RESOURCE_BYTES_091));
}

function resourceKind091(entry: PerformanceResourceTiming): 'image' | 'script' | 'style' | 'other' {
  const name = entry.name || '';
  if (entry.initiatorType === 'img' || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(name)) return 'image';
  if (entry.initiatorType === 'script' || /\.js(\?|$)/i.test(name)) return 'script';
  if (entry.initiatorType === 'css' || /\.css(\?|$)/i.test(name)) return 'style';
  return 'other';
}

function classifyResourceBudget091(totalMB: number, imageMB: number, heavyResourceCount: number): HealthLevel {
  if (totalMB >= DANGER_TOTAL_MB_091 || imageMB >= DANGER_IMAGE_MB_091 || heavyResourceCount >= 10) return 'danger';
  if (totalMB >= WARN_TOTAL_MB_091 || imageMB >= WARN_IMAGE_MB_091 || heavyResourceCount >= 5) return 'warn';
  return 'ok';
}

function toMB091(bytes: number) {
  return Math.round((bytes / 1048576) * 10) / 10;
}

function isCriticalDomImage091(image: HTMLImageElement) {
  const src = image.currentSrc || image.src || '';
  const critical = image.closest('.title-screen, .login-screen, .town-master-lobby-074, .town-safe-frame-081');
  return Boolean(critical && !/sheet\.(png|webp)|-sheet/i.test(src));
}
