import { getCard, GRADES } from "../data/cards.js";

function hashSeed(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rng(seedText) {
  let seed = hashSeed(seedText) || 1;
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildUnits(state, side = "ally") {
  return state.team
    .map((instanceId) => state.ownedCards.find((owned) => owned.instanceId === instanceId))
    .filter(Boolean)
    .map((owned, index) => {
      const base = getCard(owned.cardId);
      const gradePower = GRADES[base.grade].power;
      const levelScale = 1 + (owned.level - 1) * 0.082;
      const buildingScale = side === "ally" ? 1 + (state.buildings.academy - 1) * 0.025 : 1;
      return {
        key: `${side}-${owned.instanceId}`,
        index,
        side,
        instanceId: owned.instanceId,
        cardId: owned.cardId,
        name: base.name,
        grade: base.grade,
        faction: base.faction,
        element: base.element,
        role: base.role,
        glyph: base.glyph,
        skill: base.skill,
        hpMax: Math.round(base.stats.hp * gradePower * levelScale * buildingScale),
        hp: Math.round(base.stats.hp * gradePower * levelScale * buildingScale),
        atk: Math.round(base.stats.atk * gradePower * levelScale * buildingScale),
        def: Math.round(base.stats.def * gradePower * levelScale * buildingScale),
        spd: Math.round(base.stats.spd * (1 + (owned.level - 1) * 0.025)),
        shield: 0,
        charge: index % 2,
        alive: true
      };
    });
}

export function computePower(state) {
  return buildUnits(state).reduce((sum, unit) => {
    return sum + unit.hpMax * 0.42 + unit.atk * 9.4 + unit.def * 5.5 + unit.spd * 6;
  }, 0).toFixed(0);
}

function resonanceBonus(units) {
  const factions = new Map();
  const elements = new Map();
  for (const unit of units) {
    factions.set(unit.faction, (factions.get(unit.faction) || 0) + 1);
    elements.set(unit.element, (elements.get(unit.element) || 0) + 1);
  }
  let atk = 1;
  let def = 1;
  for (const count of factions.values()) {
    if (count >= 3) atk += 0.1;
    if (count >= 2) def += 0.05;
  }
  if (elements.size >= 3) atk += 0.06;
  return { atk, def };
}

function makeEnemyUnits(stage, playerLevel = 1) {
  const enemy = stage.enemy;
  const boss = enemy.tags?.includes("boss");
  const count = boss ? 2 : 3;
  return Array.from({ length: count }, (_, index) => {
    const scale = 0.72 + index * 0.09 + playerLevel * 0.035;
    return {
      key: `enemy-${stage.id}-${index}`,
      side: "enemy",
      name: index === 0 && boss ? stage.enemyName : `${stage.enemyName} ${index + 1}`,
      grade: boss && index === 0 ? "SR" : "R",
      faction: enemy.tags?.includes("occult") ? "occult" : "civic",
      element: enemy.tags?.includes("shadow") ? "shadow" : "spark",
      role: index === 0 ? "striker" : "guard",
      glyph: boss && index === 0 ? "裂" : "影",
      skill: { name: boss && index === 0 ? "균열 파동" : "습격", type: index === 0 ? "burst" : "multi", scale: boss ? 1.25 : 0.85 },
      hpMax: Math.round(enemy.hp * scale),
      hp: Math.round(enemy.hp * scale),
      atk: Math.round(enemy.atk * scale),
      def: Math.round(enemy.def * scale),
      spd: Math.round(enemy.spd * (0.85 + index * 0.05)),
      shield: 0,
      charge: index === 0 ? 1 : 0,
      alive: true
    };
  });
}

function alive(units) {
  return units.filter((unit) => unit.alive && unit.hp > 0);
}

function pickTarget(units, random, mode = "weak") {
  const targets = alive(units);
  if (!targets.length) return null;
  if (mode === "strong") return [...targets].sort((a, b) => b.atk - a.atk)[0];
  if (mode === "random") return targets[Math.floor(random() * targets.length)];
  return [...targets].sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
}

function dealDamage(attacker, target, multiplier, bonus, random) {
  const variance = 0.88 + random() * 0.24;
  const raw = attacker.atk * multiplier * bonus.atk * variance;
  const mitigated = Math.max(1, raw - target.def * bonus.def * 0.65);
  let damage = Math.round(mitigated);
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, damage);
    target.shield -= blocked;
    damage -= blocked;
  }
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp <= 0) target.alive = false;
  return damage;
}

function healLowest(actor, allies, random, scale = 0.45) {
  const target = pickTarget(allies, random, "weak");
  if (!target) return { target: null, amount: 0 };
  const amount = Math.round((actor.atk * 2.8 + actor.hpMax * 0.12) * scale);
  target.hp = Math.min(target.hpMax, target.hp + amount);
  target.alive = true;
  return { target, amount };
}

function addShield(actor, allies, scale = 0.28) {
  const amount = Math.round((actor.atk * 2.4 + actor.def * 4) * scale);
  for (const ally of alive(allies)) ally.shield += amount;
  return amount;
}

function unitAction(actor, allies, enemies, random, log, turn, bonus) {
  if (!actor.alive) return;
  actor.charge += 1;
  const skillReady = actor.charge >= 3;
  if (skillReady) actor.charge = 0;
  const skill = actor.skill || { type: "burst", scale: 1 };
  const label = skillReady ? skill.name : "기본 공격";

  if (skillReady && skill.type === "heal") {
    const result = healLowest(actor, allies, random, skill.scale);
    log.push({ turn, side: actor.side, actor: actor.name, action: label, text: `${actor.name}의 ${label}. ${result.target?.name || "아군"} ${result.amount} 회복` });
    return;
  }

  if (skillReady && skill.type === "shield") {
    const amount = addShield(actor, allies, skill.scale);
    log.push({ turn, side: actor.side, actor: actor.name, action: label, text: `${actor.name}의 ${label}. 아군 전체 보호막 ${amount}` });
    return;
  }

  if (skillReady && skill.type === "weaken") {
    let total = 0;
    for (const target of alive(enemies)) {
      target.atk = Math.max(1, Math.round(target.atk * 0.92));
      total += dealDamage(actor, target, skill.scale * 0.5, bonus, random);
    }
    log.push({ turn, side: actor.side, actor: actor.name, action: label, text: `${actor.name}의 ${label}. 적 전체 약화, 총 ${total} 피해` });
    return;
  }

  if (skillReady && skill.type === "multi") {
    let total = 0;
    const hits = actor.grade === "SSR" ? 4 : 3;
    for (let i = 0; i < hits; i += 1) {
      const target = pickTarget(enemies, random, "random");
      if (!target) break;
      total += dealDamage(actor, target, skill.scale, bonus, random);
    }
    log.push({ turn, side: actor.side, actor: actor.name, action: label, text: `${actor.name}의 ${label}. ${hits}연격 총 ${total} 피해` });
    return;
  }

  const targetMode = skillReady && skill.type === "execute" ? "weak" : skillReady ? "strong" : "weak";
  const target = pickTarget(enemies, random, targetMode);
  if (!target) return;
  const beforeAlive = target.alive;
  const multiplier = skillReady ? skill.scale || 1.35 : 0.72;
  const damage = dealDamage(actor, target, multiplier, bonus, random);
  log.push({ turn, side: actor.side, actor: actor.name, action: label, text: `${actor.name}의 ${label}. ${target.name}에게 ${damage} 피해` });
  if (skillReady && skill.type === "execute" && beforeAlive && !target.alive && alive(enemies).length) {
    const extra = pickTarget(enemies, random, "weak");
    const extraDamage = dealDamage(actor, extra, 0.72, bonus, random);
    log.push({ turn, side: actor.side, actor: actor.name, action: "재행동", text: `${actor.name} 재행동. ${extra.name}에게 ${extraDamage} 피해` });
  }
}

export function resolveBattle({ playerState, stage, enemyState, seed = Date.now() }) {
  const random = rng(`${seed}-${stage?.id || "arena"}`);
  const allies = buildUnits(playerState, "ally");
  const enemies = enemyState ? buildUnits(enemyState, "enemy") : makeEnemyUnits(stage, playerState.profile.level);
  const allyBonus = resonanceBonus(allies);
  const enemyBonus = resonanceBonus(enemies);
  const log = [];

  for (let turn = 1; turn <= 24; turn += 1) {
    const order = [...alive(allies), ...alive(enemies)].sort((a, b) => b.spd - a.spd || random() - 0.5);
    for (const actor of order) {
      if (!alive(allies).length || !alive(enemies).length) break;
      if (actor.side === "ally") unitAction(actor, allies, enemies, random, log, turn, allyBonus);
      else unitAction(actor, enemies, allies, random, log, turn, enemyBonus);
    }
    if (!alive(allies).length || !alive(enemies).length) break;
  }

  const allyHp = alive(allies).reduce((sum, unit) => sum + unit.hp, 0);
  const enemyHp = alive(enemies).reduce((sum, unit) => sum + unit.hp, 0);
  const victory = alive(allies).length && (!alive(enemies).length || allyHp >= enemyHp);

  return {
    victory: Boolean(victory),
    allyHp,
    enemyHp,
    allies,
    enemies,
    log: log.slice(-18),
    power: {
      ally: Math.round(allies.reduce((sum, unit) => sum + unit.hpMax + unit.atk * 10 + unit.def * 5, 0)),
      enemy: Math.round(enemies.reduce((sum, unit) => sum + unit.hpMax + unit.atk * 10 + unit.def * 5, 0))
    }
  };
}
