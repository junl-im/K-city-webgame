export type VisualRescueTargets093 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton?: HTMLButtonElement | HTMLElement;
};

let installed093 = false;
let observer093: MutationObserver | null = null;
let resizeTimer093 = 0;

export function installVisualRescue093(targets: VisualRescueTargets093) {
  document.body.classList.add('fantasy-ui-093', 'visual-rescue-093');
  targets.titleScreen.classList.add('title-screen-093', 'title-art-start-093');
  targets.loginScreen.classList.add('login-screen-093');
  targets.townScreen.classList.add('town-screen-093');
  if (targets.startButton) {
    targets.startButton.classList.add('start-game-btn-093');
    targets.startButton.removeAttribute('aria-hidden');
    targets.startButton.setAttribute('aria-label', '소울 온라인 시작');
    if (!targets.startButton.textContent?.trim()) targets.startButton.textContent = 'TOUCH TO START';
  }
  syncVisualRoute093(targets);
  if (installed093) return;
  installed093 = true;

  observer093 = new MutationObserver(() => scheduleSync093(targets));
  observer093.observe(targets.titleScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer093.observe(targets.loginScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer093.observe(targets.townScreen, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  observer093.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', () => scheduleSync093(targets), { passive: true });
  window.addEventListener('orientationchange', () => scheduleSync093(targets), { passive: true });
  window.setTimeout(() => syncVisualRoute093(targets), 160);
  window.setTimeout(() => syncVisualRoute093(targets), 700);
}

export function syncVisualRoute093(targets: Omit<VisualRescueTargets093, 'startButton'>) {
  const titleVisible = !targets.titleScreen.classList.contains('hidden');
  const loginVisible = !targets.loginScreen.classList.contains('hidden');
  const townVisible = !targets.townScreen.classList.contains('hidden') || document.body.classList.contains('town-active');
  const fieldVisible = document.body.classList.contains('field-active');

  document.body.classList.toggle('title-active-093', titleVisible && !loginVisible && !townVisible && !fieldVisible);
  document.body.classList.toggle('login-active-093', loginVisible && !townVisible && !fieldVisible);
  document.body.classList.toggle('town-active-093', townVisible && !fieldVisible);
  document.body.classList.toggle('field-active-093', fieldVisible);

  targets.titleScreen.setAttribute('aria-hidden', titleVisible ? 'false' : 'true');
  targets.loginScreen.setAttribute('aria-hidden', loginVisible ? 'false' : 'true');
  targets.townScreen.setAttribute('aria-hidden', townVisible && !fieldVisible ? 'false' : 'true');

  clampViewport093();
}

function scheduleSync093(targets: Omit<VisualRescueTargets093, 'startButton'>) {
  window.clearTimeout(resizeTimer093);
  resizeTimer093 = window.setTimeout(() => syncVisualRoute093(targets), 50);
}

function clampViewport093() {
  const width = Math.max(320, Math.round(window.innerWidth || document.documentElement.clientWidth || 390));
  const height = Math.max(480, Math.round(window.innerHeight || document.documentElement.clientHeight || 720));
  document.documentElement.style.setProperty('--so-vw-093', `${width}px`);
  document.documentElement.style.setProperty('--so-vh-093', `${height}px`);
  document.body.dataset.soViewport093 = `${width}x${height}`;
  document.body.classList.toggle('compact-height-093', height < 700);
  document.body.classList.toggle('narrow-screen-093', width < 430);
}

export function uninstallVisualRescue093() {
  observer093?.disconnect();
  observer093 = null;
  installed093 = false;
}
