// Presentation-only tiers: keep all table cards on the phone board when the
// count grows. The engine still owns the exact card list and game rules.
export function floorDensity(count) {
  const value = Math.max(0, Math.floor(Number(count) || 0));
  if (value >= 22) return 'full';
  if (value >= 17) return 'dense';
  if (value >= 13) return 'packed';
  if (value >= 9) return 'busy';
  return 'normal';
}

// Text shown only as a brief visual cue near the capture rack.
// Existing lastAction and scores remain the accessible source of truth.
export function capturedCardNotice(count) {
  const cards = Math.max(0, Math.floor(Number(count) || 0));
  return cards ? `+${cards}장 획득` : '';
}
