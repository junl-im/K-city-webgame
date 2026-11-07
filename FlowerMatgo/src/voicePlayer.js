// Version only revised clips so old browser caches cannot hide an audio fix.
const VOICE_FILES = Object.freeze({start:'start-v5',first_human:'first_human-v2',first_computer:'first_computer-v2',first_ppeok:'first_ppeok-v2',ppeok_take:'ppeok_take-v2',hurry:'hurry-v2',double:'double-v2',mission:'mission-v2',win:'win-v2',take:'take-v2',give:'give-v2',bonus_reveal:'bonus-reveal',chodan_alert:'chodan_alert-v2',hongdan_alert:'hongdan_alert-v2',cheongdan_alert:'cheongdan_alert-v2',godori_alert:'godori_alert-v2',dealer_confirm:'dealer_confirm-v2',missed_match:'missed_match-v2',no_match:'no_match-v2'});
export function voiceAssetName(id) { return VOICE_FILES[id] || id; }

// One short clip at a time; stale callouts are discarded as the game advances.
export function createVoicePlayer({getEnabled,getVolume,AudioClass = globalThis.Audio,now = () => Date.now()}) {
  let unlocked = false, audio = null, active = false, queue = [], last = new Map(), generation = 0;
  const clear = () => { generation++; queue = []; if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); } active = false; };
  function next() {
    if (active || !unlocked || !getEnabled() || !AudioClass) return;
    while (queue.length && now() > queue[0].expiresAt) queue.shift();
    const item = queue.shift();
    if (!item) return;
    audio ||= new AudioClass();
    const current = ++generation;
    audio.onended = audio.onerror = () => { if (current !== generation) return; active = false; next(); };
    audio.volume = Math.max(0,Math.min(1,Number(getVolume()) || 0));
    const filename = voiceAssetName(item.id);
    audio.src = `${import.meta.env.BASE_URL}assets/rani-voice-v4/${filename}.mp3`;
    active = true;
    try { Promise.resolve(audio.play()).catch(() => { if (current === generation) { active = false; queue = []; } }); }
    catch { if (current === generation) { active = false; queue = []; } }
  }
  return {
    unlock() { unlocked = true; },
    enqueue(ids, {urgent = false, force = false, replacePending = false} = {}) {
      if (!unlocked || !getEnabled()) return;
      if (urgent && (active || queue.length)) return;
      if (replacePending) queue = [];
      const incoming=[];
      for (const id of ids.filter(Boolean)) {
        const t = now();
        if (!force && last.has(id) && t - last.get(id) < 600) continue;
        last.set(id,t); incoming.push({id,expiresAt:t + 2500});
      }
      if (!incoming.length) return;
      // Keep the line already speaking and only the newest waiting line.
      if (active) queue=[incoming.at(-1)];
      else queue=incoming.length>1?[incoming[0],incoming.at(-1)]:incoming;
      next();
    },
    volumeChanged() { if (audio) audio.volume = Math.max(0,Math.min(1,Number(getVolume()) || 0)); },
    clear,
  };
}
