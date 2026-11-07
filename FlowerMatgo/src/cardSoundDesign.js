// Short locally synthesized sounds. No sampled assets, external downloads or
// voice clips; the profile follows what the player can actually see.
export const CARD_SOUND_PROFILES = Object.freeze({
  land: Object.freeze({ duration: .09, frequency: 1220, noiseGain: .13, bass: 165 }),
  pair: Object.freeze({ duration: .12, frequency: 1940, noiseGain: .17, bass: 225 }),
  jjok: Object.freeze({ duration: .11, frequency: 2120, noiseGain: .14, bass: 245 }),
  ttadak: Object.freeze({ duration: .16, frequency: 2050, noiseGain: .19, bass: 260 }),
  flip: Object.freeze({ duration: .065, frequency: 2650, noiseGain: .09, bass: 310 }),
  capture: Object.freeze({ duration: .11, frequency: 1750, noiseGain: .17, bass: 240 }),
  bright: Object.freeze({ duration: .12, frequency: 3200, noiseGain: .13, bass: 340 }),
  double: Object.freeze({ duration: .12, frequency: 2200, noiseGain: .16, bass: 260 }),
  bomb: Object.freeze({ duration: .18, frequency: 950, noiseGain: .23, bass: 125 }),
  ppeok: Object.freeze({ duration: .13, frequency: 730, noiseGain: .17, bass: 118 }),
  sweep: Object.freeze({ duration: .17, frequency: 2350, noiseGain: .18, bass: 210 }),
  special: Object.freeze({ duration: .15, frequency: 1450, noiseGain: .21, bass: 180 })
});

export function cardSoundProfile(kind) {
  return CARD_SOUND_PROFILES[kind] ?? CARD_SOUND_PROFILES.land;
}

// Extra tonal accents add impact without replacing the card's natural snap.
const IMPACT_ACCENTS = Object.freeze({
  pair: [[0, 760, 350, .045, .085]],
  jjok: [[0, 1040, 520, .045, .085]],
  ttadak: [[0, 800, 380, .04, .075], [.085, 960, 440, .04, .075]],
  bomb: [[0, 180, 55, .075, .20], [.055, 130, 48, .045, .15]],
  sweep: [[0, 620, 920, .035, .12], [.075, 850, 1180, .03, .12]]
});
export function impactAccents(kind) { return IMPACT_ACCENTS[kind] ?? []; }

// Short original note patterns complement card impacts without external samples.
export const GAME_CUE_NOTES = Object.freeze({
  start: Object.freeze([392,494,587]),
  go: Object.freeze([494,659]),
  stop: Object.freeze([523,392]),
  mission: Object.freeze([523,659,784]),
  bonus: Object.freeze([660,880]),
  hurry: Object.freeze([440,440]),
  win: Object.freeze([523,659,784,1047]),
  lose: Object.freeze([440,349,294]),
  nagari: Object.freeze([392,349,392]),
  double: Object.freeze([392,523,659,784]),
});
