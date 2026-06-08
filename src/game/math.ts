export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const lerp = (from: number, to: number, alpha: number) => from + (to - from) * alpha;

export const distance = (ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalize = (x: number, y: number) => {
  const len = Math.sqrt(x * x + y * y);
  if (!len) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
};

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const roll = (chance: number) => Math.random() < chance;

export const formatNumber = (value: number) => {
  const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  if (safe >= 100000000) {
    const amount = safe / 100000000;
    return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)}억`;
  }
  if (safe >= 10000) {
    const amount = safe / 10000;
    return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)}만`;
  }
  if (safe >= 1000) {
    const amount = safe / 1000;
    return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)}천`;
  }
  return safe.toLocaleString('ko-KR');
};

export const formatGold = (value: number) => `${formatNumber(value)}골드`;
export const formatSoul = (value: number) => `${formatNumber(value)}소울`;

