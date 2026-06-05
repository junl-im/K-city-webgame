const FIREBASE_VERSION = "12.14.0";
const STORAGE_KEY = "k-city-webgame-save-v1";
const SAVE_DEBOUNCE_MS = 4200;
const MAX_PARTY_SIZE = 5;

const firebaseConfig = {
  apiKey: "AIzaSyD4RvZ2hUCifKBOE2uLEFQFMwTBMcQoGz8",
  authDomain: "k-city-webgame.firebaseapp.com",
  projectId: "k-city-webgame",
  storageBucket: "k-city-webgame.firebasestorage.app",
  messagingSenderId: "764165707172",
  appId: "1:764165707172:web:77cea6d091cd39803b5d31",
  measurementId: "G-W202YGQDF3"
};

const RESOURCES = [
  ["money", "자금", "원"],
  ["grain", "곡식", "포대"],
  ["wood", "목재", "단"],
  ["iron", "철", "kg"],
  ["gas", "가스", "통"],
  ["oil", "석유", "배럴"],
  ["power", "전력", "kW"],
  ["security", "치안", "%"],
  ["fame", "명성", "점"]
];

const BUILDINGS = {
  townHall: {
    name: "주민센터",
    tag: "본성",
    flavor: "마을 레벨, 건물 상한, 행정 보너스를 담당합니다.",
    base: { money: 180, wood: 35, iron: 15 },
    color: "#4f7d58",
    effects: level => [`건물 상한 Lv.${level + 1}`, `오프라인 보상 +${level * 8}%`]
  },
  police: {
    name: "경찰서",
    tag: "사건",
    flavor: "사건 상황판과 현상수배 작전을 관리합니다.",
    base: { money: 150, iron: 28, power: 12 },
    color: "#2f6c9f",
    effects: level => [`전투력 +${level * 5}%`, `출동 시간 -${Math.min(40, level * 4)}%`]
  },
  powerPlant: {
    name: "발전소",
    tag: "전력",
    flavor: "전력 생산과 시설 효율을 올립니다.",
    base: { money: 165, gas: 18, oil: 10, iron: 18 },
    color: "#d89432",
    effects: level => [`전력 생산 +${level * 14}`, `생산 효율 +${level * 3}%`]
  },
  jobCenter: {
    name: "알바천국",
    tag: "모집",
    flavor: "백수부터 대통령급 인재까지 모집합니다.",
    base: { money: 140, grain: 28, wood: 18 },
    color: "#bf503a",
    effects: level => [`모집 비용 -${Math.min(35, level * 3)}%`, `희귀 인재 확률 +${level}%`]
  },
  storage: {
    name: "보관함",
    tag: "창고",
    flavor: "장비와 증거품 보관 용량을 늘립니다.",
    base: { money: 120, wood: 45, iron: 10 },
    color: "#2d7d78",
    effects: level => [`보관 용량 ${getStorageLimit(level)}칸`, `드랍 보존 안정화`]
  },
  training: {
    name: "훈련소",
    tag: "육성",
    flavor: "직원의 레벨업과 전투 숙련을 담당합니다.",
    base: { money: 155, grain: 36, iron: 16 },
    color: "#6d5c91",
    effects: level => [`훈련 비용 -${Math.min(30, level * 3)}%`, `직원 성장 +${level * 4}%`]
  },
  lab: {
    name: "연구소",
    tag: "연구",
    flavor: "자원 획득, 장비 판별, 행정 기술을 개선합니다.",
    base: { money: 190, power: 24, gas: 14 },
    color: "#6a7450",
    effects: level => [`드랍 보너스 +${level * 4}%`, `자동 생산 +${level * 3}%`]
  }
};

const WORKER_POOL = [
  {
    role: "백수",
    grade: "N",
    weight: 32,
    skill: "동네 감각",
    stats: { hp: 80, atk: 14, def: 9, speed: 14, admin: 8, tech: 5, luck: 12 }
  },
  {
    role: "알바생",
    grade: "N",
    weight: 28,
    skill: "빠른 손놀림",
    stats: { hp: 86, atk: 17, def: 10, speed: 18, admin: 8, tech: 7, luck: 10 }
  },
  {
    role: "직장인",
    grade: "R",
    weight: 19,
    skill: "야근 내성",
    stats: { hp: 105, atk: 22, def: 18, speed: 13, admin: 20, tech: 12, luck: 9 }
  },
  {
    role: "개인사업가",
    grade: "R",
    weight: 12,
    skill: "현장 협상",
    stats: { hp: 112, atk: 24, def: 16, speed: 15, admin: 22, tech: 15, luck: 14 }
  },
  {
    role: "기업인",
    grade: "SR",
    weight: 6,
    skill: "자금 동원",
    stats: { hp: 132, atk: 30, def: 24, speed: 14, admin: 34, tech: 24, luck: 16 }
  },
  {
    role: "전직 특수요원",
    grade: "SSR",
    weight: 2.5,
    skill: "전술 제압",
    stats: { hp: 168, atk: 48, def: 38, speed: 30, admin: 18, tech: 26, luck: 18 }
  },
  {
    role: "정치인",
    grade: "SSR",
    weight: 1.8,
    skill: "민심 장악",
    stats: { hp: 145, atk: 28, def: 26, speed: 15, admin: 48, tech: 28, luck: 24 }
  },
  {
    role: "대통령급 인재",
    grade: "UR",
    weight: 0.5,
    skill: "국가 동원령",
    stats: { hp: 210, atk: 56, def: 48, speed: 28, admin: 62, tech: 46, luck: 32 }
  }
];

const ZONES = [
  {
    id: "alley",
    name: "골목길",
    threat: "양아치 무리",
    difficulty: 42,
    requiredTown: 1,
    rewards: { money: [38, 72], grain: [8, 16], wood: [5, 11] },
    items: ["safetyVest", "workGloves"]
  },
  {
    id: "market",
    name: "지하상가",
    threat: "건달 패거리",
    difficulty: 88,
    requiredTown: 2,
    rewards: { money: [75, 130], grain: [14, 24], iron: [8, 16], gas: [2, 6] },
    items: ["radio", "runningShoes", "evidenceBag"]
  },
  {
    id: "factory",
    name: "폐공장",
    threat: "조폭 조직원",
    difficulty: 155,
    requiredTown: 3,
    rewards: { money: [120, 210], iron: [18, 34], gas: [8, 16], oil: [4, 10] },
    items: ["hardHat", "portableBattery", "radio"]
  },
  {
    id: "port",
    name: "항구 뒷골목",
    threat: "밀수 브로커",
    difficulty: 255,
    requiredTown: 4,
    rewards: { money: [210, 360], iron: [28, 48], gas: [14, 24], oil: [12, 22] },
    items: ["drone", "patrolKit", "portableBattery"]
  },
  {
    id: "tower",
    name: "불법 대부 빌딩",
    threat: "현상수배범",
    difficulty: 420,
    requiredTown: 5,
    rewards: { money: [360, 620], iron: [40, 72], gas: [24, 38], oil: [24, 42], fame: [3, 8] },
    items: ["briefcase", "drone", "patrolKit"]
  }
];

const ITEMS = {
  safetyVest: {
    name: "방범 조끼",
    type: "방어 장비",
    grade: "N",
    effect: "방어 +6, 체력 +20"
  },
  workGloves: {
    name: "작업 장갑",
    type: "채집 장비",
    grade: "N",
    effect: "자원 획득 +2%"
  },
  radio: {
    name: "무전기",
    type: "지원 장비",
    grade: "R",
    effect: "출동 성공률 +2%"
  },
  runningShoes: {
    name: "러닝화",
    type: "기동 장비",
    grade: "R",
    effect: "민첩 +8"
  },
  evidenceBag: {
    name: "증거 봉투",
    type: "사건 증거",
    grade: "R",
    effect: "경찰서 임무 보너스"
  },
  hardHat: {
    name: "안전모",
    type: "방어 장비",
    grade: "SR",
    effect: "방어 +12, 부상 방지"
  },
  portableBattery: {
    name: "휴대용 배터리",
    type: "전력 장비",
    grade: "SR",
    effect: "전력 소모 -3%"
  },
  drone: {
    name: "정찰 드론",
    type: "정찰 장비",
    grade: "SSR",
    effect: "성공률 +5%, 희귀 드랍 +2%"
  },
  patrolKit: {
    name: "순찰차 키트",
    type: "출동 장비",
    grade: "SSR",
    effect: "출동 시간 -5%"
  },
  briefcase: {
    name: "서류가방",
    type: "행정 장비",
    grade: "UR",
    effect: "자금 보상 +12%"
  }
};

const MISSIONS = [
  {
    id: "firstPatrol",
    name: "초동 순찰",
    metric: "huntWins",
    goal: 1,
    reward: { money: 160, fame: 4, security: 3 }
  },
  {
    id: "rookieTeam",
    name: "인력 충원",
    metric: "recruits",
    goal: 3,
    reward: { money: 260, grain: 40, fame: 5 }
  },
  {
    id: "townUpgrade",
    name: "시설 현대화",
    metric: "upgrades",
    goal: 3,
    reward: { money: 320, iron: 36, power: 28 }
  },
  {
    id: "wantedBoard",
    name: "현상수배 정리",
    metric: "crimeSuppressed",
    goal: 12,
    reward: { money: 520, fame: 10, gas: 24 }
  }
];

const NAME_SEEDS = ["김도윤", "이서준", "박하준", "최지호", "정민재", "강서연", "윤하늘", "임지안", "한유진", "오태민", "신가온", "문시우"];

let firebaseApi = {
  ready: false,
  mode: "loading",
  user: null,
  modules: null,
  auth: null,
  db: null,
  unsubscribeRank: null,
  lastCloudSaveAt: 0
};

let state = loadLocalState() || createInitialState();
let selectedView = "town";
let selectedBuilding = state.selectedBuilding || "townHall";
let selectedZoneId = state.selectedZoneId || "alley";
let activeBattle = null;
let saveTimer = null;
let passiveTimer = null;
let leaderRows = [];
let toastTimer = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  state = hydrateState(state);
  applyOfflineProgress();
  bindEvents();
  render();
  setupCanvases();
  setupFirebase();
  passiveTimer = window.setInterval(tickProduction, 12000);
  window.addEventListener("beforeunload", () => {
    state.lastActiveAt = Date.now();
    saveLocalState(state);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-building]").forEach(button => {
    button.addEventListener("click", () => {
      selectedBuilding = button.dataset.building;
      state.selectedBuilding = selectedBuilding;
      setView("town");
      render();
      saveLocalState(state);
    });
  });

  document.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const { action, buildingId, workerId, missionId } = actionButton.dataset;
    if (action === "upgrade") upgradeBuilding(buildingId);
    if (action === "toggleParty") toggleParty(workerId);
    if (action === "trainWorker") trainWorker(workerId);
    if (action === "claimMission") claimMission(missionId);
  });

  document.getElementById("saveBtn").addEventListener("click", () => saveNow(true));
  document.getElementById("authBtn").addEventListener("click", handleAuthButton);
  document.getElementById("recruitBtn").addEventListener("click", recruitWorker);
  document.getElementById("startHuntBtn").addEventListener("click", () => startHunt(selectedZoneId));
  document.getElementById("autoPickBtn").addEventListener("click", autoPickParty);
  document.getElementById("refreshRankBtn").addEventListener("click", loadLeaderboardOnce);
  document.getElementById("emailLoginBtn").addEventListener("click", () => emailAuth("login"));
  document.getElementById("emailSignupBtn").addEventListener("click", () => emailAuth("signup"));
  document.getElementById("googleLoginBtn").addEventListener("click", googleLogin);

  document.getElementById("zoneList").addEventListener("click", event => {
    const zoneButton = event.target.closest("[data-zone]");
    if (!zoneButton || zoneButton.disabled) return;
    selectedZoneId = zoneButton.dataset.zone;
    state.selectedZoneId = selectedZoneId;
    render();
    saveLocalState(state);
  });
}

async function setupFirebase() {
  setSyncStatus("Firebase 연결 중");
  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);

    const app = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    const db = dbMod.getFirestore(app);

    firebaseApi = {
      ...firebaseApi,
      ready: true,
      mode: "cloud",
      modules: { ...authMod, ...dbMod },
      auth,
      db
    };

    try {
      const analyticsMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-analytics.js`);
      if (await analyticsMod.isSupported()) analyticsMod.getAnalytics(app);
    } catch {
      // Analytics is optional for the game loop.
    }

    authMod.onAuthStateChanged(auth, handleAuthState);
    setSyncStatus("Firebase 준비 완료");
  } catch (error) {
    firebaseApi.mode = "local";
    setSyncStatus("로컬 저장 모드");
    showToast("Firebase 연결 전까지 로컬 저장으로 진행합니다.");
    console.warn("Firebase initialization failed", error);
  }
}

async function handleAuthState(user) {
  firebaseApi.user = user;
  if (!user) {
    setSyncStatus(firebaseApi.ready ? "로그인 필요" : "로컬 저장 모드");
    if (firebaseApi.unsubscribeRank) {
      firebaseApi.unsubscribeRank();
      firebaseApi.unsubscribeRank = null;
    }
    leaderRows = [];
    render();
    return;
  }

  setSyncStatus(`${displayName(user)} 동기화 중`);
  await loadCloudState(user);
  subscribeLeaderboard();
  await saveNow(false);
  render();
}

async function loadCloudState(user) {
  if (!firebaseApi.ready || !user) return;
  const { doc, getDoc } = firebaseApi.modules;
  const ref = doc(firebaseApi.db, "players", user.uid);
  try {
    const snap = await getDoc(ref);
    const local = loadLocalState();
    const cloud = snap.exists() ? hydrateState(snap.data()) : null;
    const profileState = createInitialState({ displayName: displayName(user), email: user.email });
    const chosen = chooseBetterState(local, cloud) || cloud || local || profileState;
    state = hydrateState(chosen);
    if (!state.nickname || state.nickname === "신입 센터장") state.nickname = displayName(user);
    selectedBuilding = state.selectedBuilding || "townHall";
    selectedZoneId = state.selectedZoneId || "alley";
    saveLocalState(state);
    setSyncStatus(`${displayName(user)} 클라우드 저장`);
  } catch (error) {
    setSyncStatus("클라우드 읽기 실패");
    showToast("Firestore 읽기 권한 또는 규칙을 확인하세요.");
    console.warn("Cloud load failed", error);
  }
}

function chooseBetterState(local, cloud) {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;
  return getScore(local) >= getScore(cloud) ? local : cloud;
}

function handleAuthButton() {
  if (firebaseApi.user && firebaseApi.ready) {
    firebaseApi.modules.signOut(firebaseApi.auth);
    showToast("로그아웃했습니다.");
    return;
  }
  document.getElementById("authDialog").showModal();
}

async function googleLogin() {
  clearAuthMessage();
  if (!firebaseApi.ready) {
    setAuthMessage("Firebase 연결 후 로그인할 수 있습니다.");
    return;
  }
  try {
    const provider = new firebaseApi.modules.GoogleAuthProvider();
    await firebaseApi.modules.signInWithPopup(firebaseApi.auth, provider);
    document.getElementById("authDialog").close();
  } catch (error) {
    setAuthMessage(authErrorMessage(error));
  }
}

async function emailAuth(mode) {
  clearAuthMessage();
  if (!firebaseApi.ready) {
    setAuthMessage("Firebase 연결 후 로그인할 수 있습니다.");
    return;
  }
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value;
  if (!email || password.length < 6) {
    setAuthMessage("이메일과 6자 이상 비밀번호가 필요합니다.");
    return;
  }

  try {
    if (mode === "signup") {
      await firebaseApi.modules.createUserWithEmailAndPassword(firebaseApi.auth, email, password);
    } else {
      await firebaseApi.modules.signInWithEmailAndPassword(firebaseApi.auth, email, password);
    }
    document.getElementById("authDialog").close();
  } catch (error) {
    setAuthMessage(authErrorMessage(error));
  }
}

function authErrorMessage(error) {
  const code = error?.code || "";
  if (code.includes("popup")) return "팝업이 차단되었거나 닫혔습니다.";
  if (code.includes("auth/unauthorized-domain")) return "Firebase Auth 승인 도메인에 현재 주소를 추가하세요.";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "로그인 정보가 맞지 않습니다.";
  if (code.includes("email-already-in-use")) return "이미 가입된 이메일입니다.";
  if (code.includes("operation-not-allowed")) return "Firebase 콘솔에서 해당 로그인 방식을 활성화하세요.";
  return "로그인 처리 중 오류가 발생했습니다.";
}

function setAuthMessage(message) {
  document.getElementById("authMessage").textContent = message;
}

function clearAuthMessage() {
  setAuthMessage("");
}

function setView(view) {
  selectedView = view;
  document.querySelectorAll(".view").forEach(panel => panel.classList.remove("is-active"));
  document.getElementById(`${view}View`).classList.add("is-active");
  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  render();
}

function recruitWorker() {
  const cost = getRecruitCost();
  if (!canAfford(cost)) {
    showToast("자금과 곡식이 부족합니다.");
    return;
  }
  spendResources(cost);
  const worker = createRandomWorker();
  state.workers.push(worker);
  state.stats.recruits += 1;
  addLog(`${worker.grade} ${worker.role} ${worker.name} 합류`);
  if (state.party.length < MAX_PARTY_SIZE) state.party.push(worker.id);
  markDirty("인재 모집");
  showToast(`${worker.name} 합류: ${worker.skill}`);
}

function upgradeBuilding(buildingId) {
  const current = state.buildings[buildingId] || 1;
  if (buildingId !== "townHall" && current >= state.buildings.townHall + 1) {
    showToast("주민센터 레벨을 먼저 올려야 합니다.");
    return;
  }
  const cost = getUpgradeCost(buildingId);
  if (!canAfford(cost)) {
    showToast("업그레이드 자원이 부족합니다.");
    return;
  }
  spendResources(cost);
  state.buildings[buildingId] = current + 1;
  state.stats.upgrades += 1;
  if (buildingId === "police") state.resources.security = clamp(state.resources.security + 2, 0, 100);
  if (buildingId === "townHall") state.level = Math.max(state.level, state.buildings.townHall);
  addLog(`${BUILDINGS[buildingId].name} Lv.${current + 1} 달성`);
  markDirty("건물 업그레이드");
  showToast(`${BUILDINGS[buildingId].name} Lv.${current + 1}`);
}

function toggleParty(workerId) {
  const index = state.party.indexOf(workerId);
  if (index >= 0) {
    if (state.party.length === 1) {
      showToast("최소 1명은 편성해야 합니다.");
      return;
    }
    state.party.splice(index, 1);
  } else {
    if (state.party.length >= MAX_PARTY_SIZE) {
      showToast("최대 5명까지 편성할 수 있습니다.");
      return;
    }
    state.party.push(workerId);
  }
  markDirty("편성 변경");
}

function trainWorker(workerId) {
  const worker = state.workers.find(item => item.id === workerId);
  if (!worker) return;
  const cost = getTrainingCost(worker);
  if (!canAfford(cost)) {
    showToast("훈련 자원이 부족합니다.");
    return;
  }
  spendResources(cost);
  worker.level += 1;
  worker.xp = 0;
  worker.stats.hp += 6 + state.buildings.training;
  worker.stats.atk += 2 + Math.floor(state.buildings.training / 2);
  worker.stats.def += 1 + Math.floor(state.buildings.training / 3);
  worker.stats.admin += Math.floor(1 + state.buildings.lab / 2);
  addLog(`${worker.name} Lv.${worker.level} 훈련 완료`);
  markDirty("직원 훈련");
}

function autoPickParty() {
  state.party = [...state.workers]
    .sort((a, b) => getWorkerPower(b) - getWorkerPower(a))
    .slice(0, MAX_PARTY_SIZE)
    .map(worker => worker.id);
  markDirty("최적 편성");
  showToast("전투력 기준으로 편성했습니다.");
}

function startHunt(zoneId) {
  if (activeBattle) return;
  const zone = ZONES.find(item => item.id === zoneId) || ZONES[0];
  if (isZoneLocked(zone)) {
    showToast(`주민센터 Lv.${zone.requiredTown} 필요`);
    return;
  }
  const team = getPartyWorkers();
  if (!team.length) {
    showToast("출동할 직원이 없습니다.");
    return;
  }
  const power = getTeamPower();
  const duration = Math.max(3600, 8200 - state.buildings.police * 420 - getItemCount("patrolKit") * 250);
  activeBattle = {
    zone,
    power,
    startedAt: performance.now(),
    duration,
    impacts: []
  };
  document.getElementById("battleStatus").textContent = `${zone.threat} 제압 중`;
  document.getElementById("startHuntBtn").disabled = true;
  addLog(`${zone.name} 출동`);
  window.setTimeout(() => resolveHunt(zone, power), duration);
  render();
}

function resolveHunt(zone, power) {
  if (!activeBattle) return;
  const chance = getSuccessRate(zone, power);
  const success = Math.random() < chance;
  activeBattle = null;
  state.stats.hunts += 1;

  if (success) {
    state.stats.huntWins += 1;
    const rewards = rollRewards(zone);
    gainResources(rewards);
    const item = rollItem(zone);
    if (item) addItem(item);
    const xp = Math.ceil(zone.difficulty * 0.34);
    getPartyWorkers().forEach(worker => gainWorkerXp(worker, xp));
    const suppressed = Math.max(1, Math.round(zone.difficulty / 35));
    state.stats.crimeSuppressed += suppressed;
    state.crimeSuppressed += suppressed;
    state.resources.security = clamp(state.resources.security + 1, 0, 100);
    addLog(`${zone.threat} 제압 성공, 현상 ${suppressed}건 정리`);
    showToast(`작전 성공: ${formatReward(rewards)}${item ? `, ${ITEMS[item].name}` : ""}`);
  } else {
    const consolation = { money: Math.ceil(zone.difficulty * 0.28), grain: 4 };
    gainResources(consolation);
    state.resources.security = clamp(state.resources.security - 1, 0, 100);
    addLog(`${zone.threat} 재정비 필요`);
    showToast("작전 실패, 일부 보급품만 회수했습니다.");
  }

  markDirty("사냥 결과");
}

function gainWorkerXp(worker, amount) {
  const growthBonus = 1 + state.buildings.training * 0.04;
  worker.xp += Math.ceil(amount * growthBonus);
  const need = worker.level * 90 + 80;
  if (worker.xp >= need) {
    worker.xp -= need;
    worker.level += 1;
    worker.stats.hp += 4;
    worker.stats.atk += 2;
    worker.stats.def += 1;
  }
}

function claimMission(missionId) {
  const mission = MISSIONS.find(item => item.id === missionId);
  if (!mission || state.claimedMissions.includes(missionId)) return;
  const progress = getMissionProgress(mission);
  if (progress < mission.goal) {
    showToast("임무 조건이 아직 부족합니다.");
    return;
  }
  gainResources(mission.reward);
  state.claimedMissions.push(missionId);
  addLog(`${mission.name} 보상 수령`);
  markDirty("임무 보상");
  showToast(`${mission.name} 완료`);
}

function tickProduction() {
  const efficiency = 1 + state.buildings.powerPlant * 0.03 + state.buildings.lab * 0.03;
  const gain = {
    money: Math.ceil((state.buildings.townHall * 5 + state.buildings.jobCenter * 4) * efficiency),
    power: Math.ceil(state.buildings.powerPlant * 5 * efficiency)
  };
  if (state.resources.security >= 55) gain.grain = 2 + Math.floor(state.buildings.townHall / 2);
  gainResources(gain);
  const shouldCloudSave = firebaseApi.user && Date.now() - firebaseApi.lastCloudSaveAt > 60000;
  markDirty("자동 생산", { remote: shouldCloudSave, toast: false });
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsed = Math.max(0, now - (state.lastActiveAt || now));
  const capped = Math.min(elapsed, 8 * 60 * 60 * 1000);
  if (capped < 60000) return;
  const minutes = Math.floor(capped / 60000);
  const bonus = 1 + state.buildings.townHall * 0.08;
  const rewards = {
    money: Math.ceil(minutes * (state.buildings.jobCenter + 3) * bonus),
    power: Math.ceil(minutes * state.buildings.powerPlant * 2 * bonus),
    grain: Math.ceil(minutes * 0.8 * bonus)
  };
  gainResources(rewards);
  state.lastActiveAt = now;
  addLog(`오프라인 순찰 ${minutes}분 정산`);
  saveLocalState(state);
}

function rollRewards(zone) {
  const result = {};
  const multiplier = 1 + state.buildings.lab * 0.04 + getItemCount("briefcase") * 0.12;
  Object.entries(zone.rewards).forEach(([key, range]) => {
    result[key] = Math.ceil(randomInt(range[0], range[1]) * multiplier);
  });
  return result;
}

function rollItem(zone) {
  const rareBoost = state.buildings.lab * 0.01 + getItemCount("drone") * 0.02;
  if (Math.random() > 0.28 + rareBoost) return null;
  return zone.items[randomInt(0, zone.items.length - 1)];
}

function createInitialState(profile = {}) {
  const starter = createWorkerFromTemplate(WORKER_POOL[0], "starter-worker");
  starter.name = "강민준";
  starter.level = 2;
  starter.stats.atk += 4;

  return {
    schemaVersion: 1,
    nickname: profile.displayName || "신입 센터장",
    email: profile.email || null,
    level: 1,
    xp: 0,
    crimeSuppressed: 0,
    resources: {
      money: 620,
      grain: 140,
      wood: 95,
      iron: 55,
      gas: 22,
      oil: 12,
      power: 70,
      security: 48,
      fame: 0
    },
    buildings: {
      townHall: 1,
      police: 1,
      powerPlant: 1,
      jobCenter: 1,
      storage: 1,
      training: 1,
      lab: 1
    },
    workers: [starter],
    party: [starter.id],
    inventory: [
      { id: "safetyVest", qty: 1 },
      { id: "workGloves", qty: 1 }
    ],
    stats: {
      hunts: 0,
      huntWins: 0,
      recruits: 0,
      upgrades: 0,
      crimeSuppressed: 0
    },
    claimedMissions: [],
    combatLog: ["주민센터 비상대책반 편성"],
    selectedBuilding: "townHall",
    selectedZoneId: "alley",
    updatedAtClient: Date.now(),
    lastActiveAt: Date.now()
  };
}

function hydrateState(raw) {
  const base = createInitialState();
  const merged = mergeObjects(base, raw || {});
  merged.resources = mergeObjects(base.resources, raw?.resources || {});
  merged.buildings = mergeObjects(base.buildings, raw?.buildings || {});
  merged.stats = mergeObjects(base.stats, raw?.stats || {});
  merged.workers = Array.isArray(raw?.workers) && raw.workers.length ? raw.workers : base.workers;
  merged.party = Array.isArray(raw?.party) && raw.party.length ? raw.party : [merged.workers[0].id];
  merged.inventory = Array.isArray(raw?.inventory) ? raw.inventory : base.inventory;
  merged.claimedMissions = Array.isArray(raw?.claimedMissions) ? raw.claimedMissions : [];
  merged.combatLog = Array.isArray(raw?.combatLog) ? raw.combatLog.slice(0, 40) : base.combatLog;
  merged.selectedBuilding = raw?.selectedBuilding || "townHall";
  merged.selectedZoneId = raw?.selectedZoneId || "alley";
  return merged;
}

function mergeObjects(base, patch) {
  return { ...base, ...(patch || {}) };
}

function createRandomWorker() {
  const adjustedPool = WORKER_POOL.map(template => {
    const rareBonus = state.buildings.jobCenter * 0.12;
    const bonus = ["SR", "SSR", "UR"].includes(template.grade) ? rareBonus : 0;
    return { ...template, weight: template.weight + bonus };
  });
  return createWorkerFromTemplate(weightedPick(adjustedPool));
}

function createWorkerFromTemplate(template, fixedId = null) {
  const name = NAME_SEEDS[randomInt(0, NAME_SEEDS.length - 1)];
  return {
    id: fixedId || makeId("worker"),
    name,
    role: template.role,
    grade: template.grade,
    skill: template.skill,
    level: 1,
    xp: 0,
    stats: { ...template.stats }
  };
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[0];
}

function makeId(prefix) {
  if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  renderResources();
  renderAuth();
  renderBuildingLevels();
  renderBuildingPanel();
  renderHunt();
  renderWorkers();
  renderInventory();
  renderMissions();
  renderLeaderboard();
}

function renderResources() {
  const bar = document.getElementById("resourceBar");
  bar.innerHTML = RESOURCES.map(([key, label, unit]) => `
    <div class="resource">
      <small>${label}</small>
      <b>${formatNumber(state.resources[key] || 0)} ${unit}</b>
    </div>
  `).join("");
}

function renderAuth() {
  const authBtn = document.getElementById("authBtn");
  if (firebaseApi.user) {
    authBtn.textContent = "로그아웃";
  } else {
    authBtn.textContent = "로그인";
  }
}

function renderBuildingLevels() {
  Object.keys(BUILDINGS).forEach(id => {
    const target = document.getElementById(`${id}Level`);
    if (target) target.textContent = `Lv.${state.buildings[id] || 1}`;
  });
}

function renderBuildingPanel() {
  const building = BUILDINGS[selectedBuilding] || BUILDINGS.townHall;
  const level = state.buildings[selectedBuilding] || 1;
  const cost = getUpgradeCost(selectedBuilding);
  const canUpgrade = selectedBuilding === "townHall" || level < state.buildings.townHall + 1;
  const lockedText = canUpgrade ? "" : `<span class="pill">주민센터 Lv.${level} 필요</span>`;
  document.getElementById("buildingPanel").innerHTML = `
    <div class="panel-title">
      <div>
        <span class="eyebrow">${building.tag}</span>
        <h2>${building.name} Lv.${level}</h2>
      </div>
      <span class="pill">전력 ${state.resources.power}</span>
    </div>
    <p>${building.flavor}</p>
    <div class="effect-line">
      ${building.effects(level).map(effect => `<span class="reward-chip">${effect}</span>`).join("")}
    </div>
    <div class="stat-grid">
      <div class="stat-tile"><small>마을 레벨</small><b>${state.buildings.townHall}</b></div>
      <div class="stat-tile"><small>총 전투력</small><b>${formatNumber(getTeamPower())}</b></div>
      <div class="stat-tile"><small>제압 건수</small><b>${formatNumber(state.crimeSuppressed)}</b></div>
      <div class="stat-tile"><small>직원 수</small><b>${state.workers.length}</b></div>
    </div>
    <div>
      <span class="eyebrow">업그레이드 비용</span>
      <div class="cost-line">${renderCost(cost)}${lockedText}</div>
    </div>
    <button class="primary-button" type="button" data-action="upgrade" data-building-id="${selectedBuilding}" ${canUpgrade ? "" : "disabled"}>
      업그레이드
    </button>
  `;
}

function renderHunt() {
  const zone = ZONES.find(item => item.id === selectedZoneId) || ZONES[0];
  const teamPower = getTeamPower();
  document.getElementById("selectedZoneName").textContent = zone.name;
  document.getElementById("teamPower").textContent = formatNumber(teamPower);
  document.getElementById("successRate").textContent = `${Math.round(getSuccessRate(zone, teamPower) * 100)}%`;
  document.getElementById("startHuntBtn").disabled = Boolean(activeBattle) || isZoneLocked(zone);
  if (!activeBattle) document.getElementById("battleStatus").textContent = isZoneLocked(zone) ? `주민센터 Lv.${zone.requiredTown} 필요` : `${zone.threat} 대기`;

  document.getElementById("zoneList").innerHTML = ZONES.map(item => {
    const locked = isZoneLocked(item);
    const selected = item.id === zone.id;
    return `
      <button class="zone-card ${selected ? "is-selected" : ""} ${locked ? "is-locked" : ""}" type="button" data-zone="${item.id}" ${locked ? "disabled" : ""}>
        <strong>${item.name}</strong>
        <span>${item.threat}</span>
        <div class="zone-meta">
          <span class="pill">위험도 ${item.difficulty}</span>
          <span class="pill">필요 Lv.${item.requiredTown}</span>
        </div>
      </button>
    `;
  }).join("");

  document.getElementById("combatLog").innerHTML = state.combatLog.slice(-9).reverse().map(line => `<p>${escapeHtml(line)}</p>`).join("");
}

function renderWorkers() {
  document.getElementById("partySlots").innerHTML = Array.from({ length: MAX_PARTY_SIZE }, (_, index) => {
    const worker = state.workers.find(item => item.id === state.party[index]);
    return `
      <div class="party-slot">
        <small>${index + 1}번 슬롯</small>
        <b>${worker ? `${escapeHtml(worker.name)} · ${worker.role}` : "비어 있음"}</b>
        <small>${worker ? `전투력 ${formatNumber(getWorkerPower(worker))}` : "대기"}</small>
      </div>
    `;
  }).join("");

  document.getElementById("workerGrid").innerHTML = state.workers.map(worker => {
    const inParty = state.party.includes(worker.id);
    const trainCost = getTrainingCost(worker);
    return `
      <article class="worker-card">
        <div class="worker-head">
          <div>
            <span class="grade-pill grade-${worker.grade}">${worker.grade}</span>
            <strong>${escapeHtml(worker.name)}</strong>
            <div class="worker-meta">
              <span>${worker.role}</span>
              <span>Lv.${worker.level}</span>
              <span>${worker.skill}</span>
            </div>
          </div>
          <b>${formatNumber(getWorkerPower(worker))}</b>
        </div>
        <div class="stat-bars">
          ${renderStatBar("공격", worker.stats.atk, 90)}
          ${renderStatBar("방어", worker.stats.def, 90)}
          ${renderStatBar("행정", worker.stats.admin, 100)}
        </div>
        <div class="worker-actions">
          <button class="mini-button ${inParty ? "is-active" : ""}" type="button" data-action="toggleParty" data-worker-id="${worker.id}">
            ${inParty ? "편성 중" : "편성"}
          </button>
          <button class="mini-button" type="button" data-action="trainWorker" data-worker-id="${worker.id}">
            훈련 ${formatCostPlain(trainCost)}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderInventory() {
  const usage = getInventoryUsage();
  const limit = getStorageLimit(state.buildings.storage);
  document.getElementById("storageUsage").textContent = `${usage} / ${limit}`;
  const grid = document.getElementById("inventoryGrid");
  if (!state.inventory.length) {
    grid.innerHTML = `<div class="item-card"><strong>보관함 비어 있음</strong><span class="item-meta">사냥터에서 장비와 증거품을 획득할 수 있습니다.</span></div>`;
    return;
  }
  grid.innerHTML = state.inventory.map(stack => {
    const item = ITEMS[stack.id];
    if (!item) return "";
    return `
      <article class="item-card">
        <div>
          <span class="grade-pill grade-${item.grade}">${item.grade}</span>
          <strong>${item.name}</strong>
          <div class="item-meta">
            <span>${item.type}</span>
            <span>수량 ${stack.qty}</span>
          </div>
        </div>
        <span>${item.effect}</span>
      </article>
    `;
  }).join("");
}

function renderMissions() {
  document.getElementById("missionList").innerHTML = MISSIONS.map(mission => {
    const progress = getMissionProgress(mission);
    const done = progress >= mission.goal;
    const claimed = state.claimedMissions.includes(mission.id);
    return `
      <article class="mission-card">
        <div class="worker-head">
          <div>
            <strong>${mission.name}</strong>
            <div class="item-meta">
              <span>${getMetricLabel(mission.metric)} ${Math.min(progress, mission.goal)} / ${mission.goal}</span>
            </div>
          </div>
          <button class="mini-button ${claimed ? "is-active" : ""}" type="button" data-action="claimMission" data-mission-id="${mission.id}" ${done && !claimed ? "" : "disabled"}>
            ${claimed ? "완료" : "수령"}
          </button>
        </div>
        <div class="mission-progress"><span style="width:${Math.min(100, progress / mission.goal * 100)}%"></span></div>
        <div class="reward-line">${renderReward(mission.reward)}</div>
      </article>
    `;
  }).join("");
}

function renderLeaderboard() {
  const board = document.getElementById("leaderboard");
  if (!firebaseApi.user) {
    board.innerHTML = `
      <article class="rank-row">
        <span class="rank-no">-</span>
        <div>
          <strong>${escapeHtml(state.nickname)}</strong>
          <div class="rank-meta"><span>로컬 진행</span><span>점수 ${formatNumber(getScore(state))}</span></div>
        </div>
        <span class="pill">로그인 필요</span>
      </article>
    `;
    return;
  }
  if (!leaderRows.length) {
    board.innerHTML = `<article class="rank-row"><span class="rank-no">-</span><div><strong>랭킹 대기 중</strong><div class="rank-meta"><span>Firestore 데이터 수신 전</span></div></div><span class="pill">동기화</span></article>`;
    return;
  }
  board.innerHTML = leaderRows.map((row, index) => `
    <article class="rank-row">
      <span class="rank-no">${index + 1}</span>
      <div>
        <strong>${escapeHtml(row.nickname || "이름 없음")}</strong>
        <div class="rank-meta">
          <span>마을 Lv.${row.townLevel || 1}</span>
          <span>전투력 ${formatNumber(row.power || 0)}</span>
          <span>제압 ${formatNumber(row.crimeSuppressed || 0)}</span>
        </div>
      </div>
      <span class="pill">${formatNumber(row.score || 0)}</span>
    </article>
  `).join("");
}

function renderCost(cost) {
  return Object.entries(cost).map(([key, value]) => {
    const missing = (state.resources[key] || 0) < value;
    return `<span class="cost-chip ${missing ? "is-missing" : ""}">${getResourceLabel(key)} ${formatNumber(value)}</span>`;
  }).join("");
}

function renderReward(reward) {
  return Object.entries(reward).map(([key, value]) => `<span class="reward-chip">${getResourceLabel(key)} +${formatNumber(value)}</span>`).join("");
}

function renderStatBar(label, value, max) {
  const pct = clamp(value / max * 100, 8, 100);
  return `
    <div>
      <div class="worker-meta"><span>${label}</span><span>${value}</span></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
    </div>
  `;
}

function setupCanvases() {
  const draw = timestamp => {
    drawTown(timestamp);
    drawBattle(timestamp);
    window.requestAnimationFrame(draw);
  };
  window.requestAnimationFrame(draw);
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function drawTown(timestamp) {
  const canvas = document.getElementById("townCanvas");
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 26; i += 1) {
    const x = (i * 83 + timestamp * 0.012) % (width + 120) - 60;
    const y = 70 + (i * 47) % Math.max(120, height - 130);
    ctx.fillStyle = i % 3 === 0 ? "rgba(47, 108, 159, 0.16)" : "rgba(47, 125, 88, 0.13)";
    ctx.fillRect(x, y, 28, 12);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 18]);
  ctx.beginPath();
  ctx.moveTo(-40, height * 0.53);
  ctx.lineTo(width + 40, height * 0.34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width * 0.52, -50);
  ctx.lineTo(width * 0.43, height + 50);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBattle(timestamp) {
  const canvas = document.getElementById("battleCanvas");
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  const grd = ctx.createLinearGradient(0, 0, width, height);
  grd.addColorStop(0, "#26313a");
  grd.addColorStop(0.55, "#1f272d");
  grd.addColorStop(1, "#3b2e28");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 38) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 80, height);
    ctx.stroke();
  }

  const party = getPartyWorkers();
  const enemies = activeBattle ? 4 : 3;
  const progress = activeBattle ? clamp((timestamp - activeBattle.startedAt) / activeBattle.duration, 0, 1) : 0;

  party.forEach((worker, index) => {
    const lane = (index + 1) / (party.length + 1);
    const pulse = Math.sin(timestamp / 160 + index) * 5;
    const x = width * (0.18 + progress * 0.18) + pulse;
    const y = height * lane;
    drawUnit(ctx, x, y, 18, getGradeColor(worker.grade), worker.role.slice(0, 1));
    if (activeBattle) drawProjectile(ctx, x + 22, y, width * 0.72, height * lane, timestamp, index);
  });

  for (let index = 0; index < enemies; index += 1) {
    const lane = (index + 1) / (enemies + 1);
    const shake = activeBattle ? Math.sin(timestamp / 90 + index) * 4 : 0;
    const x = width * (0.76 - progress * 0.12) + shake;
    const y = height * lane;
    drawUnit(ctx, x, y, 20, "#bf503a", activeBattle?.zone?.threat.slice(0, 1) || "범");
  }

  if (activeBattle) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "800 15px sans-serif";
    ctx.fillText(`${activeBattle.zone.name} ${Math.round(progress * 100)}%`, 22, 30);
    ctx.fillStyle = "rgba(216,148,50,0.95)";
    ctx.fillRect(22, 42, (width - 44) * progress, 8);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(22, 42, width - 44, 8);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "800 16px sans-serif";
    ctx.fillText("작전 대기", 22, 30);
  }
}

function drawUnit(ctx, x, y, radius, color, label) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.32)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "900 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

function drawProjectile(ctx, sx, sy, tx, ty, timestamp, index) {
  const t = ((timestamp / 650 + index * 0.22) % 1);
  const x = sx + (tx - sx) * t;
  const y = sy + (ty - sy) * t + Math.sin(t * Math.PI) * -22;
  ctx.fillStyle = "rgba(238, 216, 124, 0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (t > 0.92) {
    ctx.strokeStyle = "rgba(255, 236, 140, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tx, ty, 18 * (t - 0.9) * 10, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function getUpgradeCost(buildingId) {
  const building = BUILDINGS[buildingId];
  const level = state.buildings[buildingId] || 1;
  const multiplier = Math.pow(1.58, level - 1);
  return Object.fromEntries(Object.entries(building.base).map(([key, value]) => [key, Math.ceil(value * multiplier)]));
}

function getRecruitCost() {
  const discount = 1 - Math.min(0.35, state.buildings.jobCenter * 0.03);
  return {
    money: Math.ceil((180 + state.workers.length * 42) * discount),
    grain: Math.ceil((28 + state.workers.length * 4) * discount)
  };
}

function getTrainingCost(worker) {
  const discount = 1 - Math.min(0.3, state.buildings.training * 0.03);
  const gradeTax = { N: 1, R: 1.15, SR: 1.35, SSR: 1.7, UR: 2.3 }[worker.grade] || 1;
  return {
    money: Math.ceil((48 + worker.level * 28) * discount * gradeTax),
    grain: Math.ceil((16 + worker.level * 8) * discount)
  };
}

function getStorageLimit(level = state.buildings.storage) {
  return 18 + level * 12;
}

function getInventoryUsage() {
  return state.inventory.reduce((sum, item) => sum + item.qty, 0);
}

function canAfford(cost) {
  return Object.entries(cost).every(([key, value]) => (state.resources[key] || 0) >= value);
}

function spendResources(cost) {
  Object.entries(cost).forEach(([key, value]) => {
    state.resources[key] = Math.max(0, (state.resources[key] || 0) - value);
  });
}

function gainResources(reward) {
  Object.entries(reward).forEach(([key, value]) => {
    state.resources[key] = Math.round((state.resources[key] || 0) + value);
  });
  state.resources.security = clamp(state.resources.security || 0, 0, 100);
}

function addItem(itemId) {
  const existing = state.inventory.find(stack => stack.id === itemId);
  if (existing) {
    existing.qty += 1;
    return true;
  }
  if (getInventoryUsage() >= getStorageLimit()) {
    addLog("보관함 용량 부족으로 장비 1개 반납");
    return false;
  }
  state.inventory.push({ id: itemId, qty: 1 });
  return true;
}

function getItemCount(itemId) {
  return state.inventory.find(stack => stack.id === itemId)?.qty || 0;
}

function getPartyWorkers() {
  return state.party.map(id => state.workers.find(worker => worker.id === id)).filter(Boolean);
}

function getWorkerPower(worker) {
  const gradeMultiplier = { N: 1, R: 1.18, SR: 1.42, SSR: 1.82, UR: 2.4 }[worker.grade] || 1;
  const s = worker.stats;
  const raw = s.hp * 0.25 + s.atk * 2.4 + s.def * 1.7 + s.speed * 1.3 + s.admin * 0.8 + s.tech * 0.9 + s.luck * 0.6 + worker.level * 12;
  return Math.round(raw * gradeMultiplier);
}

function getTeamPower() {
  const base = getPartyWorkers().reduce((sum, worker) => sum + getWorkerPower(worker), 0);
  const buildingBonus = 1 + state.buildings.police * 0.05 + state.buildings.training * 0.04 + state.buildings.powerPlant * 0.02;
  const itemBonus = 1 + getItemCount("radio") * 0.02 + getItemCount("drone") * 0.05;
  return Math.round(base * buildingBonus * itemBonus);
}

function getSuccessRate(zone, power = getTeamPower()) {
  const ratio = power / Math.max(1, zone.difficulty);
  return clamp(0.22 + ratio * 0.35 + state.resources.security * 0.0012, 0.12, 0.96);
}

function isZoneLocked(zone) {
  return state.buildings.townHall < zone.requiredTown;
}

function getMissionProgress(mission) {
  if (mission.metric === "crimeSuppressed") return state.crimeSuppressed || 0;
  return state.stats[mission.metric] || 0;
}

function getMetricLabel(metric) {
  return {
    huntWins: "승리",
    recruits: "모집",
    upgrades: "업그레이드",
    crimeSuppressed: "제압"
  }[metric] || metric;
}

function getScore(targetState = state) {
  const power = targetState.workers?.reduce((sum, worker) => sum + getWorkerPowerFromState(worker), 0) || 0;
  return Math.round(
    (targetState.buildings?.townHall || 1) * 1200 +
    (targetState.crimeSuppressed || 0) * 52 +
    (targetState.resources?.fame || 0) * 90 +
    power * 0.8
  );
}

function getWorkerPowerFromState(worker) {
  if (!worker?.stats) return 0;
  const gradeMultiplier = { N: 1, R: 1.18, SR: 1.42, SSR: 1.82, UR: 2.4 }[worker.grade] || 1;
  const s = worker.stats;
  const raw = s.hp * 0.25 + s.atk * 2.4 + s.def * 1.7 + s.speed * 1.3 + s.admin * 0.8 + s.tech * 0.9 + s.luck * 0.6 + (worker.level || 1) * 12;
  return Math.round(raw * gradeMultiplier);
}

function getResourceLabel(key) {
  return RESOURCES.find(item => item[0] === key)?.[1] || key;
}

function getGradeColor(grade) {
  return { N: "#8b9187", R: "#4f7d58", SR: "#2f6c9f", SSR: "#d89432", UR: "#8b5aa0" }[grade] || "#8b9187";
}

function formatCostPlain(cost) {
  return Object.entries(cost).map(([key, value]) => `${getResourceLabel(key)} ${formatNumber(value)}`).join(" ");
}

function formatReward(reward) {
  return Object.entries(reward).map(([key, value]) => `${getResourceLabel(key)} +${formatNumber(value)}`).join(", ");
}

function addLog(message) {
  state.combatLog.push(message);
  state.combatLog = state.combatLog.slice(-40);
}

function markDirty(reason, options = {}) {
  const { remote = true, toast = false } = options;
  state.updatedAtClient = Date.now();
  state.lastActiveAt = Date.now();
  saveLocalState(state);
  if (remote && firebaseApi.user) scheduleCloudSave();
  render();
  if (toast) showToast(reason);
}

function saveLocalState(value) {
  try {
    const clean = serializeState(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (error) {
    console.warn("Local save failed", error);
  }
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function serializeState(value) {
  return JSON.parse(JSON.stringify({
    ...value,
    schemaVersion: 1,
    selectedBuilding,
    selectedZoneId,
    lastActiveAt: Date.now()
  }));
}

function scheduleCloudSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveNow(false), SAVE_DEBOUNCE_MS);
}

async function saveNow(showMessage) {
  state.lastActiveAt = Date.now();
  saveLocalState(state);

  if (!firebaseApi.ready || !firebaseApi.user) {
    setSyncStatus("로컬 저장 완료");
    if (showMessage) showToast("로컬 저장 완료");
    return;
  }

  const { doc, setDoc, serverTimestamp } = firebaseApi.modules;
  const user = firebaseApi.user;
  const payload = serializeState(state);
  payload.uid = user.uid;
  payload.email = user.email || null;
  payload.nickname = state.nickname || displayName(user);
  payload.savedAt = serverTimestamp();

  const rankPayload = {
    uid: user.uid,
    nickname: payload.nickname,
    townLevel: state.buildings.townHall,
    power: getTeamPower(),
    crimeSuppressed: state.crimeSuppressed,
    score: getScore(state),
    updatedAt: serverTimestamp()
  };

  try {
    await Promise.all([
      setDoc(doc(firebaseApi.db, "players", user.uid), payload),
      setDoc(doc(firebaseApi.db, "leaderboard", user.uid), rankPayload, { merge: true })
    ]);
    firebaseApi.lastCloudSaveAt = Date.now();
    setSyncStatus("클라우드 저장 완료");
    if (showMessage) showToast("Firebase 저장 완료");
  } catch (error) {
    setSyncStatus("클라우드 저장 실패");
    if (showMessage) showToast("Firestore 규칙 또는 네트워크를 확인하세요.");
    console.warn("Cloud save failed", error);
  }
}

function subscribeLeaderboard() {
  if (!firebaseApi.ready || !firebaseApi.user) return;
  const { collection, query, orderBy, limit, onSnapshot } = firebaseApi.modules;
  if (firebaseApi.unsubscribeRank) firebaseApi.unsubscribeRank();
  const rankQuery = query(collection(firebaseApi.db, "leaderboard"), orderBy("score", "desc"), limit(20));
  firebaseApi.unsubscribeRank = onSnapshot(rankQuery, snapshot => {
    leaderRows = snapshot.docs.map(docSnap => docSnap.data());
    renderLeaderboard();
  }, error => {
    console.warn("Leaderboard subscription failed", error);
    leaderRows = [];
    renderLeaderboard();
  });
}

async function loadLeaderboardOnce() {
  if (!firebaseApi.ready || !firebaseApi.user) {
    showToast("로그인 후 랭킹을 볼 수 있습니다.");
    return;
  }
  const { collection, query, orderBy, limit, getDocs } = firebaseApi.modules;
  try {
    const rankQuery = query(collection(firebaseApi.db, "leaderboard"), orderBy("score", "desc"), limit(20));
    const snapshot = await getDocs(rankQuery);
    leaderRows = snapshot.docs.map(docSnap => docSnap.data());
    renderLeaderboard();
    showToast("랭킹을 갱신했습니다.");
  } catch (error) {
    showToast("랭킹 읽기 실패");
    console.warn("Leaderboard load failed", error);
  }
}

function setSyncStatus(message) {
  const target = document.getElementById("syncStatus");
  if (target) target.textContent = message;
}

function displayName(user) {
  return user?.displayName || user?.email?.split("@")[0] || "센터장";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value || 0));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.KCityGame = {
  get state() {
    return state;
  },
  saveNow,
  recruitWorker,
  startHunt
};
