// V41 recording briefs are scripts, not delivered audio. Never label unrecorded voices as ready.
export const VOICE_CAST=Object.freeze({
 main:{name:'귀엽고 발랄한 여성 메인',purpose:'족보·승리·감탄'},
 rival:{name:'능청스러운 상대',purpose:'도발·실수·상대 반응'},
 host:{name:'또렷한 게임 진행자',purpose:'시작·시간·결과 안내'}
});
export const VOICE_PACKS=Object.freeze({
 f2:{label:'소리 F2 · 새 캐릭터 음성',ready:true,folder:'rani-voice-f2-v1'},
 legacy:{label:'기존 한국어 합성 음성',ready:true,folder:'rani-voice-v4'},
 trio:{label:'3인 캐릭터 음성',ready:false,folder:'rani-voice-trio-v1'}
});
export const VOICE_SCRIPTS=Object.freeze({
 start:{role:'host',lines:['자, 게임 시작!','오늘도 신나는 한 판!']},
 first_human:{role:'host',lines:['이번엔 플레이어가 선이에요!','당신부터 시작합니다!']},
 first_computer:{role:'host',lines:['이번 판은 상대가 먼저예요!','상대가 선을 잡았어요!']},
 dealer_confirm:{role:'host',lines:['선을 정했어요!','첫 패를 나눌게요!']},
 hurry:{role:'host',lines:['시간 얼마 안 남았어요!','5초 남았어요, 서둘러요!']},
 decide:{role:'host',lines:['고인가요, 스톱인가요?','선택할 시간이에요!']},
 chongtong:{role:'host',lines:['총통입니다!','총통, 선택해 주세요!']},
 go_more:{role:'host',lines:['연속 고가 계속됩니다!','대단해요, 연속 고!']},
 win:{role:'main',lines:['이겼다! 좋았어!','아싸, 내 승리!']},
 lose:{role:'rival',lines:['이번엔 내가 이겼네!','승부는 내가 가져갈게!']},
 nagari:{role:'host',lines:['이번 판은 나가리!','무승부입니다!']},
 jjok:{role:'main',lines:['쪽!','쪽, 제대로네!']},
 ttadak:{role:'main',lines:['따닥!','이야, 따닥이다!']},
 sweep:{role:'main',lines:['쓸었어!','싹쓸이 성공!']},
 bomb:{role:'main',lines:['폭탄이다!','펑, 모두 가져와!']},
 shake:{role:'main',lines:['흔들어 볼까?','흔들기!']},
 ppeok:{role:'rival',lines:['어머, 뻑이네?','아이고, 뻑!']},
 first_ppeok:{role:'rival',lines:['첫뻑부터?','시작하자마자 뻑이야?']},
 ppeok_take:{role:'main',lines:['싼 패, 가져간다!','내가 주워 갈게!']},
 missed_match:{role:'rival',lines:['어라, 먹을 패가 있었는데?','앗, 그 패 놓쳤네?']},
 no_match:{role:'rival',lines:['먹을 게 없지?','이런, 맞는 패가 없네!']},
 take:{role:'main',lines:['내놔!','고마워, 가져갈게!']},
 give:{role:'main',lines:['으악, 가져가!','아이고, 내 패 가져가네!']},
 bonus_reveal:{role:'main',lines:['보너스다!','오, 행운의 패!']},
 double:{role:'main',lines:['묻고 더블로!','한 판 더 크게!']},
 mission:{role:'main',lines:['미션 성공!','해냈어, 미션 완료!']},
 cheongdan:{role:'main',lines:['청단 완성!','파란 띠 모았다!']},
 hongdan:{role:'main',lines:['홍단 완성!','빨간 띠 다 모았다!']},
 chodan:{role:'main',lines:['초단 완성!','초단이네!']},
 godori:{role:'main',lines:['고도리 완성!','고도리야!']},
 cheongdan_alert:{role:'rival',lines:['상대 청단 조심!','청단이 위험해!']},
 hongdan_alert:{role:'rival',lines:['상대 홍단 조심!','홍단을 막아야겠어!']},
 chodan_alert:{role:'rival',lines:['초단이 위험한데?','상대 초단 조심!']},
 godori_alert:{role:'rival',lines:['고도리 조심해야지!','새 패가 모이고 있어!']},
 pibak:{role:'rival',lines:['피박이네!','아차, 피박!']},
 gwangbak:{role:'rival',lines:['광박이야!','광이 부족했네!']},
 meongtta:{role:'rival',lines:['멍따네!','아이고, 멍따!']},
 gobak:{role:'rival',lines:['고박이다!','욕심이 과했네!']},
 stop:{role:'main',lines:['스톱!','여기서 끝!']}
});
export const GO_SPOKEN=Object.freeze({1:'원고!',2:'투고!',3:'쓰리고!',4:'포고!',5:'파이브 고!',6:'식스 고!',7:'세븐 고!',8:'에잇 고!',9:'나인 고!',10:'텐 고!'});
const RESULTS=new Set(['win','lose','nagari','gobak','gwangbak','pibak','meongtta']);
const ALERTS=new Set(['hurry','decide','first_human','first_computer','dealer_confirm','chongtong']);
const SPECIAL=new Set(['cheongdan','hongdan','chodan','godori','mission','bomb','sweep','ttadak','jjok']);
export function voiceCueInfo(id){
 const go=typeof id==='string'&&/^go(\d+)$/.exec(id);
 if(go)return{id,role:'main',priority:92,lines:[GO_SPOKEN[Number(go[1])]||'고!']};
 const item=VOICE_SCRIPTS[id];
 return{id,role:item?.role||'main',priority:RESULTS.has(id)?100:ALERTS.has(id)?82:id==='stop'?92:SPECIAL.has(id)?64:50,lines:item?.lines||[]};
}
export function chooseVoiceVariant(variants,previousFile,random=Math.random){
 const valid=(Array.isArray(variants)?variants:[]).filter(v=>v&&typeof v.file==='string'&&v.file.length&&Number(v.weight??1)>0);
 if(!valid.length)return null;
 const withoutLast=valid.length>1?valid.filter(v=>v.file!==previousFile):valid;
 const pool=withoutLast.length?withoutLast:valid,total=pool.reduce((n,v)=>n+Number(v.weight??1),0);
 let draw=Math.min(.99999999,Math.max(0,Number(random())||0))*total;
 for(const candidate of pool){draw-=Number(candidate.weight??1);if(draw<0)return candidate;}
 return pool.at(-1);
}
export function voicePackReady(id){return VOICE_PACKS[id]?.ready===true;}
