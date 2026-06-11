import type { CharacterClassId } from '../types';

export interface PreloadCandidate089 {
  url: string;
  group: 'ui' | 'skill' | 'item' | 'field';
  priority: number;
}

export interface PreloadSummary089 {
  count: number;
  groups: string;
  label: string;
}

const classSkills089: Record<CharacterClassId, string[]> = {
  warrior: ['warrior-basic', 'warrior-guard', 'warrior-cleave'],
  taoist: ['taoist-basic', 'taoist-orb', 'taoist-rain'],
  cleric: ['cleric-basic', 'cleric-shield', 'cleric-nova']
};

export function buildPreloadPlan089(params: { classId?: CharacterClassId; activeTownContent?: string; fieldActive?: boolean }): PreloadCandidate089[] {
  const plan: PreloadCandidate089[] = [
    { url: '/assets/ui/fantasy/backgrounds/title-keyart-081.webp', group: 'ui', priority: 100 },
    { url: '/assets/ui/fantasy/backgrounds/lobby-mood-blur-081.webp', group: 'ui', priority: 95 },
    { url: '/assets/ui/fantasy/backgrounds/ui-kit-mood-blur-081.webp', group: 'ui', priority: 90 },
    { url: '/assets/ui/fantasy/frames/quest-panel-reference-081.webp', group: 'ui', priority: 72 },
    { url: '/assets/ui/fantasy/icons/menu-icons-reference-081.webp', group: 'ui', priority: 68 }
  ];

  if (params.classId) {
    for (const skillId of classSkills089[params.classId] || []) {
      plan.push({ url: `/assets/soulpack/skills/${skillId}.webp`, group: 'skill', priority: params.activeTownContent === 'skills' ? 98 : 66 });
    }
  }

  if (params.activeTownContent === 'inventory' || params.activeTownContent === 'shop') {
    plan.push(
      { url: '/assets/soulpack/items/hp-potion-small.webp', group: 'item', priority: 62 },
      { url: '/assets/soulpack/items/mp-potion-small.webp', group: 'item', priority: 61 },
      { url: '/assets/soulpack/items/soul-shard.webp', group: 'item', priority: 60 },
      { url: '/assets/soulpack/items/enhance-stone.webp', group: 'item', priority: 59 }
    );
  }

  if (params.fieldActive) {
    plan.push(
      { url: '/assets/soulpack/map/tile-grass.webp', group: 'field', priority: 64 },
      { url: '/assets/soulpack/map/prop-tree.webp', group: 'field', priority: 58 }
    );
  }

  const unique = new Map<string, PreloadCandidate089>();
  for (const entry of plan) {
    const found = unique.get(entry.url);
    if (!found || entry.priority > found.priority) unique.set(entry.url, entry);
  }
  return Array.from(unique.values()).sort((a, b) => b.priority - a.priority);
}

export function summarizePreloadPlan089(plan: PreloadCandidate089[]): PreloadSummary089 {
  const groups = Array.from(new Set(plan.map((entry) => entry.group))).join('/');
  return {
    count: plan.length,
    groups: groups || 'none',
    label: plan.length ? `${plan.length}개 · ${groups}` : '예열 대상 없음'
  };
}

export async function preloadAssetPlan089(plan: PreloadCandidate089[], limit = 9): Promise<PreloadSummary089> {
  const chosen = plan.slice(0, Math.max(1, limit));
  await Promise.allSettled(chosen.map((entry) => warmImage089(entry.url)));
  return summarizePreloadPlan089(chosen);
}

function warmImage089(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.decoding = 'async';
    image.loading = 'eager';
    image.src = url;
  });
}
