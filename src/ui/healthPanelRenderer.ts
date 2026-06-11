import type { HealthLevel, HealthRow } from './technicalHealth';

export interface HealthTile087 {
  label: string;
  value: string;
  level: HealthLevel;
  hint?: string;
}

export interface TechnicalPanelMeta087 {
  viewport: string;
  memoryText: string;
  storageText: string;
  networkState: string;
  pwaState: string;
  characterTail: string;
  contentSummary: string;
}

export function renderSystemDoctor087(params: {
  version: string;
  mode: string;
  rows: HealthTile087[];
}) {
  return `
    <section class="system-doctor-085 system-doctor-086 system-doctor-087 ${escapeAttr087(params.mode)}" aria-label="0.89 시스템 닥터">
      <div class="system-doctor-head-085">
        <span class="panel-kicker">SYSTEM DOCTOR · 0.89</span>
        <h3>문제점·연결성·성능 빠른 점검</h3>
        <p>v${escapeHtml087(params.version)} 기준으로 UI 안전 영역, 세이브, 에셋, 콘텐츠 연결 그래프, 렌더 예산, 스킬 성장 UX를 함께 점검합니다.</p>
      </div>
      <div class="system-doctor-grid-085 system-doctor-grid-087">
        ${params.rows.map(renderHealthTile087).join('')}
      </div>
      <div class="system-doctor-actions-085">
        <button data-town-health-action="audit-ui" data-health-action="audit-ui">UI 재검사</button>
        <button data-town-health-action="save-local" data-health-action="save-local">저장 확인</button>
        <button data-town-health-action="preload-assets" data-health-action="preload-assets">에셋 예열</button>
        <button data-town-health-action="clear-issues" data-health-action="clear-issues">로그 정리</button>
      </div>
    </section>
  `;
}

export function renderTechnicalHealthPanel087(params: {
  version: string;
  mode: string;
  tiles: HealthTile087[];
  connectivityRows: HealthRow[];
  meta: TechnicalPanelMeta087;
  issueRows: string;
  cloudError?: string;
  contentProblems: string[];
}) {
  return `
    <section class="tech-health-panel-084 tech-health-panel-086 tech-health-panel-087 ${escapeAttr087(params.mode)}" aria-label="기술 상태 점검">
      <div class="tech-health-head-084">
        <span class="panel-kicker">TECH HEALTH · v${escapeHtml087(params.version)}</span>
        <h3>연결성·성능·UI 안전 점검</h3>
        <p>마을/필드/저장/PWA/콘텐츠 그래프를 분리 점검해서, 기능이 쌓여도 연결이 끊기지 않게 관리합니다.</p>
        <div class="tech-health-actions-085">
          <button data-town-health-action="audit-ui" data-health-action="audit-ui">UI 재검사</button>
          <button data-town-health-action="clear-issues" data-health-action="clear-issues">로그 정리</button>
          <button data-town-health-action="save-local" data-health-action="save-local">로컬 저장 확인</button>
          <button data-town-health-action="preload-assets" data-health-action="preload-assets">에셋 예열</button>
        </div>
      </div>
      <div class="tech-health-grid-084 tech-health-grid-087">
        ${params.tiles.map(renderHealthTile087).join('')}
      </div>
      <div class="connectivity-matrix-086 connectivity-matrix-087" aria-label="연결성 매트릭스">
        ${params.connectivityRows.map((row) => `<article class="${row.level}"><b>${escapeHtml087(row.label)}</b><span>${escapeHtml087(row.value)}</span>${row.hint ? `<small>${escapeHtml087(row.hint)}</small>` : ''}</article>`).join('')}
      </div>
      <div class="render-budget-panel-087" aria-label="렌더링 예산">
        <b>Render Budget</b>
        <span>${escapeHtml087(params.meta.contentSummary)}</span>
        <em>화면 ${escapeHtml087(params.meta.viewport)} · 메모리 ${escapeHtml087(params.meta.memoryText)} · 저장소 ${escapeHtml087(params.meta.storageText)}</em>
      </div>
      ${params.contentProblems.length ? `<ul class="content-health-issues-087">${params.contentProblems.map((problem) => `<li>${escapeHtml087(problem)}</li>`).join('')}</ul>` : ''}
      <div class="tech-health-meta-084 tech-health-meta-086 tech-health-meta-087">
        <span>화면 ${escapeHtml087(params.meta.viewport)}</span><span>메모리 ${escapeHtml087(params.meta.memoryText)}</span><span>저장소 ${escapeHtml087(params.meta.storageText)}</span><span>네트워크 ${escapeHtml087(params.meta.networkState)}</span><span>PWA ${escapeHtml087(params.meta.pwaState)}</span><span>캐릭터 ${escapeHtml087(params.meta.characterTail)}</span>
      </div>
      ${params.cloudError ? `<p class="tech-health-error-084">최근 클라우드 오류: ${escapeHtml087(params.cloudError)}</p>` : ''}
      <ul class="tech-health-issues-084">${params.issueRows}</ul>
    </section>
  `;
}

function renderHealthTile087(tile: HealthTile087) {
  return `<article class="${tile.level}" title="${escapeAttr087(tile.hint || tile.value)}"><b>${escapeHtml087(tile.label)}</b><em>${escapeHtml087(tile.value)}</em>${tile.hint ? `<small>${escapeHtml087(tile.hint)}</small>` : ''}</article>`;
}

function escapeHtml087(value: string) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return map[char];
  });
}

function escapeAttr087(value: string) {
  return escapeHtml087(value).replace(/`/g, '&#096;');
}
