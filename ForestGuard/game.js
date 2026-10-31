/* 라니 수비대 v0.9.0 — © 2026 곰같은여우
 * Original game rules, PNG character art, Canvas field art and interface.
 * Combat architecture informed by MIT-licensed Phaser 3 and the WaveManager,
 * EnemyManager and Projectile patterns of rupertgermann/tower-defence.
 * No SVG, forced advertisements, telemetry, accounts or external art assets.
 */
(() => {
  'use strict';
  const SAVE_KEY = 'gomfox.forestguard.v1';
  const REPAIR_COST = 120, REPAIR_HEAL = 420, REPAIR_LIMIT = 2;
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
    guardian:{name:'숲의 수호자',trait:'일반 스테이지 중간보스',counter:'일제사격으로 충격파 저지',detail:'전투 한복판에 나타나 성벽에 충격파를 가해요.'},
    spore:{name:'포자 딱정벌레',trait:'버섯 장갑 · 근처 적 가속',counter:'집중 사격 · 불꽃',detail:'체력이 줄면 주변 몬스터를 한 번 재촉해요.'},
    imp:{name:'이끼 숲 임프',trait:'고속 회피 정찰병',counter:'서리 · 선두 우선',detail:'화살 사이를 빠르게 비집고 뛰어와요.'}
  };
  // Wide enemy front narrows naturally toward the defenders. Movement uses no SVG paths.
  function funnelX(entryX,y,wind=0){
    const progress=Math.max(0,Math.min(1,(y+38)/576));
    const easing=progress*progress*(3-2*progress);
    return 210+(entryX-210)*(1-.53*easing)+wind*(1-.45*progress);
  }
  const STAGE_TIPS = [
    '처음에는 새싹 무리를 막고 성벽을 지켜 주세요.',
    '빠른 버섯이 쏟아져요. 서리 또는 덩굴로 진군을 늦추세요.',
    '양쪽 길에서 달려와요. 용병 위치를 수시로 조정하세요.',
    '뿌리 거인의 돌진 예고에 맞춰 일제사격으로 저지하세요.',
    '안개로 사정거리가 줄어요. 추적의 눈으로 시야를 회복하세요.',
    '부서진 다리 때문에 적들이 중앙으로 모여요. 관통이 유리해요.',
    '3공세마다 포자 군단이 늘어나요. 범위 공격을 준비하세요.',
    '가면 두더지가 잠복하며 위치를 바꿔요. 경고를 놓치지 마세요.',
    '돌풍에 적의 위치가 흔들려요. 다중 화살이 유리해요.',
    '수정 갑옷은 일반 화살 피해를 30% 줄여요. 관통을 선택하세요.',
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
  const SYNERGY_RECIPES = [
    ['flame','haste','wildfire','화염폭풍'],
    ['ice','spark','thunderfrost','빙뢰연쇄'],
    ['multi','crit','stormshot','폭풍 화살'],
    ['roots','flame','bramblefire','불꽃 덩굴'],
    ['ward','wall','heartwood','고목의 맹세']
  ];
  const HEROES = {
    fox:{name:'여우 궁수',icon:'🦊',damage:27,interval:680,range:590,color:0xffce6a},
    megafox:{name:'곰같은여우',icon:'🦊',damage:69,interval:460,range:740,color:0xffdf80},
    bear:{name:'곰 수호자',icon:'🐻',damage:42,interval:1250,range:445,color:0xeab68c},
    rabbit:{name:'토끼 마법사',icon:'🐰',damage:24,interval:1050,range:555,color:0xa9eafa},
    cat:{name:'고양이 기술자',icon:'🐱',damage:31,interval:1150,range:495,color:0xff9b6f}
  };
  const state = {unlocked:1,clears:[],best:{},selected:0,muted:false};
  try {
    const loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (loaded && typeof loaded === 'object') {
      state.unlocked = Math.min(12,Math.max(1,Number(loaded.unlocked) || 1));
      state.clears = Array.isArray(loaded.clears) ? loaded.clears.filter(n=>Number.isInteger(n)&&n>=0&&n<12) : [];
      state.best = loaded.best && typeof loaded.best === 'object' ? loaded.best : {};
    }
  } catch(_e) { /* Private browsing may restrict storage. */ }
  let game = null, battle = null, activeModal = null, focusBeforeModal = null, suspended = false;
  let pendingStageIndex = 0, atlasBitmap = null, evolutionBitmap = null, fieldBitmap = null, atlasPromise = null, starting = false;
  const biomeBitmaps = [null,null,null];
  const biomeLoading = [null,null,null];
  const biomeFiles = ['forest-entrance-v08.png','misty-canyon-v08.png','moonlit-highland-v08.png'];
  let monsterBitmap = null, fortBitmap = null;
  const ART_VERSION = '20261031r';
  async function prepareAtlas(stageIndex){
    const load=(url,assign)=>new Promise(resolve=>{
      if(!url){resolve();return;}
      const art=new Image();
      let settled=false, timer=0;
      const finish=ok=>{
        if(settled)return;
        settled=true;clearTimeout(timer);art.onload=null;art.onerror=null;
        if(ok)assign(art);
        else console.warn('원화 불러오기 지연/실패, 기본 화면 사용:',url);
        resolve();
      };
      art.onload=()=>finish(true);
      art.onerror=()=>finish(false);
      timer=setTimeout(()=>{finish(false);art.src='';},8000);
      art.src=url;
    });
    if(!atlasPromise)atlasPromise=Promise.all([
      load('./art/forest-characters.png?v=20261031c',art=>{atlasBitmap=art;}),
      load('./art/rani-evolution.png?v=20261031c',art=>{evolutionBitmap=art;}),
      load('./art/forest-battleground-v04.webp?v=20261031d',art=>{fieldBitmap=art;}),
      load('./art/forest-monsters-v14-clean.webp?v='+ART_VERSION,art=>{monsterBitmap=art;}),
      load('./art/fort-hud-v14.webp?v='+ART_VERSION,art=>{fortBitmap=art;})
    ]);
    const biome=Math.floor(stageIndex/4);
    if(!biomeLoading[biome])biomeLoading[biome]=load('./art/'+biomeFiles[biome]+'?v=20261031i',art=>{biomeBitmaps[biome]=art;});
    await Promise.all([atlasPromise,biomeLoading[biome]]);
  }
  let closeBannerTimer = 0, chosenSlot = -1, historyInitialized = false;
  function save() {
    try { localStorage.setItem(SAVE_KEY,JSON.stringify({unlocked:state.unlocked,clears:state.clears,best:state.best})); }
    catch(_e) { /* Play remains available without persistent storage. */ }
  }
  function button(label, onClick, variant) {
    const b = document.createElement('button'); b.type='button'; b.textContent=label;
    b.className='modal-action'+(variant==='alt'?' alt':''); b.addEventListener('click',onClick); return b;
  }
  function setVisible(id,show) { $(id).hidden=!show; }
  function renderMap() {
    const grid=$('stage-grid'); grid.replaceChildren();
    STAGES.forEach((stage,index)=>{
      const b=document.createElement('button'); b.type='button';
      const locked = index>=state.unlocked, cleared=state.clears.includes(index);
      b.className='stage-tile'+(locked?' locked':'')+(cleared?' cleared':'')+(state.selected===index?' selected':'')+(index%4===3?' boss':'');
      const spot=STAGE_SPOTS[index];b.style.setProperty('--spot-x',spot[0]+'%');b.style.setProperty('--spot-y',spot[1]+'%');
      b.disabled=locked;
      const n=document.createElement('span'); n.className='num'; n.textContent=locked?'':(stage.chapter+'-'+((index%4)+1));
      if(locked)V.setIcon(n,'lock');
      if(cleared){const star=document.createElement('i');star.className='clear-star';V.setIcon(star,'star');b.appendChild(star);}
      const small=document.createElement('span'); small.className='tiny'; small.textContent=locked?'잠김':(index%4===3?'두목':cleared?'완료':'도전');
      b.append(n,small); b.setAttribute('aria-label',stage.name+(locked?' 잠김':' 선택'));
      b.addEventListener('click',()=>{state.selected=index;renderMap();updateMenuStory();});
      grid.appendChild(b);
    });
    $('progress-label').textContent=state.clears.length+' / 12 클리어';
  }
  function updateMenuStory(){
    const stage=STAGES[state.selected], box=document.querySelector('.story-panel');
    box.querySelector('.story-chapter').textContent='제'+stage.chapter+'장 · '+stage.gimmick;
    box.querySelector('h2').textContent=stage.name;
    box.querySelector('p').textContent=stage.story;
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
    closeModal(true);
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
    try{await prepareAtlas(index);}
    finally{
      starting=false;
      $('start-btn').disabled=false;
      updateMenuStory();
    }
    if(game){game.destroy(true);game=null;battle=null;}
    state.selected=index; suspended=false;chosenSlot=-1;
    setVisible('menu',false);setVisible('game-screen',true);
    $('stage-name').textContent=STAGES[index].name; $('wave-label').textContent='전투 준비';
    const root=$('game-root');root.replaceChildren();
    if(typeof Phaser==='undefined'){
      showModal('연결 확인','게임 엔진을 불러오지 못했어요.','인터넷 연결 후 다시 시도해 주세요.',[],[
        button('모험 지도로',()=>showMenu(false))],false);return;
    }
    pendingStageIndex=index;
    game=new Phaser.Game({
      type:Phaser.AUTO,parent:'game-root',width:420,height:650,
      backgroundColor:'#7c8f57',render:{pixelArt:false,antialias:true},
      scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:420,height:650},
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
    $('modal-layer').hidden=false;
    requestAnimationFrame(()=>{const el=$('modal-box').querySelector('button');if(el)el.focus();});
  }
  function closeModal(force){
    if(activeModal && !activeModal.allowClose && !force)return;
    activeModal=null;$('modal-layer').hidden=true;
    if(focusBeforeModal && typeof focusBeforeModal.focus==='function')focusBeforeModal.focus();
    if(battle)renderHUD();
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
  function paintField(c,w,h,stage){
    const random=(()=>{let seed=10009+stage*9127;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};})();
    const m=stage>=8?'#7b8b86':stage>=4?'#8c9370':'#b5ab77';
    c.fillStyle='#315336';c.fillRect(0,0,w,h);
    c.fillStyle=m;c.fillRect(31,0,w-62,h-112);
    for(let i=0;i<280;i++){
      let x=random()*w,y=random()*(h-110),r=1+random()*5;
      if(x>34&&x<w-34){c.fillStyle=random()>.55?'#9d9560':'#c8be87';blob(c,x,y,r,Math.max(1,r*.45),c.fillStyle);}
      else{blob(c,x,y,r+5,r+2,random()>.4?'#507943':'#355d3b');}
    }
    for(let side=0;side<2;side++){
      const x=side===0?20:w-20;
      for(let y=-5;y<h-110;y+=26){
        blob(c,x+(random()-.5)*15,y,22+random()*12,18+random()*6,random()>.5?'#2e6037':'#39723d','#244b31');
        blob(c,x+(random()-.5)*11,y-4,14,8,'#659554');
      }
    }
    // A separately painted stone barricade and cobbled defender platform.
    c.fillStyle='#705e4b';c.fillRect(0,h-128,w,128);
    c.fillStyle='#c7b395';c.fillRect(0,h-127,w,29);
    c.fillStyle='#4d463e';c.fillRect(0,h-128,w,5);
    for(let row=0;row<2;row++)for(let x=-25+(row?16:0);x<w;x+=48){
      c.fillStyle=row?'#b7a88a':'#e2d0ac';c.fillRect(x,h-123+row*15,45,13);
      c.strokeStyle='#726959';c.lineWidth=2;c.strokeRect(x,h-123+row*15,45,13);
    }
    c.fillStyle='#9b856b';c.fillRect(0,h-96,w,9);
    for(let i=0;i<90;i++){let x=random()*w,y=h-88+random()*86;blob(c,x,y,3+random()*5,1+random()*2,random()>.5?'#806d57':'#a18e73');}
  }
  function buildTextures(scene){
    createCanvasTexture(scene,'fort-plaque',328,59,c=>paintFortPlaque(c,3000,3000));
    createCanvasTexture(scene,'field',420,650,(c,w,h)=>{
      const scenery=biomeBitmaps[Math.floor(scene.stage.id/4)]||fieldBitmap;
      if(!scenery){paintField(c,w,h,scene.stage.id);return;}
      const iw=scenery.naturalWidth,ih=scenery.naturalHeight;
      const scale=Math.max(w/iw,h/ih),cw=w/scale,ch=h/scale;
      c.drawImage(scenery,(iw-cw)/2,(ih-ch)/2,cw,ch,0,0,w,h);
      // Four stage moods per original illustrated biome; no rectangular joins.
      const tint=['rgba(255,215,129,0)','rgba(248,229,116,.035)','rgba(101,162,104,.065)','rgba(82,51,98,.10)',
        'rgba(196,215,202,.07)','rgba(60,112,127,.055)','rgba(152,180,111,.055)','rgba(65,78,107,.12)',
        'rgba(113,119,172,.045)','rgba(91,157,211,.075)','rgba(50,57,107,.12)','rgba(62,37,91,.16)'][scene.stage.id];
      c.fillStyle=tint;c.fillRect(0,0,w,h);
    });
    const atlasCell=(c,w,h,idx)=>{
      const cw=atlasBitmap.naturalWidth/4,ch=atlasBitmap.naturalHeight/2;
      c.drawImage(atlasBitmap,(idx%4)*cw,Math.floor(idx/4)*ch,cw,ch,0,0,w,h);
    };
    Object.keys(HEROES).filter(type=>type!=='megafox').forEach(type=>createCanvasTexture(scene,'hero-'+type,128,128,(c,w,h)=>{
      if(atlasBitmap)atlasCell(c,w,h,{fox:0,bear:1,rabbit:2,cat:3}[type]);else paintHero(c,w,h,type);
    }));
    ['sprout','runner','brute','boss'].forEach(type=>createCanvasTexture(scene,'enemy-'+type,128,128,(c,w,h)=>{
      if(atlasBitmap)atlasCell(c,w,h,{sprout:4,runner:5,brute:6,boss:7}[type]);else paintEnemy(c,w,h,type);
    }));
    Object.entries({thorn:0,spore:1,imp:2,crystal:3,shroom:4,guardian:5}).forEach(([type,i])=>createCanvasTexture(scene,'enemy-'+type,128,128,(c,w,h)=>{
      if(monsterBitmap){
        const tw=monsterBitmap.naturalWidth/3,th=monsterBitmap.naturalHeight/2;
        c.drawImage(monsterBitmap,(i%3)*tw,Math.floor(i/3)*th,tw,th,0,0,w,h);
      }else paintEnemy(c,w,h,['thorn','spore','imp'].includes(type)?'sprout':type==='crystal'?'brute':'boss');
    }));
    for(let i=0;i<8;i++)createCanvasTexture(scene,'evo-'+i,128,128,(c,w,h)=>{
      if(evolutionBitmap){const cw=evolutionBitmap.naturalWidth/4,ch=evolutionBitmap.naturalHeight/2;
        c.drawImage(evolutionBitmap,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,w,h);
      }else paintHero(c,w,h,'fox');
    });
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
    for(const kind of ['fox','megafox','bear','rabbit','cat'])
      createCanvasTexture(scene,'shot-'+kind,64,64,c=>paintShot(c,kind));
    V.build(scene);
  }
  class WaveDirector {
    // Adapted wave lifecycle from rupertgermann/tower-defence (MIT); custom fixed-wall rules.
    constructor(scene){this.scene=scene;this.current=0;this.spawned=0;this.count=0;this.tick=0;this.active=false;}
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
      if(this.scene.ward){
        this.scene.wardCharges=Math.min(3,this.scene.ward+(this.scene.synergies.has('heartwood')?1:0));
        this.scene.hp=Math.min(this.scene.maxHP,this.scene.hp+35*this.scene.ward);
      }
      this.scene.waveStartHP=this.scene.hp;
      renderHUD();
      const hazard=this.scene.stage.id===6&&this.current%3===0?'포자 군단 급습!':this.scene.stage.id===10&&this.current%4===0?'달빛 아래 대공세!':null;
      showBanner(this.isMidBoss()?'중간보스 · 숲의 수호자 접근!':this.isEliteWave()?'정예 · 버섯 거한 등장!':hazard||(this.isBoss()?'우두머리가 다가온다!':'제 '+this.current+'차 공세'));
    }
    isBoss(){return this.current===this.scene.stage.waves && this.scene.stage.id%4===3;}
    isMidBoss(){return this.current===Math.max(4,Math.ceil(this.scene.stage.waves*.55));}
    isFinalElite(){return this.current===this.scene.stage.waves&&!this.isBoss();}
    isEliteWave(){return this.current>=3&&(this.current%3===0||this.isFinalElite())&&!this.isBoss()&&!this.isMidBoss();}
    nextType(){
      if(this.isBoss()&&this.spawned===this.count-1)return'boss';
      if(this.isMidBoss()&&this.spawned===this.count-1)return'guardian';
      if(this.isEliteWave()&&this.spawned===this.count-1)return'shroom';
      // First wave stays one-hero friendly; specialist monsters arrive as the squad grows.
      if(this.current===1)return this.scene.stage.id>0&&Math.random()<.22?'runner':'sprout';
      const n=Math.random(),chapter=Math.floor(this.scene.stage.id/4);
      if(this.current>=2&&n<.095)return'imp';
      if(this.current>=3&&n>=.095&&n<.17)return'spore';
      if(chapter>=2&&n<.26)return'crystal';
      if(chapter>=1&&n<.23)return this.current%2?'crystal':'thorn';
      if(n<.16)return'thorn';
      if(this.scene.stage.id>=5&&n<.34)return'brute';
      if(this.scene.stage.id===1&&n<.72)return'runner';
      if(this.scene.stage.id>=1&&n<.55)return'runner';
      return'sprout';
    }
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
      this.cardCounts={};this.synergies=new Set();this.gameClock=0;
      this.heroIds=['fox',null,null];this.targetModes=['front','front','front'];this.attackTimes=[0,0,0];this.enemies=[];this.projectiles=[];this.effects=[];
      this.focusEnemy=null;this.focusUntil=0;this.focusReticle=null;this.lastFortHP=-1;
      this.foxSpirit=0;this.evolved=false;
      this.betweenWaves=0;this.wave=new WaveDirector(this);
      buildTextures(this);this.add.image(210,325,'field');
      $('arena-wrap').classList.toggle('foggy',this.stage.id>=4&&this.stage.id<=7);
      $('arena-wrap').classList.toggle('moonlit',this.stage.id>=8);
      $('arena-wrap').classList.remove('boss-warning');
      this.fortPlaque=this.add.image(210,625,'fort-plaque').setDepth(2);
      this.heroSprites=this.heroIds.map((id,i)=>id?this.add.image([104,210,316][i],595,'motion-'+id+'-idle-0').setDisplaySize(83,83).setDepth(6):null);
      this.wave.begin();renderSlots();renderHUD();
      if(this.stage.id===0)showBanner('여우 궁수 혼자 첫 공세를 막아보세요!');
    }
    spawnEnemy(type){
      // Enemy entry is broad at the top, including bridge levels.
      const lane=this.stage.id===2 ? (Math.random()<.5?48:372) : 38+Math.random()*344;
      const hpbase={sprout:55,runner:37,brute:160,boss:1400,thorn:48,spore:105,imp:44,crystal:195,shroom:420,guardian:680}[type];
      const soloScoutScale=this.wave.current===1?1/(1+this.stage.id*.045):1;
      const hp=Math.round(hpbase*(1+this.stage.id*.13+(this.wave.current-1)*.1)*soloScoutScale);
      const spd={sprout:33,runner:60,brute:23,boss:18,thorn:49,spore:31,imp:55,crystal:21,shroom:19,guardian:17}[type]+this.stage.id*.8;
      const sizes={sprout:[56,48],runner:[56,48],brute:[69,63],boss:[132,94],thorn:[61,54],spore:[69,61],imp:[55,65],crystal:[79,67],shroom:[107,105],guardian:[145,126]};
      const [sw,sh]=sizes[type],lifeWidth=type==='guardian'||type==='boss'?88:type==='shroom'?60:40;
      const lifeYOffset=Math.round(sh*.53)+8;
      const spr=this.add.image(lane,-38,'motion-'+type+'-run-0').setDisplaySize(sw,sh).setDepth(4);
      const lifeBg=this.add.rectangle(lane,-38-lifeYOffset,lifeWidth+2,6,0x302a20).setDepth(5);
      const life=this.add.rectangle(lane,-38-lifeYOffset,lifeWidth,4,type==='guardian'?0xffcb73:type==='shroom'?0xf4a86e:0xe18754).setDepth(5);
      const nameLabel=['guardian','boss','shroom'].includes(type)?this.add.text(lane,-38-lifeYOffset-15,ENEMY_INTEL[type].name,{font:'bold 12px system-ui',color:'#fff1c7',stroke:'#423622',strokeThickness:4}).setOrigin(.5).setDepth(7):null;
      const enemy={nameLabel,type,x:lane,baseX:lane,windPhase:Math.random()*Math.PI*2,y:-38,spr,lifeBg,life,lifeWidth,lifeYOffset,hp,maxHP:hp,spd,slow:0,rooted:0,
        armor:type==='crystal'?.34:type==='shroom'?.12:this.stage.id===9?(type==='runner'?0:.3):(type==='brute'?.18:0),
        abilityCooldown:type==='guardian'?4100:5400,warning:0,hidden:0,untargetable:false,surge:0,
        tellRing:null,tellBack:null,tellFill:null,guarding:false,hasDashed:false,hasRallied:false,hasSpores:false};
      enemy.baseArmor=enemy.armor;
      spr.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
        if(this.ended||this.manualPause||this.drafting)return;
        this.focusEnemy=enemy;this.focusUntil=this.gameClock+8500;
        if(this.focusReticle){this.focusReticle.destroy();this.focusReticle=null;}
        this.focusReticle=this.add.ellipse(enemy.x,enemy.y+20,72,25,0xf8d67b,.07).setStrokeStyle(3,0xffe49c,.95).setDepth(3);
        showBanner(ENEMY_INTEL[type].name+' 집중 공격!');
      });
      this.enemies.push(enemy);
    }
    targetFor(heroX,range,mode='front'){
      if(this.focusEnemy&&this.enemies.includes(this.focusEnemy)&&this.gameClock<this.focusUntil&&!this.focusEnemy.untargetable
        &&Math.hypot(this.focusEnemy.x-heroX,this.focusEnemy.y-575)<=range)return this.focusEnemy;
      let result=null,best=-Infinity;
      for(const e of this.enemies){
        if(e.untargetable)continue;
        const distance=Math.hypot(e.x-heroX,e.y-575);
        if(distance>range)continue;
        const score=mode==='threat'?(e.type==='boss'?1200:e.type==='guardian'?900:e.type==='shroom'?460:e.type==='crystal'?320:e.type==='brute'?280:0)+e.maxHP*.18-e.hp*.14+e.y*.12-Math.abs(e.x-heroX)*.10:
          e.y-Math.abs(e.x-heroX)*.45;
        if(score>best){best=score;result=e;}
      }
      return result;
    }
    shoot(i){
      const id=this.heroIds[i];if(!id)return;
      const x=[104,210,316][i],hero=HEROES[id];
      const fog=(this.stage.id>=4&&this.stage.id<=7&&!this.hunter) ? 0.9 : 1;
      const vision=hero.range*(1+this.hunter*.16)*fog*(id==='megafox'&&this.evolutionPath==='moon'?1.2:1);
      const target=this.targetFor(x,vision,this.targetModes[i]);if(!target)return;
      const num=id==='fox'?1+this.multi:id==='megafox'?2+this.multi:1;
      for(let p=0;p<num;p++){
        const offset=(p-(num-1)/2)*12;
        const bolt=this.add.image(x+offset,568,'shot-'+id).setDisplaySize(id==='cat'?31:id==='rabbit'?27:32,32).setDepth(6);
        const trailColor=id==='rabbit'?0x8fe5ff:id==='cat'?0xffb56c:id==='megafox'?0xffe77f:id==='bear'?0xe8cf9e:0xb9e18a;
        const trail=this.add.rectangle(bolt.x-14,bolt.y,24,id==='megafox'?5:3,trailColor,.58).setDepth(5);
        const evolvePower=id==='megafox'&&this.evolutionPath==='sun'?1.25:1;
        this.projectiles.push({spr:bolt,trail,target,x:bolt.x,y:bolt.y,damage:hero.damage*this.damageBonus*evolvePower,kind:id});
      }
      const sprite=this.heroSprites[i];if(sprite){
        V.trigger(sprite,'attack',this.gameClock+310);
        if(id==='megafox')this.animateEvolutionAttack(sprite);
        else this.tweens.add({targets:sprite,x:x-4,duration:85,yoyo:true,repeat:0});
      }
    }
    animateEvolutionAttack(sprite){
      V.trigger(sprite,'attack',this.gameClock+380);
      this.cameras.main.shake(80,.0017);
    }
    previewRange(index){
      const id=this.heroIds[index];if(!id)return;
      const x=[104,210,316][index],radius=HEROES[id].range;
      const circle=this.add.circle(x,595,radius,0xf1e8a0,.035).setStrokeStyle(2,0xf4d16b,.45).setDepth(1);
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
        const icon=document.createElement('span');icon.className='spell-emoji';V.setIcon(icon,choice.icon);
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
      V.trigger(spr,'victory',this.gameClock+900);
      this.cameras.main.flash(350,path==='sun'?250:142,path==='sun'?224:208,path==='sun'?143:250);
      const aura=this.add.circle([104,210,316][index],575,25,path==='sun'?0xffd77a:0x9ddfff,.42).setDepth(4);
      this.tweens.add({targets:aura,scale:5,alpha:0,duration:650,onComplete:()=>aura.destroy()});
      const name=path==='sun'?'햇살의 곰같은여우!':'달빛의 곰같은여우!';
      const rise=this.add.text([104,210,316][index],505,name,{font:'bold 17px system-ui',color:'#fff4c7',stroke:'#543929',strokeThickness:5})
        .setOrigin(.5).setDepth(8);
      this.tweens.add({targets:rise,y:455,alpha:0,duration:1500,onComplete:()=>rise.destroy()});
      showBanner(name);renderSlots();renderHUD();
    }
    impactAt(x,y,kind,critical=false){
      if(this.effects.length>=26)return;
      const color=kind==='rabbit'?0x9deaff:kind==='cat'?0xffab65:kind==='megafox'?0xffe387:kind==='bear'?0xe7d5a1:0xbee38b;
      const radius=critical?22:13;
      const ring=this.add.circle(x,y,radius,color,.08).setStrokeStyle(critical?4:2,color,.92).setDepth(7);
      this.effects.push(ring);
      this.tweens.add({targets:ring,scale:critical?2.1:1.65,alpha:0,duration:critical?340:240,
        onComplete:()=>{ring.destroy();this.effects.splice(this.effects.indexOf(ring),1);}});
      if(critical&&this.effects.length<24){
        for(let n=0;n<3;n++){
          const particle=this.add.circle(x,y,2.2,color,.8).setDepth(7);
          this.effects.push(particle);
          const angle=(n*2*Math.PI/3)+.22;
          this.tweens.add({targets:particle,x:x+Math.cos(angle)*29,y:y+Math.sin(angle)*29,alpha:0,scale:.3,duration:320,
            onComplete:()=>{particle.destroy();this.effects.splice(this.effects.indexOf(particle),1);}});
        }
      }
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
      if(this.spark && Math.random()<.20+this.spark*.1){
        const near=this.enemies.find(other=>other!==e&&!other.untargetable&&Math.hypot(other.x-e.x,other.y-e.y)<100);
        if(near){near.hp-=Math.round(actual*.55);near.life.width=near.lifeWidth*Math.max(0,near.hp/near.maxHP);
          if(this.synergies.has('thunderfrost'))near.slow=Math.max(near.slow,1700);
          if(near.hp<=0){this.coins+=8;this.removeEnemy(near);}}
      }
      if(kind==='megafox')e.hp-=Math.floor(actual*.2);
      e.life.width=e.lifeWidth*Math.max(0,e.hp/e.maxHP);
      const number=this.add.text(e.x,e.y-24,String(actual)+(crit?'!':''),{font:'bold 13px system-ui',color:crit?'#fff5a4':'#fef5d7',stroke:'#493423',strokeThickness:3}).setOrigin(.5).setDepth(8);
      this.tweens.add({targets:number,y:number.y-25,alpha:0,duration:580,onComplete:()=>number.destroy()});
      V.trigger(e.spr,'hurt',this.gameClock+250);
      e.spr.setTintFill(0xffffff);this.time.delayedCall(75,()=>{if(e.spr.active)e.spr.clearTint();});
      if(kind==='megafox'&&this.evolutionPath==='sun'){
        for(const other of [...this.enemies]){
          if(other===e||other.untargetable||Math.hypot(other.x-e.x,other.y-e.y)>78)continue;
          other.hp-=Math.round(actual*.20);
          other.life.width=other.lifeWidth*Math.max(0,other.hp/other.maxHP);
          if(other.hp<=0){this.coins+=8;this.removeEnemy(other);}
        }
      }
      if(kind==='cat'){
        const boom=this.add.circle(e.x,e.y,16,0xffac65,.4).setDepth(5);
        this.tweens.add({targets:boom,scale:4,alpha:0,duration:260,onComplete:()=>boom.destroy()});
        for(const other of [...this.enemies])if(other!==e&&Math.hypot(other.x-e.x,other.y-e.y)<75){
          other.hp-=Math.round(actual*.45);other.life.width=other.lifeWidth*Math.max(0,other.hp/other.maxHP);
          if(other.hp<=0){this.coins+=8;this.removeEnemy(other);}
        }
      }
      if(e.hp<=0){
        this.coins+=e.type==='boss'?150:e.type==='guardian'?85:e.type==='shroom'?36:e.type==='crystal'?22:e.type==='brute'?18:e.type==='spore'?15:8;
        const ring=this.add.circle(e.x,e.y,10,0xf7da8c,.55).setDepth(6);
        this.tweens.add({targets:ring,scale:3,alpha:0,duration:260,onComplete:()=>ring.destroy()});
        this.removeEnemy(e);renderHUD();
      }
    }
    removeEnemy(e){
      const i=this.enemies.indexOf(e);if(i>=0)this.enemies.splice(i,1);
      if(this.focusEnemy===e){this.focusEnemy=null;if(this.focusReticle){this.focusReticle.destroy();this.focusReticle=null;}}
      this.clearBossWarning(e);
      if(e.nameLabel)e.nameLabel.destroy();
      e.spr.destroy();e.life.destroy();e.lifeBg.destroy();
    }
    clearBossWarning(e){
      for(const key of ['tellRing','tellBack','tellFill']){
        if(e[key]){e[key].destroy();e[key]=null;}
      }
    }
    startBossWarning(e){
      this.clearBossWarning(e);
      const color=e.type==='guardian'?0xffdd83:this.stage.id===11?0xce77ff:this.stage.id===7?0xffc46b:0xff8068;
      e.tellRing=this.add.ellipse(e.x,e.y+23,e.type==='guardian'?145:112,35,color,.21).setStrokeStyle(3,color,.9).setDepth(5);
      e.tellBack=this.add.rectangle(e.x,e.y-56,100,10,0x382a30,.95).setDepth(7);
      e.tellFill=this.add.rectangle(e.x,e.y-56,94,6,color,1).setDepth(8);
    }
    drawFortHUD(){
      if(this.lastFortHP===this.hp&&this.lastFortMaxHP===this.maxHP)return;
      this.lastFortHP=this.hp;this.lastFortMaxHP=this.maxHP;
      const texture=this.textures.get('fort-plaque'),canvas=texture.getSourceImage();
      paintFortPlaque(canvas.getContext('2d'),this.hp,this.maxHP);texture.refresh();
    }
    updateBosses(dt){
      for(const e of this.enemies){
        if(e.type!=='boss'&&e.type!=='guardian')continue;
        if(e.hidden>0){
          e.hidden=Math.max(0,e.hidden-dt);
          if(e.hidden===0){e.untargetable=false;e.spr.alpha=1;e.life.alpha=1;e.lifeBg.alpha=1;}
        }
        if(e.warning>0){
          e.warning-=dt;
          if(e.tellRing){
            e.tellRing.setPosition(e.x,e.y+23).setAlpha(.55+Math.sin(this.gameClock/120)*.25);
            e.tellBack.setPosition(e.x,e.y-56);
            const remaining=Math.max(0,e.warning/1250);
            e.tellFill.setPosition(e.x-47+47*remaining,e.y-56).setDisplaySize(94*remaining,6);
          }
          if(e.warning<=0){
            e.warning=0;e.spr.clearTint();this.clearBossWarning(e);
            V.trigger(e.spr,'attack',this.gameClock+490);
            if(e.type==='guardian'){
              e.surge=1250;this.hp=Math.max(0,this.hp-45);renderHUD();
              this.cameras.main.shake(95,.0016);
              showBanner('숲 수호자 · 진동 충격! 성벽 -45');
              if(this.hp<=0){this.finish(false);return;}
            }
            if(e.type==='boss'&&this.stage.id===3){e.surge=1750;showBanner('뿌리 거인 · 돌진!');}
            if(e.type==='boss'&&this.stage.id===7){
              e.hidden=1450;e.untargetable=true;e.spr.alpha=.23;e.life.alpha=0;e.lifeBg.alpha=0;
              e.x=e.x<210?316:104;e.baseX=e.x;e.spr.x=e.x;e.life.x=e.x;e.lifeBg.x=e.x;
              showBanner('가면 두더지 · 잠복!');
            }
            if(e.type==='boss'&&this.stage.id===11){
              const damage=this.synergies.has('fortress')?40:90;
              this.hp=Math.max(0,this.hp-damage);renderHUD();
              this.cameras.main.shake(150,.003);showBanner('검은 종 · 성벽 충격!');
              if(this.hp<=0){this.finish(false);return;}
            }
          }
        }else if(!e.untargetable&&e.y>105){
          e.abilityCooldown-=dt;
          if(e.abilityCooldown<=0){
            e.warning=1250;e.abilityCooldown=6900;
            e.spr.setTint(0xff9b60);this.startBossWarning(e);
            const title=e.type==='guardian'?'숲의 수호자 · 충격파 예고':this.stage.id===3?'뿌리 돌진 예고':this.stage.id===7?'잠복 이동 예고':'검은 종 진동 예고';
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
      this.impactAt(210,532,'rabbit',true);
      const shine=this.add.rectangle(210,532,340,12,0xa7efae,.55).setDepth(8);
      this.tweens.add({targets:shine,scaleY:4,alpha:0,duration:430,onComplete:()=>shine.destroy()});
      showBanner('성벽 보수 성공! 체력 +'+healed+' · '+this.repairs+'/'+REPAIR_LIMIT);
      renderHUD();
    }
    castSkill(){
      if(this.ended||this.manualPause||this.autoPause||this.drafting||this.skillCooldown>0)return;
      this.skillCooldown=14500;showBanner('수비대 일제사격!');
      for(const enemy of this.enemies)if(['boss','guardian'].includes(enemy.type)&&enemy.warning>0){
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
        this.drafting=true;this.pendingRecruit=true;
        setTimeout(()=>{if(!this.ended&&this.pendingRecruit)this.showRecruitDraft();},260);
      }
      else if(w%2===0){this.drafting=true;setTimeout(()=>{if(!this.ended)this.showDraft();},220);}
      else{this.betweenWaves=1100;showBanner('성벽 방어 성공!');}
    }
    comboFor(id){
      const recipe=SYNERGY_RECIPES.find(([a,b,key])=>!this.synergies.has(key)&&(
        (id===a&&this.cardCounts[b]>0)||(id===b&&this.cardCounts[a]>0)
      ));
      return recipe?recipe[3]:null;
    }
    chooseCards(){
      const pool=CARDS.filter(c=>!['bear','rabbit','cat'].includes(c.id) || (!this.heroIds.includes(c.id)&&this.heroIds.includes(null)));
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
      if(!['bear','rabbit','cat'].includes(id)||this.heroIds.includes(id))return false;
      const idx=this.heroIds.indexOf(null);if(idx<0)return false;
      this.heroIds[idx]=id;this.attackTimes[idx]=400;
      const sprite=this.add.image([104,210,316][idx],595,'motion-'+id+'-idle-0').setDisplaySize(80,80).setDepth(5);
      this.heroSprites[idx]=sprite;
      V.trigger(sprite,'victory',this.gameClock+700);
      const glow=this.add.circle(sprite.x,580,19,0xffdf91,.28).setDepth(4);
      this.tweens.add({targets:glow,scale:3,alpha:0,duration:450,onComplete:()=>glow.destroy()});
      renderSlots();showBanner(HEROES[id].name+' 합류!');
      return true;
    }
    showRecruitDraft(){
      if(this.ended||!this.pendingRecruit)return;
      this.drafting=true;
      const descriptions={
        bear:'묵직한 창 공격 · 가까운 적 대응',
        rabbit:'서리 마법으로 적의 이동 둔화',
        cat:'폭탄 투사체로 꾸준한 원거리 공격'
      };
      const wrap=document.createElement('div');wrap.className='card-grid recruit-grid';
      for(const id of ['bear','rabbit','cat']){
        const pick=document.createElement('button');pick.type='button';pick.className='spell-card recruit-card recruit-'+id;
        const portrait=document.createElement('span');V.portrait(portrait,id);portrait.classList.add('recruit-portrait');
        const name=document.createElement('strong');name.textContent=HEROES[id].name;
        const detail=document.createElement('small');detail.textContent=descriptions[id];
        pick.append(portrait,name,detail);
        pick.addEventListener('click',()=>{
          if(!this.pendingRecruit||!this.recruitHero(id))return;
          this.pendingRecruit=false;this.drafting=false;this.betweenWaves=1100;
          closeModal(true);renderHUD();
        });
        wrap.appendChild(pick);
      }
      showModal('첫 번째 공세 완료','첫 동료를 선택하세요!','세 동료 중 하나가 무료로 합류합니다. 선택에 따라 전투 방식이 달라져요.',[wrap],[],true);
      renderHUD();
    }
    showDraft(){
      if(this.ended)return;
      if(this.pendingRecruit)return this.showRecruitDraft();
      this.drafting=true;const cards=this.chooseCards();
      const wrap=document.createElement('div');wrap.className='card-grid';
      cards.forEach(card=>{
        const b=document.createElement('button');b.type='button';b.className='spell-card'+(card.rare?' rare':'')+(this.comboFor(card.id)?' combo':'');
        const icon=document.createElement('span');icon.className='spell-emoji';V.setIcon(icon,card.id==='bear'?'shield':card.id);
        const title=document.createElement('strong');title.textContent=card.title;
        const desc=document.createElement('small');
        const combo=this.comboFor(card.id);
        desc.textContent=card.desc+(combo?' · '+combo+' 재료':'');
        b.append(icon,title,desc);b.addEventListener('click',()=>{
          this.applyCard(card.id);closeModal(true);this.drafting=false;this.betweenWaves=700;renderHUD();
        });wrap.appendChild(b);
      });
      const actions=[];
      if(!this.rerollUsed)actions.push(button('한 번 무료 새로고침',()=>{this.rerollUsed=true;closeModal(true);this.showDraft();},'alt'));
      showModal('제 '+this.wave.current+'차 공세 완료','성장의 순간!','셋 중 하나의 힘을 골라 수비대를 키워 주세요.',[wrap],actions,true);
      renderHUD();
    }
    applyCard(id){
      if(id==='power')this.damageBonus*=1.25;
      if(id==='haste')this.speedBonus*=1.2;
      if(id==='multi')this.multi=Math.min(3,this.multi+1);
      if(id==='ice')this.freeze++;
      if(id==='wall')this.hp=Math.min(this.maxHP,this.hp+600);
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
      this.heroSprites.forEach((spr,i)=>{if(spr&&spr.active){
        const id=this.heroIds[i],pose=win?'victory':'hurt';
        spr.setTexture('motion-'+id+'-'+pose+'-2');
        this.tweens.add({targets:spr,y:spr.y-(win?16:0),duration:240,yoyo:win,repeat:win?3:0});
      }});
      if(win){
        if(!state.clears.includes(this.stage.id))state.clears.push(this.stage.id);
        state.unlocked=Math.max(state.unlocked,Math.min(12,this.stage.id+2));
        state.best[this.stage.id]=Math.max(Number(state.best[this.stage.id])||0,this.hp);
        save();
      }
      const title=win?'숲길을 지켜냈어!':'성벽이 무너졌어!';
      const desc=win?'성벽 체력 '+this.hp+' · 얻은 별빛 '+this.coins+'개':'다른 용병 조합을 선택해서 다시 도전해 보세요.';
      const actions=[button(win?'다음 스테이지':'다시 도전',()=>{
        const next=win?Math.min(11,this.stage.id+1):this.stage.id;
        closeModal(true);startStage(next);
      }),button('모험 지도',()=>showMenu(false),'alt')];
      showModal(win?'방어 성공':'재도전',title,desc,[],actions,false);
    }
    update(_time,delta){
      if(this.ended||this.manualPause||this.autoPause||this.drafting)return;
      const dt=Math.min(delta,40)*this.speed;this.gameClock+=dt;
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
          e.hasDashed=true;e.surge=e.type==='imp'?380:720;V.trigger(e.spr,'attack',this.gameClock+400);
          const dash=this.add.ellipse(e.x,e.y+15,56,18,0xc9df76,.18).setDepth(3);
          this.tweens.add({targets:dash,scale:1.7,alpha:0,duration:380,onComplete:()=>dash.destroy()});
        }
        if(e.type==='crystal'){
          const guarding=(this.gameClock+e.windPhase*300)%5200<1550;
          e.armor=guarding?Math.min(.55,e.baseArmor+.16):e.baseArmor;
          if(guarding&&!e.guarding){
            const shield=this.add.ellipse(e.x,e.y+12,65,32,0x81e2f8,.16).setStrokeStyle(2,0x93efff,.75).setDepth(3);
            this.tweens.add({targets:shield,scale:1.38,alpha:0,duration:490,onComplete:()=>shield.destroy()});
          }
          e.guarding=guarding;
        }
        if(e.type==='shroom'&&!e.hasRallied&&e.y>=245){
          e.hasRallied=true;
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
          e.hasSpores=true;let buffed=0;
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
        e.spr.setPosition(e.x,e.y);e.lifeBg.setPosition(e.x,e.y-e.lifeYOffset);e.life.setPosition(e.x,e.y-e.lifeYOffset);
        if(e.nameLabel)e.nameLabel.setPosition(e.x,e.y-e.lifeYOffset-19);
        V.animate(e.spr,e.type,'run',this.gameClock);
        if(e.y>=538){
          let leak=e.type==='boss'?580:e.type==='guardian'?360:e.type==='shroom'?255:e.type==='crystal'?190:e.type==='brute'?220:90;
          if(this.wardCharges>0){leak=Math.ceil(leak*.5);this.wardCharges--;showBanner('숲의 수호 · 성벽 피해 감소!');}
          this.hp=Math.max(0,this.hp-leak);
          this.cameras.main.shake(110,.002);
          this.removeEnemy(e);renderHUD();if(this.hp<=0){this.finish(false);return;}
        }
      }
      for(let i=this.projectiles.length-1;i>=0;i--){
        const p=this.projectiles[i],t=p.target;
        if(!this.enemies.includes(t)){p.spr.destroy();p.trail.destroy();this.projectiles.splice(i,1);continue;}
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
      b.dataset.targetMode=battle.targetModes[i];
      b.dataset.modeLabel=id?(battle.targetModes[i]==='threat'?'위협':'선두'):'';
      const icon=document.createElement('strong');if(id)V.portrait(icon,id);else icon.className='empty-station';
      const text=document.createElement('span');text.textContent=id?HEROES[id].name:battle.pendingRecruit?'영입 선택':'영입 대기';
      b.append(icon,text);b.setAttribute('aria-label','전열 '+(i+1)+'번 '+text.textContent+(id?' · 타깃 '+b.dataset.modeLabel+' · 같은 칸 두 번 선택해 변경':''));
      b.addEventListener('click',()=>{
        if(!battle||battle.ended)return;
        if(battle.pendingRecruit&&!id){battle.showRecruitDraft();return;}
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
        sprites.forEach((spr,k)=>{if(spr)spr.x=[104,210,316][k];});
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
      next===mid?'다음 공세 · 숲의 수호자':
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
      battle.heroIds.filter(Boolean).length===1?'첫 공세를 막으면 동료 한 명이 합류해요':'용병 한 번 선택·다른 칸은 자리 교환·같은 칸은 표적 전술';
    renderCooldown();renderEvolution();
  }
  $('start-btn').addEventListener('click',()=>startStage(state.selected));
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
  renderMap();updateMenuStory();setupHistory();
})();