import type { ItemDefinition } from '../types';

export type InventoryFilter088 = 'all' | 'gear' | 'consumable' | 'material' | 'skillbook';
export type ShopFilter088 = 'all' | 'consumable' | 'skillbook' | 'equipment' | 'material';
export type HealthLevel088 = 'ok' | 'warn' | 'danger';

export interface InventoryFilterCount088 {
  key: InventoryFilter088;
  label: string;
  count: number;
}

export interface ShopFilterCount088 {
  key: ShopFilter088;
  label: string;
  count: number;
}

export interface ShopPurchaseDraft088 {
  itemId: string;
  name: string;
  rarity: string;
  count: number;
  unitPrice: number;
  totalPrice: number;
  canAfford: boolean;
  reason: string;
}

const inventoryFilters: InventoryFilter088[] = ['all', 'gear', 'consumable', 'material', 'skillbook'];
const shopFilters: ShopFilter088[] = ['all', 'consumable', 'skillbook', 'equipment', 'material'];

export function normalizeInventoryFilter088(value: string | undefined | null): InventoryFilter088 {
  return inventoryFilters.includes(value as InventoryFilter088) ? value as InventoryFilter088 : 'all';
}

export function normalizeShopFilter088(value: string | undefined | null): ShopFilter088 {
  return shopFilters.includes(value as ShopFilter088) ? value as ShopFilter088 : 'all';
}

export function inventoryFilterForItem088(type: ItemDefinition['type']): InventoryFilter088 {
  if (type === 'weapon' || type === 'armor' || type === 'relic') return 'gear';
  if (type === 'consumable') return 'consumable';
  if (type === 'material') return 'material';
  if (type === 'skillbook') return 'skillbook';
  return 'all';
}

export function shopFilterForItem088(type: ItemDefinition['type']): ShopFilter088 {
  if (type === 'consumable') return 'consumable';
  if (type === 'skillbook') return 'skillbook';
  if (type === 'weapon' || type === 'armor' || type === 'relic') return 'equipment';
  if (type === 'material') return 'material';
  return 'all';
}

export function renderInventoryFilterRail088(counts: InventoryFilterCount088[], active: InventoryFilter088) {
  return `
    <nav class="inventory-filter-rail-088" aria-label="가방 필터">
      ${counts.map((entry) => `<button class="${entry.key === active ? 'active' : ''}" data-inventory-filter-088="${entry.key}" type="button" aria-pressed="${entry.key === active ? 'true' : 'false'}"><b>${escapeHtml088(entry.label)}</b><em>${entry.count}</em></button>`).join('')}
    </nav>
  `;
}

export function renderShopFilterRail088(counts: ShopFilterCount088[], active: ShopFilter088) {
  return `
    <nav class="shop-filter-rail-088" aria-label="상점 필터">
      ${counts.map((entry) => `<button class="${entry.key === active ? 'active' : ''}" data-shop-filter-088="${entry.key}" type="button" aria-pressed="${entry.key === active ? 'true' : 'false'}"><b>${escapeHtml088(entry.label)}</b><em>${entry.count}</em></button>`).join('')}
    </nav>
  `;
}

export function renderShopPurchaseConfirm088(draft: ShopPurchaseDraft088 | null, goldText: string) {
  if (!draft) return '';
  return `
    <section class="shop-confirm-088 ${draft.canAfford ? 'ready' : 'blocked'}" aria-label="구매 확인">
      <div>
        <span class="panel-kicker">PURCHASE CHECK</span>
        <h3>${escapeHtml088(draft.name)} ${draft.count > 1 ? `x${draft.count}` : ''}</h3>
        <p>단가 ${formatGoldLike088(draft.unitPrice)} · 합계 ${formatGoldLike088(draft.totalPrice)} · 보유 ${escapeHtml088(goldText)}</p>
        <em>${escapeHtml088(draft.reason)}</em>
      </div>
      <div class="shop-confirm-actions-088">
        <button data-shop-confirm-088="cancel" type="button">취소</button>
        <button class="primary" ${draft.canAfford ? '' : 'disabled'} data-shop-confirm-088="confirm" type="button">구매 확정</button>
      </div>
    </section>
  `;
}

export function summarizeRenderBudget088(params: { domNodes: number; imageNodes: number; visiblePanels: number; issueCount: number }): { value: string; level: HealthLevel088; hint: string } {
  const level: HealthLevel088 = params.domNodes > 1800 || params.imageNodes > 180 || params.visiblePanels > 4 || params.issueCount > 4 ? 'warn' : 'ok';
  return {
    value: `${params.domNodes} nodes · IMG ${params.imageNodes}`,
    level,
    hint: `표시 패널 ${params.visiblePanels}개 · 세션 이슈 ${params.issueCount}개`
  };
}

function formatGoldLike088(value: number) {
  return `${Math.max(0, Math.floor(value)).toLocaleString('ko-KR')}G`;
}

function escapeHtml088(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
