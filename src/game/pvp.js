import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { resolveBattle } from "./battle.js";

function stripForArena(state) {
  return {
    version: state.version,
    account: state.account,
    profile: {
      level: state.profile.level,
      arenaScore: state.profile.arenaScore
    },
    buildings: state.buildings,
    ownedCards: state.ownedCards.filter((card) => state.team.includes(card.instanceId)),
    team: state.team
  };
}

function arenaResult(hostState, challengerState, seed) {
  const battle = resolveBattle({
    playerState: challengerState,
    enemyState: hostState,
    stage: { id: "arena", enemy: {} },
    seed
  });
  const challengerWon = battle.victory;
  return {
    winnerUid: challengerWon ? challengerState.account.uid : hostState.account.uid,
    loserUid: challengerWon ? hostState.account.uid : challengerState.account.uid,
    challengerWon,
    log: battle.log,
    power: battle.power,
    resolvedAt: Date.now()
  };
}

export async function publishLeaderboard(user, state) {
  if (!db || !user) return;
  const ref = doc(db, "leaderboards", user.uid);
  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName || state.account.displayName || "센터장",
    level: state.profile.level,
    score: state.profile.arenaScore,
    teamPower: Number(state.profile.teamPower || 0),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function fetchLeaderboard() {
  if (!db) return [];
  const ref = collection(db, "leaderboards");
  const snap = await getDocs(query(ref, orderBy("score", "desc"), orderBy("level", "desc"), limit(20)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function findOrCreateArenaRoom(user, state) {
  if (!db || !user) throw new Error("Firebase 로그인이 필요합니다.");
  const arenaState = stripForArena({
    ...state,
    account: { ...state.account, uid: user.uid, displayName: user.displayName || state.account.displayName }
  });

  const rooms = collection(db, "pvpRooms");
  const waitingSnap = await getDocs(query(rooms, where("status", "==", "waiting"), orderBy("createdAt", "asc"), limit(8)));
  const candidate = waitingSnap.docs.find((item) => item.data().hostUid !== user.uid);

  if (!candidate) {
    const room = await addDoc(rooms, {
      status: "waiting",
      hostUid: user.uid,
      hostName: user.displayName || arenaState.account.displayName || "센터장",
      hostState: arenaState,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { roomId: room.id, status: "waiting" };
  }

  const result = await runTransaction(db, async (transaction) => {
    const roomRef = doc(db, "pvpRooms", candidate.id);
    const roomDoc = await transaction.get(roomRef);
    if (!roomDoc.exists()) throw new Error("방이 사라졌습니다.");
    const data = roomDoc.data();
    if (data.status !== "waiting" || data.hostUid === user.uid) throw new Error("이미 매칭된 방입니다.");

    const seed = `${candidate.id}-${Date.now()}-${user.uid}`;
    const resolved = arenaResult(data.hostState, arenaState, seed);
    transaction.update(roomRef, {
      status: "resolved",
      challengerUid: user.uid,
      challengerName: user.displayName || arenaState.account.displayName || "센터장",
      challengerState: arenaState,
      result: resolved,
      updatedAt: serverTimestamp()
    });
    return { roomId: candidate.id, status: "resolved", result: resolved };
  });

  return result;
}

export function listenArenaRoom(roomId, callback) {
  if (!db || !roomId) return () => {};
  return onSnapshot(doc(db, "pvpRooms", roomId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function cancelArenaRoom(user, roomId) {
  if (!db || !user || !roomId) return;
  const ref = doc(db, "pvpRooms", roomId);
  await updateDoc(ref, {
    status: "cancelled",
    updatedAt: serverTimestamp()
  });
}
