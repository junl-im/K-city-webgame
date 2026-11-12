// Original v3 effects supplied with the project. Missing or undecoded samples
// fall back to the existing synthesized effects; gameplay never waits for audio.
export const CARD_SAMPLES = Object.freeze({shuffle:'card_shuffle',land:'card_tap',pair:'double_tap',jjok:'card_tap',ttadak:'double_tap',flip:'card_flip',capture:'card_collect',bomb:'bomb',ppeok:'ppeok',sweep:'sweep'});
export const CUE_SAMPLES = Object.freeze({start:'round_start',go:'go_stamp',stop:'stop_confirm',mission:'reward',bonus:'reward',hurry:'clock_fast',win:'victory',lose:'defeat',nagari:'nagari'});
const IMPORTANT_SOUNDS = new Set(['bomb','ppeok','sweep','go_stamp','stop_confirm','reward','victory','defeat','nagari']);

export function createSampleSounds({getContext, getVolume, fetchFile = globalThis.fetch, baseUrl = import.meta.env.BASE_URL, now = () => Date.now()}) {
  const cache = new Map(), failedUntil = new Map(), playing = new Map();
  const volume = () => Math.max(0,Math.min(1,Number(getVolume()) || 0)) * .45;
  function load(name) {
    if ((failedUntil.get(name) || 0) > now()) return null;
    if (!cache.has(name)) {
      const pending = Promise.resolve().then(() => fetchFile(`${baseUrl}assets/rani-sfx-v3/${name}.wav`))
        .then(response => { if (!response.ok) throw new Error('Sound unavailable'); return response.arrayBuffer(); })
        .then(data => getContext().decodeAudioData(data))
        .catch(() => { cache.delete(name); failedUntil.set(name, now() + 5000); return null; });
      cache.set(name, pending);
      pending.then(buffer => { if (buffer) cache.set(name, buffer); });
    }
    return cache.get(name);
  }
  return {
    preload() { for (const name of new Set([...Object.values(CARD_SAMPLES), ...Object.values(CUE_SAMPLES)])) load(name); },
    play(name) {
      if (!name) return false;
      const buffer = load(name);
      if (!buffer || typeof buffer.then === 'function') return false;
      let source;
      try {
        const context = getContext();
        if (context.state !== 'running') return false;
        const priority = IMPORTANT_SOUNDS.has(name) ? 2 : 1;
        if (playing.size >= 4) {
          // Keep decisive sounds audible without allowing unbounded overlap.
          const victim = [...playing].find(([,entry]) => entry.priority < priority);
          if (!victim) return true;
          playing.delete(victim[0]);
          try { victim[0].stop(); } catch {}
        }
        source = context.createBufferSource(); const gain = context.createGain();
        source.buffer = buffer; gain.gain.value = volume();
        source.connect(gain); gain.connect(context.destination);
        source.onended = () => { playing.delete(source); source.disconnect(); gain.disconnect(); };
        playing.set(source, {gain,priority}); source.start(); return true;
      } catch { if (source) playing.delete(source); return false; }
    },
    volumeChanged() { for (const {gain} of playing.values()) gain.gain.value = volume(); },
    stop() { for (const source of playing.keys()) { try { source.stop(); } catch {} } playing.clear(); }
  };
}
