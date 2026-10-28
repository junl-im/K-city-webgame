// Simple resistive-lamp teaching model. A real filament is non-ohmic as it heats.
export function circuitReadings(voltage, resistance, closed) {
  if (!Number.isFinite(voltage) || voltage < 0 || !Number.isFinite(resistance) || resistance <= 0 || typeof closed !== 'boolean') {
    throw new RangeError('Invalid circuit parameters');
  }
  const current = closed ? voltage / resistance : 0;
  const power = closed ? voltage * current : 0;
  // Perceptual brightness for a teaching animation; NOT physical lamp photometry.
  const brightness = closed ? Math.min(1, Math.sqrt(power / 27)) : 0;
  return { closed, voltage, resistance, current, power, brightness };
}
