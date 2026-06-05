import { CARD_POOL, getCard } from "../data/cards.js";
import { BANNER, gradeByRoll } from "../data/gacha.js";

function randomFloat() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0xffffffff;
}

function pickOne(list) {
  return list[Math.floor(randomFloat() * list.length)];
}

function pickCardIdByGrade(grade) {
  const pickup = BANNER.pickup[grade] || [];
  if (pickup.length && randomFloat() < 0.5) return pickOne(pickup);
  const pool = CARD_POOL.filter((card) => card.grade === grade);
  return pickOne(pool).id;
}

export function createCardInstance(cardId) {
  return {
    instanceId: `${cardId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cardId,
    level: 1,
    xp: 0,
    locked: false
  };
}

export function drawCards(state, count = 1) {
  const cost = count === 10 ? BANNER.tenCost : BANNER.singleCost * count;
  if (state.profile.gems < cost) {
    return { ok: false, state, message: `젬이 부족합니다. 필요: ${cost}`, results: [] };
  }

  const next = structuredClone(state);
  next.profile.gems -= cost;
  const results = [];

  for (let i = 0; i < count; i += 1) {
    const grade = gradeByRoll(randomFloat(), next.profile.pity);
    const cardId = pickCardIdByGrade(grade);
    const instance = createCardInstance(cardId);
    next.ownedCards.push(instance);
    next.profile.pity = grade === "SSR" ? 0 : next.profile.pity + 1;
    results.push({ instance, card: getCard(cardId) });
  }

  next.missions.draw1 = Math.min(1, (next.missions.draw1 || 0) + 1);
  return { ok: true, state: next, message: `${count}회 모집 완료`, results };
}

export function trainCard(state, instanceId) {
  const index = state.ownedCards.findIndex((card) => card.instanceId === instanceId);
  if (index === -1) return { ok: false, state, message: "카드를 찾지 못했습니다." };
  const card = state.ownedCards[index];
  const base = getCard(card.cardId);
  const cost = Math.round(120 * card.level * (base.grade === "SSR" ? 1.8 : base.grade === "SR" ? 1.35 : 1));
  if (state.profile.gold < cost) return { ok: false, state, message: `골드가 부족합니다. 필요: ${cost}` };
  const next = structuredClone(state);
  next.profile.gold -= cost;
  next.ownedCards[index].level += 1;
  return { ok: true, state: next, message: `${base.name} Lv.${next.ownedCards[index].level}` };
}

export function toggleTeamCard(state, instanceId) {
  const next = structuredClone(state);
  const exists = next.team.includes(instanceId);
  if (exists) {
    if (next.team.length <= 1) return { ok: false, state, message: "최소 1명은 편성해야 합니다." };
    next.team = next.team.filter((id) => id !== instanceId);
  } else {
    if (next.team.length >= 5) return { ok: false, state, message: "최대 5명까지 편성 가능합니다." };
    next.team.push(instanceId);
  }
  return { ok: true, state: next, message: exists ? "팀에서 제외했습니다." : "팀에 편성했습니다." };
}
