export type TitleRevivalReport127 = {
  label: string;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
};

type TitleRevivalOptions127 = {
  titleScreen?: HTMLElement | null;
  startButton?: HTMLButtonElement | null;
  titleAudioButton?: HTMLButtonElement | null;
};

type SoulTitleWindow127 = Window & {
  SOUL_TITLE_REVIVAL_127?: boolean;
};

let installed127 = false;
let repairCount127 = 0;
let lastRepairAt127 = 0;
let lastMessage127 = '대기';
const TITLE_KEYVISUAL_PUBLIC_127 = '/assets/ui/fantasy/title-keyvisual-060.webp';

export function installTitleRevival127(documentRef: Document, options: TitleRevivalOptions127 = {}) {
  if (installed127) {
    repairTitleRevival127(documentRef, options);
    return inspectTitleRevival127(documentRef);
  }
  installed127 = true;
  const win = documentRef.defaultView as SoulTitleWindow127 | null;
  if (win) win.SOUL_TITLE_REVIVAL_127 = true;

  documentRef.documentElement.classList.add('soul-title-revival-127');
  documentRef.body.classList.add('fantasy-ui-127', 'title-revival-127', 'title-keyart-060-restored');
  documentRef.body.dataset.alphaVersion = '1.35.0';
  ensureTitlePreload127(documentRef);
  repairTitleRevival127(documentRef, options);

  win?.setTimeout(() => repairTitleRevival127(documentRef, options), 120);
  win?.setTimeout(() => repairTitleRevival127(documentRef, options), 900);
  return inspectTitleRevival127(documentRef);
}

export function syncTitleRevivalRoute127(documentRef: Document, route: 'title' | 'login' | 'town' | 'field', options: TitleRevivalOptions127 = {}) {
  documentRef.body.classList.toggle('route-title-127', route === 'title');
  documentRef.body.classList.toggle('route-login-127', route === 'login');
  documentRef.body.classList.toggle('route-town-127', route === 'town');
  documentRef.body.classList.toggle('route-field-127', route === 'field');
  if (route === 'title') repairTitleRevival127(documentRef, options);
}

export function repairTitleRevival127(documentRef: Document, options: TitleRevivalOptions127 = {}) {
  repairCount127 += 1;
  lastRepairAt127 = performance.now();
  const title = options.titleScreen || documentRef.querySelector<HTMLElement>('#titleScreen');
  const startButton = options.startButton || documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  const nav = title?.querySelector<HTMLElement>('.title-mini-nav');
  const version = nav?.querySelector<HTMLElement>('span:last-child');

  if (title) {
    title.dataset.titleRevival127 = '1';
    title.classList.add('title-screen-127');
    // 구형 타이틀 레이어가 다시 살아나도 1.27 CSS가 단일 키비주얼만 그리도록 플래그를 고정한다.
    title.style.removeProperty('background');
  }
  if (startButton) {
    startButton.disabled = false;
    startButton.classList.add('start-game-btn-127');
    startButton.setAttribute('aria-label', '게임 시작');
    startButton.textContent = 'TOUCH TO START';
  }
  if (nav) nav.classList.add('title-mini-nav-127');
  if (version) version.textContent = 'v1.35.0';

  lastMessage127 = title && startButton ? '060 키비주얼 복구' : '타이틀 요소 확인 필요';
  return inspectTitleRevival127(documentRef);
}

export function inspectTitleRevival127(documentRef: Document): TitleRevivalReport127 {
  const title = documentRef.querySelector<HTMLElement>('#titleScreen');
  const startButton = documentRef.querySelector<HTMLButtonElement>('#startGameBtn');
  const nav = title?.querySelector<HTMLElement>('.title-mini-nav');
  const hasClass = documentRef.body.classList.contains('title-revival-127');
  const ready = Boolean(installed127 && hasClass && title?.dataset.titleRevival127 === '1' && startButton && nav);
  return {
    label: '1.27 시작 화면 복구',
    level: ready ? 'ok' : 'warn',
    message: ready ? lastMessage127 : '복구 미완료',
    hint: `keyart ${TITLE_KEYVISUAL_PUBLIC_127} · repair ${repairCount127} · ${Math.round(lastRepairAt127 || 0)}ms`
  };
}

function ensureTitlePreload127(documentRef: Document) {
  if (documentRef.querySelector('link[data-title-keyart-127="1"]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = TITLE_KEYVISUAL_PUBLIC_127;
  link.setAttribute('data-title-keyart-127', '1');
  documentRef.head.appendChild(link);
}
