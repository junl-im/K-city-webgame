type QualityRefs104 = {
  root?: HTMLElement | null;
  titleScreen?: HTMLElement | null;
  loginScreen?: HTMLElement | null;
  townScreen?: HTMLElement | null;
  gameRoot?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
  titleAudioButton?: HTMLButtonElement | null;
  closeButtons?: Array<HTMLElement | null>;
};

export type QualityAudit104 = {
  route: 'title' | 'login' | 'town' | 'field';
  overflowCount: number;
  legacyVisible: number;
  contrastReady: boolean;
  fieldReady: boolean;
  titleReady: boolean;
  townReady: boolean;
  controlCount: number;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
};

let installed = false;
let queued = false;
let refs104: QualityRefs104 = {};
let lastAudit104: QualityAudit104 | null = null;

const FIELD_NODES_104 = [
  '.hud-top',
  '.resource-strip',
  '.field-minimap',
  '.target-card',
  '.field-quest-tracker',
  '.field-chain-meter',
  '.combat-log-toggle',
  '.combat-log',
  '.joystick',
  '.potion-dock',
  '.skill-dock',
  '.action-dock'
] as const;

const OVERFLOW_SELECTORS_104 = [
  '.entry-quality-104',
  '.login-panel',
  '.town-quality-104',
  '#townContentPanel:not(.hidden)',
  '#sheet[aria-hidden="false"]',
  '.field-player-104',
  '.field-minimap-104',
  '.monster-info-104',
  '.quest-card-104',
  '.joystick-104',
  '.potion-dock-104',
  '.skill-stack-104',
  '.action-pad-104'
] as const;

const LEGACY_SELECTORS_104 = [
  '.town-game-lobby-070',
  '.town-premium-lobby-072',
  '.town-master-lobby-074',
  '.town-layout:not(.town-quality-104)',
  '.town-bottom-menu',
  '.town-hotspot-layer-060',
  '.visual-immersion-board',
  '.visual-polish-shell',
  '.screen-frame-072'
] as const;

export function installQualityPass104(documentRef: Document, refs: QualityRefs104 = {}) {
  refs104 = refs;
  documentRef.body.classList.add('fantasy-ui-104', 'quality-pass-104', 'quality-contrast-104');
  ensurePreloads104(documentRef);
  ensureTitleQuality104(documentRef);
  ensureTownQuality104(documentRef);
  ensureFieldQuality104(documentRef);
  decorateControls104(documentRef);
  syncQualityPass104(documentRef);

  if (installed) return;
  installed = true;
  const queue = () => queueQualityPass104(documentRef);
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(queue, 120), { passive: true });
  window.addEventListener('pageshow', queue, { passive: true });
  documentRef.addEventListener('visibilitychange', () => { if (!documentRef.hidden) queue(); });
  documentRef.addEventListener('pointerdown', queue, { passive: true });
  new MutationObserver(queue).observe(documentRef.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: false });
  window.setTimeout(queue, 250);
  window.setTimeout(queue, 1100);
}

export function syncQualityPass104(documentRef: Document = document) {
  clearRouteClasses104(documentRef.body);
  const route = detectRoute104(documentRef);
  documentRef.body.classList.add(`route-${route}-104`);
  documentRef.body.dataset.qualityRoute104 = route;
  documentRef.body.classList.toggle('quality-field-104', route === 'field');
  documentRef.body.classList.toggle('quality-town-104', route === 'town');
  documentRef.body.classList.toggle('quality-login-104', route === 'login');
  documentRef.body.classList.toggle('quality-title-104', route === 'title');
  documentRef.body.classList.toggle('quality-compact-104', window.innerWidth <= 390 || window.innerHeight <= 700);
  documentRef.body.classList.toggle('quality-short-104', window.innerHeight <= 650);
  ensureTitleQuality104(documentRef);
  ensureTownQuality104(documentRef);
  ensureFieldQuality104(documentRef);
  decorateControls104(documentRef);
  applyContrast104(documentRef, route);
  applyLiteState104(documentRef, route);
  lastAudit104 = inspectQualityPass104(documentRef);
  documentRef.body.classList.toggle('quality-overflow-104', lastAudit104.overflowCount > 0);
  documentRef.body.classList.toggle('quality-legacy-visible-104', lastAudit104.legacyVisible > 0);
  documentRef.body.classList.toggle('quality-ok-104', lastAudit104.level === 'ok');
  return lastAudit104;
}

export function queueQualityPass104(documentRef: Document = document) {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    syncQualityPass104(documentRef);
  });
}

export function inspectQualityPass104(documentRef: Document = document): QualityAudit104 {
  const route = detectRoute104(documentRef);
  const overflowCount = countOverflow104(documentRef);
  const legacyVisible = countLegacyVisible104(documentRef);
  const titleReady = Boolean(documentRef.querySelector('.entry-quality-104 .start-game-btn'));
  const townReady = Boolean(documentRef.querySelector('.town-quality-104'));
  const fieldReady = route !== 'field' || (
    Boolean(documentRef.querySelector('.field-hud-shell-104')) &&
    Boolean(documentRef.querySelector('.monster-info-104')) &&
    Boolean(documentRef.querySelector('.action-pad-104')) &&
    Boolean(documentRef.querySelector('.skill-stack-104'))
  );
  const controlCount = documentRef.querySelectorAll('.control-quality-104, .field-skill-104, .field-potion-104').length;
  const contrastReady = documentRef.body.classList.contains('quality-contrast-104');
  const ok = overflowCount === 0 && legacyVisible === 0 && titleReady && townReady && fieldReady && contrastReady;
  const audit: QualityAudit104 = {
    route,
    overflowCount,
    legacyVisible,
    contrastReady,
    fieldReady,
    titleReady,
    townReady,
    controlCount,
    level: ok ? 'ok' : 'warn',
    message: ok ? '1.04 UI 품질 정상' : `1.04 UI 품질 점검 · overflow ${overflowCount} · legacy ${legacyVisible}`,
    hint: `route ${route} · title ${titleReady ? 'ok' : 'miss'} · town ${townReady ? 'ok' : 'miss'} · field ${fieldReady ? 'ok' : 'miss'} · controls ${controlCount}`
  };
  lastAudit104 = audit;
  return audit;
}

export function lastQualityAudit104() {
  return lastAudit104;
}

function ensurePreloads104(documentRef: Document) {
  const assets = [
    '/assets/ui/fantasy/104/panel-quality-104.webp',
    '/assets/ui/fantasy/104/field-glass-104.webp',
    '/assets/ui/fantasy/104/monster-plate-104.webp',
    '/assets/ui/fantasy/104/attack-medallion-104.webp',
    '/assets/ui/fantasy/104/close-gem-104.webp'
  ];
  for (const href of assets) {
    if (documentRef.head.querySelector(`link[data-so104-preload="${href}"]`)) continue;
    const link = documentRef.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute('data-so104-preload', href);
    if (!href.includes('attack-medallion')) link.setAttribute('fetchpriority', 'low');
    documentRef.head.appendChild(link);
  }
}

function ensureTitleQuality104(documentRef: Document) {
  const titleScreen = refs104.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const startButton = refs104.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  if (!titleScreen || !startButton) return;
  let shell = titleScreen.querySelector<HTMLElement>('.entry-clean-098');
  if (!shell) {
    shell = documentRef.createElement('div');
    shell.className = 'entry-clean-098 entry-quality-104';
    shell.innerHTML = `
      <div class="entry-brand-098 entry-brand-104" aria-hidden="true"><span>LUMINA CHRONICLE</span><b>SOUL</b></div>
      <section class="entry-card-098 entry-card-104" aria-label="소울 온라인 시작">
        <div class="entry-copy-098 entry-copy-104"><h1>소울 온라인</h1><p>영혼을 깨우고 루미나 대륙으로 들어가세요.</p></div>
        <div class="entry-actions-098 entry-actions-104"></div>
      </section>`;
    titleScreen.appendChild(shell);
  }
  shell.classList.add('entry-quality-104');
  shell.querySelector('.entry-card-098')?.classList.add('entry-card-104');
  shell.querySelector('.entry-copy-098')?.classList.add('entry-copy-104');
  const actions = shell.querySelector<HTMLElement>('.entry-actions-098') || shell.querySelector<HTMLElement>('.entry-actions-104');
  if (actions && startButton.parentElement !== actions) actions.prepend(startButton);
  startButton.classList.add('start-quality-104', 'control-quality-104');
  startButton.textContent = 'TOUCH TO START';
  startButton.removeAttribute('style');
  if (actions && refs104.titleAudioButton && refs104.titleAudioButton.parentElement !== actions) actions.appendChild(refs104.titleAudioButton);
}

function ensureTownQuality104(documentRef: Document) {
  const townScreen = refs104.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  if (!townScreen) return;
  const hub = townScreen.querySelector<HTMLElement>('.town-clean-hub-098');
  if (hub) {
    hub.classList.add('town-quality-104', 'readable-panel-104');
    hub.querySelectorAll('button').forEach((button) => button.classList.add('control-quality-104'));
  }
  const drawer = townScreen.querySelector<HTMLElement>('#townContentPanel');
  drawer?.classList.add('readable-panel-104', 'drawer-quality-104');
  townScreen.querySelectorAll<HTMLElement>('.town-clean-quick-098 button, .town-clean-bottom-098 button, .town-clean-hunt-098').forEach((node) => node.classList.add('control-quality-104'));
}

function ensureFieldQuality104(documentRef: Document) {
  let shell = documentRef.querySelector<HTMLElement>('.field-hud-shell-100');
  if (!shell) {
    shell = documentRef.createElement('section');
    shell.className = 'field-hud-shell-100 field-hud-shell-104';
    shell.id = 'fieldHudShell100';
    shell.setAttribute('aria-label', '사냥터 전투 UI');
    (documentRef.querySelector('#app') || documentRef.body).appendChild(shell);
  }
  shell.classList.add('field-hud-shell-104');
  shell.setAttribute('aria-hidden', detectRoute104(documentRef) === 'field' ? 'false' : 'true');
  for (const selector of FIELD_NODES_104) {
    const node = documentRef.querySelector<HTMLElement>(selector);
    if (!node || node.parentElement === shell) continue;
    shell.appendChild(node);
  }
}

function decorateControls104(documentRef: Document) {
  documentRef.querySelector<HTMLElement>('.hud-top')?.classList.add('field-player-104', 'readable-dark-104');
  documentRef.querySelector<HTMLElement>('.resource-strip')?.classList.add('resource-quality-104', 'readable-dark-104');
  documentRef.querySelector<HTMLElement>('.target-card')?.classList.add('monster-info-104', 'readable-dark-104');
  documentRef.querySelector<HTMLElement>('.field-quest-tracker')?.classList.add('quest-card-104', 'readable-light-104');
  documentRef.querySelector<HTMLElement>('.field-chain-meter')?.classList.add('chain-quality-104', 'readable-dark-104');
  documentRef.querySelector<HTMLElement>('.field-minimap')?.classList.add('field-minimap-104', 'readable-dark-104');
  documentRef.querySelector<HTMLElement>('.combat-log')?.classList.add('combat-log-104', 'readable-dark-104');
  documentRef.querySelector<HTMLElement>('.combat-log-toggle')?.classList.add('combat-toggle-104', 'control-quality-104');
  documentRef.querySelector<HTMLElement>('.joystick')?.classList.add('joystick-104');
  documentRef.querySelector<HTMLElement>('.potion-dock')?.classList.add('potion-dock-104');
  documentRef.querySelector<HTMLElement>('.skill-dock')?.classList.add('skill-stack-104');
  documentRef.querySelector<HTMLElement>('.action-dock')?.classList.add('action-pad-104');
  documentRef.querySelector<HTMLButtonElement>('#attackBtn')?.classList.add('attack-quality-104', 'control-quality-104');
  documentRef.querySelector<HTMLButtonElement>('#autoHuntBtn')?.classList.add('utility-quality-104', 'auto-quality-104', 'control-quality-104');
  documentRef.querySelector<HTMLButtonElement>('#fieldMenuBtn')?.classList.add('utility-quality-104', 'menu-quality-104', 'control-quality-104');
  documentRef.querySelector<HTMLButtonElement>('#inventoryBtn')?.classList.add('utility-quality-104', 'bag-quality-104', 'control-quality-104');
  documentRef.querySelector<HTMLButtonElement>('#sleepModeBtn')?.classList.add('utility-quality-104', 'sleep-quality-104', 'control-quality-104');
  documentRef.querySelectorAll<HTMLButtonElement>('.skill-btn').forEach((button, index) => {
    button.classList.add('field-skill-104', 'control-quality-104');
    button.style.setProperty('--skill-index-104', String(index));
  });
  documentRef.querySelectorAll<HTMLButtonElement>('.potion-btn').forEach((button) => button.classList.add('field-potion-104', 'control-quality-104'));
  documentRef.querySelectorAll<HTMLElement>('.sheet, .item-detail-card, .town-drawer, .reward-modal, .system-doctor-panel, .technical-health-panel').forEach((node) => node.classList.add('readable-panel-104'));
  refs104.closeButtons?.forEach((button) => button?.classList.add('close-gem-104'));
  documentRef.querySelectorAll<HTMLButtonElement>('#closeSheet, #closeTownContent, #closeItemDetail, .item-detail-close, .icon-btn[aria-label="닫기"]').forEach((button) => {
    button.classList.add('close-gem-104', 'control-quality-104');
  });
}

function applyContrast104(documentRef: Document, route: QualityAudit104['route']) {
  documentRef.body.classList.toggle('contrast-field-104', route === 'field');
  documentRef.body.classList.toggle('contrast-light-104', route === 'title' || route === 'login' || route === 'town');
  documentRef.querySelectorAll<HTMLElement>('.readable-light-104, .town-quality-104, .login-panel, .entry-card-104').forEach((node) => {
    node.style.removeProperty('color');
  });
}

function applyLiteState104(documentRef: Document, route: QualityAudit104['route']) {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const saveData = Boolean(nav.connection?.saveData);
  const network = nav.connection?.effectiveType || '';
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const fieldPressure = route === 'field' && (window.innerWidth <= 390 || window.innerHeight <= 700);
  const lite = reduceMotion || saveData || /2g|slow-2g|3g/.test(network) || memory <= 3 || cores <= 4 || fieldPressure;
  documentRef.body.classList.toggle('quality-lite-104', lite);
}

function detectRoute104(documentRef: Document): QualityAudit104['route'] {
  if (documentRef.body.classList.contains('field-active') || Boolean((refs104.gameRoot || refs104.root || documentRef.querySelector('#game-root'))?.childElementCount)) return 'field';
  const town = refs104.townScreen || documentRef.querySelector<HTMLElement>('#townScreen');
  const login = refs104.loginScreen || documentRef.querySelector<HTMLElement>('#loginScreen');
  const title = refs104.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  if (town && !town.classList.contains('hidden')) return 'town';
  if (login && !login.classList.contains('hidden')) return 'login';
  if (title && !title.classList.contains('hidden')) return 'title';
  return 'title';
}

function clearRouteClasses104(body: HTMLElement) {
  const old = Array.from(body.classList).filter((name) => /^route-(title|login|town|field)-104$/.test(name));
  if (old.length) body.classList.remove(...old);
}

function isVisible104(node: Element | null): boolean {
  if (!node) return false;
  const element = node as HTMLElement;
  if (element.classList.contains('hidden')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function countOverflow104(documentRef: Document) {
  const vw = window.innerWidth || documentRef.documentElement.clientWidth || 0;
  const vh = window.innerHeight || documentRef.documentElement.clientHeight || 0;
  if (!vw || !vh) return 0;
  let count = 0;
  for (const selector of OVERFLOW_SELECTORS_104) {
    documentRef.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (!isVisible104(node)) return;
      const rect = node.getBoundingClientRect();
      const tolerance = 4;
      if (rect.left < -tolerance || rect.top < -tolerance || rect.right > vw + tolerance || rect.bottom > vh + tolerance) count += 1;
    });
  }
  return count;
}

function countLegacyVisible104(documentRef: Document) {
  let count = 0;
  for (const selector of LEGACY_SELECTORS_104) {
    documentRef.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      if (isVisible104(node)) count += 1;
    });
  }
  return count;
}
