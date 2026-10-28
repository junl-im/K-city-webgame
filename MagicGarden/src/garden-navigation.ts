/** Basic collision footprints for the prototype. These are NOT yet pixel-matched to painted scenery. */
export type GardenZone = 'town' | 'farm' | 'lab' | 'nursery';
export type Point = { x: number; y: number };

const X_MIN = 70, X_MAX = 1210, Y_MIN = 350, Y_MAX = 742;
const STEP = 28;
const COLS = Math.floor((X_MAX - X_MIN) / STEP) + 1;
const ROWS = Math.floor((Y_MAX - Y_MIN) / STEP) + 1;

function rect(x: number, y: number, left: number, top: number, right: number, bottom: number): boolean {
  return x >= left && x <= right && y >= top && y <= bottom;
}
function ellipse(x: number, y: number, centerX: number, centerY: number, radiusX: number, radiusY: number): boolean {
  const dx = (x - centerX) / radiusX, dy = (y - centerY) / radiusY;
  return dx * dx + dy * dy <= 1;
}

/** Use the fox's ground-contact point rather than the visible top of its ears. */
export function isWalkable(zone: GardenZone, x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < X_MIN || x > X_MAX || y < Y_MIN || y > Y_MAX) return false;
  if (zone === 'town') {
    // Cottage foundation. Water, bridge, and trees need final art-aligned masks.
    if (rect(x, y, 752, 350, 1082, 413)) return false;
  } else if (zone === 'farm') {
    // Soil mounds are not walkable, but crop tap areas still receive pointer events.
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      if (ellipse(x, y, 365 + col * 208, 460 + row * 98, 64, 32)) return false;
    }
  } else if (zone === 'lab') {
    if (ellipse(x, y, 660, 485, 108, 51)) return false;
  } else if (zone === 'nursery') {
    if (ellipse(x, y, 685, 485, 108, 51)) return false;
  }
  return true;
}

/** Trace all collision cells along a walking segment (max 8 units apart). */
export function segmentIsWalkable(zone: GardenZone, a: Point, b: Point): boolean {
  const dx = b.x - a.x, dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance)) return false;
  const samples = Math.max(1, Math.ceil(distance / 6));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    if (!isWalkable(zone, a.x + dx * t, a.y + dy * t)) return false;
  }
  return true;
}

/** Find the closest safe point near a tapped decoration or planting mound. */
export function nearestWalkable(zone: GardenZone, desired: Point): Point | null {
  const clamped = {
    x: Math.max(X_MIN, Math.min(X_MAX, desired.x)),
    y: Math.max(Y_MIN, Math.min(Y_MAX, desired.y)),
  };
  if (!Number.isFinite(clamped.x) || !Number.isFinite(clamped.y)) return null;
  if (isWalkable(zone, clamped.x, clamped.y)) return clamped;
  for (let radius = 12; radius <= 200; radius += 12) {
    let best: Point | null = null, bestDist = Infinity;
    for (let j = 0; j < 32; j++) {
      const angle = Math.PI * 2 * j / 32;
      const test = { x: clamped.x + Math.cos(angle) * radius, y: clamped.y + Math.sin(angle) * radius };
      if (isWalkable(zone, test.x, test.y)) {
        const dist = Math.hypot(test.x - desired.x, test.y - desired.y);
        if (dist < bestDist) { best = test; bestDist = dist; }
      }
    }
    if (best) return best;
  }
  return null;
}

const pointFromIndex = (index: number): Point => ({
  x: X_MIN + (index % COLS) * STEP, y: Y_MIN + Math.floor(index / COLS) * STEP,
});

/** A* with eight neighbors and no corner cutting, followed by line-of-sight smoothing. */
export function planGardenRoute(zone: GardenZone, start: Point, desired: Point): Point[] {
  if (!isWalkable(zone, start.x, start.y)) return [];
  const goal = nearestWalkable(zone, desired);
  if (!goal) return [];
  if (Math.hypot(start.x - goal.x, start.y - goal.y) <= 2.5) return [];
  if (segmentIsWalkable(zone, start, goal)) return [goal];

  const total = COLS * ROWS;
  const passable = Array.from({ length: total }, (_, i) => {
    const p = pointFromIndex(i); return isWalkable(zone, p.x, p.y);
  });
  // Start and end cells must connect to their exact positions without passing through scenery.
  function closestCell(point: Point): number {
    let best = -1, bestDistance = Infinity;
    for (let i = 0; i < total; i++) {
      if (!passable[i]) continue;
      const p = pointFromIndex(i);
      const distance = Math.hypot(p.x - point.x, p.y - point.y);
      if (distance < bestDistance && segmentIsWalkable(zone, point, p)) {
        best = i; bestDistance = distance;
      }
    }
    return best;
  }
  const startId = closestCell(start), goalId = closestCell(goal);
  if (startId < 0 || goalId < 0) return [];
  const g = Array<number>(total).fill(Infinity);
  const parent = Array<number>(total).fill(-1);
  const closed = Array<boolean>(total).fill(false);
  const open: number[] = [startId];
  g[startId] = 0;
  const heuristic = (id: number): number => {
    const a = pointFromIndex(id), b = pointFromIndex(goalId);
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  for (let iterations = 0; open.length && iterations < total; iterations++) {
    let bestOpen = 0;
    for (let i = 1; i < open.length; i++) {
      if (g[open[i]] + heuristic(open[i]) < g[open[bestOpen]] + heuristic(open[bestOpen])) bestOpen = i;
    }
    const current = open.splice(bestOpen, 1)[0];
    if (closed[current]) continue;
    if (current === goalId) break;
    closed[current] = true;
    const cx = current % COLS, cy = Math.floor(current / COLS);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const next = ny * COLS + nx;
      if (!passable[next] || closed[next]) continue;
      if (dx && dy && (!passable[cy * COLS + nx] || !passable[ny * COLS + cx])) continue;
      const tentative = g[current] + (dx && dy ? Math.SQRT2 : 1) * STEP;
      if (tentative < g[next]) {
        g[next] = tentative; parent[next] = current;
        if (!open.includes(next)) open.push(next);
      }
    }
  }
  if (startId !== goalId && parent[goalId] === -1) return [];
  const indices: number[] = [];
  for (let i = goalId; i !== -1; i = parent[i]) {
    indices.push(i);
    if (i === startId) break;
  }
  if (indices.at(-1) !== startId) return [];
  indices.reverse();
  const rough: Point[] = [start, ...indices.map(pointFromIndex), goal];
  const route: Point[] = [];
  let index = 0;
  while (index < rough.length - 1) {
    let farthest = index + 1;
    for (let j = rough.length - 1; j > index + 1; j--) {
      if (segmentIsWalkable(zone, rough[index], rough[j])) { farthest = j; break; }
    }
    if (!segmentIsWalkable(zone, rough[index], rough[farthest])) return [];
    route.push(rough[farthest]);
    index = farthest;
  }
  return route;
}

/** Validate every route edge, not just its endpoints. */
export function routeIsWalkable(zone: GardenZone, start: Point, route: readonly Point[]): boolean {
  let previous = start;
  if (!isWalkable(zone, previous.x, previous.y)) return false;
  for (const point of route) {
    if (!segmentIsWalkable(zone, previous, point)) return false;
    previous = point;
  }
  return true;
}
