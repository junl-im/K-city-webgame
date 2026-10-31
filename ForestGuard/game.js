/* 라니 수비대 v0.2.0 — © 2026 곰같은여우
 * Original game, game rules, Canvas-painted sprites and interface.
 * Combat architecture informed by MIT-licensed Phaser 3 and the WaveManager,
 * EnemyManager and Projectile patterns of rupertgermann/tower-defence.
 * No SVG, forced advertisements, telemetry, accounts or external art assets.
 */
(() => {
  'use strict';
  const SAVE_KEY = 'gomfox.forestguard.v1';
  const HOME_URL = 'https://meta-deee1.web.app/';
  const $ = id => document.getElementById(id);
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
  const CARDS = [
    {id:'power',icon:'⚔',title:'날카로운 일격',desc:'전체 공격력 +25%',rare:false},
    {id:'haste',icon:'➶',title:'빠른 손놀림',desc:'공격 속도 +20%',rare:false},
    {id:'multi',icon:'➹',title:'쌍둥이 화살',desc:'여우가 화살을 하나 더 발사',rare:true},
    {id:'ice',icon:'❄',title:'서리 화살',desc:'타격한 적을 잠시 둔화',rare:false},
    {id:'wall',icon:'▣',title:'튼튼한 성벽',desc:'성벽 HP 600 회복',rare:false},
    {id:'flame',icon:'♨',title:'불꽃의 맹세',desc:'타격 후 추가 화상 피해',rare:true},
    {id:'rabbit',icon:'☾',title:'토끼 마법사',desc:'빙결 마법사가 합류',rare:true},
    {id:'cat',icon:'✹',title:'고양이 기술자',desc:'폭탄의 달인이 합류',rare:true},
    {id:'crit',icon:'✦',title:'약점 간파',desc:'치명타 확률 +13%',rare:false}
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
  let pendingStageIndex = 0, atlasBitmap = null, evolutionBitmap = null, atlasPromise = null, starting = false;
  function prepareAtlas(){
    if(atlasPromise)return atlasPromise;
    const load=(url,assign)=>new Promise(resolve=>{
      if(!url){resolve();return;}
      const art=new Image();art.onload=()=>{assign(art);resolve();};
      art.onerror=()=>resolve();art.src=url;
    });
    atlasPromise=Promise.all([
      load(window.ForestGuardAtlas,art=>{atlasBitmap=art;}),
      load(window.RaniEvolutionAtlas,art=>{evolutionBitmap=art;})
    ]);
    return atlasPromise;
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
      b.className='stage-tile'+(locked?' locked':'')+(cleared?' cleared':'')+(state.selected===index?' selected':'');
      b.disabled=locked;
      const n=document.createElement('span'); n.className='num'; n.textContent=locked?'♧':(stage.chapter+'-'+((index%4)+1));
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
    $('start-btn').firstChild.textContent='모험 시작 ';
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
    await prepareAtlas();
    starting=false;
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
  }
  function showHelp(){
    const el=document.createElement('div');el.className='howto';
    [['① 자동 전투','여우와 곰이 달려오는 몬스터를 알아서 공격해요.'],['② 자리 바꾸기','아래 용병 하나를 선택하고 다른 칸을 누르면 서로 바뀌어요.'],['③ 특별한 공격','일제사격 버튼이 밝아지면 눌러 몬스터를 한꺼번에 공격해요.'],['④ 강화 카드','두 웨이브마다 3개 중 하나를 고르세요.'],['⑤ 다시 도전','패배해도 이전에 깬 스테이지 기록은 남아요.']].forEach(row=>{
      const item=document.createElement('div');const strong=document.createElement('strong');strong.textContent=row[0];item.append(strong,document.createElement('br'),document.createTextNode(row[1]));el.appendChild(item);
    });
    showModal('수비대 안내','5초 만에 배우는 수비대','한 손으로도 충분해요!', [el],[button('좋아, 출발!',closeModal.bind(null,true))],true);
  }
  function showPause(){
    if(!battle||battle.ended)return;
    battle.manualPause=true;
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
        closeModal(true);if((wasExit||wasPause) && battle && !suspended)battle.manualPause=false;
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
    createCanvasTexture(scene,'field',420,650,(c,w,h)=>paintField(c,w,h,scene.stage.id));
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
    for(let i=0;i<8;i++)createCanvasTexture(scene,'evo-'+i,128,128,(c,w,h)=>{
      if(evolutionBitmap){const cw=evolutionBitmap.naturalWidth/4,ch=evolutionBitmap.naturalHeight/2;
        c.drawImage(evolutionBitmap,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,w,h);
      }else paintHero(c,w,h,'fox');
    });
    createCanvasTexture(scene,'bolt',32,32,(c)=>{blob(c,16,16,10,5,'#ffd47e','#9b6b3a');blob(c,18,14,5,3,'#fff1b1');});
    createCanvasTexture(scene,'frostbolt',32,32,(c)=>{blob(c,16,16,10,8,'#80d9f5','#477f9f');blob(c,13,12,5,4,'#e4faff');});
  }
  class WaveDirector {
    // Adapted wave lifecycle from rupertgermann/tower-defence (MIT); custom fixed-wall rules.
    constructor(scene){this.scene=scene;this.current=0;this.spawned=0;this.count=0;this.tick=0;this.active=false;}
    begin(){
      if(this.current>=this.scene.stage.waves)return;
      this.current++;this.spawned=0;this.active=true;this.tick=500;
      this.count=4+this.current*2+Math.ceil(this.scene.stage.id*.55);
      if(this.isBoss())this.count=Math.floor(this.count*.7)+1;
      renderHUD();showBanner(this.isBoss()?'우두머리가 다가온다!':'제 '+this.current+'차 공세');
    }
    isBoss(){return this.current===this.scene.stage.waves && this.scene.stage.id%4===3;}
    nextType(){
      if(this.isBoss()&&this.spawned===this.count-1)return'boss';
      const n=Math.random();
      if(this.scene.stage.id>=5&&n<.2)return'brute';
      if(this.scene.stage.id>=1&&n<.42)return'runner';
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
      this.manualPause=false;this.autoPause=false;this.drafting=false;this.speed=1;
      this.hp=3000;this.maxHP=3000;this.coins=0;this.skillCooldown=0;this.rerollUsed=false;
      this.damageBonus=1;this.speedBonus=1;this.multi=0;this.freeze=0;this.flame=0;this.crit=0;
      this.heroIds=['fox','bear',null];this.attackTimes=[0,0,0];this.enemies=[];this.projectiles=[];this.effects=[];
      this.foxSpirit=0;this.evolved=false;
      this.betweenWaves=0;this.wave=new WaveDirector(this);
      buildTextures(this);this.add.image(210,325,'field');
      this.heroSprites=this.heroIds.map((id,i)=>id?this.add.image([104,210,316][i],595,'hero-'+id).setDisplaySize(83,83):null);
      this.heroSprites.forEach((spr,i)=>{if(spr)this.tweens.add({targets:spr,y:593+(i%2)*3,duration:600+i*200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});});
      this.wave.begin();renderSlots();renderHUD();
    }
    spawnEnemy(type){
      const lane=this.stage.id===2 ? (Math.random()<.5?96:324):70+Math.random()*280;
      const hpbase={sprout:55,runner:37,brute:160,boss:1400}[type];
      const hp=Math.round(hpbase*(1+this.stage.id*.13+(this.wave.current-1)*.1));
      const spd={sprout:33,runner:60,brute:23,boss:18}[type]+this.stage.id*.8;
      const spr=this.add.image(lane,-38,'enemy-'+type).setDisplaySize(type==='boss'?132:type==='brute'?69:56,type==='boss'?94:type==='brute'?63:48);
      const lifeBg=this.add.rectangle(lane,-68,40,4,0x3d3024).setDepth(3);
      const life=this.add.rectangle(lane,-68,39,3,0xe18754).setDepth(4);
      this.enemies.push({type,x:lane,y:-38,spr,lifeBg,life,hp,maxHP:hp,spd,slow:0});
    }
    targetFor(heroX,range){
      let result=null,best=-Infinity;
      for(const e of this.enemies){
        const distance=Math.hypot(e.x-heroX,e.y-575);
        if(distance>range)continue;
        const score=e.y-Math.abs(e.x-heroX)*.45;
        if(score>best){best=score;result=e;}
      }
      return result;
    }
    shoot(i){
      const id=this.heroIds[i];if(!id)return;
      const x=[104,210,316][i],hero=HEROES[id],target=this.targetFor(x,hero.range);if(!target)return;
      const num=id==='fox'?1+this.multi:id==='megafox'?2+this.multi:1;
      for(let p=0;p<num;p++){
        const bolt=this.add.image(x+(p-(num-1)/2)*12,568,id==='rabbit'?'frostbolt':'bolt').setDisplaySize(17,17);
        this.projectiles.push({spr:bolt,target,x:bolt.x,y:bolt.y,damage:hero.damage*this.damageBonus,kind:id});
      }
      const sprite=this.heroSprites[i];if(sprite){
        if(id==='megafox')this.animateEvolutionAttack(sprite);
        else this.tweens.add({targets:sprite,scaleX:sprite.scaleX*.9,scaleY:sprite.scaleY*1.12,duration:80,yoyo:true,repeat:0});
      }
    }
    animateEvolutionAttack(sprite){
      const frames=[1,2,3,4,5,0];
      frames.forEach((frame,index)=>{
        this.time.delayedCall(index*70,()=>{
          if(sprite.active&&sprite.texture.key.startsWith('evo-'))sprite.setTexture('evo-'+frame);
        });
      });
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
      const index=this.heroIds.indexOf('fox');if(index<0)return;
      this.evolved=true;this.heroIds[index]='megafox';
      const spr=this.heroSprites[index];spr.setTexture('evo-0').setDisplaySize(110,110).setDepth(5);
      this.cameras.main.flash(350,250,224,143);
      const aura=this.add.circle([104,210,316][index],575,25,0xffe8aa,.42).setDepth(4);
      this.tweens.add({targets:aura,scale:5,alpha:0,duration:650,onComplete:()=>aura.destroy()});
      const rise=this.add.text([104,210,316][index],505,'곰같은여우!',{font:'bold 20px system-ui',color:'#fff4c7',stroke:'#543929',strokeThickness:5})
        .setOrigin(.5).setDepth(8);
      this.tweens.add({targets:rise,y:455,alpha:0,duration:1500,onComplete:()=>rise.destroy()});
      showBanner('곰같은여우로 진화!');
      renderSlots();renderHUD();
    }
    hitEnemy(e,damage,kind){
      if(!this.enemies.includes(e))return;
      const crit=Math.random()<this.crit;const actual=Math.round(damage*(crit?1.7:1));
      if(kind==='fox'&&!this.evolved){this.foxSpirit=Math.min(10,this.foxSpirit+1);renderEvolution();}
      e.hp-=actual;if(kind==='rabbit'||this.freeze)e.slow=Math.max(e.slow,kind==='rabbit'?1900:650);
      if(this.flame)e.hp-=Math.max(4,Math.floor(actual*.15));
      if(kind==='megafox')e.hp-=Math.floor(actual*.2);
      e.life.width=39*Math.max(0,e.hp/e.maxHP);
      const number=this.add.text(e.x,e.y-24,String(actual)+(crit?'!':''),{font:'bold 13px system-ui',color:crit?'#fff5a4':'#fef5d7',stroke:'#493423',strokeThickness:3}).setOrigin(.5).setDepth(8);
      this.tweens.add({targets:number,y:number.y-25,alpha:0,duration:580,onComplete:()=>number.destroy()});
      e.spr.setTintFill(0xffffff);this.time.delayedCall(75,()=>{if(e.spr.active)e.spr.clearTint();});
      if(kind==='cat'){
        const boom=this.add.circle(e.x,e.y,16,0xffac65,.4).setDepth(5);
        this.tweens.add({targets:boom,scale:4,alpha:0,duration:260,onComplete:()=>boom.destroy()});
        for(const other of [...this.enemies])if(other!==e&&Math.hypot(other.x-e.x,other.y-e.y)<75){
          other.hp-=Math.round(actual*.45);other.life.width=39*Math.max(0,other.hp/other.maxHP);
          if(other.hp<=0){this.coins+=8;this.removeEnemy(other);}
        }
      }
      if(e.hp<=0){
        this.coins+=e.type==='boss'?150:e.type==='brute'?18:8;
        const ring=this.add.circle(e.x,e.y,10,0xf7da8c,.55).setDepth(6);
        this.tweens.add({targets:ring,scale:3,alpha:0,duration:260,onComplete:()=>ring.destroy()});
        this.removeEnemy(e);renderHUD();
      }
    }
    removeEnemy(e){
      const i=this.enemies.indexOf(e);if(i>=0)this.enemies.splice(i,1);
      e.spr.destroy();e.life.destroy();e.lifeBg.destroy();
    }
    castSkill(){
      if(this.ended||this.manualPause||this.autoPause||this.drafting||this.skillCooldown>0)return;
      this.skillCooldown=14500;showBanner('수비대 일제사격!');
      const flash=this.add.rectangle(210,270,420,540,0xffe2a1,.22).setDepth(6);
      this.tweens.add({targets:flash,alpha:0,duration:330,onComplete:()=>flash.destroy()});
      [...this.enemies].forEach(e=>{e.slow=1400;this.hitEnemy(e,110*this.damageBonus,'skill');});
      renderHUD();
    }
    onWaveDone(w){
      if(this.ended)return;
      if(w>=this.stage.waves){this.finish(true);return;}
      if(w%2===0){this.drafting=true;setTimeout(()=>{if(!this.ended)this.showDraft();},220);}
      else{this.betweenWaves=1100;showBanner('성벽 방어 성공!');}
    }
    chooseCards(){
      const pool=CARDS.filter(c=>!['rabbit','cat'].includes(c.id) || (!this.heroIds.includes(c.id)&&this.heroIds.includes(null)));
      const shuffled=[...pool].sort(()=>Math.random()-.5);return shuffled.slice(0,3);
    }
    showDraft(){
      if(this.ended)return;
      this.drafting=true;const cards=this.chooseCards();
      const wrap=document.createElement('div');wrap.className='card-grid';
      cards.forEach(card=>{
        const b=document.createElement('button');b.type='button';b.className='spell-card'+(card.rare?' rare':'');
        const icon=document.createElement('span');icon.className='spell-emoji';icon.textContent=card.icon;
        const title=document.createElement('strong');title.textContent=card.title;
        const desc=document.createElement('small');desc.textContent=card.desc;
        b.append(icon,title,desc);b.addEventListener('click',()=>{
          this.applyCard(card.id);closeModal(true);this.drafting=false;this.betweenWaves=700;renderHUD();
        });wrap.appendChild(b);
      });
      const actions=[];
      if(!this.rerollUsed)actions.push(button('한 번 무료 새로고침',()=>{this.rerollUsed=true;closeModal(true);this.showDraft();},'alt'));
      showModal('제 '+this.wave.current+'차 공세 완료','성장의 순간!','셋 중 하나의 힘을 골라 수비대를 키워 주세요.',[wrap],actions,true);
      renderCooldown();
    }
    applyCard(id){
      if(id==='power')this.damageBonus*=1.25;
      if(id==='haste')this.speedBonus*=1.2;
      if(id==='multi')this.multi=Math.min(3,this.multi+1);
      if(id==='ice')this.freeze++;
      if(id==='wall')this.hp=Math.min(this.maxHP,this.hp+600);
      if(id==='flame')this.flame++;
      if(id==='crit')this.crit=Math.min(.65,this.crit+.13);
      if((id==='rabbit'||id==='cat')&&!this.heroIds.includes(id)){
        const idx=this.heroIds.indexOf(null);if(idx>=0){this.heroIds[idx]=id;
          this.heroSprites[idx]=this.add.image([104,210,316][idx],595,'hero-'+id).setDisplaySize(70,70);
          this.tweens.add({targets:this.heroSprites[idx],y:590,duration:680,yoyo:true,repeat:-1});
        }
      }
      renderSlots();
    }
    finish(win){
      if(this.ended)return;this.ended=true;this.manualPause=true;
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
      const dt=Math.min(delta,40)*this.speed;
      this.skillCooldown=Math.max(0,this.skillCooldown-dt);
      if(this.betweenWaves>0){this.betweenWaves-=dt;if(this.betweenWaves<=0)this.wave.begin();}
      else this.wave.update(dt);
      for(let i=0;i<this.heroIds.length;i++){
        if(!this.heroIds[i])continue;
        this.attackTimes[i]-=dt;
        if(this.attackTimes[i]<=0&&this.enemies.length){
          this.shoot(i);this.attackTimes[i]=HEROES[this.heroIds[i]].interval/this.speedBonus;
        }
      }
      for(const e of [...this.enemies]){
        e.slow=Math.max(0,e.slow-dt);
        e.y+=e.spd*(e.slow>0?.42:1)*dt/1000;
        e.spr.y=e.y;e.lifeBg.y=e.y-32;e.life.y=e.y-32;
        if(e.y>=538){
          this.hp=Math.max(0,this.hp-(e.type==='boss'?580:e.type==='brute'?220:90));
          this.removeEnemy(e);renderHUD();if(this.hp<=0){this.finish(false);return;}
        }
      }
      for(let i=this.projectiles.length-1;i>=0;i--){
        const p=this.projectiles[i],t=p.target;
        if(!this.enemies.includes(t)){p.spr.destroy();this.projectiles.splice(i,1);continue;}
        const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
        const speed=560*dt/1000;
        if(d<=speed+17){this.hitEnemy(t,p.damage,p.kind);p.spr.destroy();this.projectiles.splice(i,1);}
        else{p.x+=dx/d*speed;p.y+=dy/d*speed;p.spr.setPosition(p.x,p.y);p.spr.rotation=Math.atan2(dy,dx);}
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
      const icon=document.createElement('strong');icon.textContent=id?HEROES[id].icon:'＋';
      const text=document.createElement('span');text.textContent=id?HEROES[id].name:'빈 자리';
      b.append(icon,text);b.setAttribute('aria-label','전열 '+(i+1)+'번 '+text.textContent);
      b.addEventListener('click',()=>{
        if(!battle||battle.ended||battle.drafting)return;
        if(chosenSlot<0){chosenSlot=i;battle.previewRange(i);renderSlots();return;}
        const a=chosenSlot,ids=battle.heroIds,sprites=battle.heroSprites,times=battle.attackTimes;
        [ids[a],ids[i]]=[ids[i],ids[a]];[sprites[a],sprites[i]]=[sprites[i],sprites[a]];
        [times[a],times[i]]=[times[i],times[a]];
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
    $('evo-caption').textContent=battle.evolved?'진화 완료':ready?'곰같은여우':'진화 '+battle.foxSpirit+'/10';
  }
  function renderCooldown(){
    if(!battle)return;
    const remaining=Math.ceil(battle.skillCooldown/1000);
    $('skill-timer').textContent=remaining?String(remaining):'';
    $('skill-timer').hidden=!remaining;
    $('skill-caption').textContent=battle.drafting?'강화 선택':'일제사격';
    $('skill-btn').disabled=(!battle.drafting&&!!remaining)||battle.manualPause;
  }
  function renderHUD(){
    if(!battle)return;
    $('wave-label').textContent=battle.wave.current+' / '+battle.stage.waves+' 공세';
    $('coin-label').textContent='✦ '+battle.coins;
    $('hp-label').textContent=String(battle.hp);
    $('hp-fill').style.width=(battle.hp/battle.maxHP*100)+'%';
    $('speed-btn').textContent='×'+battle.speed;
    renderCooldown();renderEvolution();
  }
  $('start-btn').addEventListener('click',()=>startStage(state.selected));
  $('resume-btn').addEventListener('click',resumeBattle);
  $('help-btn').addEventListener('click',showHelp);
  $('home-btn').addEventListener('click',()=>showMenu(true));
  $('pause-btn').addEventListener('click',showPause);
  $('speed-btn').addEventListener('click',()=>{if(battle&&!battle.ended){battle.speed=battle.speed===1?2:1;renderHUD();}});
  $('skill-btn').addEventListener('click',()=>{if(battle){if(battle.drafting)battle.showDraft();else battle.castSkill();}});
  $('evo-btn').addEventListener('click',()=>{if(battle)battle.evolveFox();});
  $('modal-close').addEventListener('click',()=>{
    if(activeModal&&activeModal.kicker==='잠깐 쉬어가기'&&battle)battle.manualPause=false;
    if(activeModal&&activeModal.kicker==='숲에서 나가기'&&battle&&!suspended)battle.manualPause=false;
    closeModal(false);renderCooldown();
  });
  if(window.ForestGuardAtlas){
    const seal=document.querySelector('.brand-seal');
    seal.textContent='';seal.style.backgroundImage='url('+window.ForestGuardAtlas+')';
    seal.style.backgroundSize='400% 200%';seal.style.backgroundPosition='0% 0%';
    seal.style.backgroundRepeat='no-repeat';
  }
  renderMap();updateMenuStory();setupHistory();
})();