import { enhancementCost, items } from '../data/gameData';
import type { EquipmentSlot, ItemDefinition, PlayerSave } from '../types';

export type InventoryPanelOptions111 = {
  townMode?: boolean;
  activeFilter?: InventoryFilter111;
  bagLimit?: number;
};

export type InventoryFilter111 = 'all' | 'gear' | 'consumable' | 'material' | 'skillbook';

type InventoryEntry111 = {
  def: ItemDefinition;
  uid: string;
  count: number;
  equipped: boolean;
  enhanceLevel: number;
};

const FILTER_LABELS: Record<InventoryFilter111, string> = {
  all: '전체',
  gear: '장비',
  consumable: '소모품',
  material: '재료',
  skillbook: '스킬서'
};

/**
 * 모바일 세로 화면용 상용 RPG 가방 패널입니다.
 * 기존 데이터 구조(PlayerSave.inventory, equipment, enhancements)를 그대로 사용합니다.
 */
export function renderInventoryPanel111(save: PlayerSave, options: InventoryPanelOptions111 = {}) {
  const bagLimit = options.bagLimit ?? 64;
  const filter = normalizeInventoryFilter111(options.activeFilter);
  const entries = describeInventory111(save);
  const visibleEntries = entries.filter((entry) => filter === 'all' || categoryForItem111(entry.def) === filter);
  const counts = buildCounts111(entries);
  const usedRatio = Math.min(100, Math.round((save.inventory.length / Math.max(1, bagLimit)) * 100));
  const columns = visibleEntries.length > 16 ? 5 : 4;
  const totalSlots = Math.max(columns * 4, Math.ceil(Math.max(visibleEntries.length, 1) / columns) * columns);
  const modeClass = options.townMode ? 'town' : 'field';
  const actionPrefix = options.townMode ? 'town-' : '';

  return `
    <section class="kcity-inventory-shell-111 ${modeClass}" aria-label="K-city 네온 인벤토리">
      <div class="kcity-inventory-hero-111">
        <div>
          <span class="panel-kicker">K-CITY BAG</span>
          <h3>네온 소울 가방</h3>
          <p>장비·재료·스킬북을 모바일 4x4/5x5 격자 기준으로 정렬하고, 터치 상세/장착/강화 흐름을 유지합니다.</p>
        </div>
        <div class="kcity-bag-meter-111" aria-label="가방 사용량 ${save.inventory.length}/${bagLimit}">
          <b>${save.inventory.length}/${bagLimit}</b>
          <i><em style="width:${usedRatio}%"></em></i>
          <small>${FILTER_LABELS[filter]} ${visibleEntries.length}개</small>
        </div>
      </div>
      ${renderFilterRail111(counts, filter)}
      <div class="kcity-inventory-grid-wrap-111" style="--inventory-columns-111:${columns}">
        <div class="slot-grid inventory-slot-grid kcity-inventory-grid-111">
          ${fillInventoryCells111(save, visibleEntries, totalSlots, actionPrefix)}
        </div>
      </div>
      <div class="kcity-inventory-footer-111">
        <span>Tip</span>
        <p>장비 슬롯은 장착 상태와 강화 레벨을 우선 노출합니다. 희귀도/강화/장착순 정렬로 전투 준비 시간을 줄였습니다.</p>
      </div>
    </section>
  `;
}

export function normalizeInventoryFilter111(value: unknown): InventoryFilter111 {
  if (value === 'gear' || value === 'consumable' || value === 'material' || value === 'skillbook') return value;
  return 'all';
}

function describeInventory111(save: PlayerSave): InventoryEntry111[] {
  return save.inventory.flatMap((instance) => {
    const def = items.find((item) => item.id === instance.itemId);
    if (!def) return [];
    const slot = def.type as EquipmentSlot;
    const equipped = (def.type === 'weapon' || def.type === 'armor' || def.type === 'relic') && save.equipment?.[slot] === instance.uid;
    return [{ def, uid: instance.uid, count: instance.count, equipped, enhanceLevel: save.enhancements?.[instance.uid] || 0 }];
  }).sort((a, b) => {
    if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
    if (rarityRank111(a.def.rarity) !== rarityRank111(b.def.rarity)) return rarityRank111(b.def.rarity) - rarityRank111(a.def.rarity);
    if (a.enhanceLevel !== b.enhanceLevel) return b.enhanceLevel - a.enhanceLevel;
    if (a.def.type !== b.def.type) return categoryOrder111(a.def) - categoryOrder111(b.def);
    return a.def.name.localeCompare(b.def.name, 'ko');
  });
}

function buildCounts111(entries: InventoryEntry111[]) {
  const result: Record<InventoryFilter111, number> = { all: entries.length, gear: 0, consumable: 0, material: 0, skillbook: 0 };
  for (const entry of entries) result[categoryForItem111(entry.def)] += 1;
  return result;
}

function renderFilterRail111(counts: Record<InventoryFilter111, number>, active: InventoryFilter111) {
  const order: InventoryFilter111[] = ['all', 'gear', 'consumable', 'material', 'skillbook'];
  return `
    <nav class="kcity-inventory-filter-111" aria-label="인벤토리 필터">
      ${order.map((key) => `<button class="${active === key ? 'active' : ''}" data-inventory-filter-088="${key}" type="button" aria-pressed="${active === key ? 'true' : 'false'}"><b>${FILTER_LABELS[key]}</b><em>${counts[key]}</em></button>`).join('')}
    </nav>
  `;
}

function fillInventoryCells111(save: PlayerSave, entries: InventoryEntry111[], totalSlots: number, actionPrefix: string) {
  const cells = entries.map((entry) => renderInventoryCell111(save, entry, actionPrefix));
  while (cells.length < totalSlots) {
    cells.push('<article class="slot-cell empty-slot-cell kcity-empty-slot-111" aria-label="빈 슬롯"><span>+</span><b>EMPTY</b></article>');
  }
  return cells.join('');
}

function renderInventoryCell111(save: PlayerSave, entry: InventoryEntry111, actionPrefix: string) {
  const { def, uid, count, equipped, enhanceLevel } = entry;
  const canEquip = def.type === 'weapon' || def.type === 'armor' || def.type === 'relic';
  const canUpgrade = canUpgrade111(save, uid, def);
  const equipAttr = actionPrefix ? `data-town-equip-item="${escapeHtml(uid)}"` : `data-equip-item="${escapeHtml(uid)}"`;
  const upgradeAttr = actionPrefix ? `data-town-upgrade-item="${escapeHtml(uid)}"` : `data-upgrade-item="${escapeHtml(uid)}"`;
  const stateText = canEquip ? `${def.rarity} · +${enhanceLevel}${equipped ? ' · 장착' : ''}` : `${def.rarity} · x${count}`;
  const artUrl = itemArtUrl111(def);
  return `
    <article class="slot-cell item-slot kcity-item-slot-111 rarity-${def.rarity.toLowerCase()} ${equipped ? 'equipped' : ''} ${canUpgrade ? 'upgrade-ready-111' : ''}" data-item-detail="${escapeHtml(uid)}" tabindex="0" role="button" aria-label="${escapeHtml(def.name)} 상세 보기">
      <span class="slot-art item-art item-art-${def.type}">
        <img src="${artUrl}" alt="${escapeHtml(def.name)}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/128x128/111827/72e7ff?text=${encodeURIComponent(iconText111(def.type))}'" />
        <i>${iconText111(def.type)}</i>
      </span>
      <span class="slot-rarity">${escapeHtml(stateText)}</span>
      <b>${escapeHtml(def.name)}${canEquip && enhanceLevel ? ` +${enhanceLevel}` : ''}</b>
      <em>${typeLabel111(def.type)} · ${escapeHtml(def.effectText)}</em>
      <span class="kcity-slot-actions-111">
        ${canEquip || def.type === 'skillbook' || def.type === 'consumable' ? `<button ${equipAttr} type="button">${equipped ? '해제' : def.type === 'skillbook' ? '사용' : def.type === 'consumable' ? '사용' : '장착'}</button>` : ''}
        ${canEquip ? `<button ${upgradeAttr} ${canUpgrade ? '' : 'disabled'} type="button">강화</button>` : ''}
      </span>
    </article>
  `;
}

function canUpgrade111(save: PlayerSave, uid: string, def: ItemDefinition) {
  if (def.type !== 'weapon' && def.type !== 'armor' && def.type !== 'relic') return false;
  const level = save.enhancements?.[uid] || 0;
  if (level >= 15) return false;
  const cost = enhancementCost(level);
  const shard = countItem111(save, 'soul-shard');
  const stone = countItem111(save, 'enhance-stone');
  return save.gold >= cost.gold && shard >= cost.shard && stone >= cost.stone;
}

function countItem111(save: PlayerSave, itemId: string) {
  return save.inventory.filter((entry) => entry.itemId === itemId).reduce((sum, entry) => sum + entry.count, 0);
}

function categoryForItem111(def: ItemDefinition): InventoryFilter111 {
  if (def.type === 'weapon' || def.type === 'armor' || def.type === 'relic') return 'gear';
  if (def.type === 'consumable') return 'consumable';
  if (def.type === 'skillbook') return 'skillbook';
  return 'material';
}

function categoryOrder111(def: ItemDefinition) {
  const order: Record<InventoryFilter111, number> = { gear: 1, consumable: 2, material: 3, skillbook: 4, all: 5 };
  return order[categoryForItem111(def)] || 9;
}

function rarityRank111(rarity: ItemDefinition['rarity']) {
  const rank: Record<ItemDefinition['rarity'], number> = { N: 1, R: 2, SR: 3, SSR: 4, UR: 5 };
  return rank[rarity] || 0;
}

function typeLabel111(type: ItemDefinition['type']) {
  const labels: Record<ItemDefinition['type'], string> = {
    weapon: '무기',
    armor: '방어구',
    relic: '유물',
    material: '재료',
    skillbook: '스킬서',
    consumable: '소모품'
  };
  return labels[type];
}

function iconText111(type: ItemDefinition['type']) {
  if (type === 'weapon') return 'WPN';
  if (type === 'armor') return 'ARM';
  if (type === 'relic') return 'REL';
  if (type === 'skillbook') return 'BOOK';
  if (type === 'consumable') return 'POT';
  return 'MAT';
}

function itemArtUrl111(def: ItemDefinition) {
  return `./assets/soulpack/items/${def.id}.webp?v=111`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
}
