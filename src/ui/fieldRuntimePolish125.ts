export type FieldRuntimeReport125 = {
  label: string;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
};

type SoulWindow125 = Window & {
  SOUL_FIELD_RUNTIME_125?: boolean;
  SOUL_FIELD_ENTRY_BUSY_125?: boolean;
  SOUL_FIELD_ENTRY_COUNT_125?: number;
  SOUL_FIELD_ENTRY_ZONE_125?: string;
  SOUL_TEXTURE_CACHE_125?: { hits: number; loads: number; failures: number; size: number };
};

let installed125 = false;
let fieldEntryBusy125 = false;
let fieldEntryZone125 = '';
let fieldEntryStartedAt125 = 0;
let fieldEntryCompletedAt125 = 0;
let blockedEntries125 = 0;
let fieldEntryCount125 = 0;
let lastUiAuditAt125 = 0;
let lastUiAuditMessage125 = '필드 UI 검사 대기';
let lastUiAuditCollisions125 = 0;
let lastTouchRepairAt125 = 0;
let lastError125 = '';

const GHOST_SELECTOR_125 = [
  '.title-character-companion',
  '.town-lobby-pet-070',
  '.field-pet',
  '[class*="companion"]',
  '[class*="rune"]',
  '.orientation-guard',
  '.rotate-guide',
  '.legacy-visual-layer',
  '.title-hero-glow',
  '[data-legacy-layer="true"]'
].join(',');

const TOUCH_SELECTOR_125 = [
  '#startGameBtn',
  '#guestLoginBtn',
  '#googleLoginBtn',
  '#localLoginBtn',
  '#serverNextBtn',
  '#characterNextBtn',
  '#connectCharacterBtn',
  '#newCharacterBtn',
  '#returnTownBtn',
  '#attackBtn',
  '#hpPotionBtn',
  '#mpPotionBtn',
  '#inventoryBtn',
  '#cardsBtn',
  '[data-skill-slot]',
  '.town-action-btn',
  '.quick-action-btn'
].join(',');

export function installFieldRuntimePolish125(documentRef: Document) {
  if (installed125) return inspectFieldRuntimePolish125(documentRef);
  installed125 = true;
  const win = documentRef.defaultView as SoulWindow125 | null;
  if (win) {
    win.SOUL_FIELD_RUNTIME_125 = true;
    win.SOUL_FIELD_ENTRY_BUSY_125 = false;
    win.SOUL_FIELD_ENTRY_COUNT_125 = 0;
  }

  documentRef.documentElement.classList.add('soul-field-runtime-125');
  documentRef.body.classList.add('fantasy-ui-125', 'field-runtime-polish-125', 'single-2p5d-runtime-125');
  documentRef.body.dataset.alphaVersion = '1.25.0';

  repairTouchTargets125(documentRef);
  hideGhostLayers125(documentRef);

  const repair = () => {
    repairTouchTargets125(documentRef);
    hideGhostLayers125(documentRef);
    auditFieldUi125(documentRef);
  };

  win?.addEventListener('pageshow', repair, { passive: true });
  win?.addEventListener('visibilitychange', repair, { passive: true });
  win?.addEventListener('orientationchange', () => window.setTimeout(repair, 80), { passive: true });
  win?.addEventListener('error', (event) => {
    lastError125 = event.message || 'runtime error';
    documentRef.body.classList.add('field-runtime-warning-125');
  });
  win?.addEventListener('unhandledrejection', (event) => {
    lastError125 = event.reason instanceof Error ? event.reason.message : String(event.reason || 'promise rejection');
    documentRef.body.classList.add('field-runtime-warning-125');
  });

  win?.setTimeout(repair, 150);
  win?.setTimeout(repair, 1200);
  return inspectFieldRuntimePolish125(documentRef);
}

export function beginFieldEntry125(documentRef: Document, zoneName: string) {
  const now = performance.now();
  if (fieldEntryBusy125) {
    blockedEntries125 += 1;
    documentRef.body.classList.add('field-entry-deduped-125');
    return false;
  }
  fieldEntryBusy125 = true;
  fieldEntryZone125 = zoneName || '사냥터';
  fieldEntryStartedAt125 = now;
  fieldEntryCompletedAt125 = 0;
  fieldEntryCount125 += 1;
  documentRef.body.classList.remove('field-entry-deduped-125', 'field-entry-failed-125');
  documentRef.body.classList.add('field-entry-busy-125');
  documentRef.body.dataset.fieldEntryZone125 = fieldEntryZone125;
  const win = documentRef.defaultView as SoulWindow125 | null;
  if (win) {
    win.SOUL_FIELD_ENTRY_BUSY_125 = true;
    win.SOUL_FIELD_ENTRY_ZONE_125 = fieldEntryZone125;
    win.SOUL_FIELD_ENTRY_COUNT_125 = fieldEntryCount125;
  }
  return true;
}

export function finishFieldEntry125(documentRef: Document, ok = true) {
  fieldEntryBusy125 = false;
  fieldEntryCompletedAt125 = performance.now();
  documentRef.body.classList.remove('field-entry-busy-125');
  documentRef.body.classList.toggle('field-entry-failed-125', !ok);
  documentRef.body.classList.toggle('field-entry-ready-125', ok);
  const win = documentRef.defaultView as SoulWindow125 | null;
  if (win) win.SOUL_FIELD_ENTRY_BUSY_125 = false;
  repairTouchTargets125(documentRef);
  hideGhostLayers125(documentRef);
}

export function auditFieldUi125(documentRef: Document, legacyAudit?: () => void) {
  const now = performance.now();
  if (now - lastUiAuditAt125 < 640) {
    return { ok: lastUiAuditCollisions125 === 0, collisions: lastUiAuditCollisions125, message: lastUiAuditMessage125 };
  }
  lastUiAuditAt125 = now;

  if (!documentRef.body.classList.contains('field-active')) {
    lastUiAuditCollisions125 = 0;
    lastUiAuditMessage125 = '필드 비활성';
    documentRef.body.classList.remove('field-collision-risk-125');
    return { ok: true, collisions: 0, message: lastUiAuditMessage125 };
  }

  try { legacyAudit?.(); } catch (error) { lastError125 = error instanceof Error ? error.message : String(error || 'legacy audit failed'); }

  const nodes = Array.from(documentRef.querySelectorAll<HTMLElement>('#returnTownBtn, #joystick, #attackBtn, #inventoryBtn, #cardsBtn, [data-skill-slot], #hpPotionBtn, #mpPotionBtn'));
  const visible = nodes
    .filter((node) => node.offsetParent !== null && node.getClientRects().length > 0)
    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
    .filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);

  let collisions = 0;
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      if (overlap125(visible[i].rect, visible[j].rect, 10)) collisions += 1;
    }
  }

  lastUiAuditCollisions125 = collisions;
  lastUiAuditMessage125 = collisions ? `필드 버튼 충돌 ${collisions}건 보정` : '필드 버튼 충돌 없음';
  documentRef.body.classList.toggle('field-collision-risk-125', collisions > 0);
  repairTouchTargets125(documentRef);
  hideGhostLayers125(documentRef);
  return { ok: collisions === 0, collisions, message: lastUiAuditMessage125 };
}

export function inspectFieldRuntimePolish125(documentRef: Document): FieldRuntimeReport125 {
  const win = documentRef.defaultView as SoulWindow125 | null;
  const textureCache = win?.SOUL_TEXTURE_CACHE_125;
  const elapsed = fieldEntryStartedAt125 ? Math.round((fieldEntryCompletedAt125 || performance.now()) - fieldEntryStartedAt125) : 0;
  const level: 'ok' | 'warn' = !installed125 || fieldEntryBusy125 || blockedEntries125 > 0 || lastUiAuditCollisions125 > 0 || lastError125 ? 'warn' : 'ok';
  return {
    label: '1.25 필드 런타임',
    level,
    message: installed125 ? `${fieldEntryBusy125 ? '입장 중' : '대기'} · ${lastUiAuditMessage125}` : '미설치',
    hint: `${fieldEntryZone125 || '대기'} · ${elapsed}ms · 중복차단 ${blockedEntries125} · 텍스처 ${textureCache ? `${textureCache.size}개 · hit ${textureCache.hits}` : '대기'}${lastError125 ? ` · ${lastError125}` : ''}`
  };
}

function repairTouchTargets125(documentRef: Document) {
  const now = performance.now();
  if (now - lastTouchRepairAt125 < 800) return;
  lastTouchRepairAt125 = now;
  documentRef.querySelectorAll<HTMLElement>(TOUCH_SELECTOR_125).forEach((node) => {
    node.style.touchAction = 'manipulation';
    node.style.setProperty('-webkit-tap-highlight-color', 'transparent');
    if (node.dataset.touchReady125 !== '1') {
      node.dataset.touchReady125 = '1';
      if (!node.getAttribute('aria-label')) {
        const label = node.textContent?.trim();
        if (label) node.setAttribute('aria-label', label.slice(0, 40));
      }
    }
  });
}

function hideGhostLayers125(documentRef: Document) {
  documentRef.querySelectorAll<HTMLElement>(GHOST_SELECTOR_125).forEach((node) => {
    if (node.dataset.keepGhost125 === '1') return;
    node.style.display = 'none';
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
  });
}

function overlap125(a: DOMRect, b: DOMRect, gap = 0) {
  return !(a.right + gap < b.left || b.right + gap < a.left || a.bottom + gap < b.top || b.bottom + gap < a.top);
}
