import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady, googleProvider } from "../lib/firebase.js";
import { CHAPTERS } from "../data/chapters.js";
import { addExp, isLoginGateActive, loadLocalState, normalizeState, publicProfile, saveLocalState } from "../game/state.js";
import { resolveBattle } from "../game/battle.js";
import { drawCards, toggleTeamCard, trainCard } from "../game/economy.js";
import { addMissionProgress, claimMission, upgradeBuilding } from "../game/progression.js";
import {
  cancelArenaRoom,
  fetchLeaderboard,
  findOrCreateArenaRoom,
  listenArenaRoom,
  publishLeaderboard
} from "../game/pvp.js";
import {
  renderArena,
  renderBattle,
  renderBottomNav,
  renderCity,
  renderGacha,
  renderHeader,
  renderIntro,
  renderLoginModal,
  renderMissions,
  renderRoster,
  renderToast
} from "./components.js";

let root;
let state = loadLocalState();
let currentTab = state.flags.entered ? "city" : "intro";
let currentUser = null;
let modal = null;
let modalMessage = "";
let toast = "";
let leaderboard = [];
let arenaUnsubscribe = null;
let saveTimer = null;

function setToast(message) {
  toast = message;
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => {
    toast = "";
    render();
  }, 2600);
}

function markDirty(nextState, options = {}) {
  state = saveLocalState(normalizeState(nextState));
  scheduleCloudSave();
  if (options.toast) setToast(options.toast);
  render();
}

function scheduleCloudSave() {
  if (!currentUser || !db) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => persistCloudState().catch(console.error), 350);
}

async function persistCloudState() {
  if (!currentUser || !db) return;
  const synced = normalizeState({
    ...state,
    account: {
      uid: currentUser.uid,
      isCloud: true,
      displayName: currentUser.displayName || currentUser.email || state.account.displayName || "센터장"
    }
  });
  await setDoc(doc(db, "profiles", currentUser.uid), {
    ...synced,
    updatedAt: serverTimestamp()
  }, { merge: true });
  await publishLeaderboard(currentUser, synced);
}

async function loadCloudState(user) {
  if (!db || !user) return;
  const ref = doc(db, "profiles", user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    state = saveLocalState(normalizeState({
      ...snapshot.data(),
      account: {
        uid: user.uid,
        isCloud: true,
        displayName: user.displayName || user.email || snapshot.data().account?.displayName || "센터장"
      }
    }));
  } else {
    state = saveLocalState(normalizeState({
      ...state,
      account: {
        uid: user.uid,
        isCloud: true,
        displayName: user.displayName || user.email || state.account.displayName || "센터장"
      }
    }));
    await persistCloudState();
  }
}

function findStage(stageId) {
  for (const chapter of CHAPTERS) {
    const stage = chapter.stages.find((item) => item.id === stageId);
    if (stage) return stage;
  }
  return null;
}

function requireFirebase() {
  if (!firebaseReady || !auth || !db) {
    setToast("Firebase .env.local 설정이 필요합니다.");
    modal = "login";
    modalMessage = "Firebase 환경값을 넣으면 로그인과 저장이 활성화됩니다.";
    render();
    return false;
  }
  return true;
}

function requireLogin(message = "Lv.2부터는 로그인 후 진행됩니다.") {
  if (!requireFirebase()) return true;
  if (!currentUser) {
    modal = "login";
    modalMessage = message;
    render();
    return true;
  }
  return false;
}

function activeLoginGate() {
  return isLoginGateActive(state, currentUser);
}

function applyArenaResult(result) {
  if (!currentUser || !result) return;
  const next = structuredClone(state);
  const won = result.winnerUid === currentUser.uid;
  next.profile.arenaScore = Math.max(100, next.profile.arenaScore + (won ? 32 : -14));
  next.profile.gold += won ? 180 : 70;
  next.profile.gems += won ? 12 : 4;
  next.pvp.roomId = null;
  next.pvp.lastResult = result;
  next.missions.arena1 = Math.min(1, (next.missions.arena1 || 0) + 1);
  markDirty(next, { toast: won ? "대결 승리! 점수 +32" : "패배했지만 보상을 획득했습니다." });
}

async function startStage(stageId) {
  if (activeLoginGate() && requireLogin("Lv.2 달성! 이제 계정 연동 후 사건 기록이 저장됩니다.")) return;
  const stage = findStage(stageId);
  if (!stage) return;
  if (state.profile.stamina < stage.stamina) {
    setToast("스태미나가 부족합니다.");
    return;
  }
  const result = resolveBattle({ playerState: state, stage, seed: `${stage.id}-${Date.now()}` });
  let next = structuredClone(state);
  next.profile.stamina -= stage.stamina;
  next.battleLog = result.log;

  if (result.victory) {
    next.profile.gold += stage.reward.gold;
    next.profile.gems += stage.reward.gems;
    if (!next.profile.clearedStages.includes(stage.id)) next.profile.clearedStages.push(stage.id);
    next = addMissionProgress(next, "clear3", 1);
    const expResult = addExp(next, stage.reward.exp);
    next = expResult.state;
    const levelMessage = expResult.leveled ? ` Lv.${next.profile.level} 달성!` : "";
    markDirty(next, { toast: `${stage.name} 해결! ◎${stage.reward.gold} ◆${stage.reward.gems}${levelMessage}` });
    if (next.profile.level >= 2 && !currentUser) {
      modal = "login";
      modalMessage = "Lv.2부터 로그인하면 클라우드 저장, 모집, PvP, 랭킹이 열립니다.";
      render();
    }
  } else {
    markDirty(next, { toast: "사건 해결 실패. 팀 훈련이나 편성을 바꿔보세요." });
  }
}

async function doDraw(count) {
  if (activeLoginGate() && requireLogin("Lv.2부터 인재 모집은 로그인 후 가능합니다.")) return;
  const result = drawCards(state, count);
  if (!result.ok) {
    setToast(result.message);
    return;
  }
  const best = result.results.find((item) => item.card.grade === "SSR") || result.results.find((item) => item.card.grade === "SR") || result.results[0];
  markDirty(result.state, { toast: `${result.message}: ${best.card.grade} ${best.card.name}` });
}

async function doArenaMatch() {
  if (requireLogin("유저 대결은 로그인 후 이용할 수 있습니다.")) return;
  try {
    setToast("매칭 시도 중...");
    const result = await findOrCreateArenaRoom(currentUser, state);
    if (result.status === "waiting") {
      const next = structuredClone(state);
      next.pvp.roomId = result.roomId;
      markDirty(next, { toast: "대기방 생성. 다른 유저가 들어오면 결과가 나옵니다." });
      if (arenaUnsubscribe) arenaUnsubscribe();
      arenaUnsubscribe = listenArenaRoom(result.roomId, (room) => {
        if (room?.status === "resolved" && room.result && state.pvp.roomId === room.id) {
          applyArenaResult(room.result);
        }
      });
    } else if (result.result) {
      applyArenaResult(result.result);
    }
  } catch (error) {
    console.error(error);
    setToast(error.message || "대결 매칭 실패");
  }
}

async function refreshRanking() {
  try {
    leaderboard = await fetchLeaderboard();
    render();
  } catch (error) {
    console.error(error);
    setToast("랭킹을 불러오지 못했습니다.");
  }
}

async function handleAuthAction(action) {
  if (!requireFirebase()) return;
  const email = document.querySelector("#login-email")?.value?.trim();
  const password = document.querySelector("#login-password")?.value || "";
  try {
    if (action === "login-email") {
      await signInWithEmailAndPassword(auth, email, password);
    }
    if (action === "signup-email") {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    if (action === "login-google") {
      await signInWithPopup(auth, googleProvider);
    }
    modal = null;
    setToast("계정 연동 완료");
  } catch (error) {
    console.error(error);
    setToast(error.message || "로그인 실패");
  }
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  const insideModal = event.target.closest("[data-stop]");
  if (!target) return;
  if (insideModal && target.classList.contains("modal-backdrop")) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === "close-modal") {
    modal = null;
    modalMessage = "";
    render();
    return;
  }

  if (["login-email", "signup-email", "login-google"].includes(action)) {
    await handleAuthAction(action);
    return;
  }

  switch (action) {
    case "enter-game": {
      const next = structuredClone(state);
      next.flags.entered = true;
      currentTab = "city";
      markDirty(next);
      break;
    }
    case "tab": {
      currentTab = target.dataset.tab || "city";
      if (currentTab === "arena") refreshRanking();
      render();
      break;
    }
    case "open-login": {
      modal = "login";
      modalMessage = state.profile.level >= 2 && !currentUser ? "Lv.2부터 계정 연동이 필요합니다." : "";
      render();
      break;
    }
    case "logout": {
      if (auth) await signOut(auth);
      modal = null;
      setToast("로그아웃했습니다. 로컬 진행은 유지됩니다.");
      render();
      break;
    }
    case "start-stage": {
      await startStage(id);
      break;
    }
    case "draw": {
      await doDraw(Number(target.dataset.count || 1));
      break;
    }
    case "toggle-team": {
      const result = toggleTeamCard(state, id);
      if (result.ok) markDirty(result.state, { toast: result.message });
      else setToast(result.message);
      break;
    }
    case "train-card": {
      const result = trainCard(state, id);
      if (result.ok) markDirty(result.state, { toast: result.message });
      else setToast(result.message);
      break;
    }
    case "upgrade-building": {
      const result = upgradeBuilding(state, id);
      if (result.ok) markDirty(result.state, { toast: result.message });
      else setToast(result.message);
      break;
    }
    case "claim-mission": {
      const result = claimMission(state, id);
      if (result.ok) markDirty(result.state, { toast: result.message });
      else setToast(result.message);
      break;
    }
    case "pvp-match": {
      await doArenaMatch();
      break;
    }
    case "pvp-cancel": {
      if (currentUser && state.pvp.roomId) await cancelArenaRoom(currentUser, state.pvp.roomId);
      const next = structuredClone(state);
      next.pvp.roomId = null;
      markDirty(next, { toast: "대기방을 취소했습니다." });
      break;
    }
    case "refresh-ranking": {
      await refreshRanking();
      break;
    }
    default:
      break;
  }
}

function renderCurrentView() {
  if (currentTab === "intro") return renderIntro(state);
  if (currentTab === "city") return renderCity(state);
  if (currentTab === "battle") return renderBattle(state, activeLoginGate());
  if (currentTab === "roster") return renderRoster(state);
  if (currentTab === "gacha") return renderGacha(state, activeLoginGate());
  if (currentTab === "missions") return renderMissions(state);
  if (currentTab === "arena") return renderArena(state, currentUser, leaderboard, activeLoginGate());
  return renderCity(state);
}

function render() {
  if (!root) return;
  root.innerHTML = `
    <main class="app-shell">
      ${renderHeader(state, currentUser, firebaseReady)}
      <div class="screen-wrap">
        ${renderCurrentView()}
      </div>
      ${currentTab === "intro" ? "" : renderBottomNav(currentTab)}
      ${modal === "login" ? renderLoginModal(currentUser, modalMessage) : ""}
      ${renderToast(toast)}
    </main>
  `;
}

export function bootApp(element) {
  root = element;
  root.addEventListener("click", handleClick);
  render();

  if (auth) {
    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (user) {
        try {
          await loadCloudState(user);
          await refreshRanking();
        } catch (error) {
          console.error(error);
          setToast("클라우드 저장을 불러오지 못했습니다.");
        }
      } else {
        state = saveLocalState(normalizeState({
          ...state,
          account: { ...state.account, uid: null, isCloud: false }
        }));
      }
      render();
    });
  }
}
