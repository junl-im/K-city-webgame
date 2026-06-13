import { textureUrls } from '../data/assetManifest';
import type { HealthLevel } from './technicalHealth';

type AssetDeliveryMode115 = 'standard-2p5d' | 'standard-single' | 'external-lite' | 'mixed' | 'bundled-heavy';

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
 * Alpha 1.23: 1.15의 lite atlas 우선 배포 정책을 되돌리고,
 * 캐릭터/몬스터는 기존 2.5D 고해상도 시트를 단일 표준 경로로 사용합니다.
 * 이 진단은 더 이상 heavy bundled를 오류로 보지 않고, 의도된 2.5D 표준 모드로 표시합니다.
 */
export function installAssetDelivery115(root: Document = document) {
  root.body.classList.add('asset-delivery-115', 'asset-2p5d-standard-123');
  return syncAssetDelivery115(root);
}

export function syncAssetDelivery115(root: Document = document) {
  const report = inspectAssetDelivery115(root);
  root.body.dataset.assetDelivery115 = report.mode;
  root.body.classList.toggle('asset-external-lite-115', report.mode === 'external-lite');
  root.body.classList.toggle('asset-standard-single-117', report.mode === 'standard-single');
  root.body.classList.toggle('asset-2p5d-standard-123', report.mode === 'standard-2p5d');
  root.body.classList.toggle('asset-mixed-atlas-115', report.mode === 'mixed');
  root.body.classList.toggle('asset-heavy-bundled-115', report.mode === 'bundled-heavy' || report.mode === 'standard-2p5d');
  return report;
}

export function inspectAssetDelivery115(_root: Document = document): AssetDeliveryReport115 {
  const sheetEntries = Object.entries(textureUrls).filter(([key]) => SHEET_KEY_PATTERN_115.test(key));
  const liteSheetCount = sheetEntries.filter(([, value]) => String(value).includes('/soulpack-lite/')).length;
  const bundledSheetCount = sheetEntries.filter(([, value]) => !String(value).includes('/soulpack-lite/') && !String(value).includes('/soulpack/')).length;
  const heavyFallbackCount = bundledSheetCount;
  const totalSheetCount = sheetEntries.length;
  const allBundled = totalSheetCount > 0 && bundledSheetCount === totalSheetCount;
  const allLite = totalSheetCount > 0 && liteSheetCount === totalSheetCount;
  const mode: AssetDeliveryMode115 = allBundled
    ? 'standard-2p5d'
    : allLite
      ? 'standard-single'
      : heavyFallbackCount >= totalSheetCount / 2
        ? 'bundled-heavy'
        : 'mixed';
  const level: HealthLevel = mode === 'standard-2p5d' || mode === 'standard-single' ? 'ok' : mode === 'mixed' ? 'warn' : 'warn';
  const message = mode === 'standard-2p5d'
    ? `2.5D 고해상도 atlas ${bundledSheetCount}/${totalSheetCount}`
    : mode === 'standard-single'
      ? `단일 표준 atlas ${liteSheetCount}/${totalSheetCount}`
      : mode === 'mixed'
        ? `Atlas 혼합 배포 · bundled ${heavyFallbackCount}개`
        : `대형 atlas 번들 포함 ${heavyFallbackCount}개`;
  const hint = mode === 'standard-2p5d'
    ? '비주얼 품질 우선: 첫 화면이 아닌 필드 진입 시 필요한 2.5D 시트만 로드'
    : mode === 'standard-single'
      ? '저화질/고화질 전환 없이 한 가지 atlas 경로만 사용'
      : 'sheet 경로가 섞여 있으면 장면 전환 중 다른 이미지가 보일 수 있음';
  return { level, mode, liteSheetCount, heavyFallbackCount, totalSheetCount, message, hint };
}
