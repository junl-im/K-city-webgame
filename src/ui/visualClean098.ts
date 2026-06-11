
type CleanRefs098 = {
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen: HTMLElement;
  gameRoot: HTMLElement;
  startButton: HTMLButtonElement;
  titleAudioButton?: HTMLButtonElement | null;
  closeButtons?: HTMLButtonElement[];
};

export type VisualAudit098 = {
  route: 'title' | 'login' | 'town' | 'field';
  titleReady: boolean;
  titleButtonVisible: boolean;
  townHubReady: boolean;
  legacyVisible: number;
  overflowCount: number;
  message: string;
  level: 'ok' | 'warn';
};

let installed = false;
let refs: CleanRefs098 | null = null;

export function installVisualClean098(nextRefs: CleanRefs098) {
  refs = nextRefs;
  document.body.classList.remove('fantasy-ui-097', 'visual-mass-097', 'route-title-097', 'route-login-097', 'route-town-097', 'route-field-097');
  document.body.classList.add('fantasy-ui-098', 'visual-clean-098', 'mobile-safe-098');
  clearOldRouteClasses098();
  ensureTitleShell098(nextRefs);
  ensureTownHub098(nextRefs.townScreen);
  decorateCloseButtons098(nextRefs.closeButtons || []);
  syncVisualClean098(nextRefs);
  if (!installed) {
    installed = true;
    window.addEventListener('resize', () => refs && syncVisualClean098(refs), { passive: true });
    window.addEventListener('orientationchange', () => refs && window.setTimeout(() => syncVisualClean098(refs!), 80), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && refs) syncVisualClean098(refs);
    });
  }
}

export function syncVisualClean098(nextRefs: CleanRefs098 = refs as CleanRefs098) {
  if (!nextRefs) return;
  ensureTitleShell098(nextRefs);
  ensureTownHub098(nextRefs.townScreen);
  decorateCloseButtons098(nextRefs.closeButtons || []);
  const route = detectRoute098(nextRefs);
  clearOldRouteClasses098();
  document.body.classList.add(`route-${route}-098`);
  document.body.dataset.visualRoute098 = route;
  nextRefs.titleScreen.classList.toggle('title-screen-098', true);
  nextRefs.loginScreen.classList.toggle('login-screen-098', true);
  nextRefs.townScreen.classList.toggle('town-screen-098', true);
  nextRefs.townScreen.toggleAttribute('data-clean-hub-ready', Boolean(nextRefs.townScreen.querySelector('.town-clean-hub-098')));
  const reduce = shouldReduceMotion098();
  document.body.classList.toggle('perf-reduced-motion-098', reduce);
  document.body.classList.toggle('lite-render-098', reduce || localStorageSafeGet098('soul-online-lite-render-091') === '1');
}

export function inspectVisualClean098(nextRefs: CleanRefs098 = refs as CleanRefs098): VisualAudit098 {
  const route = nextRefs ? detectRoute098(nextRefs) : 'title';
  const titleReady = Boolean(nextRefs?.titleScreen.querySelector('.entry-clean-098'));
  const titleButtonVisible = isVisible098(nextRefs?.startButton || null);
  const townHubReady = Boolean(nextRefs?.townScreen.querySelector('.town-clean-hub-098'));
  const legacyVisible = Array.from(document.querySelectorAll<HTMLElement>('.town-game-lobby-070, .town-premium-lobby-072, .town-topbar, .town-layout, .town-bottom-menu'))
    .filter(isVisible098).length;
  const overflowCount = countOverflow098();
  const ok = titleReady && titleButtonVisible && townHubReady && legacyVisible === 0 && overflowCount === 0;
  return {
    route,
    titleReady,
    titleButtonVisible,
    townHubReady,
    legacyVisible,
    overflowCount,
    level: ok ? 'ok' : 'warn',
    message: ok ? '0.98 UI 정상' : `0.98 점검 필요 · legacy ${legacyVisible} · overflow ${overflowCount}`
  };
}

function ensureTitleShell098({ titleScreen, startButton, titleAudioButton }: CleanRefs098) {
  let shell = titleScreen.querySelector<HTMLElement>('.entry-clean-098');
  if (!shell) {
    shell = document.createElement('div');
    shell.className = 'entry-clean-098';
    shell.innerHTML = `
      <div class="entry-brand-098" aria-hidden="true"><span>LUMINA CHRONICLE</span><b>SOUL</b></div>
      <section class="entry-card-098" aria-label="소울 온라인 시작">
        <div class="entry-copy-098"><h1>소울 온라인</h1><p>루미나 대륙의 영혼을 깨우고 모험을 시작하세요.</p></div>
        <div class="entry-actions-098"></div>
      </section>
    `;
    titleScreen.appendChild(shell);
  }
  const actions = shell.querySelector<HTMLElement>('.entry-actions-098');
  if (actions && startButton.parentElement !== actions) actions.prepend(startButton);
  startButton.classList.add('start-game-btn-098');
  startButton.type = 'button';
  startButton.textContent = 'TOUCH TO START';
  startButton.removeAttribute('style');
  startButton.setAttribute('aria-label', '게임 시작');
  if (actions && titleAudioButton && titleAudioButton.parentElement !== actions) actions.appendChild(titleAudioButton);
}

function ensureTownHub098(townScreen: HTMLElement) {
  if (townScreen.querySelector('.town-clean-hub-098')) return;
  const hub = document.createElement('section');
  hub.className = 'town-clean-hub-098';
  hub.setAttribute('aria-label', '루미나 마을 통합 허브');
  hub.innerHTML = `
    <header class="town-clean-top-098">
      <div class="town-clean-brand-098"><i aria-hidden="true"></i><div><span>SOUL ONLINE</span><b>루미나 마을</b></div></div>
      <nav class="town-clean-wallet-098" aria-label="재화 정보">
        <button data-town-content="shop" type="button"><i>G</i><b data-town-lobby-gold>0G</b></button>
        <button data-town-content="shop" type="button"><i>◆</i><b data-town-lobby-gems>0</b></button>
        <button data-zone-id="slime-forest" type="button"><i>羽</i><b data-town-lobby-stamina>120/120</b></button>
      </nav>
    </header>
    <main class="town-clean-main-098">
      <aside class="town-clean-hero-098">
        <div class="town-clean-profile-098">
          <button class="town-clean-portrait-098" data-town-lobby-portrait data-town-content="account" type="button" aria-label="캐릭터 정보"></button>
          <div class="town-clean-identity-098"><span>루미나 원정대</span><b data-town-lobby-name>솔마스터</b><em>Lv.<i data-town-lobby-level>1</i> · 마을 대기</em></div>
        </div>
        <div class="town-clean-bars-098">
          <label>HP <i class="hp"><em data-town-lobby-hp style="width:100%"></em></i><span data-town-lobby-hp-text>0/0</span></label>
          <label>MP <i class="mp"><em data-town-lobby-mp style="width:100%"></em></i><span data-town-lobby-mp-text>0/0</span></label>
          <label>EXP <i class="exp"><em data-town-lobby-exp-mini style="width:0%"></em></i><span>성장</span></label>
        </div>
        <div class="town-clean-quest-098" data-town-lobby-quest-list></div>
      </aside>
      <section class="town-clean-panel-098">
        <div class="town-clean-title-098"><span>LUMINA HUB</span><h1>오늘의 모험 준비</h1><p>사냥터, 장비, 스킬, 카드, 상점까지 한 화면에서 빠르게 이동합니다.</p></div>
        <nav class="town-clean-quick-098" aria-label="마을 빠른 메뉴">
          <button data-town-content="hunt" type="button"><i>⌁</i><b>사냥터</b><span>지역 선택</span></button>
          <button data-town-content="inventory" type="button"><i>▤</i><b>가방</b><span>장비 정비</span></button>
          <button data-town-content="skills" type="button"><i>✦</i><b>스킬</b><span>성장 확인</span></button>
          <button data-town-content="cards" type="button"><i>◆</i><b>카드</b><span>세트 효과</span></button>
          <button data-town-content="story" type="button"><i>★</i><b>스토리</b><span>메인 퀘스트</span></button>
          <button data-town-content="quests" type="button"><i>!</i><b>의뢰</b><span>보상 수령</span></button>
          <button data-town-content="shop" type="button"><i>◈</i><b>상점</b><span>물약/재료</span></button>
          <button data-town-content="boss" type="button"><i>♛</i><b>보스</b><span>레이드</span></button>
          <button data-town-content="account" type="button"><i>◎</i><b>계정</b><span>저장/설정</span></button>
        </nav>
        <button class="town-clean-hunt-098" data-zone-id="slime-forest" type="button">사냥 시작</button>
      </section>
    </main>
    <footer class="town-clean-bottom-098" aria-label="마을 하단 메뉴">
      <button data-town-content="hunt" type="button"><i>⌁</i><b>사냥</b></button>
      <button data-town-content="inventory" type="button"><i>▤</i><b>가방</b></button>
      <button data-town-content="skills" type="button"><i>✦</i><b>스킬</b></button>
      <button data-town-content="cards" type="button"><i>◆</i><b>카드</b></button>
      <button data-town-content="shop" type="button"><i>◈</i><b>상점</b></button>
    </footer>
  `;
  const drawer = townScreen.querySelector('#townContentPanel');
  if (drawer) townScreen.insertBefore(hub, drawer);
  else townScreen.appendChild(hub);
}

function decorateCloseButtons098(buttons: HTMLButtonElement[]) {
  buttons.forEach((button) => {
    button.classList.add('close-crystal-098');
    button.setAttribute('aria-label', button.getAttribute('aria-label') || '닫기');
  });
}

function detectRoute098({ titleScreen, loginScreen, townScreen, gameRoot }: CleanRefs098): VisualAudit098['route'] {
  if (document.body.classList.contains('field-active') || gameRoot.childElementCount > 0) return 'field';
  if (!townScreen.classList.contains('hidden')) return 'town';
  if (!loginScreen.classList.contains('hidden')) return 'login';
  return 'title';
}

function clearOldRouteClasses098() {
  const classes = Array.from(document.body.classList).filter((name) => /^route-(title|login|town|field)-0?\d+/.test(name) || /^route-(title|login|town|field)-098$/.test(name));
  document.body.classList.remove(...classes);
  document.body.classList.remove('fantasy-ui-097', 'visual-mass-097');
  document.body.classList.add('fantasy-ui-098', 'visual-clean-098');
}

function isVisible098(node: Element | null): boolean {
  if (!node) return false;
  const el = node as HTMLElement;
  if (el.classList.contains('hidden')) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

function countOverflow098() {
  const selectors = [
    '.entry-clean-098', '.login-panel', '.town-clean-hub-098', '#townContentPanel:not(.hidden)', '#sheet[aria-hidden="false"]',
    '.hud-top', '.resource-strip', '.target-card', '.field-quest-tracker', '.field-minimap', '.joystick', '.potion-dock', '.skill-dock', '.action-dock'
  ];
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  let count = 0;
  document.querySelectorAll<HTMLElement>(selectors.join(',')).forEach((el) => {
    if (!isVisible098(el)) return;
    const r = el.getBoundingClientRect();
    if (r.left < -2 || r.top < -2 || r.right > vw + 2 || r.bottom > vh + 2) count += 1;
  });
  document.body.classList.toggle('ui-overflow-risk-098', count > 0);
  return count;
}

function shouldReduceMotion098() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || (window.innerWidth <= 390 && window.innerHeight <= 720);
}

function localStorageSafeGet098(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
