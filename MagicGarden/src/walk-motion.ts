export type WalkHeading = 'left' | 'right' | 'up' | 'down';
export type HorizontalFacing = -1 | 1;

/** A single three-quarter-view illustration is reused for all travel directions. */
export function resolveWalkHeading(dx: number, dy: number, previous: WalkHeading): WalkHeading {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) <= 3) return previous;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}

/** Vertical movement keeps the last horizontal face; left/right movement mirrors one artwork. */
export function resolveHorizontalFacing(dx: number, heading: WalkHeading, previous: HorizontalFacing): HorizontalFacing {
  if (heading === 'up' || heading === 'down' || Math.abs(dx) <= 3) return previous;
  return dx < 0 ? -1 : 1;
}
