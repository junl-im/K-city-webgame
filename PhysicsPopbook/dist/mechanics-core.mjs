// Ideal mechanical advantage for a lever and two elementary pulley arrangements.
// Friction, equipment weight, elasticity, and travel time are deliberately omitted.
export function mechanicsReadings({ mode, loadNewtons, effortArmMeters = 2, pulleyType = 'fixed', liftMeters = 0.5 }) {
  if ((mode !== 'lever' && mode !== 'pulley') || !Number.isFinite(loadNewtons) || loadNewtons <= 0 ||
      !Number.isFinite(effortArmMeters) || effortArmMeters < 1 || effortArmMeters > 4 ||
      !Number.isFinite(liftMeters) || liftMeters <= 0 || !['fixed','moving'].includes(pulleyType)) {
    throw new RangeError('Invalid mechanics parameters');
  }
  const advantage = mode === 'lever' ? effortArmMeters / 1 : pulleyType === 'fixed' ? 1 : 2;
  const effortNewtons = loadNewtons / advantage;
  const inputTravelMeters = liftMeters * advantage;
  const outputWorkJoules = loadNewtons * liftMeters;
  const inputWorkJoules = effortNewtons * inputTravelMeters;
  return { mode, loadNewtons, effortArmMeters, pulleyType, liftMeters, advantage,
    effortNewtons, inputTravelMeters, outputWorkJoules, inputWorkJoules };
}
