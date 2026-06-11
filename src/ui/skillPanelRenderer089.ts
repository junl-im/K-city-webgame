import type { HealthLevel } from './technicalHealth';
import type { SkillDefinition } from '../types';

export interface SkillProgressRow089 {
  label: string;
  value: string;
  level: HealthLevel;
  hint?: string;
}

export interface SkillUpgradeDraft089 {
  skillId: string;
  name: string;
  hotkey: string;
  level: number;
  nextLevel: number;
  costText: string;
  canUpgrade: boolean;
  reason: string;
  nextBenefit: string;
  artUrl: string;
  className: string;
}

export interface SkillReadinessSummary089 {
  learned: number;
  total: number;
  ready: number;
  upgradeable: number;
  masteryTotal: number;
  bookMissing: number;
  lockedByLevel: number;
  level: HealthLevel;
  label: string;
}

export function summarizeSkillReadiness089(params: {
  skills: SkillDefinition[];
  learnedSkillIds: string[];
  levelBySkillId: (skillId: string) => number;
  playerLevel: number;
  canUpgradeSkill: (skill: SkillDefinition) => boolean;
}): SkillReadinessSummary089 {
  const learnedSet = new Set(params.learnedSkillIds || []);
  const learnedSkills = params.skills.filter((skill) => learnedSet.has(skill.id));
  const readySkills = learnedSkills.filter((skill) => params.playerLevel >= skill.unlockLevel);
  const upgradeable = params.skills.filter((skill) => params.canUpgradeSkill(skill)).length;
  const masteryTotal = learnedSkills.reduce((sum, skill) => sum + params.levelBySkillId(skill.id), 0);
  const bookMissing = params.skills.filter((skill) => !learnedSet.has(skill.id)).length;
  const lockedByLevel = learnedSkills.filter((skill) => params.playerLevel < skill.unlockLevel).length;
  const level: HealthLevel = upgradeable > 0 ? 'ok' : bookMissing > 0 || lockedByLevel > 0 ? 'warn' : 'ok';
  return {
    learned: learnedSkills.length,
    total: params.skills.length,
    ready: readySkills.length,
    upgradeable,
    masteryTotal,
    bookMissing,
    lockedByLevel,
    level,
    label: upgradeable > 0 ? `강화 가능 ${upgradeable}` : bookMissing > 0 ? `스킬북 필요 ${bookMissing}` : '스킬 성장 정상'
  };
}

export function renderSkillReadinessStrip089(rows: SkillProgressRow089[]) {
  return `
    <section class="skill-readiness-strip-089" aria-label="스킬 연결성 점검">
      ${rows.map((row) => `<article class="${row.level}" title="${escapeAttr089(row.hint || row.value)}"><b>${escapeHtml089(row.label)}</b><em>${escapeHtml089(row.value)}</em>${row.hint ? `<small>${escapeHtml089(row.hint)}</small>` : ''}</article>`).join('')}
    </section>
  `;
}

export function renderSkillUpgradeConfirm089(draft: SkillUpgradeDraft089 | null) {
  if (!draft) return '';
  return `
    <section class="skill-upgrade-confirm-089 ${draft.canUpgrade ? 'ready' : 'blocked'}" aria-label="스킬 강화 확인">
      <div class="skill-confirm-visual-089">
        <span class="slot-art skill-art skill-art-${escapeAttr089(draft.hotkey)}"><img src="${escapeAttr089(draft.artUrl)}" alt="${escapeAttr089(draft.name)}" onerror="this.remove()" /><i>${escapeHtml089(draft.hotkey)}</i></span>
      </div>
      <div class="skill-confirm-copy-089">
        <span class="panel-kicker">SKILL TRAINING CHECK · 0.89</span>
        <h3>${escapeHtml089(draft.name)} Lv.${draft.level} → Lv.${draft.nextLevel}</h3>
        <p>${escapeHtml089(draft.nextBenefit)}</p>
        <em>${escapeHtml089(draft.costText)} · ${escapeHtml089(draft.reason)}</em>
      </div>
      <div class="skill-confirm-actions-089">
        <button data-skill-confirm-089="cancel" type="button">취소</button>
        <button class="primary" ${draft.canUpgrade ? '' : 'disabled'} data-skill-confirm-089="confirm" data-skill-id="${escapeAttr089(draft.skillId)}" type="button">강화 확정</button>
      </div>
    </section>
  `;
}

export function renderSkillUpgradeHint089(summary: SkillReadinessSummary089) {
  return `
    <div class="skill-upgrade-hint-089 ${summary.level}">
      <b>${escapeHtml089(summary.label)}</b>
      <span>습득 ${summary.learned}/${summary.total} · 사용 가능 ${summary.ready} · 숙련 합계 Lv.${summary.masteryTotal}</span>
    </div>
  `;
}

function escapeHtml089(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr089(value: string | number) {
  return escapeHtml089(value).replace(/`/g, '&#096;');
}
