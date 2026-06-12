import { textureUrls } from '../data/assetManifest';
import type { HealthLevel } from './technicalHealth';

type AssetDeliveryMode115 = 'standard-single' | 'external-lite' | 'mixed' | 'bundled-heavy';

export interface AssetDeliveryReport115 {
  level: HealthLevel;
  mode: AssetDeliveryMode115;
  liteSheetCount: number;
  heavyFallbackCount: number;
  totalSheetCount: number;
  message: string;
  hint: string;
}

const SHEET_KEY_PATTERN_115 = /Sheet$/;

/**
 * Alpha 1.15: Firebase 무료 플랜 배포 크기를 줄이기 위한 atlas delivery 진단입니다.
 * src/assets의 원본 고해상도 시트는 보존하되, 빌드 산출물은 public/assets/soulpack-lite를 기본 fallback으로 사용합니다.
 */
export function installAssetDelivery115(root: Document = document) {
  root.body.classList.add('asset-delivery-115');
  return syncAssetDelivery115(root);
}

export function syncAssetDelivery115(root: Document = document) {
  const report = inspectAssetDelivery115(root);
  root.body.dataset.assetDelivery115 = report.mode;
  root.body.classList.toggle('asset-external-lite-115', report.mode === 'external-lite' || report.mode === 'standard-single');
  root.body.classList.toggle('asset-standard-single-117', report.mode === 'standard-single');
  root.body.classList.toggle('asset-mixed-atlas-115', report.mode === 'mixed');
  root.body.classList.toggle('asset-heavy-bundled-115', report.mode === 'bundled-heavy');
  return report;
}

export function inspectAssetDelivery115(_root: Document = document): AssetDeliveryReport115 {
  const sheetEntries = Object.entries(textureUrls).filter(([key]) => SHEET_KEY_PATTERN_115.test(key));
  const liteSheetCount = sheetEntries.filter(([, value]) => String(value).includes('/soulpack-lite/')).length;
  const heavyFallbackCount = sheetEntries.filter(([, value]) => {
    const url = String(value);
    return !url.includes('/soulpack-lite/') && !url.includes('/soulpack/');
  }).length;
  const totalSheetCount = sheetEntries.length;
  const mode: AssetDeliveryMode115 = heavyFallbackCount === 0 ? 'standard-single' : heavyFallbackCount >= totalSheetCount / 2 ? 'bundled-heavy' : 'mixed';
  const level: HealthLevel = mode === 'standard-single' ? 'ok' : mode === 'mixed' ? 'warn' : 'danger';
  const message = mode === 'standard-single'
    ? `단일 표준 atlas ${liteSheetCount}/${totalSheetCount}`
    : mode === 'mixed'
      ? `Atlas 혼합 배포 · heavy ${heavyFallbackCount}개`
      : `대형 atlas 번들 포함 ${heavyFallbackCount}개`;
  const hint = mode === 'standard-single'
    ? '저화질/고화질 전환 없이 한 가지 atlas 경로만 사용'
    : 'new URL로 묶인 대형 시트를 public 런타임 경로로 분리 권장';
  return { level, mode, liteSheetCount, heavyFallbackCount, totalSheetCount, message, hint };
}
