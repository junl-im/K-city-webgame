/* 라니 수비대 v2.9 — © 2026 곰같은여우
 * Original game rules, PNG character art, Canvas field art and interface.
 * Combat architecture informed by MIT-licensed Phaser 3 and the WaveManager,
 * EnemyManager and Projectile patterns of rupertgermann/tower-defence.
 * No SVG, forced advertisements, telemetry, accounts or external art assets.
 */
(() => {
  'use strict';
  const SAVE_KEY = 'gomfox.forestguard.v1';
  const REPAIR_COST = 120, REPAIR_HEAL = 420, REPAIR_LIMIT = 2;
  const RECRUIT_TIMEOUT = 12000;
  const HERO_POSITIONS = Object.freeze([58,134,210,286,362]);
  const HERO_RECRUIT_ORDER = Object.freeze([1,3,0,4]);
  const HERO_CAPACITY = HERO_POSITIONS.length;
  const DRAFT_TIMEOUT = 10000;
  const HOME_URL = 'https://meta-deee1.web.app/';
  const $ = id => document.getElementById(id);
  const V = window.ForestGuardVisuals;
  const STAGES = [
    ['첫 번째 침입',8,'sprout','기본 전투','숲길에 낯선 발자국이 나타났어요.'],
    ['달리는 버섯들',8,'runner','빠른 몬스터','버섯들이 믿기 힘든 속도로 달리기 시작해요!'],
    ['갈라진 숲길',10,'runner','좌우 양방향','숲길이 두 갈래로 갈라졌어요.'],
    ['뿌리의 거인',10,'boss','거대한 보스','거대한 나무뿌리 아래에서 무언가 깨어나요.'],
    ['반딧불 골짜기',10,'sprout','안개','안개 속에서 반짝이는 눈들이 보여요.'],
    ['부서진 나무다리',10,'brute','견고한 적','몹시 단단한 몬스터가 나타났어요.'],
    ['버섯 포자비',10,'runner','포자 군단','몹시 빠른 적들이 무리를 지어 몰려와요.'],
    ['가면 쓴 두더지',12,'boss','잠복 보스','누가 몬스터들을 이끌고 있는 걸까요?'],
    ['바람의 언덕',10,'runner','바람','화살이 바람에 흔들리는 날이에요.'],
    ['수정 연못',12,'brute','수정 갑옷','빛나는 갑옷을 부술 방법을 찾아야 해요.'],
    ['마지막 밤',12,'brute','혼합 공격','적들이 한꺼번에 숲으로 밀려들어요.'],
    ['검은 종의 주인',12,'boss','최종 보스','숲을 어둡게 만든 검은 종의 주인을 만나세요.']
  ].map((s,i) => ({id:i,chapter:Math.floor(i/4)+1,name:s[0],waves:s[1],elite:s[2],gimmick:s[3],story:s[4]}));
  // Each chapter climax uses its own original 2×2 painted pose sheet.
  const CHAPTER_BOSS_ART=Object.freeze({
    3:{file:'chapter1-root-giant-v52.webp',name:'뿌리 거인'},
    7:{file:'chapter2-masked-mole-v51.webp',name:'가면 두더지'},
    11:{file:'chapter3-black-bell-v51.webp',name:'검은 종의 주인'}
  });
  // Percent coordinates for the original continuous illustrated forest trail.
  // Bottom camp -> moonlit summit; no SVG path or tile boundaries.
  const STAGE_SPOTS = [[22,91],[48,83],[29,76],[55,68],[34,60],[61,53],[39,45],[70,38],[49,31],[76,24],[60,16],[81,9]];
  // This single data source drives the scouting panel and matches actual combat effects.
  const ENEMY_INTEL = {
    sprout:{name:'새싹 괴물',trait:'느린 무리형',counter:'불꽃 추가 피해 +25%',detail:'약하지만 공세가 길어질수록 무리가 커져요.'},
    runner:{name:'달리는 버섯',trait:'고속 돌파형',counter:'서리 화살 · 덩굴 덫',detail:'성벽까지 빨리 달려와요. 이동 방해가 유리해요.'},
    brute:{name:'바위 갑옷 짐승',trait:'기본 화살 피해 18% 방어',counter:'관통 화살 · 마법사',detail:'수정 연못에서는 방어가 30%로 증가해요.'},
    boss:{name:'우두머리',trait:'공격 예고 · 특수 행동',counter:'일제사격 저지 · 추적',detail:'뿌리 돌진, 잠복, 검은 종 충격을 예고해요.'},
    thorn:{name:'가시 딱정벌레',trait:'작고 빠른 돌파형',counter:'서리 · 연사',detail:'무리 속에서 빠르게 전진해요.'},
    crystal:{name:'수정갑각수',trait:'단단한 수정 껍질',counter:'관통 · 마법',detail:'일반 물리 공격의 일부를 견뎌요.'},
    shroom:{name:'버섯 거한',trait:'3공세마다 나타나는 정예',counter:'집중 공격 · 화상',detail:'큰 몸집으로 전열을 압박해요.'},
    guardian:{name:'숲길 파수꾼',trait:'일반 스테이지 중간보스',counter:'일제사격으로 충격파 저지',detail:'전투 한복판에 나타나 성벽에 충격파를 가해요.'},
    spore:{name:'포자 딱정벌레',trait:'버섯 장갑 · 근처 적 가속',counter:'집중 사격 · 불꽃',detail:'체력이 줄면 주변 몬스터를 한 번 재촉해요.'},
    imp:{name:'이끼 숲 임프',trait:'고속 회피 정찰병',counter:'서리 · 선두 우선',detail:'화살 사이를 빠르게 비집고 뛰어와요.'}
  };
  // Wide enemy front narrows naturally toward the defenders. Movement uses no SVG paths.
  function funnelX(entryX,y,wind=0){
    const progress=Math.max(0,Math.min(1,(y+38)/576));
    const easing=progress*progress*(3-2*progress);
    return 210+(entryX-210)*(1-.53*easing)+wind*(1-.45*progress);
  }
  // Active only after first recruitment; every stage hazard is bounded, announced and reversible.
  const TERRAIN_EVENTS=Object.freeze({
    5:{title:'낡은 다리 균열',detail:'다리가 흔들려 선두 적이 잠깐 멈춰요',interval:16500},
    6:{title:'포자비 경보',detail:'일제사격으로 포자비를 저지하세요',interval:18000},
    9:{title:'수정 연못 공명',detail:'수정 장갑이 잠시 약해져요',interval:18500}
  });
  const STAGE_TIPS = [
    '처음에는 새싹 무리를 막고 성벽을 지켜 주세요.',
    '빠른 버섯이 쏟아져요. 서리 또는 덩굴로 진군을 늦추세요.',
    '양쪽 길에서 달려와요. 용병 위치를 수시로 조정하세요.',
    '뿌리 거인의 돌진 예고에 맞춰 일제사격으로 저지하세요.',
    '안개로 사정거리가 줄어요. 추적의 눈으로 시야를 회복하세요.',
    '낡은 다리 균열이 적을 잠깐 묶어요. 강한 적을 집중 공격하세요.',
    '포자비 예고 중 일제사격을 누르면 군단 가속을 저지할 수 있어요.',
    '가면 두더지가 잠복하며 위치를 바꿔요. 경고를 놓치지 마세요.',
    '돌풍에 적의 위치가 흔들려요. 다중 화살이 유리해요.',
    '수정 연못이 공명할 때 갑옷이 약해져요. 관통·집중사격을 활용하세요.',
    '4공세마다 적이 증원돼요. 성벽 방어와 범위 공격이 중요해요.',
    '검은 종이 성벽을 직접 흔들어요. 예고에 맞춰 끊어 주세요.'
  ];
  const CARDS = [
    {id:'power',icon:'⚔',title:'날카로운 일격',desc:'전체 공격력 +25%',rare:false},
    {id:'haste',icon:'➶',title:'빠른 손놀림',desc:'공격 속도 +20%',rare:false},
    {id:'multi',icon:'➹',title:'쌍둥이 화살',desc:'여우가 화살을 하나 더 발사',rare:true},
    {id:'ice',icon:'❄',title:'서리 화살',desc:'타격한 적을 잠시 둔화',rare:false},
    {id:'wall',icon:'▣',title:'튼튼한 성벽',desc:'성벽 HP 600 회복',rare:false},
    {id:'flame',icon:'♨',title:'불꽃의 맹세',desc:'타격 후 추가 화상 피해',rare:true},
    {id:'bear',icon:'▣',title:'곰 수호자',desc:'튼튼한 창 공격 용병이 합류',rare:true},
    {id:'rabbit',icon:'☾',title:'토끼 마법사',desc:'빙결 마법사가 합류',rare:true},
    {id:'cat',icon:'✹',title:'고양이 기술자',desc:'폭탄의 달인이 합류',rare:true},
    {id:'crit',icon:'✦',title:'약점 간파',desc:'치명타 확률 +13%',rare:false},
    {id:'spark',icon:'⚡',title:'번개의 씨앗',desc:'타격 시 연쇄 번개 피해',rare:true},
    {id:'roots',icon:'♣',title:'덩굴 덫',desc:'주기적으로 앞선 적을 묶어 둠',rare:false},
    {id:'pierce',icon:'➤',title:'관통 화살',desc:'수정·중장갑 방어력 무시',rare:true},
    {id:'ward',icon:'▤',title:'숲의 수호',desc:'공세마다 성벽 피해 1회 감소',rare:false},
    {id:'hunter',icon:'◎',title:'추적의 눈',desc:'안개 시야 회복·사정거리 증가',rare:false}
  ];
  // v3.8 original four-element PNG; no SVG or duplicate button frame.
  const ELEMENT_SPELL_ART=Object.freeze({
    roots:['forest','0%','0%'],ward:['forest','0%','0%'],
    ice:['frost','100%','0%'],wall:['stone','0%','100%'],
    flame:['flame','100%','100%']
  });
  function paintElementSpell(icon,id,card){
    const tile=ELEMENT_SPELL_ART[id];if(!tile)return;
    icon.style.backgroundImage='url("./art/rani-element-spells-v38.png")';
    icon.style.backgroundSize='200% 200%';
    icon.style.backgroundPosition=tile[1]+' '+tile[2];
    icon.style.backgroundRepeat='no-repeat';
    icon.style.setProperty('--rani-icon-image',icon.style.backgroundImage);
    icon.style.setProperty('--rani-icon-size',icon.style.backgroundSize);
    icon.style.setProperty('--rani-icon-position',icon.style.backgroundPosition);
    icon.dataset.element=tile[0];icon.classList.add('rani-element-art');
    if(card){card.dataset.element=tile[0];card.classList.add('rani-element-card');}
  }
  const SYNERGY_RECIPES = [
    ['flame','haste','wildfire','화염폭풍'],
    ['ice','spark','thunderfrost','빙뢰연쇄'],
    ['multi','crit','stormshot','폭풍 화살'],
    ['roots','flame','bramblefire','불꽃 덩굴'],
    ['ward','wall','heartwood','고목의 맹세']
  ];
  const HEROES = {
    fox:{name:'여우 궁수',icon:'🦊',damage:27,interval:790,range:535,color:0xffce6a},
    megafox:{name:'곰같은여우',icon:'🦊',damage:69,interval:460,range:690,color:0xffdf80},
    bear:{name:'곰 수호자',icon:'🐻',damage:42,interval:1250,range:345,color:0xeab68c},
    rabbit:{name:'토끼 마법사',icon:'🐰',damage:24,interval:1050,range:605,color:0xa9eafa},
    cat:{name:'고양이 기술자',icon:'🐱',damage:31,interval:1150,range:470,color:0xff9b6f}
  };
  // Shared rear-view weapon sockets for shots and cast accents.
  const HERO_MUZZLES=Object.freeze({fox:[-17,-24],megafox:[-20,-27],bear:[18,-29],rabbit:[20,-34],cat:[21,-23]});
  const state = {unlocked:1,clears:[],best:{},stats:{},selected:0,muted:false};
  try {
    const loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (loaded && typeof loaded === 'object') {
      state.unlocked = Math.min(12,Math.max(1,Number(loaded.unlocked) || 1));
      state.clears = Array.isArray(loaded.clears) ? loaded.clears.filter(n=>Number.isInteger(n)&&n>=0&&n<12) : [];
      state.best = loaded.best && typeof loaded.best === 'object' ? loaded.best : {};
      state.stats = loaded.stats && typeof loaded.stats==='object' ? loaded.stats : {};
    }
  } catch(_e) { /* Private browsing may restrict storage. */ }
  let game = null, battle = null, activeModal = null, focusBeforeModal = null, suspended = false;
  let pendingStageIndex = 0, atlasBitmap = null, evolutionBitmap = null, fieldBitmap = null, atlasPromise = null, starting = false;
  const biomeBitmaps = [null,null,null];
  const biomeLoading = [null,null,null];
  const biomeFiles = ['forest-entrance-v08.png','misty-canyon-v08.png','moonlit-highland-v08.png'];
  let monsterBitmap = null, monsterHurtBitmap = null, fortBitmap = null, mushroomAttackBitmap = null, rampartBitmap = null, rearBitmap = null;
  let elementSpellBitmap = null, foxAttackBitmap = null; // Original raster illustrations, never SVG.
  const heroAttackBitmaps = {bear:null,rabbit:null,cat:null,megafox:null}; // v4.4 illustrated rear-view sheets
  const chapterBossBitmaps={3:null,7:null,11:null};
  let forestSentinelBitmap=null; // Chapter 1 has its own midboss instead of a reused silhouette.
  const ART_VERSION = '20261031r';
  // Mobile connections may exceed the old eight-second cutoff during decoding.
  async function loadIllustration(url,assign,required=false){
    if(!url)return true;
    const attempts=required?2:1;
    for(let attempt=1;attempt<=attempts;attempt++){
      const ready=await new Promise(resolve=>{
        const art=new Image();
        let settled=false;
        const complete=ok=>{
          if(settled)return;
          settled=true;clearTimeout(timer);art.onload=null;art.onerror=null;
          if(ok&&art.naturalWidth>0&&art.naturalHeight>0){assign(art);resolve(true);}
          else resolve(false);
        };
        const timer=setTimeout(()=>complete(false),required?26000:16000);
        art.decoding='async';
        art.fetchPriority=required?'high':'auto';
        art.onload=()=>complete(true);
        art.onerror=()=>complete(false);
        art.src=url+(attempt>1?(url.includes('?')?'&':'?')+'retry='+attempt:'');
      });
      if(ready)return true;
      if(attempt<attempts){
        console.info('원화 로딩 재시도:',url);
        await new Promise(resolve=>setTimeout(resolve,320));
      }
    }
    console.warn('원화 로딩 실패:',url);
    return false;
  }
  async function prepareAtlas(stageIndex){
    if(!atlasPromise)atlasPromise=Promise.all([
      loadIllustration('./art/forest-characters.png?v=20261031c',art=>{atlasBitmap=art;},true),
      loadIllustration('./art/rani-evolution.png?v=20261031c',art=>{evolutionBitmap=art;}),
      // Optional enhancements never prevent an otherwise fully painted battle.
      loadIllustration('./art/rani-rear-party-v31.webp?v=20261101a',art=>{rearBitmap=art;},true),
      loadIllustration('./art/forest-battleground-v04.webp?v=20261031d',art=>{fieldBitmap=art;}),
      loadIllustration('./art/forest-monsters-v14-clean.webp?v='+ART_VERSION,art=>{monsterBitmap=art;},true),
      // Ten separately painted impact poses on one compact transparent 5×2 WebP.
      // Optional: failed loading leaves the existing bounded Canvas reactions intact.
      loadIllustration('./art/forest-monsters-hurt-clean-v49.webp?v=20261104v49b',art=>{monsterHurtBitmap=art;}),
      loadIllustration('./art/fort-hud-v14.webp?v='+ART_VERSION,art=>{fortBitmap=art;}),
      loadIllustration('./art/mushroom-colossus-attack-v19.webp?v=20261101d',art=>{mushroomAttackBitmap=art;}),
      loadIllustration('./art/rani-element-spells-v38.png?v=20261103a',art=>{elementSpellBitmap=art;}),
      loadIllustration('./art/rani-fox-rear-attack-v41.png?v=20261103v41',art=>{foxAttackBitmap=art;}),
      // Optional 4×2 WebP sheets: a failed request keeps the existing Canvas motion.
      loadIllustration('./art/rani-bear-attack-v44.webp?v=20261103v44a',art=>{heroAttackBitmaps.bear=art;}),
      loadIllustration('./art/rani-rabbit-attack-v44.webp?v=20261103v44a',art=>{heroAttackBitmaps.rabbit=art;}),
      loadIllustration('./art/rani-cat-attack-v44.webp?v=20261103v44a',art=>{heroAttackBitmaps.cat=art;}),
      loadIllustration('./art/rani-megafox-attack-v44.webp?v=20261103v44a',art=>{heroAttackBitmaps.megafox=art;}),
      loadIllustration('./art/painted-rampart-front-v24.webp?v=20261101j',art=>{rampartBitmap=art;},true)
    ]);
    const biome=Math.floor(stageIndex/4);
    if(!biomeLoading[biome])biomeLoading[biome]=loadIllustration('./art/'+biomeFiles[biome]+'?v=20261031i',art=>{biomeBitmaps[biome]=art;},true);
    const chapterArt=CHAPTER_BOSS_ART[stageIndex];
    const bossLoad=chapterArt&&!chapterBossBitmaps[stageIndex]?
      loadIllustration('./art/'+chapterArt.file+'?v=20261106v52',art=>{chapterBossBitmaps[stageIndex]=art;}):Promise.resolve(true);
    const sentinelLoad=stageIndex<4&&!forestSentinelBitmap?
      loadIllustration('./art/chapter1-forest-sentinel-v52.webp?v=20261106v52',art=>{forestSentinelBitmap=art;}):Promise.resolve(true);
    await Promise.all([atlasPromise,biomeLoading[biome],bossLoad,sentinelLoad]);
    // Keep an illustrated battle playable when a high-resolution regional PNG times out.
    // Never substitute a CSS rectangle or sacrifice the rear-view hero silhouette.
    const ready=!!(atlasBitmap&&rearBitmap&&monsterBitmap&&rampartBitmap&&(biomeBitmaps[biome]||fieldBitmap));
    if(!ready){atlasPromise=null;biomeLoading[biome]=null;}
    return ready;
  }
  let closeBannerTimer = 0, chosenSlot = -1, historyInitialized = false;
  function save() {
    try { localStorage.setItem(SAVE_KEY,JSON.stringify({unlocked:state.unlocked,clears:state.clears,best:state.best,stats:state.stats})); }
    catch(_e) { /* Play remains available without persistent storage. */ }
  }
  function button(label, onClick, variant) {
    const b = document.createElement('button'); b.type='button'; b.textContent=label;
    b.className='modal-action'+(variant==='alt'?' alt':''); b.addEventListener('click',onClick); return b;
  }
  function setVisible(id,show) { $(id).hidden=!show; }
  let viewedChapter=Math.floor(state.selected/4);
  function showMapChapter(chapter){
    viewedChapter=Math.max(0,Math.min(2,chapter|0));
    const chapterStart=viewedChapter*4;
    if(chapterStart<state.unlocked&&Math.floor(state.selected/4)!==viewedChapter){
      state.selected=chapterStart;
      updateMenuStory();
    }
    renderMap();
  }
  function renderMap() {
    $('stage-select-panel').dataset.chapter=String(viewedChapter+1);
    const grid=$('stage-grid'); grid.replaceChildren();
    document.querySelectorAll('#stage-chapter-tabs .stage-chapter-tab').forEach((tab,index)=>{
      const selected=index===viewedChapter;
      tab.classList.toggle('active',selected);
      tab.setAttribute('aria-pressed',selected?'true':'false');
    });
    STAGES.forEach((stage,index)=>{
      const b=document.createElement('button'); b.type='button';
      const locked = index>=state.unlocked, cleared=state.clears.includes(index);
      b.hidden=Math.floor(index/4)!==viewedChapter;
      b.className='stage-tile'+(locked?' locked':'')+(cleared?' cleared':'')+(state.selected===index?' selected':'')+(index%4===3?' boss':'');
      const spot=STAGE_SPOTS[index];b.style.setProperty('--spot-x',spot[0]+'%');b.style.setProperty('--spot-y',spot[1]+'%');
      b.disabled=locked;
      const n=document.createElement('span'); n.className='num'; n.textContent=locked?'':(stage.chapter+'-'+((index%4)+1));
      if(locked)V.setIcon(n,'lock');
      if(cleared){const star=document.createElement('i');star.className='clear-star';V.setIcon(star,'star');b.appendChild(star);}
      const small=document.createElement('span'); small.className='tiny'; small.textContent=locked?'잠김':(index%4===3?'우두머리':cleared?'완료':'도전');
      const art=document.createElement('span');art.className='stage-tile-art';
      art.style.backgroundImage="url('./art/"+biomeFiles[Math.floor(index/4)]+"')";
      art.style.backgroundPosition=['center 19%','left 48%','right 64%','center 86%'][index%4];
      const name=document.createElement('span');name.className='stage-list-name';name.textContent=stage.name;
      const summary=document.createElement('span');summary.className='stage-tile-summary';
      summary.textContent=locked?'앞 스테이지 클리어 후 열림':stage.gimmick;
      b.append(art,n,name,summary,small); b.setAttribute('aria-label',stage.name+(locked?' 잠김':' 선택'));
      b.addEventListener('click',()=>{state.selected=index;renderMap();updateMenuStory();});
      grid.prepend(b);
    });
    // Chapter map: functional painted badges over continuous artwork, no blank nodes.
    const pins=$('stage-map-pins');pins.replaceChildren();
    const chapter=viewedChapter;
    // Trail begins at the village below and climbs to the chapter boss.
    const positions=[[52,81],[32,60],[68,39],[53,18]];
    for(let chapterIndex=0;chapterIndex<4;chapterIndex++){
      const index=chapter*4+chapterIndex,stage=STAGES[index];
      const locked=index>=state.unlocked,cleared=state.clears.includes(index);
      const pin=document.createElement('button');pin.type='button';
      pin.className='stage-path-pin'+(locked?' locked':'')+
        (cleared?' cleared':'')+(state.selected===index?' active':'');
      pin.style.left=positions[chapterIndex][0]+'%';
      pin.style.top=positions[chapterIndex][1]+'%';
      pin.disabled=locked;
      pin.setAttribute('aria-label',stage.chapter+'-'+(chapterIndex+1)+' '+stage.name+(locked?' 잠김':''));
      const art=document.createElement('span');art.className='stage-pin-art';
      V.setIcon(art,locked?'lock':cleared?'star':chapterIndex===3?'target':'play');
      const num=document.createElement('span');num.className='stage-pin-number';
      num.textContent=stage.chapter+'-'+(chapterIndex+1);
      pin.append(art,num);
      pin.addEventListener('click',()=>{state.selected=index;renderMap();updateMenuStory();});
      pins.prepend(pin);
    }
    $('progress-label').textContent=state.clears.length+' / 12 클리어';
    const selectedInChapter=Math.floor(state.selected/4)===viewedChapter;
    const stage=STAGES[selectedInChapter?state.selected:viewedChapter*4];
    const canEnter=selectedInChapter&&state.selected<state.unlocked;
    $('stage-map-number').textContent='제'+(viewedChapter+1)+'장';
    $('stage-picker-chapter').textContent='제'+stage.chapter+'장 · '+stage.gimmick;
    $('stage-picker-name').textContent=stage.name;
    $('stage-picker-tip').textContent=canEnter?stage.story:'이전 숲길을 클리어하면 열립니다.';
    $('stage-enter-btn').disabled=!canEnter;
    $('stage-enter-btn').textContent=canEnter?'출전':'잠김';
  }
  function openStagePicker(){
    $('stage-select-panel').hidden=false;
    $('menu').classList.add('stage-choosing');
    viewedChapter=Math.floor(state.selected/4);
    renderMap();
    $('stage-back-btn').focus({preventScroll:true});
  }
  function closeStagePicker(){
    $('stage-select-panel').hidden=true;
    $('menu').classList.remove('stage-choosing');
  }
  function updateMenuStory(){
    const stage=STAGES[state.selected], box=document.querySelector('.story-panel');
    box.querySelector('.story-chapter').textContent='제'+stage.chapter+'장 · '+stage.gimmick;
    box.querySelector('h2').textContent=stage.name;
    box.querySelector('p').textContent=stage.story;
    $('home-stage-title').textContent=stage.chapter+'-'+((state.selected%4)+1)+' · '+stage.name;
    $('home-stage-story').textContent=stage.story;
    $('start-btn').firstChild.textContent='시작 ';
    $('resume-btn').hidden=!suspended;
  }
  function showMenu(preserve) {
    if(preserve && battle && !battle.ended) {
      suspended=true; battle.manualPause=true;
    } else {
      suspended=false;
      if(game){game.destroy(true);game=null;battle=null;}
    }
    closeModal(true);closeStagePicker();
    setVisible('menu',true); setVisible('game-screen',false);
    renderMap(); updateMenuStory();
  }
  function resumeBattle(){
    if(!suspended || !battle){startStage(state.selected);return;}
    setVisible('menu',false);setVisible('game-screen',true);
    suspended=false;battle.manualPause=false;renderHUD();
  }
  async function startStage(index){
    if(index>=state.unlocked||starting)return;
    starting=true;
    $('start-btn').disabled=true;
    $('start-btn').firstChild.textContent='준비 중 ';
    let backgroundReady=false;
    try{backgroundReady=await prepareAtlas(index);}
    catch(error){console.error('전장 원화 준비 오류:',error);backgroundReady=false;}
    finally{
      starting=false;
      $('start-btn').disabled=false;
      updateMenuStory();
    }
    if(!backgroundReady){
      showModal('원화 로딩 문제','숲 원화를 불러오지 못했어요','임시 도형 배경을 보여주는 대신 로딩을 중단했어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.',[],
        [button('다시 시도',()=>{closeModal(true);startStage(index);})],true);
      return;
    }
    if(game){game.destroy(true);game=null;battle=null;}
    closeStagePicker();
    state.selected=index; suspended=false;chosenSlot=-1;
    setVisible('menu',false);setVisible('game-screen',true);
    $('stage-name').textContent=STAGES[index].name; $('wave-label').textContent='전투 준비';
    const root=$('game-root');root.replaceChildren();
    const boot=$('battle-loading');boot.hidden=false;
    const image=biomeBitmaps[Math.floor(index/4)]||fieldBitmap;
    // No duplicate background outside Phaser: avoid the side-by-side panorama seam.
    $('arena-wrap').style.backgroundImage='none';
    boot.style.backgroundImage="linear-gradient(#071b16a8,#183e3085),url('"+image.src+"')";
    if(typeof Phaser==='undefined'){
      showModal('연결 확인','게임 엔진을 불러오지 못했어요.','인터넷 연결 후 다시 시도해 주세요.',[],[
        button('모험 지도로',()=>showMenu(false))],false);return;
    }
    pendingStageIndex=index;
    game=new Phaser.Game({
      type:Phaser.AUTO,parent:'game-root',width:420,height:650,
      backgroundColor:'#172d21',render:{pixelArt:false,antialias:true},
      scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER,width:420,height:650},
      scene:[ForestBattle]
    });
    // Stage selection is passed through pendingStageIndex to avoid boot timing races.
  }
  function showBanner(message){
    const b=$('wave-banner');b.textContent=message;b.classList.add('show');
    clearTimeout(closeBannerTimer);closeBannerTimer=setTimeout(()=>b.classList.remove('show'),1400);
  }
  function showModal(kicker,title,description,contents,actions,allowClose){
    activeModal={kicker,title,description,allowClose:allowClose!==false};
    focusBeforeModal=document.activeElement;
    $('modal-kicker').textContent=kicker;$('modal-title').textContent=title;
    $('modal-description').textContent=description;
    $('modal-body').replaceChildren(...contents);$('modal-actions').replaceChildren(...actions);
    $('modal-close').hidden=!activeModal.allowClose;
    $('modal-box').classList.toggle('recruit-dialog',kicker==='첫 번째 공세 완료');
    $('modal-box').classList.toggle('growth-dialog',title==='성장의 순간!');
    $('modal-box').classList.toggle('result-dialog',kicker==='방어 성공'||kicker==='재도전');
    $('modal-box').classList.toggle('result-win',kicker==='방어 성공');
    $('modal-layer').hidden=false;
    requestAnimationFrame(()=>{const el=$('modal-box').querySelector('button');if(el)el.focus();});
  }
  function closeModal(force){
    if(activeModal && !activeModal.allowClose && !force)return;
    activeModal=null;$('modal-layer').hidden=true;
    if(focusBeforeModal && typeof focusBeforeModal.focus==='function')focusBeforeModal.focus();
    if(battle)renderHUD();
  }

  // Preview-grade victory screen assembled from real game artwork and earned battle data.
  function makeResultPresentation(win,stage,hp,maxHP,coins,party,streak){
    const root=document.createElement('div');root.className='result-presentation';
    const ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHP)));
    const rating=win?(ratio>=.8?3:ratio>=.45?2:1):0;
    const stars=document.createElement('div');stars.className='result-stars';
    stars.setAttribute('role','img');stars.setAttribute('aria-label',win?'별 '+rating+'개 획득':'방어 실패');
    for(let i=0;i<3;i++){
      const mark=document.createElement('span');mark.className='result-star'+(i<rating?' earned':'');
      V.setIcon(mark,'star');stars.appendChild(mark);
    }
    const scene=document.createElement('div');scene.className='result-hero-scene';
    const hero=document.createElement('span');hero.className='result-hero';V.portrait(hero,'fox');
    const banner=document.createElement('span');banner.className='result-hero-banner';
    banner.textContent=win?'숲길 방어 성공':'수비대 재정비';
    scene.append(hero,banner);
    const stats=document.createElement('div');stats.className='result-stats';
    for(const [icon,label,value] of [['coin','남은 별빛',coins+''],['shield','성벽 체력',
       Math.ceil(hp)+' / '+Math.ceil(maxHP)],['fox','함께한 영웅',party+'명']]){
      const item=document.createElement('div');item.className='result-stat';
      const art=document.createElement('span');art.className='result-stat-icon';V.setIcon(art,icon);
      const name=document.createElement('span');name.textContent=label;
      const amount=document.createElement('strong');amount.textContent=value;
      item.append(art,name,amount);stats.appendChild(item);
    }
    const message=document.createElement('p');message.className='result-note';
    message.textContent=win?'다음 숲길에도 동료들과 함께 나아가요!':
      '연속 실패 '+streak+'회 · 다시 도전하면 도움을 받을 수 있어요.';
    root.append(stars,scene,stats,message);
    return root;
  }
  function showIntel(){
    const stage=STAGES[state.selected];
    const first=stage.id%4===3?'boss':stage.elite;
    const companion=stage.id>=5?'crystal':stage.id>=2?'thorn':stage.id===0?'sprout':'runner';
    const types=[...new Set([first,companion,'spore','imp','shroom','guardian'])];
    const list=document.createElement('div');list.className='enemy-intel-list';
    types.forEach(type=>{
      const data=ENEMY_INTEL[type];
      const row=document.createElement('div');row.className='enemy-intel-row';
      const portrait=document.createElement('span');portrait.className='enemy-portrait '+type;portrait.setAttribute('aria-hidden','true');
      const info=document.createElement('div');info.className='enemy-intel-text';
      const name=document.createElement('strong');name.textContent=data.name;
      const trait=document.createElement('small');trait.textContent=data.trait;
      const counter=document.createElement('em');counter.textContent='대응: '+data.counter;
      info.append(name,trait,counter);row.append(portrait,info);list.appendChild(row);
    });
    showModal('정찰 수첩',stage.name+' · 적 정보',STAGE_TIPS[stage.id],[list],[
      button('알겠어',()=>closeModal(true))
    ],true);
  }
  function showHelp(){
    const el=document.createElement('div');el.className='howto';
    [['① 자동 전투','여우 궁수 1명으로 시작해 첫 공세를 막으면 동료를 골라요.'],['② 자리·표적 전술','용병을 누르고 다른 칸을 누르면 자리 교환, 같은 칸을 한 번 더 누르면 선두·위협 표적 변경!'],['③ 특별한 공격','일제사격 버튼이 밝아지면 눌러 몬스터를 한꺼번에 공격해요.'],['④ 강화 카드','첫 공세 뒤 동료를 영입하고, 두 공세마다 3개 강화 중 하나를 골라요.'],['⑤ 갈래 진화','진화 에너지 10개로 햇살 또는 달빛 계열을 선택해요.'],['⑥ 전장 대응','모험 지도에서 적 정보를 확인하고, 안개에는 추적·갑옷에는 관통을 선택해요.'],['⑦ 직접 집중 공격','위험한 몬스터를 터치하면 8초 동안 수비대가 그 적을 집중해서 공격해요.'],['⑧ 정예와 중간보스','3공세마다 정예가 등장하고 중반에는 수호자 중간보스가 나타나요.'],['⑨ 다시 도전','패배해도 이전에 깬 스테이지 기록은 남아요.']].forEach(row=>{
      const item=document.createElement('div');const strong=document.createElement('strong');strong.textContent=row[0];item.append(strong,document.createElement('br'),document.createTextNode(row[1]));el.appendChild(item);
    });
    showModal('수비대 안내','5초 만에 배우는 수비대','한 손으로도 충분해요!', [el],[button('좋아, 출발!',closeModal.bind(null,true))],true);
  }
  function showPause(){
    if(!battle||battle.ended)return;
    battle.manualPause=true;
    renderHUD();
    showModal('잠깐 쉬어가기','전투 일시정지','진행 상태는 그대로 유지돼요.',[],[
      button('계속하기',()=>{closeModal(true);battle.manualPause=false;}),
      button('모험 지도',()=>showMenu(true),'alt')
    ],true);
  }
  function confirmExit(){
    const wasPaused=battle?battle.manualPause:false;
    if(battle)battle.manualPause=true;
    showModal('숲에서 나가기','정말 나가시겠어요?','계속하기는 현재 진행 상태를 유지해요.',[],[
      button('계속하기',()=>{closeModal(true);if(battle)battle.manualPause=wasPaused;}),
      button('나가기',()=>{const ref=document.referrer;window.location.assign(ref&&/^https?:/i.test(ref)&&!ref.includes(location.host)?ref:HOME_URL);},'alt')
    ],true);
  }
  function navigateBack(){
    if(activeModal){
      if(activeModal.allowClose){
        const wasExit=activeModal.kicker==='숲에서 나가기';
        const wasPause=activeModal.kicker==='잠깐 쉬어가기';
        const wasEvolution=activeModal.kicker==='진화 선택';
        closeModal(true);if((wasExit||wasPause||wasEvolution) && battle && !suspended)battle.manualPause=false;
        if(battle&&battle.drafting)showBanner(battle.pendingRecruit?'아래 동료 선택을 눌러 계속하세요':'아래 강화 선택을 눌러 계속하세요');
        renderCooldown();
      }else{
        // End-of-run choices remain visible until the user selects a destination.
        showBanner('선택하면 계속할 수 있어요');
      }
    }else if(!$('game-screen').hidden){showMenu(true);}
    else confirmExit();
  }
  function setupHistory(){
    if(historyInitialized)return;
    historyInitialized=true;
    try{history.replaceState({forestGuard:true},'');history.pushState({forestGuardGuard:true},'','#forest-guard');}catch(_e){}
    window.addEventListener('popstate',()=>{navigateBack();try{history.pushState({forestGuardGuard:true},'','#forest-guard');}catch(_e){}});
    window.addEventListener('keydown',ev=>{if(ev.key==='Escape'||ev.key==='Backspace'){ev.preventDefault();navigateBack();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&battle&&!battle.ended)battle.autoPause=true;else if(battle)battle.autoPause=false;});
  }
  function createCanvasTexture(scene,key,width,height,paint){
    if(scene.textures.exists(key))return;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    paint(canvas.getContext('2d'),width,height);
    scene.textures.addCanvas(key,canvas);
  }
  // Paint a softly irregular stone plaque once per HP change; heroes overlap it in front.
  function paintFortPlaque(c,hp,maxHP){
    const w=328,h=59,ratio=Math.max(0,Math.min(1,hp/maxHP));
    c.clearRect(0,0,w,h);c.save();
    if(fortBitmap){
      c.drawImage(fortBitmap,0,0,w,h);
      c.fillStyle='rgba(29,31,24,.87)';c.fillRect(97,20,152,29);
      c.fillStyle='rgba(9,22,14,.88)';c.fillRect(102,26,141,11);
      c.fillStyle=ratio<.3?'#e98b62':'#7fba73';c.fillRect(104,28,137*ratio,7);
      c.lineWidth=1;c.strokeStyle='#f0d5a3';c.strokeRect(102.5,26.5,140,10);
      c.textAlign='center';c.font='900 11px system-ui';c.textBaseline='middle';
      c.shadowColor='#1c271a';c.shadowBlur=3;c.fillStyle='#fff0cb';
      c.fillText('성벽 '+Math.ceil(hp)+' / '+Math.ceil(maxHP),170,43);
      c.restore();return;
    }
    c.shadowColor='rgba(9,22,16,.8)';c.shadowBlur=8;c.shadowOffsetY=5;
    c.beginPath();c.moveTo(22,9);c.quadraticCurveTo(50,2,94,6);
    c.lineTo(246,6);c.quadraticCurveTo(280,3,307,9);
    c.quadraticCurveTo(327,21,310,47);c.quadraticCurveTo(240,56,160,52);
    c.quadraticCurveTo(72,56,17,47);c.quadraticCurveTo(0,28,22,9);c.closePath();
    const stone=c.createLinearGradient(0,4,0,55);
    stone.addColorStop(0,'#c5b79b');stone.addColorStop(.3,'#807b6d');
    stone.addColorStop(.65,'#565a51');stone.addColorStop(1,'#353e37');
    c.fillStyle=stone;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
    c.strokeStyle='#463f2d';c.lineWidth=3;c.stroke();
    c.strokeStyle='rgba(246,224,167,.62)';c.lineWidth=1.4;
    c.beginPath();c.moveTo(25,13);c.quadraticCurveTo(165,7,303,13);c.stroke();
    for(let i=0;i<38;i++){const x=27+((i*73)%275),y=14+((i*29)%33);
      c.fillStyle=i%3===0?'rgba(229,215,180,.16)':'rgba(27,42,32,.24)';
      c.fillRect(x,y,i%5+2,1+i%3);}
    c.fillStyle='#302c26';c.fillRect(78,25,198,15);
    c.fillStyle='#d6c6a0';c.fillRect(79,26,196,2);
    const bar=c.createLinearGradient(0,28,0,40);
    if(ratio<.3){bar.addColorStop(0,'#ffab81');bar.addColorStop(1,'#aa3b38');}
    else{bar.addColorStop(0,'#cbea9c');bar.addColorStop(1,'#4e9260');}
    c.fillStyle=bar;c.fillRect(80,29,194*ratio,9);
    c.font='900 12px sans-serif';c.fillStyle='#f8e6b5';c.textBaseline='middle';
    c.shadowColor='#20291d';c.shadowBlur=3;c.fillText('성벽',29,32);
    c.textAlign='right';c.fillText(Math.ceil(hp)+' / '+Math.ceil(maxHP),294,49);c.shadowBlur=0;
    c.strokeStyle='rgba(120,87,44,.9)';c.lineWidth=3;
    c.beginPath();c.moveTo(21,20);c.quadraticCurveTo(8,32,24,43);
    c.moveTo(302,19);c.quadraticCurveTo(320,28,301,44);c.stroke();c.restore();
  }
  function blob(c,x,y,rx,ry,color,stroke){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}
  }
  function poly(c,points,color,stroke){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);points.slice(1).forEach(p=>c.lineTo(p[0],p[1]));
    c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}
  }
  function paintHero(c,w,h,type){
    c.clearRect(0,0,w,h);const dark='#46362d';
    blob(c,48,83,22,5,'#243d2b77');
    if(type==='fox'){
      blob(c,48,65,22,24,'#5b8153',dark);blob(c,48,70,13,17,'#dfd8a4');
      poly(c,[[20,30],[29,3],[44,25]],'#c86b38',dark);poly(c,[[52,25],[68,3],[77,30]],'#c86b38',dark);
      poly(c,[[27,27],[30,12],[39,26]],'#efb6a1');poly(c,[[57,26],[68,12],[70,27]],'#efb6a1');
      blob(c,48,38,27,24,'#e99551',dark);blob(c,48,50,17,10,'#f9e5be');
      blob(c,40,36,3,4,dark);blob(c,57,36,3,4,dark);blob(c,49,48,3,2,'#6d412d');
      c.strokeStyle='#9b5633';c.lineWidth=4;c.beginPath();c.moveTo(77,37);c.quadraticCurveTo(90,57,75,79);c.stroke();
      c.strokeStyle='#f5d99a';c.lineWidth=3;c.beginPath();c.moveTo(77,35);c.lineTo(77,80);c.stroke();
      blob(c,48,75,8,3,'#cf814b');
    }else if(type==='bear'){
      blob(c,47,65,26,24,'#bd6e43',dark);blob(c,49,70,17,14,'#e1b57d');
      blob(c,28,24,12,12,'#9d5b39',dark);blob(c,69,24,12,12,'#9d5b39',dark);
      blob(c,48,38,27,24,'#bf804d',dark);blob(c,48,51,13,10,'#e5bf8b');
      blob(c,39,37,3,4,dark);blob(c,57,37,3,4,dark);blob(c,48,49,4,3,dark);
      poly(c,[[25,59],[66,56],[73,77],[26,80]],'#bd4c43',dark);
      blob(c,22,66,18,21,'#b5c9bd',dark);blob(c,22,66,12,15,'#e2efe0');blob(c,22,66,5,7,'#7a8f81');
    }else{
      blob(c,48,65,23,23,'#7bb5d0',dark);
      blob(c,35,23,9,22,'#f1ece2',dark);blob(c,61,22,9,22,'#f1ece2',dark);
      blob(c,35,23,4,14,'#e6b1b5');blob(c,61,22,4,14,'#e6b1b5');
      blob(c,48,40,27,24,'#f7eee1',dark);blob(c,40,38,3,4,dark);blob(c,57,38,3,4,dark);
      blob(c,48,49,3,3,'#d18f94');blob(c,48,67,12,14,'#a2d8e1');
      c.strokeStyle='#84593c';c.lineWidth=6;c.beginPath();c.moveTo(78,81);c.lineTo(81,23);c.stroke();
      blob(c,81,18,9,10,'#b5edff');blob(c,81,18,4,4,'#f9fdff');
    }
    blob(c,40,86,8,5,'#5c4a35');blob(c,59,86,8,5,'#5c4a35');
  }
  function paintEnemy(c,w,h,type){
    c.clearRect(0,0,w,h);const outline='#473c2a';
    blob(c,48,78,20,5,'#28371b55');
    if(type==='runner'){
      blob(c,48,65,15,19,'#f5d6a6',outline);blob(c,48,38,27,17,'#d94e46',outline);
      [31,44,61].forEach((x,i)=>blob(c,x,35+(i%2)*3,4,3,'#ffeabd'));
      blob(c,43,59,3,4,outline);blob(c,55,59,3,4,outline);
    }else if(type==='brute'||type==='boss'){
      const big=type==='boss', color=big?'#7c5f51':'#68774c';
      blob(c,48,60,big?38:29,big?32:26,color,outline);
      poly(c,[[20,48],[15,17],[39,36]],big?'#9b7760':'#7a8a59',outline);
      poly(c,[[58,36],[82,16],[79,49]],big?'#9b7760':'#7a8a59',outline);
      blob(c,36,53,5,5,'#f5d36b');blob(c,61,53,5,5,'#f5d36b');
      blob(c,36,53,2,3,outline);blob(c,61,53,2,3,outline);
      if(big){blob(c,48,24,17,11,'#c5a373',outline);poly(c,[[38,22],[47,2],[56,22]],'#d7bc70',outline);}
    }else{
      blob(c,48,63,24,23,'#77ab64',outline);blob(c,48,72,18,10,'#9bc87d');
      poly(c,[[28,51],[19,37],[37,44]],'#6e9d57',outline);poly(c,[[58,44],[78,37],[68,51]],'#6e9d57',outline);
      blob(c,40,55,4,4,outline);blob(c,57,55,4,4,outline);blob(c,48,66,7,4,'#5e7950');
      blob(c,48,38,12,6,'#a6d688');
    }
    blob(c,36,84,8,5,'#4b5440');blob(c,60,84,8,5,'#4b5440');
  }
  function buildTextures(scene){
    createCanvasTexture(scene,'fort-plaque',328,59,c=>paintFortPlaque(c,3000,3000));
    // Independent transparent stone wall from a NEW game illustration, not a field crop.
    createCanvasTexture(scene,'painted-rampart-front',420,60,c=>c.drawImage(rampartBitmap,0,0,420,60));
    createCanvasTexture(scene,'field',420,650,(c,w,h)=>{
      const scenery=biomeBitmaps[Math.floor(scene.stage.id/4)]||fieldBitmap;
      if(!scenery)throw new Error('Illustrated background missing: '+scene.stage.id);
      const iw=scenery.naturalWidth,ih=scenery.naturalHeight;
      const scale=Math.max(w/iw,h/ih),cw=w/scale,ch=h/scale;
      c.drawImage(scenery,(iw-cw)/2,(ih-ch)/2,cw,ch,0,0,w,h);
      // Four stage moods per original illustrated biome; no rectangular joins.
      const tint=['rgba(255,215,129,0)','rgba(248,229,116,.035)','rgba(101,162,104,.065)','rgba(82,51,98,.10)',
        'rgba(196,215,202,.07)','rgba(60,112,127,.055)','rgba(152,180,111,.055)','rgba(65,78,107,.12)',
        'rgba(113,119,172,.045)','rgba(91,157,211,.075)','rgba(50,57,107,.12)','rgba(62,37,91,.16)'][scene.stage.id];
      c.fillStyle=tint;c.fillRect(0,0,w,h);
    });
    // The painted field already contains the castle. Never paint its lower half twice.
    // Edge-free soft shadow under the illustrated boss cut-in, drawn once per battle.
    createCanvasTexture(scene,'cinematic-vignette',420,380,(ctx)=>{
      const grad=ctx.createRadialGradient(210,186,25,210,186,247);
      grad.addColorStop(0,'rgba(8,25,19,.8)');
      grad.addColorStop(.46,'rgba(8,25,19,.53)');
      grad.addColorStop(.82,'rgba(8,25,19,.14)');
      grad.addColorStop(1,'rgba(8,25,19,0)');
      ctx.fillStyle=grad;ctx.fillRect(0,0,420,380);
    });
    createCanvasTexture(scene,'torch-glow',72,72,(ctx)=>{
      const glow=ctx.createRadialGradient(36,36,2,36,36,35);
      glow.addColorStop(0,'rgba(255,249,173,.83)');
      glow.addColorStop(.26,'rgba(255,196,90,.51)');
      glow.addColorStop(.6,'rgba(240,110,48,.15)');
      glow.addColorStop(1,'rgba(240,110,48,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,72,72);
    });
    // Hand-inked root projectile: painted Canvas, never a CSS shape or SVG.
    createCanvasTexture(scene,'boss-root-spear',56,154,c=>{
      c.lineJoin='round';c.lineCap='round';
      c.beginPath();c.moveTo(28,150);c.bezierCurveTo(8,108,15,73,25,37);
      c.bezierCurveTo(30,18,30,7,28,3);c.bezierCurveTo(39,36,45,85,31,129);
      c.closePath();c.fillStyle='#635039';c.fill();c.strokeStyle='#c5aa71';c.lineWidth=2;c.stroke();
      for(const [x,y,endX,endY] of [[23,86,3,62],[34,105,53,78],[26,59,7,39]]){
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(endX+4,endY+14,endX,endY);
        c.strokeStyle='#967b4e';c.lineWidth=5;c.stroke();
        c.strokeStyle='#c5ab77';c.lineWidth=1.5;c.stroke();
      }
      c.beginPath();c.moveTo(25,54);c.bezierCurveTo(34,71,25,91,34,108);
      c.strokeStyle='#b4d37e';c.lineWidth=2;c.stroke();
    });
    // Strip only opaque gray backing connected to atlas cell edges. This
    // leaves enclosed armor/stone details intact, with a feathered outline.
    const isolateEnemyBackdrop=(c,w,h)=>{
      const image=c.getImageData(0,0,w,h),pixels=image.data;
      const corner=[0,w-1,(h-1)*w,h*w-1];
      const colors=corner.map(i=>Array.from(pixels.slice(i*4,i*4+3)));
      const bg=colors[0].map((_,k)=>Math.round(colors.reduce((s,r)=>s+r[k],0)/4));
      if(colors.some(v=>v.some((value,k)=>Math.abs(value-bg[k])>42)))return;
      const similar=at=>{
        const d=Math.abs(pixels[at]-bg[0])+Math.abs(pixels[at+1]-bg[1])+Math.abs(pixels[at+2]-bg[2]);
        return pixels[at+3]>0&&d<78&&
          Math.max(Math.abs(pixels[at]-bg[0]),Math.abs(pixels[at+1]-bg[1]),Math.abs(pixels[at+2]-bg[2]))<36;
      };
      const total=w*h,visited=new Uint8Array(total),queue=new Int32Array(total);
      let head=0,tail=0;
      const offer=i=>{if(!visited[i]&&similar(i*4)){visited[i]=1;queue[tail++]=i;}};
      for(let x=0;x<w;x++){offer(x);offer((h-1)*w+x);}
      for(let y=0;y<h;y++){offer(y*w);offer(y*w+w-1);}
      if(tail<Math.round((w+h)*.6))return;
      while(head<tail){
        const i=queue[head++],x=i%w,y=(i/w)|0;
        if(x>0)offer(i-1);if(x<w-1)offer(i+1);
        if(y>0)offer(i-w);if(y<h-1)offer(i+w);
      }
      for(let i=0;i<total;i++){
        const off=i*4;
        if(visited[i]){pixels[off+3]=0;continue;}
        const x=i%w,y=(i/w)|0;
        const adjacent=(x>0&&visited[i-1])||(x<w-1&&visited[i+1])||
          (y>0&&visited[i-w])||(y<h-1&&visited[i+w]);
        if(!adjacent)continue;
        const deviation=Math.abs(pixels[off]-bg[0])+Math.abs(pixels[off+1]-bg[1])+Math.abs(pixels[off+2]-bg[2]);
        if(deviation<126)pixels[off+3]=Math.min(pixels[off+3],Math.max(40,Math.round((deviation-48)/78*255)));
      }
      c.putImageData(image,0,0);
    };
    const atlasCell=(c,w,h,idx)=>{
      const cw=atlasBitmap.naturalWidth/4,ch=atlasBitmap.naturalHeight/2;
      c.drawImage(atlasBitmap,(idx%4)*cw,Math.floor(idx/4)*ch,cw,ch,0,0,w,h);
    };
    Object.keys(HEROES).filter(type=>type!=='megafox').forEach(type=>createCanvasTexture(scene,'hero-'+type,128,128,(c,w,h)=>{
      if(atlasBitmap)atlasCell(c,w,h,{fox:0,bear:1,rabbit:2,cat:3}[type]);else paintHero(c,w,h,type);
    }));
    // Render the defenders from behind, facing the approaching monsters at the top.
    // The five figures are isolated without stretching the original proportions.
    if(rearBitmap){
      const cutouts={
        fox:[0,0,445,682],bear:[445,0,400,682],rabbit:[845,0,385,682],
        cat:[1230,0,395,682],megafox:[1615,0,433,682]
      };
      const scaleX=rearBitmap.naturalWidth/2048,scaleY=rearBitmap.naturalHeight/682;
      for(const [id,part] of Object.entries(cutouts)){
        createCanvasTexture(scene,'hero-rear-'+id,128,128,(c)=>{
          const [sx,sy,sw,sh]=part;
          const width=sw*scaleX,height=sh*scaleY;
          const ratio=Math.min(120/width,124/height);
          const dw=width*ratio,dh=height*ratio;
          c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
          c.drawImage(rearBitmap,sx*scaleX,sy*scaleY,width,height,(128-dw)/2,128-dh,dw,dh);
        });
      }
    }
    ['sprout','runner','brute','boss'].forEach(type=>createCanvasTexture(scene,'enemy-'+type,128,128,(c,w,h)=>{
      if(atlasBitmap){
        atlasCell(c,w,h,{sprout:4,runner:5,brute:6,boss:7}[type]);
        isolateEnemyBackdrop(c,w,h);V.cleanEnemyFrame(c,w,h);
      }
      else paintEnemy(c,w,h,type);
    }));
    Object.entries({thorn:0,spore:1,imp:2,crystal:3,shroom:4,guardian:5}).forEach(([type,i])=>createCanvasTexture(scene,'enemy-'+type,128,128,(c,w,h)=>{
      if(monsterBitmap){
        const tw=monsterBitmap.naturalWidth/3,th=monsterBitmap.naturalHeight/2;
        c.drawImage(monsterBitmap,(i%3)*tw,Math.floor(i/3)*th,tw,th,0,0,w,h);
        isolateEnemyBackdrop(c,w,h);V.cleanEnemyFrame(c,w,h);
      }else paintEnemy(c,w,h,['thorn','spore','imp'].includes(type)?'sprout':type==='crystal'?'brute':'boss');
    }));
    for(let i=0;i<8;i++)createCanvasTexture(scene,'evo-'+i,128,128,(c,w,h)=>{
      if(evolutionBitmap){const cw=evolutionBitmap.naturalWidth/4,ch=evolutionBitmap.naturalHeight/2;
        c.drawImage(evolutionBitmap,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,w,h);
      }else paintHero(c,w,h,'fox');
    });
    // v3.9: crop the existing transparent 2x2 painting once per scene; no SVG.
    if(elementSpellBitmap){
      const side=Math.min(elementSpellBitmap.naturalWidth,elementSpellBitmap.naturalHeight)/2;
      for(const [element,index] of [['forest',0],['frost',1],['stone',2],['flame',3]]){
        createCanvasTexture(scene,'element-cue-'+element,128,128,ctx=>{
          ctx.drawImage(elementSpellBitmap,(index%2)*side,Math.floor(index/2)*side,
            side,side,0,0,128,128);
        });
      }
    }
    // Reusable illustration-like elemental fragments, painted once per battle on Canvas.
    for(const [element,core,rim] of [
      ['leaf','#91bb5e','#e9df9b'],['crystal','#69d1ee','#e3faff'],
      ['spore','#eab06a','#fff0b1'],['stone','#aa9479','#e9d5b7']]){
      createCanvasTexture(scene,'shard-'+element,56,56,ctx=>{
        ctx.save();ctx.translate(28,28);
        ctx.shadowColor=rim;ctx.shadowBlur=8;ctx.fillStyle=core;ctx.strokeStyle=rim;ctx.lineWidth=2;
        ctx.beginPath();
        if(element==='leaf'){ctx.moveTo(-19,7);ctx.quadraticCurveTo(-8,-21,17,-14);ctx.quadraticCurveTo(14,12,-15,18);ctx.closePath();}
        else if(element==='crystal'){ctx.moveTo(-3,-22);ctx.lineTo(16,-10);ctx.lineTo(9,18);ctx.lineTo(-14,10);ctx.closePath();}
        else if(element==='spore'){ctx.ellipse(0,0,14,15,0,0,Math.PI*2);}
        else{ctx.moveTo(-19,-7);ctx.lineTo(-6,-18);ctx.lineTo(18,-12);ctx.lineTo(12,17);ctx.lineTo(-16,12);ctx.closePath();}
        ctx.fill();ctx.stroke();ctx.restore();
      });
    }
    createCanvasTexture(scene,'bolt',32,32,(c)=>{blob(c,16,16,10,5,'#ffd47e','#9b6b3a');blob(c,18,14,5,3,'#fff1b1');});
    createCanvasTexture(scene,'frostbolt',32,32,(c)=>{blob(c,16,16,10,8,'#80d9f5','#477f9f');blob(c,13,12,5,4,'#e4faff');});

    // v1.0: five individually painted Canvas weapons. Each image points right.
    const paintShot=(c,kind)=>{
      c.save();c.translate(32,32);c.lineCap='round';c.lineJoin='round';
      const gold=kind==='megafox', frost=kind==='rabbit', bomb=kind==='cat', heavy=kind==='bear';
      if(frost){
        const glow=c.createRadialGradient(0,0,2,0,0,28);
        glow.addColorStop(0,'rgba(240,255,255,.95)');glow.addColorStop(.42,'rgba(85,216,255,.62)');glow.addColorStop(1,'rgba(72,160,255,0)');
        c.fillStyle=glow;c.beginPath();c.arc(0,0,28,0,Math.PI*2);c.fill();
        c.fillStyle='#3b9fc7';c.strokeStyle='#d9fcff';c.lineWidth=2;
        c.beginPath();c.moveTo(-21,0);c.lineTo(-4,-12);c.lineTo(19,0);c.lineTo(-4,12);c.closePath();c.fill();c.stroke();
        c.fillStyle='#efffff';c.beginPath();c.moveTo(-3,-10);c.lineTo(19,0);c.lineTo(-3,2);c.closePath();c.fill();
      }else if(bomb){
        c.fillStyle='rgba(255,182,92,.23)';c.beginPath();c.arc(0,0,26,0,Math.PI*2);c.fill();
        c.fillStyle='#5b392b';c.strokeStyle='#f0c57e';c.lineWidth=3;c.beginPath();c.arc(0,3,15,0,Math.PI*2);c.fill();c.stroke();
        c.fillStyle='#b97d3f';c.beginPath();c.arc(-5,-3,5,0,Math.PI*2);c.fill();
        c.strokeStyle='#9f814f';c.lineWidth=4;c.beginPath();c.moveTo(5,-12);c.lineTo(10,-20);c.stroke();
        c.fillStyle='#fff3b4';c.beginPath();c.arc(11,-21,4,0,Math.PI*2);c.fill();
      }else{
        c.shadowColor=gold?'#ffe36b':heavy?'#ffc685':'#b2eb84';c.shadowBlur=gold?16:5;
        c.strokeStyle=heavy?'#7a4828':'#8c542b';c.lineWidth=heavy?6:4;c.beginPath();c.moveTo(-24,0);c.lineTo(14,0);c.stroke();
        c.strokeStyle='#f2d69d';c.lineWidth=2;c.beginPath();c.moveTo(-21,-1);c.lineTo(13,-1);c.stroke();
        c.fillStyle=heavy?'#dce1c9':gold?'#fff1a4':'#e5efd0';
        c.strokeStyle=heavy?'#7a7665':'#ad6d29';c.lineWidth=2;
        c.beginPath();c.moveTo(27,0);c.lineTo(heavy?7:11,-(heavy?10:7));c.lineTo(heavy?7:11,heavy?10:7);c.closePath();c.fill();c.stroke();
        c.shadowBlur=0;
        c.fillStyle=gold?'#ffe073':'#8ec36e';
        c.beginPath();c.moveTo(-22,0);c.lineTo(-30,-9);c.lineTo(-14,-3);c.closePath();c.fill();
        c.beginPath();c.moveTo(-22,0);c.lineTo(-30,9);c.lineTo(-14,3);c.closePath();c.fill();
        if(gold){c.strokeStyle='#fff8c7';c.lineWidth=2;c.beginPath();c.moveTo(-26,0);c.lineTo(27,0);c.stroke();}
      }
      c.restore();
    };
    for(const kind of ['fox','megafox','bear','rabbit','cat']){
      createCanvasTexture(scene,'shot-'+kind,64,64,c=>paintShot(c,kind));
      createCanvasTexture(scene,'trail-'+kind,96,28,c=>{
        const rgb=kind==='rabbit'?'112,222,254':kind==='cat'?'255,169,95':kind==='megafox'?'255,229,107':kind==='bear'?'244,215,163':'164,226,121';
        const glow=c.createLinearGradient(0,0,94,0);
        glow.addColorStop(0,'rgba('+rgb+',0)');glow.addColorStop(.54,'rgba('+rgb+',.14)');
        glow.addColorStop(.88,'rgba('+rgb+',.62)');glow.addColorStop(1,'rgba(255,255,229,.90)');
        c.fillStyle=glow;c.beginPath();c.moveTo(0,14);c.quadraticCurveTo(58,1,94,12);
        c.quadraticCurveTo(58,27,0,14);c.closePath();c.fill();
      });
    }
    V.build(scene);
    // v4.9: the middle hurt beats use independent species paintings, while the
    // entry/settle frames remain the original silhouette for seamless recovery.
    // Replacing existing Canvas keys does not increase the Phaser texture count.
    if(monsterHurtBitmap&&monsterHurtBitmap.naturalWidth>=500&&monsterHurtBitmap.naturalHeight>=200){
      const ids=['sprout','runner','brute','boss','thorn','spore','imp','crystal','shroom','guardian'];
      const cw=monsterHurtBitmap.naturalWidth/5,ch=monsterHurtBitmap.naturalHeight/2;
      for(const [index,id] of ids.entries()){
        const count=V.frameTotal(id,'hurt');
        for(let frame=1;frame<count-1;frame++){
          const key='motion-'+id+'-hurt-'+frame;
          if(scene.textures.exists(key))scene.textures.remove(key);
          createCanvasTexture(scene,key,128,128,c=>{
            const progress=frame/(count-1),impact=Math.sin(Math.PI*progress);
            const fit=Math.min(120/cw,120/ch),width=cw*fit,height=ch*fit;
            const direction=index%2===0?-1:1;
            c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
            c.save();c.translate(64+direction*impact*3.5,64-impact*2);
            c.rotate(direction*impact*.035);
            c.drawImage(monsterHurtBitmap,(index%5)*cw,Math.floor(index/5)*ch,
              cw,ch,-width/2,-height/2,width,height);
            c.restore();
            V.cleanEnemyFrame(c,128,128);
          });
        }
      }
    }
    // v4.4: swap in genuine species-specific, rear-facing 8-frame paintings.
    // Incomplete/missing optional art never breaks a battle or its Canvas fallback.
    const illustratedAttacks={fox:foxAttackBitmap,...heroAttackBitmaps};
    for(const [id,sheet] of Object.entries(illustratedAttacks)){
      if(!sheet||sheet.naturalWidth<4||sheet.naturalHeight<2)continue;
      const frameW=sheet.naturalWidth/4,frameH=sheet.naturalHeight/2;
      for(let frame=0;frame<8;frame++){
        const key='motion-'+id+'-attack-'+frame;
        if(scene.textures.exists(key))scene.textures.remove(key);
        createCanvasTexture(scene,key,128,128,c=>{
          c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
          // Every source cell is square; preserve the 4×2 artwork's aspect ratio.
          const fit=Math.min(128/frameW,128/frameH),dw=frameW*fit,dh=frameH*fit;
          c.drawImage(sheet,(frame%4)*frameW,Math.floor(frame/4)*frameH,
            frameW,frameH,(128-dw)/2,(128-dh)/2,dw,dh);
          V.cleanAttackFrame(c,128,128);
        });
      }
    }
    // The original painting has four distinct poses, but the elite motion
    // timeline has six beats. Reuse its return poses for beats 5/6 instead of
    // suddenly switching to unrelated generated artwork during recovery.
    const shroomAttackPose=[0,1,2,3,2,1];
    if(mushroomAttackBitmap)for(let frame=0;frame<shroomAttackPose.length;frame++){
      const key='motion-shroom-attack-'+frame;
      if(scene.textures.exists(key))scene.textures.remove(key);
      createCanvasTexture(scene,key,128,128,c=>{
        c.drawImage(mushroomAttackBitmap,shroomAttackPose[frame]*320,0,320,320,0,0,128,128);
        V.cleanEnemyFrame(c,128,128);
      });
    }
    // 2×2 original paintings become complete timed action sequences. In other
    // chapters, the existing midboss painter remains untouched as fallback.
    const applyFourPoseSheet=(type,sheet)=>{
      if(!sheet)return;
      const cw=sheet.naturalWidth/2,ch=sheet.naturalHeight/2;
      // 224px preserves the illustrated antlers/roots in the 216px cinematic;
      // compact fallback monsters still keep their existing 128px textures.
      const paintedFrameSize=224;
      const poses={idle:[0,0,0,0],run:[0,1,0,1],attack:[0,1,2,2,3,0],
        hurt:[0,3,3,1,0,0],death:[0,3,3,3,3,3],victory:[0,1,0,1]};
      for(const [motion,sequence] of Object.entries(poses))for(const [frame,pose] of sequence.entries()){
        const key='motion-'+type+'-'+motion+'-'+frame;
        if(scene.textures.exists(key))scene.textures.remove(key);
        createCanvasTexture(scene,key,paintedFrameSize,paintedFrameSize,c=>{
          const fit=Math.min((paintedFrameSize-8)/cw,(paintedFrameSize-8)/ch),w=cw*fit,h=ch*fit;
          const push=motion==='attack'&&frame>=2&&frame<=3?2:0;
          c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
          c.drawImage(sheet,(pose%2)*cw,Math.floor(pose/2)*ch,cw,ch,
            (paintedFrameSize-w)/2,(paintedFrameSize-h)/2-push,w,h);
          V.cleanEnemyFrame(c,paintedFrameSize,paintedFrameSize);
        });
      }
    };
    applyFourPoseSheet('boss',chapterBossBitmaps[scene.stage.id]);
    if(scene.stage.id<4)applyFourPoseSheet('guardian',forestSentinelBitmap);
  }
  class WaveDirector {
    // Adapted wave lifecycle from rupertgermann/tower-defence (MIT); custom fixed-wall rules.
    constructor(scene){this.scene=scene;this.current=0;this.spawned=0;this.count=0;this.tick=0;this.active=false;this.plan=[];this.themeLabel='';}
    begin(){
      if(this.current>=this.scene.stage.waves)return;
      this.current++;this.spawned=0;this.active=true;this.tick=500;
      this.count=4+this.current*2+Math.ceil(this.scene.stage.id*.55);
      // One-hero opening: 5–7 scouts, then a guaranteed tactical recruit.
      if(this.current===1)this.count=5+Math.min(2,Math.floor(this.scene.stage.id/4));
      if(this.isBoss())this.count=Math.floor(this.count*.7)+1;
      if(this.isMidBoss())this.count=Math.max(6,Math.floor(this.count*.78));
      if(this.isEliteWave())this.count=Math.max(5,Math.floor(this.count*.87));
      if(this.scene.stage.id===6&&this.current%3===0)this.count+=Math.ceil(this.count*.35);
      if(this.scene.stage.id===10&&this.current%4===0)this.count+=4;
      this.plan=this.makePlan();
      if(this.scene.ward){
        this.scene.wardCharges=Math.min(3,this.scene.ward+(this.scene.synergies.has('heartwood')?1:0));
        this.scene.hp=Math.min(this.scene.maxHP,this.scene.hp+35*this.scene.ward);
      }
      this.scene.waveStartHP=this.scene.hp;
      renderHUD();
      const hazard=this.scene.stage.id===6&&this.current%3===0?'포자 군단 급습!':this.scene.stage.id===10&&this.current%4===0?'달빛 아래 대공세!':null;
      showBanner(this.isMidBoss()?'중간보스 · 숲길 파수꾼 접근!':this.isEliteWave()?'정예 · 버섯 거한 등장!':hazard||(this.isBoss()?(CHAPTER_BOSS_ART[this.scene.stage.id]?.name||'뿌리 거인')+' 등장!':'제 '+this.current+'차 · '+this.themeLabel));
    }
    isBoss(){return this.current===this.scene.stage.waves && this.scene.stage.id%4===3;}
    isMidBoss(){return this.current===Math.max(4,Math.ceil(this.scene.stage.waves*.55));}
    isFinalElite(){return this.current===this.scene.stage.waves&&!this.isBoss();}
    isEliteWave(){return this.current>=3&&(this.current%3===0||this.isFinalElite())&&!this.isBoss()&&!this.isMidBoss();}
    makePlan(){
      // Curated enemy families give each chapter a recognizable rhythm without a scripted repeat.
      // The solo first wave deliberately avoids armor, summoners and dash attackers.
      const id=this.scene.stage.id,chapter=Math.floor(id/4);
      const profiles=[
        {sprout:65,runner:25,thorn:10},
        {sprout:31,runner:55,thorn:14},
        {sprout:32,runner:40,thorn:28},
        {sprout:38,runner:19,thorn:18,brute:25},
        {sprout:29,runner:29,spore:24,thorn:18},
        {sprout:18,runner:27,brute:35,crystal:20},
        {sprout:17,runner:29,spore:35,imp:19},
        {sprout:16,runner:21,brute:25,crystal:23,imp:15},
        {sprout:20,runner:39,thorn:26,imp:15},
        {sprout:16,runner:18,brute:25,crystal:34,spore:7},
        {sprout:14,runner:24,spore:24,imp:24,crystal:14},
        {sprout:14,runner:21,brute:23,crystal:22,imp:20}
      ];
      const signatures=['runner','runner','thorn','brute','spore','brute','spore','crystal','thorn','crystal','imp','imp'];
      const labels=['숲길 정찰','빠른 적 주의','갈라진 길','갑옷 짐승','포자 주의','단단한 적','포자 군단','수정 갑각','바람 속 돌파','수정 갑옷','혼합 공세','어둠의 선봉'];
      this.themeLabel=labels[id]||'숲길 방어';
      const special=this.isBoss()?'boss':this.isMidBoss()?'guardian':this.isEliteWave()?'shroom':null;
      const normalCount=this.count-(special?1:0),plan=[];
      const weights={...profiles[id]||profiles[0]};
      if(this.current===2){
        // A companion has just joined. Introduce special units slowly.
        for(const kind of ['spore','imp','crystal'])if(weights[kind]){
          const removed=weights[kind]*.6;weights[kind]-=removed;
          weights[chapter===0?'sprout':'runner']=(weights[chapter===0?'sprout':'runner']||0)+removed;
        }
      }
      function pick(excluded){
        const pool=Object.entries(weights).filter(([type,value])=>value>0&&type!==excluded);
        const total=pool.reduce((sum,[,value])=>sum+value,0);
        let n=Math.random()*total;
        for(const [type,value]of pool){n-=value;if(n<0)return type;}
        return pool.at(-1)?.[0]||'sprout';
      }
      let soloRunners=0;
      for(let i=0;i<normalCount;i++){
        let type;
        if(this.current===1){
          const useRunner=id>0&&soloRunners===0&&i>=2&&Math.random()<.18;
          type=useRunner?'runner':'sprout';if(useRunner)soloRunners++;
        }else{
          const last=plan.at(-1),repeat=plan.length>=2&&last===plan.at(-2);
          type=pick(repeat?last:null);
        }
        plan.push(type);
      }
      if(id===0){
        // First playable stage is a tutorial arc, not an RNG difficulty spike:
        // sprouts → two spaced runners → a thorn scout → midboss → finale.
        if(this.current===2){plan.fill('sprout');for(const position of [2,5])if(position<plan.length)plan[position]='runner';}
        if(this.current===3&&!plan.includes('thorn'))plan[Math.floor(plan.length*.7)]='thorn';
      }
      // Keep one stage-signature enemy in the middle of developed waves.
      if(this.current>=3&&normalCount>=6&&!plan.includes(signatures[id])){
        plan[Math.floor(normalCount*.6)]=signatures[id];
      }
      if(special)plan.push(special); // Exactly one climax enemy, always last.
      return plan;
    }
    nextType(){return this.plan[this.spawned]||'sprout';}
    update(dt){
      if(!this.active)return;
      this.tick-=dt;
      if(this.spawned<this.count && this.tick<=0){
        this.scene.spawnEnemy(this.nextType());this.spawned++;
        this.tick=Math.max(360,1030-this.current*45);
      }
      if(this.spawned>=this.count && this.scene.enemies.length===0){
        this.active=false;this.scene.onWaveDone(this.current);
      }
    }
  }
  class ForestBattle extends (window.Phaser ? window.Phaser.Scene : class {}) {
    constructor(){super({key:'ForestBattle'});}
    create(){
      battle=this;this.stage=STAGES[pendingStageIndex];this.ended=false;
      this.manualPause=false;this.autoPause=false;this.drafting=false;this.pendingRecruit=false;this.speed=1;
      this.hp=3000;this.maxHP=3000;this.coins=0;this.skillCooldown=0;this.rerollUsed=false;
      this.repairs=0;this.waveStartHP=3000;
      this.damageBonus=1;this.speedBonus=1;this.multi=0;this.freeze=0;this.flame=0;this.crit=0;
      this.spark=0;this.roots=0;this.pierce=0;this.ward=0;this.hunter=0;
      this.wardCharges=0;this.trapTimer=7600;this.evolutionPath=null;
      this.terrainConfig=TERRAIN_EVENTS[this.stage.id]||null;
      this.terrainTimer=this.terrainConfig?this.terrainConfig.interval:Infinity;
      this.terrainWarned=false;this.terrainWarning=false;this.terrainCueUntil=0;this.terrainCueText='';
      this.terrainEvents=0;this.overlayTimer=0;
      this.cardCounts={};this.synergies=new Set();this.gameClock=0;this.attackFxActive=0;this.damageFloatCount=0;this.damageFloatSerial=0;this.elementCueTimes=Object.create(null);
      this.heroIds=[null,null,'fox',null,null];this.targetModes=Array(HERO_CAPACITY).fill('front');this.attackTimes=Array(HERO_CAPACITY).fill(0);this.enemies=[];this.projectiles=[];this.effects=[];this.dyingSprites=0;
      this.focusEnemy=null;this.focusUntil=0;this.focusReticle=null;this.lastFortHP=-1;
      const personal=state.stats[this.stage.id]||{};
      const losses=Math.max(0,Math.min(100,Number(personal.streak)||0));
      this.assistScale=losses>=4?.88:losses>=2?.93:1;
      this.foxSpirit=0;this.evolved=false;
      this.recruitRemaining=RECRUIT_TIMEOUT;this.recruitLastSecond=-1;
      this.draftRemaining=0;this.draftChoices=null;this.draftLastSecond=-1;
      this.betweenWaves=0;this.wave=new WaveDirector(this);
      // Fill the entire playable viewport with one camera, rather than FIT letterboxing.
      // ZoomX/ZoomY adapt independently while all gameplay logic stays in 420×650 coordinates.
      this.resizeBattleCamera();
      this.scale.on('resize',this.resizeBattleCamera,this);
      this.events.once('shutdown',()=>this.scale.off('resize',this.resizeBattleCamera,this));
      buildTextures(this);this.add.image(210,325,'field');
      // Depth 1.8: foreground wall and torch lights sit under HP plaque (2)
      // and all combat characters (4–6). Each biome uses its own field texture.
      // One original stage field + one independently painted transparent foreground.
      this.setupAmbience();
      this.rampartFront=this.add.image(210,620,'painted-rampart-front').setDepth(7);
      $('arena-wrap').classList.toggle('foggy',this.stage.id>=4&&this.stage.id<=7);
      $('arena-wrap').classList.toggle('moonlit',this.stage.id>=8);
      $('arena-wrap').classList.remove('boss-warning');
      // Status bar now lives below the battlefield in the DOM, never across hero feet.
      this.fortPlaque=this.add.image(210,625,'fort-plaque').setDepth(2).setVisible(false);
      this.heroSprites=this.heroIds.map((id,i)=>id?this.add.image(HERO_POSITIONS[i],568,'motion-'+id+'-idle-0').setDisplaySize(94,94).setDepth(6):null);
      this.layoutHeroSprites();
      this.wave.begin();renderSlots();renderHUD();
      this.syncBattleOverlay();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(battle===this)$('battle-loading').hidden=true;}));
      if(this.assistScale<1)showBanner('재도전 지원 · 몬스터 체력 '+Math.round((1-this.assistScale)*100)+'% 완화');
      else if(this.stage.id===0)showBanner('여우 궁수 혼자 첫 공세를 막아보세요!');
    }
    layoutHeroSprites(){
      // 5 painted defenders fit on 420px without covering one another.
      const count=this.heroIds.filter(Boolean).length;
      const base=count>=5?72:count===4?79:count===3?86:94;
      this.heroSprites.forEach((sprite,i)=>{
        if(!sprite||!sprite.active)return;
        const size=this.heroIds[i]==='megafox'?Math.round(base*1.1):base;
        // Keep the rear-view heroes nimble and tall while preserving their ground position.
        sprite.setPosition(HERO_POSITIONS[i],566).setDisplaySize(size,size).setDepth(6);
      });
    }
    resizeBattleCamera(){
      const width=Math.max(1,this.scale.width||420),height=Math.max(1,this.scale.height||650);
      const camera=this.cameras.main;
      camera.setViewport(0,0,width,height);
      camera.setZoom(width/420,height/650);
      camera.centerOn(210,325);
    }
    setupAmbience(){
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.ambientLeaves=[];this.torchLights=[];
      const type=Math.floor(this.stage.id/4)===2?'crystal':Math.floor(this.stage.id/4)===1?'spore':'leaf';
      const count=reduced?0:(window.innerWidth<=390?5:8);
      for(let i=0;i<count;i++){
        const x=26+(i*103%370),y=95+(i*79%430);
        const sprite=this.add.image(x,y,'shard-'+type).setDisplaySize(8+(i%3)*3,10+(i%3)*3)
          .setAlpha(.2+(i%4)*.04).setDepth(1.85);
        this.ambientLeaves.push({sprite,baseX:x,phase:i*1.4,speed:.004+(i%3)*.002});
      }
      for(const x of [18,402]){
        const glow=this.add.image(x,563,'torch-glow').setDisplaySize(49,49).setAlpha(.48).setDepth(1.91);
        this.torchLights.push(glow);
      }
    }
    updateAmbience(dt){
      for(const p of this.ambientLeaves){
        p.sprite.y-=p.speed*dt;
        if(p.sprite.y<80)p.sprite.y=545;
        p.sprite.x=p.baseX+Math.sin(this.gameClock/1700+p.phase)*12;
        p.sprite.angle=Math.sin(this.gameClock/800+p.phase)*12;
      }
      for(let i=0;i<this.torchLights.length;i++){
        const flame=this.torchLights[i];
        flame.alpha=.42+Math.sin(this.gameClock/190+i*2.1)*.13;
        flame.scaleX=.65+Math.sin(this.gameClock/270+i)*.05;
      }
    }
    announceElite(e){
      if(this.lastEliteCinematicWave===this.wave.current)return;
      this.lastEliteCinematicWave=this.wave.current;
      if(this.eliteCinematic){
        for(const node of this.eliteCinematic.nodes)if(node.active)node.destroy();
        this.eliteCinematic=null;
      }
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const hue=e.type==='shroom'?0xe4a55e:e.type==='guardian'?0xd1bd7e:0xb191eb;
      const caption=e.type==='shroom'?'정예 출현 · 버섯 거한':
        e.type==='guardian'?'중간보스 출현 · 숲길 파수꾼':
          '보스 출현 · '+(CHAPTER_BOSS_ART[this.stage.id]?.name||'뿌리 거인');
      const dusk=this.add.image(210,277,'cinematic-vignette').setDepth(8);
      const aura=this.add.ellipse(210,340,220,38,hue,.24).setDepth(8.5);
      const hero=this.add.image(210,258,'motion-'+e.type+'-attack-0')
        .setDisplaySize(e.type==='shroom'?246:216,e.type==='shroom'?246:216).setAlpha(1).setDepth(9);
      const label=this.add.text(210,395,caption,{
        font:'bold 19px system-ui',color:'#fff1cd',align:'center',
        stroke:'#35261b',strokeThickness:5
      }).setOrigin(.5).setAlpha(1).setDepth(9);
      const nodes=[dusk,aura,hero,label];
      // Deterministic timing: Phaser scene update, independent of tween/event queues.
      this.eliteCinematic={hero,label,nodes,type:e.type,reduced,
        baseAlpha:nodes.map(node=>node.alpha),startTime:this.time.now,
        holdMs:2100,fadeMs:620,lastFrame:-1};
    }
    updateEliteCinematic(){
      const cut=this.eliteCinematic;if(!cut)return;
      const elapsed=Math.max(0,this.time.now-cut.startTime);
      const {nodes,hero}=cut;
      if(!hero.active){this.eliteCinematic=null;return;}
      if(elapsed>=cut.holdMs+cut.fadeMs){
        for(const node of nodes)if(node.active)node.destroy();
        this.eliteCinematic=null;
        return;
      }
      const visibility=elapsed<=cut.holdMs?1:
        Math.max(0,1-(elapsed-cut.holdMs)/cut.fadeMs);
      nodes.forEach((node,i)=>{if(node.active)node.setAlpha(cut.baseAlpha[i]*visibility);});
      if(!cut.reduced){
        const frame=Math.floor(elapsed/155)%4;
        if(frame!==cut.lastFrame){
          cut.lastFrame=frame;
          const texture='motion-'+cut.type+'-attack-'+frame;
          if(this.textures.exists(texture))hero.setTexture(texture);
        }
      }
    }
    spawnEnemy(type){
      // Enemy entry is broad at the top, including bridge levels.
      const lane=this.stage.id===2 ? (Math.random()<.5?48:372) : 38+Math.random()*344;
      const hpbase={sprout:55,runner:37,brute:160,boss:1400,thorn:48,spore:105,imp:44,crystal:195,shroom:420,guardian:680}[type];
      const soloScoutScale=this.wave.current===1?1/(1+this.stage.id*.045):1;
      const hp=Math.round(hpbase*(1+this.stage.id*.13+(this.wave.current-1)*.1)*soloScoutScale*this.assistScale);
      const spd={sprout:33,runner:60,brute:23,boss:18,thorn:49,spore:31,imp:55,crystal:21,shroom:19,guardian:17}[type]+this.stage.id*.8;
      const sizes={sprout:[56,48],runner:[56,48],brute:[69,63],boss:[160,142],thorn:[61,54],spore:[69,61],imp:[55,65],crystal:[79,67],shroom:[170,156],guardian:[165,144]};
      const elite=['shroom','guardian','boss'].includes(type);
      const [sw,sh]=sizes[type],lifeWidth=type==='guardian'||type==='boss'?88:type==='shroom'?60:40;
      const lifeYOffset=Math.round(sh*.53)+8;
      const renderedSize=Math.round(Math.sqrt(sw*sh)); // Equal pixel scale: no width/height stretching.
      const spr=this.add.image(lane,-38,'motion-'+type+'-run-0').setDisplaySize(renderedSize,renderedSize).setDepth(4);
      spr.setData('enemyType',type);
      const lifeBg=this.add.rectangle(lane,-38-lifeYOffset,lifeWidth+2,6,0x302a20).setDepth(5).setVisible(false);
      if(['shroom','guardian','boss'].includes(type)){
        const ring=this.add.ellipse(lane,-25,type==='shroom'?142:155,34,
          type==='shroom'?0xd69c57:0xe0c574,.14).setStrokeStyle(2,0xe3c17c,.46).setDepth(3);
        this.tweens.add({targets:ring,alpha:0,scaleX:1.28,scaleY:1.45,duration:840,onComplete:()=>ring.destroy()});
      }
      // Fixed upper HUD is the only elite HP/name indicator.
      const life=this.add.rectangle(lane,-38-lifeYOffset,lifeWidth,4,type==='guardian'?0xffcb73:type==='shroom'?0xf4a86e:0xe18754).setDepth(5).setVisible(false);
      const nameLabel=null;
      const enemy={nameLabel,type,x:lane,baseX:lane,windPhase:Math.random()*Math.PI*2,y:-38,spr,lifeBg,life,lifeWidth,lifeYOffset,hp,maxHP:hp,spd,slow:0,rooted:0,
        motionBaseScale:spr.scaleX,lastAttackCue:null,
        armor:type==='crystal'?.34:type==='shroom'?.12:this.stage.id===9?(type==='runner'?0:.3):(type==='brute'?.18:0),
        abilityCooldown:type==='guardian'?4100:type==='shroom'?7700:5400,warning:0,hidden:0,untargetable:false,surge:0,
        burrowActive:false,enraged:false,
        tellRing:null,tellBack:null,tellFill:null,guarding:false,hasDashed:false,hasRallied:false,hasSpores:false,crystalShatterUntil:0};
      enemy.baseArmor=enemy.armor;
      spr.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
        if(this.ended||this.manualPause||this.drafting)return;
        this.focusEnemy=enemy;this.focusUntil=this.gameClock+8500;
        if(this.focusReticle){this.focusReticle.destroy();this.focusReticle=null;}
        this.focusReticle=this.add.ellipse(enemy.x,enemy.y+20,72,25,0xf8d67b,.07).setStrokeStyle(3,0xffe49c,.95).setDepth(3);
        showBanner(ENEMY_INTEL[type].name+' 집중 공격!');
      });
      this.enemies.push(enemy);
      if(['boss','guardian','shroom'].includes(type)){
        this.syncBattleOverlay();
        this.announceElite(enemy);
      }
    }
    targetFor(heroX,range,mode='front'){
      if(this.focusEnemy&&this.enemies.includes(this.focusEnemy)&&this.gameClock<this.focusUntil&&!this.focusEnemy.untargetable
        &&Math.hypot(this.focusEnemy.x-heroX,this.focusEnemy.y-568)<=range)return this.focusEnemy;
      let result=null,best=-Infinity;
      for(const e of this.enemies){
        if(e.untargetable)continue;
        const distance=Math.hypot(e.x-heroX,e.y-568);
        if(distance>range)continue;
        const score=mode==='threat'?(e.type==='boss'?1200:e.type==='guardian'?900:e.type==='shroom'?460:e.type==='crystal'?320:e.type==='brute'?280:0)+e.maxHP*.18-e.hp*.14+e.y*.12-Math.abs(e.x-heroX)*.10:
          e.y-Math.abs(e.x-heroX)*.45;
        if(score>best){best=score;result=e;}
      }
      return result;
    }
    shoot(i){
      const id=this.heroIds[i];if(!id)return;
      const x=HERO_POSITIONS[i],hero=HEROES[id];
      const fog=(this.stage.id>=4&&this.stage.id<=7&&!this.hunter) ? 0.9 : 1;
      const vision=hero.range*(1+this.hunter*.16)*fog*(id==='megafox'&&this.evolutionPath==='moon'?1.2:1);
      const target=this.targetFor(x,vision,this.targetModes[i]);if(!target)return;
      const num=id==='fox'?1+this.multi:id==='megafox'?2+this.multi:1;
      const sprite=this.heroSprites[i],muzzle=HERO_MUZZLES[id]||[0,-24];
      const anchorX=sprite?.active?Math.max(x-9,Math.min(x+9,sprite.x)):x;
      const anchorY=sprite?.active?Math.max(556,Math.min(568,sprite.y)):566;
      // Hold the actual shot until the painted eight-frame weapon reaches release.
      // Use battle time, so a pause or 2x playback never sends a frozen hero's arrow.
      const windup=Math.round(V.duration(id,'attack')*.43);
      for(let p=0;p<num;p++){
        const offset=(p-(num-1)/2)*12;
        const bolt=this.add.image(anchorX+muzzle[0]+offset,anchorY+muzzle[1],'shot-'+id)
          .setDisplaySize(id==='cat'?31:id==='rabbit'?27:32,32).setDepth(6).setVisible(false);
        const trail=this.add.image(bolt.x-23,bolt.y,'trail-'+id)
          .setDisplaySize(id==='megafox'?78:65,22).setAlpha(.72).setDepth(5).setVisible(false);
        const evolvePower=id==='megafox'&&this.evolutionPath==='sun'?1.25:1;
        this.projectiles.push({spr:bolt,trail,target,x:bolt.x,y:bolt.y,
          damage:hero.damage*this.damageBonus*evolvePower,kind:id,
          launchSlot:i,muzzle,muzzleOffset:offset,burstHead:p===0,
          releaseAt:this.gameClock+(sprite?.active?windup:0),released:false});
      }
      if(sprite){
        V.trigger(sprite,'attack',this.gameClock+V.duration(id,'attack'),this.gameClock);
        if(id==='megafox')this.animateEvolutionAttack(sprite);
        // One continuous lunge/recovery lasting exactly the illustrated 8 beats.
        // When consecutive attacks arrive, continue from the current coordinates.
        this.tweens.killTweensOf(sprite);
        sprite.setPosition(Math.max(x-9,Math.min(x+9,sprite.x)),
          Math.max(556,Math.min(568,sprite.y)));
        const reach=id==='bear'?6:id==='rabbit'?2:4;
        this.tweens.add({targets:sprite,x:x-reach,y:559,duration:windup,timeScale:this.speed,ease:'Sine.easeOut',
          onComplete:()=>{if(sprite.active)this.tweens.add({targets:sprite,x,y:566,
            duration:V.duration(id,'attack')-windup,timeScale:this.speed,ease:'Sine.easeInOut'});}});
      }
    }
    releaseProjectile(p){
      // A moving archer or a changed roster must not leave the bolt floating at
      // an old firing socket. Resolve the living rear-view weapon on release.
      const sprite=this.heroIds[p.launchSlot]===p.kind?this.heroSprites[p.launchSlot]:null;
      const x=HERO_POSITIONS[p.launchSlot];
      const actorX=sprite?.active?Math.max(x-9,Math.min(x+9,sprite.x)):x;
      const actorY=sprite?.active?Math.max(556,Math.min(568,sprite.y)):566;
      p.x=actorX+p.muzzle[0]+p.muzzleOffset;
      p.y=actorY+p.muzzle[1];
      p.spr.setPosition(p.x,p.y).setVisible(true);
      p.trail.setPosition(p.x-23,p.y).setVisible(true);
      p.released=true;
      if(p.burstHead)this.playHeroAttackCue(p.x-p.muzzleOffset,p.kind,p.y);
    }
    playHeroAttackCue(x,id,y=535){
      const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduced||this.attackFxActive>=12||this.ended)return;
      const key=id==='rabbit'?'shard-crystal':id==='cat'?'shard-spore':'shard-leaf';
      const tint=id==='cat'?0xc69df4:id==='bear'?0xf6d9a0:id==='megafox'?0xf6cf7d:null;
      for(let n=0;n<2;n++){
        if(this.attackFxActive>=12)break;
        this.attackFxActive++;
        const fx=this.add.image(x+(n?20:-8),y-n*7,key).setDisplaySize(15+n*4,16+n*3)
          .setAlpha(.83).setDepth(6.5);
        if(tint)fx.setTint(tint);
        this.tweens.add({targets:fx,x:fx.x+(n?18:-12),y:fx.y-20-n*10,
          alpha:0,scale:1.6,angle:n?42:-35,duration:330,ease:'Cubic.easeOut',
          onComplete:()=>{fx.destroy();this.attackFxActive=Math.max(0,this.attackFxActive-1);}});
      }
    }
    animateEvolutionAttack(sprite){
      V.trigger(sprite,'attack',this.gameClock+V.duration('megafox','attack'),this.gameClock);
      this.cameras.main.shake(80,.0017);
    }
    previewRange(index){
      const id=this.heroIds[index];if(!id)return;
      const x=HERO_POSITIONS[index],radius=HEROES[id].range;
      const circle=this.add.circle(x,568,radius,0xf1e8a0,.035).setStrokeStyle(2,0xf4d16b,.45).setDepth(1);
      this.tweens.add({targets:circle,alpha:0,duration:900,onComplete:()=>circle.destroy()});
    }
    evolveFox(){
      if(this.evolved||this.foxSpirit<10||this.ended||this.manualPause||this.drafting)return;
      if(!this.heroIds.includes('fox'))return;
      this.manualPause=true;
      const choices=[
        {id:'sun',title:'햇살의 곰같은여우',desc:'공격 피해 강화·불꽃 범위 피해',icon:'flame'},
        {id:'moon',title:'달빛의 곰같은여우',desc:'사정거리·연사 강화·서리 둔화',icon:'ice'}
      ];
      const wrap=document.createElement('div');wrap.className='card-grid evo-choice-grid';
      choices.forEach(choice=>{
        const b=document.createElement('button');b.type='button';b.className='spell-card evo-path '+choice.id;
        const icon=document.createElement('span');icon.className='spell-emoji';V.setIcon(icon,choice.icon);paintElementSpell(icon,choice.id==='sun'?'flame':'ice',b);
        const title=document.createElement('strong');title.textContent=choice.title;
        const desc=document.createElement('small');desc.textContent=choice.desc;
        b.append(icon,title,desc);
        b.addEventListener('click',()=>{
          this.completeEvolution(choice.id);closeModal(true);
          this.manualPause=false;renderHUD();
        });
        wrap.appendChild(b);
      });
      showModal('진화 선택','곰같은여우 · 두 갈래의 힘','어느 길로 진화할까요? 이번 전투 동안 유지돼요.',[wrap],[
        button('조금 더 생각하기',()=>{closeModal(true);this.manualPause=false;renderHUD();},'alt')
      ],true);
      renderHUD();
    }
    completeEvolution(path){
      if(this.evolved||this.foxSpirit<10)return;
      const index=this.heroIds.indexOf('fox');if(index<0)return;
      this.evolved=true;this.evolutionPath=path;this.heroIds[index]='megafox';
      const spr=this.heroSprites[index];spr.setTexture('motion-megafox-idle-0').setDisplaySize(110,110).setDepth(5);
      spr.setTint(path==='sun'?0xffedc4:0xb2e8ff);
      this.layoutHeroSprites();
      V.trigger(spr,'victory',this.gameClock+900);
      this.cameras.main.flash(350,path==='sun'?250:142,path==='sun'?224:208,path==='sun'?143:250);
      const aura=this.add.circle(HERO_POSITIONS[index],575,25,path==='sun'?0xffd77a:0x9ddfff,.42).setDepth(4);
      this.tweens.add({targets:aura,scale:5,alpha:0,duration:650,onComplete:()=>aura.destroy()});
      const name=path==='sun'?'햇살의 곰같은여우!':'달빛의 곰같은여우!';
      const rise=this.add.text(HERO_POSITIONS[index],505,name,{font:'bold 17px system-ui',color:'#fff4c7',stroke:'#543929',strokeThickness:5})
        .setOrigin(.5).setDepth(8);
      this.tweens.add({targets:rise,y:455,alpha:0,duration:1500,onComplete:()=>rise.destroy()});
      showBanner(name);renderSlots();renderHUD();
    }
    showElementCue(element,x,y,force=false){
      // Actual passive proc feedback, at most once per element per second.
      if(this.ended||this.effects.length>=22)return false;
      const key='element-cue-'+element;
      if(!this.textures.exists(key))return false; // A missing optional image cannot break combat.
      const now=this.gameClock;
      if(!force&&now-(this.elementCueTimes[element]??-10000)<1000)return false;
      this.elementCueTimes[element]=now;
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const size=element==='stone'?68:76;
      const art=this.add.image(x,y-14,key).setDisplaySize(size,size).setAlpha(.94).setDepth(7.5);
      this.effects.push(art);
      const clear=()=>{
        if(art.active)art.destroy();
        const at=this.effects.indexOf(art);
        if(at>=0)this.effects.splice(at,1);
      };
      if(reduced)this.time.delayedCall(380,clear);
      else this.tweens.add({targets:art,y:y-41,alpha:0,
        scaleX:art.scaleX*1.13,scaleY:art.scaleY*1.13,duration:570,
        ease:'Sine.Out',onComplete:clear});
      return true;
    }
    impactAt(x,y,kind,critical=false){
      if(this.effects.length>=26)return;
      const color=kind==='rabbit'?0x9deaff:kind==='cat'?0xffab65:kind==='megafox'?0xffe387:kind==='bear'?0xe7d5a1:0xbee38b;
      const radius=critical?22:13;
      const ring=this.add.circle(x,y,radius,color,.08).setStrokeStyle(critical?4:2,color,.92).setDepth(7);
      this.effects.push(ring);
      this.tweens.add({targets:ring,scale:critical?2.1:1.65,alpha:0,duration:critical?340:240,
        onComplete:()=>{ring.destroy();const index=this.effects.indexOf(ring);if(index>=0)this.effects.splice(index,1);}});
      // Small hits have a two-piece painted burst; critical hits fan out farther.
      // Respect the existing FX cap and accessibility settings on weaker phones.
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if(!reduced&&this.effects.length<22){
        const count=critical?4:2;
        const shard=kind==='rabbit'?'crystal':kind==='cat'?'spore':kind==='bear'?'stone':'leaf';
        for(let n=0;n<count&&this.effects.length<26;n++){
          const particle=this.add.image(x,y,'shard-'+shard).setDisplaySize(critical?11:7,critical?13:9)
            .setAlpha(critical?.9:.7).setDepth(7);
          if(kind==='megafox')particle.setTint(0xffd46c);
          this.effects.push(particle);
          const angle=n*2*Math.PI/count+(critical?.22:.45),distance=critical?35:19;
          this.tweens.add({targets:particle,x:x+Math.cos(angle)*distance,
            y:y+Math.sin(angle)*distance-6,alpha:0,angle:n%2?105:-85,
            scale:.24,duration:critical?360:225,
            onComplete:()=>{particle.destroy();const i=this.effects.indexOf(particle);if(i>=0)this.effects.splice(i,1);}});
        }
      }
    }
    showDamageNumber(e,damage,critical,kind){
      if(this.damageFloatCount>=22||this.ended)return null;
      this.damageFloatCount++;
      const ordinal=this.damageFloatSerial++;
      const xOffset=[-13,0,13,-7,7][ordinal%5];
      const elite=['boss','guardian','shroom'].includes(e.type);
      const size=critical?24:elite?18:16;
      const style={font:'800 '+size+'px "Malgun Gothic", "Noto Sans KR", sans-serif',
        color:critical?'#ffe072':kind==='rabbit'?'#b8efff':kind==='cat'?'#ffd0a5':'#fff4d7',
        stroke:critical?'#633616':'#35271d',strokeThickness:critical?5:4};
      const baseY=elite?55:29;
      const number=this.add.text(e.x+xOffset,e.y-baseY,String(damage)+(critical?'!':''),
        style).setOrigin(.5).setDepth(9).setScale(critical?1.2:1);
      let anchorX=e.x,anchorY=e.y;
      const flight={rise:0,drift:0,alpha:1,scale:critical?1.2:1};
      const follow=()=>{
        // Lock to the moving target while alive; freeze at its last position after death.
        if(e.spr?.active){anchorX=e.x;anchorY=e.y;}
        if(number.active)number.setPosition(anchorX+xOffset+flight.drift,
          anchorY-baseY-flight.rise).setAlpha(flight.alpha).setScale(flight.scale);
      };
      this.tweens.add({targets:flight,rise:critical?43:29,drift:ordinal%2?6:-6,
        scale:critical?1.42:1.06,alpha:0,duration:critical?780:650,
        ease:'Cubic.easeOut',onUpdate:follow,onComplete:()=>{
          if(number.active)number.destroy();
          this.damageFloatCount=Math.max(0,this.damageFloatCount-1);
        }});
      return number;
    }
    hitEnemy(e,damage,kind){
      if(!this.enemies.includes(e)||e.untargetable)return;
      const crit=Math.random()<this.crit;
      this.impactAt(e.x,e.y,kind,crit);
      const armor=e.armor&&kind!=='rabbit'&&kind!=='skill'?
        (1-e.armor*(1-Math.min(1,this.pierce*.5))):1;
      const huntBonus=['boss','guardian'].includes(e.type)&&this.hunter?1+Math.min(.3,this.hunter*.12):1;
      const actual=Math.max(1,Math.round(damage*(crit?1.7:1)*armor*huntBonus));
      if(kind==='fox'&&!this.evolved){this.foxSpirit=Math.min(10,this.foxSpirit+1);renderEvolution();}
      e.hp-=actual;
      if(kind==='rabbit'||this.freeze||(kind==='megafox'&&this.evolutionPath==='moon'))
        e.slow=Math.max(e.slow,kind==='rabbit'?1900:kind==='megafox'&&this.evolutionPath==='moon'?1150:650);
      if(this.flame)e.hp-=Math.max(4,Math.floor(actual*(this.synergies.has('wildfire')?.38:.15)*(e.type==='sprout'?1.25:1)));
       if(kind==='rabbit'||this.freeze||(kind==='megafox'&&this.evolutionPath==='moon'))
         this.showElementCue('frost',e.x+13,e.y);
       if(this.flame||(kind==='megafox'&&this.evolutionPath==='sun'))
         this.showElementCue('flame',e.x-13,e.y);
      if(this.spark && Math.random()<.20+this.spark*.1){
        const near=this.enemies.find(other=>other!==e&&!other.untargetable&&Math.hypot(other.x-e.x,other.y-e.y)<100);
        if(near){near.hp-=Math.round(actual*.55);near.life.width=near.lifeWidth*Math.max(0,near.hp/near.maxHP);
          if(this.synergies.has('thunderfrost'))near.slow=Math.max(near.slow,1700);
          if(near.hp<=0){this.coins+=8;this.removeEnemy(near,true);}}
      }
      if(kind==='megafox')e.hp-=Math.floor(actual*.2);
      e.life.width=e.lifeWidth*Math.max(0,e.hp/e.maxHP);
      this.showDamageNumber(e,actual,crit,kind);
      const freshImpact=V.trigger(e.spr,'hurt',this.gameClock+V.duration(e.type,'hurt'),this.gameClock);
      // Show the painted first impact pose immediately; later frames unfold in update().
      const hurtFrame='motion-'+e.type+'-hurt-0';
      if(freshImpact&&this.textures.exists(hurtFrame))e.spr.setTexture(hurtFrame);
      if(kind==='megafox'&&this.evolutionPath==='sun'){
        for(const other of [...this.enemies]){
          if(other===e||other.untargetable||Math.hypot(other.x-e.x,other.y-e.y)>78)continue;
          other.hp-=Math.round(actual*.20);
          other.life.width=other.lifeWidth*Math.max(0,other.hp/other.maxHP);
          if(other.hp<=0){this.coins+=8;this.removeEnemy(other,true);}
        }
      }
      if(kind==='cat'){
        const boom=this.add.circle(e.x,e.y,16,0xffac65,.4).setDepth(5);
        this.tweens.add({targets:boom,scale:4,alpha:0,duration:260,onComplete:()=>boom.destroy()});
        for(const other of [...this.enemies])if(other!==e&&Math.hypot(other.x-e.x,other.y-e.y)<75){
          other.hp-=Math.round(actual*.45);other.life.width=other.lifeWidth*Math.max(0,other.hp/other.maxHP);
          if(other.hp<=0){this.coins+=8;this.removeEnemy(other,true);}
        }
      }
      if(e.hp<=0){
        this.coins+=e.type==='boss'?150:e.type==='guardian'?85:e.type==='shroom'?36:e.type==='crystal'?22:e.type==='brute'?18:e.type==='spore'?15:8;
        const ring=this.add.circle(e.x,e.y,10,0xf7da8c,.55).setDepth(6);
        this.tweens.add({targets:ring,scale:3,alpha:0,duration:260,onComplete:()=>ring.destroy()});
        this.removeEnemy(e,true);renderHUD();
      }
    }
    removeEnemy(e,defeated=false){
      const i=this.enemies.indexOf(e);
      if(i<0)return;
      this.enemies.splice(i,1);
      if(this.focusEnemy===e){
        this.focusEnemy=null;
        if(this.focusReticle){this.focusReticle.destroy();this.focusReticle=null;}
      }
      this.clearBossWarning(e);
      if(e.burrowMarker){e.burrowMarker.destroy();e.burrowMarker=null;}
      if(['guardian','shroom','boss'].includes(e.type))this.syncBattleOverlay();
      if(e.nameLabel)e.nameLabel.destroy();
      e.life.destroy();e.lifeBg.destroy();
      // A breach disappears instantly; a defeated enemy keeps only a visual
      // 5/6-frame ghost. Damage, rewards and WaveDirector removal remain immediate.
      if(!defeated||this.dyingSprites>=12){e.spr.destroy();return;}
      this.dyingSprites++;
      const spr=e.spr;
      spr.disableInteractive();spr.clearTint();spr.setAlpha(1);
      const kind=e.type==='crystal'?'crystal':
        ['runner','spore','shroom'].includes(e.type)?'spore':
        ['guardian','boss','brute'].includes(e.type)?'stone':'leaf';
      const large=['guardian','boss','shroom'].includes(e.type);
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const frameCount=V.frameTotal(e.type,'death');
      const first='motion-'+e.type+'-death-0';
      if(this.textures.exists(first))spr.setTexture(first);
      if(!reduced&&this.dyingSprites<=8){
        const total=large?4:2;
        for(let n=0;n<total;n++){
          const particle=this.add.image(e.x,e.y,'shard-'+kind).setDepth(7)
            .setDisplaySize(large?20:12,large?20:12);
          const angle=n/total*Math.PI*2,dist=large?50:30;
          this.tweens.add({targets:particle,x:e.x+Math.cos(angle)*dist,
            y:e.y+Math.sin(angle)*dist-13,alpha:0,angle:n%2?100:-120,
            scale:.3,duration:large?410:310,onComplete:()=>particle.destroy()});
        }
      }
      const finalAlpha=reduced?.12:.18;
      this.tweens.add({targets:spr,alpha:finalAlpha,y:spr.y+(large?20:16),
        angle:spr.angle+(large?7:13),scaleX:spr.scaleX*.77,scaleY:spr.scaleY*.77,
        duration:reduced?90:V.duration(e.type,'death')+65,ease:'Linear',
        onUpdate:tween=>{
          if(!spr.active||reduced)return;
          // Frame selection follows elapsed tween time, not alpha rounding.
          // All five/six illustrated beats get a complete, visible interval.
          const progress=Math.max(0,Math.min(1,tween.progress));
          const frame=Math.min(frameCount-1,Math.floor(progress*frameCount));
          const texture='motion-'+e.type+'-death-'+frame;
          if(this.textures.exists(texture)&&spr.texture.key!==texture)spr.setTexture(texture);
        },
        onComplete:()=>{this.dyingSprites=Math.max(0,this.dyingSprites-1);spr.destroy();}});
    }
    clearBossWarning(e){
      for(const key of ['tellRing','tellBack','tellFill','tellZone']){
        if(e[key]){e[key].destroy();e[key]=null;}
      }
    }
    startBossWarning(e){
      this.clearBossWarning(e);
      const color=e.type==='shroom'?0xf5a658:e.type==='guardian'?0xffdd83:this.stage.id===11?0xce77ff:this.stage.id===7?0xffc46b:0xff8068;
      const warningWidth=e.type==='shroom'?180:e.type==='guardian'?155:this.stage.id===11?210:this.stage.id===7?166:125;
      e.tellRing=this.add.ellipse(e.x,e.y+23,warningWidth,35,color,.21).setStrokeStyle(3,color,.9).setDepth(5);
      // Ground zone warns of boss attack; no duplicate bar above the head.
      e.tellBack=null;e.tellFill=null;
      e.tellZone=this.add.ellipse(e.x,(e.y+540)/2,warningWidth,Math.max(40,540-e.y),color,.075)
        .setStrokeStyle(2,color,.45).setDepth(3);
    }
    drawFortHUD(){
      if(this.lastFortHP===this.hp&&this.lastFortMaxHP===this.maxHP)return;
      this.lastFortHP=this.hp;this.lastFortMaxHP=this.maxHP;
      const texture=this.textures.get('fort-plaque'),canvas=texture.getSourceImage();
      paintFortPlaque(canvas.getContext('2d'),this.hp,this.maxHP);texture.refresh();
    }
    // Boss and elite portraits are existing original WebP assets, not SVG overlays.
    syncBattleOverlay(){
      const box=$('boss-hud'),target=this.enemies.find(e=>e.type==='boss')||
        this.enemies.find(e=>e.type==='guardian')||this.enemies.find(e=>e.type==='shroom');
      box.hidden=!target;
      $('arena-wrap').classList.toggle('has-boss',!!target);
      if(target){
        const kind=target.type;
        const title=kind==='boss'?CHAPTER_BOSS_ART[this.stage.id]?.name||'뿌리 거인':ENEMY_INTEL[kind].name;
        $('boss-title').textContent=title;
        $('boss-role').textContent=kind==='boss'?'최종 보스':kind==='guardian'?'중간보스':'정예';
        const artClass=kind==='guardian'&&this.stage.chapter===1?' chapter-sentinel':
          kind==='boss'&&this.stage.id===3?' chapter-root':
            kind==='boss'&&this.stage.id===7?' chapter-mole':
              kind==='boss'&&this.stage.id===11?' chapter-bell':'';
        $('boss-portrait').className='boss-portrait '+kind+artClass;
        const max=Math.max(1,target.maxHP),hp=Math.max(0,target.hp);
        $('boss-bar').style.width=(Math.min(100,hp/max*100))+'%';
        $('boss-meter').setAttribute('aria-valuemax',String(max));
        $('boss-meter').setAttribute('aria-valuenow',String(Math.ceil(hp)));
        $('boss-meter').setAttribute('aria-label',title+' 체력');
        $('boss-hp-text').textContent=Math.ceil(hp)+' / '+Math.ceil(max);
        $('boss-warning-note').textContent=target.warning>0?
          (this.stage.id===3&&kind==='boss'?'뿌리창 공격 예고 · 일제사격으로 저지':this.stage.id===7&&kind==='boss'?'굴착 예고 · 일제사격으로 저지':this.stage.id===11&&kind==='boss'?'종소리 예고 · 일제사격으로 저지':'공격 예고! 일제사격으로 저지'):
          target.untargetable?'잠복 중 · 출현 위치를 주시하세요':target.enraged?'격노 상태 · 공격 간격 단축':'몬스터를 터치하면 집중 사격';
      }
      const cue=$('terrain-indicator');
      const active=this.terrainConfig&&this.gameClock<this.terrainCueUntil;
      cue.hidden=!active;
      if(active){cue.textContent=this.terrainCueText;cue.classList.toggle('warning',this.terrainWarning);}
    }
    heroTerrainReaction(kind){
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const color=kind==='crystal'?0xa8efff:kind==='spore'?0xf5b57b:0xc8e69c;
      for(let i=0;i<this.heroSprites.length;i++){
        const hero=this.heroSprites[i];
        if(!hero||!hero.active)continue;
        const x=hero.x,y=hero.y;
        const flash=this.add.ellipse(x,y+13,40,14,color,.16).setStrokeStyle(2,color,.8).setDepth(5);
        this.tweens.add({targets:flash,alpha:0,scale:1.6,duration:370,onComplete:()=>flash.destroy()});
        if(kind==='crystal')V.trigger(hero,'victory',this.gameClock+400,this.gameClock);
        else if(kind==='spore')V.trigger(hero,'attack',this.gameClock+330,this.gameClock);
        else V.trigger(hero,'idle',this.gameClock+250,this.gameClock);
      }
    }
    terrainVisual(kind,x=210,y=294){
      this.heroTerrainReaction(kind);
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const particle=kind==='crystal'?'crystal':kind==='spore'?'spore':'leaf';
      for(let n=0;n<5;n++){
        const a=n/5*Math.PI*2;
        const sprite=this.add.image(x,y,'shard-'+particle).setDepth(7).setDisplaySize(19,19).setAlpha(.9);
        this.tweens.add({targets:sprite,x:x+Math.cos(a)*70,y:y+Math.sin(a)*45,
          alpha:0,scale:.3,angle:n%2?90:-85,duration:520,onComplete:()=>sprite.destroy()});
      }
    }
    tickTerrain(dt){
      if(!this.terrainConfig||!this.wave.active||this.wave.current<2||!this.enemies.length)return;
      this.terrainTimer=Math.max(0,this.terrainTimer-dt);
      if(!this.terrainWarned&&this.terrainTimer<=1150){
        this.terrainWarned=true;this.terrainWarning=true;
        this.terrainCueText=this.terrainConfig.title+' · 곧 발동';
        this.terrainCueUntil=this.gameClock+2600;
        showBanner(this.terrainConfig.title+'! 준비하세요');
        this.syncBattleOverlay();
      }
      if(this.terrainTimer>0)return;
      this.terrainTimer=this.terrainConfig.interval;
      this.terrainWarned=false;this.terrainWarning=false;
      this.terrainEvents++;
      if(this.stage.id===5){
        const target=[...this.enemies].filter(e=>!e.untargetable&&e.type!=='boss').sort((a,b)=>b.y-a.y)[0];
        if(target){
          target.rooted=Math.max(target.rooted,1250);
          this.terrainVisual('leaf',target.x,target.y);
          this.hitEnemy(target,48,'terrain');
        }
        this.terrainCueText='낡은 다리 · 선두 저지';
      }else if(this.stage.id===6){
        const candidates=[...this.enemies].filter(e=>!e.untargetable&&['sprout','runner','thorn','spore','imp'].includes(e.type))
          .sort((a,b)=>b.y-a.y).slice(0,2);
        for(const enemy of candidates)enemy.surge=Math.max(enemy.surge,680);
        this.terrainVisual('spore');
        this.terrainCueText='포자비 · 정찰병 가속 '+candidates.length+'명';
      }else if(this.stage.id===9){
        for(const enemy of this.enemies){
          if(enemy.type==='crystal'){enemy.crystalShatterUntil=this.gameClock+2600;enemy.armor=Math.max(0,enemy.armor-.15);}
        }
        this.terrainVisual('crystal');
        this.terrainCueText='수정 공명 · 갑옷 약화';
      }
      this.terrainCueUntil=this.gameClock+2400;
      this.syncBattleOverlay();
      showBanner(this.terrainCueText);
    }
    sporeVolley(e){
      if(!this.enemies.includes(e)||this.ended)return;
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const points=[116,210,303],damage=this.synergies.has('fortress')?17:28;
      for(let i=0;i<3;i++){
        const target=points[i];
        const orb=this.add.image(e.x+(i-1)*12,e.y-20,'shard-spore')
          .setDisplaySize(i===1?29:22,i===1?29:22).setDepth(7);
        this.tweens.add({targets:orb,x:target,y:558,angle:(i-1)*145,alpha:.45,
          duration:reduced?240:510+i*90,ease:'Cubic.easeIn',
          onComplete:()=>{
            orb.destroy();if(this.ended)return;
            const pulse=this.add.ellipse(target,558,47,19,0xffc17b,.17).setStrokeStyle(2,0xfce4af,.75).setDepth(6);
            this.tweens.add({targets:pulse,alpha:0,scale:1.8,duration:280,onComplete:()=>pulse.destroy()});
            // HP changes when the last visible projectile lands, never at launch.
            if(i===2){
              this.hp=Math.max(0,this.hp-damage);renderHUD();
              if(!reduced)this.cameras.main.shake(135,.0019);
              showBanner('버섯 거한 · 포자 충격! 성벽 -'+damage);
              if(this.hp<=0)this.finish(false);
            }
          }});
      }
    }
    startMoleBurrow(e){
      // Dig to the opposite lane. Show the exit BEFORE the mole emerges, so
      // players can track the move and plan their next manual focus.
      const exitX=e.baseX<210?320:100;
      e.burrowActive=true;e.hidden=1250;e.untargetable=true;
      e.spr.setAlpha(.14);e.life.setAlpha(0);e.lifeBg.setAlpha(0);
      e.baseX=exitX;e.x=exitX;
      e.burrowMarker=this.add.ellipse(exitX,e.y+23,90,29,0xd6a16c,.26)
        .setStrokeStyle(3,0xffdba3,.85).setDepth(4);
      for(let n=0;n<4;n++){
        const dust=this.add.image(exitX+(n-1.5)*21,e.y+13,'shard-stone')
          .setDisplaySize(13,16).setAlpha(.8).setDepth(5);
        this.tweens.add({targets:dust,y:e.y-20-n*5,x:exitX+(n-1.5)*36,
          alpha:0,angle:n%2?80:-80,duration:480,onComplete:()=>dust.destroy()});
      }
      showBanner('가면 두더지 · 굴착 중! 출현 지점을 주시하세요');
    }
    finishMoleBurrow(e){
      e.burrowActive=false;
      if(e.burrowMarker){e.burrowMarker.destroy();e.burrowMarker=null;}
      if(this.ended||!this.enemies.includes(e))return;
      V.trigger(e.spr,'attack',this.gameClock+V.duration('boss','attack'),this.gameClock);
      const impact=this.add.ellipse(e.x,e.y+24,78,26,0xffd39c,.48)
        .setStrokeStyle(3,0xf6b66b,.95).setDepth(5);
      this.tweens.add({targets:impact,scaleX:2.5,scaleY:2.2,alpha:0,
        duration:560,onComplete:()=>impact.destroy()});
      const damage=e.enraged?65:38;
      this.hp=Math.max(0,this.hp-damage);renderHUD();
      this.cameras.main.shake(115,.002);
      showBanner('가면 두더지 · 지하 진동! 성벽 -'+damage);
      if(this.hp<=0)this.finish(false);
    }
    ringBlackBell(e){
      // Three purple sound waves travel from the illustrated bell toward the
      // wall. The actual damage lands with the visible final wave, not early.
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const damage=this.synergies.has('fortress')?40:e.enraged?125:90;
      for(let i=0;i<3;i++){
        const wave=this.add.ellipse(e.x,e.y+22,90+i*26,24+i*8,0x9f65dc,.16)
          .setStrokeStyle(3,0xd9aaff,.78).setDepth(6);
        this.tweens.add({targets:wave,x:210,y:536,scaleX:1.5+i*.3,scaleY:1.3,
          alpha:0,duration:reduced?180:450+i*100,ease:'Sine.easeIn',onComplete:()=>{
            wave.destroy();if(i!==2||this.ended)return;
            this.hp=Math.max(0,this.hp-damage);renderHUD();
            if(!reduced)this.cameras.main.shake(150,.003);
            showBanner('검은 종 · 공명 충격! 성벽 -'+damage);
            if(this.hp<=0)this.finish(false);
          }});
      }
    }
    sendForestSpear(e){
      // Chapter 1 sentinel: a single visible spear travels to the rampart
      // before its one strike lands. The warning can be interrupted beforehand.
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const spear=this.add.image(e.x,e.y+21,'boss-root-spear')
        .setDisplaySize(30,96).setAngle(180).setAlpha(.93).setDepth(6);
      this.tweens.add({targets:spear,x:210,y:536,alpha:.48,
        duration:reduced?180:430,ease:'Sine.easeIn',onComplete:()=>{
          spear.destroy();if(this.ended)return;
          this.hp=Math.max(0,this.hp-45);renderHUD();
          if(!reduced)this.cameras.main.shake(95,.0016);
          showBanner('숲길 파수꾼 · 가시창 충격! 성벽 -45');
          if(this.hp<=0)this.finish(false);
        }});
    }
    rootCrownCharge(e){
      // Three staggered woody spears follow the giant's painted root slam.
      // Only the final impact damages the wall, never three unavoidable hits.
      const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const damage=this.synergies.has('fortress')?32:e.enraged?75:55;
      e.surge=1100;
      for(let i=0;i<3;i++){
        const spear=this.add.image(e.x+(i-1)*16,e.y+23,'boss-root-spear')
          .setDisplaySize(32+(i===1?7:0),104).setAlpha(.88).setDepth(6);
        this.tweens.add({targets:spear,x:210+(i-1)*57,y:528,alpha:.38,
          duration:reduced?180:440+i*120,ease:'Sine.easeIn',onComplete:()=>{
            spear.destroy();if(i!==2||this.ended)return;
            this.hp=Math.max(0,this.hp-damage);renderHUD();
            if(!reduced)this.cameras.main.shake(145,.0024);
            showBanner('뿌리 거인 · 뿌리창 폭발! 성벽 -'+damage);
            if(this.hp<=0)this.finish(false);
          }});
      }
    }
    updateBosses(dt){
      for(const e of this.enemies){
        if(e.type!=='boss'&&e.type!=='guardian'&&e.type!=='shroom')continue;
        if(e.type==='boss'&&!e.enraged&&e.hp<=e.maxHP*.5){
          e.enraged=true;e.abilityCooldown=Math.min(e.abilityCooldown,2800);
          const aura=this.add.ellipse(e.x,e.y+15,118,42,this.stage.id===11?0x9b6bd5:0xd7ab69,.38).setDepth(3);
          this.tweens.add({targets:aura,alpha:0,scale:1.8,duration:650,onComplete:()=>aura.destroy()});
          showBanner((CHAPTER_BOSS_ART[this.stage.id]?.name||'뿌리 거인')+' · 격노! 공격 속도가 빨라집니다');
        }
        if(e.hidden>0){
          e.hidden=Math.max(0,e.hidden-dt);
          if(e.burrowMarker)e.burrowMarker.setPosition(e.x,e.y+23)
            .setAlpha(.28+Math.sin(this.gameClock/110)*.14);
          if(e.hidden===0){
            e.untargetable=false;e.spr.alpha=1;e.life.alpha=1;e.lifeBg.alpha=1;
            if(e.burrowActive)this.finishMoleBurrow(e);
          }
        }
        if(e.warning>0){
          e.warning-=dt;
          if(e.tellRing){
            e.tellRing.setPosition(e.x,e.y+23).setAlpha(.55+Math.sin(this.gameClock/120)*.25);
            if(e.tellBack)e.tellBack.setPosition(e.x,e.y-56);
            if(e.tellZone)e.tellZone.setPosition(e.x,(e.y+540)/2).setDisplaySize(
              e.type==='shroom'?180:e.type==='guardian'?155:this.stage.id===11?210:this.stage.id===7?166:125,
              Math.max(40,540-e.y));
            const remaining=Math.max(0,e.warning/1250);
            if(e.tellFill)e.tellFill.setPosition(e.x-47+47*remaining,e.y-56).setDisplaySize(94*remaining,6);
          }
          if(e.warning<=0){
            e.warning=0;e.spr.clearTint();this.clearBossWarning(e);
            V.trigger(e.spr,'attack',this.gameClock+V.duration(e.type,'attack'),this.gameClock);
            if(e.type==='shroom'){this.sporeVolley(e);e.abilityCooldown=7800;}
            if(e.type==='guardian'){
              e.surge=1250;
              if(this.stage.chapter===1)this.sendForestSpear(e);
              else{
                this.hp=Math.max(0,this.hp-45);renderHUD();
                this.cameras.main.shake(95,.0016);
                showBanner('숲 수호자 · 진동 충격! 성벽 -45');
                if(this.hp<=0){this.finish(false);return;}
              }
            }
            if(e.type==='boss'&&this.stage.id===3)this.rootCrownCharge(e);
            if(e.type==='boss'&&this.stage.id===7)this.startMoleBurrow(e);
            if(e.type==='boss'&&this.stage.id===11)this.ringBlackBell(e);
          }
        }else if(!e.untargetable&&e.y>105){
          e.abilityCooldown-=dt;
          if(e.abilityCooldown<=0){
            // The warning is the held anticipation, not a premature strike.
            V.trigger(e.spr,'idle',this.gameClock+1250,this.gameClock);
            e.warning=1250;e.abilityCooldown=e.enraged?4800:6900;
            e.spr.setTint(0xff9b60);this.startBossWarning(e);
            const title=e.type==='shroom'?'버섯 거한 · 포자탄 경고':e.type==='guardian'&&this.stage.chapter===1?'숲길 파수꾼 · 가시창 예고':e.type==='guardian'?'숲길 파수꾼 · 충격파 예고':this.stage.id===3?'뿌리창 세 갈래 예고':this.stage.id===7?'갈퀴 굴착 예고':'검은 종 공명 예고';
            showBanner(title+' · 일제사격으로 저지!');
          }
        }
      }
    }
    activateRoots(){
      if(!this.roots||!this.enemies.length)return;
      const target=this.enemies.filter(e=>!e.untargetable).sort((a,b)=>b.y-a.y)[0];
      if(!target)return;
      target.rooted=Math.max(target.rooted,1150+450*this.roots);
      this.showElementCue('forest',target.x,target.y);
      const vines=this.add.circle(target.x,target.y,23,0x7acb5b,.14).setStrokeStyle(4,0x9adc75,.9).setDepth(6);
      this.tweens.add({targets:vines,scale:1.6,alpha:0,duration:570,onComplete:()=>vines.destroy()});
      if(this.synergies.has('bramblefire')){
        for(const e of [...this.enemies]){
          if(e.untargetable||Math.hypot(e.x-target.x,e.y-target.y)>85)continue;
          this.hitEnemy(e,45*this.roots*this.damageBonus,'trap');
        }
      }
      showBanner(this.synergies.has('bramblefire')?'불꽃 덩굴 발동!':'덩굴 덫 발동!');
    }
    repairWall(){
      if(this.ended||this.manualPause||this.autoPause||this.drafting||this.hp>=this.maxHP||this.repairs>=REPAIR_LIMIT)return;
      if(this.coins<REPAIR_COST){showBanner('성벽 수리에는 별빛 120개가 필요해요');return;}
      this.coins-=REPAIR_COST;this.repairs++;
      const healed=Math.min(REPAIR_HEAL,this.maxHP-this.hp);
      this.hp+=healed;
      this.showElementCue('stone',210,522,true);
      this.impactAt(210,532,'rabbit',true);
      const shine=this.add.rectangle(210,532,340,12,0xa7efae,.55).setDepth(8);
      this.tweens.add({targets:shine,scaleY:4,alpha:0,duration:430,onComplete:()=>shine.destroy()});
      showBanner('성벽 보수 성공! 체력 +'+healed+' · '+this.repairs+'/'+REPAIR_LIMIT);
      renderHUD();
    }
    castSkill(){
      if(this.ended||this.manualPause||this.autoPause||this.drafting||this.skillCooldown>0)return;
      this.skillCooldown=14500;showBanner('수비대 일제사격!');
      if(this.stage.id===6&&this.terrainWarned&&this.terrainTimer>0){
        this.terrainWarned=false;this.terrainWarning=false;
        this.terrainTimer=this.terrainConfig.interval;
        this.terrainCueText='포자비 저지 성공!';this.terrainCueUntil=this.gameClock+2100;
        this.syncBattleOverlay();showBanner('포자비 저지! 적 가속 취소');
      }
      for(const enemy of this.enemies)if(['boss','guardian','shroom'].includes(enemy.type)&&enemy.warning>0){
        enemy.warning=0;enemy.abilityCooldown=6200;enemy.spr.clearTint();this.clearBossWarning(enemy);showBanner('보스 공격 저지!');
      }
      const flash=this.add.rectangle(210,270,420,540,0xffe2a1,.22).setDepth(6);
      this.tweens.add({targets:flash,alpha:0,duration:330,onComplete:()=>flash.destroy()});
      [...this.enemies].forEach(e=>{e.slow=1400;this.hitEnemy(e,110*this.damageBonus,'skill');});
      renderHUD();
    }
    onWaveDone(w){
      if(this.ended)return;
      if(this.hp>=this.waveStartHP){
        this.coins+=35;
        showBanner('무피해 방어! 별빛 +35');
        renderHUD();
      }
      if(w>=this.stage.waves){this.finish(true);return;}
      if(w===1){
        this.drafting=true;this.pendingRecruit=true;this.recruitRemaining=RECRUIT_TIMEOUT;this.recruitLastSecond=-1;
        setTimeout(()=>{if(!this.ended&&this.pendingRecruit)this.showRecruitDraft();},260);
      }
      else if(w%2===0){
        this.drafting=true;this.draftChoices=null;this.draftRemaining=DRAFT_TIMEOUT;this.draftLastSecond=-1;
        setTimeout(()=>{if(!this.ended&&this.drafting)this.showDraft();},220);
      }
      else{this.betweenWaves=1100;showBanner('성벽 방어 성공!');}
    }
    comboFor(id){
      const recipe=SYNERGY_RECIPES.find(([a,b,key])=>!this.synergies.has(key)&&(
        (id===a&&this.cardCounts[b]>0)||(id===b&&this.cardCounts[a]>0)
      ));
      return recipe?recipe[3]:null;
    }
    chooseCards(){
      const missing=['bear','rabbit','cat'].filter(id=>!this.heroIds.includes(id));
      const pool=CARDS.filter(c=>!['bear','rabbit','cat'].includes(c.id)||(
        this.heroIds.includes(null)&&(missing.length?missing.includes(c.id):
          this.heroIds.filter(id=>id===c.id).length<2)));
      const shuffled=[...pool];
      for(let i=shuffled.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
      }
      const result=[];
      const combo=shuffled.find(c=>this.comboFor(c.id));
      if(combo&&Math.random()<.85)result.push(combo);
      for(const c of shuffled){
        if(result.length>=3)break;
        if(!result.some(x=>x.id===c.id))result.push(c);
      }
      return result;
    }
    recruitHero(id){
      if(!['bear','rabbit','cat'].includes(id))return false;
      const owned=this.heroIds.filter(Boolean);
      const missing=['bear','rabbit','cat'].filter(species=>!owned.includes(species));
      // Prefer a complete four-species team; then allow exactly one reinforcement copy.
      if(owned.includes(id)&&(missing.length>0||owned.filter(species=>species===id).length>=2))return false;
      const preferred=this.preferredRecruitSlot;
      const idx=preferred!==undefined&&this.heroIds[preferred]===null?preferred:
        HERO_RECRUIT_ORDER.find(slot=>this.heroIds[slot]===null);
      this.preferredRecruitSlot=undefined;
      if(idx===undefined)return false;
      this.heroIds[idx]=id;this.attackTimes[idx]=400;
      const sprite=this.add.image(HERO_POSITIONS[idx],568,'motion-'+id+'-idle-0').setDisplaySize(94,94).setDepth(6);
      this.heroSprites[idx]=sprite;
      this.layoutHeroSprites();
      V.trigger(sprite,'victory',this.gameClock+700);
      const glow=this.add.ellipse(sprite.x,591,45,17,0xffdf91,.23).setDepth(5);
      this.tweens.add({targets:glow,scale:3,alpha:0,duration:450,onComplete:()=>glow.destroy()});
      renderSlots();showBanner(HEROES[id].name+' 합류!');
      return true;
    }
    chooseFirstCompanion(id,automatic=false){
      if(!this.pendingRecruit||this.ended||!this.recruitHero(id))return false;
      this.pendingRecruit=false;this.drafting=false;this.betweenWaves=1100;
      if(activeModal&&activeModal.kicker==='첫 번째 공세 완료')closeModal(true);
      renderHUD();
      renderSlots();
      if(automatic)showBanner(HEROES[id].name+' 자동 합류!');
      return true;
    }
    tickRecruit(realDelta){
      if(!this.pendingRecruit||this.ended||this.manualPause||this.autoPause||document.visibilityState==='hidden')return;
      this.recruitRemaining=Math.max(0,this.recruitRemaining-Math.min(realDelta,100));
      const seconds=Math.ceil(this.recruitRemaining/1000);
      if(seconds!==this.recruitLastSecond){
        this.recruitLastSecond=seconds;
        const timer=$('recruit-countdown');
        if(timer)timer.textContent='남은 시간 '+seconds+'초 · 미선택 시 자동 영입';
        const bar=$('recruit-progress-fill');if(bar)bar.style.width=(this.recruitRemaining/RECRUIT_TIMEOUT*100)+'%';
      }
      if(this.recruitRemaining===0)this.chooseFirstCompanion(['bear','rabbit','cat'][this.stage.id%3],true);
    }
    showRecruitDraft(){
      if(this.ended||!this.pendingRecruit)return;
      this.drafting=true;
      const descriptions={
        bear:'묵직한 창 공격 · 가까운 적 대응',
        rabbit:'서리 마법으로 적의 이동 둔화',
        cat:'폭탄 투사체로 꾸준한 원거리 공격'
      };
      const timer=document.createElement('div');timer.className='recruit-countdown';timer.id='recruit-countdown';
      timer.textContent='남은 시간 '+Math.ceil(this.recruitRemaining/1000)+'초 · 미선택 시 자동 영입';
      const track=document.createElement('div');track.className='recruit-progress';track.setAttribute('aria-hidden','true');
      const fill=document.createElement('span');fill.id='recruit-progress-fill';
      fill.style.width=(this.recruitRemaining/RECRUIT_TIMEOUT*100)+'%';track.appendChild(fill);
      const recommendedId=['rabbit','bear','cat'][this.stage.id%3];
      const wrap=document.createElement('div');wrap.className='card-grid recruit-grid';
      for(const id of ['bear','rabbit','cat']){
        const pick=document.createElement('button');pick.type='button';pick.className='spell-card recruit-card recruit-'+id;
        const portrait=document.createElement('span');V.portrait(portrait,id);portrait.classList.add('recruit-portrait');
        // v4.7: keep the recommendation in its own row, never over the painting.
        const badgeLine=document.createElement('span');badgeLine.className='recruit-badge-line';
        badgeLine.setAttribute('aria-hidden','true');
        if(id===recommendedId){
          pick.classList.add('recommended');
          const tag=document.createElement('span');tag.className='recruit-tag';tag.textContent='추천 동료';
          badgeLine.append(tag);
        }
        const name=document.createElement('strong');name.textContent=HEROES[id].name;
        const detail=document.createElement('small');detail.textContent=descriptions[id];
        pick.setAttribute('aria-label',HEROES[id].name+(id===recommendedId?' · 추천 동료':'')+' · '+descriptions[id]);
        pick.append(portrait,badgeLine,name,detail);
        pick.addEventListener('click',()=>{
          this.chooseFirstCompanion(id,false);
        });
        wrap.appendChild(pick);
      }
      showModal('첫 번째 공세 완료','첫 동료를 선택하세요!','세 동료 중 하나가 무료로 합류합니다. 미선택 시 자동 영입됩니다.',[timer,track,wrap],[],true);
      renderHUD();
    }
    completeDraft(id,automatic=false){
      if(this.ended||this.pendingRecruit||!this.drafting||!this.draftChoices?.some(c=>c.id===id))return false;
      const card=this.draftChoices.find(c=>c.id===id);
      this.applyCard(id);
      this.draftRemaining=0;this.draftChoices=null;
      this.drafting=false;this.betweenWaves=700;
      if(activeModal&&activeModal.title==='성장의 순간!')closeModal(true);
      renderHUD();
      if(automatic)showBanner('자동 강화 · '+card.title);
      return true;
    }
    tickDraft(delta){
      if(!this.drafting||this.pendingRecruit||this.ended||!this.draftChoices?.length||
        this.manualPause||this.autoPause||document.visibilityState==='hidden')return;
      this.draftRemaining=Math.max(0,this.draftRemaining-Math.min(delta,100));
      const seconds=Math.ceil(this.draftRemaining/1000);
      if(seconds!==this.draftLastSecond){
        this.draftLastSecond=seconds;
        const label=$('draft-countdown');
        if(label)label.textContent='남은 시간 '+seconds+'초 · 미선택 시 자동 강화';
        const bar=$('draft-progress-fill');
        if(bar)bar.style.width=(this.draftRemaining/DRAFT_TIMEOUT*100)+'%';
      }
      if(this.draftRemaining===0){
        const best=this.draftChoices.find(c=>this.comboFor(c.id))||
          this.draftChoices.find(c=>c.rare)||this.draftChoices[0];
        this.completeDraft(best.id,true);
      }
    }
    showDraft(forceReroll=false){
      if(this.ended)return;
      if(this.pendingRecruit)return this.showRecruitDraft();
      this.drafting=true;
      if(forceReroll||!this.draftChoices)this.draftChoices=this.chooseCards();
      if(!this.draftRemaining)this.draftRemaining=DRAFT_TIMEOUT;
      const timer=document.createElement('div');timer.className='draft-countdown';timer.id='draft-countdown';
      timer.textContent='남은 시간 '+Math.ceil(this.draftRemaining/1000)+'초 · 미선택 시 자동 강화';
      const track=document.createElement('div');track.className='draft-progress';
      track.setAttribute('aria-hidden','true');
      const fill=document.createElement('span');fill.id='draft-progress-fill';
      fill.style.width=(this.draftRemaining/DRAFT_TIMEOUT*100)+'%';track.appendChild(fill);
      const wrap=document.createElement('div');wrap.className='card-grid draft-grid';
      this.draftChoices.forEach((card,i)=>{
        const b=document.createElement('button');b.type='button';b.className='spell-card draft-card'+
          (card.rare?' rare':'')+(this.comboFor(card.id)?' combo recommended':'');
        const icon=document.createElement('span');icon.className='spell-emoji';V.setIcon(icon,card.id==='bear'?'shield':card.id);paintElementSpell(icon,card.id,b);
        // A companion reward should show that companion, not an unrelated HUD glyph.
        if(['bear','rabbit','cat'].includes(card.id)){
          const art='url("./art/recruit-'+card.id+'-cutout-v50.webp")';
          icon.style.backgroundImage=art;icon.style.backgroundSize='contain';
          icon.style.backgroundPosition='center';
          icon.style.setProperty('--rani-icon-image',art);
          icon.style.setProperty('--rani-icon-size','contain');
          icon.style.setProperty('--rani-icon-position','center');
          icon.dataset.heroArt=card.id;
        }
        const title=document.createElement('strong');title.textContent=card.title;
        const desc=document.createElement('small');
        const combo=this.comboFor(card.id);
        desc.textContent=card.desc+(combo?' · '+combo+' 재료':'');
        const no=document.createElement('span');no.className='draft-index';no.textContent=String(i+1).padStart(2,'0');
        b.append(no,icon,title,desc);
        b.addEventListener('click',()=>this.completeDraft(card.id));
        wrap.appendChild(b);
      });
      const actions=[];
      if(!this.rerollUsed)actions.push(button('한 번 무료 새로고침',()=>{
        this.rerollUsed=true;closeModal(true);this.showDraft(true);
      },'alt'));
      showModal('제 '+this.wave.current+'차 공세 완료','성장의 순간!',
        '강화를 골라 수비대를 키우세요. 선택하지 않으면 자동으로 적용돼요.',
        [timer,track,wrap],actions,true);
      renderHUD();
    }
    applyCard(id){
      if(id==='power')this.damageBonus*=1.25;
      if(id==='haste')this.speedBonus*=1.2;
      if(id==='multi')this.multi=Math.min(3,this.multi+1);
      if(id==='ice')this.freeze++;
      if(id==='wall'){this.hp=Math.min(this.maxHP,this.hp+600);this.showElementCue('stone',210,526,true);}
      if(id==='flame')this.flame++;
      if(id==='crit')this.crit=Math.min(.65,this.crit+.13);
      if(id==='spark')this.spark=Math.min(3,this.spark+1);
      if(id==='roots')this.roots=Math.min(3,this.roots+1);
      if(id==='pierce')this.pierce=Math.min(2,this.pierce+1);
      if(id==='ward'){this.ward=Math.min(2,this.ward+1);this.wardCharges=Math.min(3,this.wardCharges+1);}
      if(id==='hunter')this.hunter=Math.min(2,this.hunter+1);
      this.cardCounts[id]=(this.cardCounts[id]||0)+1;
      if(this.flame&&this.cardCounts.haste&&!this.synergies.has('wildfire')){this.synergies.add('wildfire');showBanner('조합 완성 · 화염폭풍!');}
      if(this.freeze&&this.spark&&!this.synergies.has('thunderfrost')){this.synergies.add('thunderfrost');showBanner('조합 완성 · 빙뢰연쇄!');}
      if(this.multi&&this.crit>0&&!this.synergies.has('stormshot')){this.synergies.add('stormshot');this.multi=Math.min(4,this.multi+1);showBanner('조합 완성 · 폭풍 화살!');}
      if(this.cardCounts.wall>=2&&!this.synergies.has('fortress')){this.synergies.add('fortress');this.maxHP+=600;this.hp+=600;showBanner('조합 완성 · 불굴의 성벽!');}
      if(this.roots&&this.flame&&!this.synergies.has('bramblefire')){this.synergies.add('bramblefire');showBanner('조합 완성 · 불꽃 덩굴!');}
      if(this.ward&&this.cardCounts.wall&&!this.synergies.has('heartwood')){
        this.synergies.add('heartwood');this.maxHP+=250;this.hp=Math.min(this.maxHP,this.hp+250);
        showBanner('조합 완성 · 고목의 맹세!');
      }
      if(['bear','rabbit','cat'].includes(id))this.recruitHero(id);
      renderSlots();
    }
    finish(win){
      if(this.ended)return;this.ended=true;this.manualPause=true;
      $('boss-hud').hidden=true;$('terrain-indicator').hidden=true;
      $('arena-wrap').classList.remove('has-boss');
      this.heroSprites.forEach((spr,i)=>{if(spr&&spr.active){
        const id=this.heroIds[i],pose=win?'victory':'hurt';
        spr.setTexture('motion-'+id+'-'+pose+'-2');
        this.tweens.add({targets:spr,y:spr.y-(win?16:0),duration:240,yoyo:win,repeat:win?3:0});
      }});
      const record=state.stats[this.stage.id]||{wins:0,losses:0,streak:0};
      record.wins=Math.min(9999,(Number(record.wins)||0)+(win?1:0));
      record.losses=Math.min(9999,(Number(record.losses)||0)+(win?0:1));
      record.streak=win?0:Math.min(10,(Number(record.streak)||0)+1);
      state.stats[this.stage.id]=record;
      save();
      if(win){
        if(!state.clears.includes(this.stage.id))state.clears.push(this.stage.id);
        state.unlocked=Math.max(state.unlocked,Math.min(12,this.stage.id+2));
        state.best[this.stage.id]=Math.max(Number(state.best[this.stage.id])||0,this.hp);
        save();
      }
      const atFinal=win&&this.stage.id===STAGES.length-1;
      const result=makeResultPresentation(win,this.stage,this.hp,this.maxHP,this.coins,
        this.heroIds.filter(Boolean).length,record.streak);
      const actions=[button(atFinal?'모험 지도':win?'다음 스테이지':'다시 도전',()=>{
        if(atFinal){showMenu(false);return;}
        const next=win?this.stage.id+1:this.stage.id;
        closeModal(true);startStage(next);
      }),button(atFinal?'최종 스테이지 다시':'모험 지도',()=>{
        if(atFinal){closeModal(true);startStage(this.stage.id);}
        else showMenu(false);
      },'alt')];
      showModal(win?'방어 성공':'재도전',win?'스테이지 클리어!':'성벽을 지키지 못했어',
        '제'+this.stage.chapter+'장 · '+this.stage.name,[result],actions,false);
    }
    update(_time,delta){
      this.updateEliteCinematic();
      this.tickRecruit(delta);
      this.tickDraft(delta);
      if(this.ended||this.manualPause||this.autoPause||this.drafting)return;
      const dt=Math.min(delta,40)*this.speed;this.gameClock+=dt;
      this.updateAmbience(dt);
      this.skillCooldown=Math.max(0,this.skillCooldown-dt);
      if(this.roots&&this.enemies.length){
        this.trapTimer-=dt;
        if(this.trapTimer<=0){
          this.trapTimer=Math.max(5200,10000-this.roots*1400);
          this.activateRoots();
        }
      }
      if(this.betweenWaves>0){this.betweenWaves-=dt;if(this.betweenWaves<=0)this.wave.begin();}
      else this.wave.update(dt);
      for(let i=0;i<this.heroIds.length;i++){
        if(!this.heroIds[i])continue;
        this.attackTimes[i]-=dt;
        if(this.attackTimes[i]<=0&&this.enemies.length){
          this.shoot(i);this.attackTimes[i]=HEROES[this.heroIds[i]].interval/
            (this.speedBonus*(this.heroIds[i]==='megafox'&&this.evolutionPath==='moon'?1.18:1));
        }
      }
      this.updateBosses(dt);
      this.tickTerrain(dt);
      this.overlayTimer-=dt;
      if(this.overlayTimer<=0){this.overlayTimer=160;this.syncBattleOverlay();}
      $('arena-wrap').classList.toggle('boss-warning',this.enemies.some(e=>['boss','guardian'].includes(e.type)&&e.warning>0));
       if(this.focusReticle){
         if(this.focusEnemy&&this.enemies.includes(this.focusEnemy)&&this.gameClock<this.focusUntil){
           this.focusReticle.setPosition(this.focusEnemy.x,this.focusEnemy.y+20).setScale(1+Math.sin(this.gameClock/140)*.06);
         }else{this.focusReticle.destroy();this.focusReticle=null;this.focusEnemy=null;}
       }
      this.heroSprites.forEach((sprite,i)=>V.animate(sprite,this.heroIds[i],'idle',this.gameClock));
      for(const e of [...this.enemies]){
        e.slow=Math.max(0,e.slow-dt);
        e.rooted=Math.max(0,e.rooted-dt);
        e.surge=Math.max(0,e.surge-dt);
        e.y+=e.rooted>0?0:e.spd*(e.slow>0?.42:1)*(e.surge>0?2.2:1)*dt/1000;
        const wind=(this.stage.id===8||this.stage.id===10)?Math.sin(this.gameClock/900+e.windPhase)*18:0;
        // Illustrated creature behavior: thorn beetles weave and lunge, crystals pulse armor,
        // and the mushroom elite rallies nearby scouts once. No per-frame new textures.
        if((e.type==='thorn'||e.type==='imp') && e.y>(e.type==='imp'?260:185) && !e.hasDashed){
          e.hasDashed=true;e.surge=e.type==='imp'?380:720;V.trigger(e.spr,'attack',this.gameClock+400,this.gameClock);
          const dash=this.add.ellipse(e.x,e.y+15,56,18,0xc9df76,.18).setDepth(3);
          this.tweens.add({targets:dash,scale:1.7,alpha:0,duration:380,onComplete:()=>dash.destroy()});
        }
        if(e.type==='crystal'){
          const guarding=(this.gameClock+e.windPhase*300)%5200<1550;
          const cracked=e.crystalShatterUntil>this.gameClock;
          e.armor=Math.max(0,(guarding?Math.min(.55,e.baseArmor+.16):e.baseArmor)-(cracked?.15:0));
          if(guarding&&!e.guarding){V.trigger(e.spr,'attack',this.gameClock+400,this.gameClock);
            const shield=this.add.ellipse(e.x,e.y+12,65,32,0x81e2f8,.16).setStrokeStyle(2,0x93efff,.75).setDepth(3);
            this.tweens.add({targets:shield,scale:1.38,alpha:0,duration:490,onComplete:()=>shield.destroy()});
          }
          e.guarding=guarding;
        }
        if(e.type==='shroom'&&!e.hasRallied&&e.y>=245){
          e.hasRallied=true;V.trigger(e.spr,'attack',this.gameClock+600,this.gameClock);
          let allies=0;
          for(const ally of this.enemies){
            if(ally===e||!['sprout','runner','thorn','imp'].includes(ally.type)||Math.hypot(ally.x-e.x,ally.y-e.y)>145)continue;
            ally.surge=Math.max(ally.surge,850);allies++;
          }
          const spores=this.add.ellipse(e.x,e.y,110,48,0xe4bd81,.22).setStrokeStyle(3,0xf5d799,.7).setDepth(3);
          this.tweens.add({targets:spores,scale:1.65,alpha:0,duration:570,onComplete:()=>spores.destroy()});
          if(allies)showBanner('버섯 거한의 포자 함성 · 주변 적 돌진!');
        }
        if(e.type==='spore'&&!e.hasSpores&&e.hp<e.maxHP*.5){
          e.hasSpores=true;V.trigger(e.spr,'attack',this.gameClock+450,this.gameClock);let buffed=0;
          for(const ally of this.enemies){
            if(ally===e||ally.untargetable||Math.hypot(ally.x-e.x,ally.y-e.y)>105)continue;
            ally.surge=Math.max(ally.surge,520);buffed++;
          }
          const pulse=this.add.ellipse(e.x,e.y,50,24,0xdca26a,.25).setDepth(3);
          this.tweens.add({targets:pulse,scale:2.3,alpha:0,duration:520,onComplete:()=>pulse.destroy()});
          if(buffed)showBanner('포자 딱정벌레 · 주변 적 가속!');
        }
        const weave=e.type==='thorn'?Math.sin(this.gameClock/310+e.windPhase)*Math.min(13,Math.max(0,e.y/18)):
          e.type==='imp'?Math.sin(this.gameClock/215+e.windPhase)*Math.min(15,Math.max(0,e.y/22)):0;
        e.x=funnelX(e.baseX,e.y,wind)+weave;
        // Visual-only recoil: the enemy's movement, target coordinates, HP and
        // collision timing remain unchanged so game balance and saves are stable.
        const hurtUntil=e.spr.getData('motionUntil');
        const hurting=e.spr.getData('motionState')==='hurt'&&Number.isFinite(hurtUntil)&&this.gameClock<hurtUntil;
        const hurtStart=e.spr.getData('motionStart');
        const hurtProgress=hurting?Math.min(1,Math.max(0,(this.gameClock-hurtStart)/V.duration(e.type,'hurt'))):0;
        const attackUntil=e.spr.getData('motionUntil');
        const attackStart=e.spr.getData('motionStart');
        const attacking=e.spr.getData('motionState')==='attack'&&
          Number.isFinite(attackUntil)&&Number.isFinite(attackStart)&&this.gameClock<attackUntil;
        const attackProgress=attacking?Math.min(1,Math.max(0,
          (this.gameClock-attackStart)/V.duration(e.type,'attack'))):0;
        const attackMotion=attacking?Math.sin(Math.PI*attackProgress):0;
        const elite=['boss','guardian','shroom'].includes(e.type);
        const recoil=hurting?Math.sin(Math.PI*hurtProgress)*(elite?10:6):0;
        // Uniform size and vertical movement only: the painted silhouette
        // stays proportional and gameplay coordinates never change.
        e.spr.setPosition(e.x,e.y-recoil-attackMotion*(elite?9:5));
        e.spr.setScale(e.motionBaseScale*(1+attackMotion*(elite?.055:.032)));
        if(attacking&&e.lastAttackCue!==attackStart){
          e.lastAttackCue=attackStart;
          const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if(!reduced&&this.attackFxActive<12){
            this.attackFxActive++;
            const color=e.type==='crystal'?0x9ae9f4:e.type==='shroom'||e.type==='spore'?0xe9ba85:
              e.type==='guardian'||e.type==='boss'?0xe4d396:0xc5d58c;
            const tell=this.add.ellipse(e.x,e.y+15,elite?76:38,elite?22:12,color,.18).setDepth(3);
            this.tweens.add({targets:tell,scaleX:1.6,scaleY:1.35,alpha:0,
              duration:elite?390:260,onComplete:()=>{
                tell.destroy();this.attackFxActive=Math.max(0,this.attackFxActive-1);
              }});
          }
        }
        e.lifeBg.setPosition(e.x,e.y-e.lifeYOffset);e.life.setPosition(e.x,e.y-e.lifeYOffset);
        if(e.nameLabel)e.nameLabel.setPosition(e.x,e.y-e.lifeYOffset-19);
        V.animate(e.spr,e.type,'run',this.gameClock);
        if(e.y>=538){
          let leak=e.type==='boss'?580:e.type==='guardian'?360:e.type==='shroom'?255:e.type==='crystal'?190:e.type==='brute'?220:90;
          if(this.wardCharges>0){leak=Math.ceil(leak*.5);this.wardCharges--;this.showElementCue('forest',210,521,true);showBanner('숲의 수호 · 성벽 피해 감소!');}
          this.hp=Math.max(0,this.hp-leak);
          this.cameras.main.shake(110,.002);
          this.removeEnemy(e);renderHUD();if(this.hp<=0){this.finish(false);return;}
        }
      }
      for(let i=this.projectiles.length-1;i>=0;i--){
        const p=this.projectiles[i],t=p.target;
        if(!this.enemies.includes(t)){p.spr.destroy();p.trail.destroy();this.projectiles.splice(i,1);continue;}
        if(!p.released){
          if(this.gameClock<p.releaseAt)continue;
          this.releaseProjectile(p);
        }
        const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
        const speed=(p.kind==='rabbit'?510:p.kind==='cat'?465:660)*dt/1000;
        if(d<=speed+17){this.hitEnemy(t,p.damage,p.kind);p.spr.destroy();p.trail.destroy();this.projectiles.splice(i,1);}
        else{
          p.x+=dx/d*speed;p.y+=dy/d*speed;
          const angle=Math.atan2(dy,dx);
          p.spr.setPosition(p.x,p.y).setRotation(angle);
          p.trail.setPosition(p.x-Math.cos(angle)*17,p.y-Math.sin(angle)*17).setRotation(angle);
        }
      }
      renderCooldown();
    }
  }
  function renderSlots(){
    const wrap=$('hero-slots');wrap.replaceChildren();
    if(!battle)return;
    battle.heroIds.forEach((id,i)=>{
      const b=document.createElement('button');b.type='button';
      b.className='hero-slot'+(id?'':' empty')+(chosenSlot===i?' picked':'');
      if(!id&&i===HERO_RECRUIT_ORDER.find(slot=>battle.heroIds[slot]===null))b.classList.add('next-slot');
      b.dataset.targetMode=battle.targetModes[i];
      b.dataset.modeLabel=id?(battle.targetModes[i]==='threat'?'위협':'선두'):'';
      const icon=document.createElement('strong');if(id)V.portrait(icon,id);else icon.className='empty-station';
      const text=document.createElement('span');
      text.textContent=id?HEROES[id].name:battle.pendingRecruit?'영입 선택':'대기';
      b.append(icon,text);b.setAttribute('aria-label','전열 '+(i+1)+'번 '+text.textContent+(id?' · 타깃 '+b.dataset.modeLabel+' · 같은 칸 두 번 선택해 변경':''));
      b.addEventListener('click',()=>{
        if(!battle||battle.ended)return;
        if(battle.pendingRecruit&&!id){battle.preferredRecruitSlot=i;battle.showRecruitDraft();return;}
        if(battle.drafting)return;
        if(chosenSlot<0){chosenSlot=i;battle.previewRange(i);renderSlots();return;}
        if(chosenSlot===i){
          if(id){battle.targetModes[i]=battle.targetModes[i]==='front'?'threat':'front';
            showBanner(HEROES[id].name+' 표적 전술: '+(battle.targetModes[i]==='threat'?'강한 적 우선':'성벽 가까운 적 우선'));}
          chosenSlot=-1;renderSlots();return;
        }
        const a=chosenSlot,ids=battle.heroIds,sprites=battle.heroSprites,times=battle.attackTimes,modes=battle.targetModes;
        [ids[a],ids[i]]=[ids[i],ids[a]];[sprites[a],sprites[i]]=[sprites[i],sprites[a]];
        [times[a],times[i]]=[times[i],times[a]];[modes[a],modes[i]]=[modes[i],modes[a]];
        battle.layoutHeroSprites();
        chosenSlot=-1;renderSlots();
      });wrap.appendChild(b);
    });
  }
  function renderEvolution(){
    if(!battle)return;
    const ready=!battle.evolved&&battle.foxSpirit>=10&&battle.heroIds.includes('fox');
    const b=$('evo-btn');b.disabled=!ready||battle.manualPause||battle.drafting;
    b.classList.toggle('ready',ready);
    $('evo-caption').textContent=battle.evolved?(battle.evolutionPath==='sun'?'햇살 진화':'달빛 진화'):ready?'진화 선택':'진화 '+battle.foxSpirit+'/10';
  }
  function renderCooldown(){
    if(!battle)return;
    const remaining=Math.ceil(battle.skillCooldown/1000);
    $('skill-timer').textContent=remaining?String(remaining):'';
    $('skill-timer').hidden=!remaining;
    $('skill-caption').textContent=battle.pendingRecruit?'동료 선택':battle.drafting?'강화 선택':'일제사격';
    $('skill-btn').disabled=(!battle.drafting&&!!remaining)||battle.manualPause;
  }
  function renderHUD(){
    if(!battle)return;
    $('wave-label').textContent=battle.wave.current+' / '+battle.stage.waves+' 공세';
    $('coin-label').textContent=String(battle.coins);
    const repair=$('repair-btn');
    const repairable=!battle.ended&&battle.hp<battle.maxHP&&battle.repairs<REPAIR_LIMIT;
    repair.disabled=!repairable||battle.manualPause||battle.autoPause||battle.drafting;
    repair.classList.toggle('ready',repairable&&battle.coins>=REPAIR_COST);
    repair.title='별빛 '+REPAIR_COST+'개로 성벽 '+REPAIR_HEAL+' 회복 · 남은 수리 '+(REPAIR_LIMIT-battle.repairs)+'회';
    repair.setAttribute('aria-label',repair.title);
    battle.drawFortHUD();
    const scout=$('wave-scout'),next=battle.wave.current+1;
    const mid=Math.max(4,Math.ceil(battle.stage.waves*.55));
    const warning=battle.wave.isMidBoss()?'중간보스 출현 중':battle.wave.isEliteWave()?'정예 몬스터 출현 중':
      next===mid?'다음 공세 · 숲길 파수꾼':
      next===battle.stage.waves&&battle.stage.id%4!==3?'최종 공세 · 버섯 거한':
      next<=battle.stage.waves&&next>=3&&next%3===0?'다음 공세 · 버섯 거한':null;
    scout.hidden=!warning;scout.textContent=warning||'';
    scout.classList.toggle('danger',battle.wave.isMidBoss()||battle.wave.isEliteWave());
    $('hp-label').textContent=String(battle.hp);
    $('hp-fill').style.width=(battle.hp/battle.maxHP*100)+'%';
    $('arena-wrap').classList.toggle('fort-danger',battle.hp/battle.maxHP<.3);
    $('fort-health').setAttribute('aria-valuenow',String(battle.hp));
    $('speed-btn').textContent='×'+battle.speed;
    $('battle-hint').textContent=battle.pendingRecruit?'동료 선택을 눌러 수비대를 키워보세요':
      battle.heroIds.filter(Boolean).length===1?'첫 공세 후 동료 합류 · 최대 5명 편성':
      '수비대 '+battle.heroIds.filter(Boolean).length+'/5 · 영웅 선택으로 표적과 위치 조정';
    renderCooldown();renderEvolution();
  }
  $('start-btn').addEventListener('click',()=>startStage(state.selected));
  $('stage-list-btn').addEventListener('click',openStagePicker);
  document.querySelectorAll('#stage-chapter-tabs .stage-chapter-tab').forEach((tab,index)=>{
    tab.addEventListener('click',()=>showMapChapter(index));
  });
  $('stage-back-btn').addEventListener('click',closeStagePicker);
  $('stage-enter-btn').addEventListener('click',()=>startStage(state.selected));
  $('resume-btn').addEventListener('click',resumeBattle);
  $('help-btn').addEventListener('click',showHelp);
  $('intel-btn').addEventListener('click',showIntel);
  $('home-btn').addEventListener('click',()=>showMenu(true));
  $('pause-btn').addEventListener('click',showPause);
  // A real browser fullscreen toggle, not just a CSS zoom. iOS Safari may not expose this API.
  const viewButton=$('view-btn');
  const fullscreenTarget=$('app');
  viewButton.hidden=typeof fullscreenTarget.requestFullscreen!=='function';
  function syncViewButton(){
    const on=!!document.fullscreenElement;
    viewButton.textContent=on?'창모드':'전체';
    viewButton.setAttribute('aria-label',on?'전체화면 종료':'전체화면으로 플레이');
    viewButton.setAttribute('aria-pressed',String(on));
  }
  viewButton.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else await fullscreenTarget.requestFullscreen({navigationUI:'hide'});
    }catch(_error){showBanner('이 브라우저는 전체화면 전환을 지원하지 않아요');}
    syncViewButton();
  });
  document.addEventListener('fullscreenchange',syncViewButton);
  syncViewButton();
  $('repair-btn').addEventListener('click',()=>{if(battle)battle.repairWall();});
  $('speed-btn').addEventListener('click',()=>{if(battle&&!battle.ended){battle.speed=battle.speed===1?2:1;renderHUD();}});
  $('skill-btn').addEventListener('click',()=>{if(battle){if(battle.pendingRecruit)battle.showRecruitDraft();else if(battle.drafting)battle.showDraft();else battle.castSkill();}});
  $('evo-btn').addEventListener('click',()=>{if(battle)battle.evolveFox();});
  $('modal-close').addEventListener('click',()=>{
    if(activeModal&&(activeModal.kicker==='잠깐 쉬어가기'||activeModal.kicker==='진화 선택')&&battle)battle.manualPause=false;
    if(activeModal&&activeModal.kicker==='숲에서 나가기'&&battle&&!suspended)battle.manualPause=false;
    const pendingDraft=!!battle&&battle.drafting;
    closeModal(false);renderCooldown();
    if(pendingDraft)showBanner(battle.pendingRecruit?'아래 동료 선택을 눌러 계속하세요':'아래 강화 선택을 눌러 계속하세요');
  });
  V.setIcon(document.querySelector('.brand-seal'),'fox');
  V.setIcon(document.querySelector('#start-btn span'),'play');
  V.setIcon(document.querySelector('#help-btn .help-icon'),'help');
  V.setIcon(document.querySelector('#evo-btn span'),'evo');
  V.setIcon(document.querySelector('#skill-btn span'),'skill');
  V.setIcon($('home-btn'),'back');
  V.setIcon(document.querySelector('#repair-btn .coin-glyph'),'coin');
  V.setIcon($('pause-btn'),'pause');
  // Coin uses the dedicated artwork from CSS.
  // Local development QA only; not exposed on public GitHub Pages.
  if((location.hostname==='127.0.0.1'||location.hostname==='localhost')&&new URLSearchParams(location.search).has('fgqa')){
    window.__ForestGuardQA={
      finish(win){if(battle&&!battle.ended)battle.finish(!!win);},
      async openChapterBossForQA(id){
        if(![0,3,7,11].includes(id))return false;
        const unlocked=state.unlocked;
        try{
          state.unlocked=12;
          await startStage(id);
          return true;
        }finally{state.unlocked=unlocked;}
      },
      chapterBossPaintingQA(){
        if(!battle||battle.ended||![3,7,11].includes(battle.stage.id))return null;
        const sheet=chapterBossBitmaps[battle.stage.id];
        const frame=battle.textures.get('motion-boss-attack-0').getSourceImage();
        return {stage:battle.stage.id,loaded:!!sheet,
          dimensions:sheet?[sheet.naturalWidth,sheet.naturalHeight]:null,
          frameSize:[frame.width,frame.height],
          attackFrames:Array.from({length:6},(_,i)=>battle.textures.exists('motion-boss-attack-'+i)),
          hurtFrames:Array.from({length:6},(_,i)=>battle.textures.exists('motion-boss-hurt-'+i))};
      },
      previewChapterBossForQA(){
        if(!battle||battle.ended||![3,7,11].includes(battle.stage.id))return null;
        battle.spawnEnemy('boss');
        const e=battle.enemies[battle.enemies.length-1];
        e.baseX=210;e.x=210;e.y=255;e.spd=0;e.spr.setPosition(210,255);
        battle.syncBattleOverlay();
        return {portrait:document.getElementById('boss-portrait').className,
          background:getComputedStyle(document.getElementById('boss-portrait')).backgroundImage,
          bossTitle:document.getElementById('boss-title').textContent};
      },
      chapterOneSentinelQA(){
        if(!battle||battle.ended||battle.stage.id!==0)return null;
        const loaded=!!forestSentinelBitmap;
        const frames=Array.from({length:6},(_,i)=>battle.textures.exists('motion-guardian-attack-'+i));
        const frame=battle.textures.get('motion-guardian-attack-0').getSourceImage();
        battle.spawnEnemy('guardian');
        const e=battle.enemies[battle.enemies.length-1];
        e.x=210;e.y=245;e.spd=0;e.spr.setPosition(210,245);
        battle.syncBattleOverlay();
        return {loaded,frames,frameSize:[frame.width,frame.height],portrait:document.getElementById('boss-portrait').className,
          background:getComputedStyle(document.getElementById('boss-portrait')).backgroundImage,
          title:document.getElementById('boss-title').textContent};
      },
      showEliteIntro(type='shroom'){
        if(!battle||battle.ended)return false;
        battle.lastEliteCinematicWave=-1;
        battle.announceElite({type});return true;
      },
      eliteInfo(){
        const cut=battle?.eliteCinematic;
        return cut?.hero?.active?{alpha:cut.hero.alpha,labelAlpha:cut.label.alpha,
          label:cut.label.text,holdMs:cut.holdMs,fadeMs:cut.fadeMs,
          elapsed:Math.round(battle.time.now-cut.startTime)}:null;
      },
      heroRanges(){return Object.fromEntries(Object.entries(HEROES).map(([id,role])=>[id,role.range]));},
      monsterCutoutAlpha(){
        if(!battle||battle.ended)return null;
        return Object.fromEntries(['sprout','runner','brute','boss','thorn','spore','imp','crystal','shroom','guardian'].map(type=>{
          const canvas=battle.textures.get('enemy-'+type).getSourceImage();
          const ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
          return [type,[[0,0],[w-1,0],[0,h-1],[w-1,h-1]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3])];
        }));
      },
      monsterHurtPaintingQA(){
        if(!battle||battle.ended)return null;
        const kinds=['sprout','runner','brute','boss','thorn','spore','imp','crystal','shroom','guardian'];
        return {loaded:!!monsterHurtBitmap,
          sourceSize:monsterHurtBitmap?[monsterHurtBitmap.naturalWidth,monsterHurtBitmap.naturalHeight]:null,
          items:Object.fromEntries(kinds.map(type=>{
            const key='motion-'+type+'-hurt-2',texture=battle.textures.get(key);
            const canvas=texture.getSourceImage(),ctx=canvas.getContext('2d',{willReadFrequently:true});
            const samples=[[0,0],[127,0],[0,127],[127,127]].map(([x,y])=>
              ctx.getImageData(x,y,1,1).data[3]);
            const image=ctx.getImageData(0,0,128,128).data;
            let opaque=0;
            for(let i=3;i<image.length;i+=4)if(image[i]>128)opaque++;
            return [type,{transparentCorners:samples.every(alpha=>alpha===0),opaquePixels:opaque}];
          }))};
      },
      performanceSnapshot(){
        if(!battle)return null;
        const memory=performance.memory;
        return {textures:Object.keys(battle.textures.list||{}).length,
          effects:battle.effects.length,dyingSprites:battle.dyingSprites,
          enemies:battle.enemies.length,projectiles:battle.projectiles.length,
          usedJSHeap:memory?.usedJSHeapSize??null,
          jsHeapLimit:memory?.jsHeapSizeLimit??null,
          stageEnded:battle.ended};
      },
      bossSingleIndicator(){
        if(!battle||battle.ended)return null;
        battle.spawnEnemy('guardian');
        const enemy=[...battle.enemies].reverse().find(e=>e.type==='guardian');
        const result={upper:!document.getElementById('boss-hud').hidden,
          overhead:enemy.life.visible||enemy.lifeBg.visible||!!enemy.nameLabel,
          warningBar:!!enemy.tellBack||!!enemy.tellFill};
        battle.removeEnemy(enemy);
        return result;
      },
      previewGrowth(cardIds){
        if(!battle||battle.ended||battle.pendingRecruit)return false;
        if(Array.isArray(cardIds)){
          const choices=cardIds.map(id=>CARDS.find(card=>card.id===id));
          if(choices.length!==3||choices.some(card=>!card))return false;
          battle.draftChoices=choices;
          battle.showDraft(false);
        }else battle.showDraft(true);
        return true;
      },
      rosterInfo(){return battle?{capacity:HERO_CAPACITY,ids:[...battle.heroIds],positions:[...HERO_POSITIONS]}:null;},
      damageFeedback(){
        if(!battle||battle.ended)return null;
        const enemy=battle.enemies.find(e=>!['shroom','guardian','boss'].includes(e.type));
        if(!enemy)return null;
        const noBar=enemy.life.visible===false&&enemy.lifeBg.visible===false;
        battle.hitEnemy(enemy,1,'fox');
        return {ordinaryBarHidden:noBar,floatCount:battle.damageFloatCount,
          heroCount:battle.heroIds.filter(Boolean).length};
      },
      elementVisuals(){
         if(!battle||battle.ended)return null;
         return {sourceReady:!!elementSpellBitmap,
           textures:Object.fromEntries(['forest','frost','stone','flame'].map(kind=>
             [kind,battle.textures.exists('element-cue-'+kind)]))};
       },
       previewElementCues(){
         if(!battle||battle.ended)return null;
         return ['forest','frost','stone','flame'].map((kind,i)=>
           battle.showElementCue(kind,72+i*92,310,true));
       },
       attackFrameSpill(){
         if(!battle||battle.ended)return null;
         return Object.fromEntries(['fox','bear','rabbit','cat','megafox'].map(id=>{
           const key='motion-'+id+'-attack-3';
           if(!battle.textures.exists(key))return [id,-1];
           const canvas=battle.textures.get(key).getSourceImage();
           const pixels=canvas.getContext('2d',{willReadFrequently:true})
             .getImageData(0,0,canvas.width,canvas.height).data;
           let red=0;
           for(let p=0;p<pixels.length;p+=4){
             const r=pixels[p],g=pixels[p+1],b=pixels[p+2],a=pixels[p+3];
             if(a>0&&r>=185&&g<=92&&b<=90&&r>g*1.95&&r>b*1.9)red++;
           }
           return [id,red];
         }));
       },
       shroomAttackPaintingQA(){
         if(!battle||battle.ended||!mushroomAttackBitmap)return null;
         const frames=Array.from({length:6},(_,i)=>{
           const key='motion-shroom-attack-'+i;
           if(!battle.textures.exists(key))return null;
           const canvas=battle.textures.get(key).getSourceImage();
           return canvas.getContext('2d',{willReadFrequently:true})
             .getImageData(0,0,128,128).data;
         });
         if(frames.some(frame=>!frame))return {loaded:false};
         const alike=(a,b)=>frames[a].every((value,i)=>value===frames[b][i]);
         const corners=frames.map(data=>[3,127*4+3,127*128*4+3,(128*128-1)*4+3]
           .every(index=>data[index]===0));
         return {loaded:true,returnPoses:alike(2,4)&&alike(1,5),
           fullMotion:!alike(0,3),transparentCorners:corners.every(Boolean)};
       },
       motionInfo(){
         if(!battle||battle.ended)return null;
         return {heroAttack8:battle.textures.exists('motion-fox-attack-7'),
           foxRasterReady:!!foxAttackBitmap,
           paintedHeroAttacks:Object.fromEntries(Object.entries(heroAttackBitmaps).map(([id,img])=>
             [id,!!img&&battle.textures.exists('motion-'+id+'-attack-7')])),
           ordinaryHurt5:battle.textures.exists('motion-sprout-hurt-4'),
           hurtDuration:V.duration('sprout','hurt'),
           eliteAttack6:battle.textures.exists('motion-shroom-attack-5'),
           eliteHurt6:battle.textures.exists('motion-guardian-hurt-5'),
           paintedMonsterHurt:!!monsterHurtBitmap,
           paintedMonsterKinds:monsterHurtBitmap?10:0,
           ordinaryDeath5:battle.textures.exists('motion-sprout-death-4'),
           eliteDeath6:battle.textures.exists('motion-shroom-death-5'),
           deathDuration:V.duration('shroom','death'),
           heroDuration:V.duration('fox','attack')};
       },
       attackReleaseQA(){
         if(!battle||battle.ended||battle.drafting)return null;
         battle.spawnEnemy('runner');
         const target=battle.enemies[battle.enemies.length-1];
         target.y=405;target.spd=0;
         const previousFocus=battle.focusEnemy,previousUntil=battle.focusUntil;
         battle.focusEnemy=target;battle.focusUntil=battle.gameClock+1000;
         const count=battle.projectiles.length;
         battle.shoot(2);
         const shots=battle.projectiles.slice(count).filter(p=>p.target===target);
         const first=shots[0];
         const staged=!!first&&shots.every(p=>!p.spr.visible&&!p.trail.visible&&
           !p.released&&p.releaseAt>battle.gameClock);
         const fox=battle.heroSprites[2],savedX=fox.x,savedY=fox.y;
         fox.setPosition(savedX+3,savedY-2);
         if(first)battle.releaseProjectile(first);
         const socket=!!first&&first.released&&first.spr.visible&&first.trail.visible&&
           Math.abs(first.x-(fox.x+HERO_MUZZLES.fox[0]+first.muzzleOffset))<.01&&
           Math.abs(first.y-(fox.y+HERO_MUZZLES.fox[1]))<.01;
         fox.setPosition(savedX,savedY);
         for(const p of battle.projectiles.splice(count)){p.spr.destroy();p.trail.destroy();}
         battle.focusEnemy=previousFocus;battle.focusUntil=previousUntil;
         battle.removeEnemy(target);
         return {staged,socket,releaseDelay:first?.releaseAt-battle.gameClock||0,
           launchCount:shots.length,animation:fox.getData('motionState')};
       },
       attackGestureQA(){
         if(!battle||battle.ended||battle.drafting)return null;
         battle.spawnEnemy('runner');
         const enemy=battle.enemies[battle.enemies.length-1];
         enemy.y=260;enemy.spd=0;
         const start=battle.gameClock;
         V.trigger(enemy.spr,'attack',start+V.duration('runner','attack'),start);
         battle.update(0,32);
         const result={state:enemy.spr.getData('motionState'),
           scaleRatio:enemy.spr.scaleX/enemy.motionBaseScale,
           preservedAspect:Math.abs(enemy.spr.scaleX-enemy.spr.scaleY)<.0001,
           animation:enemy.spr.texture.key.startsWith('motion-runner-attack-'),
           gameplayY:enemy.y};
         battle.removeEnemy(enemy);
         return result;
       },
       previewDefeat(){
         if(!battle||battle.ended)return null;
         const before=battle.enemies.length;
         battle.spawnEnemy('sprout');
         const enemy=battle.enemies[battle.enemies.length-1];
         enemy.y=285;enemy.spr.setPosition(210,285);
         battle.removeEnemy(enemy,true);
         return {enemyCountUnchanged:battle.enemies.length===before,
           deathCount:battle.dyingSprites,texture:enemy.spr.texture.key};
       },
       deathFxCount(){return battle?.dyingSprites??null;},
       damageNumberTrack(){
         if(!battle||battle.ended)return null;
         const dummy={type:'sprout',x:160,y:275,spr:{active:true}};
         const float=battle.showDamageNumber(dummy,26,false,'fox');
         if(!float)return null;
         const origin=float.x;
         dummy.x+=36;
         return new Promise(resolve=>setTimeout(()=>
           resolve({shift:float.active?float.x-origin:0,alive:float.active}),130));
       },
       renderInfo(){
        if(!battle||!battle.rampartFront)return null;
        const front=battle.rampartFront,hero=battle.heroSprites.find(Boolean);
        return {frontTexture:front.texture.key,frontDepth:front.depth,frontY:front.y,
          heroDepth:hero?.depth,heroY:hero?.y,heroHeight:hero?.displayHeight,
          artLoaded:!!rampartBitmap,fieldCount:game?.scene?.scenes?.[0]?.children?.list?.filter(
            node=>node.texture?.key==='field').length||0};
      }
    };
  }
  renderMap();updateMenuStory();setupHistory();
})();
