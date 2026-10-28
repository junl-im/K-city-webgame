/**
 * Painted creek overlay coordinates measured against the game's 1280x800
 * fallback town composition, not yet calibrated pixel-perfect to the final
 * flattened background painting. Localized in one file for art QA.
 */
export type CreekPoint = { x: number; y: number; angle: number };
const STREAM = [
  { x: 6, y: 519 }, { x: 98, y: 493 }, { x: 173, y: 526 },
  { x: 251, y: 601 }, { x: 329, y: 669 }, { x: 406, y: 742 }, { x: 475, y: 788 },
] as const;
const fract = (v: number) => ((v % 1) + 1) % 1;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function curve(t: number): { x: number; y: number } {
  const u = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0)) * (STREAM.length - 1);
  const i = Math.min(STREAM.length - 2, Math.floor(u));
  const f = u - i;
  const p0 = STREAM[Math.max(0, i - 1)], p1 = STREAM[i], p2 = STREAM[i + 1], p3 = STREAM[Math.min(STREAM.length - 1, i + 2)];
  const catmull = (a: number, b: number, c: number, d: number) => b + .5 * f * (c - a + f * (2 * a - 5 * b + 4 * c - d + f * (3 * (b - c) + d - a)));
  return { x: catmull(p0.x,p1.x,p2.x,p3.x), y: catmull(p0.y,p1.y,p2.y,p3.y) };
}
export function creekSurfacePose(index: number, elapsedMs: number): CreekPoint {
  const phase = fract(index * .147 + elapsedMs / 6200);
  const p = curve(phase);
  const earlier = curve(Math.max(0, phase - .004)), later = curve(Math.min(1, phase + .004));
  const angle = Math.atan2(later.y - earlier.y, later.x - earlier.x);
  const shift = Math.sin(index * 3.1 + elapsedMs / 1200) * 6;
  return { x: p.x - Math.sin(angle) * shift, y: p.y + Math.cos(angle) * shift, angle };
}
export function creekFallPose(index: number, elapsedMs: number): CreekPoint {
  const y = 172 + fract(index * .193 + elapsedMs / 2350) * 160 - 24;
  const x = 180 + (index % 7) * 21 + Math.sin(elapsedMs / 1180 + index) * 2;
  return { x, y, angle: Math.PI / 2 + Math.sin(index * 1.8) * .025 };
}
export function creekShouldAnimate(zone: string, reducedMotion: boolean, visible: boolean): boolean {
  return zone === 'town' && !reducedMotion && visible;
}
export function creekSurfaceCount(reducedMotion: boolean): number { return reducedMotion ? 0 : 20; }
export function creekCascadeCount(reducedMotion: boolean): number { return reducedMotion ? 0 : 9; }
