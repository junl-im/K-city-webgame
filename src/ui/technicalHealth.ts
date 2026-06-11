import type { PlayerSave } from '../types';

export type HealthLevel = 'ok' | 'warn' | 'danger';

export interface HealthRow {
  label: string;
  value: string;
  level: HealthLevel;
  hint?: string;
}

export interface UiAuditReport {
  ok: boolean;
  checked: number;
  overflowCount: number;
  message: string;
  worstTarget: string;
}

export interface PerformanceClassification {
  level: HealthLevel;
  label: string;
  shouldReduceMotion: boolean;
}

export interface SaveIntegrityReport {
  level: HealthLevel;
  message: string;
  problems: string[];
}

export interface AssetBudgetReport {
  level: HealthLevel;
  imageCount: number;
  decodedImages: number;
  pendingImages: number;
  heavyImages: number;
  message: string;
}

const ROUTE_NAMES: Record<string, string> = {
  hunt: '사냥',
  story: '스토리',
  cards: '카드',
  inventory: '가방',
  skills: '스킬',
  shop: '상점',
  boss: '보스',
  quests: '의뢰',
  pledge: '혈맹',
  settings: '설정',
  account: '계정'
};

export function auditUiBounds(selectors: string[], tolerance = 2): UiAuditReport {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!width || !height) {
    return { ok: true, checked: 0, overflowCount: 0, message: '뷰포트 정보 대기', worstTarget: '' };
  }

  const targets = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));
  const visibleTargets = targets.filter((node) => {
    const style = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
  });

  let worstTarget = '';
  let worstOverflow = 0;
  let overflowCount = 0;

  for (const node of visibleTargets) {
    const rect = node.getBoundingClientRect();
    const overflow = Math.max(
      Math.max(0, tolerance - rect.left),
      Math.max(0, tolerance - rect.top),
      Math.max(0, rect.right - width - tolerance),
      Math.max(0, rect.bottom - height - tolerance)
    );
    if (overflow > 0) {
      overflowCount += 1;
      if (overflow > worstOverflow) {
        worstOverflow = overflow;
        worstTarget = readableElementName(node);
      }
    }
  }

  const ok = overflowCount === 0;
  return {
    ok,
    checked: visibleTargets.length,
    overflowCount,
    message: ok ? `UI 안전 영역 정상 · ${visibleTargets.length}개 검사` : `화면 이탈 ${overflowCount}개 · ${worstTarget}`,
    worstTarget
  };
}

export function classifyPerformance(fps: number, longTaskCount: number, lastLongTaskMs: number): PerformanceClassification {
  if (fps < 30 || lastLongTaskMs >= 220 || longTaskCount >= 10) {
    return { level: 'danger', label: '저사양 모드 권장', shouldReduceMotion: true };
  }
  if (fps < 50 || lastLongTaskMs >= 120 || longTaskCount >= 5) {
    return { level: 'warn', label: '성능 주의', shouldReduceMotion: true };
  }
  return { level: 'ok', label: '성능 양호', shouldReduceMotion: false };
}

export function inspectSaveIntegrity(save: PlayerSave, knownIds: { classIds: string[]; itemIds: string[]; cardIds: string[]; skillIds: string[] }): SaveIntegrityReport {
  const problems: string[] = [];
  const itemIdSet = new Set(knownIds.itemIds);
  const cardIdSet = new Set(knownIds.cardIds);
  const skillIdSet = new Set(knownIds.skillIds);

  if (!save.saveId) problems.push('saveId 없음');
  if (!save.name?.trim()) problems.push('이름 없음');
  if (!knownIds.classIds.includes(save.classId)) problems.push('직업 ID 불일치');
  if (!Number.isFinite(save.level) || save.level < 1) problems.push('레벨 값 오류');
  if (!Array.isArray(save.inventory)) problems.push('가방 배열 오류');
  if (!Array.isArray(save.cards)) problems.push('카드 배열 오류');
  if (!Array.isArray(save.learnedSkillIds)) problems.push('스킬 배열 오류');

  const unknownItems = Array.isArray(save.inventory) ? save.inventory.filter((entry) => !itemIdSet.has(entry.itemId)).length : 0;
  const unknownCards = Array.isArray(save.cards) ? save.cards.filter((entry) => !cardIdSet.has(entry.cardId)).length : 0;
  const unknownSkills = Array.isArray(save.learnedSkillIds) ? save.learnedSkillIds.filter((skillId) => !skillIdSet.has(skillId)).length : 0;

  if (unknownItems) problems.push(`알 수 없는 아이템 ${unknownItems}개`);
  if (unknownCards) problems.push(`알 수 없는 카드 ${unknownCards}개`);
  if (unknownSkills) problems.push(`알 수 없는 스킬 ${unknownSkills}개`);

  const equipmentUids = new Set(Object.values(save.equipment || {}).filter(Boolean));
  const inventoryUids = new Set((save.inventory || []).map((entry) => entry.uid));
  const danglingEquipment = Array.from(equipmentUids).filter((uid) => !inventoryUids.has(uid));
  if (danglingEquipment.length) problems.push(`장착 연결 끊김 ${danglingEquipment.length}개`);

  if (save.inventory?.length >= 64) problems.push('가방 최대치 도달');
  else if (save.inventory?.length >= 58) problems.push('가방 정리 권장');

  if (problems.some((text) => /오류|없음|불일치|알 수 없는|끊김/.test(text))) {
    return { level: 'danger', message: problems.slice(0, 2).join(' · '), problems };
  }
  if (problems.length) return { level: 'warn', message: problems.join(' · '), problems };
  return { level: 'ok', message: '세이브 정상', problems };
}

export function inspectRuntimeAssets(): AssetBudgetReport {
  const images = Array.from(document.images || []);
  const decodedImages = images.filter((img) => img.complete && img.naturalWidth > 0).length;
  const pendingImages = images.length - decodedImages;
  const heavyImages = images.filter((img) => {
    const pixels = (img.naturalWidth || 0) * (img.naturalHeight || 0);
    return pixels >= 1536 * 1024;
  }).length;
  const level: HealthLevel = pendingImages > 8 || heavyImages > 4 ? 'warn' : 'ok';
  return {
    level,
    imageCount: images.length,
    decodedImages,
    pendingImages,
    heavyImages,
    message: `${decodedImages}/${images.length} 이미지 로드 · 대형 ${heavyImages}개`
  };
}

export function buildConnectivityRows(params: {
  activeTownContent: string;
  townContentOpen: boolean;
  sheetOpen: boolean;
  routeBusy: boolean;
  hasPendingSave: boolean;
  hasLatestSnapshot: boolean;
  hasGameInstance: boolean;
  cloudOnline: boolean;
  cloudPaused: boolean;
  serviceWorkerReady: boolean;
}): HealthRow[] {
  const routeName = ROUTE_NAMES[params.activeTownContent] || params.activeTownContent || '대기';
  return [
    { label: '화면 라우트', value: params.routeBusy ? `${routeName} 이동 중` : routeName, level: params.routeBusy ? 'warn' : 'ok' },
    { label: '마을 패널', value: params.townContentOpen ? '열림' : '닫힘', level: 'ok' },
    { label: '필드 엔진', value: params.hasGameInstance ? 'Pixi 연결' : '대기', level: params.hasLatestSnapshot && !params.hasGameInstance ? 'warn' : 'ok' },
    { label: '세이브', value: params.hasPendingSave ? '캐릭터 연결' : '로그인 대기', level: params.hasPendingSave ? 'ok' : 'warn' },
    { label: '클라우드', value: params.cloudPaused ? '쓰기 보류' : params.cloudOnline ? '온라인' : '로컬', level: params.cloudPaused ? 'warn' : 'ok' },
    { label: 'PWA', value: params.serviceWorkerReady ? 'SW 준비' : '브라우저 대기', level: 'ok' }
  ];
}

export function buildActionLatencyLabel(lastActionAt: number, now = Date.now()) {
  if (!lastActionAt) return '입력 대기';
  const age = Math.max(0, now - lastActionAt);
  if (age < 250) return '즉시 반응';
  if (age < 1000) return `${age}ms 전 입력`;
  return `${Math.round(age / 1000)}초 전 입력`;
}

function readableElementName(node: HTMLElement) {
  if (node.id) return `#${node.id}`;
  const className = String(node.className || '').trim().split(/\s+/).slice(0, 2).join('.');
  return className ? `.${className}` : node.tagName.toLowerCase();
}
