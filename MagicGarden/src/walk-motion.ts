export type WalkHeading = 'left' | 'right' | 'up' | 'down';
export type HorizontalFacing = -1 | 1;

/** Keep the current axis around 45° until the competing axis is 30% stronger. */
export function resolveWalkHeading(dx: number, dy: number, previous: WalkHeading): WalkHeading {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return previous;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.hypot(dx, dy) < 0.15) return previous;
  const horizontal = previous === 'left' || previous === 'right';
  if (horizontal) {
    if (ay > ax * 1.3) return dy < 0 ? 'up' : 'down';
    if (ax >= ay * 0.65) return dx < 0 ? 'left' : 'right';
    return previous;
  }
  if (ax > ay * 1.3) return dx < 0 ? 'left' : 'right';
  if (ay >= ax * 0.65) return dy < 0 ? 'up' : 'down';
  return previous;
}

/** Legacy one-illustration fallback only. Never mirror dedicated four-view art. */
export function resolveHorizontalFacing(dx: number, heading: WalkHeading, previous: HorizontalFacing): HorizontalFacing {
  if (!Number.isFinite(dx) || heading === 'up' || heading === 'down' || Math.abs(dx) < 0.15) return previous;
  return dx < 0 ? -1 : 1;
}
