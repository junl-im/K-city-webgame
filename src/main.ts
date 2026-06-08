import './styles.css';
import { MAX_ENHANCE_LEVEL, cardSets, cards, classes, dailyQuests, enhancementCost, expToNext, items, monsters, skills, souls, storyQuests, zones } from './data/gameData';
import { MAX_CHARACTER_SLOTS, SaveService } from './game/SaveService';
import { SolGame } from './game/SolGame';
import { formatNumber, uid } from './game/math';
import type { CardDefinition, CharacterClassId, EquipmentSlot, ItemDefinition, PlayerSave, SheetTab, Snapshot, Stats } from './types';

type FlowStep = 'login' | 'server' | 'character' | 'town';
type TownContentId = 'story' | 'cards' | 'inventory' | 'skills' | 'shop' | 'boss' | 'quests' | 'account';

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
let activeTownContent: TownContentId = 'story';
let sheetOpen = false;
let townContentOpen = false;

const root = must('#game-root');
const titleScreen = must('#titleScreen');
const startGameBtn = must<HTMLButtonElement>('#startGameBtn');
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
const skillDockButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-skill-slot]'));
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
const townChapterText = must('#townChapterText');
const townStoryTitle = must('#townStoryTitle');
const townStoryDesc = must('#townStoryDesc');
const townStoryProgress = must<HTMLElement>('#townStoryProgress');
const townStoryProgressText = must('#townStoryProgressText');
const townStoryActionBtn = must<HTMLButtonElement>('#townStoryActionBtn');
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

  bindTitleFlow();
  bindLoginFlow();
  bindActions();
  bindJoystick();
  bindSheet();
  renderCharacterSummary();
  renderCharacterSlots();
  updateWorldSummary();
  goStep('login');
  titleScreen.classList.remove('hidden');
  loginScreen.classList.add('hidden');
  registerServiceWorker();
}



function bindTitleFlow() {
  startGameBtn.addEventListener('click', async () => {
    void ensureFullscreen();
    void lockPortraitMode();
    await withSceneTransition('접속 화면 준비 중', async () => {
      titleScreen.classList.add('hidden');
      loginScreen.classList.remove('hidden');
      loginScreen.setAttribute('aria-hidden', 'false');
      goStep('login');
    });
  });
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
    void lockPortraitMode();
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
  townStoryActionBtn.addEventListener('click', async () => {
    await handleStoryAction();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-zone-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      void ensureFullscreen();
      void lockPortraitMode();
      document.querySelectorAll('[data-zone-id]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const zoneId = button.dataset.zoneId || 'slime-forest';
      if (!pendingSave) pendingSave = getSelectedCharacter();
      if (pendingSave && !isZoneUnlocked(pendingSave, zoneId)) {
        showToast('아직 해금되지 않은 사냥터입니다. 스토리 또는 레벨 조건을 확인하세요.');
        updateZoneLocks(pendingSave);
        return;
      }
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

    const upgradeTown = target.closest<HTMLButtonElement>('[data-town-upgrade-item]');
    if (upgradeTown) {
      upgradeTownItem(upgradeTown.dataset.townUpgradeItem || '');
      return;
    }

    const buyItem = target.closest<HTMLButtonElement>('[data-town-shop-buy]');
    if (buyItem) {
      buyTownShopItem(buyItem.dataset.townShopBuy || '');
      return;
    }

    const claimQuest = target.closest<HTMLButtonElement>('[data-town-claim-quest]');
    if (claimQuest) {
      claimDailyQuest(claimQuest.dataset.townClaimQuest || '');
      return;
    }

    const story = target.closest<HTMLButtonElement>('[data-town-story-action]');
    if (story) {
      await handleStoryAction();
      return;
    }

    const zone = target.closest<HTMLButtonElement>('[data-town-zone-enter]');
    if (zone && pendingSave) {
      const zoneId = zone.dataset.townZoneEnter || 'crystal-raid';
      if (!isZoneUnlocked(pendingSave, zoneId)) {
        showToast('아직 해금되지 않은 사냥터입니다.');
        return;
      }
      closeTownContentPanel();
      await startField(pendingSave, zoneId);
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
  document.querySelectorAll('[data-flow-indicator]').forEach((indicator) => {
    indicator.classList.toggle('active', (indicator as HTMLElement).dataset.flowIndicator === step);
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
    titleScreen.classList.add('hidden');
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
    const entry = zoneEntryPoint(zoneId);
    prepared.x = entry.x;
    prepared.y = entry.y;
    pendingSave = prepared;
    saveService.saveLocal(prepared);
    townScreen.classList.add('hidden');
    townScreen.setAttribute('aria-hidden', 'true');
    titleScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    document.body.classList.remove('town-active');
    document.body.classList.add('field-active');

    if (game) game.destroy();
    game = new SolGame(prepared, saveService, { zoneId, zoneName });
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
  for (const button of skillDockButtons) {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.skillSlot || 0);
      game?.useSkill(slot);
    });
  }
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

    const upgradeItem = target.closest<HTMLButtonElement>('[data-upgrade-item]');
    if (upgradeItem) {
      game?.upgradeItem(upgradeItem.dataset.upgradeItem || '');
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
  setClassArt(must('#classPortrait'), snapshot.save.classId);
  text('#hpText', `${Math.ceil(snapshot.save.hp)}/${snapshot.stats.hp}`);
  text('#expText', `${Math.floor(snapshot.save.exp)}/${expToNext(snapshot.save.level)}`);
  text('#goldText', `${formatNumber(snapshot.save.gold)}G`);
  text('#gemText', `${formatNumber(snapshot.save.gems)}소울`);
  text('#dpsText', `전투력 ${formatNumber(snapshot.power)}`);

  styleWidth('#hpBar', hpPercent);
  styleWidth('#expBar', expPercent);

  autoHuntBtn.classList.toggle('active', snapshot.save.autoHunt);
  renderSkillDock(snapshot);

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
    skills: ['SOUL SKILL', '스킬 슬롯'],
    souls: ['SOUL LINK', '영혼 링크'],
    account: ['FIREBASE', '계정 저장']
  };
  sheetEyebrow.textContent = titles[activeSheetTab][0];
  sheetTitle.textContent = titles[activeSheetTab][1];

  if (activeSheetTab === 'cards') sheetBody.innerHTML = renderCards(latest);
  if (activeSheetTab === 'inventory') sheetBody.innerHTML = renderInventory(latest);
  if (activeSheetTab === 'skills') sheetBody.innerHTML = renderSkills(latest);
  if (activeSheetTab === 'souls') sheetBody.innerHTML = renderSouls(latest);
  if (activeSheetTab === 'account') sheetBody.innerHTML = renderAccount(latest);
}

function renderCards(snapshot: Snapshot) {
  if (!game) return '';
  const cardCells = snapshot.save.cards
    .flatMap((instance) => {
      const described = game?.describeCard(instance);
      return described ? [described] : [];
    })
    .map(({ def, instance }) => renderCardSlot(def, instance, 'data-equip-card'));

  return `
    <div class="slot-toolbar">
      <span>카드 슬롯 3x3 · 장착 ${snapshot.save.cards.filter((card) => card.equipped).length}/4</span>
      <em>세트 효과 ${snapshot.cardSetEffects.length}개 발동 중</em>
    </div>
    <div class="slot-grid card-slot-grid">${fillSlots(cardCells, 9, '빈 카드 슬롯')}</div>
    ${renderCardSetSummary(snapshot.save)}
  `;
}

function renderInventory(snapshot: Snapshot) {
  if (!game) return '';
  const itemCells = snapshot.save.inventory
    .flatMap((instance) => {
      const described = game?.describeItem(instance);
      return described ? [described] : [];
    })
    .map(({ def, instance }) => renderItemSlot(snapshot.save, def, instance.uid, instance.count, 'data-equip-item', 'data-upgrade-item'));

  return `
    <div class="slot-toolbar">
      <span>인벤토리 5x9 · ${snapshot.save.inventory.length}/45</span>
      <em>무기/방어구/유물은 슬롯에서 바로 장착 가능합니다.</em>
    </div>
    <div class="slot-grid inventory-slot-grid">${fillSlots(itemCells, 45, '빈 가방')}</div>
  `;
}


function renderSkills(snapshot: Snapshot) {
  return renderSkillGrid(snapshot.save, false);
}

function renderSkillGrid(save: PlayerSave, townMode: boolean) {
  const classSkills = skills.filter((skill) => skill.classId === save.classId);
  const cells = classSkills.map((skill) => {
    const unlocked = save.level >= skill.unlockLevel;
    return `
      <article class="slot-cell skill-slot ${unlocked ? 'unlocked' : 'locked'}">
        <span class="slot-rarity">${escapeHtml(skill.hotkey)}</span>
        <b>${escapeHtml(skill.name)}</b>
        <em>${unlocked ? `쿨 ${skill.cooldownSec}s · MP ${skill.mpCost}` : `Lv.${skill.unlockLevel} 해금`}</em>
        <p>${escapeHtml(skill.description)}</p>
      </article>
    `;
  });
  return `
    <div class="slot-toolbar">
      <span>스킬 슬롯 3x3 · ${classes[save.classId].name}</span>
      <em>${townMode ? '전투 화면 우측 스킬 버튼으로 사용합니다.' : '쿨타임/MP 소모/범위 공격이 적용됩니다.'}</em>
    </div>
    <div class="slot-grid skill-slot-grid">${fillSlots(cells, 9, '미개방 슬롯')}</div>
  `;
}

function renderCardSlot(def: CardDefinition, instance: { uid: string; level: number; copies: number; equipped: boolean }, actionAttr: string) {
  return `
    <article class="slot-cell card-slot ${instance.equipped ? 'equipped' : ''}">
      <img src="${def.art}" alt="${escapeHtml(def.name)}" />
      <span class="slot-rarity rarity-${def.rarity.toLowerCase()}">${def.rarity}</span>
      <b>${escapeHtml(def.name)}</b>
      <em>Lv.${instance.level} · x${instance.copies}${instance.equipped ? ' · 장착중' : ''}</em>
      <p>${escapeHtml(def.effectText)}</p>
      <button ${actionAttr}="${instance.uid}">${instance.equipped ? '해제' : '장착'}</button>
    </article>
  `;
}

function renderItemSlot(save: PlayerSave, def: ItemDefinition, uidValue: string, count: number, actionAttr: string, upgradeAttr?: string) {
  const slot = def.type as EquipmentSlot;
  const canEquip = def.type !== 'material';
  const equipped = canEquip && save.equipment?.[slot] === uidValue;
  const enhanceLevel = save.enhancements?.[uidValue] || 0;
  const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료' };
  const cost = enhancementCost(enhanceLevel);
  const upgradeLabel = enhanceLevel >= MAX_ENHANCE_LEVEL ? 'MAX' : `강화 +${cost.next}`;
  const upgradeDisabled = enhanceLevel >= MAX_ENHANCE_LEVEL ? 'disabled' : '';
  return `
    <article class="slot-cell item-slot ${equipped ? 'equipped' : ''}">
      <span class="item-icon">${itemIcon(def.type)}</span>
      <span class="slot-rarity rarity-${def.rarity.toLowerCase()}">${def.rarity}${canEquip ? ` · +${enhanceLevel}` : ''}</span>
      <b>${escapeHtml(def.name)}${canEquip && enhanceLevel ? ` +${enhanceLevel}` : ''}</b>
      <em>${typeLabel[def.type] || escapeHtml(def.type)} · x${count}${equipped ? ' · 장착중' : ''}</em>
      <p>${escapeHtml(def.effectText)}${canEquip && enhanceLevel < MAX_ENHANCE_LEVEL ? ` · 다음 ${formatNumber(cost.gold)}G${cost.shard ? ` / 파편 ${cost.shard}` : ''}` : ''}</p>
      ${canEquip ? `<div class="slot-actions"><button ${actionAttr}="${uidValue}">${equipped ? '해제' : '장착'}</button>${upgradeAttr ? `<button ${upgradeDisabled} ${upgradeAttr}="${uidValue}">${upgradeLabel}</button>` : ''}</div>` : '<span class="slot-passive">재료</span>'}
    </article>
  `;
}

function fillSlots(cells: string[], total: number, label: string) {
  const next = [...cells];
  while (next.length < total) next.push(`<article class="slot-cell empty-slot-cell"><span>+</span><b>${escapeHtml(label)}</b></article>`);
  return next.slice(0, total).join('');
}

function itemIcon(type: string) {
  if (type === 'weapon') return '⚔';
  if (type === 'armor') return '▣';
  if (type === 'relic') return '✦';
  return '◆';
}

function renderSkillDock(snapshot: Snapshot) {
  for (const button of skillDockButtons) {
    const slot = Number(button.dataset.skillSlot || 0);
    const skill = snapshot.skills[slot];
    if (!skill) {
      button.disabled = true;
      button.innerHTML = '<span>-</span><b>빈 슬롯</b><em></em>';
      continue;
    }
    const cooling = skill.cooldownRemaining > 0;
    const mpLack = snapshot.save.mp < skill.mpCost;
    button.disabled = !skill.unlocked || cooling || mpLack;
    button.classList.toggle('locked', !skill.unlocked);
    button.classList.toggle('cooling', cooling);
    button.classList.toggle('mp-lack', mpLack && skill.unlocked && !cooling);
    const label = !skill.unlocked ? '잠금' : cooling ? `${skill.cooldownRemaining.toFixed(1)}s` : mpLack ? 'MP' : '준비';
    button.innerHTML = `<span>${escapeHtml(skill.hotkey)}</span><b>${escapeHtml(skill.name)}</b><em>${label}</em>`;
  }
}

function renderCardSetSummary(save: PlayerSave) {
  const active = new Set(activeCardSetEffects(save).map((set) => set.id));
  const rows = cardSets.map((set) => {
    const on = active.has(set.id);
    const required = set.requiredCardIds
      .map((id) => cards.find((card) => card.id === id)?.name || id)
      .join(' + ');
    return `
      <article class="set-row ${on ? 'active' : ''}">
        <div class="pill-row"><span class="pill">${on ? '발동' : '미발동'}</span><span class="pill">${set.requiredCardIds.length}장 조합</span></div>
        <h3>${escapeHtml(set.name)}</h3>
        <p>${escapeHtml(required)}</p>
        <p class="quest-reward">${escapeHtml(set.effectText)}</p>
      </article>
    `;
  }).join('');
  return `<div class="set-list">${rows}</div>`;
}

function activeCardSetEffects(save: PlayerSave) {
  const equippedIds = new Set(save.cards.filter((card) => card.equipped).map((card) => card.cardId));
  return cardSets.filter((set) => set.requiredCardIds.every((id) => equippedIds.has(id)));
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
  setClassArt(townHeroGlyph, save.classId);
  townHeroName.textContent = save.name;
  townHeroMeta.textContent = `Lv.${save.level} · ${klass.name} · ${klass.roleText}`;
  townGoldText.textContent = `${formatNumber(save.gold)}G`;
  townGemText.textContent = `${formatNumber(save.gems)}소울`;
  townPowerText.textContent = `전투력 ${formatNumber(powerFromSave(save))}`;
  renderTownStorySnapshot(save);
  updateZoneLocks(save);
  if (townContentOpen) renderTownContent();
}


function zoneEntryPoint(zoneId: string) {
  return zones.find((zone) => zone.id === zoneId)?.entry || zones[0].entry;
}

function zoneTitle(zoneId: string) {
  return zones.find((zone) => zone.id === zoneId)?.title || '사냥터';
}

function isZoneUnlocked(save: PlayerSave, zoneId: string) {
  const zone = zones.find((entry) => entry.id === zoneId);
  if (!zone) return true;
  const claimed = new Set(save.story?.claimedQuestIds || []);
  if (!zone.unlockQuestId && !zone.unlockLevel) return true;
  return Boolean((zone.unlockQuestId && claimed.has(zone.unlockQuestId)) || (zone.unlockLevel && save.level >= zone.unlockLevel));
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
    story: ['MAIN STORY', '스토리 퀘스트'],
    cards: ['SOUL CODEX', '카드 도감'],
    inventory: ['BAG', '장비 가방'],
    skills: ['SOUL SKILL', '스킬 슬롯'],
    shop: ['MERCHANT', '루미나 상점'],
    boss: ['RAID', '월드 보스'],
    quests: ['DAILY REQUEST', '일일 의뢰'],
    account: ['ACCOUNT', '계정/저장']
  };
  townContentEyebrow.textContent = titles[activeTownContent][0];
  townContentTitle.textContent = titles[activeTownContent][1];
  if (activeTownContent === 'story') townContentBody.innerHTML = renderTownStory(pendingSave);
  if (activeTownContent === 'cards') townContentBody.innerHTML = renderTownCards(pendingSave);
  if (activeTownContent === 'inventory') townContentBody.innerHTML = renderTownInventory(pendingSave);
  if (activeTownContent === 'skills') townContentBody.innerHTML = renderTownSkills(pendingSave);
  if (activeTownContent === 'shop') townContentBody.innerHTML = renderTownShop(pendingSave);
  if (activeTownContent === 'boss') townContentBody.innerHTML = renderTownBoss(pendingSave);
  if (activeTownContent === 'quests') townContentBody.innerHTML = renderTownQuests(pendingSave);
  if (activeTownContent === 'account') townContentBody.innerHTML = renderTownAccount(pendingSave);
}



function currentStoryQuest(save: PlayerSave) {
  const claimed = new Set(save.story?.claimedQuestIds || []);
  const activeId = save.story?.activeQuestId;
  const active = storyQuests.find((quest) => quest.id === activeId && !claimed.has(quest.id));
  return active || storyQuests.find((quest) => !claimed.has(quest.id)) || null;
}

function storyQuestProgress(save: PlayerSave, quest: (typeof storyQuests)[number]) {
  if (quest.goalType === 'talk') return 1;
  if (quest.goalType === 'level') return save.level;
  if (quest.goalType === 'kill' && quest.monsterId) return save.kills?.[quest.monsterId] || 0;
  return 0;
}

function renderTownStorySnapshot(save: PlayerSave) {
  const quest = currentStoryQuest(save);
  if (!quest) {
    townChapterText.textContent = 'STORY CLEAR';
    townStoryTitle.textContent = '현재 챕터 완료';
    townStoryDesc.textContent = 'Alpha 0.8 스토리를 모두 완료했습니다.';
    townStoryProgress.style.width = '100%';
    townStoryProgressText.textContent = '완료';
    townStoryActionBtn.textContent = '스토리 보기';
    return;
  }
  const progress = storyQuestProgress(save, quest);
  const percent = Math.min(100, Math.round((progress / quest.target) * 100));
  townChapterText.textContent = `CHAPTER ${quest.chapter}`;
  townStoryTitle.textContent = quest.title;
  townStoryDesc.textContent = `${quest.npc}: ${quest.goalText}`;
  townStoryProgress.style.width = `${percent}%`;
  townStoryProgressText.textContent = `${Math.min(progress, quest.target)}/${quest.target}`;
  townStoryActionBtn.textContent = storyActionLabel(save, quest);
}

function storyActionLabel(save: PlayerSave, quest: (typeof storyQuests)[number]) {
  const ready = storyQuestProgress(save, quest) >= quest.target;
  if (ready) return quest.goalType === 'talk' ? '대화 완료' : '보상 수령';
  if (quest.unlockZoneId) return '사냥터 이동';
  return '스토리 확인';
}

async function handleStoryAction() {
  if (!pendingSave) return;
  const quest = currentStoryQuest(pendingSave);
  if (!quest) {
    openTownContent('story');
    return;
  }
  const progress = storyQuestProgress(pendingSave, quest);
  if (progress < quest.target) {
    if (quest.unlockZoneId) {
      closeTownContentPanel();
      await startField(pendingSave, quest.unlockZoneId);
      return;
    }
    openTownContent('story');
    return;
  }
  claimStoryQuest(quest.id);
}

function claimStoryQuest(questId: string) {
  if (!pendingSave) return;
  const quest = storyQuests.find((entry) => entry.id === questId);
  if (!quest) return;
  pendingSave.story ||= { activeQuestId: storyQuests[0]?.id || '', completedQuestIds: [], claimedQuestIds: [] };
  if (pendingSave.story.claimedQuestIds.includes(quest.id)) {
    showToast('이미 완료한 스토리입니다.');
    return;
  }
  if (storyQuestProgress(pendingSave, quest) < quest.target) {
    showToast('스토리 목표를 아직 달성하지 못했습니다.');
    return;
  }
  if (!pendingSave.story.completedQuestIds.includes(quest.id)) pendingSave.story.completedQuestIds.push(quest.id);
  pendingSave.story.claimedQuestIds.push(quest.id);
  applyStoryReward(pendingSave, quest.reward);
  const next = storyQuests.find((entry) => !pendingSave?.story.claimedQuestIds.includes(entry.id));
  pendingSave.story.activeQuestId = next?.id || quest.id;
  persistTownSave();
  showToast(`${quest.title} 완료 · 보상 획득`);
}

function applyStoryReward(save: PlayerSave, reward: (typeof storyQuests)[number]['reward']) {
  if (reward.gold) save.gold += reward.gold;
  if (reward.gems) save.gems += reward.gems;
  if (reward.itemId) {
    for (let i = 0; i < (reward.itemCount || 1); i += 1) addInventoryItem(save, reward.itemId);
  }
  if (reward.exp) {
    save.exp += reward.exp;
    while (save.exp >= expToNext(save.level)) {
      save.exp -= expToNext(save.level);
      save.level += 1;
    }
  }
  repairTownVitals(save);
}

function storyRewardText(reward: (typeof storyQuests)[number]['reward']) {
  const parts: string[] = [];
  if (reward.exp) parts.push(`${formatNumber(reward.exp)}EXP`);
  if (reward.gold) parts.push(`${formatNumber(reward.gold)}G`);
  if (reward.gems) parts.push(`소울젬 ${formatNumber(reward.gems)}`);
  if (reward.itemId) {
    const def = items.find((item) => item.id === reward.itemId);
    parts.push(`${def ? def.name : reward.itemId} x${reward.itemCount || 1}`);
  }
  return parts.join(' · ') || '없음';
}

function updateZoneLocks(save: PlayerSave) {
  document.querySelectorAll<HTMLButtonElement>('[data-zone-id]').forEach((button) => {
    const zone = zones.find((entry) => entry.id === (button.dataset.zoneId || ''));
    const unlocked = isZoneUnlocked(save, button.dataset.zoneId || '');
    button.disabled = !unlocked;
    button.classList.toggle('locked', !unlocked);
    button.title = unlocked ? `${zone?.title || '사냥터'} 입장` : `${zone?.unlockLevel ? `Lv.${zone.unlockLevel}` : '스토리'} 이후 해금`;
  });
}

function renderTownStory(save: PlayerSave) {
  const quest = currentStoryQuest(save);
  const rows = storyQuests
    .map((entry) => {
      const claimed = save.story.claimedQuestIds.includes(entry.id);
      const active = quest?.id === entry.id;
      const progress = Math.min(entry.target, storyQuestProgress(save, entry));
      const percent = entry.target ? Math.min(100, Math.round((progress / entry.target) * 100)) : 100;
      const ready = progress >= entry.target;
      return `
        <article class="story-row ${active ? 'active' : ''} ${claimed ? 'claimed' : ''}">
          <div class="story-row-chapter">CH.${entry.chapter}</div>
          <div>
            <div class="pill-row">
              <span class="pill">${claimed ? '완료' : active ? ready ? '보상 가능' : '진행중' : '대기'}</span>
              <span class="pill">${escapeHtml(entry.npc)}</span>
            </div>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.subtitle)} · ${escapeHtml(entry.goalText)}</p>
            <div class="bar exp quest-progress"><i style="width:${percent}%"></i><em>${progress}/${entry.target}</em></div>
            <p class="quest-reward">보상: ${storyRewardText(entry.reward)}</p>
          </div>
        </article>
      `;
    })
    .join('');

  if (!quest) {
    return `
      <div class="town-content-note">현재 준비된 Alpha 0.8 스토리를 모두 완료했습니다. 다음 챕터는 흑수정 동굴과 잠든 용의 둥지로 확장됩니다.</div>
      <div class="story-list">${rows}</div>
    `;
  }

  const progress = storyQuestProgress(save, quest);
  const ready = progress >= quest.target;
  return `
    <section class="story-brief">
      <div class="story-npc-medal">${escapeHtml(quest.npc.slice(0, 1))}</div>
      <div>
        <span class="town-eyebrow">CHAPTER ${quest.chapter}</span>
        <h3>${escapeHtml(quest.title)}</h3>
        <p><b>${escapeHtml(quest.npc)}</b> “${escapeHtml(quest.dialogue)}”</p>
        <p>${escapeHtml(quest.goalText)} · ${Math.min(progress, quest.target)}/${quest.target}</p>
        <button class="wide-action primary" data-town-story-action="${quest.id}">${storyActionLabel(save, quest)}</button>
      </div>
    </section>
    <div class="story-list">${rows}</div>
  `;
}

function renderTownCards(save: PlayerSave) {
  const equippedCount = save.cards.filter((card) => card.equipped).length;
  const cells = save.cards
    .flatMap((instance) => {
      const def = cards.find((card) => card.id === instance.cardId);
      return def ? [{ def, instance }] : [];
    })
    .map(({ def, instance }) => renderCardSlot(def, instance, 'data-town-equip-card'));

  return `
    <div class="town-content-note">카드 보관함 3x3 · 장착 ${equippedCount}/4 · 조합이 맞으면 세트 효과가 자동 발동합니다.</div>
    <div class="slot-grid card-slot-grid town-slot-grid">${fillSlots(cells, 9, '빈 카드 슬롯')}</div>
    ${renderCardSetSummary(save)}
  `;
}

function renderTownInventory(save: PlayerSave) {
  const stats = calculateStatsFromSave(save);
  const cells = save.inventory
    .flatMap((instance) => {
      const def = items.find((item) => item.id === instance.itemId);
      return def ? [{ def, instance }] : [];
    })
    .map(({ def, instance }) => renderItemSlot(save, def, instance.uid, instance.count, 'data-town-equip-item', 'data-town-upgrade-item'));

  return `
    <div class="town-stat-grid">
      <span>HP <b>${stats.hp}</b></span>
      <span>MP <b>${stats.mp}</b></span>
      <span>ATK <b>${stats.atk}</b></span>
      <span>DEF <b>${stats.def}</b></span>
      <span>ASPD <b>${stats.aspd}</b></span>
      <span>CRIT <b>${Math.round(stats.crit * 100)}%</b></span>
    </div>
    <div class="slot-toolbar"><span>인벤토리 5x9 · ${save.inventory.length}/45</span><em>슬롯을 눌러 장착/해제합니다.</em></div>
    <div class="slot-grid inventory-slot-grid town-slot-grid">${fillSlots(cells, 45, '빈 가방')}</div>
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


function renderTownSkills(save: PlayerSave) {
  return renderSkillGrid(save, true);
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


function renderTownQuests(save: PlayerSave) {
  const claimed = new Set(save.daily?.claimedQuestIds || []);
  const completed = dailyQuests.filter((quest) => claimed.has(quest.id)).length;
  const rows = dailyQuests
    .map((quest) => {
      const progress = questProgress(save, quest.id);
      const percent = Math.min(100, Math.round((progress / quest.target) * 100));
      const done = progress >= quest.target;
      const isClaimed = claimed.has(quest.id);
      return `
        <article class="quest-row ${done ? 'ready' : ''} ${isClaimed ? 'claimed' : ''}">
          <div>
            <div class="pill-row">
              <span class="pill">${isClaimed ? '완료' : done ? '보상 가능' : '진행중'}</span>
              <span class="pill">${progress}/${quest.target}</span>
            </div>
            <h3>${escapeHtml(quest.title)}</h3>
            <p>${escapeHtml(quest.description)}</p>
            <div class="bar exp quest-progress"><i style="width:${percent}%"></i><em>${percent}%</em></div>
            <p class="quest-reward">보상: ${rewardText(quest.reward)}</p>
          </div>
          <button ${!done || isClaimed ? 'disabled' : ''} data-town-claim-quest="${quest.id}">${isClaimed ? '수령 완료' : done ? '수령' : '진행중'}</button>
        </article>
      `;
    })
    .join('');

  return `
    <div class="town-content-note">오늘 의뢰 ${completed}/${dailyQuests.length} 완료 · 날짜가 바뀌면 진행도와 수령 상태가 초기화됩니다.</div>
    <div class="quest-list">${rows}</div>
  `;
}

function questProgress(save: PlayerSave, questId: string) {
  const quest = dailyQuests.find((entry) => entry.id === questId);
  if (!quest) return 0;
  if (quest.goalType === 'level') return save.level;
  if (quest.goalType === 'kill' && quest.monsterId) return save.daily?.kills?.[quest.monsterId] || 0;
  return 0;
}

function rewardText(reward: { gold?: number; gems?: number; itemId?: string; itemCount?: number }) {
  const parts: string[] = [];
  if (reward.gold) parts.push(`${formatNumber(reward.gold)}G`);
  if (reward.gems) parts.push(`소울젬 ${formatNumber(reward.gems)}`);
  if (reward.itemId) {
    const def = items.find((item) => item.id === reward.itemId);
    parts.push(`${def ? def.name : reward.itemId} x${reward.itemCount || 1}`);
  }
  return parts.join(' · ') || '없음';
}

function claimDailyQuest(questId: string) {
  if (!pendingSave) return;
  const quest = dailyQuests.find((entry) => entry.id === questId);
  if (!quest) return;
  pendingSave.daily ||= { dateKey: todayKey(), kills: { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0 }, claimedQuestIds: [] };
  if (pendingSave.daily.dateKey !== todayKey()) {
    pendingSave.daily = { dateKey: todayKey(), kills: { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0 }, claimedQuestIds: [] };
  }
  if (pendingSave.daily.claimedQuestIds.includes(quest.id)) {
    showToast('이미 보상을 받은 의뢰입니다.');
    return;
  }
  if (questProgress(pendingSave, quest.id) < quest.target) {
    showToast('아직 의뢰 조건을 달성하지 못했습니다.');
    return;
  }
  if (quest.reward.gold) pendingSave.gold += quest.reward.gold;
  if (quest.reward.gems) pendingSave.gems += quest.reward.gems;
  if (quest.reward.itemId) {
    for (let i = 0; i < (quest.reward.itemCount || 1); i += 1) addInventoryItem(pendingSave, quest.reward.itemId);
  }
  pendingSave.daily.claimedQuestIds.push(quest.id);
  persistTownSave();
  showToast(`${quest.title} 보상 수령`);
}

function todayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

function upgradeTownItem(itemUid: string) {
  if (!pendingSave) return;
  const entry = pendingSave.inventory.find((item) => item.uid === itemUid);
  if (!entry) return;
  const def = items.find((item) => item.id === entry.itemId);
  if (!def || def.type === 'material') {
    showToast('재료 아이템은 강화할 수 없습니다.');
    return;
  }
  pendingSave.enhancements ||= {};
  const current = pendingSave.enhancements[itemUid] || 0;
  if (current >= MAX_ENHANCE_LEVEL) {
    showToast('이미 최대 강화입니다.');
    return;
  }
  const cost = enhancementCost(current);
  if (pendingSave.gold < cost.gold) {
    showToast(`골드 부족 · 필요 ${formatNumber(cost.gold)}G`);
    return;
  }
  if (cost.shard && materialCount(pendingSave, 'soul-shard') < cost.shard) {
    showToast(`소울 파편 부족 · 필요 ${cost.shard}개`);
    return;
  }
  pendingSave.gold -= cost.gold;
  if (cost.shard) consumeMaterial(pendingSave, 'soul-shard', cost.shard);
  pendingSave.enhancements[itemUid] = current + 1;
  repairTownVitals(pendingSave);
  persistTownSave();
  showToast(`${def.name} +${current + 1} 강화 성공`);
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

function materialCount(save: PlayerSave, itemId: string) {
  return save.inventory.filter((entry) => entry.itemId === itemId).reduce((sum, entry) => sum + entry.count, 0);
}

function consumeMaterial(save: PlayerSave, itemId: string, count: number) {
  let rest = count;
  for (const entry of [...save.inventory]) {
    if (entry.itemId !== itemId || rest <= 0) continue;
    const used = Math.min(entry.count, rest);
    entry.count -= used;
    rest -= used;
    if (entry.count <= 0) save.inventory = save.inventory.filter((item) => item.uid !== entry.uid);
  }
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

  for (const set of activeCardSetEffects(save)) applyTownBonus(stats, set.bonus, 1);

  const equippedItemIds = new Set(Object.values(save.equipment || {}));
  for (const entry of save.inventory) {
    if (!equippedItemIds.has(entry.uid)) continue;
    const def = items.find((item) => item.id === entry.itemId);
    if (!def || def.type === 'material') continue;
    const enhanceLevel = save.enhancements?.[entry.uid] || 0;
    applyTownBonus(stats, def.bonus, 1 + enhanceLevel * 0.14);
    if (enhanceLevel > 0) applyTownBonus(stats, { atk: enhanceLevel * 0.8, def: enhanceLevel * 0.55, hp: enhanceLevel * 3 }, 1);
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

  if (document.fullscreenElement || doc.webkitFullscreenElement) {
    void lockPortraitMode();
    return;
  }
  try {
    if (document.fullscreenEnabled && rootEl.requestFullscreen) await rootEl.requestFullscreen();
    else if (rootEl.webkitRequestFullscreen) await rootEl.webkitRequestFullscreen();
    else if (forceToast) showToast('이 브라우저는 자동 전체화면을 지원하지 않습니다. 홈 화면에 설치하면 주소창 없는 실행이 가능합니다.');
    void lockPortraitMode();
  } catch (error) {
    if (forceToast) showToast('브라우저 정책상 버튼 터치 후에만 전체화면 전환이 가능합니다.');
    console.warn('[Fullscreen]', error);
  }
}

async function lockPortraitMode() {
  const screenWithOrientation = window.screen as Screen & {
    orientation?: ScreenOrientation & { lock?: (orientation: 'portrait' | 'portrait-primary') => Promise<void> };
  };
  try {
    await screenWithOrientation.orientation?.lock?.('portrait');
  } catch {
    // Some mobile browsers allow orientation lock only in fullscreen/PWA contexts.
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


function setClassArt(el: Element, classId: CharacterClassId) {
  el.classList.remove('class-warrior', 'class-taoist', 'class-cleric');
  el.classList.add(`class-${classId}`);
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
