import './styles.css';
import { cards, classes, expToNext, items, monsters, souls } from './data/gameData';
import { MAX_CHARACTER_SLOTS, SaveService } from './game/SaveService';
import { SolGame } from './game/SolGame';
import { formatNumber, uid } from './game/math';
import type { CardDefinition, CharacterClassId, EquipmentSlot, ItemDefinition, PlayerSave, SheetTab, Snapshot, Stats } from './types';

type FlowStep = 'login' | 'server' | 'character' | 'town';
type TownContentId = 'cards' | 'inventory' | 'shop' | 'boss' | 'account';

const saveService = new SaveService();
let game: SolGame | null = null;
let latest: Snapshot | null = null;
let pendingSave: PlayerSave | null = null;
let characterRoster: PlayerSave[] = [];
let selectedCharacterId = '';
let creatingCharacter = false;
let selectedClass: CharacterClassId = 'warrior';
let selectedServer = 'bearfox';
let combatLogCollapsed = false;
const SERVER_NAME = '곰같은여우 서버';
let activeSheetTab: SheetTab = 'cards';
let activeTownContent: TownContentId = 'cards';
let sheetOpen = false;
let townContentOpen = false;

const root = must('#game-root');
const loginScreen = must('#loginScreen');
const loginStatus = must('#loginStatus');
const guestLoginBtn = must<HTMLButtonElement>('#guestLoginBtn');
const googleLoginBtn = must<HTMLButtonElement>('#googleLoginBtn');
const localLoginBtn = must<HTMLButtonElement>('#localLoginBtn');
const serverNextBtn = must<HTMLButtonElement>('#serverNextBtn');
const characterNextBtn = must<HTMLButtonElement>('#characterNextBtn');
const connectCharacterBtn = must<HTMLButtonElement>('#connectCharacterBtn');
const newCharacterBtn = must<HTMLButtonElement>('#newCharacterBtn');
const deleteCharacterBtn = must<HTMLButtonElement>('#deleteCharacterBtn');
const cancelCreateBtn = must<HTMLButtonElement>('#cancelCreateBtn');
const characterSlotList = must('#characterSlotList');
const characterSlotHelper = must('#characterSlotHelper');
const characterCreatePanel = must('#characterCreatePanel');
const enterTownBtn = must<HTMLButtonElement>('#enterTownBtn');
const nameInput = must<HTMLInputElement>('#nameInput');
const characterSummary = must('#characterSummary');
const worldServerText = must('#worldServerText');
const worldCharacterText = must('#worldCharacterText');
const worldClassText = must('#worldClassText');
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
const townScreen = must('#townScreen');
const townHeroGlyph = must('#townHeroGlyph');
const townHeroName = must('#townHeroName');
const townHeroMeta = must('#townHeroMeta');
const townGoldText = must('#townGoldText');
const townGemText = must('#townGemText');
const townPowerText = must('#townPowerText');
const townFullscreenBtn = must<HTMLButtonElement>('#townFullscreenBtn');
const townSaveBtn = must<HTMLButtonElement>('#townSaveBtn');
const townAccountBtn = must<HTMLButtonElement>('#townAccountBtn');
const returnTownBtn = must<HTMLButtonElement>('#returnTownBtn');
const combatLogToggle = must<HTMLButtonElement>('#combatLogToggle');
const sceneTransition = must('#sceneTransition');
const sceneTransitionLabel = must('#sceneTransitionLabel');
const townContentPanel = must('#townContentPanel');
const townContentTitle = must('#townContentTitle');
const townContentEyebrow = must('#townContentEyebrow');
const townContentBody = must('#townContentBody');
const closeTownContent = must<HTMLButtonElement>('#closeTownContent');

boot().catch((error) => {
  console.error(error);
  showToast(error?.message || '게임 초기화 실패');
});

async function boot() {
  await saveService.init();
  await mergeCloudRosterToLocal();
  pendingSave = saveService.loadLocal();
  refreshCharacterRoster();

  if (pendingSave) {
    selectedClass = pendingSave.classId;
    nameInput.value = pendingSave.name;
    loginStatus.textContent = `${characterRoster.length}개 캐릭터를 찾았습니다.`;
  }

  bindLoginFlow();
  bindActions();
  bindJoystick();
  bindSheet();
  renderCharacterSummary();
  renderCharacterSlots();
  updateWorldSummary();
  goStep('login');
  registerServiceWorker();
}


function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('[PWA] service worker skipped', error));
  });
}

async function tryLoadCloud() {
  try {
    return await saveService.loadCloud();
  } catch (error) {
    console.warn('[Cloud] load failed', error);
    return null;
  }
}

async function tryLoadCloudRoster() {
  try {
    return await saveService.loadCloudRoster();
  } catch (error) {
    console.warn('[Cloud] roster load failed', error);
    return [];
  }
}

async function mergeCloudRosterToLocal() {
  const before = saveService.loadLocal()?.saveId || '';
  const local = saveService.loadLocalRoster();
  const cloudRoster = await tryLoadCloudRoster();
  for (const cloud of cloudRoster) {
    const localCopy = local.find((save) => save.saveId === cloud.saveId);
    if (!localCopy || cloud.updatedAt > localCopy.updatedAt) saveService.saveLocal(cloud);
  }
  if (before) saveService.setActiveSave(before);
}

function bindLoginFlow() {
  document.querySelectorAll<HTMLButtonElement>('[data-flow-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const step = (button.dataset.flowStep || 'login') as FlowStep;
      if (step === 'town' && !pendingSave) return;
      goStep(step);
    });
  });

  guestLoginBtn.addEventListener('click', async () => {
    await runLoginAction(async () => {
      await saveService.loginGuest();
      await mergeCloudRosterToLocal();
      refreshCharacterRoster();
      loginStatus.textContent = '게스트 클라우드로 접속했습니다.';
      goStep('server');
    });
  });

  googleLoginBtn.addEventListener('click', async () => {
    await runLoginAction(async () => {
      await saveService.loginGoogle();
      await mergeCloudRosterToLocal();
      refreshCharacterRoster();
      loginStatus.textContent = 'Google 계정으로 접속했습니다.';
      goStep('server');
    });
  });

  localLoginBtn.addEventListener('click', () => {
    refreshCharacterRoster();
    loginStatus.textContent = '로컬 저장으로 진행합니다.';
    goStep('server');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-server-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedServer = 'bearfox';
      document.querySelectorAll('[data-server-id]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      updateWorldSummary();
    });
  });

  serverNextBtn.addEventListener('click', () => {
    refreshCharacterRoster();
    if (!characterRoster.length) creatingCharacter = true;
    goStep('character');
  });

  characterSlotList.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-character-id]');
    if (!button) return;
    selectedCharacterId = button.dataset.characterId || '';
    const selected = characterRoster.find((save) => save.saveId === selectedCharacterId) || null;
    if (selected) {
      pendingSave = selected;
      selectedClass = selected.classId;
      nameInput.value = selected.name;
      saveService.setActiveSave(selected.saveId);
    }
    creatingCharacter = false;
    renderCharacterSlots();
    updateWorldSummary();
  });

  connectCharacterBtn.addEventListener('click', () => {
    const selected = getSelectedCharacter();
    if (!selected) {
      showToast('접속할 캐릭터를 선택하세요.');
      return;
    }
    pendingSave = saveService.validateSave(selected);
    selectedClass = pendingSave.classId;
    nameInput.value = pendingSave.name;
    saveService.setActiveSave(pendingSave.saveId);
    renderCharacterSlots();
    updateWorldSummary();
    goStep('town');
  });

  newCharacterBtn.addEventListener('click', () => {
    if (characterRoster.length >= MAX_CHARACTER_SLOTS) {
      showToast('캐릭터는 최대 4개까지 생성할 수 있습니다.');
      return;
    }
    creatingCharacter = true;
    nameInput.value = suggestedCharacterName();
    renderCharacterSlots();
    updateWorldSummary();
  });

  deleteCharacterBtn.addEventListener('click', () => {
    const selected = getSelectedCharacter();
    if (!selected) return;
    const ok = window.confirm(`${selected.name} 캐릭터를 삭제할까요? 이 작업은 로컬 저장에서 즉시 삭제됩니다.`);
    if (!ok) return;
    saveService.deleteLocalSave(selected.saveId);
    if (pendingSave?.saveId === selected.saveId) pendingSave = null;
    refreshCharacterRoster();
    showToast('캐릭터를 삭제했습니다.');
    updateWorldSummary();
  });

  cancelCreateBtn.addEventListener('click', () => {
    creatingCharacter = false;
    renderCharacterSlots();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-class]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedClass = (button.dataset.class || 'warrior') as CharacterClassId;
      document.querySelectorAll('[data-class]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      renderCharacterSummary();
      updateWorldSummary();
    });
  });

  nameInput.addEventListener('input', updateWorldSummary);

  characterNextBtn.addEventListener('click', () => {
    if (characterRoster.length >= MAX_CHARACTER_SLOTS) {
      showToast('캐릭터는 최대 4개까지 생성할 수 있습니다.');
      return;
    }
    const name = nameInput.value.trim().slice(0, 12) || suggestedCharacterName();
    const prepared = saveService.createSave(name, selectedClass);
    pendingSave = prepared;
    saveService.saveLocal(prepared);
    refreshCharacterRoster(prepared.saveId);
    creatingCharacter = false;
    renderCharacterSummary();
    updateWorldSummary();
    showToast(`${prepared.name} 캐릭터 생성 완료`);
    goStep('town');
  });

  enterTownBtn.addEventListener('click', async () => {
    void ensureFullscreen();
    if (!pendingSave) pendingSave = getSelectedCharacter();
    if (!pendingSave) {
      showToast('접속할 캐릭터를 먼저 선택하세요.');
      goStep('character');
      return;
    }
    pendingSave = saveService.validateSave(pendingSave);
    saveService.saveLocal(pendingSave);
    await enterTown(pendingSave, '루미나 마을로 이동 중');
    await saveCloudIfAvailable(pendingSave, latest?.power || powerFromSave(pendingSave), false);
  });

  townFullscreenBtn.addEventListener('click', () => {
    void ensureFullscreen(true);
  });

  townSaveBtn.addEventListener('click', async () => {
    if (!pendingSave) return;
    saveService.saveLocal(pendingSave);
    const cloudOk = await saveCloudIfAvailable(pendingSave, latest?.power || powerFromSave(pendingSave), true);
    refreshCharacterRoster(pendingSave.saveId);
    showToast(cloudOk === false ? '로컬 저장 완료 · 클라우드 동기화 보류' : '마을 저장 완료');
  });

  townAccountBtn.addEventListener('click', () => openTownContent('account'));

  document.querySelectorAll<HTMLButtonElement>('[data-zone-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      void ensureFullscreen();
      document.querySelectorAll('[data-zone-id]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const zoneId = button.dataset.zoneId || 'slime-forest';
      if (!pendingSave) pendingSave = getSelectedCharacter();
      if (!pendingSave) {
        showToast('사냥터에 입장할 캐릭터를 선택하세요.');
        goStep('character');
        return;
      }
      await startField(pendingSave, zoneId);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-town-content]').forEach((button) => {
    button.addEventListener('click', () => openTownContent((button.dataset.townContent || 'cards') as TownContentId));
  });

  closeTownContent.addEventListener('click', closeTownContentPanel);
  townContentBody.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const equipCard = target.closest<HTMLButtonElement>('[data-town-equip-card]');
    if (equipCard) {
      toggleTownCard(equipCard.dataset.townEquipCard || '');
      return;
    }

    const equipItem = target.closest<HTMLButtonElement>('[data-town-equip-item]');
    if (equipItem) {
      toggleTownItem(equipItem.dataset.townEquipItem || '');
      return;
    }

    const buyItem = target.closest<HTMLButtonElement>('[data-town-shop-buy]');
    if (buyItem) {
      buyTownShopItem(buyItem.dataset.townShopBuy || '');
      return;
    }

    const zone = target.closest<HTMLButtonElement>('[data-town-zone-enter]');
    if (zone && pendingSave) {
      closeTownContentPanel();
      await startField(pendingSave, zone.dataset.townZoneEnter || 'crystal-raid');
      return;
    }

    const account = target.closest<HTMLButtonElement>('[data-town-account-action]');
    if (account) await handleTownAccountAction(account.dataset.townAccountAction || '');
  });
}

async function runLoginAction(action: () => Promise<void>) {
  setLoginButtons(false);
  try {
    await action();
  } catch (error) {
    console.warn('[Login]', error);
    loginStatus.textContent = error instanceof Error ? error.message : '로그인 실패';
  } finally {
    setLoginButtons(true);
  }
}

function setLoginButtons(enabled: boolean) {
  guestLoginBtn.disabled = !enabled;
  googleLoginBtn.disabled = !enabled;
  localLoginBtn.disabled = !enabled;
}

function goStep(step: FlowStep) {
  if (step === 'character') refreshCharacterRoster(selectedCharacterId);
  document.querySelectorAll('[data-flow-step]').forEach((button) => {
    button.classList.toggle('active', (button as HTMLElement).dataset.flowStep === step);
  });
  document.querySelectorAll('[data-flow-page]').forEach((page) => {
    page.classList.toggle('active', (page as HTMLElement).dataset.flowPage === step);
  });
  renderCharacterSummary();
  renderCharacterSlots();
  updateWorldSummary();
}

function refreshCharacterRoster(preferredSaveId = selectedCharacterId) {
  characterRoster = saveService.loadLocalRoster();
  const preferred = characterRoster.find((save) => save.saveId === preferredSaveId);
  const active = saveService.loadLocal();
  const selected = preferred || (active ? characterRoster.find((save) => save.saveId === active.saveId) : null) || characterRoster[0] || null;
  selectedCharacterId = selected?.saveId || '';
  pendingSave = selected || null;
  if (selected) {
    selectedClass = selected.classId;
    nameInput.value = selected.name;
  } else {
    creatingCharacter = true;
  }
  renderCharacterSlots();
}

function getSelectedCharacter() {
  return characterRoster.find((save) => save.saveId === selectedCharacterId) || null;
}

function suggestedCharacterName() {
  return `솔마스터${characterRoster.length + 1}`.slice(0, 12);
}

async function enterTown(save: PlayerSave, label = '마을로 이동 중') {
  await withSceneTransition(label, async () => {
    if (game) {
      const fieldSave = game.getSave();
      saveService.saveLocal(fieldSave);
      game.destroy();
      game = null;
      pendingSave = fieldSave;
    } else {
      pendingSave = saveService.validateSave(save);
    }

    closeCurrentSheet();
    root.replaceChildren();
    loginScreen.classList.add('hidden');
    townScreen.classList.remove('hidden');
    townScreen.setAttribute('aria-hidden', 'false');
    document.body.classList.remove('field-active');
    document.body.classList.add('town-active');
    renderTown(pendingSave);
  });
}

async function startField(save: PlayerSave, zoneId = 'slime-forest') {
  const zoneName = zoneTitle(zoneId);
  await withSceneTransition(`${zoneName} 입장 중`, async () => {
    const prepared = saveService.validateSave(save);
    pendingSave = prepared;
    saveService.saveLocal(prepared);
    townScreen.classList.add('hidden');
    townScreen.setAttribute('aria-hidden', 'true');
    loginScreen.classList.add('hidden');
    document.body.classList.remove('town-active');
    document.body.classList.add('field-active');

    if (game) game.destroy();
    game = new SolGame(prepared, saveService, { zoneName });
    await game.mount(root);
    game.onSnapshot((snapshot) => {
      latest = snapshot;
      pendingSave = snapshot.save;
      renderHud(snapshot);
      if (sheetOpen) renderSheet();
    });
  });
}

async function returnToTown() {
  if (!game) return;
  const save = game.getSave();
  await game.saveNow();
  await enterTown(save, '마을로 복귀 중');
  refreshCharacterRoster(save.saveId);
  showToast('루미나 마을로 복귀했습니다.');
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
  returnTownBtn.addEventListener('click', () => {
    void returnToTown();
  });
  combatLogToggle.addEventListener('click', () => {
    combatLogCollapsed = !combatLogCollapsed;
    document.body.classList.toggle('combat-log-collapsed', combatLogCollapsed);
    combatLogToggle.textContent = combatLogCollapsed ? '기록 열기' : '기록 접기';
  });
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

    const equipItem = target.closest<HTMLButtonElement>('[data-equip-item]');
    if (equipItem) {
      game?.equipItem(equipItem.dataset.equipItem || '');
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
    text('#targetName', '마을');
    text('#targetMeta', snapshot.save.autoHunt ? '자동사냥 탐색 중' : '정비 중');
    styleWidth('#targetHp', '0%');
  }

  const log = must('#combatLog');
  log.innerHTML = snapshot.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
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
      const slot = def.type as EquipmentSlot;
      const canEquip = def.type !== 'material';
      const equipped = canEquip && snapshot.save.equipment?.[slot] === instance.uid;
      const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료' };
      return `
        <article class="item-row ${equipped ? 'equipped' : ''}">
          <div class="item-info">
            <div class="pill-row">
              <span class="pill">${def.rarity}</span>
              <span class="pill">${typeLabel[def.type] || escapeHtml(def.type)}</span>
              <span class="pill">x${instance.count}</span>
              ${equipped ? '<span class="pill">장착중</span>' : ''}
            </div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)}</p>
          </div>
          ${canEquip ? `<button data-equip-item="${instance.uid}">${equipped ? '해제' : '장착'}</button>` : ''}
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
  const klass = classes[snapshot.save.classId];
  return `
    <div class="account-box">
      <article class="account-panel">
        <div class="pill-row">
          <span class="pill">${snapshot.online ? '온라인' : '로컬'}</span>
          <span class="pill">${escapeHtml(snapshot.userLabel)}</span>
          <span class="pill">${escapeHtml(klass.skillName)}</span>
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

function renderCharacterSummary() {
  const klass = classes[selectedClass];
  characterSummary.innerHTML = `
    <b>${escapeHtml(klass.name)} · ${escapeHtml(klass.roleText)}</b><br />
    ${escapeHtml(klass.description)}<br />
    스킬: ${escapeHtml(klass.skillName)} · 사거리 ${klass.attackRange.toFixed(1)}
  `;
}

function renderCharacterSlots() {
  const selected = getSelectedCharacter();
  characterSlotHelper.textContent = characterRoster.length
    ? `${characterRoster.length}/${MAX_CHARACTER_SLOTS} 슬롯 사용 중 · 선택 후 접속하세요.`
    : '아직 생성된 캐릭터가 없습니다. 첫 캐릭터를 생성하세요.';

  characterSlotList.innerHTML = characterRoster.length
    ? characterRoster
        .map((save) => {
          const klass = classes[save.classId];
          const active = save.saveId === selectedCharacterId;
          const date = new Date(save.updatedAt || save.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
          return `
            <button class="character-slot ${active ? 'active' : ''}" data-character-id="${save.saveId}">
              <span class="slot-glyph">${escapeHtml(klass.glyph)}</span>
              <span class="slot-main">
                <b>${escapeHtml(save.name)}</b>
                <em>Lv.${save.level} · ${escapeHtml(klass.name)} · ${formatNumber(save.gold)}G</em>
              </span>
              <span class="slot-date">${date}</span>
            </button>
          `;
        })
        .join('')
    : '<div class="empty-slot">빈 슬롯 · 최대 4개까지 생성 가능</div>';

  characterCreatePanel.classList.toggle('hidden', !creatingCharacter);
  connectCharacterBtn.disabled = !selected;
  deleteCharacterBtn.disabled = !selected;
  newCharacterBtn.disabled = characterRoster.length >= MAX_CHARACTER_SLOTS;
  newCharacterBtn.textContent = characterRoster.length >= MAX_CHARACTER_SLOTS ? '슬롯 가득참' : '캐릭터 생성';
}

function updateWorldSummary() {
  const selected = getSelectedCharacter();
  const classId = creatingCharacter ? selectedClass : selected?.classId || pendingSave?.classId || selectedClass;
  const klass = classes[classId];
  worldServerText.textContent = selectedServer === 'bearfox' ? SERVER_NAME : SERVER_NAME;
  worldCharacterText.textContent = creatingCharacter
    ? nameInput.value.trim() || suggestedCharacterName()
    : selected?.name || pendingSave?.name || '캐릭터 선택 필요';
  worldClassText.textContent = `${klass.name} · ${klass.roleText}`;
}
function renderTown(save: PlayerSave | null) {
  if (!save) return;
  const klass = classes[save.classId];
  townHeroGlyph.textContent = klass.glyph;
  townHeroName.textContent = save.name;
  townHeroMeta.textContent = `Lv.${save.level} · ${klass.name} · ${klass.roleText}`;
  townGoldText.textContent = `${formatNumber(save.gold)}G`;
  townGemText.textContent = `${formatNumber(save.gems)}소울`;
  townPowerText.textContent = `전투력 ${formatNumber(powerFromSave(save))}`;
  if (townContentOpen) renderTownContent();
}

function zoneTitle(zoneId: string) {
  const names: Record<string, string> = {
    'slime-forest': '초록 숲 입구',
    'goblin-road': '고블린 길목',
    'crystal-raid': '수정 레이드 터'
  };
  return names[zoneId] || '사냥터';
}

function openTownContent(content: TownContentId) {
  activeTownContent = content;
  townContentOpen = true;
  townContentPanel.classList.remove('hidden');
  townContentPanel.setAttribute('aria-hidden', 'false');
  renderTownContent();
}

function closeTownContentPanel() {
  townContentOpen = false;
  townContentPanel.classList.add('hidden');
  townContentPanel.setAttribute('aria-hidden', 'true');
}

function renderTownContent() {
  if (!pendingSave) return;
  const titles: Record<TownContentId, [string, string]> = {
    cards: ['SOUL CODEX', '카드 도감'],
    inventory: ['BAG', '장비 가방'],
    shop: ['MERCHANT', '루미나 상점'],
    boss: ['RAID', '월드 보스'],
    account: ['ACCOUNT', '계정/저장']
  };
  townContentEyebrow.textContent = titles[activeTownContent][0];
  townContentTitle.textContent = titles[activeTownContent][1];
  if (activeTownContent === 'cards') townContentBody.innerHTML = renderTownCards(pendingSave);
  if (activeTownContent === 'inventory') townContentBody.innerHTML = renderTownInventory(pendingSave);
  if (activeTownContent === 'shop') townContentBody.innerHTML = renderTownShop(pendingSave);
  if (activeTownContent === 'boss') townContentBody.innerHTML = renderTownBoss(pendingSave);
  if (activeTownContent === 'account') townContentBody.innerHTML = renderTownAccount(pendingSave);
}

function renderTownCards(save: PlayerSave) {
  const equippedCount = save.cards.filter((card) => card.equipped).length;
  const rows = save.cards
    .flatMap((instance) => {
      const def = cards.find((card) => card.id === instance.cardId);
      return def ? [{ def, instance }] : [];
    })
    .map(({ def, instance }) => {
      const equipped = instance.equipped;
      return `
        <article class="codex-card town-manage-card ${equipped ? 'equipped' : ''}">
          <img src="${def.art}" alt="${escapeHtml(def.name)}" />
          <div>
            <div class="pill-row">
              <span class="pill">${def.rarity}</span>
              <span class="pill">Lv.${instance.level}</span>
              <span class="pill">x${instance.copies}</span>
              ${equipped ? '<span class="pill">장착중</span>' : ''}
            </div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)} · 장착 ${equippedCount}/4</p>
          </div>
          <button data-town-equip-card="${instance.uid}">${equipped ? '해제' : '장착'}</button>
        </article>
      `;
    })
    .join('');

  return `
    <div class="town-content-note">카드는 최대 4장까지 장착됩니다. 최소 1장은 유지해야 합니다.</div>
    <div class="card-list">${rows || '<p class="account-panel">보유 카드가 없습니다.</p>'}</div>
  `;
}

function renderTownInventory(save: PlayerSave) {
  const stats = calculateStatsFromSave(save);
  const rows = save.inventory
    .flatMap((instance) => {
      const def = items.find((item) => item.id === instance.itemId);
      return def ? [{ def, instance }] : [];
    })
    .map(({ def, instance }) => renderTownInventoryRow(save, def, instance.uid, instance.count))
    .join('');

  return `
    <div class="town-stat-grid">
      <span>HP <b>${stats.hp}</b></span>
      <span>MP <b>${stats.mp}</b></span>
      <span>ATK <b>${stats.atk}</b></span>
      <span>DEF <b>${stats.def}</b></span>
      <span>ASPD <b>${stats.aspd}</b></span>
      <span>CRIT <b>${Math.round(stats.crit * 100)}%</b></span>
    </div>
    <div class="item-list">${rows || '<p class="account-panel">가방이 비었습니다.</p>'}</div>
  `;
}

function renderTownInventoryRow(save: PlayerSave, def: ItemDefinition, uidValue: string, count: number) {
  const slot = def.type as EquipmentSlot;
  const canEquip = def.type !== 'material';
  const equipped = canEquip && save.equipment?.[slot] === uidValue;
  const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료' };
  return `
    <article class="item-row ${equipped ? 'equipped' : ''}">
      <div class="item-info">
        <div class="pill-row">
          <span class="pill">${def.rarity}</span>
          <span class="pill">${typeLabel[def.type] || escapeHtml(def.type)}</span>
          <span class="pill">x${count}</span>
          ${equipped ? '<span class="pill">장착중</span>' : ''}
        </div>
        <h3>${escapeHtml(def.name)}</h3>
        <p>${escapeHtml(def.effectText)}</p>
      </div>
      ${canEquip ? `<button data-town-equip-item="${uidValue}">${equipped ? '해제' : '장착'}</button>` : ''}
    </article>
  `;
}

function renderTownShop(save: PlayerSave) {
  const stock: Array<{ itemId: string; price: number; label: string }> = [
    { itemId: 'iron-sword', price: 140, label: '초반 무기 보강' },
    { itemId: 'leather-armor', price: 120, label: '생존력 보강' },
    { itemId: 'fox-charm', price: 240, label: '유물 슬롯 개방' },
    { itemId: 'soul-shard', price: 80, label: '카드 합성 재료' }
  ];
  const rows = stock
    .flatMap((entry) => {
      const def = items.find((item) => item.id === entry.itemId);
      return def ? [{ ...entry, def }] : [];
    })
    .map(({ def, price, label }) => {
      const disabled = save.gold < price ? 'disabled' : '';
      return `
        <article class="shop-row">
          <div>
            <div class="pill-row"><span class="pill">${def.rarity}</span><span class="pill">${label}</span></div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)} · 가격 ${formatNumber(price)}G</p>
          </div>
          <button ${disabled} data-town-shop-buy="${def.id}">${save.gold < price ? '골드 부족' : '구매'}</button>
        </article>
      `;
    })
    .join('');
  return `
    <div class="town-content-note">보유 골드 ${formatNumber(save.gold)}G · 구매 즉시 로컬 저장됩니다.</div>
    <div class="shop-list">${rows}</div>
  `;
}

function renderTownBoss(save: PlayerSave) {
  const dragon = monsters.find((monster) => monster.id === 'dragon');
  const bear = monsters.find((monster) => monster.id === 'crystalBear');
  return `
    <div class="boss-panel">
      <div class="boss-emblem">DRAGON</div>
      <div>
        <div class="pill-row">
          <span class="pill">권장 Lv.8+</span>
          <span class="pill">보스 ${dragon ? `Lv.${dragon.level}` : '준비중'}</span>
          <span class="pill">내 Lv.${save.level}</span>
        </div>
        <h3>${dragon ? escapeHtml(dragon.name) : '저녁 레이드 드래곤'}</h3>
        <p>수정 레이드 터에서 드래곤과 흑수정 곰이 등장합니다. 현재는 솔로 입장형 보스 테스트이며, 추후 시간표/기여도/랭킹 보상으로 확장합니다.</p>
        ${dragon ? `<p>보상: ${formatNumber(dragon.gold)}G, ${dragon.exp}EXP, 소울젬/SSR 카드 확률 드랍</p>` : ''}
        ${bear ? `<p>중간 보스: ${escapeHtml(bear.name)} · Lv.${bear.level}</p>` : ''}
        <button class="wide-action primary" data-town-zone-enter="crystal-raid">수정 레이드 터 입장</button>
      </div>
    </div>
  `;
}

function renderTownAccount(save: PlayerSave) {
  const online = saveService.isOnline();
  const cloud = saveService.getCloudWriteStatus();
  return `
    <div class="account-box">
      <article class="account-panel">
        <div class="pill-row">
          <span class="pill">${online ? '온라인' : '로컬'}</span>
          <span class="pill">${escapeHtml(saveService.userLabel())}</span>
          <span class="pill">슬롯 ${characterRoster.length}/${MAX_CHARACTER_SLOTS}</span>
          ${cloud.paused ? '<span class="pill">클라우드 보류</span>' : ''}
        </div>
        <p>클라우드 저장이 실패해도 로컬 저장은 계속 유지됩니다. Firestore 규칙/프로젝트 설정이 막혀 있으면 자동 동기화만 조용히 보류됩니다.</p>
        ${cloud.lastError ? `<p>최근 클라우드 오류: ${escapeHtml(cloud.lastError)}</p>` : ''}
        <button data-town-account-action="save">수동 저장</button>
      </article>
    </div>
  `;
}

function toggleTownCard(cardUid: string) {
  if (!pendingSave) return;
  const card = pendingSave.cards.find((item) => item.uid === cardUid);
  if (!card) return;
  const equippedCount = pendingSave.cards.filter((item) => item.equipped).length;
  if (card.equipped) {
    if (equippedCount <= 1) {
      showToast('카드는 최소 1장 장착해야 합니다.');
      return;
    }
    card.equipped = false;
  } else {
    if (equippedCount >= 4) {
      showToast('장착 카드는 최대 4장입니다.');
      return;
    }
    card.equipped = true;
  }
  persistTownSave();
  showToast(card.equipped ? '카드를 장착했습니다.' : '카드를 해제했습니다.');
}

function toggleTownItem(itemUid: string) {
  if (!pendingSave) return;
  const entry = pendingSave.inventory.find((item) => item.uid === itemUid);
  if (!entry) return;
  const def = items.find((item) => item.id === entry.itemId);
  if (!def || def.type === 'material') {
    showToast('재료 아이템은 장착할 수 없습니다.');
    return;
  }
  const slot = def.type as EquipmentSlot;
  pendingSave.equipment ||= {};
  if (pendingSave.equipment[slot] === entry.uid) {
    delete pendingSave.equipment[slot];
    showToast(`${def.name} 장착 해제`);
  } else {
    pendingSave.equipment[slot] = entry.uid;
    showToast(`${def.name} 장착`);
  }
  repairTownVitals(pendingSave);
  persistTownSave();
}

function buyTownShopItem(itemId: string) {
  if (!pendingSave) return;
  const stock: Record<string, number> = {
    'iron-sword': 140,
    'leather-armor': 120,
    'fox-charm': 240,
    'soul-shard': 80
  };
  const price = stock[itemId];
  const def = items.find((item) => item.id === itemId);
  if (!price || !def) return;
  if (pendingSave.gold < price) {
    showToast('골드가 부족합니다.');
    return;
  }
  pendingSave.gold -= price;
  addInventoryItem(pendingSave, itemId);
  persistTownSave();
  showToast(`${def.name} 구매 완료`);
}

function persistTownSave() {
  if (!pendingSave) return;
  pendingSave.updatedAt = Date.now();
  saveService.saveLocal(pendingSave);
  refreshCharacterRoster(pendingSave.saveId);
  renderTown(pendingSave);
  renderTownContent();
}

function addInventoryItem(save: PlayerSave, itemId: string) {
  const found = save.inventory.find((item) => item.itemId === itemId);
  if (found) found.count += 1;
  else save.inventory.push({ uid: uid('item'), itemId, count: 1 });
}

function repairTownVitals(save: PlayerSave) {
  const stats = calculateStatsFromSave(save);
  save.hp = Math.min(stats.hp, Math.max(1, save.hp));
  save.mp = Math.min(stats.mp, Math.max(0, save.mp));
}

function calculateStatsFromSave(save: PlayerSave): Stats {
  const base = classes[save.classId].baseStats;
  const stats: Stats = {
    hp: base.hp + (save.level - 1) * 22,
    mp: base.mp + (save.level - 1) * 7,
    atk: base.atk + (save.level - 1) * 4,
    def: base.def + (save.level - 1) * 2,
    aspd: base.aspd,
    crit: base.crit,
    move: base.move
  };

  for (const instance of save.cards.filter((card) => card.equipped)) {
    const def = cards.find((card) => card.id === instance.cardId);
    if (!def) continue;
    applyTownBonus(stats, def.bonus, 1 + (instance.level - 1) * 0.34);
  }

  const equippedItemIds = new Set(Object.values(save.equipment || {}));
  for (const entry of save.inventory) {
    if (!equippedItemIds.has(entry.uid)) continue;
    const def = items.find((item) => item.id === entry.itemId);
    if (!def || def.type === 'material') continue;
    applyTownBonus(stats, def.bonus, 1);
  }

  for (const entry of save.souls.filter((soul) => soul.unlocked)) {
    const def = souls.find((soul) => soul.id === entry.soulId);
    if (!def) continue;
    applyTownBonus(stats, def.bonus, 1);
  }

  stats.hp = Math.round(stats.hp);
  stats.mp = Math.round(stats.mp);
  stats.atk = Math.round(stats.atk);
  stats.def = Math.round(stats.def);
  stats.aspd = Number(stats.aspd.toFixed(2));
  stats.crit = Number(stats.crit.toFixed(3));
  stats.move = Number(stats.move.toFixed(2));
  return stats;
}

function applyTownBonus(stats: Stats, bonus: Partial<Stats>, scalar: number) {
  for (const [key, value] of Object.entries(bonus) as [keyof Stats, number][]) stats[key] += value * scalar;
}

function powerFromSave(save: PlayerSave) {
  const stats = calculateStatsFromSave(save);
  return Math.round(stats.hp * 0.42 + stats.mp * 0.12 + stats.atk * 9.5 + stats.def * 6.2 + stats.aspd * 70 + stats.crit * 520);
}

async function saveCloudIfAvailable(save: PlayerSave, power: number, explicit: boolean) {
  if (!saveService.isOnline()) return null;
  try {
    const saved = await saveService.saveCloud(save, power);
    if (!saved && explicit) showToast('로컬 저장 완료 · 클라우드 동기화 보류');
    return saved;
  } catch (error) {
    console.warn('[Cloud] save deferred', error);
    if (explicit) showToast('로컬 저장 완료 · 클라우드 동기화 보류');
    return false;
  }
}

async function handleTownAccountAction(action: string) {
  if (!pendingSave) return;
  if (action === 'save') {
    saveService.saveLocal(pendingSave);
    const cloudOk = await saveCloudIfAvailable(pendingSave, powerFromSave(pendingSave), true);
    refreshCharacterRoster(pendingSave.saveId);
    renderTown(pendingSave);
    showToast(cloudOk === false ? '로컬 저장 완료 · 클라우드 동기화 보류' : '저장 완료');
  }
}

async function ensureFullscreen(forceToast = false) {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
  };
  const rootEl = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };

  if (document.fullscreenElement || doc.webkitFullscreenElement) return;
  try {
    if (document.fullscreenEnabled && rootEl.requestFullscreen) await rootEl.requestFullscreen();
    else if (rootEl.webkitRequestFullscreen) await rootEl.webkitRequestFullscreen();
    else if (forceToast) showToast('이 브라우저는 자동 전체화면을 지원하지 않습니다. 홈 화면에 설치하면 주소창 없는 실행이 가능합니다.');
  } catch (error) {
    if (forceToast) showToast('브라우저 정책상 버튼 터치 후에만 전체화면 전환이 가능합니다.');
    console.warn('[Fullscreen]', error);
  }
}

async function withSceneTransition(label: string, action: () => Promise<void> | void) {
  sceneTransitionLabel.textContent = label;
  sceneTransition.classList.add('show');
  await delay(140);
  await action();
  await delay(220);
  sceneTransition.classList.remove('show');
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
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
