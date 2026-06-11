export type VisualConsolidationTargets094 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
  closeButtons?: HTMLElement[];
};

let installed094 = false;
let syncTimer094 = 0;

export function installVisualConsolidation094(targets: VisualConsolidationTargets094) {
  document.body.classList.add('fantasy-ui-094', 'visual-consolidation-094');
  targets.titleScreen.classList.add('title-screen-094', 'title-art-start-094');
  targets.loginScreen.classList.add('login-screen-094');
  targets.townScreen.classList.add('town-screen-094');
  targets.startButton.classList.add('start-game-btn-094');
  targets.startButton.type = 'button';
  targets.startButton.disabled = false;
  targets.startButton.removeAttribute('aria-hidden');
  targets.startButton.setAttribute('aria-label', '소울 온라인 시작');
  targets.startButton.textContent = targets.startButton.textContent?.trim() || 'TOUCH TO START';

  for (const button of targets.closeButtons || []) {
    button.classList.add('soul-close-094');
    button.setAttribute('aria-label', button.getAttribute('aria-label') || '닫기');
    button.setAttribute('title', button.getAttribute('title') || '닫기');
  }

  syncVisualConsolidation094(targets);
  if (installed094) return;
  installed094 = true;

  const observer = new MutationObserver(() => scheduleSync094(targets));
  observer.observe(targets.titleScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer.observe(targets.loginScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer.observe(targets.townScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', () => scheduleSync094(targets), { passive: true });
  window.addEventListener('orientationchange', () => scheduleSync094(targets), { passive: true });
  window.setTimeout(() => syncVisualConsolidation094(targets), 80);
  window.setTimeout(() => syncVisualConsolidation094(targets), 450);
  window.setTimeout(() => syncVisualConsolidation094(targets), 1200);
}

export function syncVisualConsolidation094(targets: Pick<VisualConsolidationTargets094, 'titleScreen' | 'loginScreen' | 'townScreen' | 'gameRoot'>) {
  const titleVisible = isVisibleRoute094(targets.titleScreen);
  const loginVisible = isVisibleRoute094(targets.loginScreen);
  const townVisible = isVisibleRoute094(targets.townScreen) || document.body.classList.contains('town-active');
  const fieldVisible = document.body.classList.contains('field-active');

  document.body.classList.toggle('title-route-094', titleVisible && !loginVisible && !townVisible && !fieldVisible);
  document.body.classList.toggle('login-route-094', loginVisible && !townVisible && !fieldVisible);
  document.body.classList.toggle('town-route-094', townVisible && !fieldVisible);
  document.body.classList.toggle('field-route-094', fieldVisible);
  document.body.classList.toggle('mobile-portrait-094', window.innerWidth <= 560 && window.innerHeight >= window.innerWidth);
  document.body.classList.toggle('mobile-landscape-094', window.innerWidth <= 940 && window.innerWidth > window.innerHeight);
  document.body.classList.toggle('short-height-094', window.innerHeight < 680);

  if (titleVisible && !loginVisible && !townVisible && !fieldVisible) {
    targets.titleScreen.setAttribute('aria-hidden', 'false');
    targets.gameRoot.setAttribute('aria-hidden', 'true');
  } else {
    targets.gameRoot.removeAttribute('aria-hidden');
  }
}

function scheduleSync094(targets: Pick<VisualConsolidationTargets094, 'titleScreen' | 'loginScreen' | 'townScreen' | 'gameRoot'>) {
  window.clearTimeout(syncTimer094);
  syncTimer094 = window.setTimeout(() => syncVisualConsolidation094(targets), 40);
}

function isVisibleRoute094(target: HTMLElement) {
  return !target.classList.contains('hidden') && target.getAttribute('aria-hidden') !== 'true';
}
