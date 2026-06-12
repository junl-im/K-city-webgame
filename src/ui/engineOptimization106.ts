type QualityLevel106 = 'ok' | 'warn';

type InstallTargets106 = {
  root: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  closeButtons?: HTMLElement[];
};

type NavigatorBudget106 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function flag106(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

function wantsLiteAtlas106() {
  const nav = navigator as NavigatorBudget106;
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const network = nav.connection?.effectiveType || '';
  const saveData = Boolean(nav.connection?.saveData);
  const narrow = Math.min(window.innerWidth, window.innerHeight) <= 430 || window.innerHeight <= 760;
  if (flag106('soul-online-force-hq-atlas-106')) return false;
  return flag106('soul-online-lite-atlas-106') || saveData || memory <= 4 || cores <= 4 || /2g|3g|slow-2g/.test(network) || narrow;
}

function route106(doc: Document) {
  const body = doc.body;
  if (body.classList.contains('field-active')) return 'field';
  if (body.classList.contains('town-active')) return 'town';
  if (!doc.querySelector('#titleScreen')?.classList.contains('hidden')) return 'title';
  return 'login';
}

function overflowCount106(doc: Document) {
  const selectors = [
    '.hud-top', '.resource-strip', '.target-card', '.field-quest-tracker', '.field-minimap', '.combat-log',
    '.joystick', '.potion-dock', '.skill-dock', '.action-dock', '#sheet', '#townContentPanel', '#itemDetailModal'
  ];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let count = 0;
  for (const selector of selectors) {
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>(selector))) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.left < -4 || rect.top < -4 || rect.right > vw + 4 || rect.bottom > vh + 4) count += 1;
    }
  }
  return count;
}

export function installEngineOptimization106(doc: Document, targets: InstallTargets106) {
  doc.body.classList.add('fantasy-ui-106', 'engine-106');
  targets.titleScreen.classList.add('title-screen-106');
  targets.loginScreen.classList.add('login-screen-106');
  targets.townScreen.classList.add('town-screen-106');
  targets.closeButtons?.forEach((button) => button.classList.add('close-gem-106'));
  applyImagePolicy106(doc);
  syncEngineOptimization106(doc);
}

export function syncEngineOptimization106(doc: Document) {
  const body = doc.body;
  const route = route106(doc);
  body.classList.toggle('route-field-106', route === 'field');
  body.classList.toggle('route-town-106', route === 'town');
  body.classList.toggle('route-title-106', route === 'title');
  body.classList.toggle('route-login-106', route === 'login');
  const lite = wantsLiteAtlas106();
  body.classList.toggle('asset-atlas-lite-106', lite);
  body.classList.toggle('field-lite-106', lite && route === 'field');
  body.classList.toggle('field-overflow-106', route === 'field' && overflowCount106(doc) > 0);
  if (route === 'field') doc.querySelector('#game-root')?.classList.add('field-shell-106');
}

export function inspectEngineOptimization106(doc: Document) {
  const lite = wantsLiteAtlas106();
  const route = route106(doc);
  const overflow = overflowCount106(doc);
  const nav = navigator as NavigatorBudget106;
  const memory = nav.deviceMemory ? `${nav.deviceMemory}GB` : 'unknown';
  const cores = nav.hardwareConcurrency || 0;
  const level: QualityLevel106 = overflow > 0 ? 'warn' : 'ok';
  return {
    level,
    route,
    overflow,
    message: overflow > 0 ? `UI 이탈 ${overflow}개` : lite ? '라이트 아틀라스 최적화' : '고품질 아틀라스 모드',
    hint: `route ${route} · ${lite ? 'lite atlas' : 'HQ atlas'} · mem ${memory} · cores ${cores}`
  };
}

export function applyImagePolicy106(doc: Document) {
  doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    if (!img.closest('#titleScreen')) img.loading = 'lazy';
    if (img.closest('#titleScreen')) (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
  });
}
