import {chooseVoiceVariant,voiceCueInfo,voicePackReady} from './voiceDirector.js';

// Preserve published clip names, so current saves and playback remain compatible.
const VOICE_FILES=Object.freeze({start:'start-v5',first_human:'first_human-v2',first_computer:'first_computer-v2',first_ppeok:'first_ppeok-v2',ppeok_take:'ppeok_take-v2',hurry:'hurry-v2',double:'double-v2',mission:'mission-v2',win:'win-v2',take:'take-v2',give:'give-v2',bonus_reveal:'bonus-reveal',chodan_alert:'chodan_alert-v2',hongdan_alert:'hongdan_alert-v2',cheongdan_alert:'cheongdan_alert-v2',godori_alert:'godori_alert-v2',dealer_confirm:'dealer_confirm-v2',missed_match:'missed_match-v2',no_match:'no_match-v2'});
export function voiceAssetName(id){return VOICE_FILES[id]||id;}

// A candidate is playable only if an explicit audio-file manifest supplies it.
// The trio pack is disabled until three licensed, listening-checked voices exist.
export function createVoicePlayer({getEnabled,getVolume,getStyle=()=> 'legacy',AudioClass=globalThis.Audio,now=()=>Date.now(),random=Math.random,assetVariants={},fetchClip=globalThis.fetch}){
 let unlocked=false,audio=null,active=false,queue=[],generation=0;
 const lastCue=new Map(),lastClip=new Map(),badFiles=new Set(),cached=new Map();
 const volume=()=>Math.max(0,Math.min(1,Number(getVolume())||0));
 const style=()=>voicePackReady(getStyle())?getStyle():'legacy';
 const url=(file,pack='legacy')=>import.meta.env.BASE_URL+'assets/'+(pack==='legacy'?'rani-voice-v4':'rani-voice-trio-v1')+'/'+file+'.mp3';
 function select(id){
  const pack=style(),configured=assetVariants?.[pack]?.[id];
  const choices=configured?.filter(v=>!badFiles.has(url(v.file,pack)));
  const pick=chooseVoiceVariant(choices,lastClip.get(pack+':'+id),random);
  return pick?{url:url(pick.file,pack),file:pick.file,pack}
   :{url:url(voiceAssetName(id)),file:voiceAssetName(id),pack:'legacy'};
 }
 function clear(){
  generation++;queue=[];
  if(audio){audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}
  active=false;
 }
 function next(){
  if(active||!unlocked||!getEnabled()||!AudioClass)return;
  while(queue.length&&now()>queue[0].expiresAt)queue.shift();
  const item=queue.shift();if(!item)return;
  const src=select(item.id);
  if(badFiles.has(src.url)){next();return;}
  audio ||= new AudioClass();
  const serial=++generation;
  audio.preload='auto';
  const settle=(failed=false)=>{if(serial!==generation)return;if(failed)badFiles.add(src.url);active=false;next();};
  audio.onended=()=>settle();
  audio.onerror=()=>settle(true);
  audio.volume=volume();audio.src=src.url;active=true;lastClip.set(src.pack+':'+item.id,src.file);
  try{Promise.resolve(audio.play()).catch(e=>{if(serial!==generation)return;if(e?.name==='NotAllowedError'){unlocked=false;queue=[];active=false;}else settle(true);});}
  catch(e){if(e?.name==='NotAllowedError'){unlocked=false;queue=[];active=false;}else settle(true);}
 }
 function enqueue(ids,{urgent=false,force=false,replacePending=false}={}){
  if(!unlocked||!getEnabled()||!Array.isArray(ids)||!ids.length)return;
  if(urgent&&(active||queue.length))return; // 5-sec warning is optional
  if(replacePending)queue=[];
  const incoming=[];
  for(const id of ids.filter(Boolean)){
   const t=now();if(!force&&lastCue.has(id)&&t-lastCue.get(id)<600)continue;
   lastCue.set(id,t);const info=voiceCueInfo(id);
   incoming.push({id,priority:info.priority,expiresAt:t+(info.priority>=92?4700:2500)});
  }
  if(!incoming.length)return;
  const best=incoming.reduce((chosen,item)=>!chosen||item.priority>=chosen.priority?item:chosen,null);
  if(active){if(!queue.length||replacePending||best.priority>=queue[0].priority)queue=[best];}
  else{queue=[incoming[0]];if(incoming.length>1&&best!==incoming[0])queue.push(best);}
  next();
 }
 async function preload(ids){
  if(!unlocked||!getEnabled()||typeof fetchClip!=='function'||!Array.isArray(ids))return [];
  // Browser HTTP cache backs Audio() playback. Never fetch before a gesture.
  return Promise.all(ids.slice(0,6).map(async id=>{
   const path=select(id).url;
   if(badFiles.has(path))return false;
   if(!cached.has(path)){
    const request=Promise.resolve().then(()=>fetchClip(path,{cache:'force-cache'}))
     .then(r=>{if(!r?.ok)throw Error('HTTP audio');return r.arrayBuffer();})
     .then(()=>true).catch(()=>{cached.delete(path);return false;});
    cached.set(path,request);
   }
   return cached.get(path);
  }));
 }
 return{unlock(){unlocked=true;},enqueue,preload,clear,volumeChanged(){if(audio)audio.volume=volume();},
  status(){return{unlocked,active,waiting:queue.length,failed:badFiles.size,preloaded:cached.size,style:style()};}};
}
