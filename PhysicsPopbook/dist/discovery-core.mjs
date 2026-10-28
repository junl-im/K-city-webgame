// Small, deliberately transparent educational models for the playful chapters.
export function magnetReading(material = 'iron', distanceCm = 2, strength = 3) {
  if (!['iron', 'wood'].includes(material)) throw new RangeError('unknown material');
  if (!Number.isFinite(distanceCm) || distanceCm < 1 || distanceCm > 5) throw new RangeError('distance must be 1..5 cm');
  if (!Number.isFinite(strength) || strength < 1 || strength > 5) throw new RangeError('strength must be 1..5');
  // Relative animation scale only, not a magnetic force law or measured field.
  const attraction = material === 'iron';
  const visualPull = attraction ? Math.min(1, strength / (distanceCm * 2.5)) : 0;
  return { attraction, visualPull, message: attraction ? '철구가 자석에 끌려가요!' : '나무 구슬은 이렇게 끌려오지 않아요.' };
}

export function soundReading(frequencyHz = 340, volumeLevel = 3) {
  if (!Number.isFinite(frequencyHz) || frequencyHz < 170 || frequencyHz > 680) throw new RangeError('frequency must be 170..680 Hz');
  if (!Number.isFinite(volumeLevel) || volumeLevel < 1 || volumeLevel > 5) throw new RangeError('level must be 1..5');
  // Approximate wavelength of sound in air at room temperature.
  return { frequencyHz, wavelengthMeters: 340 / frequencyHz, visualAmplitude: volumeLevel / 5 };
}
