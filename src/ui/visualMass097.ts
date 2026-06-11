type VisualMassElements097 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
  titleAudioButton?: HTMLButtonElement | null;
  closeButtons?: Array<HTMLElement | null>;
};

export type VisualMassReport097 = {
  route: 'title' | 'login' | 'town' | 'field';
  titleReady: boolean;
  titleButtonReady: boolean;
  townSingleHub: boolean;
  fieldOverflowCount: number;
  modalOverflowCount: number;
  message: string;
};

const OLD_BODY_CLASSES = [
  'fantasy-ui-081', 'fantasy-ui-082', 'fantasy-ui-083', 'fantasy-ui-084', 'fantasy-ui-085', 'fantasy-ui-086',
  'fantasy-ui-087', 'fantasy-ui-088', 'fantasy-ui-089', 'fantasy-ui-090', 'fantasy-ui-091', 'fantasy-ui-092',
  'fantasy-ui-093', 'fantasy-ui-094', 'fantasy-ui-095', 'fantasy-ui-096',
  'route-title-095', 'route-login-095', 'route-town-095', 'route-field-095',
  'route-title-096', 'route-login-096', 'route-town-096', 'route-field-096'
];

const LEGACY_SCREEN_CLASSES = [
  'title-screen-095', 'entry-poster-095', 'entry-clean-096',
  'login-screen-095', 'login-consolidated-095', 'login-clean-096',
  'town-screen-095', 'town-consolidated-095', 'town-clean-096'
];

const FIELD_OVERFLOW_SELECTORS = [
  '.hud-top', '.resource-strip', '.target-card', '.field-quest-tracker', '.field-chain-meter', '.field-minimap',
  '.combat-log', '.combat-log-toggle', '.joystick', '.potion-dock', '.skill-dock', '.action-dock'
];

const MODAL_OVERFLOW_SELECTORS = ['.town-drawer:not(.hidden)', '.sheet:not(.hidden)', '.item-detail-card', '.exit-confirm-card'];

function visible(el: HTMLElement) {
  return !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';
}

function routeOf(elements: VisualMassElements097): VisualMassReport097['route'] {
  if (visible(elements.titleScreen)) return 'title';
  if (visible(elements.loginScreen)) return 'login';
  if (visible(elements.townScreen)) return 'town';
  return 'field';
}

function setBodyRoute097(route: VisualMassReport097['route']) {
  document.body.classList.remove('route-title-097', 'route-login-097', 'route-town-097', 'route-field-097');
  document.body.classList.add(`route-${route}-097`);
}

function prepareEntryFrame097(elements: VisualMassElements097) {
  let frame = elements.titleScreen.querySelector<HTMLElement>('.entry-frame-097');
  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'entry-frame-097';
    frame.innerHTML = '<div class="entry-logo-097" aria-hidden="true"><b>SOUL</b><span>ONLINE</span></div>';
    elements.titleScreen.append(frame);
  }
  if (!frame.contains(elements.startButton)) frame.append(elements.startButton);
  elements.startButton.classList.add('start-game-btn-097');
  elements.startButton.type = 'button';
  elements.startButton.textContent = 'TOUCH TO START';
  elements.startButton.setAttribute('aria-label', '게임 시작');
  if (elements.titleAudioButton) {
    elements.titleAudioButton.classList.add('entry-audio-097');
    if (!frame.contains(elements.titleAudioButton)) frame.append(elements.titleAudioButton);
  }
}

function markCloseButtons097(buttons?: Array<HTMLElement | null>) {
  (buttons || []).forEach((button) => {
    if (!button) return;
    button.classList.add('close-crystal-097');
    button.setAttribute('aria-label', button.getAttribute('aria-label') || '닫기');
    button.setAttribute('title', button.getAttribute('title') || '닫기');
  });
}

function countViewportOverflow(selectors: string[], includeHidden = false) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let count = 0;
  selectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const style = window.getComputedStyle(el);
      if (!includeHidden && (style.display === 'none' || style.visibility === 'hidden' || el.classList.contains('hidden'))) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (rect.left < -2 || rect.right > vw + 2 || rect.top < -2 || rect.bottom > vh + 2) count += 1;
    });
  });
  return count;
}

function installResizeSync097(elements: VisualMassElements097) {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncVisualMass097(elements);
    });
  };
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
}

export function installVisualMass097(elements: VisualMassElements097) {
  document.body.classList.remove(...OLD_BODY_CLASSES);
  document.body.classList.add('fantasy-ui-097', 'visual-mass-097');
  elements.titleScreen.classList.remove(...LEGACY_SCREEN_CLASSES);
  elements.loginScreen.classList.remove(...LEGACY_SCREEN_CLASSES);
  elements.townScreen.classList.remove(...LEGACY_SCREEN_CLASSES);
  elements.titleScreen.classList.add('title-screen-097');
  elements.loginScreen.classList.add('login-screen-097');
  elements.townScreen.classList.add('town-screen-097');
  prepareEntryFrame097(elements);
  markCloseButtons097(elements.closeButtons);
  installResizeSync097(elements);
  syncVisualMass097(elements);
}

export function syncVisualMass097(elements: VisualMassElements097) {
  const route = routeOf(elements);
  setBodyRoute097(route);
  elements.titleScreen.classList.toggle('title-visible-097', route === 'title');
  elements.loginScreen.classList.toggle('login-visible-097', route === 'login');
  elements.townScreen.classList.toggle('town-visible-097', route === 'town');
  elements.gameRoot.classList.toggle('field-visible-097', route === 'field');
  prepareEntryFrame097(elements);
  markCloseButtons097(elements.closeButtons);
  return inspectVisualMass097(elements);
}

export function inspectVisualMass097(elements: VisualMassElements097): VisualMassReport097 {
  const route = routeOf(elements);
  const titleRect = elements.titleScreen.getBoundingClientRect();
  const btnRect = elements.startButton.getBoundingClientRect();
  const titleReady = route !== 'title' || (titleRect.width > 100 && titleRect.height > 100);
  const titleButtonReady = route !== 'title' || (btnRect.width >= 180 && btnRect.height >= 48 && btnRect.left >= 0 && btnRect.right <= window.innerWidth);
  const townHub = elements.townScreen.querySelector<HTMLElement>('.town-master-lobby-074');
  const legacyVisible = Array.from(elements.townScreen.querySelectorAll<HTMLElement>('.town-game-lobby-070, .town-premium-lobby-072, .town-layout, .town-bottom-menu')).some((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && !el.classList.contains('hidden');
  });
  const townSingleHub = route !== 'town' || Boolean(townHub && !legacyVisible);
  const fieldOverflowCount = route === 'field' ? countViewportOverflow(FIELD_OVERFLOW_SELECTORS) : 0;
  const modalOverflowCount = countViewportOverflow(MODAL_OVERFLOW_SELECTORS);
  const ok = titleReady && titleButtonReady && townSingleHub && fieldOverflowCount === 0 && modalOverflowCount === 0;
  const message = ok
    ? '0.97 시각/모바일 안전 영역 정상'
    : `점검 필요 · title ${titleButtonReady ? 'ok' : 'button'} · town ${townSingleHub ? 'ok' : 'legacy'} · field ${fieldOverflowCount} · modal ${modalOverflowCount}`;
  return { route, titleReady, titleButtonReady, townSingleHub, fieldOverflowCount, modalOverflowCount, message };
}
