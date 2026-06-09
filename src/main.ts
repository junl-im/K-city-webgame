import './styles.css';
import { MAP_H, MAP_W, MAX_ENHANCE_LEVEL, SKILL_MAX_LEVEL, cardSets, cards, classes, dailyQuests, enhancementCost, expToNext, items, monsters, skillMasteryCost, skills, souls, storyQuests, zones } from './data/gameData';
import { MAX_CHARACTER_SLOTS, SaveService } from './game/SaveService';
import { audioService } from './game/AudioService';
import { applyEquipmentResonance, equipmentResonanceEffects, nextEquipmentResonanceHint, resonanceBonusText } from './game/equipmentResonance';
import { formatGold, formatNumber, formatSoul, roll, uid } from './game/math';
import type { AutoHuntSettings, CardDefinition, CharacterClassId, CharacterGender, EquipmentSlot, EliteAffixId, ItemDefinition, PlayerSave, SheetTab, SkillDefinition, Snapshot, SoulDefinition, Stats } from './types';

type FlowStep = 'login' | 'server' | 'character' | 'town';
type TownContentId = 'hunt' | 'story' | 'cards' | 'inventory' | 'skills' | 'shop' | 'boss' | 'quests' | 'settings' | 'account';

const saveService = new SaveService();
type SolGameInstance = import('./game/SolGame').SolGame;
let game: SolGameInstance | null = null;
let latest: Snapshot | null = null;
let pendingSave: PlayerSave | null = null;
let characterRoster: PlayerSave[] = [];
let selectedCharacterId = '';
let creatingCharacter = false;
let selectedClass: CharacterClassId = 'warrior';
let selectedGender: CharacterGender = 'male';
let selectedServer = 'bearfox';
let combatLogCollapsed = false;
const SERVER_NAME = '곰같은여우 서버';
let activeSheetTab: SheetTab = 'cards';
let activeTownContent: TownContentId = 'hunt';
let sheetOpen = false;
let townContentOpen = false;
type WakeLockHandle = { release: () => Promise<void>; addEventListener?: (type: 'release', listener: () => void) => void };
let wakeLockHandle: WakeLockHandle | null = null;

const root = must('#game-root');
const titleScreen = must('#titleScreen');
const startGameBtn = must<HTMLButtonElement>('#startGameBtn');
const loginScreen = must('#loginScreen');
const loginStatus = must('#loginStatus');
const loginFlowHint = document.querySelector<HTMLElement>('#loginFlowHint');
const miniZoneName = document.querySelector<HTMLElement>('#miniZoneName');
const miniZoneMeta = document.querySelector<HTMLElement>('#miniZoneMeta');
const miniPlayerDot = document.querySelector<HTMLElement>('#miniPlayerDot');
const miniMapToggle = document.querySelector<HTMLButtonElement>('#miniMapToggle');
const fieldQuestTracker = document.querySelector<HTMLElement>('#fieldQuestTracker');
const fieldQuestTitle = document.querySelector<HTMLElement>('#fieldQuestTitle');
const fieldQuestProgress = document.querySelector<HTMLElement>('#fieldQuestProgress');
const fieldChainMeter = document.querySelector<HTMLElement>('#fieldChainMeter');
const fieldChainValue = document.querySelector<HTMLElement>('#fieldChainValue');
const fieldChainBonus = document.querySelector<HTMLElement>('#fieldChainBonus');
const fieldChainTimer = document.querySelector<HTMLElement>('#fieldChainTimer');
const browserSafeTip = document.querySelector<HTMLElement>('#browserSafeTip');
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
const hpPotionBtn = must<HTMLButtonElement>('#hpPotionBtn');
const mpPotionBtn = must<HTMLButtonElement>('#mpPotionBtn');
const sleepModeBtn = must<HTMLButtonElement>('#sleepModeBtn');
const sleepOverlay = must<HTMLElement>('#sleepOverlay');
const skillDockButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-skill-slot]'));
const fieldMenuButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-open-field-menu]'));
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
const titleAudioBtn = must<HTMLButtonElement>('#titleAudioBtn');
const townAudioBtn = must<HTMLButtonElement>('#townAudioBtn');
const townMoreBtn = must<HTMLButtonElement>('#townMoreBtn');
const townMoreMenu = must<HTMLElement>('#townMoreMenu');
const itemDetailModal = must<HTMLElement>('#itemDetailModal');
const closeItemDetail = must<HTMLButtonElement>('#closeItemDetail');
const itemDetailVisual = must<HTMLElement>('#itemDetailVisual');
const itemDetailEyebrow = must<HTMLElement>('#itemDetailEyebrow');
const itemDetailTitle = must<HTMLElement>('#itemDetailTitle');
const itemDetailDesc = must<HTMLElement>('#itemDetailDesc');
const itemDetailStats = must<HTMLElement>('#itemDetailStats');
const itemDetailActions = must<HTMLElement>('#itemDetailActions');
const exitConfirmModal = must<HTMLElement>('#exitConfirmModal');
const exitCancelBtn = must<HTMLButtonElement>('#exitCancelBtn');
const exitConfirmBtn = must<HTMLButtonElement>('#exitConfirmBtn');

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
    selectedGender = pendingSave.gender || 'male';
    nameInput.value = pendingSave.name;
    loginStatus.textContent = `${characterRoster.length}개 캐릭터를 찾았습니다.`;
  }

  bindTitleFlow();
  bindLoginFlow();
  bindActions();
  bindJoystick();
  bindSheet();
  bindDetailModal();
  bindAudioControls();
  must('#classPortrait').addEventListener('click', () => openSheet('account'));
  bindBackButtonGuard();
  bindExitConfirmModal();
  bindLootPresentation();
  installBrowserCompatibilityMode();
  renderCharacterSummary();
  renderCharacterSlots();
  updateWorldSummary();
  goStep('login');
  titleScreen.classList.remove('hidden');
  loginScreen.classList.add('hidden');
  registerServiceWorker();
  updateAudioButtons();
}



function bindTitleFlow() {
  startGameBtn.addEventListener('click', async () => {
    void ensureFullscreen();
    void lockPortraitMode();
    await audioService.unlock();
    audioService.setScene('title');
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
    navigator.serviceWorker.register(new URL('./sw.js', window.location.href)).catch((error) => console.warn('[PWA] service worker skipped', error));
  });
}



function bindAudioControls() {
  titleAudioBtn.addEventListener('click', async () => {
    await audioService.unlock();
    audioService.toggleBgm();
    updateAudioButtons();
    showToast(audioService.getSettings().bgm ? 'BGM 켜짐' : 'BGM 꺼짐');
  });

  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const danger = button.classList.contains('danger') || button.disabled;
    audioService.play(danger ? 'error' : 'ui');
    if (!button.disabled) {
      button.classList.remove('pressed-feedback');
      void button.offsetWidth;
      button.classList.add('pressed-feedback');
      window.setTimeout(() => button.classList.remove('pressed-feedback'), 260);
      // 0.32: 버튼마다 중앙 확인 팝업이 뜨던 피드백은 제거하고, 그래픽 UI는 CSS 에셋 프레임으로 처리합니다.
    }
  }, true);
}

function updateAudioButtons() {
  const settings = audioService.getSettings();
  const bgmText = settings.bgm ? 'BGM ON' : 'BGM OFF';
  titleAudioBtn.textContent = bgmText;
  townAudioBtn.textContent = bgmText;
  titleAudioBtn.classList.toggle('muted', !settings.bgm);
  townAudioBtn.classList.toggle('muted', !settings.bgm);
}

function handleAudioSettingsAction(action: string) {
  if (action === 'toggle-bgm') {
    audioService.toggleBgm();
    showToast(audioService.getSettings().bgm ? 'BGM 켜짐' : 'BGM 꺼짐');
  }
  if (action === 'toggle-sfx') {
    audioService.toggleSfx();
    showToast(audioService.getSettings().sfx ? '효과음 켜짐' : '효과음 꺼짐');
  }
  if (action === 'unlock') {
    void audioService.unlock().then((ok) => showToast(ok ? '오디오 준비 완료' : '이 브라우저는 오디오 잠금 해제가 제한됩니다.'));
  }
  updateAudioButtons();
  if (townContentOpen && activeTownContent === 'settings') townContentBody.innerHTML = renderAudioSettingsPanel('town');
  if (sheetOpen && activeSheetTab === 'account') renderSheet();
}

function renderAudioSettingsPanel(mode: 'town' | 'field') {
  const settings = audioService.getSettings();
  const unlocked = audioService.isUnlocked();
  const bgmMode = audioService.getBgmMode();
  return `
    <div class="audio-settings-panel ${mode}">
      <article class="audio-hero-card">
        <span class="town-eyebrow">SOUND MIXER</span>
        <h3>루미나 사운드 믹서</h3>
        <p>타이틀, 마을, 필드, 보스전 분위기에 맞춰 배경음과 효과음을 조절합니다.</p>
        <div class="pill-row">
          <span class="pill">${unlocked ? '오디오 준비됨' : '버튼 입력 후 준비'}</span>
          <span class="pill">BGM ${settings.bgm ? 'ON' : 'OFF'}</span>
          <span class="pill">SFX ${settings.sfx ? 'ON' : 'OFF'}</span>
          <span class="pill">${bgmMode === 'file' ? 'OGG 재생중' : bgmMode === 'synth' ? 'Fallback 재생중' : '대기중'}</span>
        </div>
      </article>
      <div class="audio-toggle-grid">
        <button class="wide-action ${settings.bgm ? 'primary' : 'subtle'}" data-town-settings-action="toggle-bgm" data-audio-action="toggle-bgm">BGM ${settings.bgm ? '끄기' : '켜기'}</button>
        <button class="wide-action ${settings.sfx ? 'primary' : 'subtle'}" data-town-settings-action="toggle-sfx" data-audio-action="toggle-sfx">효과음 ${settings.sfx ? '끄기' : '켜기'}</button>
        <button class="wide-action" data-town-settings-action="unlock" data-audio-action="unlock">오디오 다시 준비</button>
      </div>
      <div class="town-content-note">모바일 브라우저는 사용자 터치 후에만 소리가 시작됩니다. 설치형 PWA에서는 더 안정적으로 동작합니다.</div>
    </div>
  `;
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
      selectedGender = selected.gender || 'male';
      nameInput.value = selected.name;
      saveService.setActiveSave(selected.saveId);
    }
    creatingCharacter = false;
    renderCharacterSlots();
    updateWorldSummary();
  });

  connectCharacterBtn.addEventListener('click', async () => {
    const selected = getSelectedCharacter();
    if (!selected) {
      showToast('접속할 캐릭터를 선택하세요.');
      return;
    }
    pendingSave = saveService.validateSave(selected);
    selectedClass = pendingSave.classId;
    selectedGender = pendingSave.gender || 'male';
    nameInput.value = pendingSave.name;
    saveService.setActiveSave(pendingSave.saveId);
    renderCharacterSlots();
    updateWorldSummary();
    await quickEnterTown(pendingSave, '캐릭터 접속 중');
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

  document.querySelectorAll<HTMLButtonElement>('[data-gender]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedGender = (button.dataset.gender || 'male') as CharacterGender;
      document.querySelectorAll('[data-gender]').forEach((item) => item.classList.remove('active'));
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
    const name = sanitizeCharacterName(nameInput.value);
    if (!name) {
      showToast('사용할 수 없는 닉네임입니다. 욕설/운영자/마스터/GM 명칭은 사용할 수 없습니다.');
      return;
    }
    const prepared = saveService.createSave(name, selectedClass, selectedGender);
    pendingSave = prepared;
    saveService.saveLocal(prepared);
    refreshCharacterRoster(prepared.saveId);
    creatingCharacter = false;
    renderCharacterSummary();
    updateWorldSummary();
    showToast(`${prepared.name} 캐릭터 생성 완료`);
    void quickEnterTown(prepared, '캐릭터 생성 후 접속 중');
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
  townAudioBtn.addEventListener('click', () => { audioService.toggleBgm(); updateAudioButtons(); if (townContentOpen) renderTownContent(); });
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
    button.addEventListener('click', () => {
      closeTownMoreMenu();
      openTownContent((button.dataset.townContent || 'cards') as TownContentId);
    });
  });

  townMoreBtn.addEventListener('click', () => {
    const open = townMoreMenu.classList.toggle('hidden');
    const visible = !open;
    townMoreMenu.setAttribute('aria-hidden', visible ? 'false' : 'true');
    townMoreBtn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    townMoreBtn.classList.toggle('active', visible);
    document.body.classList.toggle('town-more-open', visible);
  });

  townMoreMenu.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-town-more-content]');
    if (!button) return;
    closeTownMoreMenu();
    openTownContent((button.dataset.townMoreContent || 'story') as TownContentId);
  });

  closeTownContent.addEventListener('click', closeTownContentPanel);
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (townMoreMenu.classList.contains('hidden')) return;
    if (target.closest('#townMoreMenu') || target.closest('#townMoreBtn')) return;
    closeTownMoreMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!townMoreMenu.classList.contains('hidden')) {
      closeTownMoreMenu();
      return;
    }
    if (townContentOpen) {
      closeTownContentPanel();
      return;
    }
    if (sheetOpen) closeCurrentSheet();
  });
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

    const upgradeTownSkill = target.closest<HTMLButtonElement>('[data-town-upgrade-skill]');
    if (upgradeTownSkill) {
      trainTownSkill(upgradeTownSkill.dataset.townUpgradeSkill || '');
      return;
    }

    const dismantleDuplicates = target.closest<HTMLButtonElement>('[data-town-dismantle-duplicates]');
    if (dismantleDuplicates) {
      dismantleTownDuplicateEquipment();
      return;
    }

    const buyBulkItem = target.closest<HTMLButtonElement>('[data-town-shop-buy-bulk]');
    if (buyBulkItem) {
      buyTownShopItem(buyBulkItem.dataset.townShopBuyBulk || '', Number(buyBulkItem.dataset.townShopCount || 5));
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

    const detailCard = target.closest<HTMLElement>('[data-card-detail]');
    if (detailCard) {
      openCardDetail(detailCard.dataset.cardDetail || '', true);
      return;
    }

    const detailItem = target.closest<HTMLElement>('[data-item-detail]');
    if (detailItem) {
      openItemDetail(detailItem.dataset.itemDetail || '', true);
      return;
    }

    const detailSkill = target.closest<HTMLElement>('[data-skill-detail]');
    if (detailSkill) {
      openSkillDetail(detailSkill.dataset.skillDetail || '', true);
      return;
    }

    const detailSoul = target.closest<HTMLElement>('[data-soul-detail]');
    if (detailSoul) {
      openSoulDetail(detailSoul.dataset.soulDetail || '');
      return;
    }

    const autoSetting = target.closest<HTMLButtonElement>('[data-auto-setting], [data-auto-ratio]');
    if (autoSetting) {
      handleAutoSettingAction(autoSetting);
      return;
    }

    const bossExchange = target.closest<HTMLButtonElement>('[data-town-boss-exchange]');
    if (bossExchange) {
      exchangeBossTrophy(bossExchange.dataset.townBossExchange || 'supply');
      return;
    }

    const account = target.closest<HTMLButtonElement>('[data-town-account-action]');
    const settings = target.closest<HTMLButtonElement>('[data-town-settings-action]');
    if (settings) { handleAudioSettingsAction(settings.dataset.townSettingsAction || ''); return; }

    if (account) await handleTownAccountAction(account.dataset.townAccountAction || '');
  });
}

async function quickEnterTown(save: PlayerSave, label = '루미나 마을로 이동 중') {
  void ensureFullscreen();
  void lockPortraitMode();
  pendingSave = saveService.validateSave(save);
  saveService.saveLocal(pendingSave);
  await enterTown(pendingSave, label);
  await saveCloudIfAvailable(pendingSave, latest?.power || powerFromSave(pendingSave), false);
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
  const hintText: Record<FlowStep, string> = {
    login: '접속 방식을 선택하세요.',
    server: '곰같은여우 서버 상태를 확인하고 다음으로 이동합니다.',
    character: '캐릭터를 선택하거나 새 소울 바인더를 생성하세요.',
    town: '접속 준비가 끝났습니다. 마을 입장을 누르면 루미나로 이동합니다.'
  };
  if (loginFlowHint) loginFlowHint.textContent = hintText[step];
  document.querySelectorAll('[data-flow-page]').forEach((page) => {
    const active = (page as HTMLElement).dataset.flowPage === step;
    page.classList.toggle('active', active);
    page.setAttribute('aria-hidden', active ? 'false' : 'true');
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


function sanitizeCharacterName(raw: string) {
  const name = raw.trim().replace(/\s+/g, '').slice(0, 12);
  if (name.length < 2) return '';
  const blocked = ['운영자', '관리자', '마스터', 'GM', 'gm', 'admin', 'Admin', 'master', '씨발', '시발', '병신', '개새', '좆', '보지', '자지'];
  if (blocked.some((word) => name.includes(word))) return '';
  if (!/^[가-힣a-zA-Z0-9_]+$/.test(name)) return '';
  return name;
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
    audioService.setScene('town');
    closeTownMoreMenu();
    renderTown(pendingSave);
  });
}

async function startField(save: PlayerSave, zoneId = 'slime-forest', autoStart = false) {
  const zone = zones.find((entry) => entry.id === zoneId) || zones[0];
  const zoneName = zone.title;
  try {
    await withSceneTransition(`${zoneName} 입장 중`, async () => {
      const prepared = saveService.validateSave(save);
      const entry = zone.entry || zones[0].entry;
      prepared.x = entry.x;
      prepared.y = entry.y;
      if (autoStart) prepared.autoHunt = true;
      pendingSave = prepared;
      saveService.saveLocal(prepared);
      closeCurrentSheet();
      townScreen.classList.add('hidden');
      townScreen.setAttribute('aria-hidden', 'true');
      titleScreen.classList.add('hidden');
      loginScreen.classList.add('hidden');
      closeTownContentPanel();
      closeTownMoreMenu();
      document.body.classList.remove('town-active');
      document.body.classList.add('field-active');
      setFieldZoneHud(zoneId);

      if (game) game.destroy();
      void requestWakeLock();
      audioService.setScene(zoneId === 'crystal-raid' ? 'boss' : 'field');
      const { SolGame } = await import('./game/SolGame');
      game = new SolGame(prepared, saveService, {
        zoneId,
        zoneName,
        onLoadProgress: (loaded, total) => {
          sceneTransitionLabel.textContent = `${zoneName} 에셋 로딩 ${loaded}/${total}`;
        }
      });
      await game.mount(root);
      game.onSnapshot((snapshot) => {
        latest = snapshot;
        pendingSave = snapshot.save;
        renderHud(snapshot);
        if (sheetOpen) renderSheet();
      });
      showToast(`${zoneName} 입장`);
    });
  } catch (error) {
    console.error('[Field] enter failed', error);
    document.body.classList.remove('field-active');
    document.body.classList.add('town-active');
    townScreen.classList.remove('hidden');
    townScreen.setAttribute('aria-hidden', 'false');
    showToast(error instanceof Error ? `사냥터 입장 실패: ${error.message}` : '사냥터 입장 실패');
  }
}

function setFieldZoneHud(zoneId: string) {
  const zone = zones.find((entry) => entry.id === zoneId) || zones[0];
  if (miniZoneName) miniZoneName.textContent = zone.title;
  if (miniZoneMeta) miniZoneMeta.textContent = `권장 Lv.${zone.recommendedLevel}`;
}

async function returnToTown() {
  if (!game) return;
  const save = game.getSave();
  await game.saveNow();
  await releaseWakeLock();
  await enterTown(save, '마을로 복귀 중');
  refreshCharacterRoster(save.saveId);
  showToast('루미나 마을로 복귀했습니다.');
}


function toggleSleepMode(force?: boolean) {
  if (!latest) return;
  const next = typeof force === 'boolean' ? force : !latest.save.sleepMode;
  latest.save.sleepMode = next;
  if (pendingSave) pendingSave.sleepMode = next;
  if (game) game.getSave().sleepMode = next;
  document.body.classList.toggle('sleep-mode-active', next);
  sleepModeBtn.classList.toggle('active', next);
  if (next) {
    void requestWakeLock();
    showToast('절전 모드 · 자동사냥 유지');
  } else {
    showToast('절전 모드 해제');
  }
}

function bindActions() {
  autoHuntBtn.addEventListener('click', () => {
    if (!game || !latest) return;
    const next = !latest.save.autoHunt;
    game.setAutoHunt(next);
    if (next) void requestWakeLock();
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
  hpPotionBtn.addEventListener('click', () => game?.useBestPotion('hp'));
  mpPotionBtn.addEventListener('click', () => game?.useBestPotion('mp'));
  sleepModeBtn.addEventListener('click', () => toggleSleepMode());
  sleepOverlay.addEventListener('click', () => toggleSleepMode(false));
  for (const button of fieldMenuButtons) {
    button.addEventListener('click', () => openSheet('account'));
  }
  miniMapToggle?.addEventListener('click', () => {
    document.body.classList.toggle('minimap-compact');
  });
  fieldQuestTracker?.addEventListener('click', () => {
    void continueCurrentQuest(true);
  });
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
  const radius = 48;

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
    const strength = clamped / radius;
    const boosted = strength < 0.04 ? 0 : Math.min(1, strength * 1.18);
    joystickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    game?.setJoystick((dx / len) * boosted, (dy / len) * boosted);
  };

  joystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    active = true;
    joystick.setPointerCapture(event.pointerId);
    update(event.clientX, event.clientY);
  }, { passive: false });

  joystick.addEventListener('pointermove', (event) => {
    if (!active) return;
    event.preventDefault();
    update(event.clientX, event.clientY);
  }, { passive: false });

  joystick.addEventListener('pointerup', (event) => {
    event.preventDefault();
    reset();
  }, { passive: false });
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

    const upgradeSkill = target.closest<HTMLButtonElement>('[data-upgrade-skill]');
    if (upgradeSkill) {
      game?.upgradeSkill(upgradeSkill.dataset.upgradeSkill || '');
      return;
    }

    const autoSetting = target.closest<HTMLButtonElement>('[data-auto-setting], [data-auto-ratio]');
    if (autoSetting) {
      handleAutoSettingAction(autoSetting);
      return;
    }

    const audioAction = target.closest<HTMLButtonElement>('[data-audio-action]');
    if (audioAction) {
      handleAudioSettingsAction(audioAction.dataset.audioAction || '');
      return;
    }

    const detailCard = target.closest<HTMLElement>('[data-card-detail]');
    if (detailCard) {
      openCardDetail(detailCard.dataset.cardDetail || '', false);
      return;
    }

    const detailItem = target.closest<HTMLElement>('[data-item-detail]');
    if (detailItem) {
      openItemDetail(detailItem.dataset.itemDetail || '', false);
      return;
    }

    const detailSkill = target.closest<HTMLElement>('[data-skill-detail]');
    if (detailSkill) {
      openSkillDetail(detailSkill.dataset.skillDetail || '', false);
      return;
    }

    const detailSoul = target.closest<HTMLElement>('[data-soul-detail]');
    if (detailSoul) {
      openSoulDetail(detailSoul.dataset.soulDetail || '');
      return;
    }

    const action = target.closest<HTMLButtonElement>('[data-account-action]');
    if (!action) return;
    await handleAccountAction(action.dataset.accountAction || '');
  });
}


  sheetBody.addEventListener('dblclick', (event) => {
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>('[data-item-detail]');
    if (item) { game?.equipItem(item.dataset.itemDetail || ''); return; }
    const card = target.closest<HTMLElement>('[data-card-detail]');
    if (card) { game?.equipCard(card.dataset.cardDetail || ''); }
  });

  townContentBody.addEventListener('dblclick', (event) => {
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>('[data-item-detail]');
    if (item) { toggleTownItem(item.dataset.itemDetail || ''); return; }
    const card = target.closest<HTMLElement>('[data-card-detail]');
    if (card) { toggleTownCard(card.dataset.cardDetail || ''); }
  });

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
    if (action === 'toggle-bgm' || action === 'toggle-sfx' || action === 'unlock') {
      handleAudioSettingsAction(action);
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
  const mpPercent = `${Math.round((snapshot.save.mp / Math.max(1, snapshot.stats.mp)) * 100)}%`;
  const expPercent = `${Math.round((snapshot.save.exp / expToNext(snapshot.save.level)) * 100)}%`;

  text('#playerName', snapshot.save.name);
  text('#levelText', `Lv.${snapshot.save.level}`);
  text('#classPortrait', klass.glyph);
  setClassPortraitArt(must('#classPortrait'), snapshot.save.classId, snapshot.save.gender || 'male');
  text('#hpText', `${Math.ceil(snapshot.save.hp)}/${snapshot.stats.hp}`);
  text('#mpText', `${Math.floor(snapshot.save.mp)}/${snapshot.stats.mp}`);
  text('#expText', `${Math.floor(snapshot.save.exp)}/${expToNext(snapshot.save.level)}`);
  text('#goldText', formatGold(snapshot.save.gold));
  text('#gemText', formatSoul(snapshot.save.gems));
  text('#dpsText', `전투력 ${formatNumber(snapshot.power)}`);

  styleWidth('#hpBar', hpPercent);
  styleWidth('#mpBar', mpPercent);
  styleWidth('#expBar', expPercent);
  updateFieldMiniMap(snapshot);
  updateFieldQuestTracker(snapshot);
  updateCombatChain(snapshot);
  updatePotionDock(snapshot);

  autoHuntBtn.classList.toggle('active', snapshot.save.autoHunt);
  sleepModeBtn.classList.toggle('active', Boolean(snapshot.save.sleepMode));
  document.body.classList.toggle('sleep-mode-active', Boolean(snapshot.save.sleepMode));
  document.body.classList.toggle('field-auto-active', snapshot.save.autoHunt);
  autoHuntBtn.innerHTML = snapshot.save.autoHunt ? '<span>●</span><b>자동 ON</b>' : '<span>⟳</span><b>자동 OFF</b>';
  renderSkillDock(snapshot);

  if (snapshot.target) {
    text('#targetName', snapshot.target.def.name);
    const eliteMeta = snapshot.target.eliteAffix ? `${eliteAffixName(snapshot.target.eliteAffix)} · ` : '';
    text('#targetMeta', `${eliteMeta}Lv.${snapshot.target.def.level} HP ${Math.ceil(snapshot.target.hp)}/${snapshot.target.def.stats.hp}`);
    styleWidth('#targetHp', `${Math.round(snapshot.targetHpPercent * 100)}%`);
    must('#targetCard').classList.toggle('elite-target', Boolean(snapshot.target.eliteAffix));
  } else {
    text('#targetName', '필드 탐색');
    text('#targetMeta', snapshot.save.autoHunt ? '자동사냥 탐색 중' : '수동 조작 중');
    styleWidth('#targetHp', '0%');
    must('#targetCard').classList.remove('elite-target');
  }

  const log = must('#combatLog');
  log.innerHTML = snapshot.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

function updatePotionDock(snapshot: Snapshot) {
  const hpCount = snapshot.potionCounts.hpTotal;
  const mpCount = snapshot.potionCounts.mpTotal;
  hpPotionBtn.querySelector('em')!.textContent = String(hpCount);
  mpPotionBtn.querySelector('em')!.textContent = String(mpCount);
  hpPotionBtn.querySelector('b')!.textContent = snapshot.potionCounts.hpBestName ? 'HP+' : 'HP';
  mpPotionBtn.querySelector('b')!.textContent = snapshot.potionCounts.mpBestName ? 'MP+' : 'MP';
  hpPotionBtn.title = snapshot.potionCounts.hpBestName ? `자동 선택: ${snapshot.potionCounts.hpBestName}` : '생명 물약 없음';
  mpPotionBtn.title = snapshot.potionCounts.mpBestName ? `자동 선택: ${snapshot.potionCounts.mpBestName}` : '마나 물약 없음';
  hpPotionBtn.disabled = hpCount <= 0 || snapshot.save.hp >= snapshot.stats.hp;
  mpPotionBtn.disabled = mpCount <= 0 || snapshot.save.mp >= snapshot.stats.mp;
}

function updateCombatChain(snapshot: Snapshot) {
  if (!fieldChainMeter || !fieldChainValue || !fieldChainBonus || !fieldChainTimer) return;
  const chain = snapshot.combatChain;
  const active = chain.count > 1 && chain.timer > 0;
  const comboTier = chain.count >= 20 ? '폭주' : chain.count >= 10 ? '고조' : chain.count >= 5 ? '가속' : '연계';
  fieldChainMeter.classList.toggle('active', active);
  fieldChainValue.textContent = active ? `${chain.count} COMBO` : 'COMBO';
  fieldChainBonus.textContent = active
    ? `${comboTier} · EXP/GOLD +${chain.bonusPercent}% · ${chain.timer.toFixed(1)}초 딜타임`
    : '처치 연계 시 EXP/GOLD 보너스';
  const ratio = chain.maxTimer > 0 ? Math.max(0, Math.min(100, (chain.timer / chain.maxTimer) * 100)) : 0;
  fieldChainTimer.style.width = `${ratio}%`;
}

function eliteAffixName(id: EliteAffixId) {
  const labels: Record<EliteAffixId, string> = { fierce: '분노', ancient: '고대', swift: '신속', cursed: '저주' };
  return labels[id] || '정예';
}

function updateFieldQuestTracker(snapshot: Snapshot) {
  if (!fieldQuestTitle || !fieldQuestProgress) return;
  const quest = currentStoryQuest(snapshot.save);
  if (!quest) {
    fieldQuestTitle.textContent = '현재 스토리 완료';
    fieldQuestProgress.textContent = '완료';
    return;
  }
  const progress = storyQuestProgress(snapshot.save, quest);
  fieldQuestTitle.textContent = quest.title;
  fieldQuestProgress.textContent = `${Math.min(progress, quest.target)}/${quest.target} · ${quest.goalText} · 터치시 이동`;
}

function updateFieldMiniMap(snapshot: Snapshot) {
  if (!miniPlayerDot) return;
  const left = Math.max(7, Math.min(86, (snapshot.save.x / MAP_W) * 100));
  const top = Math.max(7, Math.min(86, (snapshot.save.y / MAP_H) * 100));
  miniPlayerDot.style.left = `${left}%`;
  miniPlayerDot.style.top = `${top}%`;
}

function bindBackButtonGuard() {
  const stateKey = 'soul-online-guard';
  if (!window.history.state || window.history.state.key !== stateKey) {
    window.history.replaceState({ key: stateKey }, document.title, window.location.href);
    window.history.pushState({ key: stateKey, guard: true }, document.title, window.location.href);
  }

  window.addEventListener('popstate', () => {
    const active = document.body.classList.contains('field-active') || document.body.classList.contains('town-active') || !loginScreen.classList.contains('hidden');
    if (!active) {
      window.history.pushState({ key: stateKey, guard: true }, document.title, window.location.href);
      return;
    }
    showExitConfirmModal();
    window.history.pushState({ key: stateKey, guard: true }, document.title, window.location.href);
  });
}

function bindExitConfirmModal() {
  exitCancelBtn.addEventListener('click', closeExitConfirmModal);
  exitConfirmBtn.addEventListener('click', confirmExitToTitle);
  exitConfirmModal.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('[data-exit-cancel]')) closeExitConfirmModal();
  });
}

function showExitConfirmModal() {
  exitConfirmModal.classList.remove('hidden');
  exitConfirmModal.setAttribute('aria-hidden', 'false');
}

function closeExitConfirmModal() {
  exitConfirmModal.classList.add('hidden');
  exitConfirmModal.setAttribute('aria-hidden', 'true');
}

function confirmExitToTitle() {
  try {
    if (game) {
      const save = game.getSave();
      saveService.saveLocal(save);
      game.destroy();
      game = null;
      pendingSave = save;
    } else if (pendingSave) {
      saveService.saveLocal(pendingSave);
    }
  } catch (error) {
    console.warn('[BackGuard] save skipped', error);
  }
  closeExitConfirmModal();
  closeCurrentSheet();
  document.body.classList.remove('field-active', 'town-active', 'sheet-open');
  root.replaceChildren();
  townScreen.classList.add('hidden');
  loginScreen.classList.add('hidden');
  titleScreen.classList.remove('hidden');
  showToast('진행 상황을 저장하고 첫 화면으로 돌아왔습니다.');
}

function openSheet(tab: SheetTab) {
  activeSheetTab = tab;
  sheetOpen = true;
  document.body.classList.add('sheet-open');
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-sheet-tab]').forEach((item) => {
    item.classList.toggle('active', (item as HTMLElement).dataset.sheetTab === tab);
  });
  renderSheet();
}

function closeCurrentSheet() {
  sheetOpen = false;
  document.body.classList.remove('sheet-open');
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
    account: ['CHARACTER', '캐릭터 정보']
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
      <span>카드 슬롯 4x9 · 장착 ${snapshot.save.cards.filter((card) => card.equipped).length}/4</span>
      <em>세트 효과 ${snapshot.cardSetEffects.length}개 발동 중</em>
    </div>
    <div class="slot-grid card-slot-grid">${fillSlots(cardCells, 36, '빈 카드 슬롯')}</div>
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
    ${renderEquipmentResonanceSummary(snapshot.save)}
    ${renderPotionBeltSummary(snapshot.save)}
    <div class="slot-toolbar">
      <span>가방 7x7 · ${snapshot.save.inventory.length}/49 · ${formatGold(snapshot.save.gold)} · ${formatSoul(snapshot.save.gems)}</span>
      <em>슬롯 클릭: 상세 · 더블클릭: 장착/해제</em>
    </div>
    <div class="slot-grid inventory-slot-grid">${fillSlots(itemCells, 49, '빈 가방')}</div>
  `;
}


function renderSkills(snapshot: Snapshot) {
  return renderSkillGrid(snapshot.save, false);
}

function renderSkillGrid(save: PlayerSave, townMode: boolean) {
  const classSkills = skills.filter((skill) => skill.classId === save.classId);
  const cells = classSkills.map((skill) => {
    const learned = Array.isArray(save.learnedSkillIds) && save.learnedSkillIds.includes(skill.id);
    const levelReady = save.level >= skill.unlockLevel;
    const unlocked = learned && levelReady;
    const level = skillLevel(save, skill.id);
    const state = !learned ? '미습득' : levelReady ? `Lv.${level}` : `Lv.${skill.unlockLevel}`;
    const canUpgrade = canUpgradeSkill(save, skill);
    const cost = level < SKILL_MAX_LEVEL ? skillMasteryCost(level) : null;
    const costText = cost ? `골드 ${formatGold(cost.gold)} · 파편 ${cost.shard}${cost.stone ? ` · 강화석 ${cost.stone}` : ''}` : '최대 숙련';
    const upgradeButton = `<span class="slot-click-hint">상세</span>`;
    return `
      <article class="slot-cell skill-slot ${unlocked ? 'unlocked' : 'locked'}" data-skill-detail="${skill.id}" tabindex="0" role="button" aria-label="${escapeHtml(skill.name)} 상세 보기">
        <span class="slot-art skill-art skill-art-${skill.hotkey}"><img src="${skillArtUrl(skill)}" alt="${escapeHtml(skill.name)}" onerror="this.remove()" />${inlineFallbackIcon(skill.hotkey)}</span>
        <span class="slot-rarity">${state}</span>
        <b>${escapeHtml(skill.name)}</b>
        <em>MP ${effectiveSkillMpCost(skill, level)} · 쿨 ${effectiveSkillCooldown(skill, level)}s</em>
        <small class="skill-mastery-meta">피해/회복 +${skillMasteryBonusPercent(level)}% · ${costText}</small>
        ${upgradeButton}
      </article>
    `;
  });
  return `
    <div class="slot-toolbar">
      <span>스킬 슬롯 3x3 · ${classes[save.classId].name}</span>
      <em>숙련 강화로 피해/회복, 쿨타임, MP 효율이 성장합니다.</em>
    </div>
    <div class="slot-grid skill-slot-grid compact-slot-grid">${fillSlots(cells, 9, '미개방')}</div>
  `;
}

function skillLevel(save: PlayerSave, skillId: string) {
  const learned = Array.isArray(save.learnedSkillIds) && save.learnedSkillIds.includes(skillId);
  if (!learned) return 0;
  const raw = Number(save.skillLevels?.[skillId]);
  return Math.max(1, Math.min(SKILL_MAX_LEVEL, Math.floor(Number.isFinite(raw) ? raw : 1)));
}

function skillMasteryBonusPercent(level: number) {
  return Math.max(0, level - 1) * 14;
}

function effectiveSkillMpCost(skill: SkillDefinition, level: number) {
  return Math.max(1, Math.round(skill.mpCost * (1 - Math.max(0, level - 1) * 0.045)));
}

function effectiveSkillCooldown(skill: SkillDefinition, level: number) {
  return Number(Math.max(1.2, skill.cooldownSec * (1 - Math.max(0, level - 1) * 0.035)).toFixed(1));
}

function canUpgradeSkill(save: PlayerSave, skill: SkillDefinition) {
  const level = skillLevel(save, skill.id);
  if (level <= 0 || level >= SKILL_MAX_LEVEL) return false;
  const cost = skillMasteryCost(level);
  return save.level >= Math.max(skill.unlockLevel, cost.levelReq)
    && save.gold >= cost.gold
    && materialCount(save, 'soul-shard') >= cost.shard
    && materialCount(save, 'enhance-stone') >= cost.stone;
}

function renderCardSlot(def: CardDefinition, instance: { uid: string; level: number; copies: number; equipped: boolean }, _actionAttr: string) {
  return `
    <article class="slot-cell card-slot ${instance.equipped ? 'equipped' : ''}" data-card-detail="${instance.uid}" tabindex="0" role="button" aria-label="${escapeHtml(def.name)} 상세 보기">
      <span class="slot-art card-art"><img src="${def.art}" alt="${escapeHtml(def.name)}" /></span>
      <span class="slot-rarity rarity-${def.rarity.toLowerCase()}">${def.rarity}${instance.equipped ? ' · 장착' : ''}</span>
      <b>${escapeHtml(def.name)}</b>
      <em>Lv.${instance.level} · x${instance.copies}</em>
      <span class="slot-click-hint">상세</span>
    </article>
  `;
}

function renderItemSlot(save: PlayerSave, def: ItemDefinition, uidValue: string, count: number, _actionAttr: string, _upgradeAttr?: string) {
  const slot = def.type as EquipmentSlot;
  const canEquip = def.type === 'weapon' || def.type === 'armor' || def.type === 'relic';
  const equipped = canEquip && save.equipment?.[slot] === uidValue;
  const enhanceLevel = save.enhancements?.[uidValue] || 0;
  const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료', skillbook: '스킬서', consumable: '소모품' };
  const stateText = canEquip ? `${def.rarity} · +${enhanceLevel}${equipped ? ' · 장착' : ''}` : `${def.rarity} · x${count}`;
  return `
    <article class="slot-cell item-slot ${equipped ? 'equipped' : ''}" data-item-detail="${uidValue}" tabindex="0" role="button" aria-label="${escapeHtml(def.name)} 상세 보기">
      <span class="slot-art item-art item-art-${def.type} ${equipped ? 'is-equipped' : ''}"><img src="${itemArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(itemIcon(def.type))}</span>
      <span class="slot-rarity rarity-${def.rarity.toLowerCase()}">${stateText}</span>
      <b>${escapeHtml(def.name)}${canEquip && enhanceLevel ? ` +${enhanceLevel}` : ''}</b>
      <em>${typeLabel[def.type] || escapeHtml(def.type)}</em>
      <span class="slot-click-hint">상세</span>
    </article>
  `;
}

function fillSlots(cells: string[], total: number, label: string) {
  const next = [...cells];
  while (next.length < total) next.push(`<article class="slot-cell empty-slot-cell" aria-label="${escapeHtml(label)}"><span>+</span><b>${escapeHtml(label)}</b></article>`);
  return next.slice(0, total).join('');
}

function itemIcon(type: string) {
  if (type === 'weapon') return '⚔';
  if (type === 'armor') return '▣';
  if (type === 'relic') return '✦';
  if (type === 'skillbook') return '書';
  if (type === 'consumable') return '✚';
  return '◆';
}

function runtimeAsset(path: string) {
  return `./assets/soulpack/${path}`;
}

function itemArtUrl(def: ItemDefinition) {
  return runtimeAsset(`items/${def.id}.webp`);
}

function skillArtUrl(def: SkillDefinition) {
  return runtimeAsset(`skills/${def.id}.webp`);
}

function soulArtUrl(def: SoulDefinition) {
  return runtimeAsset(`souls/${def.id}.webp`);
}

function inlineFallbackIcon(label: string) {
  return `<i>${escapeHtml(label)}</i>`;
}


function renderSkillDock(snapshot: Snapshot) {
  for (const button of skillDockButtons) {
    const slot = Number(button.dataset.skillSlot || 0);
    const skill = snapshot.skills[slot];
    if (!skill) {
      button.disabled = true;
      button.innerHTML = '<i class="skill-dock-art empty"><span>-</span></i><b>빈 슬롯</b><em></em>';
      continue;
    }
    const cooling = skill.cooldownRemaining > 0;
    const mpLack = snapshot.save.mp < skill.mpCost;
    button.disabled = !skill.unlocked || cooling || mpLack;
    button.classList.toggle('locked', !skill.unlocked);
    button.classList.toggle('cooling', cooling);
    button.classList.toggle('mp-lack', mpLack && skill.unlocked && !cooling);
    const label = !skill.unlocked ? '잠금' : cooling ? `${skill.cooldownRemaining.toFixed(1)}s` : mpLack ? 'MP' : '준비';
    button.innerHTML = `<i class="skill-dock-art"><img src="${runtimeAsset(`skills/${skill.id}.webp`)}" alt="${escapeHtml(skill.name)}" onerror="this.remove()" /><span>${escapeHtml(skill.hotkey)}</span></i><b>${escapeHtml(skill.name)}</b><em>Lv.${skill.level || 0} · ${label}</em>`;
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
        <article class="soul-row soul-slot" data-soul-detail="${def.id}" tabindex="0" role="button" aria-label="${escapeHtml(def.name)} 상세 보기">
          <span class="slot-art soul-art"><img src="${soulArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(instance?.unlocked ? '魂' : String(percent))}</span>
          <div>
            <div class="pill-row">
              <span class="pill">${instance?.unlocked ? '해방' : `${progress}/${def.requiredKills}`}</span>
              <span class="pill">${percent}%</span>
            </div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)}</p>
            <div class="bar exp"><i style="width:${percent}%"></i><em>${percent}%</em></div>
          </div>
        </article>
      `;
    })
    .join('');
  return `<div class="soul-list">${rows}</div>`;
}

function renderAccount(snapshot: Snapshot) {
  const stats = snapshot.stats;
  const klass = classes[snapshot.save.classId];
  const expPercent = Math.min(100, Math.round((snapshot.save.exp / expToNext(snapshot.save.level)) * 100));
  return `
    <div class="account-box">
      <article class="account-panel character-stats-card">
        <div class="pill-row">
          <span class="pill">${escapeHtml(klass.name)}</span>
          <span class="pill">Lv.${snapshot.save.level}</span>
          <span class="pill">전투력 ${formatNumber(snapshot.power)}</span>
        </div>
        <h3>${escapeHtml(snapshot.save.name)}</h3>
        <p>HP ${Math.ceil(snapshot.save.hp)}/${stats.hp} · MP ${Math.floor(snapshot.save.mp)}/${stats.mp}</p>
        <p>공격 ${stats.atk} · 방어 ${stats.def} · 공속 ${stats.aspd} · 치명 ${Math.round(stats.crit * 100)}%</p>
        <div class="bar exp quest-progress"><i style="width:${expPercent}%"></i><em>EXP ${snapshot.save.exp}/${expToNext(snapshot.save.level)}</em></div>
        <div class="account-resonance-mini">${equipmentResonanceEffects(snapshot.save, items).map((effect) => `<span>${escapeHtml(effect.tier)} · ${escapeHtml(effect.title)}</span>`).join('') || '<span>장비 공명 대기</span>'}</div>
        <button data-account-action="save">수동 저장</button>
      </article>
      <article class="account-panel">
        <div class="pill-row">
          <span class="pill">환경설정</span><span class="pill">${snapshot.online ? '온라인' : '로컬'}</span>
          <span class="pill">${escapeHtml(snapshot.userLabel)}</span>
          <span class="pill">${escapeHtml(klass.skillName)}</span>
        </div>
        <p>캐릭터 능력치는 위 카드에서 확인하고, 계정 저장과 사운드 옵션은 환경설정 영역에서 관리합니다.</p>
        <button data-account-action="google">Google 연결</button>
        <button data-account-action="guest">게스트 클라우드</button>
        <button data-account-action="logout">로그아웃</button>
      </article>
      ${renderAutoHuntSettingsPanel(snapshot.save)}
      ${renderAudioSettingsPanel('field')}
    </div>
  `;
}

function renderCharacterSummary() {
  document.querySelectorAll<HTMLButtonElement>('[data-class]').forEach((button) => {
    button.classList.toggle('active', button.dataset.class === selectedClass);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-gender]').forEach((button) => {
    button.classList.toggle('active', button.dataset.gender === selectedGender);
  });
  const klass = classes[selectedClass];
  const genderLabel = selectedGender === 'female' ? '여자' : '남자';
  characterSummary.innerHTML = `
    <b>${escapeHtml(klass.name)} · ${genderLabel} · ${escapeHtml(klass.roleText)}</b><br />
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
                <em>Lv.${save.level} · ${escapeHtml(klass.name)} · ${(save.gender || 'male') === 'female' ? '여자' : '남자'} · ${formatGold(save.gold)}</em>
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
  const gender = creatingCharacter ? selectedGender : selected?.gender || pendingSave?.gender || selectedGender;
  const genderLabel = gender === 'female' ? '여자' : '남자';
  worldServerText.textContent = selectedServer === 'bearfox' ? SERVER_NAME : SERVER_NAME;
  worldCharacterText.textContent = creatingCharacter
    ? nameInput.value.trim() || suggestedCharacterName()
    : selected?.name || pendingSave?.name || '캐릭터 선택 필요';
  worldClassText.textContent = `${klass.name} · ${genderLabel} · ${klass.roleText}`;
}
function renderTown(save: PlayerSave | null) {
  if (!save) return;
  const klass = classes[save.classId];
  townHeroGlyph.textContent = klass.glyph;
  setClassPortraitArt(townHeroGlyph, save.classId, save.gender || 'male');
  townHeroName.textContent = save.name;
  townHeroMeta.textContent = `Lv.${save.level} · ${klass.name} · ${(save.gender || 'male') === 'female' ? '여자' : '남자'} · HP ${save.hp} / MP ${save.mp}`;
  townGoldText.textContent = formatGold(save.gold);
  townGemText.textContent = formatSoul(save.gems);
  townPowerText.textContent = `전투력 ${formatNumber(powerFromSave(save))}`;
  renderTownStorySnapshot(save);
  renderTownGatePreview(save);
  updateZoneLocks(save);
  if (townContentOpen) renderTownContent();
}


function renderTownGatePreview(save: PlayerSave) {
  const list = document.querySelector<HTMLElement>('.town-zone-panel .zone-list');
  if (!list) return;
  const currentQuest = currentStoryQuest(save);
  const recommended = currentQuest ? recommendedZoneForQuest(save, currentQuest) : null;
  list.innerHTML = zones
    .map((zone) => {
      const unlocked = isZoneUnlocked(save, zone.id);
      const active = recommended?.id === zone.id;
      const monsterText = zone.monsterIds
        .map((monsterId) => monsters.find((monster) => monster.id === monsterId)?.name || monsterId)
        .slice(0, 3)
        .join(' · ');
      return `
        <button class="zone-card town-gate-zone ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-zone-id="${zone.id}" data-town-zone-enter="${zone.id}" ${unlocked ? '' : 'disabled'}>
          <em>${escapeHtml(zone.badge)}</em>
          <b>${escapeHtml(zone.title)}</b>
          <span>Lv.${zone.recommendedLevel} · ${escapeHtml(monsterText)} · ${unlocked ? '입장 가능' : '잠김'}</span>
        </button>
      `;
    })
    .join('');
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

function closeTownMoreMenu() {
  townMoreMenu.classList.add('hidden');
  townMoreMenu.setAttribute('aria-hidden', 'true');
  townMoreBtn.setAttribute('aria-expanded', 'false');
  townMoreBtn.classList.remove('active');
  document.body.classList.remove('town-more-open');
}

function syncTownMenuState() {
  const visible = townContentOpen ? activeTownContent : '';
  document.querySelectorAll<HTMLElement>('[data-town-content]').forEach((button) => {
    button.classList.toggle('active', button.dataset.townContent === visible);
  });
  document.querySelectorAll<HTMLElement>('[data-town-more-content]').forEach((button) => {
    button.classList.toggle('active', button.dataset.townMoreContent === visible);
  });
  const coreMenus: TownContentId[] = ['hunt', 'inventory', 'skills', 'cards'];
  townMoreBtn.classList.toggle('active', Boolean(visible) && !coreMenus.includes(visible as TownContentId));
}


function openTownContent(content: TownContentId) {
  if (townContentOpen && activeTownContent === content) {
    closeTownContentPanel();
    return;
  }
  closeTownMoreMenu();
  activeTownContent = content;
  townContentOpen = true;
  document.body.classList.add('town-drawer-open');
  townContentPanel.classList.remove('hidden');
  townContentPanel.setAttribute('aria-hidden', 'false');
  syncTownMenuState();
  renderTownContent();
}

function closeTownContentPanel() {
  townContentOpen = false;
  document.body.classList.remove('town-drawer-open');
  townContentPanel.classList.add('hidden');
  townContentPanel.setAttribute('aria-hidden', 'true');
  syncTownMenuState();
}

function renderTownContent() {
  if (!pendingSave) return;
  const titles: Record<TownContentId, [string, string]> = {
    hunt: ['FIELD GATE', '사냥터 선택'],
    story: ['MAIN STORY', '스토리 퀘스트'],
    cards: ['SOUL CODEX', '카드 도감'],
    inventory: ['BAG', '장비 가방'],
    skills: ['SOUL SKILL', '스킬 슬롯'],
    shop: ['MERCHANT', '루미나 상점'],
    boss: ['RAID', '월드 보스'],
    quests: ['DAILY REQUEST', '일일 의뢰'],
    settings: ['AUDIO MIXER', '사운드 설정'],
    account: ['ACCOUNT', '계정/저장']
  };
  townContentEyebrow.textContent = titles[activeTownContent][0];
  townContentTitle.textContent = titles[activeTownContent][1];
  if (activeTownContent === 'hunt') townContentBody.innerHTML = renderTownHunt(pendingSave);
  if (activeTownContent === 'story') townContentBody.innerHTML = renderTownStory(pendingSave);
  if (activeTownContent === 'cards') townContentBody.innerHTML = renderTownCards(pendingSave);
  if (activeTownContent === 'inventory') townContentBody.innerHTML = renderTownInventory(pendingSave);
  if (activeTownContent === 'skills') townContentBody.innerHTML = renderTownSkills(pendingSave);
  if (activeTownContent === 'shop') townContentBody.innerHTML = renderTownShop(pendingSave);
  if (activeTownContent === 'boss') townContentBody.innerHTML = renderTownBoss(pendingSave);
  if (activeTownContent === 'quests') townContentBody.innerHTML = renderTownQuests(pendingSave);
  if (activeTownContent === 'settings') townContentBody.innerHTML = renderAutoHuntSettingsPanel(pendingSave) + renderAudioSettingsPanel('town');
  if (activeTownContent === 'account') townContentBody.innerHTML = renderTownAccount(pendingSave);
}



async function continueCurrentQuest(autoStart = true) {
  const save = game?.getSave() || pendingSave;
  if (!save) return;
  const quest = currentStoryQuest(save);
  if (!quest) {
    showToast('현재 준비된 스토리를 모두 완료했습니다.');
    return;
  }
  const progress = storyQuestProgress(save, quest);
  if (progress >= quest.target) {
    if (game) pendingSave = game.getSave();
    claimStoryQuest(quest.id);
    if (game && pendingSave) game.replaceSave(pendingSave);
    const next = pendingSave ? currentStoryQuest(pendingSave) : null;
    if (next?.unlockZoneId && pendingSave && storyQuestProgress(pendingSave, next) < next.target) {
      await startField(pendingSave, next.unlockZoneId, autoStart);
    }
    return;
  }
  if (quest.unlockZoneId) {
    const zone = zones.find((entry) => entry.id === quest.unlockZoneId);
    showToast(zone ? `${quest.title} · ${zone.title}로 이동` : '퀘스트 지역으로 이동');
    await startField(save, quest.unlockZoneId, autoStart);
    return;
  }
  if (document.body.classList.contains('town-active')) openTownContent('story');
  else showToast(`${quest.goalText} 진행 중`);
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
      await startField(pendingSave, quest.unlockZoneId, true);
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
  audioService.play('reward');
  persistTownSave();
  showToast(`${quest.title} 완료 · 보상 획득`);
  if (next?.unlockZoneId && pendingSave && storyQuestProgress(pendingSave, next) < next.target) {
    window.setTimeout(() => {
      if (pendingSave && document.body.classList.contains('town-active')) void startField(pendingSave, next.unlockZoneId, true);
    }, 450);
  }
}



function classSkillId(save: PlayerSave, token: string) {
  const classSkills = skills.filter((skill) => skill.classId === save.classId);
  if (token === 'class-basic') return classSkills[0]?.id || '';
  if (token === 'class-second') return classSkills[1]?.id || '';
  if (token === 'class-third') return classSkills[2]?.id || '';
  return token;
}

function skillRewardName(save: PlayerSave | undefined, token: string) {
  if (!save) return '스킬 각인';
  const id = classSkillId(save, token);
  const skill = skills.find((entry) => entry.id === id);
  return skill ? `${skill.name} 습득` : '스킬 각인';
}

function learnSkillReward(save: PlayerSave, token: string) {
  const id = classSkillId(save, token);
  if (!id) return false;
  const skill = skills.find((entry) => entry.id === id && entry.classId === save.classId);
  if (!skill) return false;
  save.learnedSkillIds ||= [];
  save.skillLevels ||= {};
  if (save.learnedSkillIds.includes(id)) {
    save.skillLevels[id] ||= 1;
    return false;
  }
  save.learnedSkillIds.push(id);
  save.skillLevels[id] = Math.max(1, save.skillLevels[id] || 1);
  return true;
}

function emptyKillRecord(): Record<any, number> {
  return { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0, shadowImp: 0, mossGolem: 0, wraith: 0, fireDrake: 0, stormHarpy: 0, graveKnight: 0, fieldBoss: 0 };
}

function applyStoryReward(save: PlayerSave, reward: (typeof storyQuests)[number]['reward']) {
  if (reward.gold) save.gold += reward.gold;
  if (reward.gems) save.gems += reward.gems;
  if (reward.itemId) {
    for (let i = 0; i < (reward.itemCount || 1); i += 1) addInventoryItem(save, reward.itemId);
  }
  if (reward.skillId) learnSkillReward(save, reward.skillId);
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
  if (reward.gold) parts.push(formatGold(reward.gold));
  if (reward.gems) parts.push(`소울젬 ${formatNumber(reward.gems)}`);
  if (reward.itemId) {
    const def = items.find((item) => item.id === reward.itemId);
    parts.push(`${def ? def.name : reward.itemId} x${reward.itemCount || 1}`);
  }
  if (reward.skillId) parts.push(skillRewardName(pendingSave || undefined, reward.skillId));
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

function renderTownHunt(save: PlayerSave) {
  const rows = zones
    .map((zone, index) => {
      const unlocked = isZoneUnlocked(save, zone.id);
      const lockedText = unlocked ? '입장 가능' : '잠김';
      const monsterText = zone.monsterIds
        .map((monsterId) => monsters.find((monster) => monster.id === monsterId)?.name || monsterId)
        .slice(0, 3)
        .join(' · ');
      return `
        <button class="zone-card drawer-zone-card ${unlocked ? '' : 'locked'}" data-town-zone-enter="${zone.id}" ${unlocked ? '' : 'disabled'}>
          <em>${String(index + 1).padStart(2, '0')}</em>
          <b>${escapeHtml(zone.title)}</b>
          <span>권장 Lv.${zone.recommendedLevel} · ${escapeHtml(monsterText)} · ${lockedText}</span>
        </button>
      `;
    })
    .join('');
  return `
    ${renderHuntRecommendation(save)}
    <div class="town-content-note">필드 게이트에서 사냥터를 선택하세요. 추천 사냥터는 현재 스토리/레벨/몬스터 목표를 기준으로 자동 표시됩니다.</div>
    <div class="zone-list zone-list-v2 drawer-zone-list">${rows}</div>
  `;
}

function renderHuntRecommendation(save: PlayerSave) {
  const quest = currentStoryQuest(save);
  const activeZone = quest ? recommendedZoneForQuest(save, quest) : null;
  const readyDailies = dailyQuests.filter((entry) => !save.daily.claimedQuestIds.includes(entry.id) && questProgress(save, entry.id) >= entry.target).slice(0, 3);
  const unlockedZones = zones.filter((zone) => isZoneUnlocked(save, zone.id));
  const highestZone = unlockedZones.at(-1) || zones[0];
  const zone = activeZone || highestZone;
  const progress = quest ? Math.min(quest.target, storyQuestProgress(save, quest)) : 0;
  const percent = quest ? Math.min(100, Math.round((progress / quest.target) * 100)) : 100;
  const dailyText = readyDailies.length
    ? readyDailies.map((entry) => escapeHtml(entry.title.replace(/^일일 · |^순환 · /, ''))).join(' · ')
    : '수령 가능한 의뢰 없음';
  return `
    <section class="hunt-recommend-card">
      <div class="hunt-recommend-medal">${escapeHtml(zone.badge)}</div>
      <div>
        <span class="town-eyebrow">AUTO GUIDE</span>
        <h3>${escapeHtml(zone.title)}</h3>
        <p>${quest ? `${escapeHtml(quest.title)} · ${escapeHtml(quest.goalText)}` : '현재 해금된 최고 사냥터에서 장비/카드/영혼 파밍을 이어가세요.'}</p>
        <div class="bar exp quest-progress"><i style="width:${percent}%"></i><em>${quest ? `${progress}/${quest.target}` : '프리 파밍'}</em></div>
        <p class="hunt-daily-ready">보상 대기: ${dailyText}</p>
      </div>
      <button class="wide-action primary" data-town-zone-enter="${zone.id}">추천 사냥터 입장</button>
    </section>
  `;
}

function recommendedZoneForQuest(save: PlayerSave, quest: ReturnType<typeof currentStoryQuest>) {
  if (!quest) return null;
  const direct = quest.unlockZoneId ? zones.find((zone) => zone.id === quest.unlockZoneId) : null;
  if (direct && isZoneUnlocked(save, direct.id)) return direct;
  if (quest.monsterId) {
    return [...zones]
      .reverse()
      .find((zone) => isZoneUnlocked(save, zone.id) && zone.monsterIds.includes(quest.monsterId || 'slime')) || zones[0];
  }
  return zones.find((zone) => isZoneUnlocked(save, zone.id) && zone.recommendedLevel <= save.level) || zones[0];
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
    <div class="town-content-note">카드 보관함 4x9 · 장착 ${equippedCount}/4 · 조합이 맞으면 세트 효과가 자동 발동합니다.</div>
    <div class="slot-grid card-slot-grid town-slot-grid">${fillSlots(cells, 36, '빈 카드 슬롯')}</div>
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
    ${renderEquipmentResonanceSummary(save, true)}
    ${renderPotionBeltSummary(save)}
    <div class="slot-toolbar"><span>가방 7x7 · ${save.inventory.length}/49 · ${formatGold(save.gold)} · ${formatSoul(save.gems)}</span><em>클릭: 상세 · 더블클릭: 장착/해제</em></div>
    <div class="slot-grid inventory-slot-grid town-slot-grid">${fillSlots(cells, 49, '빈 가방')}</div>
  `;
}


function renderPotionBeltSummary(save: PlayerSave) {
  const potionIds = ['hp-potion-small', 'hp-potion-mid', 'hp-potion-high', 'mp-potion-small', 'mp-potion-mid', 'mp-potion-high'];
  const rows = potionIds
    .map((itemId) => {
      const def = items.find((item) => item.id === itemId);
      if (!def) return '';
      const count = materialCount(save, itemId);
      const mode = def.consume?.hpPercent ? 'HP' : 'MP';
      const power = Math.round(((def.consume?.hpPercent || def.consume?.mpPercent || 0) * 100));
      return `<article class="potion-belt-cell ${count > 0 ? 'ready' : 'empty'}"><span>${mode}</span><b>${escapeHtml(def.name)}</b><em>${power}% · ${count}개</em></article>`;
    })
    .join('');
  return `
    <section class="potion-belt-summary">
      <div><span>POTION BELT</span><h3>자동 물약 벨트</h3><p>필드 단축키와 자동사냥이 보유 물약 중 상황에 맞는 등급을 선택합니다.</p></div>
      <div class="potion-belt-grid">${rows}</div>
    </section>
  `;
}


function autoSettingsForSave(save: PlayerSave): AutoHuntSettings {
  const source = save.autoSettings || {} as Partial<AutoHuntSettings>;
  return {
    useSkills: typeof source.useSkills === 'boolean' ? source.useSkills : true,
    useHpPotion: typeof source.useHpPotion === 'boolean' ? source.useHpPotion : true,
    useMpPotion: typeof source.useMpPotion === 'boolean' ? source.useMpPotion : true,
    hpPotionRatio: clampRatio(source.hpPotionRatio, 0.42, 0.18, 0.72),
    mpPotionRatio: clampRatio(source.mpPotionRatio, 0.28, 0.12, 0.62),
    bossPriority: typeof source.bossPriority === 'boolean' ? source.bossPriority : false
  };
}

function clampRatio(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function percentLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

function renderAutoHuntSettingsPanel(save: PlayerSave) {
  const settings = autoSettingsForSave(save);
  const toggle = (key: keyof Pick<AutoHuntSettings, 'useSkills' | 'useHpPotion' | 'useMpPotion' | 'bossPriority'>, label: string, desc: string) => `
    <button class="auto-setting-toggle ${settings[key] ? 'active' : ''}" data-auto-setting="${key}">
      <span>${settings[key] ? 'ON' : 'OFF'}</span><b>${label}</b><em>${desc}</em>
    </button>`;
  const ratioButton = (kind: 'hp' | 'mp', value: number) => {
    const current = kind === 'hp' ? settings.hpPotionRatio : settings.mpPotionRatio;
    return `<button class="auto-ratio-btn ${Math.abs(current - value) < 0.001 ? 'active' : ''}" data-auto-ratio="${kind}:${value}">${percentLabel(value)}</button>`;
  };
  return `
    <section class="auto-tactics-panel">
      <div class="auto-tactics-head">
        <span>AUTO TACTICS</span>
        <h3>자동사냥 세부 설정</h3>
        <p>스킬 사용, 물약 사용 기준, 보스 우선 타겟팅을 조절합니다.</p>
      </div>
      <div class="auto-toggle-grid">
        ${toggle('useSkills', '자동 스킬', '쿨타임/MP 조건 충족 시 사용')}
        ${toggle('useHpPotion', 'HP 물약', `현재 기준 ${percentLabel(settings.hpPotionRatio)} 이하`)}
        ${toggle('useMpPotion', 'MP 물약', `현재 기준 ${percentLabel(settings.mpPotionRatio)} 이하`)}
        ${toggle('bossPriority', '보스 우선', '필드보스/드레이크를 먼저 추적')}
      </div>
      <div class="auto-ratio-grid">
        <div><b>HP 물약 기준</b><span>${[0.30, 0.42, 0.55, 0.65].map((value) => ratioButton('hp', value)).join('')}</span></div>
        <div><b>MP 물약 기준</b><span>${[0.18, 0.28, 0.40, 0.52].map((value) => ratioButton('mp', value)).join('')}</span></div>
      </div>
    </section>
  `;
}

function handleAutoSettingAction(button: HTMLButtonElement) {
  const save = game?.getSave() || pendingSave;
  if (!save) return;
  const current = autoSettingsForSave(save);
  const patch: Partial<AutoHuntSettings> = {};
  const toggleKey = button.dataset.autoSetting as keyof AutoHuntSettings | undefined;
  if (toggleKey && toggleKey in current && typeof current[toggleKey] === 'boolean') {
    (patch as Record<string, boolean>)[toggleKey] = !current[toggleKey as keyof AutoHuntSettings];
  }
  const ratio = button.dataset.autoRatio;
  if (ratio) {
    const [kind, rawValue] = ratio.split(':');
    const value = Number(rawValue);
    if (kind === 'hp') patch.hpPotionRatio = clampRatio(value, current.hpPotionRatio, 0.18, 0.72);
    if (kind === 'mp') patch.mpPotionRatio = clampRatio(value, current.mpPotionRatio, 0.12, 0.62);
  }
  if (!Object.keys(patch).length) return;
  if (game) {
    game.setAutoSettings(patch);
    pendingSave = game.getSave();
  } else if (pendingSave) {
    pendingSave.autoSettings = autoSettingsForSave({ ...pendingSave, autoSettings: { ...current, ...patch } });
    persistTownSave();
  }
  if (sheetOpen) renderSheet();
  if (townContentOpen) renderTownContent();
  if (pendingSave) renderTown(pendingSave);
}

function exchangeBossTrophy(kind: string) {
  if (!pendingSave) return;
  const isElite = kind === 'elite';
  const cost = isElite ? 5 : 2;
  if (materialCount(pendingSave, 'boss-trophy') < cost) {
    showToast(`균열 토벌 훈장이 부족합니다. 필요 ${cost}개`);
    return;
  }
  consumeMaterial(pendingSave, 'boss-trophy', cost);
  if (isElite) {
    pendingSave.gold += 3800;
    pendingSave.gems += 24;
    addInventoryItem(pendingSave, 'enhance-stone', 6);
    addInventoryItem(pendingSave, 'soul-shard', 10);
    addInventoryItem(pendingSave, 'hp-potion-high', 8);
    addInventoryItem(pendingSave, 'mp-potion-high', 6);
  } else {
    pendingSave.gold += 1200;
    pendingSave.gems += 8;
    addInventoryItem(pendingSave, 'enhance-stone', 2);
    addInventoryItem(pendingSave, 'hp-potion-high', 4);
    addInventoryItem(pendingSave, 'mp-potion-high', 3);
  }
  audioService.play('reward');
  persistTownSave();
  flashActionFeedback(isElite ? '정예 보상 교환' : '보급 보상 교환');
  showLootPresentation({ type: 'item', title: isElite ? '정예 보스 상자' : '보스 보급 상자', subtitle: `훈장 ${cost}개 교환 완료`, art: itemArtUrl(items.find((item) => item.id === 'boss-trophy') || items[0]), rarity: isElite ? 'SSR' : 'SR' });
  showToast(isElite ? '정예 보스 상자 교환 완료' : '보스 보급 상자 교환 완료');
}

function renderEquipmentResonanceSummary(save: PlayerSave, townMode = false) {
  const effects = equipmentResonanceEffects(save, items);
  const gear = ['weapon', 'armor', 'relic'] as EquipmentSlot[];
  const gearRows = gear.map((slot) => {
    const uidValue = save.equipment?.[slot];
    const instance = uidValue ? save.inventory.find((entry) => entry.uid === uidValue) : null;
    const def = instance ? items.find((item) => item.id === instance.itemId) : null;
    const enhance = uidValue ? save.enhancements?.[uidValue] || 0 : 0;
    const label: Record<EquipmentSlot, string> = { weapon: '무기', armor: '방어구', relic: '유물' };
    return `<span><b>${label[slot]}</b><em>${def ? `${escapeHtml(def.name)} +${enhance}` : '비어 있음'}</em></span>`;
  }).join('');
  const effectRows = effects.length
    ? effects.map((effect) => `<article class="resonance-effect active"><strong>${escapeHtml(effect.tier)}</strong><div><b>${escapeHtml(effect.title)}</b><em>${escapeHtml(resonanceBonusText(effect.bonus))}</em></div></article>`).join('')
    : '<article class="resonance-effect locked"><strong>LOCK</strong><div><b>장비 공명 대기</b><em>무기·방어구·유물을 모두 장착하세요.</em></div></article>';
  const action = townMode ? '<button class="resonance-dismantle-btn" data-town-dismantle-duplicates="1">중복 장비 분해</button>' : '';
  return `
    <section class="equipment-resonance-panel">
      <div class="resonance-head">
        <div><span>GEAR RESONANCE</span><h3>장비 공명</h3></div>
        ${action}
      </div>
      <div class="resonance-gear-row">${gearRows}</div>
      <div class="resonance-effect-list">${effectRows}</div>
      <p>${escapeHtml(nextEquipmentResonanceHint(save, items))}</p>
    </section>
  `;
}

function renderTownInventoryRow(save: PlayerSave, def: ItemDefinition, uidValue: string, count: number) {
  const slot = def.type as EquipmentSlot;
  const canEquip = def.type === 'weapon' || def.type === 'armor' || def.type === 'relic';
  const equipped = canEquip && save.equipment?.[slot] === uidValue;
  const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료', skillbook: '스킬서', consumable: '소모품' };
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
    { itemId: 'hp-potion-small', price: 7, label: 'HP 2% 회복' },
    { itemId: 'mp-potion-small', price: 9, label: 'MP 2% 회복' },
    { itemId: 'hp-potion-mid', price: 20, label: 'HP 3.5% 회복' },
    { itemId: 'mp-potion-mid', price: 24, label: 'MP 3.5% 회복' },
    { itemId: 'hp-potion-high', price: 48, label: 'HP 5% 회복' },
    { itemId: 'mp-potion-high', price: 56, label: 'MP 5% 회복' },
    { itemId: 'skillbook-basic', price: 180, label: '1번 스킬 습득' },
    { itemId: 'skillbook-second', price: 850, label: '2번 스킬 습득' },
    { itemId: 'skillbook-third', price: 2600, label: '3번 스킬 습득' },
    { itemId: 'iron-sword', price: 180, label: '초반 무기 보강' },
    { itemId: 'moon-blade', price: 560, label: 'R 무기' },
    { itemId: 'crystal-mail', price: 620, label: 'R 방어구' },
    { itemId: 'fox-charm', price: 900, label: '유물 슬롯' },
    { itemId: 'soul-shard', price: 120, label: '강화 재료' },
    { itemId: 'enhance-stone', price: 420, label: '+10 이후 재료' }
  ];
  const rows = stock
    .flatMap((entry) => {
      const def = items.find((item) => item.id === entry.itemId);
      return def ? [{ ...entry, def }] : [];
    })
    .map(({ def, price, label }) => {
      const soldOut = isSkillBookSoldOut(save, def);
      const disabled = soldOut || save.gold < price ? 'disabled' : '';
      const bulkDisabled = soldOut || save.gold < price * 5 || def.type === 'skillbook' ? 'disabled' : '';
      const buyLabel = soldOut ? '품절' : save.gold < price ? '골드 부족' : '구매';
      const bulkLabel = def.type === 'skillbook' ? '1회 한정' : `5개 ${formatGold(price * 5)}`;
      return `
        <article class="shop-row ${soldOut ? 'sold-out' : ''}">
          <span class="shop-item-art"><img src="${itemArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(itemIcon(def.type))}</span>
          <div>
            <div class="pill-row"><span class="pill">${def.rarity}</span><span class="pill">${label}</span>${soldOut ? '<span class="pill">습득 완료</span>' : ''}</div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)} · 가격 ${formatGold(price)}</p>
          </div>
          <div class="shop-buy-actions">
            <button ${disabled} data-town-shop-buy="${def.id}">${buyLabel}</button>
            <button ${bulkDisabled} data-town-shop-buy-bulk="${def.id}" data-town-shop-count="5">${bulkLabel}</button>
          </div>
        </article>
      `;
    })
    .join('');
  return `
    <div class="town-content-note">보유 골드 ${formatGold(save.gold)} · 소모품/재료는 5개 묶음 구매를 지원합니다.</div>
    ${renderPotionBeltSummary(save)}
    <div class="shop-list">${rows}</div>
  `;
}

function isSkillBookSoldOut(save: PlayerSave, def: ItemDefinition) {
  if (def.type !== 'skillbook' || !def.skillId) return false;
  const id = classSkillId(save, def.skillId);
  return Boolean(id && save.learnedSkillIds?.includes(id));
}

function renderTownBoss(save: PlayerSave) {
  const dragon = monsters.find((monster) => monster.id === 'dragon');
  const fieldBoss = monsters.find((monster) => monster.id === 'fieldBoss');
  const bear = monsters.find((monster) => monster.id === 'crystalBear');
  const trophyCount = materialCount(save, 'boss-trophy');
  const canSupply = trophyCount >= 2;
  const canElite = trophyCount >= 5;
  return `
    <div class="boss-panel boss-bounty-panel">
      <div class="boss-emblem">RAID</div>
      <div>
        <div class="pill-row">
          <span class="pill">권장 Lv.16+</span>
          <span class="pill">훈장 ${trophyCount}개</span>
          <span class="pill">내 Lv.${save.level}</span>
        </div>
        <h3>균열 토벌 현상금</h3>
        <p>필드보스와 심연룡을 토벌해 균열 토벌 훈장을 모으고, 마을에서 보스 보급 상자로 교환하세요.</p>
        ${fieldBoss ? `<p>필드보스: ${escapeHtml(fieldBoss.name)} · Lv.${fieldBoss.level} · 훈장 드랍</p>` : ''}
        ${dragon ? `<p>심연룡: ${escapeHtml(dragon.name)} · Lv.${dragon.level} · 훈장 고확률 드랍</p>` : ''}
        ${bear ? `<p>중간 보스: ${escapeHtml(bear.name)} · Lv.${bear.level}</p>` : ''}
        <div class="boss-bounty-actions">
          <button class="wide-action primary" data-town-zone-enter="crystal-raid">수정 레이드 터 입장</button>
          <button class="wide-action" ${canSupply ? '' : 'disabled'} data-town-boss-exchange="supply">훈장 2개 · 보급 상자</button>
          <button class="wide-action" ${canElite ? '' : 'disabled'} data-town-boss-exchange="elite">훈장 5개 · 정예 상자</button>
        </div>
      </div>
    </div>
    <section class="bounty-reward-grid">
      <article><b>보급 상자</b><span>골드 1,200 · 소울젬 8 · 강화석 2 · 상급 물약 보급</span></article>
      <article><b>정예 상자</b><span>골드 3,800 · 소울젬 24 · 강화석 6 · 소울 파편 10 · 장비 성장 재료</span></article>
    </section>
    ${renderAutoHuntSettingsPanel(save)}
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

function rewardText(reward: { gold?: number; gems?: number; itemId?: string; itemCount?: number; skillId?: string }) {
  const parts: string[] = [];
  if (reward.gold) parts.push(formatGold(reward.gold));
  if (reward.gems) parts.push(`소울젬 ${formatNumber(reward.gems)}`);
  if (reward.itemId) {
    const def = items.find((item) => item.id === reward.itemId);
    parts.push(`${def ? def.name : reward.itemId} x${reward.itemCount || 1}`);
  }
  if (reward.skillId) parts.push(skillRewardName(pendingSave || undefined, reward.skillId));
  return parts.join(' · ') || '없음';
}

function claimDailyQuest(questId: string) {
  if (!pendingSave) return;
  const quest = dailyQuests.find((entry) => entry.id === questId);
  if (!quest) return;
  pendingSave.daily ||= { dateKey: todayKey(), kills: emptyKillRecord(), claimedQuestIds: [] };
  if (pendingSave.daily.dateKey !== todayKey()) {
    pendingSave.daily = { dateKey: todayKey(), kills: emptyKillRecord(), claimedQuestIds: [] };
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
  audioService.play('reward');
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
  const klass = classes[save.classId];
  const stats = calculateStatsFromSave(save);
  const expNeed = expToNext(save.level);
  const expPercent = Math.min(100, Math.round((save.exp / expNeed) * 100));
  const equippedItems = Object.values(save.equipment || {}).filter(Boolean).length;
  const equippedCards = save.cards.filter((card) => card.equipped).length;
  const unlockedSouls = save.souls.filter((soul) => soul.unlocked).length;
  return `
    <div class="account-box town-account-box">
      <article class="account-panel character-stats-card town-character-profile-card">
        <div class="profile-card-head">
          <span class="profile-portrait class-${save.classId} gender-${save.gender || 'male'}"></span>
          <div>
            <div class="pill-row">
              <span class="pill">${escapeHtml(klass.name)}</span>
              <span class="pill">Lv.${save.level}</span>
              <span class="pill">전투력 ${formatNumber(powerFromSave(save))}</span>
              <span class="pill">${(save.gender || 'male') === 'female' ? '여자' : '남자'}</span>
            </div>
            <h3>${escapeHtml(save.name)}</h3>
            <p>HP ${Math.ceil(save.hp)}/${stats.hp} · MP ${Math.floor(save.mp)}/${stats.mp}</p>
            <p>공격 ${stats.atk} · 방어 ${stats.def} · 공속 ${stats.aspd} · 치명 ${Math.round(stats.crit * 100)}%</p>
          </div>
        </div>
        <div class="bar exp quest-progress"><i style="width:${expPercent}%"></i><em>EXP ${save.exp}/${expNeed}</em></div>
        <div class="town-profile-mini-grid">
          <span><b>${equippedItems}</b><em>장비</em></span>
          <span><b>${equippedCards}/4</b><em>카드</em></span>
          <span><b>${unlockedSouls}</b><em>영혼</em></span>
          <span><b>${formatGold(save.gold)}</b><em>골드</em></span>
        </div>
      </article>
      <article class="account-panel town-account-save-card">
        <div class="pill-row">
          <span class="pill">${online ? '온라인' : '로컬'}</span>
          <span class="pill">${escapeHtml(saveService.userLabel())}</span>
          <span class="pill">슬롯 ${characterRoster.length}/${MAX_CHARACTER_SLOTS}</span>
          ${cloud.paused ? '<span class="pill">클라우드 보류</span>' : ''}
        </div>
        <p>캐릭터 정보와 저장 상태를 여기서 확인합니다. 클라우드 저장이 실패해도 로컬 저장은 계속 유지됩니다.</p>
        ${cloud.lastError ? `<p>최근 클라우드 오류: ${escapeHtml(cloud.lastError)}</p>` : ''}
        <button data-town-account-action="save">수동 저장</button>
      </article>
      ${renderAudioSettingsPanel('town')}
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
  if (!def) return;
  if (def.type === 'skillbook') {
    if (learnSkillReward(pendingSave, def.skillId || '')) {
      entry.count -= 1;
      if (entry.count <= 0) pendingSave.inventory = pendingSave.inventory.filter((item) => item.uid !== entry.uid);
      showToast(`${def.name} 사용 · 스킬 습득`);
      persistTownSave();
    } else {
      showToast('이미 배웠거나 현재 직업에 맞지 않는 스킬서입니다.');
    }
    return;
  }
  if (def.type === 'consumable') {
    const stats = calculateStatsFromSave(pendingSave);
    const healedHp = Math.ceil((def.consume?.hpPercent || 0) * stats.hp + (def.consume?.hpFlat || 0));
    const healedMp = Math.ceil((def.consume?.mpPercent || 0) * stats.mp + (def.consume?.mpFlat || 0));
    if (healedHp <= 0 && healedMp <= 0) { showToast('사용할 수 없는 소모품입니다.'); return; }
    pendingSave.hp = Math.min(stats.hp, pendingSave.hp + healedHp);
    pendingSave.mp = Math.min(stats.mp, pendingSave.mp + healedMp);
    entry.count -= 1;
    if (entry.count <= 0) pendingSave.inventory = pendingSave.inventory.filter((item) => item.uid !== entry.uid);
    audioService.play('confirm');
    persistTownSave();
    showToast(`${def.name} 사용 · ${healedHp ? `HP +${healedHp}` : ''}${healedHp && healedMp ? ' · ' : ''}${healedMp ? `MP +${healedMp}` : ''}`);
    return;
  }
  if (def.type === 'material') {
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
  if (!def || def.type === 'material' || def.type === 'skillbook' || def.type === 'consumable') {
    showToast('해당 아이템은 강화할 수 없습니다.');
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
    showToast(`골드 부족 · 필요 ${formatGold(cost.gold)}`);
    return;
  }
  if (cost.shard && materialCount(pendingSave, 'soul-shard') < cost.shard) {
    showToast(`소울 파편 부족 · 필요 ${cost.shard}개`);
    return;
  }
  if (cost.stone && materialCount(pendingSave, 'enhance-stone') < cost.stone) {
    showToast(`강화석 부족 · 필요 ${cost.stone}개`);
    return;
  }
  pendingSave.gold -= cost.gold;
  if (cost.shard) consumeMaterial(pendingSave, 'soul-shard', cost.shard);
  if (cost.stone) consumeMaterial(pendingSave, 'enhance-stone', cost.stone);
  const success = roll(cost.successRate);
  if (success) {
    pendingSave.enhancements[itemUid] = current + 1;
    repairTownVitals(pendingSave);
    audioService.play('enhance');
    showToast(`${def.name} +${current + 1} 강화 성공 · 확률 ${Math.round(cost.successRate * 100)}%`);
  } else {
    audioService.play('error');
    showToast(`${def.name} 강화 실패 · 확률 ${Math.round(cost.successRate * 100)}% · 단계 유지`);
  }
  persistTownSave();
}

function buyTownShopItem(itemId: string, amount = 1) {
  if (!pendingSave) return;
  const stock: Record<string, number> = {
    'hp-potion-small': 7,
    'mp-potion-small': 9,
    'hp-potion-mid': 20,
    'mp-potion-mid': 24,
    'hp-potion-high': 48,
    'mp-potion-high': 56,
    'skillbook-basic': 180,
    'skillbook-second': 850,
    'skillbook-third': 2600,
    'iron-sword': 180,
    'moon-blade': 560,
    'crystal-mail': 620,
    'fox-charm': 900,
    'soul-shard': 120,
    'enhance-stone': 420
  };
  const price = stock[itemId];
  const def = items.find((item) => item.id === itemId);
  if (!price || !def) return;
  if (isSkillBookSoldOut(pendingSave, def)) {
    audioService.play('error');
    showToast('이미 배운 스킬입니다. 스킬서는 품절 처리됩니다.');
    return;
  }
  const buyAmount = def.type === 'skillbook' ? 1 : Math.max(1, Math.min(99, Math.floor(amount || 1)));
  const totalPrice = price * buyAmount;
  if (pendingSave.gold < totalPrice) {
    audioService.play('error');
    showToast(`골드가 부족합니다. 필요 ${formatGold(totalPrice)}`);
    return;
  }
  pendingSave.gold -= totalPrice;
  if (def.type === 'skillbook' && def.skillId) {
    if (learnSkillReward(pendingSave, def.skillId)) {
      audioService.play('reward');
      persistTownSave();
      flashActionFeedback('스킬 습득');
      showLootPresentation({ type: 'skill', title: def.name, subtitle: '스킬 습득 완료', art: itemArtUrl(def), rarity: def.rarity });
      showToast(`${def.name} 구매 · 스킬 습득 완료`);
      return;
    }
    pendingSave.gold += totalPrice;
    audioService.play('error');
    showToast('현재 직업에서 배울 수 없는 스킬서입니다.');
    return;
  }
  addInventoryItem(pendingSave, itemId, buyAmount);
  audioService.play('buy');
  persistTownSave();
  flashActionFeedback('구매 완료');
  showLootPresentation({ type: 'item', title: def.name, subtitle: buyAmount > 1 ? `${buyAmount}개 가방에 보관됨` : '가방에 보관됨', art: itemArtUrl(def), rarity: def.rarity });
  showToast(`${def.name}${buyAmount > 1 ? ` x${buyAmount}` : ''} 구매 완료`);
}

function trainTownSkill(skillId: string) {
  if (!pendingSave) return;
  const skill = skills.find((entry) => entry.id === skillId && entry.classId === pendingSave?.classId);
  if (!skill) return;
  const learned = pendingSave.learnedSkillIds?.includes(skill.id);
  if (!learned) { showToast('먼저 스킬을 습득해야 합니다.'); return; }
  const level = skillLevel(pendingSave, skill.id);
  if (level >= SKILL_MAX_LEVEL) { showToast('이미 최대 숙련입니다.'); return; }
  const cost = skillMasteryCost(level);
  if (pendingSave.level < Math.max(skill.unlockLevel, cost.levelReq)) { showToast(`Lv.${Math.max(skill.unlockLevel, cost.levelReq)}부터 강화할 수 있습니다.`); return; }
  if (pendingSave.gold < cost.gold) { showToast(`골드 부족 · 필요 ${formatGold(cost.gold)}`); return; }
  if (materialCount(pendingSave, 'soul-shard') < cost.shard) { showToast(`소울 파편 부족 · 필요 ${cost.shard}개`); return; }
  if (materialCount(pendingSave, 'enhance-stone') < cost.stone) { showToast(`강화석 부족 · 필요 ${cost.stone}개`); return; }
  pendingSave.gold -= cost.gold;
  consumeMaterial(pendingSave, 'soul-shard', cost.shard);
  if (cost.stone) consumeMaterial(pendingSave, 'enhance-stone', cost.stone);
  pendingSave.skillLevels ||= {};
  pendingSave.skillLevels[skill.id] = level + 1;
  audioService.play('enhance');
  showLootPresentation({ type: 'skill', title: skill.name, subtitle: `숙련 Lv.${level + 1} 달성`, art: skillArtUrl(skill), rarity: level + 1 >= SKILL_MAX_LEVEL ? 'UR' : 'SR' });
  persistTownSave();
  showToast(`${skill.name} 숙련 Lv.${level + 1}`);
}

function persistTownSave() {
  if (!pendingSave) return;
  pendingSave.updatedAt = Date.now();
  saveService.saveLocal(pendingSave);
  refreshCharacterRoster(pendingSave.saveId);
  renderTown(pendingSave);
  renderTownContent();
}

function addInventoryItem(save: PlayerSave, itemId: string, count = 1) {
  const amount = Math.max(1, Math.floor(count || 1));
  const found = save.inventory.find((item) => item.itemId === itemId);
  if (found) found.count += amount;
  else save.inventory.push({ uid: uid('item'), itemId, count: amount });
}

function dismantleTownDuplicateEquipment() {
  if (!pendingSave) return;
  const result = dismantleDuplicateEquipment(pendingSave);
  if (result.count <= 0) {
    showToast('분해할 중복 장비가 없습니다. 장비는 최소 1개씩 보존됩니다.');
    return;
  }
  if (result.gold) pendingSave.gold += result.gold;
  if (result.shards) addInventoryItem(pendingSave, 'soul-shard', result.shards);
  if (result.stones) addInventoryItem(pendingSave, 'enhance-stone', result.stones);
  audioService.play('reward');
  showLootPresentation({ type: 'item', title: '중복 장비 분해', subtitle: `장비 ${result.count}개 · 파편 ${result.shards} · 강화석 ${result.stones}`, rarity: result.stones ? 'SR' : 'R' });
  persistTownSave();
  showToast(`중복 장비 ${result.count}개 분해 · ${formatGold(result.gold)} · 파편 ${result.shards} · 강화석 ${result.stones}`);
}

function dismantleDuplicateEquipment(save: PlayerSave) {
  const reward = { count: 0, gold: 0, shards: 0, stones: 0 };
  for (const entry of [...save.inventory]) {
    const def = items.find((item) => item.id === entry.itemId);
    if (!def || (def.type !== 'weapon' && def.type !== 'armor' && def.type !== 'relic')) continue;
    if (entry.count <= 1) continue;
    const extra = entry.count - 1;
    const value = dismantleRewardForRarity(def.rarity);
    entry.count = 1;
    reward.count += extra;
    reward.gold += value.gold * extra;
    reward.shards += value.shards * extra;
    reward.stones += value.stones * extra;
  }
  return reward;
}

function dismantleRewardForRarity(rarity: string) {
  if (rarity === 'UR') return { gold: 1200, shards: 6, stones: 3 };
  if (rarity === 'SSR') return { gold: 650, shards: 4, stones: 2 };
  if (rarity === 'SR') return { gold: 320, shards: 3, stones: 1 };
  if (rarity === 'R') return { gold: 150, shards: 2, stones: 0 };
  return { gold: 80, shards: 1, stones: 0 };
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
  applyEquipmentResonance(stats, equipmentResonanceEffects(save, items));

  const equippedItemIds = new Set(Object.values(save.equipment || {}));
  for (const entry of save.inventory) {
    if (!equippedItemIds.has(entry.uid)) continue;
    const def = items.find((item) => item.id === entry.itemId);
    if (!def || def.type === 'material' || def.type === 'skillbook' || def.type === 'consumable') continue;
    const enhanceLevel = save.enhancements?.[entry.uid] || 0;
    applyTownBonus(stats, def.bonus, 1 + enhanceLevel * 0.10);
    if (enhanceLevel > 0) applyTownBonus(stats, { atk: enhanceLevel * 1.4, def: enhanceLevel * 0.95, hp: enhanceLevel * 7 }, 1);
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

function installBrowserCompatibilityMode() {
  const ua = navigator.userAgent || '';
  const isKakao = /KAKAOTALK/i.test(ua);
  const isInApp = isKakao || /(FBAN|FBAV|Instagram|Line\/|NAVER|DaumApps)/i.test(ua);
  document.body.classList.toggle('kakao-inapp', isKakao);
  document.body.classList.toggle('inapp-browser', isInApp);
  browserSafeTip?.classList.add('hidden');
  browserSafeTip?.setAttribute('aria-hidden', 'true');
  if (browserSafeTip) browserSafeTip.textContent = '';

  const updateViewportClass = () => {
    const landscape = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('forced-landscape-safe', isKakao && landscape);
  };

  updateViewportClass();
  window.addEventListener('resize', updateViewportClass);
  window.addEventListener('orientationchange', () => window.setTimeout(updateViewportClass, 80));
}

async function requestWakeLock() {
  const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockHandle> } };
  if (!nav.wakeLock || wakeLockHandle) return;
  try {
    wakeLockHandle = await nav.wakeLock.request('screen');
    wakeLockHandle.addEventListener?.('release', () => {
      wakeLockHandle = null;
    });
  } catch (error) {
    console.warn('[WakeLock] screen lock skipped', error);
  }
}

async function releaseWakeLock() {
  if (!wakeLockHandle) return;
  try {
    await wakeLockHandle.release();
  } catch (error) {
    console.warn('[WakeLock] release skipped', error);
  } finally {
    wakeLockHandle = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.body.classList.contains('field-active')) void requestWakeLock();
});

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
    void lockPortraitMode();
  } catch (error) {
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


function bindDetailModal() {
  closeItemDetail.addEventListener('click', closeDetailModal);
  itemDetailModal.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-close-detail]')) closeDetailModal();

    const equipCard = target.closest<HTMLButtonElement>('[data-town-equip-card]');
    if (equipCard) { toggleTownCard(equipCard.dataset.townEquipCard || ''); closeDetailModal(); return; }
    const equipFieldCard = target.closest<HTMLButtonElement>('[data-equip-card]');
    if (equipFieldCard) { game?.equipCard(equipFieldCard.dataset.equipCard || ''); closeDetailModal(); return; }
    const equipItem = target.closest<HTMLButtonElement>('[data-town-equip-item]');
    if (equipItem) { toggleTownItem(equipItem.dataset.townEquipItem || ''); closeDetailModal(); return; }
    const equipFieldItem = target.closest<HTMLButtonElement>('[data-equip-item]');
    if (equipFieldItem) { game?.equipItem(equipFieldItem.dataset.equipItem || ''); closeDetailModal(); return; }
    const upgradeTown = target.closest<HTMLButtonElement>('[data-town-upgrade-item]');
    if (upgradeTown) { upgradeTownItem(upgradeTown.dataset.townUpgradeItem || ''); closeDetailModal(); return; }
    const upgradeField = target.closest<HTMLButtonElement>('[data-upgrade-item]');
    if (upgradeField) { game?.upgradeItem(upgradeField.dataset.upgradeItem || ''); closeDetailModal(); return; }
    const upgradeTownSkill = target.closest<HTMLButtonElement>('[data-town-upgrade-skill]');
    if (upgradeTownSkill) { trainTownSkill(upgradeTownSkill.dataset.townUpgradeSkill || ''); closeDetailModal(); return; }
    const upgradeFieldSkill = target.closest<HTMLButtonElement>('[data-upgrade-skill]');
    if (upgradeFieldSkill) { game?.upgradeSkill(upgradeFieldSkill.dataset.upgradeSkill || ''); closeDetailModal(); return; }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDetailModal();
  });
}

function closeDetailModal() {
  itemDetailModal.classList.add('hidden');
  itemDetailModal.setAttribute('aria-hidden', 'true');
  itemDetailActions.innerHTML = '';
}

function openDetailModal(options: { eyebrow: string; title: string; desc: string; stats: string; visual: string; actions?: string }) {
  itemDetailEyebrow.textContent = options.eyebrow;
  itemDetailTitle.textContent = options.title;
  itemDetailDesc.textContent = options.desc;
  itemDetailStats.innerHTML = options.stats;
  itemDetailVisual.innerHTML = options.visual;
  itemDetailActions.innerHTML = options.actions || '';
  itemDetailModal.classList.remove('hidden');
  itemDetailModal.setAttribute('aria-hidden', 'false');
}

function findCardByUid(uidValue: string, townMode: boolean) {
  const save = townMode ? pendingSave : latest?.save;
  if (!save) return null;
  const instance = save.cards.find((entry) => entry.uid === uidValue);
  if (!instance) return null;
  const def = cards.find((entry) => entry.id === instance.cardId);
  return def ? { save, instance, def } : null;
}

function findItemByUid(uidValue: string, townMode: boolean) {
  const save = townMode ? pendingSave : latest?.save;
  if (!save) return null;
  const instance = save.inventory.find((entry) => entry.uid === uidValue);
  if (!instance) return null;
  const def = items.find((entry) => entry.id === instance.itemId);
  return def ? { save, instance, def } : null;
}

function statChips(bonus: Partial<Stats>) {
  const labels: Array<[keyof Stats, string, (value: number) => string]> = [
    ['hp', 'HP', (value) => `+${Math.round(value)}`],
    ['mp', 'MP', (value) => `+${Math.round(value)}`],
    ['atk', '공격', (value) => `+${Math.round(value)}`],
    ['def', '방어', (value) => `+${Math.round(value)}`],
    ['aspd', '공속', (value) => `+${Math.round(value * 100)}%`],
    ['crit', '치명', (value) => `+${Math.round(value * 100)}%`],
    ['move', '이속', (value) => `+${value.toFixed(2)}`]
  ];
  const chips = labels
    .flatMap(([key, label, format]) => {
      const value = bonus[key];
      return typeof value === 'number' && value !== 0 ? [`<span><b>${label}</b><em>${format(value)}</em></span>`] : [];
    })
    .join('');
  return chips || '<span><b>효과</b><em>상세 없음</em></span>';
}

function openCardDetail(uidValue: string, townMode: boolean) {
  const found = findCardByUid(uidValue, townMode);
  if (!found) return;
  const { def, instance } = found;
  const actionAttr = townMode ? 'data-town-equip-card' : 'data-equip-card';
  openDetailModal({
    eyebrow: `${def.rarity} CARD · Lv.${instance.level}`,
    title: def.name,
    desc: `${def.effectText}\n보유 수량 x${instance.copies}${instance.equipped ? ' · 현재 장착 중' : ''}`,
    visual: `<img src="${def.art}" alt="${escapeHtml(def.name)}" />`,
    stats: statChips(def.bonus),
    actions: `<button class="wide-action primary" ${actionAttr}="${instance.uid}">${instance.equipped ? '카드 해제' : '카드 장착'}</button>`
  });
}

function openItemDetail(uidValue: string, townMode: boolean) {
  const found = findItemByUid(uidValue, townMode);
  if (!found) return;
  const { save, def, instance } = found;
  const canEquip = def.type === 'weapon' || def.type === 'armor' || def.type === 'relic';
  const slot = def.type as EquipmentSlot;
  const equipped = canEquip && save.equipment?.[slot] === instance.uid;
  const enhanceLevel = save.enhancements?.[instance.uid] || 0;
  const cost = enhancementCost(enhanceLevel);
  const actionAttr = townMode ? 'data-town-equip-item' : 'data-equip-item';
  const upgradeAttr = townMode ? 'data-town-upgrade-item' : 'data-upgrade-item';
  const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료', skillbook: '스킬서', consumable: '소모품' };
  const enhanceInfo = canEquip && enhanceLevel < MAX_ENHANCE_LEVEL
    ? `<span><b>다음 강화</b><em>+${cost.next} · ${Math.round(cost.successRate * 100)}%</em></span><span><b>비용</b><em>${formatGold(cost.gold)}${cost.shard ? ` · 파편 ${cost.shard}` : ''}${cost.stone ? ` · 강화석 ${cost.stone}` : ''}</em></span>`
    : canEquip ? '<span><b>강화</b><em>최대 강화</em></span>' : '';
  const compare = canEquip ? renderEquipmentCompare(save, instance.uid, slot, equipped) : '';
  const actions = canEquip
    ? `<button class="wide-action primary" ${actionAttr}="${instance.uid}">${equipped ? '장착 해제' : '장착하기'}</button><button class="wide-action" ${enhanceLevel >= MAX_ENHANCE_LEVEL ? 'disabled' : ''} ${upgradeAttr}="${instance.uid}">강화 ${enhanceLevel >= MAX_ENHANCE_LEVEL ? 'MAX' : `+${cost.next} · ${Math.round(cost.successRate * 100)}%`}</button>`
    : def.type === 'skillbook' ? `<button class="wide-action primary" ${actionAttr}="${instance.uid}">스킬 배우기</button>` : def.type === 'consumable' ? `<button class="wide-action primary" ${actionAttr}="${instance.uid}">사용하기</button>` : '';
  openDetailModal({
    eyebrow: `${def.rarity} ${typeLabel[def.type] || def.type} · x${instance.count}`,
    title: `${def.name}${canEquip ? ` +${enhanceLevel}` : ''}`,
    desc: `${def.effectText}${equipped ? '\n현재 장착 중입니다.' : ''}`,
    visual: `<span class="slot-art item-art item-art-${def.type}"><img src="${itemArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(itemIcon(def.type))}</span>`,
    stats: statChips(def.bonus) + enhanceInfo + compare,
    actions
  });
}

function renderEquipmentCompare(save: PlayerSave, uidValue: string, slot: EquipmentSlot, equipped: boolean) {
  const item = save.inventory.find((entry) => entry.uid === uidValue);
  const def = item ? items.find((entry) => entry.id === item.itemId) : null;
  if (!item || !def) return '';
  const currentUid = save.equipment?.[slot];
  const currentItem = currentUid ? save.inventory.find((entry) => entry.uid === currentUid) : null;
  const currentDef = currentItem ? items.find((entry) => entry.id === currentItem.itemId) : null;
  const before = calculateStatsFromSave(save);
  const nextSave = cloneSaveForPreview(save);
  nextSave.equipment ||= {};
  if (equipped) delete nextSave.equipment[slot];
  else nextSave.equipment[slot] = uidValue;
  const after = calculateStatsFromSave(nextSave);
  const currentEnhance = currentUid ? (save.enhancements?.[currentUid] || 0) : 0;
  const nextEnhance = save.enhancements?.[uidValue] || 0;
  const powerBefore = powerFromStats(before);
  const powerAfter = powerFromStats(after);
  const rows: Array<[keyof Stats, string, (value: number) => string]> = [
    ['hp', 'HP', (value) => `${Math.round(value)}`],
    ['mp', 'MP', (value) => `${Math.round(value)}`],
    ['atk', '공격', (value) => `${Math.round(value)}`],
    ['def', '방어', (value) => `${Math.round(value)}`],
    ['aspd', '공속', (value) => value.toFixed(2)],
    ['crit', '치명', (value) => `${Math.round(value * 100)}%`],
    ['move', '이속', (value) => value.toFixed(2)]
  ];
  const statRows = rows.map(([key, label, format]) => {
    const diff = Number((after[key] - before[key]).toFixed(3));
    const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
    const sign = diff > 0 ? '+' : '';
    const diffLabel = key === 'crit' ? `${sign}${Math.round(diff * 100)}%` : key === 'aspd' || key === 'move' ? `${sign}${diff.toFixed(2)}` : `${sign}${Math.round(diff)}`;
    return `<span class="compare-row ${cls}"><b>${label}</b><em>${format(before[key])} → ${format(after[key])}</em><strong>${diffLabel}</strong></span>`;
  }).join('');
  const powerDiff = powerAfter - powerBefore;
  const currentName = currentDef ? `${currentDef.name} +${currentEnhance}` : '비어 있음';
  const nextName = equipped ? '장착 해제' : `${def.name} +${nextEnhance}`;
  return `
    <div class="item-compare-panel">
      <h3>${equipped ? '해제 비교' : '장비 비교'}</h3>
      <div class="compare-summary">
        <span><b>현재</b><em>${escapeHtml(currentName)}</em></span>
        <span><b>변경</b><em>${escapeHtml(nextName)}</em></span>
        <span class="power-diff ${powerDiff >= 0 ? 'up' : 'down'}"><b>전투력</b><em>${formatNumber(powerBefore)} → ${formatNumber(powerAfter)}</em><strong>${powerDiff >= 0 ? '+' : ''}${formatNumber(powerDiff)}</strong></span>
      </div>
      <div class="compare-stat-grid">${statRows}</div>
    </div>
  `;
}

function cloneSaveForPreview(save: PlayerSave): PlayerSave {
  return JSON.parse(JSON.stringify(save)) as PlayerSave;
}

function powerFromStats(stats: Stats) {
  return Math.round(stats.hp * 0.42 + stats.mp * 0.12 + stats.atk * 9.5 + stats.def * 6.2 + stats.aspd * 70 + stats.crit * 520);
}

function openSkillDetail(skillId: string, townMode: boolean) {
  const save = townMode ? pendingSave : latest?.save;
  const def = skills.find((entry) => entry.id === skillId);
  if (!save || !def) return;
  const learned = save.learnedSkillIds?.includes(def.id);
  const levelReady = save.level >= def.unlockLevel;
  const level = skillLevel(save, def.id);
  const cost = level > 0 && level < SKILL_MAX_LEVEL ? skillMasteryCost(level) : null;
  const costText = cost ? `${formatGold(cost.gold)} · 파편 ${cost.shard}${cost.stone ? ` · 강화석 ${cost.stone}` : ''}` : level >= SKILL_MAX_LEVEL ? '최대 숙련' : '스킬서 필요';
  const upgradeAttr = townMode ? 'data-town-upgrade-skill' : 'data-upgrade-skill';
  const upgradeAction = learned
    ? `<button class="wide-action primary" ${level >= SKILL_MAX_LEVEL ? 'disabled' : ''} ${upgradeAttr}="${def.id}">${level >= SKILL_MAX_LEVEL ? '숙련 MAX' : canUpgradeSkill(save, def) ? '숙련 강화' : '조건 부족'}</button>`
    : '';
  openDetailModal({
    eyebrow: `${classes[def.classId].name} SKILL · ${learned ? `숙련 Lv.${level}` : '미습득'}`,
    title: def.name,
    desc: `${def.description}
숙련 효과: Lv마다 피해/회복 +14%, 쿨타임 -3.5%, MP 소모 -4.5%`,
    visual: `<span class="slot-art skill-art skill-art-${def.hotkey}"><img src="${skillArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(def.hotkey)}</span>`,
    stats: `<span><b>숙련</b><em>${level || 0}/${SKILL_MAX_LEVEL}</em></span><span><b>MP</b><em>${effectiveSkillMpCost(def, level)}</em></span><span><b>쿨타임</b><em>${effectiveSkillCooldown(def, level)}s</em></span><span><b>피해/회복</b><em>+${skillMasteryBonusPercent(level)}%</em></span><span><b>범위</b><em>${def.radius}</em></span><span><b>다음 비용</b><em>${costText}</em></span><span><b>상태</b><em>${!learned ? '스킬북 필요' : levelReady ? '사용 가능' : `Lv.${def.unlockLevel} 필요`}</em></span>`,
    actions: upgradeAction
  });
}

function openSoulDetail(soulId: string) {
  const save = latest?.save || pendingSave;
  const def = souls.find((entry) => entry.id === soulId);
  if (!save || !def) return;
  const instance = save.souls.find((entry) => entry.soulId === soulId);
  const progress = instance?.progress || save.kills[def.monsterId] || 0;
  openDetailModal({
    eyebrow: `${instance?.unlocked ? '해방 완료' : '영혼 각인'}`,
    title: def.name,
    desc: `${def.effectText}\n해방 조건: ${progress}/${def.requiredKills}`,
    visual: `<span class="slot-art soul-art"><img src="${soulArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon('魂')}</span>`,
    stats: statChips(def.bonus)
  });
}

function flashActionFeedback(_message: string) {
  // 0.32: 과한 중앙 확인 팝업 제거. 필요하면 각 기능별 toast/showLootPresentation만 사용합니다.
}

function showToast(message: string) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  window.clearTimeout(Number(toastEl.dataset.timer || 0));
  const timer = window.setTimeout(() => toastEl.classList.remove('show'), 2200);
  toastEl.dataset.timer = String(timer);
}


type LootPresentation = { type: string; title: string; subtitle?: string; art?: string; rarity?: string; amount?: number };

function bindLootPresentation() {
  document.addEventListener('soul:loot', (event) => {
    const detail = (event as CustomEvent<LootPresentation>).detail;
    showLootPresentation(normalizeLootPresentation(detail));
  });
}

function normalizeLootPresentation(detail: LootPresentation): LootPresentation {
  if (!detail) return { type: 'loot', title: '획득', rarity: 'N' };
  if (detail.type === 'item' && detail.title && !detail.art) {
    const item = items.find((entry) => entry.name === detail.title || entry.id === detail.title);
    if (item) return { ...detail, title: item.name, art: itemArtUrl(item), rarity: item.rarity };
  }
  if (detail.type === 'card' && detail.title && !detail.art) {
    const card = cards.find((entry) => entry.name === detail.title || entry.id === detail.title);
    if (card) return { ...detail, title: card.name, art: card.art, rarity: card.rarity };
  }
  return detail;
}

function showLootPresentation(detail: LootPresentation) {
  const rarity = (detail.rarity || (detail.type === 'gold' ? 'R' : detail.type === 'gem' ? 'SR' : 'N')).toLowerCase();
  const el = document.createElement('div');
  el.className = `loot-pop loot-${rarity}`;
  const art = detail.art
    ? `<span class="loot-art"><img src="${detail.art}" alt="${escapeHtml(detail.title)}" onerror="this.remove()" /></span>`
    : `<span class="loot-art loot-art-fallback">${detail.type === 'gold' ? '金' : detail.type === 'gem' ? '魂' : '★'}</span>`;
  el.innerHTML = `
    ${art}
    <span class="loot-copy"><b>${escapeHtml(detail.title)}</b><em>${escapeHtml(detail.subtitle || lootSubtitle(detail))}</em></span>
  `;
  document.body.appendChild(el);
  window.setTimeout(() => el.classList.add('show'), 20);
  window.setTimeout(() => { el.classList.remove('show'); window.setTimeout(() => el.remove(), 260); }, 1700);
}

function lootSubtitle(detail: LootPresentation) {
  if (detail.type === 'gold') return `${formatGold(detail.amount || 0)} 획득`;
  if (detail.type === 'gem') return `소울젬 ${formatNumber(detail.amount || 0)} 획득`;
  if (detail.type === 'card') return '몬스터 카드 드랍';
  if (detail.type === 'skill') return '스킬 습득 완료';
  return '가방에 보관됨';
}

function setClassPortraitArt(el: Element, classId: CharacterClassId, gender: CharacterGender = 'male') {
  el.classList.remove('class-warrior', 'class-taoist', 'class-cleric', 'gender-male', 'gender-female');
  el.classList.add(`class-${classId}`, `gender-${gender}`);
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
