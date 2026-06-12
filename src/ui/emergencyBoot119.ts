type BootRoute119 = 'title' | 'login' | 'town' | 'field';

type BootTargets119 = {
  appShell?: HTMLElement | null;
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
};

type IdleTask119 = () => void;

type BootState119 = {
  installed: boolean;
  readyAt: number;
  route: BootRoute119;
  idleBatches: number;
  lastError: string;
};

const state119: BootState119 = {
  installed: false,
  readyAt: 0,
  route: 'title',
  idleBatches: 0,
  lastError: ''
};

const BOOT_STORAGE_KEY = 'soul-online-alpha-boot-version';
const OLD_MODE_KEYS = [
  'soul-online-render-profile',
  'soul-online-alpha-render-profile',
  'soul-online-force-quality',
  'soul-online-force-lite',
  'soul-online-asset-pack',
  'soul-online-alpha-asset-pack'
];

function viewportSize119() {
  const vv = window.visualViewport;
  const width = Math.max(320, Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 390));
  const height = Math.max(480, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 720));
  return { width, height };
}

function setFixedViewportVars119(doc: Document) {
  const { width, height } = viewportSize119();
  const root = doc.documentElement;
  if (!root.style.getPropertyValue('--soul-boot-w')) root.style.setProperty('--soul-boot-w', `${width}px`);
  if (!root.style.getPropertyValue('--soul-boot-h')) root.style.setProperty('--soul-boot-h', `${height}px`);
  root.style.setProperty('--soul-current-w', `${width}px`);
  root.style.setProperty('--soul-current-h', `${height}px`);
}

function clearLegacyRuntimeFlags119() {
  try {
    for (const key of OLD_MODE_KEYS) localStorage.removeItem(key);
    localStorage.setItem(BOOT_STORAGE_KEY, '1.19.0');
  } catch {
    // 저장소 접근이 막힌 브라우저에서도 게임 부팅은 계속 진행한다.
  }
}

function deleteOldRuntimeCaches119() {
  if (!('caches' in window)) return;
  window.setTimeout(() => {
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => /^soul-online-alpha-v1-(0|1[0-8])\b/.test(key)).map((key) => caches.delete(key))))
      .catch(() => undefined);
  }, 1600);
}

function stopResizeStorm119(doc: Document, targets: BootTargets119) {
  const sync = () => {
    setFixedViewportVars119(doc);
    targets.appShell?.classList.add('boot-frame-119');
  };
  sync();
  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  };
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', queue, { passive: true });
  window.visualViewport?.addEventListener('resize', queue, { passive: true });
}

export function installEmergencyBoot119(doc: Document, targets: BootTargets119) {
  if (state119.installed) return;
  state119.installed = true;
  state119.readyAt = performance.now();
  const body = doc.body;
  const version = '1.19.0';

  body.classList.add('emergency-boot-119', 'boot-critical-119', 'standard-mode-119', 'no-auto-quality-119');
  body.classList.remove('lite-render', 'quality-render', 'quality-mode', 'lite-mode', 'field-low-power', 'is-rotating');
  doc.documentElement.classList.add('soul-online-boot-119');
  targets.startButton.disabled = false;
  targets.startButton.removeAttribute('aria-disabled');
  targets.startButton.textContent = 'TOUCH TO START';
  doc.querySelectorAll<HTMLElement>('.title-mini-nav span:last-child, [data-alpha-version]').forEach((node) => {
    node.textContent = `v${version}`;
  });

  clearLegacyRuntimeFlags119();
  deleteOldRuntimeCaches119();
  stopResizeStorm119(doc, targets);
  syncEmergencyScene119(doc, 'title', targets);

  window.addEventListener('error', (event) => {
    state119.lastError = event.message || 'runtime error';
    body.classList.add('boot-error-recoverable-119');
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'promise rejection');
    state119.lastError = reason;
    body.classList.add('boot-error-recoverable-119');
  });
}

export function syncEmergencyScene119(doc: Document, route: BootRoute119, targets?: BootTargets119) {
  state119.route = route;
  const body = doc.body;
  body.classList.remove('route-title-119', 'route-login-119', 'route-town-119', 'route-field-119');
  body.classList.add(`route-${route}-119`);
  if (!targets) return;

  const show = (node: HTMLElement, visible: boolean) => {
    node.classList.toggle('hidden', !visible);
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };

  show(targets.titleScreen, route === 'title');
  show(targets.loginScreen, route === 'login');
  show(targets.townScreen, route === 'town');
  targets.gameRoot.classList.toggle('field-visible-119', route === 'field');
  body.classList.toggle('town-active', route === 'town');
  body.classList.toggle('field-active', route === 'field');
  body.classList.toggle('title-active-119', route === 'title');
  body.classList.toggle('login-active-119', route === 'login');
}

function runTask119(task: IdleTask119) {
  try {
    task();
  } catch (error) {
    state119.lastError = error instanceof Error ? error.message : String(error || 'idle task failed');
    document.body.classList.add('boot-task-skipped-119');
    console.warn('[SoulOnline 1.19] deferred task skipped', error);
  }
}

export function runIdleBatch119(label: string, tasks: IdleTask119[], chunk = 3, delay = 0) {
  if (!tasks.length) return;
  const queue = [...tasks];
  const runChunk = () => {
    const started = performance.now();
    for (let i = 0; i < chunk && queue.length; i += 1) runTask119(queue.shift()!);
    state119.idleBatches += 1;
    document.body.dataset.boot119Batch = `${label}:${state119.idleBatches}`;
    if (!queue.length) return;
    const next = () => runChunk();
    const ric = (window as Window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback;
    if (ric && performance.now() - started < 12) ric(next, { timeout: 900 });
    else window.setTimeout(next, 32);
  };
  window.setTimeout(runChunk, delay);
}

export function markBootInteractive119(doc: Document) {
  doc.body.classList.remove('boot-critical-119');
  doc.body.classList.add('boot-interactive-119');
}

export function markBootFullyReady119(doc: Document) {
  doc.body.classList.remove('boot-critical-119');
  doc.body.classList.add('boot-interactive-119', 'boot-fully-ready-119', 'legacy-visual-enabled-119');
}

export function inspectEmergencyBoot119(doc: Document) {
  const bootMs = Math.max(0, Math.round(performance.now() - state119.readyAt));
  const critical = doc.body.classList.contains('boot-critical-119');
  return {
    label: critical ? '긴급 부팅 중' : '즉시 시작 가능',
    level: state119.lastError ? 'warn' as const : 'ok' as const,
    hint: `route ${state119.route} · ${bootMs}ms · idle ${state119.idleBatches}${state119.lastError ? ` · ${state119.lastError}` : ''}`
  };
}
