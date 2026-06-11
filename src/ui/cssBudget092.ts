import type { HealthLevel } from './technicalHealth';

export interface CssBudgetReport092 {
  level: HealthLevel;
  styleSheetCount: number;
  accessibleRuleCount: number;
  inaccessibleSheetCount: number;
  estimatedKB: number;
  runtimeCssKB: number;
  legacyAlphaClassCount: number;
  message: string;
  hint: string;
}

const WARN_RULES_092 = 6500;
const DANGER_RULES_092 = 9500;
const WARN_CSS_KB_092 = 780;
const DANGER_CSS_KB_092 = 1050;
const WARN_LEGACY_CLASSES_092 = 26;

export function inspectCssBudget092(root: Document = document): CssBudgetReport092 {
  const sheets = Array.from(root.styleSheets || []);
  let accessibleRuleCount = 0;
  let inaccessibleSheetCount = 0;
  let estimatedChars = 0;

  for (const sheet of sheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      accessibleRuleCount += rules.length;
      estimatedChars += rules.reduce((sum, rule) => sum + rule.cssText.length, 0);
    } catch {
      inaccessibleSheetCount += 1;
    }
  }

  const runtimeCssKB = inspectRuntimeCssKB092();
  const estimatedKB = Math.round((Math.max(estimatedChars, runtimeCssKB * 1024) / 1024) * 10) / 10;
  const bodyClassName = root.body?.className || '';
  const legacyAlphaClassCount = Array.from(bodyClassName.matchAll(/fantasy-ui-\d{3}/g)).length;
  const level = classifyCssBudget092(estimatedKB, runtimeCssKB, accessibleRuleCount, legacyAlphaClassCount);
  const message = level === 'ok'
    ? `CSS ${Math.max(estimatedKB, runtimeCssKB).toFixed(0)}KB · 안정`
    : level === 'warn'
      ? `CSS ${Math.max(estimatedKB, runtimeCssKB).toFixed(0)}KB · 분리 필요`
      : `CSS ${Math.max(estimatedKB, runtimeCssKB).toFixed(0)}KB · 충돌 위험`;

  return {
    level,
    styleSheetCount: sheets.length,
    accessibleRuleCount,
    inaccessibleSheetCount,
    estimatedKB,
    runtimeCssKB,
    legacyAlphaClassCount,
    message,
    hint: `규칙 ${accessibleRuleCount}개 · 시트 ${sheets.length}개 · legacy class ${legacyAlphaClassCount}개 · 접근불가 ${inaccessibleSheetCount}개`
  };
}

export function applyCssBudgetState092(report: CssBudgetReport092) {
  document.body.classList.toggle('css-budget-watch-092', report.level === 'warn');
  document.body.classList.toggle('css-budget-danger-092', report.level === 'danger');
  document.body.dataset.cssBudget092 = report.level;
  document.body.dataset.cssKB092 = String(Math.max(report.estimatedKB, report.runtimeCssKB));
}

export function summarizeCssBudget092(report: CssBudgetReport092) {
  return `CSS ${Math.max(report.estimatedKB, report.runtimeCssKB).toFixed(0)}KB · 규칙 ${report.accessibleRuleCount}개`;
}

function inspectRuntimeCssKB092() {
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cssBytes = entries
      .filter((entry) => entry.initiatorType === 'css' || /\.css(\?|$)/i.test(entry.name || ''))
      .reduce((sum, entry) => sum + Math.max(entry.transferSize || 0, entry.encodedBodySize || 0, Math.min(entry.decodedBodySize || 0, DANGER_CSS_KB_092 * 1024)), 0);
    return Math.round((cssBytes / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

function classifyCssBudget092(estimatedKB: number, runtimeCssKB: number, rules: number, legacyClasses: number): HealthLevel {
  const kb = Math.max(estimatedKB, runtimeCssKB);
  if (kb >= DANGER_CSS_KB_092 || rules >= DANGER_RULES_092) return 'danger';
  if (kb >= WARN_CSS_KB_092 || rules >= WARN_RULES_092 || legacyClasses >= WARN_LEGACY_CLASSES_092) return 'warn';
  return 'ok';
}
