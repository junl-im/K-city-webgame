/**
 * Educational falling-body model. Distances are measured downward in metres.
 * Air drag is simplified to F_d = k v |v| with fixed representative k values.
 * No drag on the Moon (modelled as vacuum).
 */
export const GRAVITY = Object.freeze({ earth: 9.81, moon: 1.62 });
export const BODIES = Object.freeze({
  ball: Object.freeze({ mass: 0.2, dragK: 0.0003 }),
  feather: Object.freeze({ mass: 0.002, dragK: 0.009 })
});

export function createBody() { return { distance: 0, velocity: 0, landedAt: null }; }
export function idealFallTime(height, gravity) {
  return Math.sqrt(2 * height / gravity);
}
export function stepBody(body, kind, dt, gravity, height, air, time) {
  if (body.landedAt !== null) return body;
  const spec = BODIES[kind];
  if (!spec) throw new Error(`Unknown falling body: ${kind}`);
  if (dt <= 0) return body;
  const drag = air ? (spec.dragK / spec.mass) * body.velocity * Math.abs(body.velocity) : 0;
  const acceleration = gravity - drag;
  const vNext = Math.max(0, body.velocity + acceleration * dt);
  const travel = Math.max(0, body.velocity * dt + 0.5 * acceleration * dt * dt);
  const remaining = height - body.distance;
  if (travel >= remaining) {
    // Interpolate landing time within this step; preserves tight simultaneous results.
    const fraction = travel > 0 ? Math.max(0, Math.min(1, remaining / travel)) : 1;
    body.landedAt = time + dt * fraction;
    body.distance = height;
    body.velocity = vNext;
  } else {
    body.distance += travel;
    body.velocity = vNext;
  }
  return body;
}

export function simulateFall({ height = 10, planet = 'earth', air = true, dt = 1 / 240 } = {}) {
  const gravity = GRAVITY[planet];
  if (!gravity) throw new Error('Unsupported planet');
  if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid height');
  const airEnabled = planet === 'earth' && air;
  const ball = createBody();
  const feather = createBody();
  let time = 0;
  while ((ball.landedAt === null || feather.landedAt === null) && time < 120) {
    stepBody(ball, 'ball', dt, gravity, height, airEnabled, time);
    stepBody(feather, 'feather', dt, gravity, height, airEnabled, time);
    time += dt;
  }
  return { ball: ball.landedAt, feather: feather.landedAt, air: airEnabled, gravity };
}
