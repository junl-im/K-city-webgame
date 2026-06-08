import './styles.css';
import { classes, expToNext, souls } from './data/gameData';
import { SaveService } from './game/SaveService';
import { SolGame } from './game/SolGame';
import { formatNumber } from './game/math';
import type { CharacterClassId, SheetTab, Snapshot } from './types';

const saveService = new SaveService();
let game: SolGame | null = null;
let latest: Snapshot | null = null;
let selectedClass: CharacterClassId = 'warrior';
let activeSheetTab: SheetTab = 'cards';
let sheetOpen = false;

const root = must('#game-root');
const createModal = must('#createModal');
const nameInput = must<HTMLInputElement>('#nameInput');
const startGameBtn = must<HTMLButtonElement>('#startGameBtn');
const joystick = must('#joystick');
const joystickKnob = must('#joystickKnob');
const autoHuntBtn = must<HTMLButtonElement>('#autoHuntBtn');
const attackBtn = must<HTMLButtonElement>('#attackBtn');
const cardsBtn = must<HTMLButtonElement>('#cardsBtn');
const inventoryBtn = must<HTMLButtonElement>('#inventoryBtn');
const openMenu = must<HTMLButtonElement>('#openMenu');
const sheet = must('#sheet');
const closeSheet = must<HTMLButtonElement>('#closeSheet');
const sheetBody = must('#sheetBody');
const sheetTitle = must('#sheetTitle');
const sheetEyebrow = must('#sheetEyebrow');
const toastEl = must('#toast');

boot().catch((error) => {
  console.error(error);
  showToast(error?.message || '게임 초기화 실패');
});

async function boot() {
  await saveService.init();
  const local = saveService.loadLocal();
  const cloud = await tryLoadCloud();
  const save = chooseSave(local, cloud);

  bindCreateModal();
  bindActions();
  bindJoystick();
  bindSheet();

  if (save) await startWithSave(save);
  else openCreateModal();
}

async function tryLoadCloud() {
  try {
    return await saveService.loadCloud();
  } catch (error) {
    console.warn('[Cloud] load failed', error);
    return null;
  }
}

function chooseSave(local: ReturnType<SaveService['loadLocal']>, cloud: Awaited<ReturnType<SaveService['loadCloud']>>) {
  if (local && cloud) return cloud.updatedAt > local.updatedAt ? cloud : local;
  return cloud || local;
}

async function startWithSave(save: NonNullable<ReturnType<typeof chooseSave>>) {
  createModal.classList.remove('open');
  game = new SolGame(saveService.validateSave(save), saveService);
  await game.mount(root);
  game.onSnapshot((snapshot) => {
    latest = snapshot;
    renderHud(snapshot);
    if (sheetOpen) renderSheet();
  });
}

function bindCreateModal() {
  document.querySelectorAll<HTMLButtonElement>('[data-class]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedClass = (button.dataset.class || 'warrior') as CharacterClassId;
      document.querySelectorAll('[data-class]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
    });
  });

  startGameBtn.addEventListener('click', async () => {
    const save = saveService.createSave(nameInput.value, selectedClass);
    saveService.saveLocal(save);
    await startWithSave(save);
  });
}

function bindActions() {
  autoHuntBtn.addEventListener('click', () => {
    if (!game || !latest) return;
    game.setAutoHunt(!latest.save.autoHunt);
  });

  attackBtn.addEventListener('click', () => game?.manualAttack());
  cardsBtn.addEventListener('click', () => openSheet('cards'));
  inventoryBtn.addEventListener('click', () => openSheet('inventory'));
  openMenu.addEventListener('click', () => openSheet('account'));
}

function bindJoystick() {
  let active = false;
  const radius = 34;

  const reset = () => {
    active = false;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    game?.setJoystick(0, 0);
  };

  const update = (clientX: number, clientY: number) => {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const clamped = Math.min(radius, len);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    joystickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    game?.setJoystick(nx / radius, ny / radius);
  };

  joystick.addEventListener('pointerdown', (event) => {
    active = true;
    joystick.setPointerCapture(event.pointerId);
    update(event.clientX, event.clientY);
  });

  joystick.addEventListener('pointermove', (event) => {
    if (active) update(event.clientX, event.clientY);
  });

  joystick.addEventListener('pointerup', reset);
  joystick.addEventListener('pointercancel', reset);
  joystick.addEventListener('lostpointercapture', reset);
}

function bindSheet() {
  closeSheet.addEventListener('click', closeCurrentSheet);
  document.querySelectorAll<HTMLButtonElement>('[data-sheet-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activeSheetTab = (button.dataset.sheetTab || 'cards') as SheetTab;
      document.querySelectorAll('[data-sheet-tab]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      renderSheet();
    });
  });

  sheetBody.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const equip = target.closest<HTMLButtonElement>('[data-equip-card]');
    if (equip) {
      game?.equipCard(equip.dataset.equipCard || '');
      return;
    }

    const action = target.closest<HTMLButtonElement>('[data-account-action]');
    if (!action) return;
    await handleAccountAction(action.dataset.accountAction || '');
  });
}

async function handleAccountAction(action: string) {
  if (!game) return;
  try {
    if (action === 'google') {
      await saveService.loginGoogle();
      await mergeCloudAfterLogin();
      showToast('Google 계정 연결 완료');
    }
    if (action === 'guest') {
      await saveService.loginGuest();
      await mergeCloudAfterLogin();
      showToast('게스트 클라우드 연결 완료');
    }
    if (action === 'save') {
      await game.saveNow();
      showToast('저장 완료');
    }
    if (action === 'logout') {
      await saveService.logout();
      showToast('로그아웃 완료');
    }
  } catch (error) {
    console.warn('[Account]', error);
    showToast(error instanceof Error ? error.message : '계정 처리 실패');
  }
  renderSheet();
}

async function mergeCloudAfterLogin() {
  if (!game) return;
  const cloud = await tryLoadCloud();
  const local = game.getSave();
  if (cloud && cloud.updatedAt > local.updatedAt) game.replaceSave(cloud);
  else await game.saveNow();
}

function renderHud(snapshot: Snapshot) {
  const klass = classes[snapshot.save.classId];
  const hpPercent = `${Math.round((snapshot.save.hp / snapshot.stats.hp) * 100)}%`;
  const expPercent = `${Math.round((snapshot.save.exp / expToNext(snapshot.save.level)) * 100)}%`;

  text('#playerName', snapshot.save.name);
  text('#levelText', `Lv.${snapshot.save.level}`);
  text('#classPortrait', klass.glyph);
  text('#hpText', `${Math.ceil(snapshot.save.hp)}/${snapshot.stats.hp}`);
  text('#expText', `${Math.floor(snapshot.save.exp)}/${expToNext(snapshot.save.level)}`);
  text('#goldText', `${formatNumber(snapshot.save.gold)}G`);
  text('#gemText', `${formatNumber(snapshot.save.gems)}소울`);
  text('#dpsText', `전투력 ${formatNumber(snapshot.power)}`);

  styleWidth('#hpBar', hpPercent);
  styleWidth('#expBar', expPercent);

  autoHuntBtn.classList.toggle('active', snapshot.save.autoHunt);

  if (snapshot.target) {
    text('#targetName', snapshot.target.def.name);
    text('#targetMeta', `Lv.${snapshot.target.def.level} HP ${Math.ceil(snapshot.target.hp)}/${snapshot.target.def.stats.hp}`);
    styleWidth('#targetHp', `${Math.round(snapshot.targetHpPercent * 100)}%`);
  } else {
    text('#targetName', '필드 탐색');
    text('#targetMeta', snapshot.save.autoHunt ? '자동사냥 중' : '대기');
    styleWidth('#targetHp', '0%');
  }

  const log = must('#combatLog');
  log.innerHTML = snapshot.log.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

function openSheet(tab: SheetTab) {
  activeSheetTab = tab;
  sheetOpen = true;
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-sheet-tab]').forEach((item) => {
    item.classList.toggle('active', (item as HTMLElement).dataset.sheetTab === tab);
  });
  renderSheet();
}

function closeCurrentSheet() {
  sheetOpen = false;
  sheet.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
}

function renderSheet() {
  if (!latest || !game) return;
  const titles: Record<SheetTab, [string, string]> = {
    cards: ['SOUL CODEX', '카드 도감'],
    inventory: ['BAG', '장비 가방'],
    souls: ['SOUL LINK', '영혼 링크'],
    account: ['FIREBASE', '계정 저장']
  };
  sheetEyebrow.textContent = titles[activeSheetTab][0];
  sheetTitle.textContent = titles[activeSheetTab][1];

  if (activeSheetTab === 'cards') sheetBody.innerHTML = renderCards(latest);
  if (activeSheetTab === 'inventory') sheetBody.innerHTML = renderInventory(latest);
  if (activeSheetTab === 'souls') sheetBody.innerHTML = renderSouls(latest);
  if (activeSheetTab === 'account') sheetBody.innerHTML = renderAccount(latest);
}

function renderCards(snapshot: Snapshot) {
  if (!game) return '';
  const cardsHtml = snapshot.save.cards
    .flatMap((instance) => {
      const described = game?.describeCard(instance);
      return described ? [described] : [];
    })
    .map(({ def, instance }) => {
      const equipped = instance.equipped;
      return `
        <article class="codex-card ${equipped ? 'equipped' : ''}">
          <img src="${def.art}" alt="${escapeHtml(def.name)}" />
          <div>
            <div class="pill-row">
              <span class="pill">${def.rarity}</span>
              <span class="pill">Lv.${instance.level}</span>
              <span class="pill">x${instance.copies}</span>
            </div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)}</p>
          </div>
          <button data-equip-card="${instance.uid}">${equipped ? '해제' : '장착'}</button>
        </article>
      `;
    })
    .join('');

  return `<div class="card-list">${cardsHtml}</div>`;
}

function renderInventory(snapshot: Snapshot) {
  if (!game) return '';
  const rows = snapshot.save.inventory
    .flatMap((instance) => {
      const described = game?.describeItem(instance);
      return described ? [described] : [];
    })
    .map(({ def, instance }) => {
      return `
        <article class="item-row">
          <div class="pill-row">
            <span class="pill">${def.rarity}</span>
            <span class="pill">${escapeHtml(def.type)}</span>
            <span class="pill">x${instance.count}</span>
          </div>
          <h3>${escapeHtml(def.name)}</h3>
          <p>${escapeHtml(def.effectText)}</p>
        </article>
      `;
    })
    .join('');
  return `<div class="item-list">${rows || '<p class="account-panel">가방이 비었습니다.</p>'}</div>`;
}

function renderSouls(snapshot: Snapshot) {
  const rows = souls
    .map((def) => {
      const instance = snapshot.save.souls.find((entry) => entry.soulId === def.id);
      const progress = instance?.progress || snapshot.save.kills[def.monsterId] || 0;
      const percent = Math.min(100, Math.round((progress / def.requiredKills) * 100));
      return `
        <article class="soul-row">
          <div class="pill-row">
            <span class="pill">${instance?.unlocked ? '해방' : `${progress}/${def.requiredKills}`}</span>
            <span class="pill">${percent}%</span>
          </div>
          <h3>${escapeHtml(def.name)}</h3>
          <p>${escapeHtml(def.effectText)}</p>
          <div class="bar exp"><i style="width:${percent}%"></i><em>${percent}%</em></div>
        </article>
      `;
    })
    .join('');
  return `<div class="soul-list">${rows}</div>`;
}

function renderAccount(snapshot: Snapshot) {
  const stats = snapshot.stats;
  return `
    <div class="account-box">
      <article class="account-panel">
        <div class="pill-row">
          <span class="pill">${snapshot.online ? '온라인' : '로컬'}</span>
          <span class="pill">${escapeHtml(snapshot.userLabel)}</span>
        </div>
        <p>HP ${stats.hp} / MP ${stats.mp} / ATK ${stats.atk} / DEF ${stats.def} / ASPD ${stats.aspd} / CRIT ${Math.round(stats.crit * 100)}%</p>
        <button data-account-action="save">수동 저장</button>
      </article>
      <article class="account-panel">
        <p>Firebase Auth가 켜져 있으면 Google 또는 게스트 클라우드 저장을 사용할 수 있습니다.</p>
        <button data-account-action="google">Google 연결</button>
        <button data-account-action="guest">게스트 클라우드</button>
        <button data-account-action="logout">로그아웃</button>
      </article>
    </div>
  `;
}

function openCreateModal() {
  createModal.classList.add('open');
}

function showToast(message: string) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  window.clearTimeout(Number(toastEl.dataset.timer || 0));
  const timer = window.setTimeout(() => toastEl.classList.remove('show'), 2200);
  toastEl.dataset.timer = String(timer);
}

function text(selector: string, value: string) {
  must(selector).textContent = value;
}

function styleWidth(selector: string, value: string) {
  (must(selector) as HTMLElement).style.width = value;
}

function must<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`${selector} not found`);
  return node;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return map[char];
  });
}
