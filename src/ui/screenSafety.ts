import { auditUiBounds, type UiAuditReport } from './technicalHealth';

export const SOUL_UI_SAFE_SELECTORS_087 = [
  '.title-screen:not(.hidden)',
  '.login-screen:not(.hidden)',
  '.town-master-lobby-074',
  '.town-safe-frame-081',
  '.town-drawer:not(.hidden)',
  '#townContentPanel:not(.hidden)',
  '.sheet.open',
  '.hud-top',
  '.resource-strip',
  '.field-minimap',
  '.field-quest-tracker',
  '.combat-log',
  '.action-dock',
  '.joystick',
  '.item-detail-modal:not(.hidden) .item-detail-card',
  '.system-doctor-085',
  '.tech-health-panel-084',
  '.connectivity-matrix-086',
  '.render-budget-panel-087',
  '.inventory-filter-rail-088',
  '.shop-filter-rail-088',
  '.shop-confirm-088'
];

export interface SafeFrameState087 extends UiAuditReport {
  viewport: string;
  narrow: boolean;
  short: boolean;
}

export function auditSoulOnlineSafeFrame087(tolerance = 2): SafeFrameState087 {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  const report = auditUiBounds(SOUL_UI_SAFE_SELECTORS_087, tolerance);
  return {
    ...report,
    viewport: `${width}x${height}`,
    narrow: width > 0 && width <= 390,
    short: height > 0 && height <= 640
  };
}

export function applySafeFrameBodyState087(report: SafeFrameState087) {
  document.body.classList.toggle('ui-overflow-risk', !report.ok);
  document.body.classList.toggle('ui-narrow-087', report.narrow);
  document.body.classList.toggle('ui-short-087', report.short);
  document.body.classList.toggle('ui-narrow-088', report.narrow);
  document.body.classList.toggle('ui-short-088', report.short);
  document.body.dataset.safeFrame087 = report.ok ? 'ok' : 'overflow';
  document.body.dataset.safeFrame088 = report.ok ? 'ok' : 'overflow';
}
