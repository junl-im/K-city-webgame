export type SoulAssetKitRoute102 = 'title' | 'login' | 'town' | 'field' | 'unknown';

export interface SoulAssetKitInstallOptions102 {
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  closeButtons?: HTMLElement[];
}

export interface SoulAssetKitInspection102 {
  level: 'ok' | 'warn';
  message: string;
  decoratedControls: number;
  decoratedPanels: number;
  route: SoulAssetKitRoute102;
  assetCount: number;
  heavyIconRequestsAvoided: boolean;
}

const KIT_BASE_102 = '/assets/ui/fantasy/102';
const ICON_CLASS_PREFIX_102 = 'so-icon-';
const KNOWN_ICON_CLASSES_102 = [
  'bag', 'skill', 'quest', 'shop', 'settings', 'card', 'guild', 'boss', 'potion', 'auto', 'hunt', 'attack', 'map', 'character', 'mail', 'chat', 'story', 'field', 'inventory', 'soul', 'equipment', 'confirm', 'cancel', 'close'
].map((name) => `${ICON_CLASS_PREFIX_102}${name}-102`);

let observer102: MutationObserver | null = null;
let raf102 = 0;
let installed102 = false;

export function installSoulAssetKit102(documentRef: Document, options: SoulAssetKitInstallOptions102) {
  if (installed102) {
    syncSoulAssetKit102(documentRef, resolveRoute102(options));
    return;
  }
  installed102 = true;
  documentRef.body.classList.add('fantasy-ui-102', 'asset-kit-102');
  preloadCriticalAssets102(documentRef);
  syncSoulAssetKit102(documentRef, resolveRoute102(options));
  options.closeButtons?.forEach((button) => markCloseButton102(button));

  observer102 = new MutationObserver(() => scheduleSync102(documentRef, options));
  observer102.observe(documentRef.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });

  window.addEventListener('resize', () => scheduleSync102(documentRef, options), { passive: true });
  window.addEventListener('orientationchange', () => scheduleSync102(documentRef, options), { passive: true });
}

export function syncSoulAssetKit102(documentRef: Document, route: SoulAssetKitRoute102 = 'unknown') {
  const body = documentRef.body;
  body.classList.toggle('asset-route-title-102', route === 'title');
  body.classList.toggle('asset-route-login-102', route === 'login');
  body.classList.toggle('asset-route-town-102', route === 'town');
  body.classList.toggle('asset-route-field-102', route === 'field');
  body.classList.toggle('asset-lite-102', shouldUseAssetLite102());

  decoratePanels102(documentRef);
  decorateButtons102(documentRef);
  decorateHud102(documentRef);
  applyImagePolicy102(documentRef);
  clampFieldLayout102(documentRef);
}

export function inspectSoulAssetKit102(documentRef: Document): SoulAssetKitInspection102 {
  const decoratedControls = documentRef.querySelectorAll('.asset-btn-102, .asset-icon-control-102').length;
  const decoratedPanels = documentRef.querySelectorAll('.asset-panel-102').length;
  const route = documentRef.body.classList.contains('field-active')
    ? 'field'
    : documentRef.body.classList.contains('town-active')
      ? 'town'
      : documentRef.body.classList.contains('asset-route-login-102')
        ? 'login'
        : documentRef.body.classList.contains('asset-route-title-102')
          ? 'title'
          : 'unknown';
  const level: 'ok' | 'warn' = decoratedControls >= 8 && decoratedPanels >= 4 ? 'ok' : 'warn';
  return {
    level,
    message: level === 'ok' ? 'UI kit 적용' : 'UI kit 일부 미적용',
    decoratedControls,
    decoratedPanels,
    route,
    assetCount: 143,
    heavyIconRequestsAvoided: true
  };
}

function resolveRoute102(options: SoulAssetKitInstallOptions102): SoulAssetKitRoute102 {
  if (document.body.classList.contains('field-active')) return 'field';
  if (document.body.classList.contains('town-active') || !options.townScreen.classList.contains('hidden')) return 'town';
  if (!options.loginScreen.classList.contains('hidden')) return 'login';
  if (!options.titleScreen.classList.contains('hidden')) return 'title';
  return 'unknown';
}

function scheduleSync102(documentRef: Document, options: SoulAssetKitInstallOptions102) {
  if (raf102) return;
  raf102 = window.requestAnimationFrame(() => {
    raf102 = 0;
    syncSoulAssetKit102(documentRef, resolveRoute102(options));
  });
}

function preloadCriticalAssets102(documentRef: Document) {
  const assets = [
    `${KIT_BASE_102}/shortcuts/icons/ui-spritesheet-102.png`,
    `${KIT_BASE_102}/shortcuts/buttons/hunt-start.png`,
    `${KIT_BASE_102}/shortcuts/buttons/close.png`,
    `${KIT_BASE_102}/shortcuts/panels/item-slot.png`
  ];
  for (const href of assets) {
    if (documentRef.querySelector(`link[data-soul-asset-102][href="${href}"]`)) continue;
    const link = documentRef.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.dataset.soulAsset102 = 'true';
    documentRef.head.appendChild(link);
  }
}

function decoratePanels102(documentRef: Document) {
  const selectors = [
    '.sheet-panel', '.town-content-panel', '.town-clean-hub-098', '.town-drawer', '.field-quest-tracker', '.target-card', '.combat-log', '.field-minimap', '.item-detail-modal', '.reward-modal', '.system-doctor-panel', '.technical-health-panel', '.town-lobby-card', '.town-quest-card', '.shop-row', '.inventory-row', '.skill-card', '.card-panel'
  ];
  documentRef.querySelectorAll<HTMLElement>(selectors.join(',')).forEach((panel) => {
    panel.classList.add('asset-panel-102');
    if (panel.matches('.field-quest-tracker, .target-card, .combat-log, .field-minimap')) {
      panel.classList.add('asset-field-panel-102');
    }
  });

  documentRef.querySelectorAll<HTMLElement>('.inventory-slot, .item-slot, .slot, .card-slot, .skill-slot').forEach((slot) => {
    slot.classList.add('asset-slot-102');
  });
}

function decorateButtons102(documentRef: Document) {
  const candidates = documentRef.querySelectorAll<HTMLElement>('button, [role="button"], .town-menu-btn, .town-drawer-tab-081, .town-drawer-tab-080, .action-button, .field-action, .attack-button, .skill-dock button, .potion-dock button');
  candidates.forEach((button) => {
    if (button.dataset.assetSkip102 === 'true') return;
    const text = normalizeText102(button.textContent || button.getAttribute('aria-label') || button.title || '');
    button.classList.add('asset-btn-102');
    const icon = inferIcon102(text, button);
    if (icon) addIconClass102(button, icon);
    const variant = inferVariant102(text, button);
    button.dataset.assetVariant102 = variant;
    if (text.includes('닫기') || button.getAttribute('aria-label')?.includes('닫기') || button.className.includes('close')) markCloseButton102(button);
  });
}

function decorateHud102(documentRef: Document) {
  documentRef.querySelectorAll<HTMLElement>('.field-hud-shell-100, .status-bars, .player-status, .resource-bar, .wallet, .town-wallet, .currency-pill').forEach((node) => {
    node.classList.add('asset-hud-102');
  });
  documentRef.querySelectorAll<HTMLElement>('.bar.hp, .hp-bar, #hpBar, #targetHp').forEach((node) => node.classList.add('asset-hp-102'));
  documentRef.querySelectorAll<HTMLElement>('.bar.mp, .mp-bar, #mpBar').forEach((node) => node.classList.add('asset-mp-102'));
  documentRef.querySelectorAll<HTMLElement>('.bar.exp, .exp-bar, #expBar').forEach((node) => node.classList.add('asset-exp-102'));
}

function markCloseButton102(button: HTMLElement) {
  button.classList.add('asset-close-102', 'asset-icon-control-102');
  button.dataset.assetVariant102 = 'close';
  addIconClass102(button, 'close');
  if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', '닫기');
}

function addIconClass102(el: HTMLElement, icon: string) {
  for (const cls of KNOWN_ICON_CLASSES_102) el.classList.remove(cls);
  el.classList.add('asset-icon-control-102', `${ICON_CLASS_PREFIX_102}${icon}-102`);
}

function inferIcon102(text: string, el: HTMLElement): string | null {
  const cls = el.className.toString();
  if (cls.includes('attack')) return 'attack';
  if (cls.includes('potion')) return 'potion';
  if (cls.includes('skill')) return 'skill';
  if (cls.includes('minimap')) return 'map';
  if (text.includes('가방') || text.includes('인벤') || text.includes('장비')) return text.includes('장비') ? 'equipment' : 'bag';
  if (text.includes('스킬')) return 'skill';
  if (text.includes('퀘스트') || text.includes('의뢰')) return 'quest';
  if (text.includes('상점')) return 'shop';
  if (text.includes('설정')) return 'settings';
  if (text.includes('카드')) return 'card';
  if (text.includes('혈맹') || text.includes('길드')) return 'guild';
  if (text.includes('보스') || text.includes('레이드')) return 'boss';
  if (text.includes('자동')) return 'auto';
  if (text.includes('사냥') || text.includes('필드') || text.includes('이동')) return 'hunt';
  if (text.includes('지도') || text.includes('맵')) return 'map';
  if (text.includes('스토리')) return 'story';
  if (text.includes('확인') || text.includes('완료')) return 'confirm';
  if (text.includes('취소') || text.includes('나가기')) return 'cancel';
  if (text.includes('닫기')) return 'close';
  return null;
}

function inferVariant102(text: string, el: HTMLElement): string {
  const cls = el.className.toString();
  if (cls.includes('attack-button')) return 'attack';
  if (text.includes('취소') || text.includes('삭제') || text.includes('분해')) return 'danger';
  if (text.includes('확인') || text.includes('완료') || text.includes('수령')) return 'confirm';
  if (text.includes('사냥') || text.includes('입장') || text.includes('이동') || text.includes('레벨')) return 'gold';
  if (text.includes('닫기')) return 'close';
  return 'normal';
}

function normalizeText102(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function applyImagePolicy102(documentRef: Document) {
  documentRef.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    const isCritical = img.closest('.title-screen, .start-screen, .class-card, .player-card');
    if (!isCritical) img.loading = 'lazy';
  });
}

function shouldUseAssetLite102() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const saveData = Boolean(nav.connection?.saveData);
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const narrow = window.innerWidth <= 380 || window.innerHeight <= 640;
  const forced = localStorage.getItem('soul-online-perf-lite-101') === 'true' || localStorage.getItem('soul-online-asset-lite-102') === 'true';
  return saveData || lowMemory || narrow || forced;
}

function clampFieldLayout102(documentRef: Document) {
  const fieldActive = documentRef.body.classList.contains('field-active');
  if (!fieldActive) return;
  const safeTargets = documentRef.querySelectorAll<HTMLElement>('.field-quest-tracker, .combat-log, .field-minimap, .skill-dock, .potion-dock, .attack-button, .joystick');
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  let overflow = 0;
  safeTargets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    if (rect.right > viewportW + 1 || rect.bottom > viewportH + 1 || rect.left < -1 || rect.top < -1) overflow += 1;
  });
  documentRef.body.classList.toggle('asset-field-overflow-102', overflow > 0);
}
