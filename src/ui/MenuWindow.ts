export type MenuWindowInstallOptions = {
  sheet: HTMLElement;
  townPanel?: HTMLElement;
  closeButtons?: HTMLElement[];
};

const OPENING_CLASS = 'menu-window-opening-111';
const CLOSING_CLASS = 'menu-window-closing-111';
const READY_CLASS = 'menu-window-ready-111';

/**
 * DOM 기반 팝업을 모바일 게임식 탄성 모션으로 보정합니다.
 * 기존 .sheet/.town-content-panel 구조는 그대로 두고 클래스만 얹기 때문에 롤백이 쉽습니다.
 */
export function installMenuWindowMotion111(options: MenuWindowInstallOptions) {
  const windows = [options.sheet, options.townPanel].filter(Boolean) as HTMLElement[];
  for (const element of windows) {
    element.classList.add(READY_CLASS);
    element.style.setProperty('--menu-window-origin-x', '50%');
    element.style.setProperty('--menu-window-origin-y', '52%');
  }
  for (const button of options.closeButtons || []) {
    button.addEventListener('pointerdown', () => button.classList.add('menu-close-press-111'), { passive: true });
    button.addEventListener('pointerup', () => button.classList.remove('menu-close-press-111'), { passive: true });
    button.addEventListener('pointercancel', () => button.classList.remove('menu-close-press-111'), { passive: true });
  }
}

/** 팝업을 화면 중앙에서 띠용 열리게 만들고, 안전 영역 안쪽으로 보정합니다. */
export function openMenuWindow111(element: HTMLElement) {
  syncMenuWindowSafeFrame111(element);
  element.classList.remove(CLOSING_CLASS);
  element.classList.remove(OPENING_CLASS);
  void element.offsetWidth;
  element.classList.add(OPENING_CLASS);
  window.setTimeout(() => element.classList.remove(OPENING_CLASS), 360);
}

/** 닫힐 때도 짧은 수축 모션을 주되, 기존 aria/class 흐름을 방해하지 않습니다. */
export function closeMenuWindow111(element: HTMLElement) {
  element.classList.remove(OPENING_CLASS);
  element.classList.add(CLOSING_CLASS);
  window.setTimeout(() => element.classList.remove(CLOSING_CLASS), 180);
}

/** 작은 화면/노치/주소창 변화에 따라 팝업 최대 높이를 다시 계산합니다. */
export function syncMenuWindowSafeFrame111(element: HTMLElement) {
  const safeTop = cssEnvFallback('--sat-111', 'env(safe-area-inset-top)', 0);
  const safeBottom = cssEnvFallback('--sab-111', 'env(safe-area-inset-bottom)', 0);
  const viewportH = window.visualViewport?.height || window.innerHeight;
  const maxHeight = Math.max(420, viewportH - safeTop - safeBottom - 24);
  element.style.setProperty('--menu-window-max-h-111', `${Math.floor(maxHeight)}px`);
}

function cssEnvFallback(name: string, value: string, fallback: number) {
  document.documentElement.style.setProperty(name, value);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
