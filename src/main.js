import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4RvZ2hUCifKBOE2uLEFQFMwTBMcQoGz8",
  authDomain: "k-city-webgame.firebaseapp.com",
  projectId: "k-city-webgame",
  storageBucket: "k-city-webgame.firebasestorage.app",
  messagingSenderId: "764165707172",
  appId: "1:764165707172:web:77cea6d091cd39803b5d31",
  measurementId: "G-W202YGQDF3"
};

const VERSION = "static-hotfix-2026-06-05";
const SAVE_KEY = "kcity.innerworld.static.save.v1";
const appEl = document.querySelector("#app");

let firebase = { ok: false, app: null, auth: null, db: null, user: null, error: "" };
let state = loadLocal() || createFreshState();
let view = "home";
let selectedChapterId = "alley";
let toastTimer = null;

const CARDS = [
  { id: "hanseo", name: "한서", title: "새벽 순찰자", rarity: "SSR", element: "빛", faction: "방범대", role: "공격", power: 740, hp: 1380, atk: 320, def: 100, skill: "새벽 일섬", text: "첫 타격 피해 +40%" },
  { id: "yuria", name: "유리아", title: "기억 조율사", rarity: "SSR", element: "정신", faction: "이너월드", role: "지원", power: 710, hp: 1520, atk: 235, def: 145, skill: "공명 회복", text: "아군 전체 회복 및 공격 증가" },
  { id: "madox", name: "마독스", title: "폐공장 기사", rarity: "SSR", element: "철", faction: "그레이", role: "방어", power: 705, hp: 1840, atk: 220, def: 220, skill: "철벽 돌진", text: "피해 감소 후 반격" },
  { id: "sera", name: "세라", title: "청월 해커", rarity: "SR", element: "전기", faction: "방범대", role: "교란", power: 520, hp: 1180, atk: 250, def: 90, skill: "블루 스파크", text: "적 방어 감소" },
  { id: "raven", name: "레이븐", title: "옥상 저격수", rarity: "SR", element: "암", faction: "그레이", role: "공격", power: 545, hp: 1040, atk: 292, def: 75, skill: "야간 조준", text: "치명타 확률 증가" },
  { id: "mina", name: "미나", title: "응급 대원", rarity: "SR", element: "물", faction: "방범대", role: "지원", power: 500, hp: 1360, atk: 175, def: 120, skill: "응급 처치", text: "가장 약한 아군 회복" },
  { id: "jin", name: "진", title: "골목 파수꾼", rarity: "R", element: "불", faction: "방범대", role: "공격", power: 330, hp: 900, atk: 170, def: 60, skill: "연속 타격", text: "2회 공격" },
  { id: "nari", name: "나리", title: "드론 운용자", rarity: "R", element: "바람", faction: "민간", role: "교란", power: 310, hp: 860, atk: 145, def: 65, skill: "정찰 드론", text: "적 명중률 감소" },
  { id: "guk", name: "국현", title: "상가 수호자", rarity: "R", element: "땅", faction: "민간", role: "방어", power: 300, hp: 1120, atk: 120, def: 110, skill: "방패 밀기", text: "자신 방어 증가" }
];

const CHAPTERS = [
  { id: "alley", name: "1구역: 불 꺼진 골목", level: 1, cost: 4, enemy: "그림자 불량배", power: 780, exp: 60, gold: 90, gems: 8 },
  { id: "station", name: "2구역: 폐역 플랫폼", level: 2, cost: 5, enemy: "무임승차 망령", power: 1250, exp: 92, gold: 130, gems: 10 },
  { id: "market", name: "3구역: 잠든 시장", level: 3, cost: 6, enemy: "상권 약탈단", power: 1720, exp: 130, gold: 180, gems: 12 },
  { id: "tower", name: "4구역: K-타워 균열", level: 5, cost: 8, enemy: "이너월드 파편", power: 2520, exp: 200, gold: 260, gems: 18 }
];

const MISSIONS = [
  { id: "battle3", text: "순찰 전투 3회", goal: 3, reward: { gold: 300, gems: 30 } },
  { id: "gacha1", text: "요원 모집 1회", goal: 1, reward: { gems: 40 } },
  { id: "pvp1", text: "대련 1회", goal: 1, reward: { gold: 500, gems: 50 } }
];

function createFreshState() {
  return {
    playerName: "무명 방범대원",
    level: 1,
    exp: 0,
    gold: 600,
    gems: 500,
    energy: 30,
    maxEnergy: 30,
    pity: 0,
    battles: 0,
    gachaCount: 0,
    pvpCount: 0,
    wins: 0,
    losses: 0,
    lastBattleLog: ["K-시티 외곽 초소에 도착했다."],
    cards: [owned("jin", 1), owned("nari", 1), owned("guk", 1)],
    deck: ["jin", "nari", "guk"],
    facilities: { hq: 1, lab: 1, dorm: 1 },
    missionsClaimed: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function owned(cardId, level = 1) {
  return { uid: crypto.randomUUID(), cardId, level, copies: 1, locked: false };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn("local save load failed", error);
    return null;
  }
}

function migrate(save) {
  const fresh = createFreshState();
  return {
    ...fresh,
    ...save,
    cards: Array.isArray(save.cards) && save.cards.length ? save.cards : fresh.cards,
    deck: Array.isArray(save.deck) && save.deck.length ? save.deck : fresh.deck,
    missionsClaimed: save.missionsClaimed || {},
    facilities: { ...fresh.facilities, ...(save.facilities || {}) },
    lastBattleLog: Array.isArray(save.lastBattleLog) ? save.lastBattleLog : fresh.lastBattleLog
  };
}

function saveLocal() {
  state.updatedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

async function initFirebase() {
  try {
    firebase.app = initializeApp(firebaseConfig);
    firebase.auth = getAuth(firebase.app);
    firebase.db = getFirestore(firebase.app);
    firebase.ok = true;
    analyticsSupported().then((supported) => {
      if (supported) getAnalytics(firebase.app);
    }).catch(() => {});
    onAuthStateChanged(firebase.auth, async (user) => {
      firebase.user = user;
      if (user) {
        await loadCloudSave();
        await saveCloud();
        toast(`${user.displayName || user.email} 로그인 완료`);
      }
      render();
    });
  } catch (error) {
    firebase.ok = false;
    firebase.error = error.message || String(error);
    console.error("Firebase init failed", error);
  }
}

function cardById(id) {
  return CARDS.find((card) => card.id === id) || CARDS[0];
}

function ownedCards() {
  return state.cards.map((item) => ({ ...item, base: cardById(item.cardId) }));
}

function deckCards() {
  return state.deck.map((id) => ownedCards().find((item) => item.uid === id)).filter(Boolean);
}

function cardPower(item) {
  const base = item.base || cardById(item.cardId);
  const rarityBonus = base.rarity === "SSR" ? 42 : base.rarity === "SR" ? 26 : 14;
  return base.power + item.level * rarityBonus + (item.copies - 1) * rarityBonus * 2;
}

function teamPower() {
  const raw = deckCards().reduce((sum, item) => sum + cardPower(item), 0);
  return Math.round(raw * resonanceMultiplier());
}

function resonanceMultiplier() {
  const deck = deckCards();
  const factions = new Map();
  const elements = new Map();
  for (const item of deck) {
    factions.set(item.base.faction, (factions.get(item.base.faction) || 0) + 1);
    elements.set(item.base.element, (elements.get(item.base.element) || 0) + 1);
  }
  let bonus = 1;
  if ([...factions.values()].some((count) => count >= 2)) bonus += 0.08;
  if ([...elements.values()].some((count) => count >= 2)) bonus += 0.06;
  return bonus;
}

function expToNext() {
  return 160 + (state.level - 1) * 90;
}

function addExp(amount) {
  state.exp += amount;
  let leveled = false;
  while (state.exp >= expToNext()) {
    state.exp -= expToNext();
    state.level += 1;
    state.maxEnergy += 3;
    state.energy = state.maxEnergy;
    state.gems += 80;
    leveled = true;
  }
  if (leveled && state.level >= 2 && !firebase.user) {
    toast("Lv.2 달성! 로그인 후 계속 진행할 수 있습니다.");
    view = "profile";
  }
}

function isLoginGateActive() {
  return state.level >= 2 && !firebase.user;
}

function canPlayLockedContent() {
  if (isLoginGateActive()) {
    toast("Lv.2부터는 로그인이 필요합니다.");
    view = "profile";
    render();
    return false;
  }
  return true;
}

function battle(chapterId) {
  const chapter = CHAPTERS.find((item) => item.id === chapterId) || CHAPTERS[0];
  if (chapter.level > state.level) return toast("요구 레벨이 부족합니다.");
  if (chapter.level >= 2 && !canPlayLockedContent()) return;
  if (state.energy < chapter.cost) return toast("행동력이 부족합니다.");

  state.energy -= chapter.cost;
  const myPower = teamPower();
  const variance = 0.82 + Math.random() * 0.38;
  const score = Math.round(myPower * variance);
  const win = score >= chapter.power * 0.88;

  state.battles += 1;
  if (win) {
    state.gold += chapter.gold;
    state.gems += chapter.gems;
    addExp(chapter.exp);
    const deck = deckCards();
    if (deck.length) {
      const target = deck[Math.floor(Math.random() * deck.length)];
      const owned = state.cards.find((item) => item.uid === target.uid);
      if (owned && Math.random() < 0.45) owned.level += 1;
    }
  } else {
    addExp(Math.ceil(chapter.exp * 0.35));
    state.gold += Math.ceil(chapter.gold * 0.25);
  }

  state.lastBattleLog = makeBattleLog(chapter, score, win);
  saveLocal();
  saveCloudDebounced();
  render();
}

function makeBattleLog(chapter, score, win) {
  const lead = deckCards()[0]?.base?.name || "방범대원";
  return [
    `${chapter.name} 진입`,
    `${lead}의 선제 스킬 발동`,
    `${chapter.enemy} 전투력 ${chapter.power.toLocaleString()} / 우리 팀 판정 ${score.toLocaleString()}`,
    win ? "승리! 시민 불안도가 내려갔다." : "패배... 후퇴하며 정보를 수집했다."
  ];
}

function drawOne() {
  const forcedSSR = state.pity >= 69;
  const roll = Math.random() * 100;
  let pool;
  if (forcedSSR || roll < 3) pool = CARDS.filter((card) => card.rarity === "SSR");
  else if (roll < 20) pool = CARDS.filter((card) => card.rarity === "SR");
  else pool = CARDS.filter((card) => card.rarity === "R");

  const card = pool[Math.floor(Math.random() * pool.length)];
  const existing = state.cards.find((item) => item.cardId === card.id);
  if (existing) existing.copies += 1;
  else state.cards.push(owned(card.id, 1));

  if (card.rarity === "SSR") state.pity = 0;
  else state.pity += 1;
  state.gachaCount += 1;
  return card;
}

function gacha(times) {
  if (!canPlayLockedContent()) return;
  const cost = times === 10 ? 900 : 100;
  if (state.gems < cost) return toast("젬이 부족합니다.");
  state.gems -= cost;
  const result = Array.from({ length: times }, () => drawOne());
  state.lastBattleLog = [`요원 모집 결과: ${result.map((card) => `${card.rarity} ${card.name}`).join(", ")}`];
  saveLocal();
  saveCloudDebounced();
  render();
}

function setDeck(uid) {
  const item = state.cards.find((card) => card.uid === uid);
  if (!item) return;
  if (state.deck.includes(uid)) {
    if (state.deck.length <= 1) return toast("최소 1명은 편성해야 합니다.");
    state.deck = state.deck.filter((id) => id !== uid);
  } else {
    if (state.deck.length >= 4) return toast("덱은 최대 4명입니다.");
    state.deck.push(uid);
  }
  saveLocal();
  saveCloudDebounced();
  render();
}

function upgradeFacility(key) {
  if (!canPlayLockedContent()) return;
  const level = state.facilities[key] || 1;
  const cost = level * 360;
  if (state.gold < cost) return toast("골드가 부족합니다.");
  state.gold -= cost;
  state.facilities[key] = level + 1;
  if (key === "dorm") {
    state.maxEnergy += 2;
    state.energy = state.maxEnergy;
  }
  saveLocal();
  saveCloudDebounced();
  render();
}

function missionProgress(id) {
  if (id === "battle3") return Math.min(state.battles, 3);
  if (id === "gacha1") return Math.min(state.gachaCount, 1);
  if (id === "pvp1") return Math.min(state.pvpCount, 1);
  return 0;
}

function claimMission(id) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission || state.missionsClaimed[id]) return;
  if (missionProgress(id) < mission.goal) return toast("아직 완료하지 못했습니다.");
  state.gold += mission.reward.gold || 0;
  state.gems += mission.reward.gems || 0;
  state.missionsClaimed[id] = true;
  saveLocal();
  saveCloudDebounced();
  render();
}

async function doPvp() {
  if (!canPlayLockedContent()) return;
  if (!firebase.user) return toast("PvP는 로그인이 필요합니다.");
  const enemyPower = Math.round(900 + state.level * 420 + Math.random() * 1200);
  const myPower = teamPower();
  const score = Math.round(myPower * (0.78 + Math.random() * 0.45));
  const win = score >= enemyPower;
  state.pvpCount += 1;
  if (win) {
    state.wins += 1;
    state.gems += 35;
    state.gold += 160;
  } else {
    state.losses += 1;
    state.gold += 60;
  }
  state.lastBattleLog = [
    "비동기 대련 매칭 완료",
    `우리 팀 ${score.toLocaleString()} vs 상대 ${enemyPower.toLocaleString()}`,
    win ? "승리! 랭킹 점수가 상승했다." : "패배. 상대의 공명 조합이 더 강했다."
  ];
  saveLocal();
  await saveCloud();
  await publishPvpLog(win, enemyPower, score);
  await publishRanking();
  await loadRanking();
  render();
}

async function publishPvpLog(win, enemyPower, score) {
  if (!firebase.ok || !firebase.user) return;
  try {
    await addDoc(collection(firebase.db, "pvpMatches"), {
      uid: firebase.user.uid,
      playerName: state.playerName,
      result: win ? "win" : "loss",
      myScore: score,
      enemyPower,
      teamPower: teamPower(),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("pvp log failed", error);
  }
}

async function publishRanking() {
  if (!firebase.ok || !firebase.user) return;
  const rating = state.wins * 30 - state.losses * 10 + teamPower() + state.level * 100;
  try {
    await setDoc(doc(firebase.db, "rankings", firebase.user.uid), {
      uid: firebase.user.uid,
      playerName: state.playerName,
      level: state.level,
      wins: state.wins,
      losses: state.losses,
      teamPower: teamPower(),
      rating,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn("ranking publish failed", error);
  }
}

let ranking = [];
async function loadRanking() {
  if (!firebase.ok) return;
  try {
    const snap = await getDocs(query(collection(firebase.db, "rankings"), orderBy("rating", "desc"), limit(20)));
    ranking = snap.docs.map((item) => item.data());
  } catch (error) {
    ranking = [];
    console.warn("ranking load failed", error);
  }
}

async function loadCloudSave() {
  if (!firebase.ok || !firebase.user) return;
  try {
    const ref = doc(firebase.db, "users", firebase.user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cloud = snap.data()?.save;
      if (cloud && (cloud.updatedAt || 0) > (state.updatedAt || 0)) {
        state = migrate(cloud);
        saveLocal();
      }
    }
  } catch (error) {
    toast("클라우드 저장 불러오기 실패: Rules 확인 필요");
    console.warn("load cloud failed", error);
  }
}

let cloudSaveTimer = null;
function saveCloudDebounced() {
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveCloud, 500);
}

async function saveCloud() {
  if (!firebase.ok || !firebase.user) return;
  try {
    await setDoc(doc(firebase.db, "users", firebase.user.uid), {
      uid: firebase.user.uid,
      email: firebase.user.email || null,
      displayName: firebase.user.displayName || state.playerName,
      save: state,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await publishRanking();
  } catch (error) {
    console.warn("save cloud failed", error);
  }
}

async function emailLogin(mode) {
  if (!firebase.ok) return toast(`Firebase 초기화 실패: ${firebase.error}`);
  const email = document.querySelector("#email")?.value?.trim();
  const password = document.querySelector("#password")?.value;
  if (!email || !password) return toast("이메일과 비밀번호를 입력하세요.");
  try {
    if (mode === "join") await createUserWithEmailAndPassword(firebase.auth, email, password);
    else await signInWithEmailAndPassword(firebase.auth, email, password);
  } catch (error) {
    toast(koreanAuthError(error));
  }
}

async function googleLogin() {
  if (!firebase.ok) return toast(`Firebase 초기화 실패: ${firebase.error}`);
  try {
    await signInWithPopup(firebase.auth, new GoogleAuthProvider());
  } catch (error) {
    toast(koreanAuthError(error));
  }
}

function koreanAuthError(error) {
  const code = error?.code || "";
  if (code.includes("popup")) return "팝업이 차단됐거나 닫혔습니다.";
  if (code.includes("operation-not-allowed")) return "Firebase Console에서 로그인 제공업체를 켜주세요.";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (code.includes("email-already")) return "이미 가입된 이메일입니다.";
  if (code.includes("weak-password")) return "비밀번호는 6자 이상이어야 합니다.";
  return error?.message || "로그인 실패";
}

function toast(message) {
  const box = document.querySelector(".toast");
  if (!box) return;
  box.textContent = message;
  box.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove("show"), 2600);
}

function setName() {
  const value = document.querySelector("#playerName")?.value?.trim();
  if (!value) return toast("이름을 입력하세요.");
  state.playerName = value.slice(0, 14);
  saveLocal();
  saveCloudDebounced();
  render();
}

function resetGame() {
  if (!confirm("로컬 진행 상황을 초기화할까요? 클라우드 저장은 다음 로그인 저장 시 덮어써질 수 있습니다.")) return;
  state = createFreshState();
  view = "home";
  saveLocal();
  render();
}

function html(strings, ...values) {
  return strings.map((str, i) => str + (values[i] ?? "")).join("");
}

function rarityClass(rarity) {
  return rarity.toLowerCase();
}

function progressPercent() {
  return Math.min(100, Math.round((state.exp / expToNext()) * 100));
}

function render() {
  saveLocal();
  const gate = isLoginGateActive();
  appEl.innerHTML = html`
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">K-CITY INNERWORLD</p>
          <h1>${state.playerName}</h1>
        </div>
        <button class="mini-btn" data-action="profile">${firebase.user ? "계정" : "로그인"}</button>
      </header>

      <section class="status-card ${gate ? "gate" : ""}">
        <div class="level-ring"><span>Lv.${state.level}</span></div>
        <div class="status-main">
          <div class="spread"><b>전투력 ${teamPower().toLocaleString()}</b><span>${firebase.user ? "클라우드 동기화" : state.level >= 2 ? "로그인 필요" : "게스트 체험"}</span></div>
          <div class="bar"><i style="width:${progressPercent()}%"></i></div>
          <div class="resource-row">
            <span>⚡ ${state.energy}/${state.maxEnergy}</span>
            <span>🪙 ${state.gold.toLocaleString()}</span>
            <span>💎 ${state.gems.toLocaleString()}</span>
          </div>
        </div>
      </section>

      ${gate ? gateBanner() : ""}

      <main class="content">
        ${view === "home" ? homeView() : ""}
        ${view === "battle" ? battleView() : ""}
        ${view === "deck" ? deckView() : ""}
        ${view === "gacha" ? gachaView() : ""}
        ${view === "pvp" ? pvpView() : ""}
        ${view === "rank" ? rankView() : ""}
        ${view === "profile" ? profileView() : ""}
      </main>

      <nav class="bottom-nav">
        ${navButton("home", "기지", "⌂")}
        ${navButton("battle", "순찰", "⚔")}
        ${navButton("deck", "요원", "▣")}
        ${navButton("gacha", "모집", "✦")}
        ${navButton("pvp", "대련", "◆")}
        ${navButton("rank", "랭킹", "☰")}
      </nav>
    </div>
    <div class="toast"></div>
  `;
  bindEvents();
}

function gateBanner() {
  return html`
    <section class="login-gate">
      <b>Lv.2부터 정식 요원 등록이 필요합니다.</b>
      <p>로그인하면 저장, PvP, 랭킹, 고급 구역이 활성화됩니다.</p>
      <button data-action="profile">로그인하러 가기</button>
    </section>
  `;
}

function navButton(id, label, icon) {
  return html`<button class="${view === id ? "active" : ""}" data-view="${id}"><span>${icon}</span>${label}</button>`;
}

function homeView() {
  const hqCost = state.facilities.hq * 360;
  const labCost = state.facilities.lab * 360;
  const dormCost = state.facilities.dorm * 360;
  return html`
    <section class="hero">
      <div>
        <p class="eyebrow">도시형 카드 RPG</p>
        <h2>균열이 열린 K-시티를 방범대가 지킨다</h2>
        <p>단순 카드 수집이 아니라, 공명 조합·시설 성장·비동기 대련으로 확장되는 모바일 웹 RPG 스타터입니다.</p>
      </div>
      <button class="primary" data-view="battle">게임 시작</button>
    </section>

    <section class="panel">
      <div class="section-title"><h3>시설 관리</h3><span>성장 루프</span></div>
      <div class="facility-grid">
        <button class="facility" data-upgrade="hq"><b>방범 본부 Lv.${state.facilities.hq}</b><span>보상 효율 증가 예정</span><em>${hqCost} 골드</em></button>
        <button class="facility" data-upgrade="lab"><b>공명 연구소 Lv.${state.facilities.lab}</b><span>덱 시너지 확장 예정</span><em>${labCost} 골드</em></button>
        <button class="facility" data-upgrade="dorm"><b>요원 숙소 Lv.${state.facilities.dorm}</b><span>행동력 최대치 +2</span><em>${dormCost} 골드</em></button>
      </div>
    </section>

    <section class="panel">
      <div class="section-title"><h3>일일 임무</h3><span>보상</span></div>
      <div class="mission-list">
        ${MISSIONS.map((mission) => missionItem(mission)).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="section-title"><h3>최근 로그</h3><span>전투 기록</span></div>
      <div class="log-box">${state.lastBattleLog.map((line) => `<p>${line}</p>`).join("")}</div>
    </section>
  `;
}

function missionItem(mission) {
  const progress = missionProgress(mission.id);
  const done = progress >= mission.goal;
  const claimed = state.missionsClaimed[mission.id];
  return html`
    <article class="mission">
      <div><b>${mission.text}</b><span>${progress}/${mission.goal} · ${mission.reward.gold ? `${mission.reward.gold}G ` : ""}${mission.reward.gems ? `${mission.reward.gems}젬` : ""}</span></div>
      <button ${!done || claimed ? "disabled" : ""} data-claim="${mission.id}">${claimed ? "완료" : "수령"}</button>
    </article>
  `;
}

function battleView() {
  return html`
    <section class="panel">
      <div class="section-title"><h3>순찰 구역</h3><span>챕터 선택</span></div>
      <div class="chapter-list">
        ${CHAPTERS.map((chapter) => chapterCard(chapter)).join("")}
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h3>전투 로그</h3><span>${selectedChapterId}</span></div>
      <div class="log-box big">${state.lastBattleLog.map((line) => `<p>${line}</p>`).join("")}</div>
    </section>
  `;
}

function chapterCard(chapter) {
  const locked = chapter.level > state.level || (chapter.level >= 2 && !firebase.user);
  return html`
    <article class="chapter ${selectedChapterId === chapter.id ? "selected" : ""}">
      <div>
        <b>${chapter.name}</b>
        <span>${chapter.enemy} · 권장 ${chapter.power.toLocaleString()} · 행동력 ${chapter.cost}</span>
      </div>
      <button ${locked ? "disabled" : ""} data-battle="${chapter.id}">${locked ? `Lv.${chapter.level}/로그인` : "도전"}</button>
    </article>
  `;
}

function deckView() {
  const deckNames = deckCards().map((item) => item.base.name).join(" · ") || "없음";
  return html`
    <section class="panel">
      <div class="section-title"><h3>요원 편성</h3><span>${deckNames}</span></div>
      <p class="hint">최대 4명 편성. 같은 진영 2명 이상이면 +8%, 같은 속성 2명 이상이면 +6% 공명 보너스가 붙습니다.</p>
      <div class="card-grid">
        ${ownedCards().sort((a, b) => cardPower(b) - cardPower(a)).map((item) => ownedCard(item)).join("")}
      </div>
    </section>
  `;
}

function ownedCard(item) {
  const selected = state.deck.includes(item.uid);
  return html`
    <article class="agent-card ${rarityClass(item.base.rarity)} ${selected ? "in-deck" : ""}" data-card="${item.uid}">
      <div class="card-top"><span>${item.base.rarity}</span><em>${item.base.element}</em></div>
      <h3>${item.base.name}</h3>
      <p>${item.base.title}</p>
      <div class="skill"><b>${item.base.skill}</b><span>${item.base.text}</span></div>
      <div class="card-bottom"><span>Lv.${item.level} · 복제 ${item.copies}</span><b>${cardPower(item).toLocaleString()}</b></div>
    </article>
  `;
}

function gachaView() {
  return html`
    <section class="panel gacha-panel">
      <div class="section-title"><h3>요원 모집</h3><span>SSR 3% · SR 17% · R 80%</span></div>
      <div class="portal">
        <div class="portal-core">${70 - state.pity}</div>
        <p>SSR 천장까지 남은 모집 수</p>
      </div>
      <div class="button-row">
        <button class="primary" data-gacha="1">1회 모집 · 100젬</button>
        <button class="primary ghost" data-gacha="10">10회 모집 · 900젬</button>
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h3>대표 카드풀</h3><span>초기 시즌</span></div>
      <div class="card-grid small">
        ${CARDS.map((card) => html`<article class="agent-card ${rarityClass(card.rarity)}"><div class="card-top"><span>${card.rarity}</span><em>${card.element}</em></div><h3>${card.name}</h3><p>${card.title}</p><div class="skill"><b>${card.skill}</b><span>${card.text}</span></div></article>`).join("")}
      </div>
    </section>
  `;
}

function pvpView() {
  return html`
    <section class="panel pvp-panel">
      <div class="section-title"><h3>비동기 대련장</h3><span>멀티 지원 초안</span></div>
      <div class="versus">
        <div><b>${state.playerName}</b><span>${teamPower().toLocaleString()}</span></div>
        <strong>VS</strong>
        <div><b>익명 상대</b><span>자동 매칭</span></div>
      </div>
      <p class="hint">현재는 클라이언트 프로토타입 판정입니다. 상용화 단계에서는 Cloud Functions로 판정과 보상 지급을 서버 검증해야 합니다.</p>
      <button class="primary" data-pvp>대련 시작</button>
      <div class="record"><span>승 ${state.wins}</span><span>패 ${state.losses}</span><span>대련 ${state.pvpCount}</span></div>
    </section>
  `;
}

function rankView() {
  const rows = ranking.length ? ranking : [{ playerName: state.playerName, level: state.level, wins: state.wins, losses: state.losses, teamPower: teamPower(), rating: state.wins * 30 - state.losses * 10 + teamPower() + state.level * 100 }];
  return html`
    <section class="panel">
      <div class="section-title"><h3>랭킹</h3><span>${firebase.user ? "Firestore" : "로그인 필요"}</span></div>
      <button class="ghost-btn" data-refresh-rank>랭킹 새로고침</button>
      <div class="rank-list">
        ${rows.map((row, index) => html`
          <article class="rank-row">
            <b>#${index + 1}</b>
            <div><span>${row.playerName || "익명"}</span><em>Lv.${row.level || 1} · ${row.wins || 0}승 ${row.losses || 0}패</em></div>
            <strong>${Math.round(row.rating || row.teamPower || 0).toLocaleString()}</strong>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function profileView() {
  return html`
    <section class="panel profile-panel">
      <div class="section-title"><h3>요원 등록</h3><span>${firebase.user ? "로그인됨" : "Lv.2 해금"}</span></div>
      <label class="field"><span>플레이어 이름</span><input id="playerName" value="${state.playerName}" maxlength="14" /></label>
      <button class="ghost-btn" data-set-name>이름 저장</button>

      ${firebase.user ? html`
        <div class="account-box"><b>${firebase.user.displayName || firebase.user.email}</b><span>UID 연결 완료 · 클라우드 저장 사용 중</span></div>
        <div class="button-row"><button class="primary" data-save-cloud>클라우드 저장</button><button class="ghost-btn" data-logout>로그아웃</button></div>
      ` : html`
        <div class="login-box">
          <label class="field"><span>이메일</span><input id="email" type="email" placeholder="you@example.com" /></label>
          <label class="field"><span>비밀번호</span><input id="password" type="password" placeholder="6자 이상" /></label>
          <div class="button-row"><button class="primary" data-email-login="login">로그인</button><button class="ghost-btn" data-email-login="join">회원가입</button></div>
          <button class="google" data-google>Google로 로그인</button>
          <p class="hint">Firebase Console → Authentication → Sign-in method에서 Email/Password 또는 Google을 켜야 합니다.</p>
        </div>
      `}
      <div class="danger-zone">
        <b>디버그</b>
        <span>버전 ${VERSION}</span>
        <button class="danger" data-reset>로컬 초기화</button>
      </div>
      ${firebase.error ? `<pre class="error-box">${firebase.error}</pre>` : ""}
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    view = button.dataset.view;
    if (view === "rank") loadRanking().then(render);
    else render();
  }));
  document.querySelectorAll("[data-action='profile']").forEach((button) => button.addEventListener("click", () => {
    view = "profile";
    render();
  }));
  document.querySelectorAll("[data-battle]").forEach((button) => button.addEventListener("click", () => {
    selectedChapterId = button.dataset.battle;
    battle(button.dataset.battle);
  }));
  document.querySelectorAll("[data-card]").forEach((card) => card.addEventListener("click", () => setDeck(card.dataset.card)));
  document.querySelectorAll("[data-gacha]").forEach((button) => button.addEventListener("click", () => gacha(Number(button.dataset.gacha))));
  document.querySelectorAll("[data-upgrade]").forEach((button) => button.addEventListener("click", () => upgradeFacility(button.dataset.upgrade)));
  document.querySelectorAll("[data-claim]").forEach((button) => button.addEventListener("click", () => claimMission(button.dataset.claim)));
  document.querySelector("[data-pvp]")?.addEventListener("click", doPvp);
  document.querySelector("[data-refresh-rank]")?.addEventListener("click", async () => { await loadRanking(); render(); });
  document.querySelector("[data-set-name]")?.addEventListener("click", setName);
  document.querySelectorAll("[data-email-login]").forEach((button) => button.addEventListener("click", () => emailLogin(button.dataset.emailLogin)));
  document.querySelector("[data-google]")?.addEventListener("click", googleLogin);
  document.querySelector("[data-save-cloud]")?.addEventListener("click", async () => { await saveCloud(); toast("클라우드 저장 완료"); });
  document.querySelector("[data-logout]")?.addEventListener("click", () => signOut(firebase.auth));
  document.querySelector("[data-reset]")?.addEventListener("click", resetGame);
}

window.addEventListener("error", (event) => {
  appEl.innerHTML = `<div class="fatal"><h1>로딩 오류</h1><p>${event.message}</p><pre>${event.filename}:${event.lineno}</pre></div>`;
});

await initFirebase();
render();
