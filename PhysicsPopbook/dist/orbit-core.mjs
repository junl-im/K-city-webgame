/**
 * A deliberately simplified circular-orbit visualisation around the Sun.
 * Distances are in astronomical units (AU); time is in Earth years.
 * Kepler's third law in Sun-centred units: T² = r³.
 * Not a full N-body gravity simulation and not to scale.
 */
export function orbitalPeriodYears(radiusAu) {
  if (!Number.isFinite(radiusAu) || radiusAu <= 0) throw new Error('Invalid orbit radius');
  return Math.sqrt(radiusAu ** 3);
}

export function orbitalAngle(years, radiusAu) {
  return (Math.PI * 2 * years) / orbitalPeriodYears(radiusAu);
}

export function orbitalPosition(years, radiusAu) {
  const angle = orbitalAngle(years, radiusAu);
  return { x: radiusAu * Math.cos(angle), z: radiusAu * Math.sin(angle) };
}
