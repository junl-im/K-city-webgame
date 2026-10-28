/** Small, reproducible classroom models. Decorative motion lives in app.js. */
const ensure = (name, value, min, max) => {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} out of range`);
  return value;
};

export function inertiaReading(speed, braking = 'gentle') {
  ensure('speed', speed, 1, 5);
  if (!['gentle', 'sudden'].includes(braking)) throw new RangeError('braking out of range');
  const deceleration = braking === 'gentle' ? 1.5 : 4.5;
  return {
    deceleration,
    stopTimeSeconds: speed / deceleration,
    stopDistanceMeters: speed * speed / (2 * deceleration),
    message: braking === 'gentle' ? '천천히 멈추면 이동 거리가 길어요!' : '갑자기 멈추면 몸이 앞으로 쏠려요!'
  };
}

export function frictionReading(surface = 'rough', slopeDegrees = 25) {
  if (!['rough', 'ice'].includes(surface)) throw new RangeError('surface out of range');
  ensure('slopeDegrees', slopeDegrees, 10, 40);
  const mu = surface === 'rough' ? 0.65 : 0.05;
  const theta = slopeDegrees * Math.PI / 180;
  const acceleration = Math.max(0, 9.81 * (Math.sin(theta) - mu * Math.cos(theta)));
  return { coefficient: mu, accelerationMetersPerSecondSquared: acceleration, sliding: acceleration > 0.001,
    message: acceleration > 0.001 ? '쓱~ 경사면을 미끄러져요!' : '마찰이 버텨 아직 안 움직여요!' };
}

export function buoyancyReading(object = 'duck', salinity = 0) {
  if (!['duck', 'stone'].includes(object)) throw new RangeError('object out of range');
  ensure('salinity', salinity, 0, 30);
  const waterDensity = 1000 + salinity * 0.75;
  const objectDensity = object === 'duck' ? 650 : 2600;
  const floats = objectDensity <= waterDensity;
  return {
    waterDensity, objectDensity, floats,
    submergedFraction: floats ? objectDensity / waterDensity : 1,
    message: floats ? '오리가 둥실둥실 떠 있어요!' : '돌은 가라앉지만 위로 미는 부력도 받아요!'
  };
}

export function pendulumReading(lengthMeters = 1, planet = 'earth', angleDegrees = 10) {
  ensure('lengthMeters', lengthMeters, .4, 1.6);
  ensure('angleDegrees', angleDegrees, 5, 20);
  if (!['earth', 'moon'].includes(planet)) throw new RangeError('planet out of range');
  const gravity = planet === 'earth' ? 9.81 : 1.62;
  return { gravity, periodSeconds: 2 * Math.PI * Math.sqrt(lengthMeters / gravity), amplitudeDegrees: angleDegrees };
}

export function heatReading(waterTempC = 40, iceMassG = 40, waterMassG = 200) {
  ensure('waterTempC', waterTempC, 10, 70);
  ensure('iceMassG', iceMassG, 15, 70);
  if (![200, 400].includes(waterMassG)) throw new RangeError('waterMassG out of range');
  // Perfectly insulated cup; ice starts at 0°C, ordinary liquid water approximation.
  const availableJoules = waterMassG * 4.18 * waterTempC;
  const requiredJoules = iceMassG * 334;
  const meltedFraction = Math.min(1, availableJoules / requiredJoules);
  const finalTempC = availableJoules < requiredJoules ? 0 : (availableJoules - requiredJoules) / (4.18 * (waterMassG + iceMassG));
  return { meltedFraction, finalTempC, allMelted: meltedFraction >= 1, waterMassG,
    message: meltedFraction >= 1 ? '얼음이 모두 녹았어요!' : '열이 부족해서 얼음이 조금 남아요!' };
}
