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
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  return Math.floor(value).toLocaleString('ko-KR');
};
