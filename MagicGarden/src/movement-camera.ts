/** Pure math for movement and camera so game input stays independent from rendering. */
export type MoveResult = { x: number; y: number; traveled: number };
export type CameraTarget = { x: number; y: number; scale: number };

/** Soft approach on the last few steps, snapping only within 2.5 world units. */
export function advanceMovement(x: number, y: number, tx: number, ty: number, deltaMs: number): MoveResult {
  if (![x, y, tx, ty, deltaMs].every(Number.isFinite) || deltaMs <= 0) return { x, y, traveled: 0 };
  const dx = tx - x, dy = ty - y, distance = Math.hypot(dx, dy);
  if (distance <= 2.5) return { x: tx, y: ty, traveled: distance };
  const frames = Math.min(2.4, deltaMs / (1000 / 60));
  const easing = Math.min(1, .44 + .56 * distance / 75);
  const step = Math.min(distance, 3.5 * frames * easing);
  return { x: x + dx / distance * step, y: y + dy / distance * step, traveled: step };
}

/** No overshoot at any frame rate. A position below half a pixel is finalized. */
export function smoothFollow(current: number, target: number, deltaMs: number, halfLifeMs = 120): number {
  if (!Number.isFinite(current) || !Number.isFinite(target)) return target;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return current;
  if (Math.abs(target - current) < .5 || halfLifeMs <= 0) return target;
  return current + (target - current) * (1 - Math.pow(2, -Math.min(deltaMs, 1000) / halfLifeMs));
}

/** Reproduces the original zoom profile but clamps panning to the game world. */
export function calculateCameraTarget(
  viewWidth: number, viewHeight: number, worldWidth: number, worldHeight: number, playerX: number, playerY: number,
): CameraTarget {
  const w = Math.max(1, viewWidth), h = Math.max(1, viewHeight);
  const portrait = w / h < .85;
  const scale = portrait ? Math.max(w / 760, h / 930) : Math.min(w / worldWidth, h / worldHeight);
  const scaledWidth = worldWidth * scale, scaledHeight = worldHeight * scale;
  const desiredX = w * .52 - playerX * scale, desiredY = h * .53 - playerY * scale;
  const x = scaledWidth <= w ? (w - scaledWidth) / 2 : Math.max(w - scaledWidth, Math.min(0, desiredX));
  const y = scaledHeight <= h ? (h - scaledHeight) / 2 : Math.max(h - scaledHeight, Math.min(0, desiredY));
  return { x, y, scale };
}
