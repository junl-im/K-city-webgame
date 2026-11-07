// One short clip at a time; stale callouts are discarded as the game advances.
export function createVoicePlayer({getEnabled,getVolume,AudioClass = globalThis.Audio,now = () => Date.now()}) {
  let unlocked = false, audio = null, active = false, queue = [], last = new Map(), generation = 0;
  const clear = () => { generation++; queue = []; if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); } active = false; };
  function next() {
    if (active || !unlocked || !getEnabled() || !AudioClass) return;
    while (queue.length && now() - queue[0].time > 8000) queue.shift();
    const item = queue.shift();
    if (!item) return;
    audio ||= new AudioClass();
    const current = ++generation;
    audio.onended = audio.onerror = () => { if (current !== generation) return; active = false; next(); };
    audio.volume = Math.max(0,Math.min(1,Number(getVolume()) || 0));
    audio.src = `${import.meta.env.BASE_URL}assets/rani-voice/${item.id}.mp3`;
    active = true;
    try { Promise.resolve(audio.play()).catch(() => { if (current === generation) { active = false; queue = []; } }); }
    catch { if (current === generation) { active = false; queue = []; } }
  }
  return {
    unlock() { unlocked = true; },
    enqueue(ids, {urgent = false, force = false} = {}) {
      if (!unlocked || !getEnabled()) return;
      if (urgent && (active || queue.length)) return;
      for (const id of ids.filter(Boolean)) {
        const t = now();
        if (!force && last.has(id) && t - last.get(id) < 1800) continue;
        last.set(id,t); queue.push({id,time:t});
      }
      queue = queue.slice(-8); next();
    },
    volumeChanged() { if (audio) audio.volume = Math.max(0,Math.min(1,Number(getVolume()) || 0)); },
    clear,
  };
}
