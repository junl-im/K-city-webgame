// Generated from the REVIEW-ONLY v43 script plan. Contains filenames, not audio.
// Production VOICE_PACKS.trio.ready remains false until listening & rights approval.
import plan from '../scripts/voice_trio_v43.json';

const ids=[...new Set(plan.entries.map(entry=>entry.id))];
export const TRIO_VOICE_CANDIDATES=Object.freeze({
 trio:Object.freeze(Object.fromEntries(ids.map(id=>[
   id,Object.freeze(plan.entries.filter(entry=>entry.id===id).map(entry=>
     Object.freeze({file:entry.role+'__'+entry.id+'__v'+String(entry.variant).padStart(2,'0'),
       weight:entry.weight})))
 ])))
});
export const TRIO_CANDIDATE_COUNT=plan.entries.length;
