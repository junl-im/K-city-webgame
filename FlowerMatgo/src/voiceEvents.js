// These cues describe presentation only; the rules engine remains authoritative.
const SPECIAL = Object.freeze({bomb:'bomb',sweep:'sweep',ppeok:'ppeok','ppeok-capture':'ppeok_take','self-ppeok':'ppeok_take',jjok:'jjok',ttadak:'ttadak'});
const COMBOS = Object.freeze({'청단':'cheongdan','홍단':'hongdan','초단':'chodan','고도리':'godori'});

export function goVoice(count) {
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1) return null;
  return n <= 10 ? `go${n}` : 'go_more';
}

export function turnVoices(result, actor = 'human', combos = []) {
  if (!result) return [];
  const cues = [];
  if (result.openingPpeok) cues.push('first_ppeok');
  for (const event of result.specialEvents || []) {
    if (event.kind === 'ppeok' && result.openingPpeok) continue;
    if (SPECIAL[event.kind]) cues.push(SPECIAL[event.kind]);
  }
  if (result.ppeok && !result.openingPpeok && !cues.includes('ppeok')) cues.push('ppeok');
  if (result.bonusCards?.length) cues.push('bonus');
  if (result.stolenPee?.length) cues.push(actor === 'computer' ? 'give' : 'take');
  if (result.missionCompleted) cues.push('mission');
  const transfer = result.missionTransfer;
  if (transfer?.cardIds?.length) cues.push(transfer.to === 'human' ? 'take' : 'give');
  for (const combo of combos) {
    const id = COMBOS[String(combo.label || '').trim()];
    if (id) cues.push(id);
  }
  return [...new Set(cues)];
}

export function roundVoices(game) {
  if (!game || game.phase !== 'round-ended') return [];
  if (game.roundResult === 'nagari') return ['nagari'];
  const cues = (game.settlement?.baks || []).flatMap(bak => bak.code === 'pi-bak' ? ['pibak'] : bak.code === 'gwang-bak' ? ['gwangbak'] : bak.code === 'meong-bak' ? ['meongtta'] : []);
  cues.push(game.winner === 'human' ? 'win' : 'lose');
  return cues;
}
