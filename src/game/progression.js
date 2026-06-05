import { DAILY_MISSIONS } from "../data/chapters.js";

export function addMissionProgress(state, missionId, amount = 1) {
  const next = structuredClone(state);
  if (typeof next.missions[missionId] !== "number") next.missions[missionId] = 0;
  const mission = DAILY_MISSIONS.find((item) => item.id === missionId);
  next.missions[missionId] = Math.min((mission?.target || 999), next.missions[missionId] + amount);
  return next;
}

export function claimMission(state, missionId) {
  const mission = DAILY_MISSIONS.find((item) => item.id === missionId);
  if (!mission) return { ok: false, state, message: "없는 임무입니다." };
  if ((state.missions[missionId] || 0) < mission.target) {
    return { ok: false, state, message: "아직 완료되지 않았습니다." };
  }
  if (state.missions.claimed.includes(missionId)) {
    return { ok: false, state, message: "이미 보상을 받았습니다." };
  }

  const next = structuredClone(state);
  next.profile.gold += mission.reward.gold || 0;
  next.profile.gems += mission.reward.gems || 0;
  next.missions.claimed.push(missionId);
  return { ok: true, state: next, message: `${mission.label} 보상 수령` };
}

export function upgradeBuilding(state, buildingId) {
  const current = state.buildings[buildingId];
  if (!current) return { ok: false, state, message: "없는 시설입니다." };
  const cost = current * current * 480;
  if (state.profile.gold < cost) {
    return { ok: false, state, message: `골드가 부족합니다. 필요: ${cost}` };
  }
  const next = structuredClone(state);
  next.profile.gold -= cost;
  next.buildings[buildingId] += 1;
  if (buildingId === "generator") {
    next.profile.maxStamina += 2;
    next.profile.stamina += 2;
  }
  return { ok: true, state: next, message: `시설 Lv.${next.buildings[buildingId]} 업그레이드 완료` };
}
