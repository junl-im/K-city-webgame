/* 곰같은여우와 함께하는 오늘의 60초 놀이터 · 단독 웹 시제품 v2.0
   모든 게임은 브라우저 내부에서 동작하며, 기록은 현재 기기에만 저장됩니다. */
(function () {
  'use strict';
  const $ = function (s) { return document.querySelector(s); };
  const $$ = function (s) { return Array.from(document.querySelectorAll(s)); };
  const GAMES = [
    {id:'whack',name:'몬스터 콩콩!',desc:'통통 튀는 몬스터를 잡아라! 친구는 누르지 마.',emoji:'👾',category:'reflex',color:'pink',host:'모모',zone:'솜사탕 정원'},
    {id:'number',name:'숫자 번개',desc:'1부터 16까지 차례대로 번개처럼 터치!',emoji:'🔢',category:'brain',color:'blue',host:'루루',zone:'번개 마법탑'},
    {id:'spot',name:'다른 그림 찾기',desc:'두 개의 그림에서 딱 하나 다른 친구를 찾아라.',emoji:'🔍',category:'observation',color:'yellow',host:'코코',zone:'마법 그림 갤러리'},
    {id:'stroop',name:'색깔 함정',desc:'글자 뜻에 속지 말고 실제 글자 색을 맞혀 봐.',emoji:'🎨',category:'brain',color:'violet',host:'루루',zone:'무지개 화실'},
    {id:'memory',name:'1초 기억왕',desc:'반짝 나타난 별의 자리를 외워서 맞혀!',emoji:'⭐',category:'brain',color:'mint',host:'두두',zone:'별빛 기억의 숲'},
    {id:'sort',name:'몬스터 연구소',desc:'알록달록 몬스터를 올바른 속성으로 분류!',emoji:'🧪',category:'reflex',color:'peach',host:'모모',zone:'몬스터 실험실'},
    {id:'mystery',name:'60초 미스터리',desc:'반짝이는 수수께끼를 풀고 탐정이 되어 봐.',emoji:'🗝️',category:'observation',color:'purple',host:'코코',zone:'비밀의 문'}
  ];
  // 미리보기와 플레이 중 도움말이 공유하는 7개 게임별 짧은 놀이법.
  const GAME_GUIDES = {
    whack:{steps:['9칸 중 눈이 크고 뿔 달린 몬스터만 찾아 터치!','루루·모모·코코·두두와 꽃은 건드리지 않기','몬스터를 누르면 바로 다음 판으로!'],hint:'뿔 달린 몬스터만 눌러! 네 친구와 꽃은 안전해.'},
    number:{steps:['숫자 1을 먼저 찾아 터치!','이어서 2 → 3 → 4 순서대로 누르기','16까지 성공하면 새 숫자판이 나와!'],hint:'1부터 16까지 차례대로. 이미 누른 숫자는 다시 누르지 않아.'},
    spot:{steps:['왼쪽 9칸은 비교하는 기준 그림!','오른쪽에서 딱 1칸만 다른 그림 찾기','다른 칸은 반드시 오른쪽에서 터치!'],hint:'왼쪽은 기준 그림이야. 오른쪽의 다른 칸 하나를 찾아 눌러!'},
    stroop:{steps:['문자 뜻이 아니라 글자의 실제 색을 봐!','예: 파랑이라는 글자가 빨갛다면 빨강 선택','아래 색깔 이름 버튼에서 정답 터치!'],hint:'글자의 뜻을 무시하고, 화면에 보이는 글자 색을 골라.'},
    memory:{steps:['반짝이는 ⭐ 별이 나타나는 위치를 보기','별이 보일 때 바로 누르거나 위치를 기억하기','별이 사라진 뒤에도 기억한 칸을 누를 수 있어!'],hint:'별이 보일 때 바로 누르거나, 사라진 뒤 기억한 칸을 눌러.'},
    sort:{steps:['가운데 등장한 그림을 관찰하기','불꽃·숲·유령·바다·하늘 속성 생각하기','아래 3개 속성 버튼 중 하나를 선택!'],hint:'가운데 그림이 속한 자연·마법 속성을 아래에서 골라.'},
    mystery:{steps:['코코가 내는 수수께끼를 읽기','세 가지 보기 중 가장 알맞은 답 고르기','틀리면 정답을 확인하고 다음 문제 도전!'],hint:'문장을 끝까지 읽고 3개 보기 중 가장 정확한 답을 눌러.'}
  };
  const SORT_FAMILIES = [
    {name:'불꽃',icon:'🔥',items:['🐲','🌋','☄️','🕯️']},
    {name:'숲',icon:'🌿',items:['🌵','🍄','🌳','🪴']},
    {name:'유령',icon:'👻',items:['👻','💀','🧟','🦴']},
    {name:'바다',icon:'🌊',items:['🐬','🐟','🦀','🐙']},
    {name:'하늘',icon:'☁️',items:['☁️','🌪️','🌬️','🪁']}
  ];
  const SORT_ITEM_NAMES=[['아기 용','화산','혜성','촛불'],['선인장','버섯','나무','화분'],['유령','해골','좀비','뼈'],['돌고래','물고기','게','문어'],['구름','회오리','바람','연']];
  const SPOT_ICON_SETS = [
    ['cat','rabbit','fox','bear','unicorn','frog','panda','penguin','koala','octopus','turtle','butterfly','dolphin','pig','monkey','chick'],
    ['cat','rabbit','fox','bear','frog','panda','penguin','koala','octopus','turtle','dolphin','pig','monkey','chick','tiger','wolf','hamster','dog'],
    ['cat','rabbit','fox','bear','unicorn','frog','panda','penguin','koala','octopus','turtle','butterfly','dolphin','pig','monkey','chick','tiger','wolf','hamster','dog']
  ];
  const MYSTERY_QUIZ = {
    1:[
      {q:'낮에 하늘에서 빛나며 지구를 따뜻하게 하는 것은?',a:['태양','달','별']},
      {q:'비가 온 뒤 하늘에 여러 색으로 나타나는 것은?',a:['무지개','구름','번개']},
      {q:'얼음이 녹으면 무엇이 될까?',a:['물','모래','연기']},
      {q:'1 더하기 2는?',a:['3','4','5']},
      {q:'물속에서 아가미로 숨 쉬는 동물은?',a:['물고기','고양이','토끼']},
      {q:'연필로 쓴 글씨를 지울 때 쓰는 것은?',a:['지우개','가위','자']},
      {q:'일반적으로 가장 추운 계절은?',a:['겨울','여름','봄']},
      {q:'낮의 반대말은?',a:['밤','아침','정오']},
      {q:'해가 진 뒤 하늘은 대체로 어떻게 될까?',a:['어두워진다','초록으로 변한다','햇빛이 더 밝아진다']},
      {q:'숫자 7 바로 다음에 오는 수는?',a:['8','6','10']}
    ],
    2:[
      {q:'시계의 짧은 바늘이 가리키는 것은?',a:['시','분','초']},
      {q:'나침반에서 N이 가리키는 방향은?',a:['북쪽','남쪽','서쪽']},
      {q:'보름달의 모양은 대체로?',a:['둥근 원','삼각형','네모']},
      {q:'맞는 열쇠를 넣어 열 수 있는 것은?',a:['자물쇠','우산','컵']},
      {q:'바람을 타고 하늘을 떠다니는 것은?',a:['구름','바위','신발']},
      {q:'사과 3개 중 내가 1개를 집으면 내 손엔 몇 개?',a:['1개','2개','3개']},
      {q:'바닷물이 짠 주된 까닭은?',a:['소금 성분이 녹아 있어서','설탕이 많아서','햇빛이 없어서']},
      {q:'나무의 나이테로 짐작할 수 있는 것은?',a:['나무의 나이','오늘 기온','내일 날씨']},
      {q:'지구 주위를 돌며 밤에 보이는 천체는?',a:['달','태양','무지개']},
      {q:'동전을 두 번 던지면 던진 횟수는?',a:['2번','1번','3번']}
    ],
    3:[
      {q:'아침엔 네 발, 낮엔 두 발, 저녁엔 세 발로 걷는 존재는?',a:['사람','강아지','사자']},
      {q:'손이 없는데도 박수를 치듯 소리를 내는 것은?',a:['파도','햇빛','달빛']},
      {q:'물을 주면 꺼지고 공기를 주면 더 타오르는 것은?',a:['불','꽃','나무']},
      {q:'나눌수록 더 널리 퍼질 수 있는 것은?',a:['지식','사탕','연필']},
      {q:'시간이 지나며 늘어나지만 되돌릴 수 없는 것은?',a:['나이','그림자','목소리']},
      {q:'물에 비친 내 모습은 무엇일까?',a:['비친 모습','물고기','물방울']},
      {q:'빛 아래 따라오지만 어두운 곳에선 안 보이는 것은?',a:['그림자','가방','시계']},
      {q:'거꾸로 읽어도 같은 숫자는?',a:['121','123','456']},
      {q:'10에서 3을 두 번 빼면?',a:['4','3','7']},
      {q:'모든 달에 최소한 존재하는 날짜는?',a:['28일','30일','31일']}
    ]
  };
  // 5×4 PNG/WebP 원화 아틀라스 순서. 게임판에는 운영체제별 이모지를 표시하지 않는다.
  const SPOT_ART = {
    cat:[0,'고양이'],rabbit:[1,'토끼'],fox:[2,'여우'],bear:[3,'곰'],unicorn:[4,'유니콘'],
    frog:[5,'개구리'],panda:[6,'판다'],penguin:[7,'펭귄'],koala:[8,'코알라'],octopus:[9,'문어'],
    turtle:[10,'거북이'],butterfly:[11,'나비'],dolphin:[12,'돌고래'],pig:[13,'아기 돼지'],monkey:[14,'원숭이'],
    chick:[15,'병아리'],tiger:[16,'호랑이'],wolf:[17,'늑대'],hamster:[18,'햄스터'],dog:[19,'강아지']
  };
  const gameById = function (id) { return GAMES.find(function (g) { return g.id === id; }); };
  const PETS = {
    cat:{name:'루루',emoji:'🐱',speech:'오늘은 어떤 비밀을 발견할까? 천천히 봐도 괜찮아!'},
    rabbit:{name:'모모',emoji:'🐰',speech:'나는 준비 완료! 우리 60초 동안 신나게 달려 보자!'},
    fox:{name:'코코',emoji:'🦊',speech:'헤헤, 눈앞의 정답이 꼭 정답일까? 집중해 봐!'},
    bear:{name:'두두',emoji:'🐻',speech:'실수해도 괜찮아. 다시 도전하는 게 가장 멋진 일이야!'}
  };
  const PET_ART = {cat:'lulu',rabbit:'momo',fox:'coco',bear:'dudu'};
  const HOST_ART = {'루루':'lulu','모모':'momo','코코':'coco','두두':'dudu'};
  // v1.9: 이모지 대신 촉감 있는 게임 원화를 쓰고, 접근성 이름은 별도로 유지.
  const WHACK_ART = {
    '👾':{sprite:'purple',label:'보라 몬스터'},
    '👹':{sprite:'coral',label:'산호색 몬스터'},
    '👺':{sprite:'blue',label:'파란 몬스터'},
    '🌸':{sprite:'blossom',label:'분홍 벚꽃'},
    '🍀':{sprite:'clover',label:'초록 네잎클로버'},
    '🌼':{sprite:'daisy',label:'노란 데이지꽃'},
    '🐱':{portrait:'lulu',label:'고양이 루루'},
    '🐰':{portrait:'momo',label:'토끼 모모'},
    '🦊':{portrait:'coco',label:'여우 코코'},
    '🐻':{portrait:'dudu',label:'곰 두두'}
  };
  function paintWhackCell(button,symbol){
    const art=WHACK_ART[symbol];
    if(!art){button.textContent=symbol;return;}
    button.setAttribute('aria-label',art.label);
    button.dataset.piece=art.sprite?'monster-or-flower':'friend';
    if(art.portrait){
      const img=document.createElement('img');
      img.className='whack-portrait';img.src=mascotSource(art.portrait);img.alt='';img.draggable=false;
      button.replaceChildren(img);
    }else{
      const icon=document.createElement('span');
      icon.className='whack-sprite whack-sprite-'+art.sprite;icon.setAttribute('aria-hidden','true');
      button.replaceChildren(icon);
    }
  }
  const HOST_LINES = {
    '루루':{intro:'마법의 책을 열어 볼까?',success:['마법처럼 딱 맞혔어!','눈썰미가 반짝반짝!','내 마법보다 정확한걸!'],wrong:['괜찮아, 다시 살펴보자!','실수도 좋은 힌트야!'],combo:'마법 대성공!',marks:['✦','✧','✳'],color:'#ab83dc'},
    '모모':{intro:'준비됐지? 신나게 출발!',success:['와! 정말 재빠른걸!','내 귀가 쫑긋했어!','멋진 속도야, 계속 가자!'],wrong:['괜찮아, 다시 뛰면 돼!','잠깐! 숨 고르고 다시!'],combo:'번개처럼 빠르다!',marks:['⚡','✦','⚡'],color:'#edab46'},
    '코코':{intro:'후후, 비밀을 찾아볼까?',success:['후후, 단서를 찾았네!','이 문제도 간파했구나!','역시 눈치가 빠른걸!'],wrong:['앗, 장난에 속았네!','차근차근 보면 보여!'],combo:'오늘의 명탐정!',marks:['✧','✦','✶'],color:'#d186b5'},
    '두두':{intro:'천천히 해도 괜찮아!',success:['차분하게 잘했어!','정말 든든한 친구야!','한 번 더 해볼까?'],wrong:['괜찮아, 내가 응원할게!','조금 쉬어 가도 돼!'],combo:'멋진 집중력이야!',marks:['✿','✦','✿'],color:'#8db78b'}
  };
  const mascotSource = function (name,mood) { return './assets/'+name+(mood?'-'+mood+'-v07':'')+'.webp'; };
  const PET_FAVORITES = {cat:'number',rabbit:'whack',fox:'mystery',bear:'memory'};
  const GUIDES = [
    {id:'rabbit',name:'모모의 초대장',line:'어서 와! 오늘도 신나는 60초야!'},
    {id:'cat',name:'루루의 마법 힌트',line:'두뇌가 반짝이는 게임도 준비했어!'},
    {id:'fox',name:'코코의 비밀 소식',line:'숨은 단서를 찾으면 특별한 기분이 들걸?'},
    {id:'bear',name:'두두의 따뜻한 응원',line:'실수해도 괜찮아. 자유 플레이는 무제한!'}
  ];
  const BADGES = [
    {id:'first',icon:'🌟',name:'첫 발자국'},
    {id:'daily',icon:'☀️',name:'오늘의 용사'},
    {id:'score2k',icon:'⚡',name:'번개 손'},
    {id:'score5k',icon:'👑',name:'반짝 왕관'},
    {id:'allgames',icon:'🎠',name:'놀이공원 탐험가'},
    {id:'streak3',icon:'🔥',name:'3일 연속 탐험'}
  ];
  const STORE = 'wonderland-60sec-state-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { saved = {}; }
  const state = {best:saved.best || {},plays:saved.plays || {},history:saved.history || {},badges:saved.badges || [],sound:saved.sound !== false};
  let session = null, currentPreview = null, animFrame = 0, toastTimer = null;
  let sessionHistoryCleanup = false;
  let audioCtx = null, lastSoundAt = -Infinity;
  const rand = function (n) { return Math.floor(Math.random() * n); };
  const shuffle = function (arr) { const a = arr.slice(); for (let i=a.length-1;i>0;i--){const j=rand(i+1);const t=a[i];a[i]=a[j];a[j]=t;}return a; };
  function pickDifferentIndex(size,previous){
    if(size<=1)return 0;
    const valid=Number.isInteger(previous)&&previous>=0&&previous<size;
    const candidate=rand(valid?size-1:size);
    return valid&&candidate>=previous?candidate+1:candidate;
  }
  function makeSpotPuzzle(stage,previousIndex){
    const icons=SPOT_ICON_SETS[stage-1]||SPOT_ICON_SETS[0];
    const base=shuffle(icons).slice(0,9),changed=pickDifferentIndex(9,previousIndex),right=base.slice();
    const alternatives=icons.filter(function(icon){return !base.includes(icon);});
    right[changed]=alternatives[rand(alternatives.length)];
    return {base:base,right:right,changed:changed};
  }
  function paintSpotCell(cell,icon){
    const art=SPOT_ART[icon];
    if(!art)throw new Error('Unknown spot artwork: '+icon);
    const sprite=document.createElement('span');sprite.className='spot-sprite';
    sprite.style.backgroundPosition=(art[0]%5*25)+'% '+(Math.floor(art[0]/5)*100/3)+'%';
    sprite.setAttribute('aria-hidden','true');cell.append(sprite);
    return art[1];
  }
  function drawWithoutRepeats(s,key,items){
    s.bags=s.bags||{};s.lastPick=s.lastPick||{};
    if(!s.bags[key]||!s.bags[key].length){
      const bag=shuffle(items);
      if(bag.length>1&&bag[bag.length-1]===s.lastPick[key]){
        const last=bag.length-1;[bag[0],bag[last]]=[bag[last],bag[0]];
      }
      s.bags[key]=bag;
    }
    const choice=s.bags[key].pop();s.lastPick[key]=choice;return choice;
  }
  function nextStroopPair(s,stage,colorCount){
    const candidates=[];
    for(let ink=0;ink<colorCount;ink++)for(let word=0;word<colorCount;word++){
      if(stage>1&&ink===word)continue;
      candidates.push(ink+':'+word);
    }
    const selected=drawWithoutRepeats(s,'stroop-'+stage,candidates).split(':');
    return {ink:Number(selected[0]),word:Number(selected[1])};
  }
  const padScore = function (n) {return Number(n || 0).toLocaleString('ko-KR');};
  const getKstDate = function (offset) {
    const d = new Date(Date.now() + (offset || 0) * 86400000);
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  };
  const dayKey = function () { return getKstDate(0); };
  const dailyGame = function (date) {
    const n = new Date((date||dayKey()) + 'T12:00:00+09:00').getUTCDay();
    return gameById(['mystery','spot','whack','stroop','memory','number','sort'][n]);
  };
  const hasDaily = function (date) { return !!state.history[date||dayKey()]; };
  const completedDaily = function (date) {return !!(state.history[date] && state.history[date].complete);};
  const streak = function () {
    let start = completedDaily(dayKey()) ? 0 : -1, count = 0;
    for (let i=start;i>-365;i--) { if (!completedDaily(getKstDate(i))) break; count++; }
    return count;
  };
  // Merge progress written by other tabs before changing or saving it.
  function syncStoredProgress() {
    try {
      const raw=localStorage.getItem(STORE);if(!raw)return;
      const latest=JSON.parse(raw);if(!latest||typeof latest!=='object')return;
      ['best','plays'].forEach(function(key){
        if(!latest[key]||typeof latest[key]!=='object')return;
        GAMES.forEach(function(g){const value=Number(latest[key][g.id]);if(Number.isFinite(value)&&value>=0)state[key][g.id]=Math.max(Number(state[key][g.id])||0,value);});
      });
      if(latest.history&&typeof latest.history==='object')Object.keys(latest.history).forEach(function(day){
        const incoming=latest.history[day],current=state.history[day];
        if(!incoming||typeof incoming!=='object')return;
        if(!current||(!current.complete&&incoming.complete)||(current.complete&&incoming.complete&&Number(incoming.score)>Number(current.score)))state.history[day]=incoming;
      });
      if(Array.isArray(latest.badges))latest.badges.forEach(function(b){if(!state.badges.includes(b))state.badges.push(b);});
      if(typeof latest.sound==='boolean')state.sound=latest.sound;
    } catch(e) { /* Keep in-memory progress if storage is temporarily unavailable. */ }
  }
  const save = function () { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch (e) { return false; } };
  const esc = function (s) {return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  const artIcon = function(name){return '<span class="ui-art-icon ui-icon-'+name+'" aria-hidden="true"></span>';};
  const clickHand = '<span class="click-hand" aria-hidden="true"></span>';
  const badgeArt = function(id){return artIcon(({first:'star',daily:'medal',score2k:'play',score5k:'trophy',allgames:'scroll',streak3:'leaf'})[id]||'star');};
  const SOUND_NOTES = {whack:520,number:680,spot:590,stroop:625,memory:470,sort:540,mystery:440};
  function playNote(ctx,pitch,start,length,shape,volume,finishPitch) {
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type=shape;
    oscillator.frequency.setValueAtTime(pitch,start);
    if(finishPitch)oscillator.frequency.exponentialRampToValueAtTime(finishPitch,start+length);
    gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+length);
    oscillator.connect(gain);gain.connect(ctx.destination);
    oscillator.start(start);oscillator.stop(start+length+0.025);
  }
  function sound(kind,gameId,combo) {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const moment=performance.now();
      if(kind!=='finish'&&moment-lastSoundAt<65)return;
      lastSoundAt=moment;
      audioCtx=audioCtx||new Ctx();
      if(audioCtx.state==='suspended')audioCtx.resume().catch(function(){});
      const now=audioCtx.currentTime+0.01;
      const base=SOUND_NOTES[gameId]||550;
      if(kind==='finish'){
        [1,1.25,1.5].forEach(function(step,i){playNote(audioCtx,base*step,now+i*.105,.18,'sine',.018);});
      }else if(kind==='correct'){
        playNote(audioCtx,base,now,.105,'sine',.025,base*1.16);
        if(combo>=3)playNote(audioCtx,base*1.5,now+.055,.115,'triangle',.013);
      }else{
        playNote(audioCtx,Math.max(210,base*.56),now,.145,'sine',.014,Math.max(165,base*.39));
      }
    } catch (e) {}
  }
  function toast(message) {
    const node=$('#toast');node.textContent=message;node.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){node.classList.remove('show');},2400);
  }
  function showGuide(index){
    const guide=$('#parkGuide');if(!guide)return;
    const g=GUIDES[index%GUIDES.length];
    $('#guideName').textContent=g.name;
    $('#guideLine').textContent=g.line;
    guide.dataset.guide=g.id;
    $$('.mascot').forEach(function(el){
      const active=el.dataset.mascot===g.id;
      el.classList.toggle('is-guiding',active);
      const portrait=el.querySelector('img');
      if(portrait){
        const asset=PET_ART[el.dataset.mascot];
        const next=mascotSource(asset,active?'happy':null);
        if(!portrait.src.endsWith(next.slice(1)))portrait.src=next;
      }
    });
    guide.classList.remove('guide-appear');
    void guide.offsetWidth;
    guide.classList.add('guide-appear');
  }
  function modal(html) {
    $('#modalBody').innerHTML=html;
    $('#overlay').classList.remove('hidden');
    $('#overlay').setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    $('#modal').scrollTop=0;
    $('#modal').classList.toggle('is-playing',!!session);
    $('#modalPause').classList.toggle('hidden',!session);
    $('#modalHelp').classList.toggle('hidden',!session);
    $('#modalClose').focus();
  }
  function closeModal() {
    if(session)stopSession();
    $('#overlay').classList.add('hidden');$('#overlay').setAttribute('aria-hidden','true');
    document.body.style.overflow='';currentPreview=null;refresh();
  }
  function stopSession() {
    if (!session) return;
    clearTimeout(session.roundTimeout);cancelAnimationFrame(animFrame);
    session.roundTask=null;
    if(history.state&&history.state.sixtyGameSession){
      sessionHistoryCleanup=true;history.back();
    }
    session=null;
    $('#pauseScreen').classList.add('hidden');
    $('#pauseScreen').setAttribute('aria-hidden','true');
    $('#modal').inert=false;
    $('#modal').classList.remove('is-playing','is-paused');
    $('#modalPause').classList.add('hidden');
    $('#modalHelp').classList.add('hidden');
  }
  function scheduleRoundTask(s,fn,delay) {
    clearTimeout(s.roundTimeout);
    s.roundTimeout=null;
    s.roundTask=fn;
    s.roundRemaining=Math.max(0,delay);
    if(s.pausedAt!==null)return;
    s.roundDueAt=performance.now()+s.roundRemaining;
    s.roundTimeout=setTimeout(function(){
      if(session!==s||s.pausedAt!==null)return;
      s.roundTimeout=null;s.roundTask=null;s.roundDueAt=null;
      fn();
    },s.roundRemaining);
  }
  function pauseSession(s) {
    if(!s||s.pausedAt!==null)return;
    s.pausedAt=performance.now();
    cancelAnimationFrame(animFrame);
    if(s.roundTimeout!==null){
      clearTimeout(s.roundTimeout);s.roundTimeout=null;
      s.roundRemaining=Math.max(0,s.roundDueAt-s.pausedAt);
      s.roundDueAt=null;
    }
    $('#modal').classList.add('is-paused');
  }
  function resumeSession(s) {
    if(!s||s.pausedAt===null)return;
    s.deadline+=performance.now()-s.pausedAt;
    s.pausedAt=null;
    if(s.roundTask)scheduleRoundTask(s,s.roundTask,s.roundRemaining);
    $('#modal').classList.remove('is-paused');
    tick();
  }
  function showPause(reason) {
    if(!session)return;
    pauseSession(session);
    const leaving=reason==='exit';
    const helping=reason==='help';
    const guide=GAME_GUIDES[session.game.id];
    $('#pauseTitle').textContent=leaving?'정말 놀이공원을 나갈까?':helping?session.game.name+' 놀이법':reason==='away'?'돌아왔구나! 잠깐 쉬어 가자':'잠깐 쉬어 가자!';
    $('#pauseText').textContent=leaving?(session.official?'지금 나가면 오늘의 공식 도전 1회 기회가 사라져. 기록은 저장되지 않아.':'지금 나가면 이번 자유 플레이 점수는 저장되지 않아.'):helping?guide.steps.map(function(step,i){return (i+1)+'. '+step;}).join('\n'):'게임과 타이머를 멈춰 뒀어. 준비되면 이어서 놀자!';
    $('#pauseHint').textContent=leaving?'계속하기를 누르면 멈췄던 시간부터 다시 시작해.':helping?guide.hint+'  ·  놀이법을 읽는 동안에도 시간은 멈춰 있어.':'멈춘 동안에는 60초 타이머가 줄어들지 않아.';
    $('#pauseMascot').src=mascotSource(helping?HOST_ART[session.game.host]:'dudu');
    $('#pauseExit').textContent=leaving?'그래도 나가기':'이번 판 그만하기';
    $('#pauseScreen').classList.remove('hidden');
    $('#pauseScreen').setAttribute('aria-hidden','false');
    $('#modal').inert=true;
    $('#pauseResume').focus();
  }
  function hidePause() {
    if(!session)return;
    $('#pauseScreen').classList.add('hidden');
    $('#pauseScreen').setAttribute('aria-hidden','true');
    $('#modal').inert=false;
    resumeSession(session);
    $('#modalPause').focus();
  }
  function requestClose() {
    if(session)showPause('exit');
    else closeModal();
  }
  function badgeUnlock() {
    const unlocked=[];
    const max=Math.max(0,...Object.values(state.best));
    const eligible={first:Object.values(state.plays).some(function(n){return n>0;}),
      daily:Object.values(state.history).some(function(h){return h.complete;}),
      score2k:max>=2000,score5k:max>=5000,allgames:GAMES.every(function(g){return (state.plays[g.id]||0)>0;}),
      streak3:streak()>=3};
    BADGES.forEach(function(b){if(eligible[b.id]&&!state.badges.includes(b.id)){state.badges.push(b.id);unlocked.push(b);}});
    return unlocked;
  }
  function refresh() {
    const day=dailyGame(), used=hasDaily();
    $('#dailyGameName').textContent=day.name;$('#dailyGameDesc').textContent=day.desc;
    $('#dailyEmoji').innerHTML='<img src="./assets/game-'+day.id+'.webp" alt="" width="142" height="142" decoding="async" />';
    $('#dailyCardStart').innerHTML='<span class="button-label">'+artIcon('play')+(used?'자유 연습하기':'도전하기')+'</span>'+clickHand;
    $('#dailyStatus').textContent=used?(completedDaily(dayKey())?'오늘의 기록 완료':'오늘의 시도 사용'):'아직 도전 전';
    $('#bestScore').innerHTML=padScore(Math.max(0,...Object.values(state.best)))+'<small>점</small>';
    $('#streakCount').innerHTML=streak()+'<small>일</small>';
    $('#badgeCount').innerHTML=state.badges.length+'<small>개</small>';
    $('#soundToggle').innerHTML=artIcon(state.sound?'music':'music-off');
    $('#soundToggle').setAttribute('aria-pressed',String(state.sound));
    $('#soundToggle').setAttribute('aria-label',state.sound?'효과음 켜짐 · 눌러서 끄기':'효과음 꺼짐 · 눌러서 켜기');
    const d=new Date();$('#todayLabel').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short'}).format(d);
  }
  function renderGames(filter) {
    $('#gameGrid').dataset.filter=filter;
    $('#gameGrid').innerHTML=GAMES.filter(function(g){return filter==='all'||g.category===filter;}).map(function(g){
      return '<button type="button" class="game-card" data-game="'+g.id+'" aria-label="'+esc(g.name)+' 게임 소개와 시작하기"><span class="game-art art-'+g.color+'"><span class="art-sparkle" aria-hidden="true">'+artIcon('star')+'</span><img class="art-image" src="./assets/game-'+g.id+'.webp" alt="" width="200" height="160" loading="lazy" decoding="async" />'+
      '<span class="art-number">60s</span></span><span class="game-body"><span class="game-type">'+artIcon(g.category==='reflex'?'play':g.category==='brain'?'scroll':'star')+' '+(g.category==='reflex'?'순발력':g.category==='brain'?'두뇌':'관찰·추리')+
      '</span><span class="game-title">'+esc(g.name)+'</span><span class="game-description">'+esc(g.desc)+'</span><span class="game-foot"><span class="game-foot-score">'+artIcon('trophy')+padScore(state.best[g.id]||0)+'점</span><span class="play-button" aria-hidden="true">'+artIcon('play')+' 놀기'+clickHand+'</span></span></span></button>';
    }).join('');
    $$('#gameGrid [data-game]').forEach(function(btn){btn.addEventListener('click',function(){preview(btn.dataset.game,false);});});
  }
  function preview(gameId,official) {
    if (session) stopSession();
    const game=gameById(gameId);
    if (!game)return;
    currentPreview={id:gameId,official:!!official};
    const isOfficial=official&&!hasDaily();
    const guide=GAME_GUIDES[game.id];
    modal('<div class="modal-title" id="modalTitle">'+artIcon('star')+' '+esc(game.name)+'</div>'+
      '<p class="modal-description">'+esc(game.desc)+'</p>'+
      '<div class="preview-emoji game-preview art-'+game.color+'"><img src="./assets/game-'+game.id+'.webp" alt="" width="160" height="160" decoding="async" /></div>'+
      '<div class="game-zone-chip">'+artIcon('scroll')+' '+esc(game.zone)+' · '+esc(game.host)+'의 놀이기구</div>'+
      '<div class="mode-tag">'+artIcon(isOfficial?'medal':'star')+' '+(isOfficial?'오늘의 공식 기록':'무제한 자유 플레이')+'</div>'+
      '<div class="howto-guide"><div class="howto-title">'+artIcon('scroll')+' 이렇게 놀아 봐! <small>60초 게임</small></div><ol>'+guide.steps.map(function(step){return '<li>'+esc(step)+'</li>';}).join('')+'</ol></div>'+
      '<button class="action-button illustrated-primary illustrated-cta" id="startPreview"><span class="button-label">'+artIcon('play')+'60초 시작하기</span>'+clickHand+'</button>'+
      '<p class="helper-text">'+(isOfficial?'공식 기록은 하루 1회만 가능합니다. 게임 시작 후 이탈해도 기회가 사용돼요.':'자유 플레이는 원하는 만큼 다시 도전할 수 있어요.')+'<br>게임 중 ? 버튼을 누르면 타이머를 멈추고 놀이법을 볼 수 있어.</p>');
    $('#startPreview').addEventListener('click',function(){startGame(gameId,isOfficial);});
  }
  function startGame(gameId,official) {
    if (session)stopSession();
    syncStoredProgress();
    const today=dayKey();
    if (official && hasDaily(today)) {toast('오늘 공식 도전은 이미 사용했어!');preview(gameId,false);return;}
    if (official && dailyGame(today).id!==gameId) {
      preview(dailyGame(today).id,true);
      toast('날짜가 바뀌어 오늘의 도전을 새로 준비했어!');return;
    }
    if (official) {
      state.history[today]={gameId:gameId,complete:false,score:0};
      if(!save()){delete state.history[today];official=false;toast('기록을 저장할 수 없어 자유 플레이로 시작해요.');}
    }
    history.pushState(Object.assign({},history.state,{sixtyGameSession:true}),'',location.href);
    session={game:gameById(gameId),official:official,officialDay:official?today:null,score:0,combo:0,bestCombo:0,correct:0,wrong:0,
      deadline:performance.now()+60000,pausedAt:null,roundTimeout:null,roundTask:null,roundRemaining:0,roundDueAt:null,locked:false,round:0,memoryTarget:-1,nextNum:1};
    $('#modalHelp').title=GAME_GUIDES[session.game.id].hint;
    modal('<div class="modal-title" id="modalTitle">'+artIcon('star')+' '+esc(session.game.name)+'</div>'+
      '<div class="game-host" data-host="'+HOST_ART[session.game.host]+'"><img id="hostPortrait" src="'+mascotSource(HOST_ART[session.game.host])+'" alt="" width="44" height="48" decoding="async" /><span class="host-talk"><strong>'+esc(session.game.host)+' · '+esc(session.game.zone)+'</strong><small id="hostCheer">'+esc(HOST_LINES[session.game.host].intro)+'</small></span><span class="host-emote" id="hostEmote" aria-hidden="true"></span></div>'+
      '<div class="hud"><div class="hud-box">점수 <strong id="hudScore">0</strong></div><div class="hud-box">콤보 <strong id="hudCombo">0</strong></div><div class="hud-box">남은 시간 <strong id="hudTime">60.0</strong></div></div>'+
      '<div class="timer-wrap"><div class="timer-track"><div class="timer-fill" id="timerFill" style="width:100%"></div></div></div>'+
      '<div class="stage-row"><span id="gameStage" class="stage-chip">'+artIcon('leaf')+' 1단계 · 몸풀기</span><span class="round-count" id="roundCount">제 1판</span></div>'+
      '<div class="game-prompt" id="gamePrompt" aria-live="polite"></div><div class="arena" id="arena" data-game="'+session.game.id+'"></div><div class="feedback" id="feedback" aria-live="polite"></div>'+
      '<p class="helper-text">정답 +100점 · 연속 성공 보너스 · 제한 시간 60초</p>');
    round();tick();
  }
  function tick() {
    if (!session||session.pausedAt!==null) return;
    const left=Math.max(0,(session.deadline-performance.now())/1000);
    const timeEl=$('#hudTime'), fill=$('#timerFill');
    const shown=left.toFixed(1);
    if(timeEl&&timeEl.textContent!==shown)timeEl.textContent=shown;
    if(timeEl)timeEl.classList.toggle('urgent-time',left<=10);
    if(fill){const width=(Math.ceil(left*10)/600*100).toFixed(2)+'%';if(fill.style.width!==width)fill.style.width=width;fill.classList.toggle('urgent',left<=10);}
    if(left<=0){finish();return;}
    animFrame=requestAnimationFrame(tick);
  }
  function updateHud(){
    if(!session)return;
    $('#hudScore').textContent=padScore(session.score);
    const combo=$('#hudCombo');
    combo.textContent=session.combo;
    combo.parentElement.classList.toggle('combo-hot',session.combo>=3);
  }
  function feedback(correct,message,base,origin){
    if(!session||session.locked)return;
    const s=session;
    let earned=0;
    if(correct) {
      s.combo++;s.bestCombo=Math.max(s.combo,s.bestCombo);s.correct++;
      earned=(base||100)+Math.min(s.combo-1,15)*20;
      s.score+=earned;
    } else {s.combo=0;s.wrong++;}
    sound(correct?'correct':'wrong',s.game.id,s.combo);
    const el=$('#feedback');
    el.className='feedback '+(correct?'good':'bad');el.textContent=message || (correct?'정답! ✨':'아쉬워! 다시 집중!');
    const reactions=HOST_LINES[s.game.host];
    const cheer=$('#hostCheer');
    if(cheer){
      cheer.textContent=correct?(s.combo>=3?s.combo+'콤보! '+reactions.combo:reactions.success[(s.correct-1)%reactions.success.length]):reactions.wrong[(s.wrong-1)%reactions.wrong.length];
    }
    updateHud();
  }
  function after(delay){
    if(!session)return;
    const s=session;s.locked=true;
    scheduleRoundTask(s,function(){if(session===s){s.locked=false;round();}},delay||340);
  }
  function revealAnswer(selected,answer){
    if(selected)selected.classList.add(selected===answer?'answer-correct':'answer-wrong');
    if(answer&&answer!==selected)answer.classList.add('answer-reveal');
  }
  function canAnswer(s){
    if(session!==s||s.locked||s.pausedAt!==null)return false;
    if(performance.now()>=s.deadline){finish();return false;}
    return true;
  }
  function choiceButton(text,fn,cls){
    const b=document.createElement('button');b.type='button';b.className=cls||'choice';b.textContent=text;
    b.addEventListener('click',fn);return b;
  }
  function round(){
    const s=session;if(!s)return;
    if(performance.now()>=s.deadline){finish();return;}
    s.round++;s.locked=false;
    const stage=s.round>=11?3:s.round>=6?2:1;
    const stageChanged=!!s.stage&&s.stage!==stage;
    s.stage=stage;
    const stageChip=$('#gameStage');
    if(stageChip.dataset.stage!==String(stage)){
      stageChip.innerHTML=artIcon(stage===1?'leaf':stage===2?'star':'play')+' '+(stage===1?'1단계 · 몸풀기':stage===2?'2단계 · 도전':'3단계 · 집중');
      stageChip.dataset.stage=String(stage);
    }
    $('#roundCount').textContent='제 '+s.round+'판';
    if(stageChanged){
      stageChip.classList.add('stage-up');
      toast(stage===2?'✨ 2단계 시작! 조금 더 어려워져!':'🔥 3단계 시작! 집중해 봐!');
    }
    $('#feedback').textContent='';$('#feedback').className='feedback';
    const arena=$('#arena');if(s.game.id!=='memory')arena.innerHTML='';arena.dataset.stage=String(stage);
    const prompt=$('#gamePrompt');
    switch(s.game.id){
    case 'whack': {
      prompt.textContent='뿔 달린 몬스터만 잡아! 동물 친구와 꽃은 피해!';
      const grid=document.createElement('div');grid.className='tap-grid';
      const target=pickDifferentIndex(9,s.lastWhackTarget),monster=['👾','👹','👺'][rand(stage)];
      s.lastWhackTarget=target;
      const dangers=shuffle(Array.from({length:9},function(_,i){return i;}).filter(function(i){return i!==target;})).slice(0,stage);
      const friends=shuffle(['🐱','🐰','🦊','🐻']);
      for(let i=0;i<9;i++){
        const dangerIndex=dangers.indexOf(i);
        const symbol=i===target?monster:dangerIndex>=0?friends[dangerIndex]:['🌸','🍀','🌼'][rand(3)];
        const cell=choiceButton(symbol,function(){
          if(!canAnswer(s))return;
          revealAnswer(cell,grid.children[target]);
          feedback(i===target,i===target?'몬스터 잡았다! +점수':dangerIndex>=0?'친구를 건드렸어!':'몬스터가 아니야!',100,cell);after(260);
        },'tap-cell');paintWhackCell(cell,symbol);grid.append(cell);
      }
      arena.append(grid);break;
    }
    case 'number': {
      if(s.nextNum===1||s.nextNum>16){s.nextNum=1;s.numbers=shuffle(Array.from({length:16},function(_,i){return i+1;}));}
      prompt.textContent='순서대로 터치! 다음 숫자: '+s.nextNum;
      const grid=document.createElement('div');grid.className='num-grid';
      s.numbers.forEach(function(n){
        const b=choiceButton(String(n),function(){
          if(b.disabled||!canAnswer(s))return;
          if(n===s.nextNum) {
            b.disabled=true;b.classList.add('done');b.innerHTML=artIcon('star');s.nextNum++;
            feedback(true,'좋아! 다음 숫자!',100,b);
            if(s.nextNum>16)after(340);else prompt.textContent='순서대로 터치! 다음 숫자: '+s.nextNum;
          }else{
            b.classList.add('answer-wrong');
            setTimeout(function(){b.classList.remove('answer-wrong');},450);
            feedback(false,'아직 '+s.nextNum+' 차례야!',100,b);
          }
        },'num-cell');grid.append(b);
      });
      arena.append(grid);break;
    }
    case 'spot': {
      prompt.textContent='오른쪽에서 다른 그림 1개를 찾아!';
      const puzzle=makeSpotPuzzle(stage,s.lastSpotIndex);
      s.lastSpotIndex=puzzle.changed;
      const base=puzzle.base,right=puzzle.right,changed=puzzle.changed;
      const pair=document.createElement('div');pair.className='spot-pair';
      const rightCells=[];
      [base,right].forEach(function(board,side){
        const wrap=document.createElement('div');wrap.className='spot-board';
        wrap.setAttribute('role',side===0?'img':'group');
        wrap.setAttribute('aria-label',side===0?'왼쪽 기준 그림. 왼쪽 위부터 '+board.map(function(icon,i){return (i+1)+'번 '+SPOT_ART[icon][1];}).join(', '):'오른쪽에서 다른 그림을 선택');
        board.forEach(function(icon,i){
          if(side===0){
            const sample=document.createElement('span');sample.className='spot-cell spot-sample';paintSpotCell(sample,icon);
            sample.setAttribute('aria-hidden','true');wrap.append(sample);return;
          }
          const b=choiceButton('',function(){
            if(!canAnswer(s))return;
            revealAnswer(b,rightCells[changed]);
            feedback(i===changed,i===changed?'찾았다! ✨':'이 친구는 똑같아!',100,b);after(500);
          },'spot-cell');b.setAttribute('aria-label',(i+1)+'번 '+paintSpotCell(b,icon)+' 그림 선택');rightCells.push(b);wrap.append(b);
        });
        pair.append(wrap);
      });arena.append(pair);break;
    }
    case 'stroop': {
      const palette=[{name:'빨강',css:'#ef5b69'},{name:'파랑',css:'#398be6'},{name:'초록',css:'#2cad88'},{name:'보라',css:'#8b5cd9'},{name:'주황',css:'#db7333'},{name:'노랑',css:'#ba850b'}];
      const colors=palette.slice(0,stage===1?4:stage===2?5:6);
      const pair=nextStroopPair(s,stage,colors.length),ink=pair.ink,word=pair.word;
      prompt.textContent='글자 뜻 말고 글자 색을 골라!';
      const display=document.createElement('div');display.className='stroop-word';display.style.color=colors[ink].css;display.textContent=colors[word].name;
      const grid=document.createElement('div');grid.className='choice-grid';
      colors.forEach(function(c,i){
        const b=choiceButton(c.name,function(){
          if(!canAnswer(s))return;
          revealAnswer(b,grid.children[ink]);
          feedback(i===ink,i===ink?'정확한 색이야!':'눈에 보이는 색을 봐!',100,b);after(390);
        },'choice color-option');
        b.style.setProperty('--option-color',c.css);grid.append(b);
      });
      arena.append(display,grid);break;
    }
    case 'memory': {
      const revealTime=stage===1?950:stage===2?780:650;
      prompt.textContent='별을 바로 누르거나 자리를 기억해!';
      const target=pickDifferentIndex(9,s.memoryTarget);s.memoryTarget=target;
      let grid=arena.querySelector('.memory-grid');
      if(!grid){grid=document.createElement('div');grid.className='memory-grid';
        for(let i=0;i<9;i++){const cell=document.createElement('button');cell.type='button';grid.append(cell);}
        arena.append(grid);
      }
      const cells=Array.from(grid.children);
      cells.forEach(function(b,i){
        b.className='memory-cell';b.innerHTML=i===target?artIcon('star'):'';b.disabled=false;
        b.setAttribute('aria-label',(i+1)+'번째 칸'+(i===target?' · 별':''));
        b.onclick=function(){
          if(!canAnswer(s))return;
          revealAnswer(b,cells[target]);
          feedback(i===target,i===target?'기억력 최고!':'별의 자리는 여기였어!',100,b);
          after(450);
        };
      });
      cells[target].classList.add('memory-target');
      scheduleRoundTask(s,function(){
        if(!session||session!==s)return;
        cells.forEach(function(b,i){b.innerHTML=artIcon('help');b.setAttribute('aria-label',(i+1)+'번째 칸');b.disabled=false;});
        cells[target].classList.remove('memory-target');
        prompt.textContent='별은 어디에 있었을까?';s.locked=false;
      },revealTime);
      break;
    }
    case 'sort': {
      prompt.textContent='이 그림은 어느 속성일까?';
      const families=shuffle(SORT_FAMILIES.slice(0,stage+2)).slice(0,3);
      const fresh=families.filter(function(f){return f.name!==s.lastSortFamily;});
      const picked=(fresh.length?fresh:families)[rand((fresh.length?fresh:families).length)];
      const family=families.indexOf(picked),item=drawWithoutRepeats(s,'sort-'+picked.name,picked.items);
      s.lastSortFamily=picked.name;
      const monster=document.createElement('div');monster.className='sort-monster sort-painted';
      const row=SORT_FAMILIES.indexOf(picked),col=picked.items.indexOf(item);
      monster.style.backgroundPosition=(col*100/3)+'% '+(row*25)+'%';
      monster.setAttribute('role','img');monster.setAttribute('aria-label',SORT_ITEM_NAMES[row][col]);
      const title=document.createElement('div');title.className='sort-label';title.textContent='그림에 맞는 속성을 선택해!';
      const grid=document.createElement('div');grid.className='sort-choices';
      families.forEach(function(f,i){
        const b=choiceButton(f.name,function(){
          if(!canAnswer(s))return;
          revealAnswer(b,grid.children[family]);
          feedback(i===family,i===family?'분류 성공!':'이 속성은 아니야!',100,b);after(410);
        },'choice');grid.append(b);
      });
      arena.append(monster,title,grid);break;
    }
    case 'mystery': {
      const q=drawWithoutRepeats(s,'mystery-'+stage,MYSTERY_QUIZ[stage]);
      const options=shuffle(q.a.map(function(answer,i){return {text:answer,valid:i===0};}));
      prompt.textContent='코코의 수수께끼 · '+stage+'단계';
      const clue=document.createElement('div');clue.className='mystery-clue';clue.textContent=q.q;
      const opts=document.createElement('div');opts.className='mystery-choices';
      const answerIndex=options.findIndex(function(option){return option.valid;});
      options.forEach(function(option,i){
        const b=choiceButton((i+1)+'. '+option.text,function(){
          if(!canAnswer(s))return;
          revealAnswer(b,opts.children[answerIndex]);
          feedback(option.valid,option.valid?'정답! 명탐정이야!':'정답은 '+q.a[0]+'!',100,b);after(580);
        },'choice');opts.append(b);
      });
      arena.append(clue,opts);break;
    }
    }
  }
  function copyShareResult(value) {
    function fallbackCopy() {
      const field=document.createElement('textarea');
      field.value=value;field.setAttribute('readonly','');
      field.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0;';
      document.body.appendChild(field);field.select();
      let copied=false;
      try {copied=!!document.execCommand('copy');}catch(error){}
      field.remove();
      toast(copied?'결과와 게임 주소를 복사했어!':'자동 복사에 실패했어. 기기 공유 메뉴를 이용해줘.');
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      try {
        navigator.clipboard.writeText(value).then(function(){toast('결과와 게임 주소를 복사했어!');}).catch(fallbackCopy);
        return;
      }catch(error){}
    }
    fallbackCopy();
  }
  function finish() {
    if(!session)return;
    const s=session;stopSession();sound('finish',s.game.id,s.combo);
    syncStoredProgress();
    const previousBest=state.best[s.game.id]||0;
    const newRecord=s.score>previousBest;
    state.plays[s.game.id]=(state.plays[s.game.id]||0)+1;
    state.best[s.game.id]=Math.max(state.best[s.game.id]||0,s.score);
    if(s.official)state.history[s.officialDay||dayKey()]={gameId:s.game.id,complete:true,score:s.score};
    const newBadges=badgeUnlock();const savedResult=save();refresh();renderGames($('[data-filter].active')?.dataset.filter||'all');
    const medal=s.score>=5000?'trophy':s.score>=2500?'medal':s.score>=1000?'star':'leaf';
    const praise=s.score>=5000?'모두가 깜짝 놀란 전설의 60초!':s.score>=2500?'정말 멋진 탐험이었어!':s.score>=1000?'실력이 쑥쑥 자라고 있어!':'도전하는 모습 자체가 멋져!';
    modal('<div class="modal-title" id="modalTitle">'+artIcon(s.official?'medal':'star')+' '+(s.official?'오늘의 공식 도전 완료':'자유 플레이 완료')+'</div>'+
      '<p class="modal-description">'+esc(s.game.name)+' · '+praise+'</p>'+
      '<div class="result-party" aria-label="모모, 루루, 코코, 두두가 함께 축하해요"><img src="./assets/friends-celebration-v06.webp" alt="모모, 루루, 코코, 두두가 즐겁게 뛰며 축하하고 있어요" width="420" height="210" decoding="async" /><span class="result-party-medal" aria-hidden="true">'+artIcon(medal)+'</span></div>'+
      '<div class="result-score">'+padScore(s.score)+'<small>점</small></div>'+
      (!savedResult?'<p class="helper-text" role="status">이 기기에서 기록을 저장하지 못했어요. 브라우저 저장 공간과 설정을 확인해 주세요.</p>':'')+
      (newRecord?'<div class="result-record">'+artIcon('star')+' 새로운 최고 기록 달성!</div>':'')+
      '<div class="result-grid"><div class="result-cell"><strong>'+s.correct+'</strong><span>정답</span></div><div class="result-cell"><strong>'+s.bestCombo+'</strong><span>최고 콤보</span></div><div class="result-cell"><strong>'+padScore(state.best[s.game.id])+'</strong><span>개인 최고</span></div></div>'+
      (newBadges.length?'<div class="badge-unlock">새 배지 획득! '+newBadges.map(function(b){return badgeArt(b.id)+' '+b.name;}).join(' · ')+'</div>':'')+
      '<button class="action-button illustrated-primary illustrated-cta" id="replayGame"><span class="button-label">'+artIcon('play')+'한 판 더!</span>'+clickHand+'</button>'+
      '<button class="action-button secondary" id="shareGame">'+artIcon('scroll')+' 결과 공유하기</button>'+
      '<p class="helper-text">공식 도전은 하루 1회 · 자유 플레이는 무제한</p>');
    $('#replayGame').addEventListener('click',function(){startGame(s.game.id,false);});
    $('#shareGame').addEventListener('click',function(){
      const shareUrl=new URL('./?view=games',window.location.href).href;
      const text='🎠 오늘의 60초 놀이터\n'+s.game.name+' '+padScore(s.score)+'점!\n나도 60초 도전했어!';
      const copyFallback=function(){copyShareResult(text+'\n'+shareUrl);};
      const touchShare=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
      if(typeof navigator.share!=='function'||!touchShare){copyFallback();return;}
      try {
        navigator.share({title:'오늘의 60초 놀이터',text:text,url:shareUrl}).then(function(){toast('결과를 공유했어!');}).catch(function(error){
          if(error&&error.name==='AbortError'){toast('공유를 취소했어.');return;}
          copyFallback();
        });
      }catch(error){copyFallback();}
    });
  }
  function showRecords() {
    syncStoredProgress();
    const rank=GAMES.slice().sort(function(a,b){return (state.best[b.id]||0)-(state.best[a.id]||0);});
    modal('<div class="modal-title" id="modalTitle">'+artIcon('trophy')+' 나의 놀이공원 기록</div>'+
      '<p class="modal-description">이 기기의 브라우저에 저장되는 소중한 기록들이야.</p>'+
      '<div class="record-summary"><div><strong>'+GAMES.reduce(function(n,g){return n+(state.plays[g.id]||0);},0)+'</strong><small>총 플레이</small></div><div><strong>'+streak()+'일</strong><small>연속 공식 도전</small></div><div><strong>'+state.badges.length+'</strong><small>획득 배지</small></div></div>'+
      rank.map(function(g){return '<div class="record-line"><span>'+artIcon('medal')+' '+esc(g.name)+'</span><strong>'+padScore(state.best[g.id]||0)+'점</strong></div>';}).join('')+
      '<h3>나의 배지</h3><div class="badge-list">'+(BADGES.filter(function(b){return state.badges.includes(b.id);}).map(function(b){return '<span class="earned-badge">'+badgeArt(b.id)+' '+b.name+'</span>';}).join('')||'<span class="muted-placeholder">게임을 플레이하고 첫 배지를 획득해 봐!</span>')+'</div>'+
      '<p class="helper-text">로그인 및 서버 동기화가 없는 시제품입니다. 기록은 브라우저 데이터 삭제 시 사라질 수 있어요.</p>');
  }
  function petTalk(id) {
    const p=PETS[id];if(!p)return;
    const favorite=gameById(PET_FAVORITES[id]);
    modal('<div class="modal-title" id="modalTitle">'+artIcon('star')+' '+p.name+'의 응원</div>'+
      '<div class="preview-emoji pet-preview"><img src="./assets/'+PET_ART[id]+'.webp" alt="'+p.name+' 캐릭터 원화" width="125" height="125" /></div><p class="modal-description">'+p.speech+'</p>'+
      '<button class="action-button illustrated-primary" id="petPlay">'+artIcon('play')+' '+p.name+'와 '+esc(favorite.name)+' 즐기기</button>');
    $('#petPlay').addEventListener('click',function(){preview(favorite.id,false);});
  }
  // v2.0: 화면 아래로 이동하는 방식 대신 URL·뒤로 가기와 연동된 두 개의 페이지 뷰.
  // ?view=games 는 정적 호스팅 새로고침에서도 동일한 index.html로 열립니다.
  const currentView=function(){return new URLSearchParams(window.location.search).get('view')==='games'?'games':'home';};
  function renderView(view,focus){
    const next=view==='games'?'games':'home';
    if(!$('#overlay').classList.contains('hidden'))closeModal();
    document.body.dataset.view=next;
    $('#pageNav').hidden=next!=='games';
    window.scrollTo(0,0);
    if(focus){
      const heading=next==='games'?$('#gamesTitle'):$('.hero h1');
      heading.focus({preventScroll:true});
    }
  }
  function navigateView(view){
    const next=view==='games'?'games':'home';
    if(currentView()===next&&document.body.dataset.view===next){window.scrollTo(0,0);return;}
    const url=new URL(window.location.href);
    if(next==='games')url.searchParams.set('view','games');
    else url.searchParams.delete('view');
    url.hash='';
    window.history.pushState({view:next},'',url.pathname+url.search);
    renderView(next,true);
  }
  const arcadeHadPrevious=history.state?.arcadeHadPrevious ?? (history.length>1 && Boolean(document.referrer));
  if(!history.state?.arcadeGuard){
    const incoming=location.pathname+location.search+location.hash;
    const home=new URL(location.href);home.searchParams.delete('view');home.hash='';
    history.replaceState({arcadeBase:true,arcadeHadPrevious},'',home.pathname+home.search);
    history.pushState({arcadeGuard:true,arcadeHadPrevious},'',incoming);
  }
  function showArcadeExit(){
    modal('<div class="modal-title" id="modalTitle">'+artIcon('star')+' 놀이공원을 나갈까?</div><p class="helper-text">잠깐 쉬어 가도 괜찮아! 기록은 이 기기에 남아 있어.</p><button class="action-button illustrated-primary" id="arcadeStay" type="button">'+artIcon('play')+'계속 놀기</button><button class="action-button secondary" id="arcadeLeave" type="button">'+artIcon('scroll')+'나가기</button>');
    $('#arcadeStay').addEventListener('click',closeModal);
    $('#arcadeLeave').addEventListener('click',function(){closeModal();if(arcadeHadPrevious&&history.length>2)history.go(-2);else location.assign('https://meta-deee1.web.app/ai-cleaner/');});
    $('#arcadeStay').focus();
  }
  $$('#heroDaily, #dailyCardStart').forEach(function(b){b.addEventListener('click',function(){preview(dailyGame().id,!hasDaily());});});
  $('#heroExplore').addEventListener('click',function(){navigateView('games');});
  $('#backHome').addEventListener('click',function(){navigateView('home');});
  $('.brand').addEventListener('click',function(event){event.preventDefault();navigateView('home');});
  window.addEventListener('popstate',function(event){
    if(sessionHistoryCleanup){sessionHistoryCleanup=false;return;}
    if(session){
      // Restore a same-page guard so Back pauses rather than abandoning the round.
      history.pushState(Object.assign({},history.state,{sixtyGameSession:true}),'',location.href);
      showPause('exit');return;
    }
    if(event.state?.arcadeBase){
      history.pushState({arcadeGuard:true,arcadeHadPrevious},'',location.href);
      if(!$('#overlay').classList.contains('hidden')){closeModal();return;}
      if(document.body.dataset.view!=='home'){renderView('home',true);return;}
      showArcadeExit();return;
    }
    if(!$('#overlay').classList.contains('hidden')){
      const view=document.body.dataset.view;const url=new URL(location.href);
      if(view==='games')url.searchParams.set('view','games');else url.searchParams.delete('view');
      history.pushState({view,arcadeHadPrevious},'',url.pathname+url.search);
      closeModal();return;
    }
    renderView(currentView(),true);
  });
  window.addEventListener('storage',function(event){
    if(event.key!==STORE||!event.newValue)return;
    syncStoredProgress();refresh();renderGames($('#gameGrid').dataset.filter||'all');
  });
  $('#recordToggle').addEventListener('click',showRecords);
  $('#soundToggle').addEventListener('click',function(){syncStoredProgress();state.sound=!state.sound;save();refresh();toast(state.sound?'효과음 켜짐 ♪':'효과음 꺼짐');});
  $$('#modalClose, #overlayBackdrop').forEach(function(b){b.addEventListener('click',requestClose);});
  $('#modalPause').addEventListener('click',function(){showPause('break');});
  $('#modalHelp').addEventListener('click',function(){showPause('help');});
  $('#pauseResume').addEventListener('click',hidePause);
  $('#pauseExit').addEventListener('click',closeModal);
  // 우클릭 메뉴와 선택·끌기만 막고 터치 스크롤 및 키보드 조작은 유지한다.
  document.addEventListener('contextmenu',function(event){event.preventDefault();},{capture:true});
  document.addEventListener('dragstart',function(event){event.preventDefault();},{capture:true});
  document.addEventListener('selectstart',function(event){event.preventDefault();},{capture:true});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape'||$('#overlay').classList.contains('hidden'))return;
    e.preventDefault();
    if(!$('#pauseScreen').classList.contains('hidden'))hidePause();
    else requestClose();
  });
  document.addEventListener('visibilitychange',function(){
    if(document.hidden&&session&&session.pausedAt===null)showPause('away');
  });
  $$('[data-filter]').forEach(function(btn){btn.addEventListener('click',function(){
    $$('[data-filter]').forEach(function(el){el.classList.remove('active');});btn.classList.add('active');renderGames(btn.dataset.filter);
  });});
  $$('[data-mascot]').forEach(function(btn){btn.addEventListener('click',function(){petTalk(btn.dataset.mascot);});});
  renderGames('all');refresh();renderView(currentView(),false);
  let guideIndex=0;showGuide(guideIndex);
  setInterval(function(){
    if(document.hidden||!$('#overlay').classList.contains('hidden'))return;
    guideIndex=(guideIndex+1)%GUIDES.length;showGuide(guideIndex);
  },7500);
})();
