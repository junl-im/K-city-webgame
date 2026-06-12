import './styles.css';
import './styles/alpha098.css';
import './styles/alpha099.css';
import './styles/alpha100.css';
import './styles/alpha101.css';
import './styles/alpha102.css';
import './styles/alpha103.css';
import './styles/alpha104.css';
import './styles/alpha105.css';
import './styles/alpha106.css';
import './styles/alpha107.css';
import './styles/alpha108.css';
import './styles/alpha109.css';
import './styles/alpha110.css';
import { MAP_H, MAP_W, MAX_ENHANCE_LEVEL, SKILL_MAX_LEVEL, cardSets, cards, classes, dailyQuests, enhancementCost, expToNext, items, monsters, pledgeExpToNext, skillMasteryCost, skills, souls, storyQuests, zones } from './data/gameData';
import { MAX_CHARACTER_SLOTS, SaveService } from './game/SaveService';
import { audioService } from './game/AudioService';
import { applyEquipmentResonance, equipmentResonanceEffects, nextEquipmentResonanceHint, resonanceBonusText } from './game/equipmentResonance';
import { formatGold, formatNumber, formatSoul, roll, uid } from './game/math';
import { buildActionLatencyLabel, buildConnectivityRows, classifyPerformance, inspectRuntimeAssets, inspectSaveIntegrity } from './ui/technicalHealth';
import { inspectContentGraph087 } from './ui/contentIntegrity';
import { renderSystemDoctor087, renderTechnicalHealthPanel087, type HealthTile087 } from './ui/healthPanelRenderer';
import { inventoryFilterForItem088, normalizeInventoryFilter088, normalizeShopFilter088, renderInventoryFilterRail088, renderShopFilterRail088, renderShopPurchaseConfirm088, shopFilterForItem088, summarizeRenderBudget088, type InventoryFilter088, type ShopFilter088, type ShopPurchaseDraft088 } from './ui/townPanelRenderer088';
import { renderSkillReadinessStrip089, renderSkillUpgradeConfirm089, renderSkillUpgradeHint089, summarizeSkillReadiness089, type SkillProgressRow089, type SkillUpgradeDraft089 } from './ui/skillPanelRenderer089';
import { buildPreloadPlan089, preloadAssetPlan089, summarizePreloadPlan089 } from './ui/assetPreload089';
import { ensureTitleEntry090, inspectTitleEntry090, markTitleEntryTransition090, titleEntryHealthLabel090 } from './ui/titleEntry090';
import { applyResourceBudgetState091, formatBudgetDelta091, inspectResourceBudget091, installDomImageBudgetPolicy091, shouldUseLiteRender091 } from './ui/assetBudget091';
import { applyCssBudgetState092, inspectCssBudget092, summarizeCssBudget092 } from './ui/cssBudget092';
import { inspectEntryRegression092, repairEntryRegressionClasses092 } from './ui/entryRegression092';
import { installVisualRescue093, syncVisualRoute093 } from './ui/visualRescue093';
import { installVisualConsolidation094 } from './ui/visualConsolidation094';
import { installVisualOverhaul095, syncVisualOverhaul095 } from './ui/visualOverhaul095';
import { installVisualStability096, syncVisualStability096, inspectVisualStability096 } from './ui/visualStability096';
import { installVisualMass097, syncVisualMass097, inspectVisualMass097 } from './ui/visualMass097';
import { installVisualClean098, syncVisualClean098, inspectVisualClean098 } from './ui/visualClean098';
import { installVisualArtPerf099, syncVisualArtPerf099, inspectVisualArt099 } from './ui/visualArtPerf099';
import { installFieldHudOverhaul100, syncFieldHudOverhaul100, inspectFieldHud100 } from './ui/fieldHudOverhaul100';
import { applyImageDecodePolicy101, inspectPerformance101, installPerformanceTuner101, syncPerformanceRoute101 } from './ui/performanceTuner101';
import { installSoulAssetKit102, inspectSoulAssetKit102, syncSoulAssetKit102 } from './ui/soulAssetKit102';
import { installPortraitFieldUx103, syncPortraitFieldUx103, inspectPortraitFieldUx103 } from './ui/portraitFieldUx103';
import { installQualityPass104, syncQualityPass104, inspectQualityPass104 } from './ui/qualityPass104';
import { installEngineQuality105, syncEngineQuality105, inspectEngineQuality105 } from './ui/engineQuality105';
import { installEngineOptimization106, syncEngineOptimization106, inspectEngineOptimization106, applyImagePolicy106 } from './ui/engineOptimization106';
import { installFinalOptimization107, syncFinalOptimization107, inspectFinalOptimization107, applyFinalImagePolicy107 } from './ui/finalOptimization107';
import { installMobileQuality108, syncMobileQuality108, inspectMobileQuality108 } from './ui/mobileQuality108';
import { installMaintenance109, syncMaintenance109, inspectMaintenance109 } from './ui/maintenance109';
import { installFieldLayout110, syncFieldLayout110, inspectFieldLayout110 } from './ui/fieldLayout110';
import { renderInventoryPanel111 } from './ui/InventoryUI';
import { closeMenuWindow111, installMenuWindowMotion111, openMenuWindow111, syncMenuWindowSafeFrame111 } from './ui/MenuWindow';
import { applySafeFrameBodyState087, auditSoulOnlineSafeFrame087 } from './ui/screenSafety';
import type { AutoHuntSettings, CardDefinition, CharacterClassId, CharacterGender, EquipmentSlot, EliteAffixId, ItemDefinition, PlayerSave, SheetTab, SkillDefinition, Snapshot, SoulDefinition, Stats } from './types';

type FlowStep = 'login' | 'server' | 'character' | 'town';
type TownContentId = 'hunt' | 'story' | 'cards' | 'inventory' | 'skills' | 'shop' | 'boss' | 'quests' | 'pledge' | 'settings' | 'account';

const townContentMeta: Record<TownContentId, { eyebrow: string; title: string; label: string; icon: string; core?: boolean }> = {
  hunt: { eyebrow: 'FIELD GATE', title: '사냥터 선택', label: '사냥', icon: '⌁', core: true },
  inventory: { eyebrow: 'BAG', title: '장비 가방', label: '가방', icon: '▤', core: true },
  skills: { eyebrow: 'SOUL SKILL', title: '스킬 슬롯', label: '스킬', icon: '✦', core: true },
  cards: { eyebrow: 'SOUL CODEX', title: '카드 도감', label: '카드', icon: '◆', core: true },
  story: { eyebrow: 'MAIN STORY', title: '스토리 퀘스트', label: '스토리', icon: '★' },
  quests: { eyebrow: 'DAILY REQUEST', title: '일일 의뢰', label: '의뢰', icon: '!' },
  shop: { eyebrow: 'MERCHANT', title: '루미나 상점', label: '상점', icon: '◈' },
  boss: { eyebrow: 'RAID', title: '월드 보스', label: '보스', icon: '♛' },
  pledge: { eyebrow: 'BLOOD PLEDGE', title: '혈맹 지휘소', label: '혈맹', icon: '⚑' },
  settings: { eyebrow: 'AUDIO MIXER', title: '사운드 설정', label: '설정', icon: '♫' },
  account: { eyebrow: 'ACCOUNT', title: '계정/저장', label: '계정', icon: '◎' }
};

const townDrawerOrder: TownContentId[] = ['hunt', 'inventory', 'skills', 'cards', 'story', 'quests', 'shop', 'boss', 'pledge', 'settings', 'account'];

const TOWN_SHOP_STOCK_088: Array<{ itemId: string; price: number; label: string }> = [
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
  { itemId: 'enhance-stone', price: 420, label: '+10 이후 재료' },
  { itemId: 'lumina-seal', price: 1200, label: '후반 전선 인장' },
  { itemId: 'radiant-ore', price: 3600, label: '최상급 강화 재료' }
];
const TOWN_SHOP_PRICE_088: Record<string, number> = Object.fromEntries(TOWN_SHOP_STOCK_088.map((entry) => [entry.itemId, entry.price]));

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
const ALPHA_VERSION = '1.11.0';
let activeSheetTab: SheetTab = 'cards';
let activeTownContent: TownContentId = 'hunt';
let sheetOpen = false;
let townContentOpen = false;
let townRouteBusy = false;
type WakeLockHandle = { release: () => Promise<void>; addEventListener?: (type: 'release', listener: () => void) => void };
let wakeLockHandle: WakeLockHandle | null = null;


type ClientIssue = { time: number; type: 'error' | 'promise' | 'ui' | 'perf' | 'network' | 'storage'; message: string };
const clientIssues: ClientIssue[] = [];
let measuredFps = 60;
let lastFrameMs = performance.now();
let fpsFrames = 0;
let fpsWindowMs = performance.now();
let uiAuditPending = false;
let lastUiAuditMessage = 'UI 안전 영역 정상';
let lastUiAuditAt = 0;
let longTaskCount085 = 0;
let lastLongTaskMs085 = 0;
let lastIssueSignature085 = '';
let lastIssueAt085 = 0;
let storageEstimate085: { usedMB: number; quotaMB: number; percent: number; available: boolean } = { usedMB: 0, quotaMB: 0, percent: 0, available: false };
let networkState085 = navigator.onLine ? '온라인' : '오프라인';
let lastActionAt086 = 0;
let serviceWorkerReady086 = false;
let lastUiAuditReport086 = 'UI 안전 영역 정상';
let lastContentGraphMessage087 = '콘텐츠 연결 검사 대기';
let activeInventoryFilter088: InventoryFilter088 = 'all';
let activeShopFilter088: ShopFilter088 = 'all';
let pendingShopPurchase088: ShopPurchaseDraft088 | null = null;
let pendingSkillTraining089: string | null = null;
let lastPreloadReport089 = '예열 대기';
let titleStartBusy090 = false;
let titleEntryLastReport090 = '타이틀 시작 화면 검사 대기';
let lastAssetBudgetReport091 = '리소스 예산 검사 대기';
let lastDomImagePolicy091 = 'DOM 이미지 정책 대기';
let liteRenderMode091 = false;
let assetBudgetAuditPending091 = false;
let cssBudgetAuditPending092 = false;
let lastCssBudgetReport092 = 'CSS 예산 검사 대기';
let entryRegressionLastReport092 = '진입 회귀 검사 대기';

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
const townNpcSpotlight = document.querySelector<HTMLElement>('#townNpcSpotlight');
const townNpcSpotlightName = document.querySelector<HTMLElement>('#townNpcSpotlightName');
const townNpcSpotlightLine = document.querySelector<HTMLElement>('#townNpcSpotlightLine');
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
  document.body.classList.add('fantasy-ui-098', 'visual-clean-098', 'fantasy-ui-099', 'visual-art-099', 'fantasy-ui-100', 'visual-field-100', 'fantasy-ui-101', 'perf-polish-101', 'fantasy-ui-102', 'asset-kit-102', 'fantasy-ui-103', 'field-ui-103', 'fantasy-ui-104', 'quality-pass-104', 'fantasy-ui-105', 'engine-quality-105', 'fantasy-ui-106', 'engine-106', 'fantasy-ui-107', 'final-opt-107', 'fantasy-ui-108', 'mobile-quality-108', 'fantasy-ui-109', 'maintenance-109', 'fantasy-ui-111', 'kcity-commercial-111', 'entry-flow-ready-090');
  titleScreen.classList.add('title-screen-098', 'title-art-099');
  loginScreen.classList.add('login-screen-098', 'login-art-099');
  townScreen.classList.add('town-screen-098', 'town-art-099');
  ensureTitleEntry090({ titleScreen, startButton: startGameBtn, loginScreen });
  installVisualRescue093({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn });
  installVisualConsolidation094({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installVisualOverhaul095({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installVisualArtPerf099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installFieldHudOverhaul100({ gameRoot: root });
  installPerformanceTuner101(document);
  applyImageDecodePolicy101(document);
  applyImagePolicy106(document);
  applyFinalImagePolicy107(document);
  installSoulAssetKit102(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installPortraitFieldUx103(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installQualityPass104(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installEngineQuality105(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installEngineOptimization106(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installFinalOptimization107(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installMobileQuality108(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installMaintenance109(document, { root, titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installFieldLayout110(document, { titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  installMenuWindowMotion111({ sheet, townPanel: townContentPanel, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
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
  bindTownSafeRouting();
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
  installClientDiagnostics();
  installPerformanceGuards085();
  installAssetBudgetGuards091();
  installInteractionPulse086();
  renderCharacterSummary();
  renderCharacterSlots();
  updateWorldSummary();
  goStep('login');
  // 1.10: keep the real first screen visible until the player taps START.
  titleScreen.classList.remove('hidden');
  titleScreen.setAttribute('aria-hidden', 'false');
  loginScreen.classList.add('hidden');
  loginScreen.setAttribute('aria-hidden', 'true');
  townScreen.classList.add('hidden');
  townScreen.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('town-active', 'field-active');
  syncVisualRoute093({ titleScreen, loginScreen, townScreen, gameRoot: root });
  syncVisualOverhaul095({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualArtPerf099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncFieldHudOverhaul100();
  syncPerformanceRoute101(document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncSoulAssetKit102(document, document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncPortraitFieldUx103(document);
  syncQualityPass104(document);
  syncEngineQuality105(document);
syncEngineOptimization106(document);
  syncFinalOptimization107(document);
  syncMobileQuality108(document);
  syncMaintenance109(document);
  syncFieldLayout110(document);
  ensureTitleEntry090({ titleScreen, startButton: startGameBtn, loginScreen });
  installEntryRegressionGuards092();
  titleEntryLastReport090 = titleEntryHealthLabel090(inspectTitleEntry090(titleScreen, startGameBtn)).label;
  registerServiceWorker();
  updateAudioButtons();
}



function bindTitleFlow() {
  const startEntry = async () => {
    if (titleStartBusy090) return;
    titleStartBusy090 = true;
    titleEntryLastReport090 = titleEntryHealthLabel090(inspectTitleEntry090(titleScreen, startGameBtn)).label;
    void ensureFullscreen();
    void lockPortraitMode();
    await audioService.unlock();
    audioService.setScene('title');
    await withSceneTransition('접속 화면 준비 중', async () => {
      markTitleEntryTransition090({ titleScreen, startButton: startGameBtn, loginScreen });
      goStep('login');
      syncVisualRoute093({ titleScreen, loginScreen, townScreen, gameRoot: root });
  syncVisualOverhaul095({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualArtPerf099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncFieldHudOverhaul100();
  syncPerformanceRoute101(document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncSoulAssetKit102(document, document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncPortraitFieldUx103(document);
  syncQualityPass104(document);
  syncEngineQuality105(document);
syncEngineOptimization106(document);
  syncFinalOptimization107(document);
  syncMobileQuality108(document);
  syncMaintenance109(document);
  syncFieldLayout110(document);
    });
    titleStartBusy090 = false;
  };

  startGameBtn.addEventListener('click', () => {
    void startEntry();
  });

  titleScreen.addEventListener('pointerup', (event) => {
    if (titleScreen.classList.contains('hidden')) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;
    void startEntry();
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('./sw.js', window.location.href))
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        serviceWorkerReady086 = true;
        document.body.classList.add('pwa-ready-086');
      })
      .catch((error) => {
        serviceWorkerReady086 = false;
        recordClientIssue('network', 'PWA 캐시 등록 보류');
        console.warn('[PWA] service worker skipped', error);
      });
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
  if (townContentOpen && activeTownContent === 'settings') renderTownContent();
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
    saveService.saveLocal(pendingSave);
    renderCharacterSlots();
    updateWorldSummary();
    loginStatus.textContent = `${pendingSave.name} 캐릭터로 루미나 마을에 접속합니다.`;
    await safeEnterTownFromLogin(pendingSave, '루미나 마을 접속 중');
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

  characterNextBtn.addEventListener('click', async () => {
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
    loginStatus.textContent = `${prepared.name} 캐릭터로 루미나 마을에 접속합니다.`;
    showToast(`${prepared.name} 캐릭터 생성 완료`);
    await safeEnterTownFromLogin(prepared, '루미나 마을 접속 중');
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
    await safeEnterTownFromLogin(pendingSave, '루미나 마을로 이동 중');
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
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled || sceneTransition.classList.contains('show')) return;
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

  document.querySelectorAll<HTMLButtonElement>('[data-town-npc]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.townNpc || '';
      showTownNpcSpotlight(id);
      if (id === 'smith') openTownContent('inventory');
      else if (id === 'oracle') openTownContent('story');
      else if (id === 'captain') openTownContent('pledge');
      else openTownContent('quests');
      showToast(id === 'smith' ? '브람: 장비와 강화를 점검하겠습니다.' : id === 'oracle' ? '미온: 다음 메인 흐름을 보여드릴게요.' : '세이라: 혈맹 지휘소로 안내합니다.');
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

    const inventoryFilter = target.closest<HTMLButtonElement>('[data-inventory-filter-088]');
    if (inventoryFilter) {
      activeInventoryFilter088 = normalizeInventoryFilter088(inventoryFilter.dataset.inventoryFilter088);
      renderTownContent();
      scheduleUiSafetyAudit();
      return;
    }

    const shopFilter = target.closest<HTMLButtonElement>('[data-shop-filter-088]');
    if (shopFilter) {
      activeShopFilter088 = normalizeShopFilter088(shopFilter.dataset.shopFilter088);
      pendingShopPurchase088 = null;
      renderTownContent();
      scheduleUiSafetyAudit();
      return;
    }

    const shopConfirm = target.closest<HTMLButtonElement>('[data-shop-confirm-088]');
    if (shopConfirm) {
      const action = shopConfirm.dataset.shopConfirm088 || 'cancel';
      if (action === 'confirm' && pendingShopPurchase088) {
        const { itemId, count } = pendingShopPurchase088;
        pendingShopPurchase088 = null;
        buyTownShopItem(itemId, count);
      } else {
        pendingShopPurchase088 = null;
        renderTownContent();
      }
      return;
    }

    const skillConfirm = target.closest<HTMLButtonElement>('[data-skill-confirm-089]');
    if (skillConfirm) {
      const action = skillConfirm.dataset.skillConfirm089 || 'cancel';
      if (action === 'confirm') confirmTownSkillTraining089();
      else {
        pendingSkillTraining089 = null;
        renderTownContent();
        scheduleUiSafetyAudit();
      }
      return;
    }

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
      stageTownSkillTraining089(upgradeTownSkill.dataset.townUpgradeSkill || '');
      return;
    }

    const dismantleDuplicates = target.closest<HTMLButtonElement>('[data-town-dismantle-duplicates]');
    if (dismantleDuplicates) {
      dismantleTownDuplicateEquipment();
      return;
    }

    const buyBulkItem = target.closest<HTMLButtonElement>('[data-town-shop-buy-bulk]');
    if (buyBulkItem) {
      stageTownShopPurchase088(buyBulkItem.dataset.townShopBuyBulk || '', Number(buyBulkItem.dataset.townShopCount || 5));
      return;
    }

    const buyItem = target.closest<HTMLButtonElement>('[data-town-shop-buy]');
    if (buyItem) {
      stageTownShopPurchase088(buyItem.dataset.townShopBuy || '', 1);
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
      event.preventDefault();
      event.stopPropagation();
      if (zone.disabled || sceneTransition.classList.contains('show')) return;
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

    const pledgeAction = target.closest<HTMLButtonElement>('[data-town-pledge-action]');
    if (pledgeAction) {
      handleTownPledgeAction(pledgeAction.dataset.townPledgeAction || '');
      return;
    }

    const healthAction = target.closest<HTMLButtonElement>('[data-town-health-action]');
    if (healthAction) { await handleHealthAction085(healthAction.dataset.townHealthAction || ''); return; }

    const account = target.closest<HTMLButtonElement>('[data-town-account-action]');
    const settings = target.closest<HTMLButtonElement>('[data-town-settings-action]');
    if (settings) { handleAudioSettingsAction(settings.dataset.townSettingsAction || ''); return; }

    if (account) await handleTownAccountAction(account.dataset.townAccountAction || '');
  });
}

async function safeEnterTownFromLogin(save: PlayerSave, label = '루미나 마을로 이동 중') {
  try {
    void ensureFullscreen();
    void lockPortraitMode();
    pendingSave = saveService.validateSave(save);
    repairTownVitals(pendingSave);
    saveService.saveLocal(pendingSave);
    await enterTown(pendingSave, label);
    await saveCloudIfAvailable(pendingSave, latest?.power || powerFromSave(pendingSave), false);
  } catch (error) {
    console.error('[Town] login entry failed', error);
    sceneTransition.classList.remove('show');
    document.body.classList.remove('field-active', 'town-active');
    townScreen.classList.add('hidden');
    townScreen.setAttribute('aria-hidden', 'true');
    titleScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginScreen.setAttribute('aria-hidden', 'false');
    goStep('character');
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    loginStatus.textContent = `마을 입장 실패: ${message}`;
    showToast('마을 입장에 실패했습니다. 다시 눌러주세요.');
  }
}

async function quickEnterTown(save: PlayerSave, label = '루미나 마을로 이동 중') {
  await safeEnterTownFromLogin(save, label);
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


function bindTownSafeRouting() {
  townScreen.addEventListener('click', (event) => {
    if (!document.body.classList.contains('town-active')) return;
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('button');
    if (!button || !townScreen.contains(button) || button.disabled) return;
    if (sceneTransition.classList.contains('show')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const zoneId = button.dataset.townZoneEnter || button.dataset.zoneId || '';
    if (zoneId) {
      event.preventDefault();
      event.stopPropagation();
      void routeTownZoneEnter(zoneId);
      return;
    }

    const content = button.dataset.townContent || button.dataset.townMoreContent || '';
    if (content) {
      event.preventDefault();
      event.stopPropagation();
      openTownContent(content as TownContentId);
    }
  }, true);
}

async function routeTownZoneEnter(zoneId: string) {
  if (townRouteBusy || sceneTransition.classList.contains('show')) return;
  townRouteBusy = true;
  try {
    if (!pendingSave) pendingSave = getSelectedCharacter();
    if (!pendingSave) {
      showToast('사냥터에 입장할 캐릭터를 선택하세요.');
      goStep('character');
      return;
    }
    const save = saveService.validateSave(pendingSave);
    pendingSave = save;
    if (!isZoneUnlocked(save, zoneId)) {
      showToast('아직 해금되지 않은 사냥터입니다. 스토리 또는 레벨 조건을 확인하세요.');
      updateZoneLocks(save);
      openTownContent('hunt');
      return;
    }
    closeTownContentPanel();
    await startField(save, zoneId);
  } finally {
    townRouteBusy = false;
  }
}

function goStep(step: FlowStep) {
  if (step === 'character') refreshCharacterRoster(selectedCharacterId);
  const hintText: Record<FlowStep, string> = {
    login: '접속 방식을 선택하세요.',
    server: '곰같은여우 서버 상태를 확인하고 다음으로 이동합니다.',
    character: '캐릭터를 선택하거나 새 소울 바인더를 생성하세요.',
    town: '캐릭터 선택 후 루미나 마을로 바로 이동합니다.'
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
    syncVisualRoute093({ titleScreen, loginScreen, townScreen, gameRoot: root });
  syncVisualOverhaul095({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualArtPerf099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncFieldHudOverhaul100();
  syncPerformanceRoute101(document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncSoulAssetKit102(document, document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncPortraitFieldUx103(document);
  syncQualityPass104(document);
  syncEngineQuality105(document);
syncEngineOptimization106(document);
  syncFinalOptimization107(document);
  syncMobileQuality108(document);
  syncMaintenance109(document);
  syncFieldLayout110(document);
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
      syncVisualRoute093({ titleScreen, loginScreen, townScreen, gameRoot: root });
  syncVisualOverhaul095({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualArtPerf099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncFieldHudOverhaul100();
  syncPerformanceRoute101(document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncSoulAssetKit102(document, document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncPortraitFieldUx103(document);
  syncQualityPass104(document);
  syncEngineQuality105(document);
syncEngineOptimization106(document);
  syncFinalOptimization107(document);
  syncMobileQuality108(document);
  syncMaintenance109(document);
  syncFieldLayout110(document);
      setFieldZoneHud(zoneId);

      if (game) game.destroy();
      game = null;
      root.replaceChildren();
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
    await releaseWakeLock();
    if (game) {
      game.destroy();
      game = null;
    }
    root.replaceChildren();
    document.body.classList.remove('field-active');
    document.body.classList.add('town-active');
    titleScreen.classList.add('hidden');
    titleScreen.setAttribute('aria-hidden', 'true');
    loginScreen.classList.add('hidden');
    loginScreen.setAttribute('aria-hidden', 'true');
    townScreen.classList.remove('hidden');
    townScreen.setAttribute('aria-hidden', 'false');
    if (pendingSave) renderTown(pendingSave);
    syncVisualRoute093({ titleScreen, loginScreen, townScreen, gameRoot: root });
  syncVisualOverhaul095({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncVisualArtPerf099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  syncFieldHudOverhaul100();
  syncPerformanceRoute101(document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncSoulAssetKit102(document, document.body.classList.contains('field-active') ? 'field' : document.body.classList.contains('town-active') ? 'town' : titleScreen.classList.contains('hidden') ? 'login' : 'title');
  syncPortraitFieldUx103(document);
  syncQualityPass104(document);
  syncEngineQuality105(document);
syncEngineOptimization106(document);
  syncFinalOptimization107(document);
  syncMobileQuality108(document);
  syncMaintenance109(document);
  syncFieldLayout110(document);
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

    const healthAction = target.closest<HTMLButtonElement>('[data-health-action]');
    if (healthAction) {
      await handleHealthAction085(healthAction.dataset.healthAction || '');
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
  fieldChainValue.textContent = active ? `${chain.count} CHAIN` : 'CHAIN BONUS';
  fieldChainBonus.textContent = active
    ? `${comboTier} · EXP/GOLD +${chain.bonusPercent}% · ${chain.timer.toFixed(1)}초 딜타임`
    : 'CHAIN BONUS · 연속 처치 보너스';
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
  syncMenuWindowSafeFrame111(sheet);
  openMenuWindow111(sheet);
  document.querySelectorAll('[data-sheet-tab]').forEach((item) => {
    item.classList.toggle('active', (item as HTMLElement).dataset.sheetTab === tab);
  });
  renderSheet();
  scheduleUiSafetyAudit();
}

function closeCurrentSheet() {
  sheetOpen = false;
  document.body.classList.remove('sheet-open');
  closeMenuWindow111(sheet);
  sheet.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
  scheduleUiSafetyAudit();
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
  return `
    ${renderEquipmentResonanceSummary(snapshot.save)}
    ${renderEnhancementWorkbench(snapshot.save)}
    ${renderPotionBeltSummary(snapshot.save)}
    ${renderInventoryPanel111(snapshot.save, { townMode: false, activeFilter: 'all', bagLimit: 64 })}
  `;
}


function renderSkills(snapshot: Snapshot) {
  return renderSkillGrid(snapshot.save, false);
}


function renderSkillTrainingBoard083(save: PlayerSave, classSkills: SkillDefinition[], townMode: boolean) {
  const learned = classSkills.filter((skill) => save.learnedSkillIds?.includes(skill.id));
  const ready = learned.filter((skill) => save.level >= skill.unlockLevel);
  const upgradeReady = learned.filter((skill) => canUpgradeSkill(save, skill));
  const totalLevel = learned.reduce((sum, skill) => sum + skillLevel(save, skill.id), 0);
  const coreSkill = ready[0] || learned[0] || classSkills[0];
  const shopButton = townMode ? '<button class="wide-action" data-town-content="shop" type="button">스킬북 보러가기</button>' : '';
  return `
    <section class="skill-training-board-083" aria-label="스킬 성장 요약">
      <div class="skill-orb-083"><img src="${skillArtUrl(coreSkill)}" alt="${escapeHtml(coreSkill.name)}" onerror="this.remove()" />${inlineFallbackIcon(coreSkill.hotkey)}</div>
      <div class="skill-training-copy-083">
        <span class="panel-kicker">SOUL SKILL TREE</span>
        <h3>${escapeHtml(classes[save.classId].name)} 스킬 성장</h3>
        <p>습득 ${learned.length}/${classSkills.length} · 사용 가능 ${ready.length}개 · 숙련 합계 Lv.${totalLevel}</p>
        <div class="skill-training-meter-083"><i style="width:${Math.min(100, Math.round((learned.length / Math.max(1, classSkills.length)) * 100))}%"></i><em>${upgradeReady.length ? `강화 가능 ${upgradeReady.length}개` : '스킬북/재료 확인'}</em></div>
      </div>
      <div class="skill-training-actions-083">
        ${shopButton}
        <button class="wide-action primary" ${upgradeReady[0] ? `data-town-upgrade-skill="${upgradeReady[0].id}"` : 'disabled'} type="button">추천 숙련 강화</button>
      </div>
    </section>
  `;
}

function renderSkillGrid(save: PlayerSave, townMode: boolean) {
  const classSkills = skills.filter((skill) => skill.classId === save.classId);
  const readiness = summarizeSkillReadiness089({
    skills: classSkills,
    learnedSkillIds: save.learnedSkillIds || [],
    levelBySkillId: (skillId) => skillLevel(save, skillId),
    playerLevel: save.level,
    canUpgradeSkill: (skill) => canUpgradeSkill(save, skill)
  });
  const readinessRows: SkillProgressRow089[] = [
    { label: '습득', value: `${readiness.learned}/${readiness.total}`, level: readiness.bookMissing ? 'warn' : 'ok', hint: readiness.bookMissing ? `스킬북 필요 ${readiness.bookMissing}` : '직업 스킬 습득 정상' },
    { label: '사용 가능', value: `${readiness.ready}`, level: readiness.lockedByLevel ? 'warn' : 'ok', hint: readiness.lockedByLevel ? `레벨 잠금 ${readiness.lockedByLevel}` : '필드 스킬 슬롯 연결 정상' },
    { label: '강화 가능', value: `${readiness.upgradeable}`, level: readiness.upgradeable ? 'ok' : 'warn', hint: readiness.upgradeable ? '강화 확인 패널로 안전하게 진행' : '골드/파편/강화석 점검' },
    { label: '숙련 합계', value: `Lv.${readiness.masteryTotal}`, level: 'ok', hint: '스킬 숙련이 전투력과 타격감 성장에 연결됨' }
  ];
  const cells = classSkills.map((skill) => {
    const learned = Array.isArray(save.learnedSkillIds) && save.learnedSkillIds.includes(skill.id);
    const levelReady = save.level >= skill.unlockLevel;
    const unlocked = learned && levelReady;
    const level = skillLevel(save, skill.id);
    const state = !learned ? '미습득' : levelReady ? `Lv.${level}` : `Lv.${skill.unlockLevel}`;
    const canUpgrade = canUpgradeSkill(save, skill);
    const cost = level < SKILL_MAX_LEVEL ? skillMasteryCost(level) : null;
    const costText = cost ? `골드 ${formatGold(cost.gold)} · 파편 ${cost.shard}${cost.stone ? ` · 강화석 ${cost.stone}` : ''}` : '최대 숙련';
    const upgradeButton = `<span class="slot-click-hint">터치 상세${townMode && canUpgrade ? ' · 강화 가능' : ''}</span>`;
    return `
      <article class="slot-cell skill-slot ${unlocked ? 'unlocked' : 'locked'} ${canUpgrade ? 'upgrade-ready-089' : ''}" data-skill-detail="${skill.id}" tabindex="0" role="button" aria-label="${escapeHtml(skill.name)} 상세 보기">
        <span class="slot-art skill-art skill-art-${skill.hotkey}"><img src="${skillArtUrl(skill)}" alt="${escapeHtml(skill.name)}" onerror="this.remove()" />${inlineFallbackIcon(skill.hotkey)}</span>
        <span class="slot-rarity">${state}${canUpgrade ? ' · 강화 가능' : ''}</span>
        <b>${escapeHtml(skill.name)}</b>
        <em>MP ${effectiveSkillMpCost(skill, level)} · 쿨 ${effectiveSkillCooldown(skill, level)}s</em>
        <small class="skill-mastery-meta">피해/회복 +${skillMasteryBonusPercent(level)}% · ${costText}</small>
        ${upgradeButton}
      </article>
    `;
  });
  const draft = townMode ? buildSkillUpgradeDraft089(pendingSkillTraining089 || '') : null;
  return `
    ${renderSkillTrainingBoard083(save, classSkills, townMode)}
    ${renderSkillReadinessStrip089(readinessRows)}
    ${renderSkillUpgradeHint089(readiness)}
    ${renderSkillUpgradeConfirm089(draft)}
    <div class="slot-toolbar slot-toolbar-083 slot-toolbar-089">
      <span>스킬 슬롯 3x3 · ${classes[save.classId].name}</span>
      <em>0.89부터 숙련 강화는 확인 후 진행됩니다. 비용/효과를 보고 확정하세요.</em>
    </div>
    <div class="slot-grid skill-slot-grid compact-slot-grid">${fillSlots(cells, 9, '미개방')}</div>
  `;
}

function buildSkillUpgradeDraft089(skillId: string): SkillUpgradeDraft089 | null {
  if (!pendingSave || !skillId) return null;
  const skill = skills.find((entry) => entry.id === skillId && entry.classId === pendingSave?.classId);
  if (!skill) return null;
  const learned = pendingSave.learnedSkillIds?.includes(skill.id);
  const level = skillLevel(pendingSave, skill.id);
  const nextLevel = Math.min(SKILL_MAX_LEVEL, level + 1);
  const cost = level > 0 && level < SKILL_MAX_LEVEL ? skillMasteryCost(level) : null;
  const needsLevel = cost ? Math.max(skill.unlockLevel, cost.levelReq) : skill.unlockLevel;
  const shardCount = materialCount(pendingSave, 'soul-shard');
  const stoneCount = materialCount(pendingSave, 'enhance-stone');
  const problems: string[] = [];
  if (!learned) problems.push('스킬북 필요');
  if (level >= SKILL_MAX_LEVEL) problems.push('최대 숙련');
  if (pendingSave.level < needsLevel) problems.push(`Lv.${needsLevel} 필요`);
  if (cost && pendingSave.gold < cost.gold) problems.push(`골드 ${formatGold(cost.gold - pendingSave.gold)} 부족`);
  if (cost && shardCount < cost.shard) problems.push(`파편 ${cost.shard - shardCount}개 부족`);
  if (cost && stoneCount < cost.stone) problems.push(`강화석 ${cost.stone - stoneCount}개 부족`);
  const canUpgrade = Boolean(cost && learned && problems.length === 0 && canUpgradeSkill(pendingSave, skill));
  const costText = cost ? `비용 ${formatGold(cost.gold)} · 파편 ${cost.shard}${cost.stone ? ` · 강화석 ${cost.stone}` : ''}` : '최대 숙련 또는 미습득';
  const nextBenefit = `피해/회복 +${skillMasteryBonusPercent(level)}% → +${skillMasteryBonusPercent(nextLevel)}% · 쿨 ${effectiveSkillCooldown(skill, level)}s → ${effectiveSkillCooldown(skill, nextLevel)}s · MP ${effectiveSkillMpCost(skill, level)} → ${effectiveSkillMpCost(skill, nextLevel)}`;
  return {
    skillId: skill.id,
    name: skill.name,
    hotkey: skill.hotkey,
    level,
    nextLevel,
    costText,
    canUpgrade,
    reason: canUpgrade ? '강화 가능 · 확정 시 즉시 저장' : problems.join(' · ') || '조건 확인 필요',
    nextBenefit,
    artUrl: skillArtUrl(skill),
    className: classes[skill.classId].name
  };
}

function stageTownSkillTraining089(skillId: string) {
  pendingSkillTraining089 = skillId || null;
  if (!pendingSkillTraining089) return;
  const draft = buildSkillUpgradeDraft089(pendingSkillTraining089);
  if (draft?.canUpgrade) showToast(`${draft.name} 숙련 강화 확인`);
  else if (draft) showToast(draft.reason);
  if (townContentOpen && activeTownContent === 'skills') renderTownContent();
  else openTownContent('skills');
  scheduleUiSafetyAudit();
}

function confirmTownSkillTraining089() {
  const skillId = pendingSkillTraining089;
  const draft = buildSkillUpgradeDraft089(skillId || '');
  if (!skillId || !draft) {
    pendingSkillTraining089 = null;
    renderTownContent();
    return;
  }
  if (!draft.canUpgrade) {
    showToast(draft.reason);
    renderTownContent();
    return;
  }
  pendingSkillTraining089 = null;
  trainTownSkill(skillId);
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
      <span class="slot-click-hint">터치 상세</span>
    </article>
  `;
}

function renderItemSlot(save: PlayerSave, def: ItemDefinition, uidValue: string, count: number, _actionAttr: string, _upgradeAttr?: string) {
  const slot = def.type as EquipmentSlot;
  const canEquip = def.type === 'weapon' || def.type === 'armor' || def.type === 'relic';
  const equipped = canEquip && save.equipment?.[slot] === uidValue;
  const enhanceLevel = save.enhancements?.[uidValue] || 0;
  const typeLabel: Record<string, string> = { weapon: '무기', armor: '방어구', relic: '유물', material: '재료', skillbook: '스킬서', consumable: '소모품' };
  const category = inventoryCategoryInfo(def.type);
  const stateText = canEquip ? `${def.rarity} · +${enhanceLevel}${equipped ? ' · 장착' : ''}` : `${def.rarity} · x${count}`;
  return `
    <article class="slot-cell item-slot ${equipped ? 'equipped' : ''}" data-item-detail="${uidValue}" tabindex="0" role="button" aria-label="${escapeHtml(def.name)} 상세 보기">
      <span class="slot-art item-art item-art-${def.type} ${equipped ? 'is-equipped' : ''}"><img src="${itemArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(itemIcon(def.type))}</span>
      <span class="slot-rarity rarity-${def.rarity.toLowerCase()}">${stateText}</span>
      <b>${escapeHtml(def.name)}${canEquip && enhanceLevel ? ` +${enhanceLevel}` : ''}</b>
      <em>${category.title} · ${typeLabel[def.type] || escapeHtml(def.type)}</em>
      <span class="slot-click-hint">터치 상세</span>
    </article>
  `;
}

function fillSlots(cells: string[], total: number, label: string) {
  const next = [...cells];
  while (next.length < total) next.push(`<article class="slot-cell empty-slot-cell" aria-label="${escapeHtml(label)}"><span>+</span><b>${escapeHtml(label)}</b></article>`);
  return next.slice(0, total).join('');
}

function itemIcon(type: string) {
  if (type === 'weapon') return 'WPN';
  if (type === 'armor') return 'ARM';
  if (type === 'relic') return 'REL';
  if (type === 'skillbook') return 'BOOK';
  if (type === 'consumable') return 'POT';
  if (type === 'material') return 'MAT';
  return 'ITEM';
}

function runtimeAsset(path: string) {
  return `./assets/soulpack/${path}`;
}

function itemArtUrl(def: ItemDefinition) {
  return runtimeAsset(`items/${def.id}.webp?v=059`);
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


function lawfulInfo(save: PlayerSave) {
  const value = Math.max(-32768, Math.min(32767, Math.round(Number(save.lawful ?? 0))));
  const tier = value >= 24000 ? '로우풀 기사' : value >= 14000 ? '로우풀' : value >= 6000 ? '질서' : value <= -18000 ? '카오틱' : value <= -4000 ? '혼돈' : '중립';
  const desc = value >= 24000 ? '수호 보너스 최고 단계' : value >= 14000 ? '라우풀 보너스 발동' : value >= 6000 ? '질서 성향 보너스' : value <= -18000 ? '카오틱 패널티 심화' : value <= -4000 ? '혼돈 패널티 주의' : '성향 효과 없음';
  const percent = value >= 0 ? Math.round((value / 32767) * 100) : Math.round((Math.abs(value) / 32768) * 100);
  const bonusText = value >= 24000 ? 'HP/방어/드랍 보너스 대폭 증가' : value >= 14000 ? 'HP/방어/드랍 보너스' : value >= 6000 ? '소량 생존 보너스' : value <= -18000 ? '방어/드랍 패널티, 기절 페널티 증가' : value <= -4000 ? '드랍/방어 소폭 패널티' : '중립';
  return { value, tier, desc, percent, bonusText };
}

function lawfulStatBonus(save: PlayerSave): Partial<Stats> {
  const value = Math.round(Number(save.lawful ?? 0));
  if (value >= 24000) return { hp: 160, mp: 50, def: 22, atk: 10, crit: 0.012 };
  if (value >= 14000) return { hp: 95, mp: 28, def: 14, atk: 6, crit: 0.006 };
  if (value >= 6000) return { hp: 45, def: 7 };
  if (value <= -18000) return { hp: -90, def: -18, atk: -8, crit: -0.018 };
  if (value <= -4000) return { hp: -35, def: -8, atk: -3 };
  return {};
}

function renderLawfulSystemPanel(save: PlayerSave) {
  const info = lawfulInfo(save);
  const purity = materialCount(save, 'purity-mark');
  return `
    <section class="lawful-system-panel ${info.value < 0 ? 'chaotic' : info.value >= 6000 ? 'lawful' : 'neutral'}">
      <div class="lawful-orb"><i>${info.value < 0 ? 'CHAOS' : info.value >= 6000 ? 'LAW' : 'NEUTRAL'}</i></div>
      <div>
        <span class="panel-kicker">ALIGNMENT</span>
        <h3>${escapeHtml(info.tier)} · ${info.value}</h3>
        <p>${escapeHtml(info.desc)} · ${escapeHtml(info.bonusText)}</p>
        <div class="lawful-meter"><i style="width:${Math.max(5, info.percent)}%"></i></div>
        <div class="pill-row"><span class="pill">정화의 표식 ${purity}개</span><span class="pill">보스/정예 처치 시 성향 상승</span></div>
      </div>
    </section>
  `;
}

function renderLawfulBadge(save: PlayerSave, compact = false) {
  const info = lawfulInfo(save);
  return `<span class="lawful-badge ${info.value < 0 ? 'chaotic' : info.value >= 8000 ? 'lawful' : 'neutral'}"><b>${escapeHtml(info.tier)}</b>${compact ? '' : `<em>${info.value} · ${escapeHtml(info.desc)}</em>`}</span>`;
}

function inventoryCategoryInfo(type: ItemDefinition['type']) {
  const labels: Record<ItemDefinition['type'], { key: string; title: string; sub: string }> = {
    weapon: { key: 'gear', title: '장비', sub: '무기' },
    armor: { key: 'gear', title: '장비', sub: '방어구' },
    relic: { key: 'gear', title: '장비', sub: '유물' },
    consumable: { key: 'consumable', title: '소모품', sub: '물약/사용' },
    material: { key: 'material', title: '재료', sub: '강화/교환' },
    skillbook: { key: 'skillbook', title: '스킬서', sub: '습득' }
  };
  return labels[type] || { key: 'etc', title: '기타', sub: '기타' };
}

function renderEnhancementWorkbench(save: PlayerSave) {
  const equipped = ['weapon', 'armor', 'relic'].map((slot) => {
    const uidValue = save.equipment?.[slot as EquipmentSlot];
    const instance = uidValue ? save.inventory.find((entry) => entry.uid === uidValue) : null;
    const def = instance ? items.find((item) => item.id === instance.itemId) : null;
    const level = uidValue ? save.enhancements?.[uidValue] || 0 : 0;
    return `<span><b>${slot === 'weapon' ? '무기' : slot === 'armor' ? '방어구' : '유물'}</b><em>${def ? `${escapeHtml(def.name)} +${level}` : '비어 있음'}</em></span>`;
  }).join('');
  return `
    <section class="enhance-workbench-panel">
      <div>
        <span class="panel-kicker">BLACKSMITH</span>
        <h3>강화 공방</h3>
        <p>강화 시스템은 유지됩니다. 장비 슬롯을 클릭해 상세창에서 장착/강화를 진행하세요.</p>
      </div>
      <div class="enhance-workbench-grid">${equipped}</div>
      <div class="enhance-material-row">
        <span>소울 파편 <b>${materialCount(save, 'soul-shard')}</b></span>
        <span>강화석 <b>${materialCount(save, 'enhance-stone')}</b></span>
        <span>성운광 <b>${materialCount(save, 'radiant-ore')}</b></span>
      </div>
    </section>
  `;
}


function rarityRank(rarity: ItemDefinition['rarity']) {
  const rank: Record<ItemDefinition['rarity'], number> = { N: 1, R: 2, SR: 3, SSR: 4, UR: 5 };
  return rank[rarity] || 0;
}

function sortedInventoryEntries(save: PlayerSave, entries: Array<{ def: ItemDefinition; instance: { uid: string; itemId: string; count: number } }>) {
  return [...entries].sort((a, b) => {
    const aEquipped = (a.def.type === 'weapon' || a.def.type === 'armor' || a.def.type === 'relic') && save.equipment?.[a.def.type as EquipmentSlot] === a.instance.uid;
    const bEquipped = (b.def.type === 'weapon' || b.def.type === 'armor' || b.def.type === 'relic') && save.equipment?.[b.def.type as EquipmentSlot] === b.instance.uid;
    if (aEquipped !== bEquipped) return aEquipped ? -1 : 1;
    const aEnhance = save.enhancements?.[a.instance.uid] || 0;
    const bEnhance = save.enhancements?.[b.instance.uid] || 0;
    if (rarityRank(a.def.rarity) !== rarityRank(b.def.rarity)) return rarityRank(b.def.rarity) - rarityRank(a.def.rarity);
    if (aEnhance !== bEnhance) return bEnhance - aEnhance;
    if (a.def.type !== b.def.type) return a.def.type.localeCompare(b.def.type);
    return a.def.name.localeCompare(b.def.name, 'ko');
  });
}

function renderInventoryQualityBoard(save: PlayerSave, described: Array<{ def: ItemDefinition; instance: { uid: string; itemId: string; count: number } }>, bagLimit: number) {
  const gear = described.filter(({ def }) => def.type === 'weapon' || def.type === 'armor' || def.type === 'relic');
  const equipped = gear.filter(({ def, instance }) => save.equipment?.[def.type as EquipmentSlot] === instance.uid).length;
  const enhanceReady = gear.filter(({ instance }) => canUpgradeItemInstance(save, instance.uid)).length;
  const potionStock = described.filter(({ def }) => def.type === 'consumable').reduce((sum, { instance }) => sum + instance.count, 0);
  const rareMats = described.filter(({ def }) => def.type === 'material' && rarityRank(def.rarity) >= 3).reduce((sum, { instance }) => sum + instance.count, 0);
  const used = save.inventory.length;
  const fullness = Math.round(Math.min(100, (used / bagLimit) * 100));
  return `
    <section class="inventory-quality-board">
      <div><span>BAG QA</span><h3>가방 품질 점검</h3><p>장비·소모품·재료를 희귀도/강화 상태 기준으로 정렬했습니다.</p></div>
      <div class="inventory-quality-grid">
        <article><b>${equipped}/3</b><em>장착 슬롯</em></article>
        <article><b>${enhanceReady}</b><em>강화 가능</em></article>
        <article><b>${potionStock}</b><em>물약 재고</em></article>
        <article><b>${rareMats}</b><em>SR+ 재료</em></article>
      </div>
      <div class="inventory-fill-meter"><i style="width:${fullness}%"></i><span>${used}/${bagLimit}</span></div>
    </section>
  `;
}

function canUpgradeItemInstance(save: PlayerSave, itemUid: string) {
  const entry = save.inventory.find((item) => item.uid === itemUid);
  if (!entry) return false;
  const def = items.find((item) => item.id === entry.itemId);
  if (!def || (def.type !== 'weapon' && def.type !== 'armor' && def.type !== 'relic')) return false;
  const level = save.enhancements?.[itemUid] || 0;
  if (level >= MAX_ENHANCE_LEVEL) return false;
  const cost = enhancementCost(level);
  return save.gold >= cost.gold && materialCount(save, 'soul-shard') >= cost.shard && materialCount(save, 'enhance-stone') >= cost.stone;
}

function renderInventoryCategoryGrid(save: PlayerSave, entries: Array<{ def: ItemDefinition; instance: { uid: string; itemId: string; count: number } }>, title: string, subtitle: string, total = 12) {
  const sorted = sortedInventoryEntries(save, entries);
  const cells = sorted.map(({ def, instance }) => renderItemSlot(save, def, instance.uid, instance.count, 'data-equip-item', 'data-upgrade-item'));
  const equippedCount = entries.filter(({ def, instance }) => (def.type === 'weapon' || def.type === 'armor' || def.type === 'relic') && save.equipment?.[def.type as EquipmentSlot] === instance.uid).length;
  return `
    <section class="inventory-category-section">
      <div class="inventory-category-head">
        <div><span>${escapeHtml(subtitle)}</span><h3>${escapeHtml(title)}</h3></div>
        <em>${sorted.length}개${equippedCount ? ` · 장착 ${equippedCount}` : ''}</em>
      </div>
      <div class="slot-grid inventory-slot-grid inventory-category-grid">${fillSlots(cells, Math.max(total, Math.min(24, Math.ceil(Math.max(entries.length, 1) / 4) * 4)), '빈 슬롯')}</div>
    </section>
  `;
}

function renderCategorizedInventory(save: PlayerSave, townMode: boolean, activeFilter: InventoryFilter088 = 'all') {
  const described = save.inventory.flatMap((instance) => {
    const def = items.find((item) => item.id === instance.itemId);
    return def ? [{ def, instance }] : [];
  });
  const gear = described.filter(({ def }) => def.type === 'weapon' || def.type === 'armor' || def.type === 'relic');
  const consumable = described.filter(({ def }) => def.type === 'consumable');
  const material = described.filter(({ def }) => def.type === 'material');
  const skillbook = described.filter(({ def }) => def.type === 'skillbook');
  const bagLimit = 64;
  const modeHint = townMode ? '마을 가방' : '필드 가방';
  const normalizedFilter = normalizeInventoryFilter088(activeFilter);
  const counts = [
    { key: 'all' as const, label: '전체', count: described.length },
    { key: 'gear' as const, label: '장비', count: gear.length },
    { key: 'consumable' as const, label: '소모품', count: consumable.length },
    { key: 'material' as const, label: '재료', count: material.length },
    { key: 'skillbook' as const, label: '스킬서', count: skillbook.length }
  ];
  const sections = [
    { key: 'gear' as const, html: renderInventoryCategoryGrid(save, gear, '장비', 'WEAPON · ARMOR · RELIC', 12) },
    { key: 'consumable' as const, html: renderInventoryCategoryGrid(save, consumable, '소모품', 'POTION · USE', 8) },
    { key: 'material' as const, html: renderInventoryCategoryGrid(save, material, '재료', 'MATERIAL · CRAFT', 12) },
    { key: 'skillbook' as const, html: renderInventoryCategoryGrid(save, skillbook, '스킬서', 'SKILL BOOK', 8) }
  ].filter((section) => normalizedFilter === 'all' || section.key === normalizedFilter);
  const activeCount = normalizedFilter === 'all' ? described.length : counts.find((entry) => entry.key === normalizedFilter)?.count || 0;
  return `
    ${renderInventoryQualityBoard(save, described, bagLimit)}
    <div class="inventory-category-toolbar inventory-category-toolbar-088">
      <span>${modeHint} · ${save.inventory.length}/${bagLimit}</span>
      <em>현재 ${counts.find((entry) => entry.key === normalizedFilter)?.label || '전체'} ${activeCount}개 · 필터 상태가 유지됩니다.</em>
    </div>
    ${townMode ? renderInventoryFilterRail088(counts, normalizedFilter) : `
      <div class="inventory-category-nav inventory-category-tabs">
        <span>장비 ${gear.length}</span><span>소모품 ${consumable.length}</span><span>재료 ${material.length}</span><span>스킬서 ${skillbook.length}</span>
      </div>
    `}
    ${sections.map((section) => section.html).join('')}
  `;
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
          ${renderLawfulBadge(snapshot.save, true)}
        </div>
        <h3>${escapeHtml(snapshot.save.name)}</h3>
        <p>HP ${Math.ceil(snapshot.save.hp)}/${stats.hp} · MP ${Math.floor(snapshot.save.mp)}/${stats.mp}</p>
        <p>공격 ${stats.atk} · 방어 ${stats.def} · 공속 ${stats.aspd} · 치명 ${Math.round(stats.crit * 100)}%</p>
        <div class="bar exp quest-progress"><i style="width:${expPercent}%"></i><em>EXP ${snapshot.save.exp}/${expToNext(snapshot.save.level)}</em></div>
        <div class="account-resonance-mini">${equipmentResonanceEffects(snapshot.save, items).map((effect) => `<span>${escapeHtml(effect.tier)} · ${escapeHtml(effect.title)}</span>`).join('') || '<span>장비 공명 대기</span>'}</div>
        <div class="account-resonance-mini"><span>원정 지원 Lv.${expeditionSupportTier(snapshot.save)} · 메인/보스/영혼 진행 보너스</span></div>
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
      ${renderSystemDoctor085(snapshot.save, 'field')}
      ${renderTechnicalHealthPanel(snapshot.save, 'account')}
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
                <em>Lv.${save.level} · ${escapeHtml(klass.name)} · ${lawfulInfo(save).tier} · ${formatGold(save.gold)}</em>
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
  updateTownLobby070(save);
  renderTownGatePreview(save);
  updateZoneLocks(save);
  if (townContentOpen) renderTownContent();
  scheduleUiSafetyAudit();
}

function updateTownLobby070(save: PlayerSave) {
  const stats = calculateStatsFromSave(save);
  const klass = classes[save.classId];
  const maxHp = Math.max(1, Math.round(stats.hp));
  const maxMp = Math.max(1, Math.round(stats.mp));
  const hpPct = Math.max(0, Math.min(100, Math.round((save.hp / maxHp) * 100)));
  const mpPct = Math.max(0, Math.min(100, Math.round((save.mp / maxMp) * 100)));
  const expGoal = Math.max(1, expToNext(save.level));
  const expPct = Math.max(0, Math.min(100, Math.round((save.exp / expGoal) * 100)));

  document.querySelectorAll<HTMLElement>('[data-town-lobby-name]').forEach((node) => { node.textContent = save.name; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-level]').forEach((node) => { node.textContent = `${save.level}`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-level-card]').forEach((node) => { node.textContent = `${save.level}`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-gold]').forEach((node) => { node.textContent = formatGold(save.gold); });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-gems]').forEach((node) => { node.textContent = formatSoul(save.gems); });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-stamina]').forEach((node) => { node.textContent = '120/120'; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-hp-text]').forEach((node) => { node.textContent = `${formatNumber(save.hp)}/${formatNumber(maxHp)}`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-mp-text]').forEach((node) => { node.textContent = `${formatNumber(save.mp)}/${formatNumber(maxMp)}`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-hp], [data-town-lobby-hp-mini]').forEach((node) => { node.style.width = `${hpPct}%`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-mp], [data-town-lobby-mp-mini]').forEach((node) => { node.style.width = `${mpPct}%`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-exp-mini]').forEach((node) => { node.style.width = `${expPct}%`; });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-portrait]').forEach((node) => {
    node.setAttribute('aria-label', `${save.name} · ${klass.name}`);
    setClassPortraitArt(node, save.classId, save.gender || 'male');
  });

  const story = currentStoryQuest(save);
  const progress = story ? storyQuestProgress(save, story) : 0;
  const recommended = story ? recommendedZoneForQuest(save, story) : zones[0];
  const daily = dailyQuests[0];
  const storyReady = Boolean(story && progress >= story.target);
  const dailyReady = Boolean(daily && questProgress(save, daily.id) >= daily.target && !save.daily.claimedQuestIds.includes(daily.id));
  document.querySelectorAll<HTMLElement>('[data-town-lobby-quest-list]').forEach((questList) => {
    questList.innerHTML = `
      <button class="${storyReady ? 'ready' : 'active'}" data-town-content="story" type="button"><b>${story ? escapeHtml(story.title) : '메인 스토리'}</b><span>${story ? `${Math.min(progress, story.target)}/${story.target} · ${escapeHtml(story.goalText)}` : '루미나 등불을 확인하세요.'}</span></button>
      <button class="${dailyReady ? 'ready' : ''}" data-town-content="quests" type="button"><b>${escapeHtml(daily?.title || '일일 의뢰')}</b><span>${dailyReady ? '보상 수령 가능' : escapeHtml(daily?.description || '오늘의 사냥 보상을 챙기세요.')}</span></button>
      <button class="recommended" data-zone-id="${escapeHtml(recommended?.id || 'slime-forest')}" type="button"><b>${escapeHtml(recommended?.title || '루미나 숲 초입')}</b><span>Lv.${recommended?.recommendedLevel || 1} · 바로 사냥 시작</span></button>
    `;
    questList.querySelectorAll<HTMLButtonElement>('[data-town-content]').forEach((button) => {
      button.addEventListener('click', () => openTownContent((button.dataset.townContent || 'story') as TownContentId));
    });
    questList.querySelectorAll<HTMLButtonElement>('[data-zone-id]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled || sceneTransition.classList.contains('show')) return;
        if (!pendingSave) pendingSave = getSelectedCharacter();
        if (!pendingSave) {
          showToast('사냥터에 입장할 캐릭터를 선택하세요.');
          return;
        }
        await startField(pendingSave, button.dataset.zoneId || 'slime-forest');
      });
    });
  });

  const described = save.inventory.flatMap((instance) => {
    const def = items.find((entry) => entry.id === instance.itemId);
    return def ? [{ def, instance }] : [];
  });
  const sorted = sortedInventoryEntries(save, described).slice(0, 24);
  const cells = sorted.map(({ def, instance }) => {
    const equipped = (def.type === 'weapon' || def.type === 'armor' || def.type === 'relic') && save.equipment?.[def.type as EquipmentSlot] === instance.uid;
    return `<button class="town-lobby-item-070 rarity-${def.rarity.toLowerCase()} ${equipped ? 'equipped' : ''}" data-town-content="inventory" type="button" title="${escapeHtml(def.name)}"><img src="${itemArtUrl(def)}" alt=""/><span>${instance.count > 1 ? formatNumber(instance.count) : ''}</span></button>`;
  });
  while (cells.length < 24) cells.push('<button class="town-lobby-item-070 empty" data-town-content="inventory" type="button" aria-label="빈 슬롯"></button>');
  document.querySelectorAll<HTMLElement>('[data-town-lobby-bag]').forEach((bag) => {
    bag.innerHTML = cells.join('');
    bag.querySelectorAll<HTMLButtonElement>('[data-town-content]').forEach((button) => {
      button.addEventListener('click', () => openTownContent((button.dataset.townContent || 'inventory') as TownContentId));
    });
  });
  document.querySelectorAll<HTMLElement>('[data-town-lobby-bag-count]').forEach((bagCount) => { bagCount.textContent = `${save.inventory.length}/64`; });
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
  document.body.dataset.townContent = visible;
  townScreen.dataset.townContent = visible;
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
  if (content !== 'shop') pendingShopPurchase088 = null;
  activeTownContent = content;
  townContentOpen = true;
  document.body.classList.add('town-drawer-open');
  townScreen.classList.add('town-drawer-open');
  townContentPanel.classList.remove('hidden');
  townContentPanel.setAttribute('aria-hidden', 'false');
  syncMenuWindowSafeFrame111(townContentPanel);
  openMenuWindow111(townContentPanel);
  syncTownMenuState();
  renderTownContent();
  scheduleUiSafetyAudit();
}

function closeTownContentPanel() {
  townContentOpen = false;
  document.body.classList.remove('town-drawer-open');
  townScreen.classList.remove('town-drawer-open');
  closeMenuWindow111(townContentPanel);
  townContentPanel.classList.add('hidden');
  townContentPanel.setAttribute('aria-hidden', 'true');
  syncTownMenuState();
  scheduleUiSafetyAudit();
}

function renderTownContent() {
  if (!pendingSave) return;
  const meta = townContentMeta[activeTownContent];
  townContentEyebrow.textContent = meta.eyebrow;
  townContentTitle.textContent = meta.title;

  const contentMap: Record<TownContentId, () => string> = {
    hunt: () => renderTownHunt(pendingSave as PlayerSave),
    story: () => renderTownStory(pendingSave as PlayerSave),
    cards: () => renderTownCards(pendingSave as PlayerSave),
    inventory: () => renderTownInventory(pendingSave as PlayerSave),
    skills: () => renderTownSkills(pendingSave as PlayerSave),
    shop: () => renderTownShop(pendingSave as PlayerSave),
    boss: () => renderTownBoss(pendingSave as PlayerSave),
    quests: () => renderTownQuests(pendingSave as PlayerSave),
    pledge: () => renderTownPledge(pendingSave as PlayerSave),
    settings: () => renderSystemDoctor085(pendingSave as PlayerSave, 'town') + renderTechnicalHealthPanel(pendingSave as PlayerSave, 'town') + renderAutoHuntSettingsPanel(pendingSave as PlayerSave) + renderAudioSettingsPanel('town'),
    account: () => renderTownAccount(pendingSave as PlayerSave)
  };

  townContentBody.innerHTML = `${renderTownDrawerNav(activeTownContent)}${renderTownFlowAdvisor082(pendingSave as PlayerSave, activeTownContent)}${contentMap[activeTownContent]()}`;
}

function renderTownDrawerNav(active: TownContentId) {
  const buttons = townDrawerOrder
    .map((id) => {
      const meta = townContentMeta[id];
      return `<button class="town-drawer-tab-080 town-drawer-tab-081 town-drawer-tab-082 town-drawer-tab-083 ${id === active ? 'active' : ''} ${meta.core ? 'core' : 'more'}" data-town-content="${id}" type="button" aria-pressed="${id === active ? 'true' : 'false'}"><i>${meta.icon}</i><b>${escapeHtml(meta.label)}</b></button>`;
    })
    .join('');
  return `<nav class="town-drawer-tabs-080 town-drawer-tabs-081 town-drawer-tabs-082 town-drawer-tabs-083" aria-label="마을 메뉴 빠른 이동">${buttons}</nav>`;
}

function renderTownFlowAdvisor082(save: PlayerSave, active: TownContentId) {
  const quest = currentStoryQuest(save);
  const progress = quest ? Math.min(quest.target, storyQuestProgress(save, quest)) : 0;
  const percent = quest ? Math.min(100, Math.round((progress / Math.max(1, quest.target)) * 100)) : 100;
  const zone = quest ? recommendedZoneForQuest(save, quest) : zones.find((entry) => isZoneUnlocked(save, entry.id) && entry.recommendedLevel <= save.level) || zones[0];
  const dailyReady = dailyQuests.filter((entry) => !save.daily.claimedQuestIds.includes(entry.id) && questProgress(save, entry.id) >= entry.target).length;
  const classInfo = classes[save.classId];
  const inventoryUsed = save.inventory.length;
  const inventoryCap = 200;
  const activeMeta = townContentMeta[active];
  const zoneAction = zone && isZoneUnlocked(save, zone.id)
    ? `<button class="town-advisor-cta primary" data-town-zone-enter="${zone.id}" type="button">추천 사냥터</button>`
    : `<button class="town-advisor-cta" data-town-content="hunt" type="button">사냥터 보기</button>`;
  return `
    <section class="town-flow-advisor-082 town-flow-advisor-083" aria-label="현재 진행 가이드">
      <div class="town-flow-main-082 town-flow-main-083">
        <span class="town-flow-eyebrow-082 town-flow-eyebrow-083">SOUL ONLINE · v${ALPHA_VERSION}</span>
        <h3>${escapeHtml(activeMeta.title)}</h3>
        <p>${quest ? `${escapeHtml(quest.title)} · ${escapeHtml(quest.goalText)}` : '현재 준비된 스토리를 모두 완료했습니다. 카드/장비/보스 루프를 강화하세요.'}</p>
        <div class="town-flow-progress-082 town-flow-progress-083"><i style="width:${percent}%"></i><em>${quest ? `${progress}/${quest.target}` : 'CLEAR'}</em></div>
      </div>
      <div class="town-flow-stats-082 town-flow-stats-083">
        <span><b>Lv.${save.level}</b><em>${escapeHtml(classInfo?.name || save.classId)}</em></span>
        <span><b>${formatNumber(powerFromSave(save))}</b><em>전투력</em></span>
        <span><b>${dailyReady}</b><em>보상대기</em></span>
        <span><b>${inventoryUsed}/${inventoryCap}</b><em>가방</em></span>
      </div>
      <div class="town-flow-actions-082 town-flow-actions-083">
        ${zoneAction}
        <button class="town-advisor-cta" data-town-content="story" type="button">스토리</button>
        <button class="town-advisor-cta" data-town-content="inventory" type="button">정비</button>
      </div>
    </section>
  `;
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
    townStoryDesc.textContent = 'Alpha 0.92 스토리를 모두 완료했습니다.';
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
  return { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0, shadowImp: 0, mossGolem: 0, wraith: 0, fireDrake: 0, stormHarpy: 0, graveKnight: 0, fieldBoss: 0, orcBerserker: 0, nightmareBat: 0, lavaGolem: 0, iceWitch: 0, royalGuard: 0, riftBeast: 0 };
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



function expeditionSupportTier(save: PlayerSave) {
  const clearedStory = save.story?.claimedQuestIds?.length || 0;
  const bossKills = (save.kills?.fieldBoss || 0) + (save.kills?.dragon || 0);
  const soulCount = save.souls?.filter((soul) => soul.unlocked).length || 0;
  return Math.max(0, Math.min(8, Math.floor(clearedStory / 35) + Math.floor(bossKills / 45) + Math.floor(soulCount / 4)));
}

function expeditionSupportBonus(save: PlayerSave): Partial<Stats> {
  const tier = expeditionSupportTier(save);
  return {
    hp: tier * 95,
    mp: tier * 28,
    atk: tier * 9,
    def: tier * 6,
    crit: tier * 0.004
  };
}

function pledgeInfo(save: PlayerSave) {
  const pledge = save.pledge ||= { name: '루미나 혈맹', level: 1, exp: 0, contribution: 0, crest: 'lion', donatedGold: 0, claimedTaskIds: [] };
  const need = pledge.level >= 20 ? 0 : pledgeExpToNext(pledge.level);
  const percent = pledge.level >= 20 ? 100 : Math.min(100, Math.round((pledge.exp / Math.max(1, need)) * 100));
  const crestLabel = pledge.crest === 'dragon' ? '용문장' : pledge.crest === 'moon' ? '월광문장' : '사자문장';
  return { pledge, need, percent, crestLabel };
}

function pledgeStatBonus(save: PlayerSave): Partial<Stats> {
  const level = Math.max(1, Math.min(20, Math.floor(Number(save.pledge?.level || 1))));
  return {
    hp: level * 18,
    mp: level * 5,
    atk: Math.floor(level * 1.7),
    def: Math.floor(level * 1.25),
    crit: level >= 10 ? 0.006 : 0
  };
}

function addPledgeExp(save: PlayerSave, amount: number) {
  const info = pledgeInfo(save);
  const pledge = info.pledge;
  pledge.exp += Math.max(0, Math.floor(amount));
  pledge.contribution += Math.max(0, Math.floor(amount));
  let leveled = false;
  while (pledge.level < 20 && pledge.exp >= pledgeExpToNext(pledge.level)) {
    pledge.exp -= pledgeExpToNext(pledge.level);
    pledge.level += 1;
    leveled = true;
  }
  return leveled;
}

function renderTownPledge(save: PlayerSave) {
  const { pledge, need, percent, crestLabel } = pledgeInfo(save);
  const bonus = pledgeStatBonus(save);
  const bossKills = (save.kills.fieldBoss || 0) + (save.kills.dragon || 0);
  const tasks = [
    { id: 'smith-contract', npc: '브람', title: '대장장이 보급 계약', desc: '강화석 20개 납품', ready: materialCount(save, 'enhance-stone') >= 20, done: pledge.claimedTaskIds.includes('smith-contract'), reward: '공헌 320 · 보급함' },
    { id: 'oracle-contract', npc: '미온', title: '예언자의 망령 기록', desc: '망령 사제 누적 100마리', ready: (save.kills.wraith || 0) >= 100, done: pledge.claimedTaskIds.includes('oracle-contract'), reward: '공헌 360 · 평판 증서' },
    { id: 'captain-contract', npc: '세이라', title: '지휘관 보스 기록', desc: '보스/용 누적 10마리', ready: bossKills >= 10, done: pledge.claimedTaskIds.includes('captain-contract'), reward: '공헌 520 · 군주의 인장' }
  ];
  const taskRows = tasks.map((task) => `
    <article class="pledge-task ${task.ready && !task.done ? 'ready' : task.done ? 'done' : ''}">
      <span>${escapeHtml(task.npc)}</span><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.desc)}</p><em>${escapeHtml(task.reward)}</em>
      <button data-town-pledge-action="claim:${task.id}" ${task.ready && !task.done ? '' : 'disabled'}>${task.done ? '완료' : task.ready ? '수령' : '진행중'}</button>
    </article>
  `).join('');
  return `
    <section class="pledge-command-panel pledge-crest-${pledge.crest}">
      <div class="pledge-hero">
        <div class="pledge-crest"><span>${pledge.crest === 'dragon' ? '龍' : pledge.crest === 'moon' ? '月' : '獅'}</span></div>
        <div>
          <span class="town-eyebrow">BLOOD PLEDGE HQ</span>
          <h3>${escapeHtml(pledge.name)} Lv.${pledge.level}</h3>
          <p>${crestLabel} · 공헌 ${formatNumber(pledge.contribution)} · 누적 기부 ${formatGold(pledge.donatedGold)}</p>
          <div class="bar exp pledge-exp"><i style="width:${percent}%"></i><em>${pledge.level >= 20 ? 'MAX' : `${formatNumber(pledge.exp)} / ${formatNumber(need)}`}</em></div>
        </div>
      </div>
      <div class="pledge-bonus-grid">
        <article><b>HP +${Math.round(bonus.hp || 0)}</b><span>혈맹 체력 훈련</span></article>
        <article><b>ATK +${Math.round(bonus.atk || 0)}</b><span>전투 지휘</span></article>
        <article><b>DEF +${Math.round(bonus.def || 0)}</b><span>성채 방어술</span></article>
        <article><b>DROP +${Math.min(10, Math.max(0, pledge.level - 1) * 0.6).toFixed(1)}%</b><span>전리품 수색대</span></article>
      </div>
      <div class="pledge-action-row">
        <button data-town-pledge-action="donate-gold">골드 50,000 기부</button>
        <button data-town-pledge-action="donate-coin">공헌 주화 10개 납품</button>
        <button data-town-pledge-action="donate-royal">군주의 인장 납품</button>
        <button data-town-pledge-action="exchange-cache">혈맹 전쟁 궤짝 교환</button>
      </div>
    </section>
    <section class="pledge-npc-board">
      <div class="town-section-head"><span class="town-eyebrow">NPC CONTRACT</span><h3>마을 NPC 계약 의뢰</h3></div>
      <div class="pledge-task-grid">${taskRows}</div>
    </section>
  `;
}

function handleTownPledgeAction(action: string) {
  if (!pendingSave) return;
  const save = pendingSave;
  const pledge = pledgeInfo(save).pledge;
  const fail = (message: string) => { showToast(message); audioService.play('error'); };
  if (action === 'donate-gold') {
    if (save.gold < 50000) return fail('기부할 골드가 부족합니다.');
    save.gold -= 50000;
    pledge.donatedGold += 50000;
    addPledgeExp(save, 260);
    showToast('혈맹에 50,000골드를 기부했습니다.');
  } else if (action === 'donate-coin') {
    if (materialCount(save, 'pledge-coin') < 10) return fail('혈맹 공헌 주화가 부족합니다.');
    consumeMaterial(save, 'pledge-coin', 10);
    addPledgeExp(save, 520);
    showToast('공헌 주화 10개를 납품했습니다.');
  } else if (action === 'donate-royal') {
    if (materialCount(save, 'royal-seal') < 1) return fail('군주의 인장이 부족합니다.');
    consumeMaterial(save, 'royal-seal', 1);
    addPledgeExp(save, 1250);
    showToast('군주의 인장을 혈맹에 봉납했습니다.');
  } else if (action === 'exchange-cache') {
    if (pledge.contribution < 600) return fail('혈맹 공헌이 부족합니다. 필요 600');
    if (materialCount(save, 'royal-seal') < 1) return fail('군주의 인장이 부족합니다.');
    pledge.contribution -= 600;
    consumeMaterial(save, 'royal-seal', 1);
    addInventoryItem(save, 'pledge-war-cache', 1);
    showLootPresentation({ type: 'item', title: '혈맹 전쟁 궤짝', subtitle: '가방에서 개봉 가능', art: itemArtUrl(items.find((item) => item.id === 'pledge-war-cache') || items[0]), rarity: 'SSR' });
  } else if (action.startsWith('claim:')) {
    const id = action.split(':')[1] || '';
    if (pledge.claimedTaskIds.includes(id)) return fail('이미 완료한 NPC 계약입니다.');
    if (id === 'smith-contract') {
      if (materialCount(save, 'enhance-stone') < 20) return fail('강화석 20개가 필요합니다.');
      consumeMaterial(save, 'enhance-stone', 20);
      addInventoryItem(save, 'village-contract-box', 1);
      addPledgeExp(save, 320);
    } else if (id === 'oracle-contract') {
      if ((save.kills.wraith || 0) < 100) return fail('망령 사제 누적 100마리 처치가 필요합니다.');
      addInventoryItem(save, 'npc-favor', 5);
      addPledgeExp(save, 360);
    } else if (id === 'captain-contract') {
      const bossKills = (save.kills.fieldBoss || 0) + (save.kills.dragon || 0);
      if (bossKills < 10) return fail('보스/용 누적 10마리 처치가 필요합니다.');
      addInventoryItem(save, 'royal-seal', 1);
      addPledgeExp(save, 520);
    } else return;
    pledge.claimedTaskIds.push(id);
    showToast('NPC 계약 의뢰 보상을 받았습니다.');
  }
  audioService.play('reward');
  persistTownSave();
}




function showTownNpcSpotlight(id: string) {
  if (!townNpcSpotlight || !townNpcSpotlightName || !townNpcSpotlightLine) return;
  const lines: Record<string, { name: string; line: string; tone: string }> = {
    smith: { name: '대장장이 브람', line: '아이템은 보이는 순간부터 설득력이 있어야 합니다. 장비와 강화 흐름을 같이 보겠습니다.', tone: 'smith' },
    oracle: { name: '예언자 미온', line: '다음 전선의 빛과 이야기를 이어 보겠습니다. 막히지 않게 길을 보여드릴게요.', tone: 'oracle' },
    captain: { name: '지휘관 세이라', line: '혈맹과 보스 전선은 전장의 중심입니다. 보상, 성향, 루트를 함께 점검하죠.', tone: 'captain' }
  };
  const picked = lines[id] || { name: '루미나 주민', line: '마을과 전장이 자연스럽게 이어지도록 도와드릴게요.', tone: 'common' };
  townNpcSpotlight.dataset.tone = picked.tone;
  townNpcSpotlightName.textContent = picked.name;
  townNpcSpotlightLine.textContent = picked.line;
  townNpcSpotlight.classList.remove('hidden', 'show');
  void townNpcSpotlight.offsetWidth;
  townNpcSpotlight.classList.add('show');
  window.clearTimeout(Number(townNpcSpotlight.dataset.timer || 0));
  const timer = window.setTimeout(() => townNpcSpotlight.classList.remove('show'), 3600);
  townNpcSpotlight.dataset.timer = String(timer);
}

function renderVisualImmersionBoard(save: PlayerSave) {
  const unlocked = zones.filter((zone) => isZoneUnlocked(save, zone.id)).length;
  const highRank = save.inventory.filter((entry) => {
    const def = items.find((item) => item.id === entry.itemId);
    return def && (def.rarity === 'SSR' || def.rarity === 'UR');
  }).reduce((sum, entry) => sum + entry.count, 0);
  const chainHint = save.level >= 20 ? '희귀 드랍 플레어 · 타격 궤적 강화' : '초반 숲 광원 · 캐릭터 실루엣 강화';
  const polishItems = ['luminous-hunt-pass', 'royal-impact-oil', 'moonlit-repair-thread', 'ancient-polish-stone'].reduce((sum, id) => sum + materialCount(save, id), 0);
  const titleGrade = save.level >= 80 ? 'OMEGA' : save.level >= 30 ? 'HERO' : 'ADVENTURE';
  return `
    <section class="visual-immersion-board">
      <div class="visual-board-title">
        <span>ASSET UPGRADE 0.63</span>
        <h3>${titleGrade} 무드 보드</h3>
        <p>캐릭터·몬스터·지형·UI 자산을 레퍼런스 톤에 맞춰 대규모로 재가공하고 펫 동행/필드 소재감을 강화했습니다.</p>
      </div>
      <div class="visual-board-grid">
        <article><b>자산</b><span>0.63 대규모 패스</span><em>영웅/몬스터/타일 WebP 재가공</em></article>
        <article><b>펫</b><span>동행 실루엣</span><em>필드 플레이어 곁 미니 소울</em></article>
        <article><b>필드</b><span>${unlocked}/${zones.length} 전선</span><em>전장 조명 · 보스 게이트</em></article>
        <article><b>전투</b><span>SSR/UR ${highRank}개 보유</span><em>강타/희귀 드랍 집중 연출</em></article>
        <article><b>품질 재료</b><span>${polishItems}개 보유</span><em>허가증/연마유/광택석</em></article>
      </div>
    </section>
  `;
}

function renderOmegaCommandBoard(save: PlayerSave) {
  const clearedStory = save.story?.claimedQuestIds?.length || 0;
  const nextOmegaZone = zones.find((zone) => zone.order >= 49 && !isZoneUnlocked(save, zone.id));
  const unlockedOmega = zones.filter((zone) => zone.order >= 49 && isZoneUnlocked(save, zone.id)).length;
  const totalOmega = zones.filter((zone) => zone.order >= 49).length;
  const dailyReady = dailyQuests.filter((quest) => !save.daily.claimedQuestIds.includes(quest.id) && questProgress(save, quest.id) >= quest.target).length;
  const tier = expeditionSupportTier(save);
  const bonus = expeditionSupportBonus(save);
  return `
    <section class="omega-command-board">
      <div class="omega-command-hero">
        <span class="town-eyebrow">OMEGA OVERDRIVE</span>
        <h3>루미나 원정 지휘소</h3>
        <p>${nextOmegaZone ? `${escapeHtml(nextOmegaZone.title)}까지 Lv.${nextOmegaZone.unlockLevel || nextOmegaZone.recommendedLevel} 목표` : '오메가 최종 전선까지 개방되었습니다. 반복 토벌과 보스 보상을 이어가세요.'}</p>
      </div>
      <div class="omega-command-grid">
        <article><b>${unlockedOmega}/${totalOmega}</b><span>오메가 전선</span><em>Lv.114 이후 초월 루트</em></article>
        <article><b>${clearedStory}</b><span>메인 완료</span><em>스토리 누적 진행도</em></article>
        <article><b>${dailyReady}</b><span>보상 대기 의뢰</span><em>즉시 수령 가능</em></article>
        <article><b>지원 ${tier}</b><span>동료 지휘 보너스</span><em>HP +${Math.round(bonus.hp || 0)} · ATK +${Math.round(bonus.atk || 0)}</em></article>
      </div>
      <div class="omega-npc-strip">
        <span>세이라: 전선은 넓어졌고, 원정대는 당신의 기록을 따라 움직입니다.</span>
        <span>브람: 새 유물과 재료가 모이면 장비 공명을 다시 점검하세요.</span>
      </div>
    </section>
  `;
}

function renderMegaProgressDashboard(save: PlayerSave) {
  const clearedStory = save.story?.claimedQuestIds?.length || 0;
  const totalStory = storyQuests.length;
  const unlockedZoneCount = zones.filter((zone) => isZoneUnlocked(save, zone.id)).length;
  const totalDaily = dailyQuests.length;
  const cardsOwned = save.cards.length;
  const soulsUnlocked = save.souls.filter((soul) => soul.unlocked).length;
  const nextZone = zones.find((zone) => !isZoneUnlocked(save, zone.id));
  const activeQuest = currentStoryQuest(save);
  const nextText = nextZone ? `${nextZone.title} · Lv.${nextZone.unlockLevel || nextZone.recommendedLevel}` : '모든 전선 개방';
  const questText = activeQuest ? `${activeQuest.title} · ${activeQuest.goalText}` : '메인 스토리 전체 완료';
  const percent = totalStory ? Math.round((clearedStory / totalStory) * 100) : 100;
  return `
    <section class="mega-progress-dashboard">
      <div class="mega-dashboard-head">
        <span>ALPHA 0.50 OMEGA OVERDRIVE</span>
        <h3>콘텐츠 진행 보드</h3>
        <p>${escapeHtml(questText)}</p>
        <div class="bar exp quest-progress"><i style="width:${Math.min(100, percent)}%"></i><em>${clearedStory}/${totalStory}</em></div>
      </div>
      ${renderVisualImmersionBoard(save)}
      ${renderOmegaCommandBoard(save)}
      <div class="mega-dashboard-grid">
        <article><b>${unlockedZoneCount}/${zones.length}</b><span>전선 개방</span><em>${escapeHtml(nextText)}</em></article>
        <article><b>${totalStory}</b><span>메인 퀘스트</span><em>장기 챕터 루트</em></article>
        <article><b>${totalDaily}</b><span>일일/순환 의뢰</span><em>반복 파밍 루프</em></article>
        <article><b>${cardsOwned}</b><span>보유 카드</span><em>세트/도감 성장</em></article>
        <article><b>${soulsUnlocked}/${souls.length}</b><span>영혼 해방</span><em>누적 토벌 성장</em></article>
      </div>
    </section>
  `;
}

function renderChapterCompass(save: PlayerSave) {
  const active = currentStoryQuest(save);
  const chapters = Array.from(new Set(storyQuests.map((quest) => quest.chapter))).sort((a, b) => a - b);
  const currentChapter = active?.chapter || chapters.at(-1) || 1;
  const selected = chapters.filter((chapter) => chapter === 1 || chapter === currentChapter || chapter % 5 === 0 || (chapter >= currentChapter - 1 && chapter <= currentChapter + 2)).slice(-18);
  return `
    <section class="chapter-compass">
      <div><span>CHAPTER COMPASS</span><h3>챕터 항해도</h3><p>전체 ${chapters.length}개 챕터 · 현재 CH.${currentChapter}</p></div>
      <div class="chapter-compass-line">
        ${selected.map((chapter) => `<span class="${chapter === currentChapter ? 'active' : chapter < currentChapter ? 'cleared' : ''}">CH.${chapter}</span>`).join('')}
      </div>
    </section>
  `;
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
    ${renderMegaProgressDashboard(save)}
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
    ${renderMegaProgressDashboard(save)}
    ${renderChapterCompass(save)}
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


function renderTownLoadoutBoard083(save: PlayerSave) {
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'relic'];
  const rows = slots.map((slot) => {
    const uidValue = save.equipment?.[slot];
    const instance = uidValue ? save.inventory.find((entry) => entry.uid === uidValue) : null;
    const def = instance ? items.find((item) => item.id === instance.itemId) : null;
    const level = uidValue ? save.enhancements?.[uidValue] || 0 : 0;
    const label = slot === 'weapon' ? '무기' : slot === 'armor' ? '방어구' : '유물';
    return `<article class="loadout-slot-083 ${def ? `rarity-${def.rarity.toLowerCase()}` : 'empty'}"><span>${label}</span><b>${def ? escapeHtml(def.name) : '비어 있음'}</b><em>${def ? `${def.rarity} · +${level}` : '장착 필요'}</em></article>`;
  }).join('');
  const stats = calculateStatsFromSave(save);
  const equipped = slots.filter((slot) => Boolean(save.equipment?.[slot])).length;
  const enhanceReady = save.inventory.filter((entry) => canUpgradeItemInstance(save, entry.uid)).length;
  const shard = materialCount(save, 'soul-shard');
  const stone = materialCount(save, 'enhance-stone');
  return `
    <section class="town-loadout-board-083" aria-label="장비 정비 요약">
      <div class="loadout-hero-083">
        <span class="panel-kicker">LOADOUT READY</span>
        <h3>전투 준비도 ${formatNumber(powerFromSave(save))}</h3>
        <p>장착 ${equipped}/3 · 강화 가능 ${enhanceReady}개 · 파편 ${shard} · 강화석 ${stone}</p>
        <div class="loadout-stat-strip-083">
          <span>HP <b>${stats.hp}</b></span><span>ATK <b>${stats.atk}</b></span><span>DEF <b>${stats.def}</b></span><span>CRIT <b>${Math.round(stats.crit * 100)}%</b></span>
        </div>
      </div>
      <div class="loadout-slots-083">${rows}</div>
      <div class="loadout-actions-083">
        <button class="wide-action primary" data-town-content="shop" type="button">상점 보급</button>
        <button class="wide-action" ${enhanceReady ? '' : 'disabled'} data-town-dismantle-duplicates="true" type="button">중복 분해</button>
      </div>
    </section>
  `;
}

function renderTownInventory(save: PlayerSave) {
  const stats = calculateStatsFromSave(save);
  return `
    <div class="town-stat-grid">
      <span>HP <b>${stats.hp}</b></span>
      <span>MP <b>${stats.mp}</b></span>
      <span>ATK <b>${stats.atk}</b></span>
      <span>DEF <b>${stats.def}</b></span>
      <span>ASPD <b>${stats.aspd}</b></span>
      <span>CRIT <b>${Math.round(stats.crit * 100)}%</b></span>
    </div>
    ${renderTownLoadoutBoard083(save)}
    ${renderEquipmentResonanceSummary(save, true)}
    ${renderEnhancementWorkbench(save)}
    ${renderPotionBeltSummary(save)}
    ${renderInventoryPanel111(save, { townMode: true, activeFilter: activeInventoryFilter088, bagLimit: 64 })}
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
  const config = {
    supply: { trophy: 2, purity: 0, blood: 0, itemId: 'boss-supply-box', title: '보스 보급 상자', rarity: 'SR' },
    elite: { trophy: 5, purity: 0, blood: 0, itemId: 'elite-boss-box', title: '정예 보스 상자', rarity: 'SSR' },
    ancient: { trophy: 10, purity: 0, blood: 2, itemId: 'ancient-boss-cache', title: '고대 보스 전리품', rarity: 'UR' },
    lawful: { trophy: 0, purity: 8, blood: 0, itemId: 'lawful-supply-crate', title: '라우풀 보급 궤짝', rarity: 'SSR' }
  } as const;
  const entry = config[(kind as keyof typeof config)] || config.supply;
  if (entry.trophy && materialCount(pendingSave, 'boss-trophy') < entry.trophy) { showToast(`균열 토벌 훈장이 부족합니다. 필요 ${entry.trophy}개`); return; }
  if (entry.blood && materialCount(pendingSave, 'blood-crystal') < entry.blood) { showToast(`혈맹 결정이 부족합니다. 필요 ${entry.blood}개`); return; }
  if (entry.purity && materialCount(pendingSave, 'purity-mark') < entry.purity) { showToast(`정화의 표식이 부족합니다. 필요 ${entry.purity}개`); return; }
  if (kind === 'lawful' && lawfulInfo(pendingSave).value < 6000) { showToast('질서 이상 성향에서만 라우풀 보급을 받을 수 있습니다.'); return; }
  if (entry.trophy) consumeMaterial(pendingSave, 'boss-trophy', entry.trophy);
  if (entry.blood) consumeMaterial(pendingSave, 'blood-crystal', entry.blood);
  if (entry.purity) consumeMaterial(pendingSave, 'purity-mark', entry.purity);
  addInventoryItem(pendingSave, entry.itemId, 1);
  audioService.play('reward');
  persistTownSave();
  flashActionFeedback(`${entry.title} 교환`);
  const def = items.find((item) => item.id === entry.itemId) || items[0];
  showLootPresentation({ type: 'item', title: def.name, subtitle: '가방에서 열 수 있습니다', art: itemArtUrl(def), rarity: entry.rarity });
  showToast(`${entry.title} 교환 완료`);
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


function renderShopHero083(save: PlayerSave) {
  const hp = materialCount(save, 'hp-potion-small') + materialCount(save, 'hp-potion-mid') + materialCount(save, 'hp-potion-high');
  const mp = materialCount(save, 'mp-potion-small') + materialCount(save, 'mp-potion-mid') + materialCount(save, 'mp-potion-high');
  const learnedCount = skills.filter((skill) => skill.classId === save.classId && save.learnedSkillIds?.includes(skill.id)).length;
  return `
    <section class="shop-hero-083" aria-label="상점 추천 보급">
      <div>
        <span class="panel-kicker">LUMINA MARKET</span>
        <h3>오늘의 전투 보급</h3>
        <p>보유 골드 ${formatGold(save.gold)} · HP 물약 ${hp}개 · MP 물약 ${mp}개 · 스킬 ${learnedCount}/3</p>
      </div>
      <div class="shop-recommend-grid-083">
        <button ${save.gold < 35 ? 'disabled' : ''} data-town-shop-buy-bulk="hp-potion-small" data-town-shop-count="5" type="button"><b>HP 묶음</b><em>5개 ${formatGold(35)}</em></button>
        <button ${save.gold < 45 ? 'disabled' : ''} data-town-shop-buy-bulk="mp-potion-small" data-town-shop-count="5" type="button"><b>MP 묶음</b><em>5개 ${formatGold(45)}</em></button>
        <button data-town-content="inventory" type="button"><b>가방 점검</b><em>장비/강화</em></button>
      </div>
    </section>
  `;
}

function shopCategory083(def: ItemDefinition) {
  if (def.type === 'consumable') return '소모품';
  if (def.type === 'skillbook') return '스킬북';
  if (def.type === 'material') return '재료';
  if (def.type === 'weapon' || def.type === 'armor' || def.type === 'relic') return '장비';
  return '기타';
}

function renderTownShop(save: PlayerSave) {
  const detailedStock = TOWN_SHOP_STOCK_088
    .flatMap((entry) => {
      const def = items.find((item) => item.id === entry.itemId);
      return def ? [{ ...entry, def, filter: shopFilterForItem088(def.type) }] : [];
    });
  const counts = [
    { key: 'all' as const, label: '전체', count: detailedStock.length },
    { key: 'consumable' as const, label: '소모품', count: detailedStock.filter((entry) => entry.filter === 'consumable').length },
    { key: 'skillbook' as const, label: '스킬북', count: detailedStock.filter((entry) => entry.filter === 'skillbook').length },
    { key: 'equipment' as const, label: '장비', count: detailedStock.filter((entry) => entry.filter === 'equipment').length },
    { key: 'material' as const, label: '재료', count: detailedStock.filter((entry) => entry.filter === 'material').length }
  ];
  const normalizedFilter = normalizeShopFilter088(activeShopFilter088);
  const rows = detailedStock
    .filter((entry) => normalizedFilter === 'all' || entry.filter === normalizedFilter)
    .map(({ def, price, label }) => {
      const soldOut = isSkillBookSoldOut(save, def);
      const disabled = soldOut || save.gold < price ? 'disabled' : '';
      const bulkDisabled = soldOut || save.gold < price * 5 || def.type === 'skillbook' ? 'disabled' : '';
      const buyLabel = soldOut ? '품절' : save.gold < price ? '골드 부족' : '구매 검토';
      const bulkLabel = def.type === 'skillbook' ? '1회 한정' : `5개 ${formatGold(price * 5)}`;
      return `
        <article class="shop-row shop-row-083 shop-row-088 ${soldOut ? 'sold-out' : ''} rarity-${def.rarity.toLowerCase()}" data-shop-category="${shopCategory083(def)}" data-shop-filter="${shopFilterForItem088(def.type)}">
          <span class="shop-item-art"><img src="${itemArtUrl(def)}" alt="${escapeHtml(def.name)}" onerror="this.remove()" />${inlineFallbackIcon(itemIcon(def.type))}</span>
          <div>
            <div class="pill-row"><span class="pill">${shopCategory083(def)}</span><span class="pill">${def.rarity}</span><span class="pill">${label}</span>${soldOut ? '<span class="pill">습득 완료</span>' : ''}</div>
            <h3>${escapeHtml(def.name)}</h3>
            <p>${escapeHtml(def.effectText)} · 가격 ${formatGold(price)}</p>
          </div>
          <div class="shop-buy-actions shop-buy-actions-088">
            <button ${disabled} data-town-shop-buy="${def.id}">${buyLabel}</button>
            <button ${bulkDisabled} data-town-shop-buy-bulk="${def.id}" data-town-shop-count="5">${bulkLabel}</button>
          </div>
        </article>
      `;
    })
    .join('') || '<article class="shop-empty-088"><b>해당 분류 상품 없음</b><span>상단 필터를 전체로 돌려 보급품을 확인하세요.</span></article>';
  const filterLabel = counts.find((entry) => entry.key === normalizedFilter)?.label || '전체';
  return `
    ${renderShopHero083(save)}
    ${renderShopPurchaseConfirm088(pendingShopPurchase088, formatGold(save.gold))}
    <div class="town-content-note town-content-note-083 town-content-note-088">보유 골드 ${formatGold(save.gold)} · 현재 ${filterLabel} 보기 · 구매/스킬 강화는 확인 단계를 거칩니다.</div>
    ${renderShopFilterRail088(counts, normalizedFilter)}
    ${renderPotionBeltSummary(save)}
    <div class="shop-list shop-list-083 shop-list-088">${rows}</div>
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
  const purity = materialCount(save, 'purity-mark');
  const blood = materialCount(save, 'blood-crystal');
  const canSupply = trophyCount >= 2;
  const canElite = trophyCount >= 5;
  const canAncient = trophyCount >= 10 && blood >= 2;
  const canLawful = purity >= 8 && lawfulInfo(save).value >= 6000;
  return `
    <div class="boss-panel boss-bounty-panel boss-bounty-panel-052">
      <div class="boss-emblem">RAID</div>
      <div>
        <div class="pill-row">
          <span class="pill">권장 Lv.16+</span>
          <span class="pill">훈장 ${trophyCount}개</span>
          <span class="pill">정화 ${purity}개</span>
          <span class="pill">혈맹결정 ${blood}개</span>
          <span class="pill">내 Lv.${save.level}</span>
        </div>
        <h3>보스 현상금 · 성향 보급소</h3>
        <p>필드보스와 심연룡을 토벌해 훈장/상자/혈맹 결정을 모으세요. 라우풀 성향은 드랍 안정성을 높이고 카오틱은 패널티가 적용됩니다.</p>
        ${fieldBoss ? `<p>필드보스: ${escapeHtml(fieldBoss.name)} · Lv.${fieldBoss.level} · 정예/고대 상자 드랍</p>` : ''}
        ${dragon ? `<p>심연룡: ${escapeHtml(dragon.name)} · Lv.${dragon.level} · 고대 전리품 고확률</p>` : ''}
        ${bear ? `<p>중간 보스: ${escapeHtml(bear.name)} · Lv.${bear.level} · 정예 상자 낮은 확률</p>` : ''}
        <div class="boss-bounty-actions boss-bounty-actions-052">
          <button class="wide-action primary" data-town-zone-enter="crystal-raid">수정 레이드 터 입장</button>
          <button class="wide-action" ${canSupply ? '' : 'disabled'} data-town-boss-exchange="supply">훈장 2개 · 보급 상자</button>
          <button class="wide-action" ${canElite ? '' : 'disabled'} data-town-boss-exchange="elite">훈장 5개 · 정예 상자</button>
          <button class="wide-action" ${canAncient ? '' : 'disabled'} data-town-boss-exchange="ancient">훈장 10 + 혈맹결정 2 · 고대 전리품</button>
          <button class="wide-action" ${canLawful ? '' : 'disabled'} data-town-boss-exchange="lawful">정화 8 + 질서 성향 · 라우풀 보급</button>
        </div>
      </div>
    </div>
    ${renderLawfulSystemPanel(save)}
    <section class="bounty-reward-grid bounty-reward-grid-052">
      <article><b>보급 상자</b><span>강화석/파편/물약 · 사냥 유지용</span></article>
      <article><b>정예 상자</b><span>고급 재료 + SSR 장비 낮은 확률</span></article>
      <article><b>고대 전리품</b><span>UR 장비, 성흔 유물, 오메가 재료 기회</span></article>
      <article><b>라우풀 보급</b><span>성향 수호자용 안정 보급 + 정화 재료</span></article>
    </section>
    <section class="safe-zone-guide"><b>안전지대</b><span>필드 진입로 근처에서는 몬스터 선공/패턴이 해제되고 체력 재정비가 가능합니다.</span></section>
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
              ${renderLawfulBadge(save, true)}
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
          <span><b>${lawfulInfo(save).tier}</b><em>성향</em></span>
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
      ${renderLawfulSystemPanel(save)}
      ${renderSystemDoctor085(save, 'account')}
      ${renderTechnicalHealthPanel(save, 'account')}
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


function openRewardBox(save: PlayerSave, entry: { uid: string; itemId: string; count: number }) {
  const def = items.find((item) => item.id === entry.itemId);
  if (!def) return false;
  const rewardMap: Record<string, Array<{ itemId?: string; count?: number; gold?: number; gems?: number; chance?: number }>> = {
    'boss-supply-box': [
      { gold: 1800 }, { gems: 10 }, { itemId: 'enhance-stone', count: 3 }, { itemId: 'soul-shard', count: 8 }, { itemId: 'hp-potion-high', count: 10 }, { itemId: 'mp-potion-high', count: 8 }
    ],
    'elite-boss-box': [
      { gold: 5200 }, { gems: 32 }, { itemId: 'enhance-stone', count: 8 }, { itemId: 'blood-crystal', count: 1 }, { itemId: 'guardian-aegis', chance: 0.18 }, { itemId: 'lawful-blade', chance: 0.14 }, { itemId: 'nightmare-robe', chance: 0.14 }
    ],
    'ancient-boss-cache': [
      { gold: 16000 }, { gems: 90 }, { itemId: 'blood-crystal', count: 3 }, { itemId: 'radiant-ore', count: 3 }, { itemId: 'celestial-sigil', chance: 0.28 }, { itemId: 'chaos-reaver', chance: 0.22 }, { itemId: 'omega-blade', chance: 0.18 }
    ],
    'lawful-supply-crate': [
      { gold: 7200 }, { gems: 42 }, { itemId: 'purity-mark', count: 2 }, { itemId: 'enhance-stone', count: 8 }, { itemId: 'lawful-blade', chance: 0.12 }, { itemId: 'guardian-aegis', chance: 0.12 }
    ]
  };
  const table = rewardMap[entry.itemId];
  if (!table) return false;
  const gained: string[] = [];
  for (const reward of table) {
    if (reward.chance && !roll(reward.chance)) continue;
    if (reward.gold) { save.gold += reward.gold; gained.push(formatGold(reward.gold)); }
    if (reward.gems) { save.gems += reward.gems; gained.push(`소울젬 ${reward.gems}`); }
    if (reward.itemId) {
      addInventoryItem(save, reward.itemId, reward.count || 1);
      const item = items.find((candidate) => candidate.id === reward.itemId);
      gained.push(`${item?.name || reward.itemId} x${reward.count || 1}`);
    }
  }
  entry.count -= 1;
  if (entry.count <= 0) save.inventory = save.inventory.filter((item) => item.uid !== entry.uid);
  audioService.play('reward');
  showLootPresentation({ type: 'item', title: def.name, subtitle: gained.slice(0, 4).join(' · ') || '보상 획득', art: itemArtUrl(def), rarity: def.rarity });
  showToast(`${def.name} 개봉 · ${gained.slice(0, 3).join(' · ')}`);
  return true;
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
    if (!def.consume && openRewardBox(pendingSave, entry)) { persistTownSave(); return; }
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

function stageTownShopPurchase088(itemId: string, amount = 1) {
  if (!pendingSave) return;
  const def = items.find((item) => item.id === itemId);
  const price = TOWN_SHOP_PRICE_088[itemId];
  if (!def || !price) {
    showToast('상점 연결 정보가 올바르지 않습니다. 기술 점검 패널을 확인하세요.');
    recordClientIssue('ui', `상점 재고 연결 누락: ${itemId}`);
    return;
  }
  const count = def.type === 'skillbook' ? 1 : Math.max(1, Math.min(99, Math.floor(amount || 1)));
  const totalPrice = price * count;
  const soldOut = isSkillBookSoldOut(pendingSave, def);
  const canAfford = !soldOut && pendingSave.gold >= totalPrice;
  pendingShopPurchase088 = {
    itemId,
    name: def.name,
    rarity: def.rarity,
    count,
    unitPrice: price,
    totalPrice,
    canAfford,
    reason: soldOut ? '이미 습득한 스킬서입니다.' : canAfford ? '구매 전 최종 확인 단계입니다.' : `골드 부족 · 필요 ${formatGold(totalPrice)}`
  };
  renderTownContent();
  scheduleUiSafetyAudit();
}

function buyTownShopItem(itemId: string, amount = 1) {
  if (!pendingSave) return;
  pendingShopPurchase088 = null;
  const price = TOWN_SHOP_PRICE_088[itemId];
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
  scheduleUiSafetyAudit();
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

  applyTownBonus(stats, expeditionSupportBonus(save), 1);
  applyTownBonus(stats, lawfulStatBonus(save), 1);
  applyTownBonus(stats, pledgeStatBonus(save), 1);

  stats.hp = Math.max(1, Math.round(stats.hp));
  stats.mp = Math.max(0, Math.round(stats.mp));
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
  // 1.10: Do not force device orientation. The game now adapts to the mode
  // the player opened it in, instead of rotating the screen or showing a guard.
}

async function withSceneTransition(label: string, action: () => Promise<void> | void) {
  sceneTransitionLabel.textContent = label;
  sceneTransition.classList.remove('phase-in-111', 'phase-switch-111');
  sceneTransition.classList.add('show', 'phase-out-111');
  sceneTransition.setAttribute('aria-hidden', 'false');
  document.body.classList.add('scene-transition-busy-111');
  try {
    await delay(160);
    sceneTransition.classList.add('phase-switch-111');
    await action();
    sceneTransition.classList.remove('phase-out-111', 'phase-switch-111');
    sceneTransition.classList.add('phase-in-111');
    await delay(220);
  } finally {
    sceneTransition.classList.remove('show', 'phase-out-111', 'phase-switch-111', 'phase-in-111');
    sceneTransition.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('scene-transition-busy-111');
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}


function installInteractionPulse086() {
  document.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, [role="button"], a, input, select, textarea')) lastActionAt086 = Date.now();
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') lastActionAt086 = Date.now();
  });
}

function knownContentIds086() {
  return {
    classIds: Object.keys(classes),
    itemIds: items.map((item) => item.id),
    cardIds: cards.map((card) => card.id),
    skillIds: skills.map((skill) => skill.id)
  };
}

function inspectCurrentContentGraph087() {
  const report = inspectContentGraph087({
    classes: Object.values(classes),
    items,
    cards,
    cardSets,
    souls,
    skills,
    monsters,
    zones,
    storyQuests,
    dailyQuests
  });
  lastContentGraphMessage087 = report.problems[0] || report.message;
  return report;
}




function installPerformanceGuards085() {
  refreshStorageEstimate085();
  window.setInterval(refreshStorageEstimate085, 30000);
  window.addEventListener('online', () => {
    networkState085 = '온라인';
    recordClientIssue('network', '네트워크 온라인 복귀');
    if (townContentOpen && (activeTownContent === 'settings' || activeTownContent === 'account')) renderTownContent();
  });
  window.addEventListener('offline', () => {
    networkState085 = '오프라인';
    recordClientIssue('network', '네트워크 오프라인 · 로컬 저장 유지');
    if (townContentOpen && (activeTownContent === 'settings' || activeTownContent === 'account')) renderTownContent();
  });

  const perf = window as Window & { PerformanceObserver?: typeof PerformanceObserver };
  if (perf.PerformanceObserver) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration < 50) continue;
          longTaskCount085 += 1;
          lastLongTaskMs085 = Math.max(lastLongTaskMs085, entry.duration);
          document.body.classList.toggle('perf-longtask-risk-085', longTaskCount085 >= 5 || entry.duration >= 180);
          const reduceMotion = classifyPerformance(measuredFps, longTaskCount085, lastLongTaskMs085).shouldReduceMotion;
      document.body.classList.toggle('perf-reduced-motion-086', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-087', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-088', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-089', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-090', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-091', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-092', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-098', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-099', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-105', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-107', reduceMotion || liteRenderMode091);
          if (entry.duration >= 120) recordClientIssue('perf', `긴 작업 ${Math.round(entry.duration)}ms 감지`);
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Long Task API is not available on every mobile browser.
    }
  }
}

function installAssetBudgetGuards091() {
  try {
    liteRenderMode091 = localStorage.getItem('soul-online-lite-render-091') === '1';
  } catch {
    liteRenderMode091 = false;
  }
  const changed = installDomImageBudgetPolicy091(document);
  lastDomImagePolicy091 = changed ? `DOM 이미지 ${changed}개 lazy 적용` : 'DOM 이미지 정책 정상';
  scheduleAssetBudgetAudit091();
  scheduleCssBudgetAudit092();
  window.addEventListener('load', () => window.setTimeout(() => { scheduleAssetBudgetAudit091(); scheduleCssBudgetAudit092(); runEntryRegressionAudit092(); }, 700));
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) { scheduleAssetBudgetAudit091(); scheduleCssBudgetAudit092(); runEntryRegressionAudit092(); }
  });
}

function scheduleAssetBudgetAudit091() {
  if (assetBudgetAuditPending091) return;
  assetBudgetAuditPending091 = true;
  window.requestAnimationFrame(() => {
    assetBudgetAuditPending091 = false;
    runAssetBudgetAudit091();
  });
}

function runAssetBudgetAudit091() {
  const report = inspectResourceBudget091();
  const autoLite = shouldUseLiteRender091(report, measuredFps, longTaskCount085);
  applyResourceBudgetState091(report, liteRenderMode091 || autoLite);
  lastAssetBudgetReport091 = `${report.message} · ${report.hint}`;
  if (report.level === 'danger') recordClientIssue('perf', report.message);
  return report;
}

function installEntryRegressionGuards092() {
  repairEntryRegressionClasses092({
    body: document.body,
    titleScreen,
    loginScreen,
    townScreen,
    startButton: startGameBtn
  });
  runEntryRegressionAudit092();
  window.addEventListener('resize', runEntryRegressionAudit092);
  window.addEventListener('orientationchange', runEntryRegressionAudit092);
}

function runEntryRegressionAudit092() {
  repairEntryRegressionClasses092({
    body: document.body,
    titleScreen,
    loginScreen,
    townScreen,
    startButton: startGameBtn
  });
  const report = inspectEntryRegression092({
    body: document.body,
    titleScreen,
    loginScreen,
    townScreen,
    startButton: startGameBtn
  });
  entryRegressionLastReport092 = `${report.label} · ${report.hint}`;
  if (report.level !== 'ok') recordClientIssue('ui', `진입 회귀 ${entryRegressionLastReport092}`);
  return report;
}

function scheduleCssBudgetAudit092() {
  if (cssBudgetAuditPending092) return;
  cssBudgetAuditPending092 = true;
  window.requestAnimationFrame(() => {
    cssBudgetAuditPending092 = false;
    runCssBudgetAudit092();
  });
}

function runCssBudgetAudit092() {
  const report = inspectCssBudget092(document);
  applyCssBudgetState092(report);
  lastCssBudgetReport092 = `${report.message} · ${report.hint}`;
  if (report.level === 'danger') recordClientIssue('perf', report.message);
  return report;
}

async function refreshStorageEstimate085() {
  try {
    const storage = navigator.storage;
    if (!storage?.estimate) return;
    const estimate = await storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    storageEstimate085 = {
      usedMB: Math.round(usage / 1048576),
      quotaMB: Math.round(quota / 1048576),
      percent: quota ? Math.min(100, Math.round((usage / quota) * 100)) : 0,
      available: true
    };
  } catch {
    storageEstimate085 = { usedMB: 0, quotaMB: 0, percent: 0, available: false };
  }
}


async function preloadCriticalAssets086() {
  const plan = buildPreloadPlan089({
    classId: pendingSave?.classId || latest?.save.classId,
    activeTownContent,
    fieldActive: document.body.classList.contains('field-active')
  });
  const summary = await preloadAssetPlan089(plan, liteRenderMode091 ? 5 : 7);
  lastPreloadReport089 = summary.label;
}

function currentPreloadSummary089() {
  return summarizePreloadPlan089(buildPreloadPlan089({
    classId: pendingSave?.classId || latest?.save.classId,
    activeTownContent,
    fieldActive: document.body.classList.contains('field-active')
  }));
}

async function handleHealthAction085(action: string) {
  if (action === 'audit-ui') {
    scheduleUiSafetyAudit();
    showToast('UI 안전 영역을 다시 검사합니다.');
  }
  if (action === 'clear-issues') {
    clientIssues.splice(0);
    longTaskCount085 = 0;
    lastLongTaskMs085 = 0;
    document.body.classList.remove('perf-longtask-risk-085', 'perf-reduced-motion-086', 'perf-reduced-motion-087', 'perf-reduced-motion-088', 'perf-reduced-motion-089', 'perf-reduced-motion-090', 'perf-reduced-motion-091', 'perf-reduced-motion-092', 'perf-reduced-motion-098', 'perf-reduced-motion-099', 'perf-reduced-motion-105', 'field-overflow-103', 'quality-overflow-104', 'quality-legacy-visible-104');
    showToast('진단 로그를 정리했습니다.');
  }
  if (action === 'save-local') {
    const save = pendingSave || latest?.save || getSelectedCharacter();
    if (!save) {
      showToast('저장할 캐릭터가 없습니다.');
      return;
    }
    saveService.saveLocal(save);
    await refreshStorageEstimate085();
    refreshCharacterRoster(save.saveId);
    showToast('로컬 저장 정상 확인');
  }
  if (action === 'preload-assets') {
    await preloadCriticalAssets086();
    scheduleAssetBudgetAudit091();
    showToast(`에셋 예열 완료 · ${lastPreloadReport089}`);
  }
  if (action === 'audit-assets') {
    const changed = installDomImageBudgetPolicy091(document);
    lastDomImagePolicy091 = changed ? `DOM 이미지 ${changed}개 lazy 적용` : 'DOM 이미지 정책 정상';
    const report = runAssetBudgetAudit091();
    showToast(`리소스 점검 · ${formatBudgetDelta091(report)}`);
  }
  if (action === 'audit-css') {
    const report = runCssBudgetAudit092();
    showToast(`CSS 점검 · ${summarizeCssBudget092(report)}`);
  }
  if (action === 'audit-entry') {
    const report = runEntryRegressionAudit092();
    showToast(`진입 검사 · ${report.label}`);
  }
  if (action === 'toggle-lite-mode') {
    liteRenderMode091 = !liteRenderMode091;
    try {
      localStorage.setItem('soul-online-lite-render-091', liteRenderMode091 ? '1' : '0');
    } catch {
      // localStorage may be blocked in private mode.
    }
    const report = runAssetBudgetAudit091();
    showToast(liteRenderMode091 ? `라이트 렌더 모드 ON · ${report.message}` : '라이트 렌더 모드 OFF');
  }
  if (townContentOpen && (activeTownContent === 'settings' || activeTownContent === 'account')) renderTownContent();
  if (sheetOpen && activeSheetTab === 'account') renderSheet();
}

function renderSystemDoctor085(save: PlayerSave, mode: 'town' | 'account' | 'field') {
  const saveHealth = validateSaveHealth085(save);
  const perfHealth = classifyPerformance(measuredFps, longTaskCount085, lastLongTaskMs085);
  const assetHealth = inspectRuntimeAssets();
  const contentHealth = inspectCurrentContentGraph087();
  const preloadSummary089 = currentPreloadSummary089();
  const resourceBudget091 = runAssetBudgetAudit091();
  const cssBudget092 = runCssBudgetAudit092();
  const entryRegression092 = runEntryRegressionAudit092();
  const classSkillsForHealth089 = skills.filter((skill) => skill.classId === save.classId);
  const skillReadiness089 = summarizeSkillReadiness089({
    skills: classSkillsForHealth089,
    learnedSkillIds: save.learnedSkillIds || [],
    levelBySkillId: (skillId) => skillLevel(save, skillId),
    playerLevel: save.level,
    canUpgradeSkill: (skill) => canUpgradeSkill(save, skill)
  });
  const titleHealth090 = titleEntryHealthLabel090(inspectTitleEntry090(titleScreen, startGameBtn));
  const visual096 = inspectVisualStability096({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn });
  const visual097 = inspectVisualMass097({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  const visual098 = inspectVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  const visual099 = inspectVisualArt099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  const field100 = inspectFieldHud100();
  const perf101 = inspectPerformance101(document);
  const asset102 = inspectSoulAssetKit102(document);
  const portrait103 = inspectPortraitFieldUx103(document);
  const quality104 = inspectQualityPass104(document);
  const engine105 = inspectEngineQuality105(document);
  const engine106 = inspectEngineOptimization106(document);
  const final107 = inspectFinalOptimization107(document);
  const quality108 = inspectMobileQuality108(document);
  const maintenance109 = inspectMaintenance109(document);
  const fieldLayout110 = inspectFieldLayout110(document);
  titleEntryLastReport090 = titleHealth090.label;
  const rows: HealthTile087[] = [
    { label: '브랜드', value: 'Soul Online 고정', level: 'ok' },
    { label: '첫 화면', value: titleHealth090.label, level: titleHealth090.level, hint: titleHealth090.hint },
    { label: '진입 회귀', value: entryRegression092.label, level: entryRegression092.level, hint: entryRegressionLastReport092 },
    { label: '0.98 UI', value: visual098.message, level: visual098.level, hint: `legacy ${visual098.legacyVisible} · overflow ${visual098.overflowCount}` },
    { label: '0.99 아트/랙', value: visual099.message, level: visual099.level, hint: `route ${visual099.route} · budget ${visual099.budget}` },
    { label: '1.00 사냥터 HUD', value: field100.message, level: field100.level, hint: `route ${field100.route} · budget ${field100.budget}` },
    { label: '1.01 성능', value: perf101.label, level: perf101.level, hint: perf101.hint },
    { label: '1.02 에셋 UI', value: asset102.message, level: asset102.level, hint: `${asset102.decoratedControls} controls · ${asset102.assetCount} assets` },
    { label: '1.03 화면/HUD', value: portrait103.message, level: portrait103.level, hint: portrait103.hint },
    { label: '1.04 UI 품질', value: quality104.message, level: quality104.level, hint: quality104.hint },
    { label: '1.05 엔진 QA', value: engine105.message, level: engine105.level, hint: engine105.hint },
    { label: '1.06 스프라이트/성능', value: engine106.message, level: engine106.level, hint: engine106.hint },
    { label: '1.07 최종 최적화', value: final107.message, level: final107.level, hint: final107.hint },
    { label: '1.08 모바일 품질', value: quality108.message, level: quality108.level, hint: quality108.hint },
    { label: '1.09 품질 유지', value: maintenance109.message, level: maintenance109.level, hint: maintenance109.hint },
    { label: '1.10 필드 UI', value: fieldLayout110.message, level: fieldLayout110.level, hint: fieldLayout110.hint },
    { label: 'Firebase', value: saveService.isOnline() ? '클라우드 연결됨' : '로컬 저장 모드', level: saveService.isOnline() ? 'ok' : 'warn' },
    { label: '성능', value: perfHealth.label, level: perfHealth.level },
    { label: '화면', value: lastUiAuditReport086, level: document.body.classList.contains('ui-overflow-risk') ? 'warn' : 'ok' },
    { label: '시각 안정화', value: visual096.message, level: visual096.startVisible && visual096.fieldOverflow === 0 ? 'ok' : 'warn', hint: `route ${visual096.route}` },
    { label: '0.97 화면 복구', value: visual097.message, level: visual097.titleButtonReady && visual097.townSingleHub && visual097.fieldOverflowCount === 0 ? 'ok' : 'warn', hint: `route ${visual097.route}` },
    { label: '0.98 클린 UI', value: visual098.message, level: visual098.level, hint: `route ${visual098.route}` },
    { label: '0.99 아트/최적화', value: visual099.message, level: visual099.level, hint: `overflow ${visual099.overflowCount}` },
    { label: '1.00 필드 안정성', value: field100.message, level: field100.level, hint: `overflow ${field100.overflowCount}` },
    { label: '1.01 렌더 계층', value: perf101.label, level: perf101.level, hint: perf101.hint },
    { label: '1.02 에셋 UI', value: asset102.message, level: asset102.level, hint: `${asset102.decoratedControls} controls · ${asset102.decoratedPanels} panels` },
    { label: '에셋', value: assetHealth.message, level: assetHealth.level },
    { label: '세이브', value: saveHealth.message, level: saveHealth.level },
    { label: '콘텐츠', value: contentHealth.message, level: contentHealth.level, hint: lastContentGraphMessage087 },
    { label: '스킬', value: skillReadiness089.label, level: skillReadiness089.level },
    { label: '예열', value: preloadSummary089.label, level: preloadSummary089.count > 12 ? 'warn' : 'ok', hint: lastPreloadReport089 },
    { label: '리소스', value: resourceBudget091.message, level: resourceBudget091.level, hint: resourceBudget091.hint },
    { label: 'CSS 예산', value: summarizeCssBudget092(cssBudget092), level: cssBudget092.level, hint: lastCssBudgetReport092 },
    { label: '라이트', value: liteRenderMode091 ? '사용자 ON' : '자동 감지', level: liteRenderMode091 ? 'warn' : 'ok', hint: lastDomImagePolicy091 }
  ];
  return renderSystemDoctor087({ version: ALPHA_VERSION, mode, rows });
}

function validateSaveHealth085(save: PlayerSave) {
  return inspectSaveIntegrity(save, knownContentIds086());
}

function installClientDiagnostics() {
  window.addEventListener('error', (event) => {
    recordClientIssue('error', event.message || '알 수 없는 런타임 오류');
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    recordClientIssue('promise', reason instanceof Error ? reason.message : String(reason || 'Promise 처리 오류'));
  });

  const tick = (now: number) => {
    fpsFrames += 1;
    if (now - fpsWindowMs >= 1000) {
      measuredFps = Math.max(1, Math.round((fpsFrames * 1000) / Math.max(1, now - fpsWindowMs)));
      fpsFrames = 0;
      fpsWindowMs = now;
      document.body.dataset.fpsState = measuredFps >= 50 ? 'good' : measuredFps >= 32 ? 'watch' : 'low';
      const reduceMotion = classifyPerformance(measuredFps, longTaskCount085, lastLongTaskMs085).shouldReduceMotion;
      document.body.classList.toggle('perf-reduced-motion-086', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-087', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-088', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-089', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-090', reduceMotion);
      document.body.classList.toggle('perf-reduced-motion-091', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-092', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-098', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-099', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-105', reduceMotion || liteRenderMode091);
      document.body.classList.toggle('perf-reduced-motion-107', reduceMotion || liteRenderMode091);
    }
    lastFrameMs = now;
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
  window.addEventListener('resize', scheduleUiSafetyAudit);
  window.addEventListener('orientationchange', scheduleUiSafetyAudit);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleUiSafetyAudit();
  });
}

function recordClientIssue(type: ClientIssue['type'], message: string) {
  const text = String(message || '').slice(0, 180);
  if (!text) return;
  const now = Date.now();
  const signature = `${type}:${text}`;
  if (signature === lastIssueSignature085 && now - lastIssueAt085 < 5000) return;
  lastIssueSignature085 = signature;
  lastIssueAt085 = now;
  clientIssues.unshift({ time: now, type, message: text });
  clientIssues.splice(6);
}

function scheduleUiSafetyAudit() {
  if (uiAuditPending) return;
  uiAuditPending = true;
  window.requestAnimationFrame(() => {
    uiAuditPending = false;
    runUiSafetyAudit();
  });
}

function runUiSafetyAudit() {
  const report = auditSoulOnlineSafeFrame087(2);
  applySafeFrameBodyState087(report);
  const hasOverflow = !report.ok;
  lastUiAuditMessage = `${report.message} · ${report.viewport}`;
  lastUiAuditReport086 = lastUiAuditMessage;
  const now = Date.now();
  if (hasOverflow && now - lastUiAuditAt > 5000) {
    lastUiAuditAt = now;
    recordClientIssue('ui', lastUiAuditMessage);
  }
  if (!hasOverflow) lastUiAuditAt = 0;
}

function renderTechnicalHealthPanel(save: PlayerSave, mode: 'town' | 'account') {
  const cloud = saveService.getCloudWriteStatus();
  const perfHealth = classifyPerformance(measuredFps, longTaskCount085, lastLongTaskMs085);
  const viewport = `${window.innerWidth || 0}×${window.innerHeight || 0}`;
  const memoryInfo = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  const memoryText = memoryInfo ? `${Math.round(memoryInfo.usedJSHeapSize / 1048576)}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / 1048576)}MB` : '브라우저 미지원';
  const issueRows = clientIssues.length
    ? clientIssues.map((issue) => `<li><b>${issue.type.toUpperCase()}</b><span>${escapeHtml(issue.message)}</span></li>`).join('')
    : '<li><b>OK</b><span>이번 세션에서 감지된 런타임 오류 없음</span></li>';
  const inventoryPressure = save.inventory.length >= 60 ? '주의' : '정상';
  const cloudState = cloud.paused ? '보류' : saveService.isOnline() ? '온라인' : '로컬';
  const assetHealth = inspectRuntimeAssets();
  const saveHealth = validateSaveHealth085(save);
  const contentHealth = inspectCurrentContentGraph087();
  const preloadSummary089 = currentPreloadSummary089();
  const resourceBudget091 = runAssetBudgetAudit091();
  const cssBudget092 = runCssBudgetAudit092();
  const entryRegression092 = runEntryRegressionAudit092();
  const classSkillsForHealth089 = skills.filter((skill) => skill.classId === save.classId);
  const skillReadiness089 = summarizeSkillReadiness089({
    skills: classSkillsForHealth089,
    learnedSkillIds: save.learnedSkillIds || [],
    levelBySkillId: (skillId) => skillLevel(save, skillId),
    playerLevel: save.level,
    canUpgradeSkill: (skill) => canUpgradeSkill(save, skill)
  });
  const renderBudget088 = summarizeRenderBudget088({
    domNodes: document.querySelectorAll('*').length,
    imageNodes: document.images.length,
    visiblePanels: [townContentOpen, sheetOpen, !itemDetailModal.classList.contains('hidden'), Boolean(pendingShopPurchase088)].filter(Boolean).length,
    issueCount: clientIssues.length
  });
  const connectivityRows = buildConnectivityRows({
    activeTownContent,
    townContentOpen,
    sheetOpen,
    routeBusy: townRouteBusy,
    hasPendingSave: Boolean(pendingSave),
    hasLatestSnapshot: Boolean(latest),
    hasGameInstance: Boolean(game),
    cloudOnline: saveService.isOnline(),
    cloudPaused: cloud.paused,
    serviceWorkerReady: serviceWorkerReady086
  });
  const titleHealth090 = titleEntryHealthLabel090(inspectTitleEntry090(titleScreen, startGameBtn));
  const visual098 = inspectVisualClean098({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  const visual099 = inspectVisualArt099({ titleScreen, loginScreen, townScreen, gameRoot: root, startButton: startGameBtn, titleAudioButton: titleAudioBtn, closeButtons: [closeSheet, closeTownContent, closeItemDetail] });
  const field100 = inspectFieldHud100();
  const perf101 = inspectPerformance101(document);
  const asset102 = inspectSoulAssetKit102(document);
  const portrait103 = inspectPortraitFieldUx103(document);
  const quality104 = inspectQualityPass104(document);
  const engine105 = inspectEngineQuality105(document);
  const engine106 = inspectEngineOptimization106(document);
  const final107 = inspectFinalOptimization107(document);
  const quality108 = inspectMobileQuality108(document);
  const maintenance109 = inspectMaintenance109(document);
  const fieldLayout110 = inspectFieldLayout110(document);
  titleEntryLastReport090 = titleHealth090.label;
  const tiles: HealthTile087[] = [
    { label: '첫 화면', value: titleHealth090.label, level: titleHealth090.level, hint: titleHealth090.hint },
    { label: '진입 회귀', value: entryRegression092.label, level: entryRegression092.level, hint: entryRegressionLastReport092 },
    { label: '0.98 UI', value: visual098.message, level: visual098.level, hint: `legacy ${visual098.legacyVisible} · overflow ${visual098.overflowCount}` },
    { label: '0.99 아트/랙', value: visual099.message, level: visual099.level, hint: `route ${visual099.route} · budget ${visual099.budget}` },
    { label: '1.00 사냥터 HUD', value: field100.message, level: field100.level, hint: `route ${field100.route} · budget ${field100.budget}` },
    { label: '1.01 성능', value: perf101.label, level: perf101.level, hint: perf101.hint },
    { label: '1.02 에셋 UI', value: asset102.message, level: asset102.level, hint: `${asset102.decoratedControls} controls · ${asset102.assetCount} assets` },
    { label: '1.03 화면/HUD', value: portrait103.message, level: portrait103.level, hint: portrait103.hint },
    { label: '1.04 UI 품질', value: quality104.message, level: quality104.level, hint: quality104.hint },
    { label: '1.05 엔진 QA', value: engine105.message, level: engine105.level, hint: engine105.hint },
    { label: '1.06 스프라이트/성능', value: engine106.message, level: engine106.level, hint: engine106.hint },
    { label: '1.07 최종 최적화', value: final107.message, level: final107.level, hint: final107.hint },
    { label: '1.08 모바일 품질', value: quality108.message, level: quality108.level, hint: quality108.hint },
    { label: '1.09 품질 유지', value: maintenance109.message, level: maintenance109.level, hint: maintenance109.hint },
    { label: '1.10 필드 UI', value: fieldLayout110.message, level: fieldLayout110.level, hint: fieldLayout110.hint },
    { label: 'FPS', value: `${measuredFps} · ${perfHealth.label}`, level: perfHealth.level },
    { label: '저장 연결', value: cloudState, level: cloud.paused ? 'warn' : 'ok' },
    { label: 'UI 안전', value: document.body.classList.contains('ui-overflow-risk') ? '주의' : '정상', level: document.body.classList.contains('ui-overflow-risk') ? 'warn' : 'ok', hint: lastUiAuditMessage },
    { label: '가방', value: `${save.inventory.length}/64 · ${inventoryPressure}`, level: save.inventory.length >= 60 ? 'warn' : 'ok' },
    { label: 'Long Task', value: `${longTaskCount085}회${lastLongTaskMs085 ? ` · ${Math.round(lastLongTaskMs085)}ms` : ''}`, level: longTaskCount085 >= 5 ? 'warn' : 'ok' },
    { label: '저장소', value: storageEstimate085.available ? `${storageEstimate085.percent}%` : 'OK', level: storageEstimate085.available && storageEstimate085.percent > 85 ? 'warn' : 'ok' },
    { label: '이미지', value: `${assetHealth.decodedImages}/${assetHealth.imageCount}`, level: assetHealth.level, hint: assetHealth.message },
    { label: '세이브', value: saveHealth.message, level: saveHealth.level },
    { label: '콘텐츠', value: contentHealth.message, level: contentHealth.level },
    { label: '스킬 성장', value: skillReadiness089.label, level: skillReadiness089.level, hint: `습득 ${skillReadiness089.learned}/${skillReadiness089.total} · 숙련 Lv.${skillReadiness089.masteryTotal}` },
    { label: '예열 계획', value: preloadSummary089.label, level: preloadSummary089.count > 12 ? 'warn' : 'ok', hint: `최근 ${lastPreloadReport089}` },
    { label: '렌더 예산', value: renderBudget088.value, level: renderBudget088.level, hint: renderBudget088.hint },
    { label: '리소스 예산', value: formatBudgetDelta091(resourceBudget091), level: resourceBudget091.level, hint: lastAssetBudgetReport091 },
    { label: 'CSS 예산', value: summarizeCssBudget092(cssBudget092), level: cssBudget092.level, hint: lastCssBudgetReport092 },
    { label: '라이트 모드', value: liteRenderMode091 ? '수동 ON' : '자동', level: liteRenderMode091 ? 'warn' : 'ok', hint: lastDomImagePolicy091 },
    { label: '상점 UX', value: pendingShopPurchase088 ? '구매 확인 대기' : '확인 단계 준비', level: 'ok' },
    { label: '입력', value: buildActionLatencyLabel(lastActionAt086), level: 'ok' }
  ];
  return renderTechnicalHealthPanel087({
    version: ALPHA_VERSION,
    mode,
    tiles,
    connectivityRows,
    meta: {
      viewport,
      memoryText,
      storageText: storageEstimate085.available ? `${storageEstimate085.usedMB}MB/${storageEstimate085.quotaMB}MB` : '미지원',
      networkState: networkState085,
      pwaState: serviceWorkerReady086 ? '준비' : '대기',
      characterTail: save.saveId.slice(-6),
      contentSummary: `콘텐츠 ${contentHealth.totals.zones}존 · ${contentHealth.totals.monsters}몬스터 · ${contentHealth.totals.items}아이템 · ${contentHealth.totals.quests}퀘스트 · 예열 ${preloadSummary089.count}개 · 리소스 ${resourceBudget091.totalMB}MB · CSS ${Math.max(cssBudget092.estimatedKB, cssBudget092.runtimeCssKB).toFixed(0)}KB · 1.05 ${engine105.tier} · 1.07 ${final107.tier} · 1.08 ${quality108.tier} · 1.09 ${maintenance109.tier} · 1.10 ${fieldLayout110.tier}`
    },
    issueRows,
    cloudError: cloud.lastError,
    contentProblems: contentHealth.problems
  });
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
    if (upgradeTownSkill) { stageTownSkillTraining089(upgradeTownSkill.dataset.townUpgradeSkill || ''); closeDetailModal(); return; }
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
  itemDetailModal.classList.add('item-detail-modal-083');
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
    : def.type === 'skillbook' ? `<button class="wide-action primary" ${actionAttr}="${instance.uid}">스킬 배우기</button>` : def.type === 'consumable' ? `<button class="wide-action primary" ${actionAttr}="${instance.uid}">${def.consume ? '사용하기' : '상자 열기'}</button>` : '';
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
    ? `<button class="wide-action primary" ${level >= SKILL_MAX_LEVEL ? 'disabled' : ''} ${upgradeAttr}="${def.id}">${level >= SKILL_MAX_LEVEL ? '숙련 MAX' : canUpgradeSkill(save, def) ? '강화 확인' : '조건 부족'}</button>`
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
  el.className = `loot-pop loot-pop-083 loot-${rarity}`;
  const art = detail.art
    ? `<span class="loot-art"><img src="${detail.art}" alt="${escapeHtml(detail.title)}" onerror="this.remove()" /></span>`
    : `<span class="loot-art loot-art-fallback">${detail.type === 'gold' ? '金' : detail.type === 'gem' ? '魂' : '★'}</span>`;
  el.innerHTML = `
    <span class="loot-rune-083"></span>
    ${art}
    <span class="loot-copy"><b>${escapeHtml(detail.title)}${detail.amount ? ` x${formatNumber(detail.amount)}` : ''}</b><em>${escapeHtml(detail.subtitle || lootSubtitle(detail))}</em></span>
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
