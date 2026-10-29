import { GRAVITY, createBody, stepBody } from './physics-core.mjs?rev=20261029-v28lazy';
import { orbitalPeriodYears, orbitalAngle } from './orbit-core.mjs?rev=20261029-v28lazy';
import { mirrorLightPath } from './mirror-core.mjs?rev=20261029-v28lazy';
import { circuitReadings } from './circuit-core.mjs?rev=20261029-v28lazy';
import { mechanicsReadings } from './mechanics-core.mjs?rev=20261029-v28lazy';
import { magnetReading, soundReading } from './discovery-core.mjs?rev=20261029-v28lazy';
import { inertiaReading, frictionReading, buoyancyReading, pendulumReading, heatReading } from './everyday-core.mjs?rev=20261029-v28lazy';
import { drawEverydayScene } from './animated-experiments.mjs?rev=20261029-v28lazy';
import {paintSurfaceTexture,surfaceTextureBounds,paintMechanicsPlatform} from './surface-materials.mjs?rev=20261029-v28lazy';
import { COMPANION_ART, companionCue } from './lab-companion.mjs?rev=20261029-v28lazy';
import { landingCue, groundShadowCue, wavefrontSpacing, magnetBallPosition, pulleySceneMotion, leverFulcrumSpriteTop, orbitalTrailCount, orbitToySizes, litBulbOpacity, celebrationCue, paintTwinkles } from './visual-effects.mjs?rev=20261029-v28lazy';

const EVERYDAY_IDS = ['inertia','friction','buoyancy','pendulum','heat'];
const LESSON_IDS = ['gravity', 'orbit', 'light', 'circuit', 'mechanics', 'magnet', 'sound', ...EVERYDAY_IDS];
const everydayConfigs = {
  inertia:{modes:[['gentle','🐢 천천히 멈춤'],['sudden','⚡ 급정거']],mode:'gentle',modeLabel:'어떻게 멈출까요?',a:{label:'처음 움직이는 속도',min:1,max:5,step:1,value:3,unit:'m/s',low:'느리게 · 1m/s',high:'빠르게 · 5m/s'},result:'수레가 멈출 때까지 이동한 거리',hint:'수레만 멈추면 물건은 계속 나아가려 해요.'},
  friction:{modes:[['rough','🧸 폭신한 길'],['ice','🧊 미끄러운 길']],mode:'rough',modeLabel:'어떤 바닥일까요?',a:{label:'길의 기울기',min:10,max:40,step:5,value:25,unit:'°',low:'완만한 · 10°',high:'가파른 · 40°'},result:'미끄러지는 정도',hint:'같은 경사에서는 표면의 마찰이 작은 길이 잘 미끄러져요.'},
  buoyancy:{modes:[['duck','🐥 장난감 오리'],['stone','🪨 조약돌']],mode:'duck',modeLabel:'물에 무엇을 넣을까요?',a:{label:'물의 소금기 · 비교 놀이',min:0,max:30,step:10,value:0,unit:'g/L',low:'민물 · 0g/L',high:'짠물 · 30g/L'},result:'물체가 어떻게 될까요?',hint:'물은 가라앉는 물체도 위로 밀어요. 이것을 부력이라고 해요.'},
  pendulum:{modes:[['earth','🌍 지구'],['moon','🌙 달']],mode:'earth',modeLabel:'어디에서 흔들까요?',a:{label:'그네 줄의 길이',min:.4,max:1.6,step:.2,value:1,unit:'m',low:'짧게 · 0.4m',high:'길게 · 1.6m'},b:{label:'처음 흔드는 각도',min:5,max:20,step:5,value:10,unit:'°',low:'살짝 · 5°',high:'조금 더 · 20°'},result:'한 번 왔다 가는 시간',hint:'작게 흔드는 진자는 줄이 길수록 왕복 시간이 길어요.'},
  heat:{modes:[['200','☕ 물 한 컵'],['400','🫖 물 두 컵']],mode:'200',modeLabel:'따뜻한 물은 얼마나?',a:{label:'물의 처음 온도',min:10,max:70,step:10,value:40,unit:'℃',low:'미지근 · 10℃',high:'뜨거움 · 70℃'},b:{label:'넣는 얼음의 무게',min:15,max:70,step:5,value:40,unit:'g',low:'적게 · 15g',high:'많이 · 70g'},result:'얼음은 얼마나 녹을까요?',hint:'물 200g 또는 400g과 0℃ 얼음을 섞는 가상 실험이에요.'}
};
const choiceIllustrations = {
  friction: {rough:'felt-path', ice:'ice-path'},
  buoyancy: {duck:'floating-duck', stone:'sinking-stone'}
};

function toyIcon(name) {
  const icon = document.createElement('span');
  icon.className = `toy-ui-icon toy-ui-icon-${name}`;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

const $ = id => document.getElementById(id);
const home = $('homeScreen');
const book = $('bookScreen');
const lab = $('labScreen');
const canvas = $('sceneCanvas');
const sceneFrame = $('sceneFrame');
const helpDialog = $('explanationDialog');
const mobilePortrait = window.matchMedia('(max-width: 760px) and (orientation: portrait)');
function setMobileSheet(open) {
  lab.dataset.mobileSheet = open ? 'open' : 'closed';
  $('mobileSheetToggle').setAttribute('aria-expanded', String(open));
  if (open) $('controlPanel').scrollTop = 0;
}
function setMobilePane(pane) {
  lab.dataset.mobilePane = pane;
  $('mobileSheetTitle').textContent = pane === 'story' ? '여우 박사의 이야기' : '토끼의 실험 조작실';
  for (const [id, chosen] of [['mobileStoryBtn', 'story'], ['mobileControlsBtn', 'controls']]) {
    const button = $(id), active = pane === chosen;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  setMobileSheet(true);
}
function syncMobileLayout() {
  const portrait = mobilePortrait.matches;
  const taps = $('storyTaps');
  const destination = $(portrait ? 'mobileStorySlot' : 'storyHomeSlot');
  if (taps.parentElement !== destination) destination.append(taps);
  $('mobileStorySlot').hidden = !portrait;
  $('mobileDock').hidden = !portrait;
  if (portrait && !lab.dataset.mobileSheet) setMobilePane('controls');
  engine?.resize();
}
function syncMobileRun() {
  const label = $('runBtn').textContent;
  const canPlay = !label.includes('일시정지') && !label.includes('다시');
  const shortLabel = label.includes('일시정지') ? '멈춤' : label.includes('다시') ? '다시' : label.includes('계속') ? '계속' : '시작';
  if ($('mobileRunBtn').textContent !== shortLabel) $('mobileRunBtn').textContent = shortLabel;
  $('mobileRunBtn').dataset.play = String(canPlay);
  $('mobileRunBtn').dataset.action = $('runBtn').dataset.action || 'start';
}
function setRunLabel(label) {
  const action = label.includes('일시정지') ? 'pause' : label.includes('다시') ? 'replay' : 'start';
  $('runBtn').textContent = label;
  $('runBtn').dataset.action = action;
  syncMobileRun();
}
const state = {
  lesson: 'gravity', planet: 'earth', earthAir: true, air: true, height: 10, speed: 1,
  status: 'idle', time: 0, accumulator: 0,
  ball: createBody(), feather: createBody(),
  orbitRadius: 1, orbitYears: 0, lightAngle: 40, lightProgress: 0,
  circuitVoltage: 4.5, circuitResistance: 6, circuitClosed: false, circuitProgress: 0,
  mechanicsMode: 'lever', loadNewtons: 120, effortArmMeters: 2, pulleyType: 'fixed', mechanicsProgress: 0,
  magnetMaterial: 'iron', magnetDistance: 2, magnetStrength: 3,
  soundFrequency: 340, soundVolume: 3, discoveryProgress: 0,
  extraMode:'gentle',extraA:3,extraB:0
};
const questionBank = {
  gravity: {
    question: '같은 높이에서 쇠구슬과 깃털을 동시에 놓았어요. 진공에서는 어떻게 될까요?',
    answers: ['쇠구슬이 먼저 떨어져요', '둘이 동시에 떨어져요', '깃털이 먼저 떨어져요'], correct: 1,
    explanation: '맞아요! 공기 저항이 없는 곳에서는 두 물체의 중력가속도가 같아요.'
  },
  orbit: {
    question: '태양 주위를 도는 원형 궤도에서, 행성이 태양에서 더 멀어지면 공전 주기는?',
    answers: ['짧아져요', '거리와 무관해요', '길어져요'], correct: 2,
    explanation: '맞아요! 태양을 중심으로 하는 원형 궤도 모형에서는 멀수록 공전 주기가 길어요.'
  },
  light: {
    question: '평면거울의 법선과 들어오는 빛의 각도가 40°라면, 법선과 반사된 빛의 각도는?',
    answers: ['20°', '40°', '80°'], correct: 1,
    explanation: '정확해요! 평면거울에서는 법선을 기준으로 입사각과 반사각이 같아요.'
  },
  circuit: {
    question: '전지와 전구가 전선으로 연결돼 있어요. 스위치가 열린 상태라면 전구는 어떻게 될까요?',
    answers: ['전류가 흘러 계속 켜져요', '전류가 흐르지 않아 꺼져요', '저항이 없어져요'], correct: 1,
    explanation: '맞아요! 스위치가 열리면 전류가 흐를 수 있는 닫힌 길이 없어 전구가 꺼져요.'
  },
  mechanics: {
    question: '같은 무게를 지레로 들 때 힘점과 받침점 사이 거리를 더 길게 하면 어떻게 될까요?',
    answers: ['더 큰 힘이 필요해요', '같은 힘이 필요해요', '더 작은 힘으로 들 수 있어요'], correct: 2,
    explanation: '맞아요! 더 긴 지레 팔을 이용하면 작은 힘으로 들 수 있지만 힘점은 더 멀리 움직여야 해요.'
  },
  magnet: {
    question: '똑같은 거리에서 자석을 가까이 가져가면 어떤 구슬이 끌려올까요?',
    answers: ['나무 구슬', '철구', '둘 다 똑같이'], correct: 1,
    explanation: '딩동댕! 철처럼 자석에 강하게 반응하는 물질이 있어요. 나무는 보통 끌려오지 않아요.'
  },
  sound: {
    question: '같은 공기에서 소리가 더 높아지면 파장은 어떻게 될까요?',
    answers: ['길어져요', '짧아져요', '항상 같아요'], correct: 1,
    explanation: '딩동댕! 같은 공기에서 진동수가 높아지면 파장은 짧아져요.'
  },
  inertia: {
    question:'장난감 수레가 갑자기 멈추면 위에 있던 물건은 어떻게 될까요?',
    answers:['바로 같이 멈춰요','앞으로 계속 움직이려 해요','뒤로 저절로 날아가요'],correct:1,
    explanation:'정답! 움직이던 물체는 원래 움직이던 상태를 유지하려는 성질이 있어요.'
  },
  friction: {
    question:'같은 경사라면 얼음길과 거친 길 중 어디에서 더 쉽게 미끄러질까요?',
    answers:['마찰이 작은 얼음길','마찰이 큰 거친 길','언제나 똑같아요'],correct:0,
    explanation:'맞아요! 같은 경사에서 마찰이 작으면 미끄러지기 쉬워요.'
  },
  buoyancy: {
    question:'물속 바닥으로 가라앉은 조약돌도 부력을 받을까요?',
    answers:['부력을 전혀 받지 않아요','물에 닿기만 하면 항상 떠요','위로 미는 부력을 받지만 무거워서 가라앉아요'],correct:2,
    explanation:'맞아요! 가라앉는 물체에도 부력이 작용해요. 무게가 그보다 더 크면 가라앉아요.'
  },
  pendulum: {
    question:'지구에서 작게 흔드는 진자의 줄을 길게 하면 한 번 왕복하는 시간은?',
    answers:['더 길어져요','더 짧아져요','줄 길이와 관계없어요'],correct:0,
    explanation:'딩동댕! 작게 흔드는 진자의 왕복 시간은 줄이 길수록 길어져요.'
  },
  heat: {
    question:'같은 양의 얼음을 넣는다면 물이 더 따뜻할 때 대체로 어떤 결과가 날까요?',
    answers:['물을 차갑게 해도 결과가 항상 같아요','얼음을 녹일 수 있는 열이 더 많아요','얼음이 더 빨리 생겨요'],correct:1,
    explanation:'맞아요! 물이 가진 열이 더 많으면 얼음을 녹이는 데 사용할 수 있어요.'
  }
};

let engine = null;
let fallbackContext = null;
let liteContext = null;
let forcedLite = false;
let initialized = false;
let lastFrame = performance.now();
let lastDraw = performance.now();
const fixedStep = 1 / 120;
// Isolated raster props: moving objects and waves are drawn separately from static artwork.
const toySources={magnet:'./assets/magnet-isolated-v12.webp',sound:'./assets/drum-no-fixed-waves-v12.webp'};
for(const id of EVERYDAY_IDS)toySources[id]=`./assets/toy-${id}-v07.webp`;
const cuteToyArtwork=Object.fromEntries(Object.entries(toySources).map(([id,src])=>{
  const art=new Image();art.src=src;return [id,art];
}));
const blueShoeArtwork=new Image();
blueShoeArtwork.src='./assets/toy-shoe-sprite-v09.webp';
const experimentPropsArtwork=new Image();
experimentPropsArtwork.src='./assets/physics-props-atlas-v09.webp';
const surfaceMaterialArtwork=new Image();
surfaceMaterialArtwork.onerror=()=>{if(!surfaceMaterialArtwork.src.endsWith('physics-surface-atlas-v17.webp'))surfaceMaterialArtwork.src='./assets/physics-surface-atlas-v17.webp';};
const apparatusMaterialArtwork=new Image();
// These two high-resolution atlases total >6 MB; load only after a laboratory opens.
let surfaceMaterialRequested=false,apparatusMaterialRequested=false;
function ensureExperimentTextures(lesson){
  if(!surfaceMaterialRequested){
    surfaceMaterialRequested=true;
    surfaceMaterialArtwork.src='./assets/physics-surface-atlas-v18.png';
  }
  if(EVERYDAY_IDS.includes(lesson)&&!apparatusMaterialRequested){
    apparatusMaterialRequested=true;
    apparatusMaterialArtwork.src='./assets/physics-apparatus-materials-v01.png';
  }
}
const heatWaterGlassArtwork=new Image();
heatWaterGlassArtwork.src='./assets/heat-water-glass-v24.webp';
const physicsToyArtwork=new Image();
physicsToyArtwork.src='./assets/physics-toys-atlas-v10.webp';
const woodBallArtwork=new Image();
woodBallArtwork.src='./assets/wood-sphere-v12.webp';
const pulleyWheelArtwork=new Image();
pulleyWheelArtwork.src='./assets/pulley-wheel-v13.webp';
const leverFulcrumArtwork=new Image();
leverFulcrumArtwork.src='./assets/lever-fulcrum-v13.webp';
const bulbUnlitArtwork=new Image();
bulbUnlitArtwork.src='./assets/bulb-unlit-v14.webp';
const explorerPlanetArtwork=new Image();
explorerPlanetArtwork.src='./assets/explorer-planet-v14.webp';

/** The nine transparent cartoon toys occupy equal cells in a 3×3 raster atlas. */
function paintPhysicsToy(ctx,index,cx,cy,width,opacity=1){
  const art=physicsToyArtwork;
  if(!art.complete||!art.naturalWidth)return false;
  const tileWidth=art.naturalWidth/3,tileHeight=art.naturalHeight/3;
  const height=width*tileHeight/tileWidth;
  ctx.save();ctx.globalAlpha*=opacity;
  ctx.drawImage(art,(index%3)*tileWidth,Math.floor(index/3)*tileHeight,tileWidth,tileHeight,cx-width/2,cy-height/2,width,height);
  ctx.restore();
  return true;
}

const heroArtwork = $('heroArtwork');
heroArtwork.addEventListener('load', () => $('heroArt').classList.add('raster-ready'));
heroArtwork.addEventListener('error', () => { heroArtwork.hidden = true; });
if (heroArtwork.complete && heroArtwork.naturalWidth > 0) $('heroArt').classList.add('raster-ready');

function updateChoices(attribute, value) {
  const dataAttribute = attribute.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`);
  const dataKey = dataAttribute.replace(/-([a-z])/g, (_match, character) => character.toUpperCase());
  document.querySelectorAll(`[data-${dataAttribute}]`).forEach(button => {
    const active = button.dataset[dataKey] === String(value);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function everydayReading() {
  switch(state.lesson){
    case 'inertia':return inertiaReading(state.extraA,state.extraMode);
    case 'friction':return frictionReading(state.extraMode,state.extraA);
    case 'buoyancy':return buoyancyReading(state.extraMode,state.extraA);
    case 'pendulum':return pendulumReading(state.extraA,state.extraMode,state.extraB);
    case 'heat':return heatReading(state.extraA,state.extraB,Number(state.extraMode));
    default:return null;
  }
}

function everydaySummary() {
  const r=everydayReading();
  if(state.lesson==='inertia')return {value:`${r.stopDistanceMeters.toFixed(2)} m`,badge:`수레 정지 ${r.stopTimeSeconds.toFixed(1)}초`,message:r.message};
  if(state.lesson==='friction')return {value:r.sliding?`쓱~ ${r.accelerationMetersPerSecondSquared.toFixed(1)} m/s²`:'제자리에서 버텨요',badge:r.sliding?'미끄러져요!':'아직 안 움직여요',message:r.message};
  if(state.lesson==='buoyancy')return {value:r.floats?`둥둥 · 몸체 부피 약 ${Math.round(r.submergedFraction*100)}% 잠김`:'퐁당! 바닥으로 가라앉아요',badge:r.floats?'오리 둥둥':'조약돌 퐁당',message:r.message};
  if(state.lesson==='pendulum')return {value:`약 ${r.periodSeconds.toFixed(2)}초`,badge:`한 번 왕복 ${r.periodSeconds.toFixed(1)}초`,message:'줄이 길거나 중력이 약하면 왕복에 더 오래 걸려요!'};
  return {value:r.allMelted?`전부 녹아요 · ${r.finalTempC.toFixed(1)}℃`:`${Math.round(r.meltedFraction*100)}%만 녹아요`,badge:r.allMelted?'얼음이 사르르':'얼음이 조금 남아요',message:r.message};
}

function setupEverydayControls(){
  if(!EVERYDAY_IDS.includes(state.lesson))return;
  const config=everydayConfigs[state.lesson];
  $('extraModeCaption').textContent=config.modeLabel;
  const group=$('extraModeGroup');group.replaceChildren();
  for(const [value,label] of config.modes){
    const b=document.createElement('button');b.type='button';b.className='choice';b.dataset.extraMode=value;
    const illustration = choiceIllustrations[state.lesson]?.[value];
    if(state.lesson==='inertia'||state.lesson==='heat'){
      b.classList.add('choice-extra-v19');
      b.textContent=label.replace(/^\S+\s+/u,'');
    } else if(state.lesson==='pendulum' && (value==='earth'||value==='moon')){
      b.classList.add('choice-condition-illustrated');
      b.textContent=label.replace(/^\S+\s+/u,'');
    } else if(illustration){
      b.classList.add('choice-illustrated');
      b.append(toyIcon(illustration),document.createTextNode(label.replace(/^\S+\s+/u,'')));
    } else {
      b.textContent=label;
    }
    b.addEventListener('click',()=>{
      state.extraMode=value;
      const condition=label.replace(/^\S+\s+/u,'');
      const finalSyllable=condition.charCodeAt(condition.length-1)-0xac00;
      const finalConsonant=finalSyllable>=0&&finalSyllable<11172?finalSyllable%28:0;
      const particle=finalConsonant&&finalConsonant!==8?'으로':'로';
      refreshEveryday(`조건을 ${condition}${particle} 바꿨어요!`);
    });group.append(b);
  }
  for(const [letter,range] of [['A',config.a],['B',config.b]]){
    if(letter==='B')$('extraBControl').hidden=!range;
    if(!range)continue;
    const el=$(`extra${letter}Range`);
    for(const attr of ['min','max','step'])el[attr]=String(range[attr]);
    el.value=String(state[`extra${letter}`]);
    $(`extra${letter}Label`).textContent=range.label;
    $(`extra${letter}Min`).textContent=range.low;
    $(`extra${letter}Max`).textContent=range.high;
  }
  $('extraResultCaption').textContent=config.result;
  $('extraHint').textContent=config.hint;
  updateChoices('extraMode',state.extraMode);
}

function refreshEveryday(message){
  resetSimulation(false);
  updateChoices('extraMode',state.extraMode);
  $('storyTaps').querySelectorAll('[data-story]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
  showStatus(message);
}

function resetSimulation(announce = true) {
  state.status = 'idle';
  state.time = 0;
  state.accumulator = 0;
  state.ball = createBody();
  state.feather = createBody();
  state.orbitYears = 0;
  state.lightProgress = 0;
  state.circuitProgress = 0;
  state.mechanicsProgress = 0;
  state.discoveryProgress = 0;
  setRunLabel(state.lesson === 'circuit' ? '전류 흐름 보기' : '실험 시작');
  if (announce) showStatus('준비됐어요! 실험 시작 버튼을 눌러주세요.');
  updateReadouts();
  renderScene();
}

function showStatus(message) {
  $('statusRibbon').textContent = message;
}

function updateReadouts() {
  if (state.lesson === 'gravity') {
    $('ballDistance').textContent = `${state.ball.distance.toFixed(1)} m`;
    $('featherDistance').textContent = `${state.feather.distance.toFixed(1)} m`;
    $('timeValue').textContent = `${state.time.toFixed(2)}초`;
    if ($('sceneMode').dataset.planet !== state.planet) $('sceneMode').dataset.planet = state.planet;
    $('sceneMode').textContent = `${state.planet === 'earth' ? '지구' : '달'} · ${state.air ? '공기 있음' : '진공'}`;
    $('heightLabel').textContent = `${state.height} m`;
    $('airHint').textContent = state.planet === 'moon'
      ? '달에는 대기가 거의 없어 진공 실험으로 진행돼요.'
      : state.air ? '공기의 저항으로 깃털이 천천히 떨어질 수 있어요.'
        : '공기 저항이 없으면 두 물체는 함께 떨어져요.';
  } else if (state.lesson === 'orbit') {
    const period = orbitalPeriodYears(state.orbitRadius);
    $('sceneMode').textContent = `태양 둘레 · ${state.orbitRadius.toFixed(1)} AU`;
    $('orbitDistance').textContent = `${state.orbitRadius.toFixed(1)} AU`;
    $('orbitRadiusLabel').textContent = `${state.orbitRadius.toFixed(1)} AU`;
    $('orbitPeriod').textContent = `${period.toFixed(2)}년`;
    $('timeValue').textContent = `${state.orbitYears.toFixed(2)}년`;
  } else if (state.lesson === 'light') {
    const path = mirrorLightPath(state.lightAngle);
    $('sceneMode').textContent = `평면거울 · 입사각 ${state.lightAngle}°`;
    $('lightIncidence').textContent = `${path.incidenceDegrees}°`;
    $('lightReflection').textContent = `${path.reflectionDegrees}°`;
    $('lightAngleLabel').textContent = `${state.lightAngle}°`;
    $('lightAngleResult').textContent = `${path.reflectionDegrees}°`;
    $('timeValue').textContent = `${Math.round(state.lightProgress * 100)}%`;
  } else if (state.lesson === 'circuit') {
    const circuit = circuitReadings(state.circuitVoltage, state.circuitResistance, state.circuitClosed);
    $('sceneMode').textContent = `${state.circuitVoltage.toFixed(1)} V · 스위치 ${state.circuitClosed ? '닫힘' : '열림'}`;
    $('circuitCurrent').textContent = `${circuit.current.toFixed(2)} A`;
    $('circuitPower').textContent = `${circuit.power.toFixed(2)} W`;
    $('circuitResult').textContent = `${circuit.current.toFixed(2)} A · ${state.circuitClosed ? '켜짐' : '꺼짐'}`;
    $('voltageLabel').textContent = `${state.circuitVoltage.toFixed(1)} V`;
    $('resistanceLabel').textContent = `${state.circuitResistance} Ω`;
    $('timeValue').textContent = state.circuitClosed ? '전류 흐름' : '전류 0 A';
    $('circuitSceneSwitch').textContent = state.circuitClosed ? '스위치 닫힘 · 눌러 끊기' : '스위치 열림 · 눌러 연결';
    $('circuitSceneSwitch').setAttribute('aria-pressed', String(state.circuitClosed));
  } else if (state.lesson === 'mechanics') {
    const m=mechanicsReadings({mode:state.mechanicsMode,loadNewtons:state.loadNewtons,effortArmMeters:state.effortArmMeters,pulleyType:state.pulleyType});
    if ($('sceneMode').dataset.mechanics !== state.mechanicsMode) $('sceneMode').dataset.mechanics = state.mechanicsMode;
    $('sceneMode').textContent = state.mechanicsMode === 'lever' ? `지레 · 힘점 ${state.effortArmMeters} m` :
      `${state.pulleyType === 'fixed' ? '고정도르래' : '움직도르래'}`;
    $('mechanicsEffort').textContent = `${m.effortNewtons.toFixed(0)} N`;
    $('mechanicsAdvantage').textContent = `${m.advantage.toFixed(0)}배`;
    $('mechanicsResult').textContent = `${m.effortNewtons.toFixed(0)} N · ${m.advantage.toFixed(0)}배 이득`;
    $('mechanicsTravel').textContent = `힘점·줄 이동 ${m.inputTravelMeters.toFixed(1)} m · 물체 이동 ${m.liftMeters.toFixed(1)} m`;
    $('mechanicsHelp').textContent=state.mechanicsMode==='lever'?
      '마찰과 도구 무게를 무시한 지레에서는 긴 힘점 거리를 이용해 작은 힘으로 들어요. 그만큼 힘점이 더 길게 움직여요.':
      state.pulleyType==='fixed'?
      '마찰과 도구 무게를 무시하면 고정도르래는 힘의 방향만 바꿔요. 필요한 힘과 줄을 당기는 거리는 그대로예요.':
      '마찰과 도구 무게를 무시하면 움직도르래는 절반의 힘으로 들어요. 대신 줄을 물체가 올라간 거리의 두 배만큼 당겨요.';
    $('loadLabel').textContent = `${state.loadNewtons} N`;
    $('effortArmLabel').textContent = `${state.effortArmMeters} m`;
    $('timeValue').textContent = `${Math.round(state.mechanicsProgress*100)}% 진행`;
  } else if (state.lesson === 'magnet') {
    const result = magnetReading(state.magnetMaterial, state.magnetDistance, state.magnetStrength);
    $('sceneMode').textContent = `자석 · ${state.magnetDistance} cm`;
    $('magnetDistanceLabel').textContent = `${state.magnetDistance} cm`;
    $('magnetStrengthLabel').textContent = `${state.magnetStrength} 단계`;
    $('magnetPull').textContent = result.attraction ? '철구를 당겨요' : '나무는 그대로!';
    $('magnetResult').textContent = result.attraction ? '철구가 끌려와요!' : '나무 구슬은 그대로예요';
    $('timeValue').textContent = `${Math.round(state.discoveryProgress*100)}% 진행`;
  } else if (state.lesson === 'sound') {
    const result = soundReading(state.soundFrequency, state.soundVolume);
    $('sceneMode').textContent = `진동수 ${state.soundFrequency} Hz`;
    $('soundFrequencyLabel').textContent = `${state.soundFrequency} Hz`;
    $('soundVolumeLabel').textContent = `${state.soundVolume} 단계`;
    $('soundWaveLabel').textContent = `${result.wavelengthMeters.toFixed(2)} m`;
    $('soundResult').textContent = `약 ${result.wavelengthMeters.toFixed(2)} m`;
    $('timeValue').textContent = `${Math.round(state.discoveryProgress*100)}% 진행`;
  } else if (EVERYDAY_IDS.includes(state.lesson)) {
    const config=everydayConfigs[state.lesson],summary=everydaySummary();
    $('sceneMode').dataset.extraMode=state.extraMode;
    $('sceneMode').textContent=state.lesson==='friction'
      ? `${state.extraMode==='rough'?'폭신한 길':'얼음길'} · 경사 ${state.extraA}°`
      : state.lesson==='buoyancy'
        ? `${state.extraMode==='duck'?'장난감 오리':'조약돌'} · 소금기 ${state.extraA} g/L`
        : lessonContent[state.lesson].title;
    $('extraAValue').textContent=`${Number(state.extraA).toFixed(config.a.step<1?1:0)} ${config.a.unit}`;
    if(config.b)$('extraBValue').textContent=`${Number(state.extraB).toFixed(config.b.step<1?1:0)} ${config.b.unit}`;
    $('extraResult').textContent=summary.value;
    $('everydaySceneResult').textContent=summary.badge;
    $('timeValue').textContent=`${Math.round(state.discoveryProgress*100)}% 진행`;
  }
}

function endExperiment() {
  state.status = 'done';
  state.visualFinishMs = performance.now();
  setRunLabel('다시 실험');
  if (state.lesson === 'orbit') {
    showStatus(`탐사 행성이 한 바퀴를 돌았어요! ${orbitalPeriodYears(state.orbitRadius).toFixed(2)}년이 걸려요.`);
  } else if (state.lesson === 'light') {
    showStatus(`발견! 법선을 기준으로 입사각과 반사각이 모두 ${state.lightAngle}°예요.`);
  } else if (state.lesson === 'circuit') {
    showStatus('발견! 닫힌 회로에서는 전류가 흘러 전구가 켜져요. 스위치를 열어 비교해 보세요!');
  } else if (state.lesson === 'mechanics') {
    const m=mechanicsReadings({mode:state.mechanicsMode,loadNewtons:state.loadNewtons,effortArmMeters:state.effortArmMeters,pulleyType:state.pulleyType});
    showStatus(`발견! 필요한 힘은 ${m.effortNewtons.toFixed(0)}N이에요. 힘을 줄이면 움직여야 할 거리가 늘어나요!`);
  } else if (state.lesson === 'magnet') {
    const result=magnetReading(state.magnetMaterial,state.magnetDistance,state.magnetStrength);
    showStatus(`발견! ${result.message} 다른 물체도 바꿔 보세요!`);
  } else if (state.lesson === 'sound') {
    const result=soundReading(state.soundFrequency,state.soundVolume);
    showStatus(`발견! 진동수 ${state.soundFrequency}Hz에서 파장은 약 ${result.wavelengthMeters.toFixed(2)}m예요!`);
  } else if(EVERYDAY_IDS.includes(state.lesson)){
    showStatus(`발견! ${everydaySummary().message}`);
  } else if (!state.air) {
    showStatus('발견! 진공에서는 쇠구슬과 깃털이 같은 중력가속도로 떨어져요.');
  } else {
    showStatus('쇠구슬이 먼저 닿았어요! 이번에는 진공으로 바꿔볼까요?');
  }
  $('quizBtn').classList.add('quiz-ready');
}

function physicsUpdate(dt) {
  if (state.status !== 'running') return;
  if (state.lesson === 'circuit') {
    if (state.circuitClosed) state.circuitProgress = (state.circuitProgress + dt * state.speed * .19) % 1;
    return;
  }
  if (state.lesson === 'mechanics') {
    state.mechanicsProgress = Math.min(1,state.mechanicsProgress+dt*state.speed/3.3);
    if(state.mechanicsProgress>=1)endExperiment();
    updateReadouts();return;
  }
  if (state.lesson === 'magnet' || state.lesson === 'sound' || EVERYDAY_IDS.includes(state.lesson)) {
    state.discoveryProgress=Math.min(1,state.discoveryProgress+dt*state.speed/3.5);
    if(state.discoveryProgress>=1)endExperiment();
    updateReadouts();return;
  }
  if (state.lesson === 'orbit') {
    state.orbitYears = Math.min(orbitalPeriodYears(state.orbitRadius), state.orbitYears + dt * state.speed * .23);
    state.time += dt;
    if (state.orbitYears >= orbitalPeriodYears(state.orbitRadius)) endExperiment();
    updateReadouts();
    return;
  }
  if (state.lesson === 'light') {
    state.lightProgress = Math.min(1, state.lightProgress + dt * state.speed / 3.3);
    state.time += dt;
    if (state.lightProgress >= 1) endExperiment();
    updateReadouts();
    return;
  }
  state.accumulator += Math.min(dt, 0.05) * state.speed;
  let steps = 0;
  while (state.accumulator >= fixedStep && steps < 24) {
    const g = GRAVITY[state.planet];
    stepBody(state.ball, 'ball', fixedStep, g, state.height, state.air, state.time);
    stepBody(state.feather, 'feather', fixedStep, g, state.height, state.air, state.time);
    state.time += fixedStep;
    state.accumulator -= fixedStep;
    steps++;
    if (state.ball.landedAt !== null && state.feather.landedAt !== null) {
      endExperiment();
      state.accumulator = 0;
      break;
    }
  }
  updateReadouts();
}

let lastCompanionKey = '';
function syncLabCompanion() {
  const cue = companionCue(state);
  const message = mobilePortrait.matches ? cue.mobileSpeech : cue.speech;
  const key = [cue.animal, message, cue.mood].join('|');
  if (key === lastCompanionKey) return;
  lastCompanionKey = key;
  const image = $('sceneCompanionImage');
  $('sceneCompanion').dataset.mood = cue.mood;
  if (image.dataset.animal !== cue.animal) {
    image.src = COMPANION_ART[cue.animal];
    image.dataset.animal = cue.animal;
  }
  $('sceneCompanionName').textContent = cue.name;
  $('sceneCompanionText').textContent = message;
}

function renderScene() {
  if (lab.hidden) return;
  syncLabCompanion();
  if(EVERYDAY_IDS.includes(state.lesson)){
    if(!liteContext)liteContext=$('liteCanvas').getContext('2d');
    renderFallback(state,liteContext,$('liteCanvas'));
    return;
  }
  if (forcedLite && liteContext) renderFallback(state, liteContext, $('liteCanvas'));
  else if (engine) engine.render(state);
  else if (fallbackContext) renderFallback(state);
}

function frame(now) {
  requestAnimationFrame(frame);
  // Limit graphics work to about 30fps on battery-powered and budget devices.
  if (now - lastDraw < 32) return;
  lastDraw = now;
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (!lab.hidden && !document.hidden) {
    physicsUpdate(dt);
    renderScene();
  }
}

function openBook() {
  home.hidden = true;
  lab.hidden = true;
  book.hidden = false;
  updateBookProgress();
}

function openLab(lesson = 'gravity') {
  state.lesson = lesson;
  ensureExperimentTextures(lesson);
  lab.dataset.lesson = lesson;
  state.planet = 'earth';
  state.air = true;
  state.earthAir = true;
  state.orbitRadius = 1;
  state.lightAngle = 40;
  state.circuitVoltage = 4.5;
  state.circuitResistance = 6;
  state.circuitClosed = false;
  state.mechanicsMode='lever';
  state.loadNewtons=120;
  state.effortArmMeters=2;
  state.pulleyType='fixed';
  state.magnetMaterial='iron';state.magnetDistance=2;state.magnetStrength=3;
  state.soundFrequency=340;state.soundVolume=3;
  if(EVERYDAY_IDS.includes(lesson)){
    const config=everydayConfigs[lesson];state.extraMode=config.mode;state.extraA=config.a.value;state.extraB=config.b?.value??0;
  }
  $('orbitRadiusRange').value = '1';
  $('lightAngleRange').value = '40';
  $('voltageRange').value = '4.5';
  $('resistanceRange').value = '6';
  $('loadRange').value='120';
  $('effortArmRange').value='2';
  $('magnetDistanceRange').value='2';$('magnetStrengthRange').value='3';
  $('soundFrequencyRange').value='340';$('soundVolumeRange').value='3';
  document.querySelector('[data-air="on"]').disabled = false;
  home.hidden = true;
  book.hidden = true;
  lab.hidden = false;
  if (mobilePortrait.matches) {
    lab.dataset.mobileDetail = 'simple';
    $('mobileAdvancedBtn').setAttribute('aria-expanded', 'false');
    $('mobileAdvancedBtn').textContent = '자세히 조작하기';
    setMobilePane('controls');
  }
  syncMobileLayout();
  configureLesson();
  resetSimulation(false);
  showStatus(EVERYDAY_IDS.includes(lesson) ? '책 속 문장을 눌러보거나 조건을 바꿔 보세요! 어떤 일이 생길까요?' :
    lesson === 'gravity' ? '책 속 문장을 눌러보세요! 낙하 실험이 움직여요.' :
    lesson === 'orbit' ? '탐사 행성의 거리를 바꿔 공전 시간을 비교해 보세요!' :
    lesson === 'light' ? '입사각을 바꿔 빛이 반사되는 경로를 확인해 보세요!' :
    lesson === 'circuit' ? '화면의 스위치를 눌러 전구를 켜 보세요!' :
    lesson === 'mechanics' ? '지레와 도르래를 바꾸며 필요한 힘과 이동 거리를 비교해 보세요!' :
    lesson === 'magnet' ? '철구와 나무 구슬을 바꿔 보세요! 어떤 것이 쏙 끌려올까요?' :
    '두근두근! 소리의 높이를 바꾸면 파장이 어떻게 바뀔까요?');
  if(EVERYDAY_IDS.includes(lesson)){
    $('sceneCanvas').hidden=true;$('liteCanvas').hidden=false;
    liteContext||=$('liteCanvas').getContext('2d');
    $('liteBtn').disabled=true;$('liteBtn').textContent='애니메이션 모드';
    $('cameraBtn').disabled=true;
    $('renderMode').textContent='움직이는 그림책';
    $('sceneInstruction').textContent='그림 속 움직임과 숫자를 함께 봐요';
    $('sceneFallback').hidden=true;
    renderScene();
  }else{
    // Mobile phones open directly in the illustrated 2D laboratory; WebGL stays optional.
    if(!initialized && mobilePortrait.matches){
      initialized=true;
      forcedLite=true;
      liteContext||=$('liteCanvas').getContext('2d');
    }
    const fallback = initialized && !engine && !forcedLite;
    const showLite = forcedLite && !!liteContext;
    $('sceneCanvas').hidden=showLite;$('liteCanvas').hidden=!showLite;
    $('liteBtn').disabled=fallback;
    // This button names the destination mode, so aria-pressed would misstate it.
    $('liteBtn').removeAttribute('aria-pressed');
    $('liteBtn').textContent=fallback?'2D 모드':showLite?'3D로 보기':'2D 경량모드';
    $('cameraBtn').disabled=fallback||showLite;
    $('renderMode').textContent=showLite?'그림책 실험':fallback?'2D 실험':engine?'3D 실험':'3D 준비 중';
    $('sceneInstruction').textContent=showLite?'그림·숫자 관찰':fallback?'2D 움직임으로 비교해 보세요':'손가락으로 드래그해 관찰해 보세요';
    $('sceneFallback').hidden=!fallback;
    if(!initialized)initializeScene();
    engine?.resetCamera();engine?.resize();
  }
}

function closeLab() {
  resetSimulation(false);
  lab.hidden = true;
  openBook();
}

const lessonStories = {
  gravity: [
    { id: 'air', label: '📖 공기가 있으면 깃털은?', status: '지구에 공기가 있어요. 쇠구슬과 깃털이 어떻게 내려가는지 보세요!' },
    { id: 'vacuum', label: '📖 공기를 없애면?', status: '공기를 없앴어요! 쇠구슬과 깃털이 함께 떨어지는지 살펴보세요.' },
    { id: 'moon', label: '📖 달에서는?', status: '달은 중력이 약해요. 진공에서 떨어지는 데 얼마나 더 걸릴까요?' }
  ],
  orbit: [
    { id: 'near', label: '📖 태양에 가까워지면?', status: '거리를 0.7 AU로 줄였어요. 탐사 행성이 빨리 공전해요!' },
    { id: 'earth', label: '📖 지구의 거리라면?', status: '지구와 같은 1.0 AU에서는 공전 주기가 1년이에요.' },
    { id: 'far', label: '📖 멀어지면 어떻게 될까?', status: '거리를 1.6 AU로 늘렸어요. 한 바퀴 도는 데 얼마나 걸릴까요?' }
  ],
  light: [
    { id: 'gentle', label: '📖 살짝 비추면?', status: '빛이 법선과 20°로 들어와요. 반사 방향을 보세요!' },
    { id: 'wide', label: '📖 크게 기울이면?', status: '입사각을 60°로 늘렸어요. 반사각도 함께 변할까요?' },
    { id: 'equal', label: '📖 두 각도가 같을까?', status: '입사각과 반사각을 비교해 보세요. 법선이 기준이에요!' }
  ],
  circuit: [
    { id: 'open', label: '📖 전선이 끊어지면?', status: '스위치를 열었어요. 전구와 전류의 변화를 확인하세요!' },
    { id: 'closed', label: '📖 길을 이어주면?', status: '회로를 연결했어요! 전구에 불이 들어오는지 보세요!' },
    { id: 'bright', label: '📖 전압을 높이면?', status: '전압을 9V로 높였어요. 전구와 전류를 비교해 보세요!' }
  ],
  mechanics: [
    { id: 'short', label: '📖 짧은 지레를 쓰면?', status: '힘점까지 1m인 지레예요. 필요한 힘을 살펴보세요!' },
    { id: 'long', label: '📖 지레를 길게 하면?', status: '힘점까지 거리를 4m로 늘렸어요! 적은 힘으로 드는지 볼까요?' },
    { id: 'pulley', label: '📖 움직도르래를 쓰면?', status: '움직도르래는 두 가닥의 줄이 물체를 지탱해요. 필요한 힘은?' }
  ],
  magnet: [
    { id: 'near', label: '📖 철구를 가까이?', status: '철구를 자석 가까이 가져가 볼까요?' },
    { id: 'far', label: '📖 멀리 놓으면?', status: '멀리 있을 때 움직이는 모습을 비교해요!' },
    { id: 'wood', label: '📖 나무 구슬이라면?', status: '나무 구슬은 자석에 끌려올까요? 눈으로 확인해요!' }
  ],
  sound: [
    { id: 'low', label: '📖 낮은 소리라면?', status: '낮은 소리는 파장 간격이 넓어요. 물결을 보세요!' },
    { id: 'high', label: '📖 높은 소리라면?', status: '높은 소리는 물결 사이가 가까워져요!' },
    { id: 'loud', label: '📖 더 크게 두드리면?', status: '큰 소리는 물결의 진폭이 더 커지는 모습을 봐요!' }
  ],
  inertia:[
    {id:'gentle',label:'📖 살살 멈추면?',status:'수레가 천천히 멈추는 동안 얼마나 더 갈까요?'},
    {id:'sudden',label:'📖 갑자기 멈추면?',status:'수레는 멈췄는데 물건이 앞으로 쏠리는 이유는?'},
    {id:'fast',label:'📖 더 빨리 달리면?',status:'같은 급정거에서 출발 속도를 높여 비교해 봐요!'}
  ],
  friction:[
    {id:'rough',label:'📖 폭신한 길이라면?',status:'표면이 거칠면 마찰이 버텨 주기도 해요!'},
    {id:'ice',label:'📖 얼음길이라면?',status:'미끄러운 길에서는 작은 경사에도 쓱~!'},
    {id:'steep',label:'📖 길을 기울이면?',status:'경사가 커지면 거친 길도 미끄러질 수 있어요!'}
  ],
  buoyancy:[
    {id:'duck',label:'📖 오리는 둥둥?',status:'물보다 평균 밀도가 작은 오리는 둥실둥실!'},
    {id:'stone',label:'📖 돌은 퐁당?',status:'돌도 부력을 받지만 무게를 지탱하기에 부족해요!'},
    {id:'salt',label:'📖 물이 더 짜지면?',status:'물의 밀도가 조금 커지면 오리가 잠기는 정도가 바뀔까요?'}
  ],
  pendulum:[
    {id:'short',label:'📖 짧은 줄이라면?',status:'짧은 줄의 진자는 더 빠르게 왕복해요!'},
    {id:'long',label:'📖 긴 줄이라면?',status:'줄을 길게 하니 한 번 왔다 가는 데 시간이 길어져요!'},
    {id:'moon',label:'📖 달에서 흔들면?',status:'달은 중력이 작아요. 왕복 시간은 어떻게 달라질까요?'}
  ],
  heat:[
    {id:'cool',label:'📖 미지근한 물이라면?',status:'따뜻함이 부족하면 얼음이 덜 녹을 수 있어요!'},
    {id:'hot',label:'📖 더 따뜻한 물이라면?',status:'물이 가진 열이 많으면 얼음을 더 녹일 수 있어요!'},
    {id:'ice',label:'📖 얼음을 더 넣으면?',status:'같은 물에 얼음을 많이 넣으면 모두 녹을까요?'}
  ]
};

const everydayStoryPresets={
  inertia:{gentle:['gentle',3,0],sudden:['sudden',3,0],fast:['sudden',5,0]},
  friction:{rough:['rough',20,0],ice:['ice',20,0],steep:['rough',40,0]},
  buoyancy:{duck:['duck',0,0],stone:['stone',0,0],salt:['duck',30,0]},
  pendulum:{short:['earth',.4,10],long:['earth',1.6,10],moon:['moon',1,10]},
  heat:{cool:['200',10,70],hot:['200',70,40],ice:['200',30,70]}
};

const lessonContent = {
  gravity: {
    chapter: '제1장 · 힘과 운동', title: '중력의 비밀', question: '쇠구슬과 깃털, 누가 먼저 바닥에 닿을까요?',
    unit: '실험 시간', model: '수치 모델: 중력 + 단순화된 공기 저항', canvas: '회전 가능한 3D 낙하 실험 장면',
    explainTitle: '무거우면 더 빨리 떨어질까요?',
    lead: '진공에서는 공기 저항이 없으므로 같은 장소의 두 물체가 같은 중력가속도로 떨어져요.',
    formulaCaption: '이상적인 낙하 거리', formula: 's = ½gt²', formulaHint: 'g: 중력가속도, t: 경과 시간',
    body: '공기가 있을 때는 모양과 크기, 속도에 따라 저항을 받아요. 깃털은 쇠구슬보다 그 영향을 크게 받아 늦게 떨어질 수 있죠.',
    note: '교육용 단순화 모델이에요. 달은 대기가 거의 없으므로 달 실험은 진공으로 고정됩니다.'
  },
  orbit: {
    chapter: '제2장 · 우주와 운동', title: '행성의 공전 비밀', question: '태양에서 멀리 있는 행성은 왜 더 오래 걸릴까요?',
    unit: '공전 경과', model: '수치 모델: 태양 기준 원형 궤도 · 케플러 제3법칙', canvas: '회전 가능한 태양 중심 3D 궤도 장면',
    explainTitle: '태양에서 멀수록 왜 더 오래 걸릴까요?',
    lead: '태양 주위를 도는 행성의 공전 주기는 태양과의 거리가 멀어질수록 길어져요.',
    formulaCaption: '케플러 제3법칙 · 태양 중심 단위', formula: 'T² = r³', formulaHint: 'T: 공전 주기(년), r: 태양에서의 거리(AU)',
    body: '같은 별을 중심으로 공전하는 물체에서는 궤도 반지름의 세제곱과 공전 주기의 제곱이 비례해요. 이 도감은 원형 궤도로 단순화해 보여줍니다.',
    note: '실제 궤도는 타원이고, 행성의 실제 크기·거리·시간 축척은 이 그림과 다릅니다. 탐사 행성은 가상의 비교 대상이에요.'
  },
  light: {
    chapter: '제3장 · 빛과 파동', title: '빛과 거울의 비밀', question: '빛을 비스듬히 비추면 어느 방향으로 반사될까요?',
    unit: '빛의 경로', model: '모형: 평면거울 · 반사의 법칙 · 광선 진행 방향', canvas: '회전 가능한 3D 평면거울 빛 반사 장면',
    explainTitle: '거울에서 빛은 왜 방향을 바꿀까요?',
    lead: '빛이 평면거울에 닿으면 법선을 기준으로 양쪽 각도가 같아지도록 반사돼요.',
    formulaCaption: '평면거울의 반사 법칙', formula: '입사각 = 반사각', formulaHint: '두 각도 모두 거울에 수직인 법선에서 측정',
    body: '빛이 들어오는 방향과 나가는 방향은 법선을 중심으로 대칭이에요. 거울 면에서 잰 각도가 아니라 법선에서 잰 각도라는 점이 중요해요.',
    note: '광선은 실제 빛의 경로를 보여주는 학습 모형입니다. 움직이는 빛 알갱이는 관찰용 애니메이션이며 실제 빛의 속도나 입자를 묘사하지 않습니다.'
  },
  circuit: {
    chapter: '제4장 · 전기와 에너지', title: '반짝이는 전기회로', question: '스위치를 누르면 전구가 왜 환하게 켜질까요?',
    unit: '회로 상태', model: '수치 모델: 옴의 법칙 · 단순 저항성 전구 · 직류 회로', canvas: '회전 가능한 3D 전지, 스위치, 전구 회로 실험',
    explainTitle: '스위치를 닫으면 왜 불이 들어올까요?',
    lead: '전지에서 시작해 전구를 지나 다시 전지로 이어진 닫힌 회로에서 전류가 흐를 수 있어요.',
    formulaCaption: '옴의 법칙과 전력', formula: 'I = V ÷ R', formulaHint: '전류(A) = 전압(V) ÷ 저항(Ω), 전력 P = V × I',
    body: '스위치를 열면 길이 끊겨 전류가 0A가 돼요. 스위치를 닫은 상태에서 전압이 커지면 전류도 증가하고, 저항을 크게 하면 전류가 감소해요. 전구가 소비하는 전력에 따라 빛나는 모습을 비교해 보세요.',
    note: '전구를 일정한 저항으로 가정한 교육용 모형입니다. 실제 백열전구의 저항은 온도에 따라 변하며, 화면 밝기는 전력에 따른 연출이지 실제 광도·안전 정격이 아닙니다. 움직이는 점은 전류를 이해시키기 위한 연출입니다.'
  },
  mechanics: {
    chapter: '제5장 · 힘과 도구',title:'지레와 도르래의 비밀',question:'무거운 물체를 어떻게 작은 힘으로 들 수 있을까요?',
    unit:'올리는 과정',model:'교육용 이상 모형: 지레의 토크 평형 · 도르래의 줄 장력',canvas:'회전 가능한 3D 지레 및 도르래 원리 실험',
    explainTitle:'작은 힘으로 어떻게 무거운 물체를 들까요?',
    lead:'지레는 받침점에서 힘점까지의 거리가 길수록 더 적은 힘이 필요해요. 움직도르래는 물체의 하중을 여러 줄이 나눠 지탱할 수 있어요.',
    formulaCaption:'이상적인 힘의 이득',formula:'힘 × 이동 거리 = 일정',formulaHint:'마찰·장치의 무게를 무시할 때 입력한 일 = 들어 올리는 일',
    body:'지레는 힘 × 받침점에서의 거리(토크)를 비교해요. 받침점에서 물체까지 1m, 힘점까지 4m라면 힘은 1/4로 줄지만 힘점은 4배 더 움직여야 해요. 고정도르래는 힘의 방향만 바꾸고, 움직도르래는 이상적으로 힘을 절반으로 줄여 주지만 줄을 2배 더 당겨야 하죠.',
    note:'마찰, 줄과 도르래의 무게 및 탄성, 실제 토크의 시계·반시계 방향과 관성은 생략했습니다. 화면 속 움직임·길이 축척은 물리 이해를 위한 연출이며 안전한 실제 하중 계산이 아닙니다.'
  },
  magnet: {
    chapter:'제6장 · 자석과 힘',title:'자석의 놀라운 힘',question:'자석이 철구는 끌어당기는데 나무는 왜 가만히 있을까요?',
    unit:'끌어당기기',model:'놀이 모형: 자석에 끌리는 물질과 떨어진 거리',canvas:'3D 장난감 자석과 철구·나무 구슬 실험',
    explainTitle:'자석은 무엇을 끌어당길까요?',lead:'자석은 철처럼 특정 물질을 강하게 끌어당길 수 있어요. 나무나 플라스틱은 보통 그렇게 끌려오지 않아요.',
    formulaCaption:'오늘의 한 줄 발견',formula:'철구는 쏙! 나무는 그대로!',formulaHint:'구슬의 종류와 자석까지의 거리를 바꿔 보세요',
    body:'같은 철구라면 가까울수록 끌어당기는 효과를 관찰하기 쉬워요. 하지만 실제 자기력은 자석의 모양과 자성체, 거리 등 여러 조건에 따라 달라요.',
    note:'화면의 세기 단계와 움직임은 개념 설명용 장난감 애니메이션이에요. 실제 자기장이나 힘의 측정값이 아니에요.'
  },
  sound: {
    chapter:'제7장 · 소리와 진동',title:'통통! 소리의 파동',question:'소리가 높아지면 공기 속 물결은 어떻게 달라질까요?',
    unit:'퍼지는 물결',model:'놀이 모형: 진동수 · 파장 · 일정한 소리 속도',canvas:'3D 북과 퍼져 나가는 소리 물결 실험',
    explainTitle:'높은 소리는 왜 다르게 들릴까요?',lead:'소리는 공기의 진동이 전달되는 현상이에요. 높은 소리는 진동수가 더 커요.',
    formulaCaption:'소리의 파장',formula:'파장 = 속도 ÷ 진동수',formulaHint:'공기 중 소리 속도 약 340m/s로 계산했어요',
    body:'같은 온도의 공기에서는 소리의 속도가 거의 일정해요. 그래서 진동수가 높아지면 파장이 짧아져요. 반면 소리가 크고 작은 정도는 진동의 크기와 관련 있어요.',
    note:'화면의 빛나는 고리는 소리를 눈에 보이게 만든 연출이에요. 실제 소리는 공기 중 압축·팽창이 전달되는 종파이며 진공에서는 퍼지지 못해요.'
  },
  inertia:{
    chapter:'제8장 · 관성과 운동',title:'멈춰도 쏠리는 이유',question:'수레가 갑자기 멈추면 사과가 앞으로 쏠리는 이유는 뭘까요?',
    unit:'수레 움직임',model:'간단한 정지 거리 계산 · 일정한 감속 가정',canvas:'장난감 수레와 사과의 관성 애니메이션',
    explainTitle:'수레는 멈췄는데 왜 앞으로 쏠릴까요?',lead:'움직이던 물체는 힘이 작용하지 않으면 그 운동을 계속하려고 해요. 이것이 관성이에요.',
    formulaCaption:'일정하게 속도를 줄이는 수레',formula:'멈추는 거리 = 속도² ÷ (2 × 감속도)',formulaHint:'속도가 빠르면 같은 감속도로 멈추는 거리가 크게 늘어요',
    body:'수레가 멈춰도 사과나 몸은 원래 속도로 앞으로 움직이려고 해요. 실제 자동차에서는 안전벨트가 몸을 보호해 주죠. 이 실험은 수레의 정지 거리만 단순 계산해 보여줘요.',
    note:'가상 일정 감속 모형이에요. 충돌, 사과가 날아가는 궤적, 마찰과 안전벨트의 복잡한 힘은 계산하지 않으며 화면 움직임은 설명용 연출입니다.'
  },
  friction:{
    chapter:'제9장 · 마찰과 미끄럼',title:'쓱쓱! 마찰의 비밀',question:'같은 경사에서도 왜 어떤 길에서는 미끄러지고 어떤 길에서는 멈출까요?',
    unit:'미끄러지는 모습',model:'경사면의 중력 성분과 대표 마찰 계수 학습 모형',canvas:'폭신한 길과 얼음길 장난감 신발의 미끄럼 실험',
    explainTitle:'얼음길에서는 왜 더 미끄러질까요?',lead:'마찰은 맞닿은 표면이 서로 미끄러지지 않도록 방해하는 힘이에요.',
    formulaCaption:'경사면 미끄럼의 단순 모형',formula:'가속도 ≈ g × (sin각도 − μcos각도)',formulaHint:'음수라면 움직이지 않는 것으로 간단히 처리해요',
    body:'거친 바닥의 마찰이 크면 작은 경사에서는 제자리를 지켜요. 미끄러운 바닥은 마찰이 작아 같은 경사에서도 움직이기 쉬워요.',
    note:'마찰계수는 실험용 대표값이고 실제 신발이나 얼음의 측정값이 아니에요. 정지·운동 마찰의 차이와 공기저항은 단순화했습니다.'
  },
  buoyancy:{
    chapter:'제10장 · 물과 부력',title:'둥실둥실 부력 실험',question:'노란 오리는 떠 있고 조약돌은 바닥으로 가라앉는 이유는 뭘까요?',
    unit:'둥둥 또는 퐁당',model:'평균 밀도와 부력 균형을 설명하는 놀이 모형',canvas:'물통 속 노란 오리와 조약돌의 움직임',
    explainTitle:'물은 물체를 어떻게 떠받칠까요?',lead:'물속 물체는 위로 밀어 올리는 부력을 받아요. 물체의 평균 밀도가 물보다 작으면 뜰 수 있어요.',
    formulaCaption:'물에 떠 있을 때',formula:'잠기는 비율 ≈ 물체 밀도 ÷ 물의 밀도',formulaHint:'떠 있는 물체와 물이 일정한 밀도라고 가정했어요',
    body:'노란 장난감 오리는 물보다 평균 밀도가 작아 일부만 물속에 잠긴 채 떠요. 조약돌은 무게가 부력보다 커 가라앉지만 조약돌에도 부력이 작용해요.',
    note:'오리 650kg/m³, 돌 2600kg/m³의 가상 평균 밀도와 간단한 소금물 밀도 추정값을 사용합니다. 실제 물체의 크기와 모양은 다를 수 있어요.'
  },
  pendulum:{
    chapter:'제11장 · 흔들흔들 진자',title:'그네의 시간 비밀',question:'짧은 그네와 긴 그네, 어느 쪽이 한 번 왕복하는 데 오래 걸릴까요?',
    unit:'한 번 왔다 가기',model:'작은 각도의 단진자 주기 · 이상적 모델',canvas:'장난감 시계추가 좌우로 흔들리는 애니메이션',
    explainTitle:'그네 줄이 길수록 왜 느리게 흔들릴까요?',lead:'작게 흔드는 진자는 줄이 길수록 한 번 왕복하는 시간이 길어져요.',
    formulaCaption:'작은 각도에서의 왕복 시간',formula:'주기 ≈ 2π × √(길이 ÷ 중력)',formulaHint:'달에서는 중력이 작아 같은 길이의 진자가 천천히 왕복해요',
    body:'줄의 길이와 중력을 바꾸어 왕복 시간을 비교해 보세요. 아주 크게 흔들면 이 간단한 공식과 차이가 생겨요.',
    note:'공기저항, 축의 마찰과 줄 무게를 무시하고 5~20°의 작은 각도로 흔드는 단진자 모형이에요.'
  },
  heat:{
    chapter:'제12장 · 열과 온도',title:'사르르~ 얼음 녹이기',question:'따뜻한 물 한 컵에 얼음을 넣으면 얼음이 모두 녹을까요?',
    unit:'얼음 녹기',model:'열 보존·얼음 융해열을 적용한 단순 혼합 모형',canvas:'주전자와 얼음이 만나 사르르 녹는 애니메이션',
    explainTitle:'얼음을 녹이려면 무엇이 필요할까요?',lead:'따뜻한 물이 식으면서 내놓는 열이 얼음을 녹이는 데 쓰여요.',
    formulaCaption:'얼음을 녹이는 데 필요한 열',formula:'열 ≈ 얼음 무게 × 녹는 데 필요한 열',formulaHint:'물을 200g/400g, 얼음은 0℃로 시작한다고 가정해요',
    body:'물의 처음 온도가 높으면 전달할 수 있는 열이 많아요. 같은 물이라면 얼음을 많이 넣을수록 모두 녹이기 어려워질 수 있어요.',
    note:'열이 밖으로 새지 않는 가상의 컵, 0℃ 얼음과 물의 비열 4.18J/g℃, 융해열 334J/g을 사용한 계산이에요. 실제 주전자의 끓음·열 이동 속도는 재현하지 않습니다.'
  }
};

function configureLesson() {
  const current = lessonContent[state.lesson];
  for (const [id, property] of [
    ['chapterNum','chapter'],['labTitle','title'],['missionQuestion','question'],
    ['timeUnit','unit'],['modelDescription','model'],['dialogTitle','explainTitle'],
    ['explanationLead','lead'],['formulaCaption','formulaCaption'],['formulaValue','formula'],
    ['formulaHint','formulaHint'],['explanationBody','body'],['explanationNote','note']
  ]) $(id).textContent = current[property];
  for (const lesson of LESSON_IDS.filter(id=>!EVERYDAY_IDS.includes(id))) $(`${lesson}Controls`).hidden = state.lesson !== lesson;
  $('extraControls').hidden=!EVERYDAY_IDS.includes(state.lesson);
  $('ballLabel').hidden = state.lesson !== 'gravity';
  $('featherLabel').hidden = state.lesson !== 'gravity';
  $('orbitLabel').hidden = state.lesson !== 'orbit';
  $('lightIncidenceLabel').hidden = state.lesson !== 'light';
  $('lightReflectionLabel').hidden = state.lesson !== 'light';
  $('circuitCurrentLabel').hidden = state.lesson !== 'circuit';
  $('circuitPowerLabel').hidden = state.lesson !== 'circuit';
  $('circuitSceneSwitch').hidden = state.lesson !== 'circuit';
  $('mechanicsEffortLabel').hidden=state.lesson!=='mechanics';
  $('mechanicsAdvantageLabel').hidden=state.lesson!=='mechanics';
  $('magnetLabel').hidden=state.lesson!=='magnet';
  $('soundLabel').hidden=state.lesson!=='sound';
  $('everydayLabel').hidden=!EVERYDAY_IDS.includes(state.lesson);
  $('sceneCanvas').setAttribute('aria-label', current.canvas);
  const taps = $('storyTaps');
  taps.replaceChildren();
  lessonStories[state.lesson].forEach((item, index) => {
    const activeInitially = state.lesson === 'orbit' ? index === 1 : state.lesson === 'light' ? index === 2 : index === 0;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `story-tap${activeInitially ? ' active' : ''}`;
    button.dataset.story = item.id;
    button.textContent = item.label.replace(/^📖\s*/u, '');
    button.setAttribute('aria-pressed', String(activeInitially));
    button.addEventListener('click', () => activateStory(item));
    taps.append(button);
  });
  $('quizBtn').classList.remove('quiz-ready');
  updateChoices('planet', state.planet);
  updateChoices('air', state.air ? 'on' : 'off');
  updateChoices('circuit', state.circuitClosed ? 'closed' : 'open');
  updateChoices('mechanics-mode', state.mechanicsMode);
  updateChoices('pulley', state.pulleyType);
  updateChoices('material', state.magnetMaterial);
  setupEverydayControls();
  $('leverArmControl').hidden=state.lesson==='mechanics'&&state.mechanicsMode!=='lever';
  $('pulleyTypeControl').hidden=state.lesson!=='mechanics'||state.mechanicsMode!=='pulley';
  updateReadouts();
}

function activateStory(item) {
  if (state.lesson === 'gravity') {
    const isMoon = item.id === 'moon';
    state.planet = isMoon ? 'moon' : 'earth';
    state.air = item.id === 'air';
    if (!isMoon) state.earthAir = state.air;
    document.querySelector('[data-air="on"]').disabled = isMoon;
    updateChoices('planet', state.planet);
    updateChoices('air', state.air ? 'on' : 'off');
  } else if (state.lesson === 'orbit') {
    state.orbitRadius = item.id === 'near' ? .7 : item.id === 'far' ? 1.6 : 1;
    $('orbitRadiusRange').value = String(state.orbitRadius);
  } else if (state.lesson === 'light') {
    state.lightAngle = item.id === 'gentle' ? 20 : item.id === 'wide' ? 60 : 40;
    $('lightAngleRange').value = String(state.lightAngle);
  } else if (state.lesson === 'circuit') {
    state.circuitClosed = item.id !== 'open';
    state.circuitVoltage = item.id === 'bright' ? 9 : 4.5;
    $('voltageRange').value = String(state.circuitVoltage);
    updateChoices('circuit', state.circuitClosed ? 'closed' : 'open');
  } else if (state.lesson === 'mechanics') {
    state.mechanicsMode=item.id==='pulley'?'pulley':'lever';
    state.pulleyType=item.id==='pulley'?'moving':'fixed';
    state.effortArmMeters=item.id==='long'?4:item.id==='short'?1:2;
    $('effortArmRange').value=String(state.effortArmMeters);
    updateChoices('mechanics-mode',state.mechanicsMode);
    updateChoices('pulley',state.pulleyType);
    $('leverArmControl').hidden=state.mechanicsMode!=='lever';
    $('pulleyTypeControl').hidden=state.mechanicsMode!=='pulley';
  } else if (state.lesson === 'magnet') {
    state.magnetMaterial=item.id==='wood'?'wood':'iron';
    state.magnetDistance=item.id==='far'?5:1;
    $('magnetDistanceRange').value=String(state.magnetDistance);
    updateChoices('material',state.magnetMaterial);
  } else if (state.lesson === 'sound') {
    state.soundFrequency=item.id==='low'?170:item.id==='high'?680:340;
    state.soundVolume=item.id==='loud'?5:3;
    $('soundFrequencyRange').value=String(state.soundFrequency);
    $('soundVolumeRange').value=String(state.soundVolume);
  } else if(EVERYDAY_IDS.includes(state.lesson)){
    const [mode,a,b]=everydayStoryPresets[state.lesson][item.id];
    state.extraMode=mode;state.extraA=a;state.extraB=b;
    $('extraARange').value=String(a);
    if(everydayConfigs[state.lesson].b)$('extraBRange').value=String(b);
    updateChoices('extraMode',mode);
  }
  $('storyTaps').querySelectorAll('[data-story]').forEach(button => {
    const active = button.dataset.story === item.id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  resetSimulation(false);
  state.status = state.lesson === 'circuit' && !state.circuitClosed ? 'idle' : 'running';
  setRunLabel(state.status === 'running' ? '일시정지' : state.lesson === 'circuit' ? '전류 흐름 보기' : '실험 시작');
  showStatus(item.status);
  if (mobilePortrait.matches && lab.dataset.mobilePane === 'story') setMobileSheet(false);
}

function readCompleted() {
  try {
    const value = JSON.parse(localStorage.getItem('gomyfox-physics-discoveries-v02') || '[]');
    return Array.isArray(value) ? value.filter(x => LESSON_IDS.includes(x)) : [];
  } catch (_) { return []; }
}

function updateBookProgress() {
  const completed = new Set(readCompleted());
  $('bookProgress').textContent = `${completed.size} / ${LESSON_IDS.length} 발견`;
  LESSON_IDS.forEach(lesson => {
    const stamp = $(`${lesson}Stamp`);
    stamp.textContent = completed.has(lesson) ? '✓ 발견 완료' : '아직 발견 전';
    stamp.classList.toggle('earned', completed.has(lesson));
  });
}

function openQuiz() {
  const data = questionBank[state.lesson];
  $('quizQuestion').textContent = data.question;
  $('quizAnswers').replaceChildren();
  $('quizFeedback').textContent = '정답을 골라 주세요!';
  $('quizFeedback').className = 'quiz-feedback';
  $('quizDone').hidden = true;
  data.answers.forEach((answer, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-answer';
    button.textContent = `${index + 1}. ${answer}`;
    button.addEventListener('click', () => {
      if (index === data.correct) {
        $('quizFeedback').textContent = data.explanation;
        $('quizFeedback').className = 'quiz-feedback correct';
        $('quizDone').hidden = false;
        $('quizAnswers').querySelectorAll('button').forEach(b => { b.disabled = true; });
        button.classList.add('correct');
        const discovered = new Set(readCompleted());
        discovered.add(state.lesson);
        try { localStorage.setItem('gomyfox-physics-discoveries-v02', JSON.stringify([...discovered])); } catch (_) { /* Browser storage optional */ }
        updateBookProgress();
      } else {
        button.classList.add('incorrect');
        button.disabled = true;
        $('quizFeedback').textContent = '아쉽지만 한 번 더 생각해 봐요! 교과서 문장을 눌러 실험을 비교해 보세요.';
        $('quizFeedback').className = 'quiz-feedback';
      }
    });
    $('quizAnswers').append(button);
  });
  const dialog = $('quizDialog');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open','');
}

function closeQuiz() {
  const dialog = $('quizDialog');
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

$('enterBtn').addEventListener('click', openBook);
$('bookBackBtn').addEventListener('click', () => { book.hidden = true; home.hidden = false; });
document.querySelectorAll('[data-lesson]').forEach(button => button.addEventListener('click', () => openLab(button.dataset.lesson)));
$('backBtn').addEventListener('click', closeLab);
$('heightRange').addEventListener('input', event => {
  state.height = Number(event.target.value);
  resetSimulation(false);
  showStatus(`낙하 높이를 ${state.height}m로 바꿨어요.`);
});
$('orbitRadiusRange').addEventListener('input', event => {
  state.orbitRadius = Number(event.target.value);
  $('storyTaps').querySelectorAll('[data-story]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  resetSimulation(false);
  showStatus(`행성 거리를 ${state.orbitRadius.toFixed(1)} AU로 바꿨어요. 공전 주기를 확인해 보세요!`);
});
$('lightAngleRange').addEventListener('input', event => {
  state.lightAngle = Number(event.target.value);
  $('storyTaps').querySelectorAll('[data-story]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  resetSimulation(false);
  showStatus(`입사각을 ${state.lightAngle}°로 바꿨어요. 거울에서 반사되는 방향을 관찰해 보세요!`);
});

function setCircuitClosed(closed) {
  state.circuitClosed = closed;
  state.circuitProgress = 0;
  state.status = closed ? 'running' : 'idle';
  setRunLabel(closed ? '일시정지' : '전류 흐름 보기');
  updateChoices('circuit', closed ? 'closed' : 'open');
  $('storyTaps').querySelectorAll('[data-story]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  updateReadouts();
  renderScene();
  showStatus(closed ? '딸깍! 전류가 흘러 전구가 빛나요. 전압과 저항을 바꿔 보세요!' : '딸깍! 회로가 끊겨 전구가 꺼졌어요. 전류는 0 A예요.');
}
$('circuitSceneSwitch').addEventListener('click', () => setCircuitClosed(!state.circuitClosed));
document.querySelectorAll('[data-circuit]').forEach(button => button.addEventListener('click', () => setCircuitClosed(button.dataset.circuit === 'closed')));
$('voltageRange').addEventListener('input', event => {
  state.circuitVoltage = Number(event.target.value);
  updateReadouts(); renderScene();
  showStatus(`전압 ${state.circuitVoltage.toFixed(1)} V! ${state.circuitClosed ? '전류와 전구 밝기의 변화를 관찰해 보세요.' : '지금은 스위치가 열려 전류가 흐르지 않아요.'}`);
});
$('resistanceRange').addEventListener('input', event => {
  state.circuitResistance = Number(event.target.value);
  updateReadouts(); renderScene();
  showStatus(`저항 ${state.circuitResistance} Ω! ${state.circuitClosed ? '저항이 커지면 전류가 줄어드는지 살펴보세요.' : '스위치를 닫아 전류를 흐르게 해보세요.'}`);
});

function refreshMechanics(message) {
  resetSimulation(false);
  updateChoices('mechanics-mode',state.mechanicsMode);
  updateChoices('pulley',state.pulleyType);
  $('leverArmControl').hidden=state.mechanicsMode!=='lever';
  $('pulleyTypeControl').hidden=state.mechanicsMode!=='pulley';
  $('storyTaps').querySelectorAll('[data-story]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
  engine?.resetCamera();
  showStatus(message);
}
document.querySelectorAll('[data-mechanics-mode]').forEach(b=>b.addEventListener('click',()=>{
  state.mechanicsMode=b.dataset.mechanicsMode;
  refreshMechanics(state.mechanicsMode==='lever'?'받침점을 기준으로 지레 양쪽 길이를 비교해 보세요!':'고정·움직도르래를 바꿔 필요한 힘과 줄의 길이를 비교해 보세요!');
}));
document.querySelectorAll('[data-pulley]').forEach(b=>b.addEventListener('click',()=>{
  state.pulleyType=b.dataset.pulley;
  refreshMechanics(state.pulleyType==='fixed'?'고정도르래는 힘의 방향을 바꾸지만 필요한 힘의 크기는 그대로예요.':'움직도르래는 두 줄이 무게를 나눠 지탱해요. 줄을 더 길게 당겨야 해요!');
}));
$('loadRange').addEventListener('input',e=>{
  state.loadNewtons=Number(e.target.value);
  refreshMechanics(`물체의 무게를 ${state.loadNewtons}N으로 바꿨어요. 필요한 힘을 확인해 보세요!`);
});
$('effortArmRange').addEventListener('input',e=>{
  state.effortArmMeters=Number(e.target.value);
  refreshMechanics(`지레 힘점 거리를 ${state.effortArmMeters}m로 바꿨어요. 힘이 얼마나 달라질까요?`);
});

function refreshDiscovery(message) {
  resetSimulation(false);
  updateChoices('material',state.magnetMaterial);
  $('storyTaps').querySelectorAll('[data-story]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
  showStatus(message);
}
document.querySelectorAll('[data-material]').forEach(b=>b.addEventListener('click',()=>{
  state.magnetMaterial=b.dataset.material;
  refreshDiscovery(state.magnetMaterial==='iron'?'철구는 자석에 끌려와요! 시작 버튼을 눌러 보세요.':'나무 구슬은 자석에 거의 끌려오지 않아요.');
}));
$('magnetDistanceRange').addEventListener('input',e=>{
  state.magnetDistance=Number(e.target.value);
  refreshDiscovery(`거리를 ${state.magnetDistance}cm로 바꿨어요. 구슬이 얼마나 움직일까요?`);
});
$('magnetStrengthRange').addEventListener('input',e=>{
  state.magnetStrength=Number(e.target.value);
  refreshDiscovery(`자석의 놀이 단계를 ${state.magnetStrength}로 바꿨어요.`);
});
$('soundFrequencyRange').addEventListener('input',e=>{
  state.soundFrequency=Number(e.target.value);
  refreshDiscovery(`${state.soundFrequency}Hz로 바꿨어요! 물결의 간격을 봐요.`);
});
$('soundVolumeRange').addEventListener('input',e=>{
  state.soundVolume=Number(e.target.value);
  refreshDiscovery(`진폭 놀이 단계를 ${state.soundVolume}로 바꿨어요!`);
});
for(const [letter,elementId] of [['A','extraARange'],['B','extraBRange']]){
  $(elementId).addEventListener('input',e=>{
    if(!EVERYDAY_IDS.includes(state.lesson))return;
    state[`extra${letter}`]=Number(e.target.value);
    refreshEveryday(`${everydayConfigs[state.lesson][letter.toLowerCase()].label}을(를) 바꿨어요! 결과를 확인해 봐요.`);
  });
}
let shortSoundContext=null;
$('hearSoundBtn').addEventListener('click',()=>{
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor){showStatus('이 브라우저는 소리 재생을 지원하지 않아요. 움직이는 물결로 비교해 보세요!');return;}
  try {
    shortSoundContext ||= new AudioCtor();
    shortSoundContext.resume();
    const oscillator=shortSoundContext.createOscillator();
    const gain=shortSoundContext.createGain();
    oscillator.type='sine';oscillator.frequency.value=state.soundFrequency;
    const now=shortSoundContext.currentTime;
    const peak=.025+state.soundVolume*.008;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(peak,now+.035);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.42);
    oscillator.connect(gain);gain.connect(shortSoundContext.destination);
    oscillator.start(now);oscillator.stop(now+.44);
    showStatus(`띵~ ${state.soundFrequency}Hz 소리를 들어봤어요! 소리의 높이를 바꿔 또 눌러 보세요.`);
  } catch (_) {showStatus('소리 재생이 제한됐어요. 화면의 물결은 계속 체험할 수 있어요.');}
});

document.querySelectorAll('[data-planet]').forEach(button => button.addEventListener('click', () => {
  const planet = button.dataset.planet;
  if (state.planet === planet) return;
  if (state.planet === 'earth') state.earthAir = state.air;
  state.planet = planet;
  state.air = planet === 'moon' ? false : state.earthAir;
  document.querySelector('[data-air="on"]').disabled = planet === 'moon';
  updateChoices('planet', planet);
  updateChoices('air', state.air ? 'on' : 'off');
  resetSimulation(false);
  updateReadouts();
  showStatus(planet === 'moon' ? '달은 지구보다 중력이 약해요. 진공 상태로 실험합니다.' : '지구로 돌아왔어요. 실험을 시작해 보세요.');
}));

document.querySelectorAll('[data-air]').forEach(button => button.addEventListener('click', () => {
  if (state.planet === 'moon') return;
  state.air = button.dataset.air === 'on';
  state.earthAir = state.air;
  updateChoices('air', state.air ? 'on' : 'off');
  resetSimulation(false);
  showStatus(state.air ? '공기가 있는 환경으로 바꿨어요.' : '진공으로 바꿨어요. 두 물체를 함께 떨어뜨려 보세요!');
  updateReadouts();
}));

document.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => {
  state.speed = Number(button.dataset.speed);
  updateChoices('speed', String(state.speed));
  showStatus(`실험 재생 속도를 ${state.speed}배로 바꿨어요.`);
}));

$('runBtn').addEventListener('click', () => {
  if (state.lesson === 'circuit' && !state.circuitClosed) {
    showStatus('전류의 길이 끊겨 있어요! 화면의 스위치를 눌러 회로를 연결해 보세요.');
    return;
  }
  if (state.status === 'done') resetSimulation(false);
  if (state.status === 'running') {
    state.status = 'paused';
    setRunLabel('계속하기');
    showStatus(state.lesson === 'gravity' ? '일시정지했어요. 물체의 높이를 관찰해 보세요.' :
      state.lesson === 'orbit' ? '일시정지했어요. 행성의 위치를 관찰해 보세요.' :
      state.lesson === 'light' ? '일시정지했어요. 빛의 진행 방향을 관찰해 보세요.' :
      state.lesson === 'mechanics' ? '일시정지했어요. 물체와 도구의 위치를 관찰해 보세요.' :
      state.lesson === 'magnet' ? '잠깐 멈췄어요! 자석과 구슬 사이를 살펴보세요.' :
      state.lesson === 'sound' ? '잠깐 멈췄어요! 북에서 퍼지던 물결을 살펴보세요.' :
      EVERYDAY_IDS.includes(state.lesson) ? '잠깐 멈췄어요! 그림 속 움직임과 결과를 비교해 보세요.' :
      '전류 알갱이 연출만 잠시 멈췄어요. 닫힌 회로의 전구는 계속 켜져 있어요.');
  } else {
    state.status = 'running';
    setRunLabel('일시정지');
    showStatus(state.lesson === 'gravity' ? '실험 중! 두 물체가 내려가는 모습을 비교해 보세요.' :
      state.lesson === 'orbit' ? '실험 중! 행성이 태양을 도는 모습을 관찰해 보세요.' :
      state.lesson === 'light' ? '실험 중! 빛이 거울을 맞고 튕기는 방향을 보세요.' :
      state.lesson === 'mechanics' ? '실험 중! 힘점과 물체가 얼마나 움직이는지 비교해 보세요.' :
      state.lesson === 'magnet' ? '쏙~ 구슬이 자석에 끌려오는지 봐요!' :
      state.lesson === 'sound' ? '통통~ 소리가 퍼져 나가는 물결을 봐요!' :
      EVERYDAY_IDS.includes(state.lesson) ? '반짝반짝! 그림과 결과가 달라지는 모습을 살펴보세요!' :
      '실험 중! 전류가 흐르는 길과 전구의 빛을 살펴보세요.');
  }
});

$('resetBtn').addEventListener('click', () => {
  if (state.lesson === 'circuit') {
    state.circuitVoltage = 4.5; state.circuitResistance = 6; state.circuitClosed = false;
    $('voltageRange').value = '4.5'; $('resistanceRange').value = '6';
    updateChoices('circuit','open');
  } else if(state.lesson==='mechanics') {
    state.mechanicsMode='lever';state.loadNewtons=120;state.effortArmMeters=2;state.pulleyType='fixed';
    $('loadRange').value='120';$('effortArmRange').value='2';
    updateChoices('mechanics-mode','lever');updateChoices('pulley','fixed');
    $('leverArmControl').hidden=false;$('pulleyTypeControl').hidden=true;
  } else if(state.lesson==='magnet') {
    state.magnetMaterial='iron';state.magnetDistance=2;state.magnetStrength=3;
    $('magnetDistanceRange').value='2';$('magnetStrengthRange').value='3';
    updateChoices('material','iron');
  } else if(state.lesson==='sound') {
    state.soundFrequency=340;state.soundVolume=3;
    $('soundFrequencyRange').value='340';$('soundVolumeRange').value='3';
  }else if(EVERYDAY_IDS.includes(state.lesson)){
    const config=everydayConfigs[state.lesson];
    state.extraMode=config.mode;state.extraA=config.a.value;state.extraB=config.b?.value??0;
    $('extraARange').value=String(state.extraA);
    if(config.b)$('extraBRange').value=String(state.extraB);
    updateChoices('extraMode',state.extraMode);
  }
  resetSimulation();
});
$('cameraBtn').addEventListener('click', () => engine?.resetCamera());
$('liteBtn').addEventListener('click', () => {
  if(!engine && forcedLite){
    forcedLite=false;
    $('liteCanvas').hidden=true;$('sceneCanvas').hidden=false;
    $('renderMode').textContent='3D 준비 중';
    $('liteBtn').disabled=true;
    initializeScene();
    return;
  }
  if (!engine) return;
  forcedLite = !forcedLite;
  if (forcedLite && !liteContext) liteContext = $('liteCanvas').getContext('2d');
  $('liteCanvas').hidden = !forcedLite;
  $('sceneCanvas').hidden = forcedLite;
  $('cameraBtn').disabled = forcedLite;
  $('liteBtn').removeAttribute('aria-pressed');
  $('liteBtn').textContent = forcedLite ? '3D로 보기' : '2D 경량모드';
  $('renderMode').textContent = forcedLite ? '2D 경량 실험' : '3D 실험';
  $('sceneInstruction').textContent = forcedLite ? '가벼운 2D 화면으로 실험 중이에요' : '손가락으로 드래그해 관찰해 보세요';
  showStatus(forcedLite ? '경량 모드로 바꿨어요. 계산 결과는 3D와 같아요.' : '3D 관찰 모드로 돌아왔어요!');
});
$('quizBtn').addEventListener('click', openQuiz);
$('quizClose').addEventListener('click', closeQuiz);
$('quizDone').addEventListener('click', () => { closeQuiz(); closeLab(); });
$('quizDialog').addEventListener('click', event => { if (event.target === $('quizDialog')) closeQuiz(); });
function showExplanation() { if (typeof helpDialog.showModal === 'function') helpDialog.showModal(); else helpDialog.setAttribute('open', ''); }
function closeExplanation() { if (typeof helpDialog.close === 'function') helpDialog.close(); else helpDialog.removeAttribute('open'); }
$('helpBtn').addEventListener('click', showExplanation);
$('explainBtn').addEventListener('click', showExplanation);
$('mobileExplainBtn').addEventListener('click', showExplanation);
$('mobileStoryBtn').addEventListener('click', () => setMobilePane('story'));
$('mobileControlsBtn').addEventListener('click', () => setMobilePane('controls'));
let sheetSwipeOrigin = null;
let skipSheetClickUntil = 0;
$('mobileSheetToggle').addEventListener('pointerdown', event => { sheetSwipeOrigin = event.clientY; });
$('mobileSheetToggle').addEventListener('pointerup', event => {
  if (sheetSwipeOrigin === null) return;
  const distance = event.clientY - sheetSwipeOrigin;
  sheetSwipeOrigin = null;
  if (Math.abs(distance) >= 28) {
    setMobileSheet(distance < 0);
    skipSheetClickUntil = Date.now() + 450;
  }
});
$('mobileSheetToggle').addEventListener('pointercancel', () => { sheetSwipeOrigin = null; });
$('mobileSheetToggle').addEventListener('click', () => {
  if (Date.now() < skipSheetClickUntil) return;
  setMobileSheet(lab.dataset.mobileSheet !== 'open');
});
$('mobileAdvancedBtn').addEventListener('click', () => {
  const detailed = lab.dataset.mobileDetail !== 'advanced';
  lab.dataset.mobileDetail = detailed ? 'advanced' : 'simple';
  $('mobileAdvancedBtn').setAttribute('aria-expanded', String(detailed));
  $('mobileAdvancedBtn').textContent = detailed ? '간단히 보기' : '자세히 조작하기';
});
$('mobileRunBtn').addEventListener('click', () => {
  $('runBtn').click();
  if (state.lesson === 'circuit' && !state.circuitClosed) {
    setMobilePane('controls');
  } else {
    setMobileSheet(false);
  }
});
new MutationObserver(syncMobileRun).observe($('runBtn'), { childList: true, characterData: true, subtree: true });
mobilePortrait.addEventListener('change', syncMobileLayout);
syncMobileLayout();
syncMobileRun();
$('closeDialog').addEventListener('click', closeExplanation);
$('dialogOk').addEventListener('click', closeExplanation);
helpDialog.addEventListener('click', event => { if (event.target === helpDialog) closeExplanation(); });

async function initializeScene() {
  initialized = true;
  try {
    const THREE = await import('./three.module.js');
    engine = create3DScene(THREE);
    engine.resize();
    if (EVERYDAY_IDS.includes(state.lesson)) return;
    $('liteBtn').disabled=false;
    $('sceneFallback').hidden=true;
    $('renderMode').textContent='3D 실험';
    $('liteBtn').textContent='2D 경량모드';
    $('cameraBtn').disabled=false;
    showStatus('3D 실험 준비 완료! 책 속 문장을 눌러 움직여 보세요.');
  } catch (error) {
    console.warn('3D not available. Using 2D fallback.', error);
    fallbackContext = canvas.getContext('2d');
    if (EVERYDAY_IDS.includes(state.lesson)) return;
    $('sceneFallback').hidden = false;
    $('renderMode').textContent = '2D 실험';
    $('sceneInstruction').textContent = '2D 움직임으로 비교해 보세요';
    $('liteBtn').disabled = true;
    $('liteBtn').textContent = '2D 모드';
    $('cameraBtn').disabled = true;
    showStatus(state.lesson === 'gravity' ? '2D 모드에서도 낙하 계산을 체험할 수 있어요.' :
      state.lesson === 'orbit' ? '2D 모드에서도 행성의 공전과 주기를 비교할 수 있어요.' :
      state.lesson === 'light' ? '2D 모드에서도 빛이 반사되는 경로를 볼 수 있어요.' :
      state.lesson === 'mechanics' ? '2D 모드에서도 지레와 도르래의 필요한 힘을 비교할 수 있어요.' :
      state.lesson === 'magnet' ? '2D 모드에서도 자석과 구슬을 바꿔 볼 수 있어요.' :
      state.lesson === 'sound' ? '2D 모드에서도 움직이는 소리 파장을 볼 수 있어요.' : '2D 모드에서도 스위치를 켜고 전류를 비교할 수 있어요.');
  }
}

function create3DScene(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(41, 1, 0.1, 100);
  const ambient = new THREE.AmbientLight(0xc5e3ff, 1.7); scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe2ad, 3.0); sun.position.set(-3, 8, 5); scene.add(sun);
  const rim = new THREE.PointLight(0x39d7db, 50, 20); rim.position.set(2, 4, -3); scene.add(rim);
  const gravityGroup = new THREE.Group(); scene.add(gravityGroup);
  const orbitGroup = new THREE.Group(); scene.add(orbitGroup);
  const lightGroup = new THREE.Group(); scene.add(lightGroup);
  const circuitGroup = new THREE.Group(); scene.add(circuitGroup);
  const mechanicsGroup = new THREE.Group();scene.add(mechanicsGroup);
  const magnetGroup = new THREE.Group();scene.add(magnetGroup);
  const soundGroup = new THREE.Group();scene.add(soundGroup);

  // Reuse the existing illustrated 2x2 material atlas on small real 3D stages.
  // Atlas decoding is asynchronous; a neutral fallback remains until it loads.
  const stageMaterials=[];
  const addStageMaterial=(mesh,name)=>stageMaterials.push({mesh,name});
  function applyIllustratedStageMaterials(){
    const art=surfaceMaterialArtwork;
    if(!art.complete||!art.naturalWidth||!art.naturalHeight)return;
    const textures=new Map();
    for(const {mesh,name} of stageMaterials){
      if(!textures.has(name)){
        const crop=surfaceTextureBounds(art.naturalWidth,art.naturalHeight,name);
        const illustration=document.createElement('canvas');
        illustration.width=illustration.height=256;
        illustration.getContext('2d').drawImage(art,crop.sx,crop.sy,crop.sw,crop.sh,0,0,256,256);
        const texture=new THREE.CanvasTexture(illustration);
        texture.colorSpace=THREE.SRGBColorSpace;
        texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
        textures.set(name,texture);
      }
      const material=mesh.material;
      material.map=textures.get(name);
      material.color.set(0xffffff);
      if('metalness' in material)material.metalness=.07;
      if('roughness' in material)material.roughness=.86;
      material.opacity=1;
      material.transparent=false;
      material.needsUpdate=true;
    }
  }

  const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.85, .38, 64), new THREE.MeshStandardMaterial({ color: 0x1d5472, metalness: .55, roughness: .35 }));
  platform.position.y = .35; gravityGroup.add(platform);
  const platformFace = new THREE.Mesh(new THREE.CylinderGeometry(3.63, 3.63, .03, 64), new THREE.MeshBasicMaterial({ color: 0x2fc5bf, transparent: true, opacity: .42 }));
  platformFace.position.y = .56; gravityGroup.add(platformFace);addStageMaterial(platformFace,'soil');
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.52, .038, 8, 90), new THREE.MeshBasicMaterial({ color: 0x9be9d2 }));
  ring.position.y = .58; ring.rotation.x = Math.PI / 2; gravityGroup.add(ring);
  const grid = new THREE.GridHelper(6.7, 12, 0x2bc9c2, 0x20556b); grid.position.y = .592; gravityGroup.add(grid);

  // Soft floor contact: distinct shadows stay fixed on the soil while objects fall.
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
  const shadowContext=contactCanvas.getContext('2d');
  const fade=shadowContext.createRadialGradient(64,64,2,64,64,62);
  fade.addColorStop(0,'rgba(7,13,24,.76)');fade.addColorStop(.45,'rgba(7,13,24,.35)');fade.addColorStop(1,'rgba(7,13,24,0)');
  shadowContext.fillStyle=fade;shadowContext.fillRect(0,0,128,128);
  const contactTexture=new THREE.CanvasTexture(contactCanvas);
  const createContactShadow=x=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.605,0);gravityGroup.add(mesh);return mesh;
  };
  const ballContactShadow=createContactShadow(-1.28),featherContactShadow=createContactShadow(1.28);

  const ball = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(.41, 32, 22), new THREE.MeshStandardMaterial({ color: 0xbdc9db, metalness: .83, roughness: .20 }));
  sphere.position.set(0,0,0); ball.add(sphere);
  const highlight = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 }));
  highlight.position.set(-.14,.22,.32); ball.add(highlight);
  gravityGroup.add(ball);

  const feather = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.025,.022,1.02,8), new THREE.MeshStandardMaterial({ color: 0xffe1b5, roughness: .75 }));
  feather.add(shaft);
  const featherMatA = new THREE.MeshStandardMaterial({ color: 0xb2f9e1, side: THREE.DoubleSide, transparent: true, opacity: .96, roughness: .8 });
  const featherMatB = new THREE.MeshStandardMaterial({ color: 0x7ccdcc, side: THREE.DoubleSide, transparent: true, opacity: .96, roughness: .8 });
  for (let i = 0; i < 15; i++) {
    const y0 = -.42 + i * .063;
    const y1 = y0 + .10;
    const width = .40 * Math.pow(Math.sin((i + 1) / 16 * Math.PI), .65);
    for (const side of [-1, 1]) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0,y0,0,side*width,y0+.055,side*.025,0,y1,0],3));
      geo.computeVertexNormals();
      feather.add(new THREE.Mesh(geo, i % 3 ? featherMatA : featherMatB));
    }
  }
  feather.rotation.z = -.24;
  feather.scale.setScalar(1.15);
  gravityGroup.add(feather);

  // A second genuinely three-dimensional chapter: a simplified, circular Sun-centred system.
  const sunBody = new THREE.Mesh(new THREE.SphereGeometry(.68,32,24),new THREE.MeshStandardMaterial({color:0xffc45e,emissive:0xff8f1a,emissiveIntensity:1.2,roughness:.85}));
  sunBody.position.y=.9;orbitGroup.add(sunBody);
  const sunCorona = new THREE.Mesh(new THREE.SphereGeometry(.85,24,16),new THREE.MeshBasicMaterial({color:0xffca55,transparent:true,opacity:.11,side:THREE.BackSide}));
  sunCorona.position.y=.9;orbitGroup.add(sunCorona);
  const sunLamp = new THREE.PointLight(0xffcc74,34,15);sunLamp.position.y=.9;orbitGroup.add(sunLamp);
  const orbitMaterial = new THREE.MeshBasicMaterial({color:0x8dd9ee,transparent:true,opacity:.39});
  const earthOrbit = new THREE.Mesh(new THREE.TorusGeometry(2.1,.012,6,96),orbitMaterial);
  earthOrbit.position.y=.9;earthOrbit.rotation.x=Math.PI/2;orbitGroup.add(earthOrbit);
  const probeOrbit = new THREE.Mesh(new THREE.TorusGeometry(1,.017,6,96),new THREE.MeshBasicMaterial({color:0xf4baf0,transparent:true,opacity:.75}));
  probeOrbit.position.y=.91;probeOrbit.rotation.x=Math.PI/2;orbitGroup.add(probeOrbit);
  const earthBody = new THREE.Mesh(new THREE.SphereGeometry(.24,20,16),new THREE.MeshStandardMaterial({color:0x398dec,emissive:0x0b367c,roughness:.65}));
  orbitGroup.add(earthBody);
  const probeBody = new THREE.Mesh(new THREE.SphereGeometry(.32,24,18),new THREE.MeshStandardMaterial({color:0xe4a0f6,emissive:0x6c2b90,emissiveIntensity:.19,roughness:.48,metalness:.1}));
  orbitGroup.add(probeBody);
  const probeHalo = new THREE.Mesh(new THREE.TorusGeometry(.4,.035,6,42),new THREE.MeshBasicMaterial({color:0xffd3f5}));
  probeHalo.rotation.x=Math.PI/2;probeBody.add(probeHalo);
  const orbitDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.9,3.9,.07,64),new THREE.MeshBasicMaterial({color:0x164057,transparent:true,opacity:.21}));
  orbitDisc.position.y=.43;orbitGroup.add(orbitDisc);

  // Pop-up mirror display. Rays travel in the x-z plane, reflect off z=0.
  // This chapter uses true 3D meshes but intentionally slows light for learning.
  const mirrorBack = new THREE.Mesh(new THREE.BoxGeometry(6.5,3.35,.18),new THREE.MeshStandardMaterial({color:0x7963af,metalness:.78,roughness:.34}));
  mirrorBack.position.set(0,2.27,-.12);lightGroup.add(mirrorBack);
  const mirrorFace = new THREE.Mesh(new THREE.PlaneGeometry(6.24,3.1),new THREE.MeshStandardMaterial({color:0x80c1d3,metalness:.81,roughness:.12,transparent:true,opacity:.91,side:THREE.DoubleSide}));
  mirrorFace.position.set(0,2.27,.005);lightGroup.add(mirrorFace);
  const mirrorBase = new THREE.Mesh(new THREE.CylinderGeometry(3.85,4,.26,56),new THREE.MeshStandardMaterial({color:0x283f64,metalness:.43,roughness:.54}));
  mirrorBase.position.set(0,.35,.7);lightGroup.add(mirrorBase);addStageMaterial(mirrorBase,'wood');
  const mirrorBaseRing = new THREE.Mesh(new THREE.TorusGeometry(3.7,.035,7,80),new THREE.MeshBasicMaterial({color:0x86e8ed}));
  mirrorBaseRing.rotation.x=Math.PI/2;mirrorBaseRing.position.set(0,.52,.7);lightGroup.add(mirrorBaseRing);
  for(let i=0;i<8;i++){
    const dash=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.22,6),new THREE.MeshBasicMaterial({color:0xc9fcf1,transparent:true,opacity:.62}));
    dash.rotation.x=Math.PI/2;dash.position.set(0,2.32,.36+i*.42);lightGroup.add(dash);
  }
  const makeBeam=(color,radius,opacity)=>new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity}));
  const incomingGhost=makeBeam(0xfad0a0,.021,.34),outgoingGhost=makeBeam(0xb0fff6,.021,.34);
  const incomingLight=makeBeam(0xffd38a,.051,.97),outgoingLight=makeBeam(0x89ffeb,.051,.97);
  lightGroup.add(incomingGhost,outgoingGhost,incomingLight,outgoingLight);
  const spark=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshBasicMaterial({color:0xfffae7}));lightGroup.add(spark);
  const mirrorHit=new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),new THREE.MeshBasicMaterial({color:0xfff8c2,transparent:true,opacity:.75}));
  mirrorHit.position.set(0,2.31,.13);lightGroup.add(mirrorHit);
  const lightOrigin=new THREE.Mesh(new THREE.SphereGeometry(.23,18,12),new THREE.MeshStandardMaterial({color:0xf3b962,emissive:0xe18436,emissiveIntensity:.37}));lightGroup.add(lightOrigin);
  let lastLightAngle=null;
  const up=new THREE.Vector3(0,1,0);
  function alignBeam(mesh,start,end){
    const vector=new THREE.Vector3().subVectors(end,start);
    const length=vector.length();
    mesh.visible=length>.001;
    if(!mesh.visible)return;
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.scale.y=length;
    mesh.quaternion.setFromUnitVectors(up,vector.normalize());
  }
  function renderLight(s){
    const path=mirrorLightPath(s.lightAngle,4.1);
    const origin=new THREE.Vector3(path.source.x,2.31,path.source.z+.13);
    const hit=new THREE.Vector3(0,2.31,.13);
    const target=new THREE.Vector3(path.target.x,2.31,path.target.z+.13);
    if(lastLightAngle!==s.lightAngle){
      alignBeam(incomingGhost,origin,hit);alignBeam(outgoingGhost,hit,target);
      lightOrigin.position.copy(origin);
      lastLightAngle=s.lightAngle;
    }
    const p=s.lightProgress;
    const incidentFraction=Math.min(1,p*2),reflectionFraction=Math.max(0,Math.min(1,(p-.5)*2));
    const firstEnd=origin.clone().lerp(hit,incidentFraction);
    const secondEnd=hit.clone().lerp(target,reflectionFraction);
    alignBeam(incomingLight,origin,firstEnd);
    alignBeam(outgoingLight,hit,secondEnd);
    spark.position.copy(p<.5?firstEnd:secondEnd);
    spark.visible=p>0 && p<1;
    mirrorHit.scale.setScalar(1+(Math.max(0,1-Math.abs(p-.5)*12)*1.5));
  }

  // A lightweight 3D circuit board: a single series loop with an opening switch.
  const board = new THREE.Mesh(new THREE.BoxGeometry(6.65,.3,4.1),new THREE.MeshStandardMaterial({color:0x244667,metalness:.25,roughness:.5}));
  board.position.set(0,.54,0);circuitGroup.add(board);
  const boardTop = new THREE.Mesh(new THREE.BoxGeometry(6.45,.025,3.92),new THREE.MeshStandardMaterial({color:0x193d4b,metalness:.22,roughness:.52}));
  boardTop.position.y=.708;circuitGroup.add(boardTop);addStageMaterial(boardTop,'wood');
  const boardEdge = new THREE.Mesh(new THREE.BoxGeometry(6.8,.07,4.28),new THREE.MeshBasicMaterial({color:0x6ac9b9,transparent:true,opacity:.34}));
  boardEdge.position.y=.38;circuitGroup.add(boardEdge);
  const goldMaterial=new THREE.MeshStandardMaterial({color:0xe9b96d,metalness:.72,roughness:.25});
  const wireMaterial=new THREE.MeshStandardMaterial({color:0x5ad9c5,emissive:0x0c5143,emissiveIntensity:.38,metalness:.72,roughness:.25});
  const topWireMaterial=new THREE.MeshStandardMaterial({color:0xf18f82,emissive:0x73352d,emissiveIntensity:.38,metalness:.65,roughness:.22});
  const makeSegment=(from,to,radius,material,group=circuitGroup)=>{
    const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=end.clone().sub(start);
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),9),material);
    tube.position.copy(start).add(end).multiplyScalar(.5);
    tube.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    group.add(tube);return tube;
  };
  for(const [a,b,mat] of [
    [[-2.55,.86,-1.35],[-.35,.86,-1.35],topWireMaterial],
    [[.35,.86,-1.35],[2.55,.86,-1.35],topWireMaterial],
    [[2.55,.86,-1.35],[2.55,.86,1.35],wireMaterial],
    [[2.55,.86,1.35],[-2.55,.86,1.35],wireMaterial],
    [[-2.55,.86,1.35],[-2.55,.86,-1.35],wireMaterial]
  ])makeSegment(a,b,.052,mat);
  for(const x of [-.35,.35]){
    const contact=new THREE.Mesh(new THREE.SphereGeometry(.105,13,10),goldMaterial);
    contact.position.set(x,.9,-1.35);circuitGroup.add(contact);
  }
  const switchLever=new THREE.Group();switchLever.position.set(-.35,.95,-1.35);circuitGroup.add(switchLever);
  makeSegment([0,0,0],[.7,0,0],.06,goldMaterial,switchLever);
  const switchCap=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),new THREE.MeshStandardMaterial({color:0xe8d6bd,metalness:.45,roughness:.37}));
  switchCap.position.x=.7;switchLever.add(switchCap);

  const batteryCase=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.05,28),new THREE.MeshStandardMaterial({color:0xb98475,metalness:.38,roughness:.39}));
  batteryCase.position.set(-2.55,1.29,0);circuitGroup.add(batteryCase);
  const batteryStripe=new THREE.Mesh(new THREE.CylinderGeometry(.365,.365,.34,28),new THREE.MeshStandardMaterial({color:0xefd09e,metalness:.55,roughness:.3}));
  batteryStripe.position.set(-2.55,1.65,0);circuitGroup.add(batteryStripe);
  const batteryCap=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.09,20),goldMaterial);
  batteryCap.position.set(-2.55,1.88,0);circuitGroup.add(batteryCap);
  const baseBulb=new THREE.Mesh(new THREE.CylinderGeometry(.28,.31,.45,26),new THREE.MeshStandardMaterial({color:0x859aa6,metalness:.77,roughness:.23}));
  baseBulb.position.set(2.55,1.02,0);circuitGroup.add(baseBulb);
  const filamentMaterial=new THREE.MeshBasicMaterial({color:0xc0a784});
  for(const x of [-.13,.13])makeSegment([2.55+x,1.22,0],[2.55+x,1.75,0],.027,filamentMaterial);
  const filament=makeSegment([2.42,1.75,0],[2.68,1.75,0],.047,filamentMaterial);
  const bulbGlass=new THREE.Mesh(new THREE.SphereGeometry(.46,28,22),new THREE.MeshStandardMaterial({color:0xe5f7de,emissive:0xffdf8a,emissiveIntensity:0,metalness:0,roughness:.12,transparent:true,opacity:.4}));
  bulbGlass.position.set(2.55,1.65,0);circuitGroup.add(bulbGlass);
  const bulbGlow=new THREE.Mesh(new THREE.SphereGeometry(.69,22,18),new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:0,depthWrite:false,side:THREE.BackSide}));
  bulbGlow.position.copy(bulbGlass.position);circuitGroup.add(bulbGlow);
  const bulbLamp=new THREE.PointLight(0xffcc69,0,5);bulbLamp.position.set(2.55,1.69,0);circuitGroup.add(bulbLamp);
  const circuitCurrentDots=[];
  for(let i=0;i<14;i++){
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.076,8,6),new THREE.MeshBasicMaterial({color:0xc4ffee}));
    circuitGroup.add(dot);circuitCurrentDots.push(dot);
  }
  const pathPoints=[[-2.55,-1.35],[2.55,-1.35],[2.55,1.35],[-2.55,1.35],[-2.55,-1.35]];
  const pathLengths=[5.1,2.7,5.1,2.7];
  function pathAt(fraction){
    let d=((fraction%1)+1)%1*15.6;
    for(let i=0;i<4;i++){
      const segment=pathLengths[i];
      if(d<=segment||i===3){const p=pathPoints[i],q=pathPoints[i+1],t=d/segment;return [p[0]+(q[0]-p[0])*t,.95,p[1]+(q[1]-p[1])*t];}
      d-=segment;
    }
  }
  function renderCircuit(s){
    const data=circuitReadings(s.circuitVoltage,s.circuitResistance,s.circuitClosed);
    switchLever.rotation.z=s.circuitClosed?0:.84;
    bulbGlass.material.emissiveIntensity=data.brightness*2.1;
    bulbGlass.material.opacity=.35+data.brightness*.52;
    bulbGlow.material.opacity=data.brightness*.29;
    bulbLamp.intensity=data.brightness*9;
    filament.material.color.setHex(s.circuitClosed?0xffeab4:0xc0a784);
    circuitCurrentDots.forEach((dot,i)=>{
      dot.visible=s.circuitClosed&&s.status==='running';
      if(dot.visible)dot.position.set(...pathAt(s.circuitProgress+i/circuitCurrentDots.length));
    });
  }

  // Fifth chapter: procedural lever and pulley tableaux, no imported 3D models.
  const mechanicsFloor=new THREE.Mesh(new THREE.CylinderGeometry(3.75,3.85,.25,48),new THREE.MeshStandardMaterial({color:0x34586c,metalness:.38,roughness:.54}));
  mechanicsFloor.position.y=.25;mechanicsGroup.add(mechanicsFloor);addStageMaterial(mechanicsFloor,'wood');
  const leverScene=new THREE.Group(),pulleyScene=new THREE.Group();
  mechanicsGroup.add(leverScene,pulleyScene);
  const fulcrum=new THREE.Mesh(new THREE.ConeGeometry(.53,1.2,4),new THREE.MeshStandardMaterial({color:0xd3a16b,metalness:.36,roughness:.48}));
  fulcrum.position.y=.94;fulcrum.rotation.y=Math.PI/4;leverScene.add(fulcrum);
  const leverMat=new THREE.MeshStandardMaterial({color:0xf4c88a,metalness:.45,roughness:.32});
  const leverBeam=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,1,12),leverMat);leverScene.add(leverBeam);
  const leverLoad=new THREE.Mesh(new THREE.BoxGeometry(.75,.78,.7),new THREE.MeshStandardMaterial({color:0x63b8de,metalness:.37,roughness:.42}));leverScene.add(leverLoad);
  const leverLoadCap=new THREE.Mesh(new THREE.BoxGeometry(.82,.09,.76),new THREE.MeshBasicMaterial({color:0xc5f0f2}));leverLoadCap.position.y=.38;leverLoad.add(leverLoadCap);
  const leverGrip=new THREE.Mesh(new THREE.SphereGeometry(.23,18,12),new THREE.MeshStandardMaterial({color:0xffa98c,roughness:.37}));leverScene.add(leverGrip);
  const leverEffortArrow=new THREE.Mesh(new THREE.ConeGeometry(.22,.44,12),new THREE.MeshBasicMaterial({color:0xffb083}));leverScene.add(leverEffortArrow);

  const metal=new THREE.MeshStandardMaterial({color:0xb8d4db,metalness:.72,roughness:.26});
  const pulleyRopeMat=new THREE.MeshStandardMaterial({color:0xffd3a0,roughness:.8});
  const makeWheel=(parent,x,y)=>{
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.42,.09,9,40),metal);wheel.position.set(x,y,0);parent.add(wheel);
    const hub=new THREE.Mesh(new THREE.SphereGeometry(.14,12,10),new THREE.MeshBasicMaterial({color:0xf0c793}));hub.position.set(x,y,0);parent.add(hub);
    return wheel;
  };
  const upperBeam=new THREE.Mesh(new THREE.BoxGeometry(4.6,.23,.54),new THREE.MeshStandardMaterial({color:0x9ec3d0,metalness:.52,roughness:.32}));
  upperBeam.position.set(0,4.32,0);pulleyScene.add(upperBeam);
  const fixedWheel=makeWheel(pulleyScene,-.72,3.72);
  const extraWheel=makeWheel(pulleyScene,1.08,3.72);
  const movingWheel=makeWheel(pulleyScene,-.72,2.08);
  const pulleyLoad=new THREE.Mesh(new THREE.BoxGeometry(.72,.64,.67),new THREE.MeshStandardMaterial({color:0x71c9d7,roughness:.47,metalness:.25}));pulleyScene.add(pulleyLoad);
  const pulleyHandle=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),new THREE.MeshStandardMaterial({color:0xffae86,roughness:.5}));pulleyScene.add(pulleyHandle);
  const ropeMeshes=Array.from({length:5},()=>{const rope=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1,8),pulleyRopeMat);pulleyScene.add(rope);return rope;});
  const vec=(x,y,z=0)=>new THREE.Vector3(x,y,z);
  function renderMechanics(s){
    const isLever=s.mechanicsMode==='lever',p=s.mechanicsProgress;
    leverScene.visible=isLever;pulleyScene.visible=!isLever;
    if(isLever){
      const theta=-.13+p*.33, arm=.8*s.effortArmMeters;
      const left=vec(-arm,1.64-arm*Math.sin(theta)),right=vec(1.12,1.64+1.12*Math.sin(theta));
      alignBeam(leverBeam,left,right);
      leverLoad.position.copy(right).add(vec(0,.49,0));
      leverGrip.position.copy(left);leverEffortArrow.position.copy(left).add(vec(0,.56,0));leverEffortArrow.rotation.z=Math.PI;
    }else{
      const moving=s.pulleyType==='moving';
      extraWheel.visible=false;fixedWheel.position.x=moving?1.08:0;
      movingWheel.visible=moving;
      const loadY=1.05+p*.72,handleY=2.35-p*(moving?1.42:.72);
      pulleyLoad.position.set(moving?-.72:-.42,loadY,0);
      pulleyHandle.position.set(moving?1.5:.42,handleY,0);
      const routes=moving?[
        [vec(-1.2,4.15),vec(-1.2,2.08+p*.72)],
        [vec(-.3,2.08+p*.72),vec(.64,3.72)],
        [vec(1.50,3.72),vec(1.50,handleY)],
        [vec(-.72,1.65+p*.72),vec(-.72,loadY+.34)]
      ]:[
        [vec(-.42,3.72),vec(-.42,loadY+.33)],
        [vec(.42,3.72),vec(.42,handleY)],
        [vec(-.42,3.72),vec(.42,3.72)]
      ];
      movingWheel.position.y=2.08+p*.72;
      ropeMeshes.forEach((rope,i)=>{rope.visible=i<routes.length;if(rope.visible)alignBeam(rope,...routes[i]);});
    }
  }

  // Friendly magnet toy: a simple U-shaped magnet and two material choices.
  const magnetBase=new THREE.Mesh(new THREE.CylinderGeometry(3.45,3.63,.27,48),new THREE.MeshStandardMaterial({color:0x745fa7,metalness:.2,roughness:.62}));
  magnetBase.position.y=.3;magnetGroup.add(magnetBase);addStageMaterial(magnetBase,'felt');
  const blueMat=new THREE.MeshStandardMaterial({color:0x4e97e5,metalness:.18,roughness:.4});
  const redMat=new THREE.MeshStandardMaterial({color:0xff7569,metalness:.18,roughness:.4});
  const redArc=new THREE.Mesh(new THREE.TorusGeometry(.9,.23,14,26,Math.PI/2),redMat);
  const blueArc=new THREE.Mesh(new THREE.TorusGeometry(.9,.23,14,26,Math.PI/2),blueMat);
  redArc.rotation.z=Math.PI;blueArc.rotation.z=Math.PI*1.5;
  for(const arc of [redArc,blueArc]){arc.position.set(-1.22,2.47,0);magnetGroup.add(arc);}
  for(const x of [-2.12,-.32]){
    const terminal=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.24,20),new THREE.MeshStandardMaterial({color:0xffdf9a,metalness:.67,roughness:.27}));
    terminal.rotation.z=Math.PI/2;terminal.position.set(x,2.47,0);magnetGroup.add(terminal);
  }
  const magnetBall=new THREE.Mesh(new THREE.SphereGeometry(.42,28,20),new THREE.MeshStandardMaterial({color:0xdceaf0,metalness:.74,roughness:.22}));magnetGroup.add(magnetBall);
  const woodBall=new THREE.Mesh(new THREE.SphereGeometry(.42,28,20),new THREE.MeshStandardMaterial({color:0xd3a26b,metalness:0,roughness:.83}));magnetGroup.add(woodBall);
  const magnetSparkles=[];
  for(let i=0;i<5;i++){
    const sparkle=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0xffeea5,transparent:true,opacity:.8}));
    magnetGroup.add(sparkle);magnetSparkles.push(sparkle);
  }
  function renderMagnet(s){
    const data=magnetReading(s.magnetMaterial,s.magnetDistance,s.magnetStrength);
    const p=s.discoveryProgress, moving=data.visualPull*p;
    magnetBall.visible=s.magnetMaterial==='iron';woodBall.visible=!magnetBall.visible;
    const marble=magnetBall.visible?magnetBall:woodBall;
    marble.position.set(1.7-mathClamp(moving,0,.96)*1.18+(s.magnetDistance-2)*.18,1.16+(data.attraction?Math.sin(p*Math.PI)*.12:0),0);
    marble.rotation.y=data.attraction?p*2:0;
    magnetSparkles.forEach((sparkle,i)=>{
      const active=data.attraction&&p>0;
      sparkle.visible=active;
      sparkle.position.set(-.1+i*.31,1.55+Math.sin(p*9+i)*.2,.35);
      sparkle.scale.setScalar(.75+Math.sin(p*10+i)*.22);
    });
  }
  function mathClamp(value,min,max){return Math.max(min,Math.min(max,value));}

  // Drum and animated sound fronts. Rings are a visualization, not literal air motion.
  const drumBase=new THREE.Mesh(new THREE.CylinderGeometry(3.45,3.63,.27,48),new THREE.MeshStandardMaterial({color:0x57a8ab,roughness:.57,metalness:.23}));
  drumBase.position.y=.3;soundGroup.add(drumBase);addStageMaterial(drumBase,'felt');
  const drum=new THREE.Mesh(new THREE.CylinderGeometry(1.02,.98,.86,36),new THREE.MeshStandardMaterial({color:0x5369b2,roughness:.54,metalness:.22}));
  drum.position.y=1.05;soundGroup.add(drum);
  const drumSkin=new THREE.Mesh(new THREE.CylinderGeometry(1.04,1.04,.045,36),new THREE.MeshStandardMaterial({color:0xffedd1,roughness:.78}));
  drumSkin.position.y=1.5;soundGroup.add(drumSkin);
  for(const yy of [.61,1.51]){
    const band=new THREE.Mesh(new THREE.TorusGeometry(1.02,.065,9,45),new THREE.MeshStandardMaterial({color:0xffdc93,metalness:.67,roughness:.25}));
    band.rotation.x=Math.PI/2;band.position.y=yy;soundGroup.add(band);
  }
  const soundStick=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,1.7,10),new THREE.MeshStandardMaterial({color:0xf1b676,roughness:.56}));
  soundStick.position.set(.65,2.35,.5);soundStick.rotation.z=-.6;soundGroup.add(soundStick);
  const soundRings=Array.from({length:6},()=>{
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(.72,.03,8,64),new THREE.MeshBasicMaterial({color:0xc1a3ff,transparent:true,opacity:.5,depthWrite:false}));
    mesh.rotation.x=Math.PI/2;mesh.position.y=1.55;soundGroup.add(mesh);return mesh;
  });
  function renderSound(s){
    const info=soundReading(s.soundFrequency,s.soundVolume);
    const p=s.discoveryProgress;
    soundStick.rotation.z=-.6+Math.sin(p*48)*.2*info.visualAmplitude;
    drumSkin.scale.y=1-Math.abs(Math.sin(p*38))*info.visualAmplitude*.2;
    soundRings.forEach((ring,i)=>{
      const waveStep=.20+info.wavelengthMeters*.40;
      const radius=.85+((p*2.4+i*waveStep)%(waveStep*soundRings.length+1.6));
      ring.scale.setScalar(radius/.72);
      const travel=((p*2.4+i*waveStep)%(waveStep*soundRings.length+1.6))/(waveStep*soundRings.length+1.6);
      ring.material.opacity=Math.max(.04,(1-travel)*.55*info.visualAmplitude);
      ring.visible=p>0;
    });
  }

  if(surfaceMaterialArtwork.complete&&surfaceMaterialArtwork.naturalWidth)applyIllustratedStageMaterials();
  else surfaceMaterialArtwork.addEventListener('load',applyIllustratedStageMaterials,{once:true});

  const stars = new Float32Array(270);
  for (let i = 0; i < 90; i++) { const a = i * 2.39996; const r = 3.7 + (i % 7) * .27; stars[3*i]=Math.cos(a)*r;stars[3*i+1]=.3+(i*37%97)/97*5.5;stars[3*i+2]=Math.sin(a)*r; }
  const starsGeo = new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));
  const starPoints = new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb7fff4,size:.06,transparent:true,opacity:.7}));scene.add(starPoints);

  let azimuth=.60, elevation=5.4, radius=10.7;
  function setCamera() {camera.position.set(Math.sin(azimuth)*radius,elevation,Math.cos(azimuth)*radius);camera.lookAt(0,state.lesson==='orbit'?.85:state.lesson==='circuit'?1.1:2.15,0);}
  setCamera();
  const activePointers = new Map();
  canvas.addEventListener('pointerdown', e => {activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove', e => {const old=activePointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;azimuth-=dx*.008;elevation=Math.max(2.7,Math.min(8.5,elevation+dy*.014));activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});setCamera();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>activePointers.delete(e.pointerId));
  canvas.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(7.2,Math.min(15,radius+e.deltaY*.012));setCamera();},{passive:false});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.status='paused';showStatus('그래픽 화면이 잠시 중단됐어요. 다시 열어주세요.');});

  function resize() {const w=Math.max(1,sceneFrame.clientWidth),h=Math.max(1,sceneFrame.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const observer = new ResizeObserver(resize);observer.observe(sceneFrame);
  return {
    resize, resetCamera(){azimuth=state.lesson==='light'?.23:state.lesson==='circuit'?.13:state.lesson==='mechanics'?.20:.60;elevation=state.lesson==='orbit'?7.1:state.lesson==='light'?5.7:state.lesson==='circuit'?6.6:state.lesson==='mechanics'?5.5:5.4;radius=state.lesson==='orbit'?12.9:state.lesson==='light'?10.8:state.lesson==='circuit'?10.1:state.lesson==='mechanics'?11.6:10.7;setCamera();},
    render(s){
      const isGravity=s.lesson==='gravity';
      gravityGroup.visible=isGravity;
      orbitGroup.visible=s.lesson==='orbit';
      lightGroup.visible=s.lesson==='light';
      circuitGroup.visible=s.lesson==='circuit';
      mechanicsGroup.visible=s.lesson==='mechanics';
      magnetGroup.visible=s.lesson==='magnet';
      soundGroup.visible=s.lesson==='sound';
      if(isGravity){
        const ballY=.98 + 3.45*(1-s.ball.distance/s.height);
        const featherY=.99 + 3.45*(1-s.feather.distance/s.height);
        ball.position.set(-1.28,ballY,0);
        feather.position.set(1.28,featherY,0);
        for(const [shadow,objectY] of [[ballContactShadow,ballY],[featherContactShadow,featherY]]){
          const airborne=Math.max(0,objectY-.98);
          shadow.material.opacity=.6/(1+airborne*.32);
          shadow.scale.set(.72+airborne*.08,.49+airborne*.09,1);
        }
        feather.rotation.y=s.time*.45;
        feather.rotation.z=-.24+Math.sin(s.time*2)*.08;
      }else if(s.lesson==='orbit'){
        const probeR=2.1*s.orbitRadius;
        probeOrbit.scale.set(probeR,probeR,1);
        const angle=orbitalAngle(s.orbitYears,s.orbitRadius);
        const earthAngle=orbitalAngle(s.orbitYears,1);
        probeBody.position.set(probeR*Math.cos(angle),.9,probeR*Math.sin(angle));
        earthBody.position.set(2.1*Math.cos(earthAngle+1.7),.9,2.1*Math.sin(earthAngle+1.7));
        sunBody.rotation.y+=.001;
      }else if(s.lesson==='light'){
        renderLight(s);
      }else if(s.lesson==='circuit'){
        renderCircuit(s);
      }else if(s.lesson==='mechanics'){
        renderMechanics(s);
      }else if(s.lesson==='magnet'){
        renderMagnet(s);
      }else if(s.lesson==='sound'){
        renderSound(s);
      }
      renderer.render(scene,camera);
    }
  };
}

function renderFallback(s, targetContext = fallbackContext, targetCanvas = canvas) {
  if (!targetContext) return;
  const dpr=Math.min(devicePixelRatio||1,2),w=sceneFrame.clientWidth,h=sceneFrame.clientHeight;
  if (targetCanvas.width!==Math.round(w*dpr)||targetCanvas.height!==Math.round(h*dpr)){targetCanvas.width=Math.max(1,Math.round(w*dpr));targetCanvas.height=Math.max(1,Math.round(h*dpr));}
  const ctx=targetContext;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  if(EVERYDAY_IDS.includes(s.lesson)){
    drawEverydayScene(ctx,{
      lesson:s.lesson,art:cuteToyArtwork[s.lesson],atlas:experimentPropsArtwork,shoe:blueShoeArtwork,surfaceAtlas:surfaceMaterialArtwork,hardwareAtlas:apparatusMaterialArtwork,waterGlass:heatWaterGlassArtwork,width:w,height:h,
      progress:s.discoveryProgress,reading:everydayReading(),
      settings:{mode:s.extraMode,speed:s.extraA,slopeDegrees:s.extraA,length:s.extraA}
    });
    return;
  }
  if(s.lesson==='magnet'||s.lesson==='sound'){
    const art=cuteToyArtwork[s.lesson],size=Math.min(w*.85,h*.91,370),x=(w-size)/2,y=(h-size)/2;
    const halo=ctx.createRadialGradient(w/2,h*.55,10,w/2,h*.55,Math.max(w,h)*.56);
    halo.addColorStop(0,'rgba(163,224,232,.25)');halo.addColorStop(1,'rgba(67,65,117,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    const p=s.discoveryProgress;
    if(s.lesson==='magnet'){
      const info=magnetReading(s.magnetMaterial,s.magnetDistance,s.magnetStrength);
      // Field lines are only a decorative hint; the steel sphere moves, the wood does not.
      ctx.save();ctx.lineWidth=2.2;ctx.setLineDash([7,11]);
      for(let i=0;i<3;i++){
        ctx.globalAlpha=.10+i*.055;ctx.strokeStyle=i%2?'#a4faff':'#ffdaab';
        ctx.beginPath();ctx.ellipse(w*.51,h*.57,75+i*36,31+i*23,-.18,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
      if(art.complete&&art.naturalWidth)ctx.drawImage(art,x,y,size,size);
      const pos=magnetBallPosition(p,info.attraction,info.visualPull,s.magnetDistance);
      const bx=x+size*pos.x,by=y+size*pos.y,bw=Math.max(31,size*.155);
      if(info.attraction){
        if(!paintPhysicsToy(ctx,0,bx,by,bw)){
          ctx.fillStyle='#ccd8e5';ctx.beginPath();ctx.arc(bx,by,bw*.38,0,Math.PI*2);ctx.fill();
        }
        if(pos.travel>.03){
          paintTwinkles(ctx,bx,by,Math.min(.95,pos.travel),6,Math.min(34,12+pos.travel*30));
          ctx.save();ctx.strokeStyle=`rgba(156,243,248,${.42*pos.travel})`;ctx.lineWidth=3;ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(bx+bw*.8,by);ctx.lineTo(bx+bw*(.95+pos.travel),by);ctx.stroke();ctx.restore();
        }
      }else if(woodBallArtwork.complete&&woodBallArtwork.naturalWidth){
        ctx.drawImage(woodBallArtwork,bx-bw*.52,by-bw*.52,bw*1.04,bw*1.04);
      }else{
        const grain=ctx.createRadialGradient(bx-bw*.2,by-bw*.24,1,bx,by,bw*.55);
        grain.addColorStop(0,'#ffe1a7');grain.addColorStop(.55,'#b67a42');grain.addColorStop(1,'#6f4028');
        ctx.fillStyle=grain;ctx.beginPath();ctx.arc(bx,by,bw*.46,0,Math.PI*2);ctx.fill();
      }
      ctx.save();ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;
      const label=info.attraction?'철구':'나무 구슬';
      ctx.strokeStyle='#1a2e4c';ctx.strokeText(label,bx,by-bw*.75);
      ctx.fillStyle='#fff9dc';ctx.fillText(label,bx,by-bw*.75);ctx.restore();
      // On narrow phones the existing HUD and result badge carry this message.
      if(w>=480){ctx.fillStyle='#fff2d7';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
        ctx.fillText(info.attraction?'철구가 자석 쪽으로 쏙!':'나무 구슬은 그대로!',w/2,h*.19);}
    }else{
      const info=soundReading(s.soundFrequency,s.soundVolume);
      const spacing=wavefrontSpacing(info.wavelengthMeters);
      // The waves are drawn behind the drum, leaving the raster toy crisp in front.
      ctx.save();ctx.translate(w*.5,h*.55);
      for(let i=0;i<5;i++){
        const radius=24+((p*170+i*spacing)%(spacing*5+18));
        const alpha=p===0?0:Math.max(0,(1-radius/(spacing*5+60))*.5*info.visualAmplitude);
        ctx.strokeStyle=`rgba(250,215,255,${Math.max(0,alpha)})`;
        ctx.shadowBlur=13;ctx.shadowColor='#e7c3ff';ctx.lineWidth=5;
        ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
      if(art.complete&&art.naturalWidth)ctx.drawImage(art,x,y,size,size);
      if(w>=480){ctx.fillStyle='#ffeecb';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
        ctx.fillText(`${s.soundFrequency} Hz · 파장 ${info.wavelengthMeters.toFixed(2)} m`,w/2,h*.19);}
    }
    return;
  }
  if(s.lesson==='mechanics'){
    const m=mechanicsReadings({mode:s.mechanicsMode,loadNewtons:s.loadNewtons,effortArmMeters:s.effortArmMeters,pulleyType:s.pulleyType});
    const p=s.mechanicsProgress,cx=w*.52;
    ctx.fillStyle='#234c63a9';ctx.strokeStyle='#c99d7368';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(w*.10,h*.30,w*.80,h*.50,18);ctx.fill();ctx.stroke();
    ctx.save();ctx.beginPath();ctx.roundRect(w*.10,h*.30,w*.80,h*.50,18);ctx.clip();
    paintSurfaceTexture(ctx,surfaceMaterialArtwork,'wood',w*.10,h*.30,w*.80,h*.50,.24);ctx.restore();
    paintMechanicsPlatform(ctx,surfaceMaterialArtwork,w,h);
    const line=(ax,ay,bx,by,color,width=5)=>{ctx.lineCap='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();};
    const weight=(x,y,label)=>{
      const bw=Math.max(30,Math.min(48,w*.1)),bh=bw*.78;
      ctx.font='bold 11px sans-serif';
      if(!paintPhysicsToy(ctx,0,x,y,bw*1.35)){
        ctx.fillStyle='#669ebe';ctx.strokeStyle='#d4f9ff';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(x-bw/2,y-bh/2,bw,bh,7);ctx.fill();ctx.stroke();
      }
      const textWidth=ctx.measureText(label).width;
      ctx.fillStyle='#162948db';ctx.beginPath();ctx.roundRect(x-Math.max(22,textWidth/2+6),y-11,Math.max(44,textWidth+12),21,9);ctx.fill();
      ctx.fillStyle='#fff5d5';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(label,x,y+4);
    };
    if(s.mechanicsMode==='lever'){
      const beamY=h*.58,span=Math.min(w*.115,h*.15),arm=span*s.effortArmMeters;
      const theta=-.11+p*.25,ax=cx-arm,ay=beamY-arm*Math.sin(theta),bx=cx+span,by=beamY+span*Math.sin(theta);
      if(leverFulcrumArtwork.complete&&leverFulcrumArtwork.naturalWidth){
        const propSize=Math.min(98,w*.22,h*.32);
        ctx.drawImage(leverFulcrumArtwork,cx-propSize*.5,leverFulcrumSpriteTop(beamY,propSize),propSize,propSize);
      }else{
        ctx.fillStyle='#c98e50';ctx.beginPath();ctx.moveTo(cx,beamY-4);ctx.lineTo(cx-27,beamY+55);ctx.lineTo(cx+27,beamY+55);ctx.closePath();ctx.fill();
      }
      line(ax,ay+2,bx,by+2,'#81523c',17);line(ax,ay,bx,by,'#f2bb74',12);line(ax,ay-4,bx,by-4,'#fff1c3',3);
      ctx.shadowColor='#ffc58f';ctx.shadowBlur=13;ctx.fillStyle='#ff986f';ctx.beginPath();ctx.arc(ax,ay,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      weight(bx,by-21,`${s.loadNewtons}N`);
      ctx.fillStyle='#d6edee';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
      ctx.fillText('힘점',Math.max(ax,w*.12),Math.max(beamY+75,ay+29));ctx.fillText('받침점',cx,beamY+73);
    }else{
      const moving=s.pulleyType==='moving',top=h*.40;
      const motion=pulleySceneMotion(p,s.pulleyType);
      const loadY=h*motion.loadY,handleY=h*motion.handleY;
      function pulley(x,y){
        if(pulleyWheelArtwork.complete&&pulleyWheelArtwork.naturalWidth){
          ctx.save();ctx.translate(x,y);ctx.rotate(p*1.65);const size=Math.min(66,w*.145,h*.23);
          ctx.drawImage(pulleyWheelArtwork,-size/2,-size/2,size,size);ctx.restore();
        }else{
          ctx.strokeStyle='#d3eaf1';ctx.lineWidth=9;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle='#e1ad6e';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();
        }
      }
      line(w*.26,top-31,w*.74,top-31,'#9cbfcb',12);
      if(moving){
        const xx=w*.38,yy=loadY,fx=w*.65;
        pulley(xx,yy);pulley(fx,top);
        line(xx-24,top-30,xx-24,yy,'#ffe0b8',4);line(xx+24,yy,fx-24,top,'#ffe0b8',4);line(fx+24,top,fx+24,handleY,'#ffe0b8',4);
        line(xx,yy+25,xx,yy+41,'#d5dbe5',3);weight(xx,yy+56,`${s.loadNewtons}N`);
        ctx.fillStyle='#ffb48d';ctx.beginPath();ctx.arc(fx+24,handleY,11,0,Math.PI*2);ctx.fill();
      }else{
        pulley(cx,top);
        line(cx-24,top,cx-24,loadY,'#ffe0b8',4);line(cx+24,top,cx+24,handleY,'#ffe0b8',4);
        weight(cx-24,loadY,`${s.loadNewtons}N`);
        ctx.fillStyle='#ffb48d';ctx.beginPath();ctx.arc(cx+24,handleY,11,0,Math.PI*2);ctx.fill();
      }
      ctx.textAlign='center';ctx.fillStyle='#e9f4ff';ctx.font='bold 12px sans-serif';
      if(w>=480)ctx.fillText(moving?'움직도르래 · 줄 2가닥이 지탱':'고정도르래 · 힘의 방향 변경',cx,h*.85);
    }
    if(w>=480){ctx.fillStyle='#fce2bd';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
      ctx.fillText(`필요한 힘 ${m.effortNewtons.toFixed(0)} N`,cx,h*.25);}
    const finale=celebrationCue(p);
    paintTwinkles(ctx,cx,h*.62,finale.alpha*.76,9,finale.spread);
    return;
  }
  if(s.lesson==='circuit'){
    const data=circuitReadings(s.circuitVoltage,s.circuitResistance,s.circuitClosed);
    const L=w*.23,R=w*.77,T=h*.38,B=h*.76,mid=w*.50,gap=Math.min(18,w*.045);
    ctx.fillStyle='#2352678c';ctx.strokeStyle='#73c9bd73';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(w*.13,h*.30,w*.74,h*.53,18);ctx.fill();ctx.stroke();
    ctx.save();ctx.beginPath();ctx.roundRect(w*.13,h*.30,w*.74,h*.53,18);ctx.clip();
    paintSurfaceTexture(ctx,surfaceMaterialArtwork,'wood',w*.13,h*.30,w*.74,h*.53,.18);ctx.restore();
    function line(x1,y1,x2,y2,color,width=5){ctx.beginPath();ctx.lineCap='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    line(L,T,mid-gap,T,'#ef9b82');line(mid+gap,T,R,T,'#ef9b82');
    line(R,T,R,B,'#64d8c3');line(R,B,L,B,'#64d8c3');line(L,B,L,T,'#64d8c3');
    for(const x of [mid-gap,mid+gap]){ctx.beginPath();ctx.fillStyle='#ffe2aa';ctx.arc(x,T,5,0,Math.PI*2);ctx.fill();}
    line(mid-gap,T,mid+gap,s.circuitClosed?T:T-25,'#f9dcb4',6);
    // Battery and terminals.
    ctx.fillStyle='#c88b75';ctx.strokeStyle='#f6c598';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(L-15,(T+B)/2-31,30,62,9);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffe5a4';ctx.fillRect(L-9,(T+B)/2-29,18,21);
    ctx.fillStyle='#553b3f';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('+',L,(T+B)/2-12);
    // An unlit glass toy remains visibly OFF; only the light emitted behind it varies with power.
    const lampY=(T+B)/2;
    const bulbSize=Math.min(95,w*.19,h*.28);
    const bulbReady=bulbUnlitArtwork.complete&&bulbUnlitArtwork.naturalWidth>0;
    if(data.brightness>0){
      ctx.save();const radius=bulbSize*1.35;
      const glow=ctx.createRadialGradient(R,lampY,5,R,lampY,radius);
      glow.addColorStop(0,`rgba(255,229,140,${.45*data.brightness})`);
      glow.addColorStop(.55,`rgba(255,201,106,${.16*data.brightness})`);
      glow.addColorStop(1,'rgba(255,201,106,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(R,lampY,radius,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if(!bulbReady){
      ctx.fillStyle=`rgba(224,237,247,${.18+.68*data.brightness})`;
      ctx.strokeStyle=data.brightness>.02?'#fff1b2':'#b1bdc5';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(R,lampY,bulbSize*.4,0,Math.PI*2);ctx.fill();ctx.stroke();
      line(R-9,lampY+6,R-9,lampY-3,'#a08e76',2);
      line(R-9,lampY-3,R+9,lampY-3,'#a08e76',3);
      line(R+9,lampY-3,R+9,lampY+6,'#a08e76',2);
    }
    ctx.fillStyle='#e9f8f4';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
    ctx.fillText('건전지',L,B+16);ctx.fillText('전구',R,B+16);
    paintPhysicsToy(ctx,6,L,lampY,Math.min(104,w*.19,h*.28));
    if(bulbReady){
      const bulbHeight=bulbSize*bulbUnlitArtwork.naturalHeight/bulbUnlitArtwork.naturalWidth;
      ctx.drawImage(bulbUnlitArtwork,R-bulbSize/2,lampY-bulbHeight/2,bulbSize,bulbHeight);
      const litAlpha=litBulbOpacity(data.brightness,s.circuitClosed);
      if(litAlpha>.001)paintPhysicsToy(ctx,7,R,lampY,bulbSize,litAlpha);
    }else if(s.circuitClosed){
      paintPhysicsToy(ctx,7,R,lampY,bulbSize,litBulbOpacity(data.brightness,true));
    }
    if(s.circuitClosed)paintTwinkles(ctx,R,lampY,Math.min(1,data.brightness*.72),7,51);
    if(s.circuitClosed && s.status==='running'){
      // A closed switch is one continuous electrical path: particles must never teleport across its contacts.
      const segments=[[L,T,R,T],[R,T,R,B],[R,B,L,B],[L,B,L,T]];
      const lengths=segments.map(([x1,y1,x2,y2])=>Math.hypot(x2-x1,y2-y1));
      const length=lengths.reduce((a,b)=>a+b,0);
      for(let i=0;i<14;i++){
        let along=((s.circuitProgress+i/14)%1)*length,x=L,y=T;
        for(let j=0;j<segments.length;j++){
          if(along<=lengths[j]||j===segments.length-1){const [x1,y1,x2,y2]=segments[j],t=Math.min(1,along/lengths[j]);x=x1+(x2-x1)*t;y=y1+(y2-y1)*t;break;}
          along-=lengths[j];
        }
        ctx.fillStyle='#c6fff5';ctx.shadowColor='#b9fff0';ctx.shadowBlur=9;
        ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();
      }
      ctx.shadowBlur=0;
    }
    return;
  }
  if(s.lesson==='light'){
    const path=mirrorLightPath(s.lightAngle);
    const cx=w*.5,baseY=h*.73,length=Math.min(w*.44,h*.6);
    const origin={x:cx+path.source.x*length,y:baseY-path.source.z*length};
    const hit={x:cx,y:baseY};
    const target={x:cx+path.target.x*length,y:baseY-path.target.z*length};
    ctx.lineCap='round';
    // One actual mirror at the calculated reflection plane. A second decorative mirror would mislead children.
    const torchSize=Math.min(80,w*.16,h*.22);
    const direction=Math.atan2(hit.y-origin.y,hit.x-origin.x);
    ctx.save();ctx.translate(origin.x+(hit.x-origin.x)*.28,origin.y+(hit.y-origin.y)*.28);
    ctx.rotate(direction-Math.atan2(.23,-.8));
    paintPhysicsToy(ctx,5,torchSize*.22,-torchSize*.05,torchSize,.9);ctx.restore();
    const mirror=ctx.createLinearGradient(0,baseY-10,0,baseY+15);
    mirror.addColorStop(0,'#d4b8fc');mirror.addColorStop(.47,'#8bd8ec');mirror.addColorStop(1,'#243d63');
    ctx.save();ctx.shadowColor='#f1cd86';ctx.shadowBlur=11;
    ctx.fillStyle='#9f694b';ctx.beginPath();ctx.roundRect(w*.075,baseY-11,w*.85,24,7);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle=mirror;ctx.beginPath();ctx.roundRect(w*.087,baseY-7,w*.826,15,4);ctx.fill();
    ctx.strokeStyle='#f9d694';ctx.lineWidth=2;ctx.stroke();
    for(const side of [w*.104,w*.896]){
      ctx.fillStyle='#ffe1a1';ctx.beginPath();ctx.arc(side,baseY,2.7,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    ctx.setLineDash([5,6]);ctx.strokeStyle='#baf7e8ad';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx,baseY);ctx.lineTo(cx,baseY-length*1.11);ctx.stroke();ctx.setLineDash([]);
    ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillStyle='#c5e5e7';ctx.fillText('법선',cx+8,baseY-length*.77);
    const draw=(a,b,color,width,glow)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.shadowBlur=0;};
    draw(origin,hit,'#e3c8a954',2,0);draw(hit,target,'#a1eadd54',2,0);
    const p=s.lightProgress;
    const blend=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    const stepA=blend(origin,hit,Math.min(1,p*2));
    const stepB=blend(hit,target,Math.max(0,Math.min(1,(p-.5)*2)));
    if(p>0){draw(origin,stepA,'#ffdf9d',4,17);if(p>.5)draw(hit,stepB,'#a6ffed',4,17);}
    const rayArrow=(a,b,fraction,color)=>{
      const px=a.x+(b.x-a.x)*fraction,py=a.y+(b.y-a.y)*fraction;
      ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
      ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=7;
      ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();
    };
    if(p>.34)rayArrow(origin,hit,.68,'#fff0b2');
    if(p>.76)rayArrow(hit,target,.52,'#b9fff1');
    if(p>0){
      for(let i=1;i<=5;i++){
        const t=Math.max(0,p-i*.035);
        const pos=t<.5?blend(origin,hit,t*2):blend(hit,target,Math.min(1,(t-.5)*2));
        ctx.globalAlpha=.17+i*.1;ctx.fillStyle=i%2?'#fff4c0':'#bdfff5';
        ctx.beginPath();ctx.arc(pos.x,pos.y,1.8+i*.5,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      if(p>.40&&p<.68)paintTwinkles(ctx,cx,baseY,(1-Math.abs(p-.54)/.14)*.85,9,44);
    }
    const spark=p<.5?stepA:stepB;
    if(p>0&&p<1){ctx.shadowColor='#f9eab2';ctx.shadowBlur=17;ctx.fillStyle='#fff8de';ctx.beginPath();ctx.arc(spark.x,spark.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    ctx.fillStyle='#ffdda2';ctx.shadowColor='#ffdda2';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(origin.x,origin.y,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#dffbf0';ctx.textAlign='center';ctx.font='12px sans-serif';ctx.fillText('평면거울',cx,baseY+34);
    return;
  }
  if(s.lesson==='orbit'){
    const cx=w*.5,cy=h*.51,unit=Math.min(w*.38,h*.4)/1.8;
    function ring(radius,color){ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(cx,cy,radius*unit,radius*unit*.63,0,0,Math.PI*2);ctx.stroke();}
    ring(1,'#74bcf6a0');ring(s.orbitRadius,'#ffc8f7d0');
    const period=orbitalPeriodYears(s.orbitRadius),trailCount=orbitalTrailCount(s.orbitYears/period);
    for(let i=0;i<trailCount;i++){
      const earlier=Math.max(0,s.orbitYears-i*period/48),a=orbitalAngle(earlier,s.orbitRadius);
      const tx=cx+unit*s.orbitRadius*Math.cos(a),ty=cy+unit*s.orbitRadius*Math.sin(a)*.63;
      ctx.fillStyle=`rgba(255,207,246,${.5*(1-i/Math.max(1,trailCount))})`;
      ctx.beginPath();ctx.arc(tx,ty,Math.max(1.5,4-i*.19),0,Math.PI*2);ctx.fill();
    }
    const toySizes=orbitToySizes(w,h,unit);
    const sunSize=toySizes.sun;
    if(!paintPhysicsToy(ctx,2,cx,cy,sunSize)){
      ctx.shadowBlur=23;ctx.shadowColor='#ffbe48';ctx.fillStyle='#ffc45d';ctx.beginPath();ctx.arc(cx,cy,Math.max(15,unit*.17),0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=10;
    const earthAngle=orbitalAngle(s.orbitYears,1)+1.7,probeAngle=orbitalAngle(s.orbitYears,s.orbitRadius);
    for(const [r,angle,color,size,artIndex] of [[1,earthAngle,'#58b6ff',8,3],[s.orbitRadius,probeAngle,'#ffd0f9',10,null]]){
      const px=cx+unit*r*Math.cos(angle),py=cy+unit*r*Math.sin(angle)*.63;
      if(artIndex!==null&&paintPhysicsToy(ctx,artIndex,px,py,Math.min(54,w*.13,h*.17)))continue;
      if(artIndex===null&&explorerPlanetArtwork.complete&&explorerPlanetArtwork.naturalWidth){
        const sz=toySizes.explorer;ctx.save();ctx.shadowColor='#f9cbff';ctx.shadowBlur=12;
        ctx.drawImage(explorerPlanetArtwork,px-sz/2,py-sz/2,sz,sz);ctx.restore();continue;
      }
      ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py,size,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#cde4f1';ctx.fillText('태양',cx,cy+Math.max(15,unit*.17)+17);
    return;
  }
  const top=h*.22,bottom=h*.78;
  const groundY=Math.min(h*.89,bottom+Math.min(106,w*.20,h*.36)*.28);
  const drawSoilEdge=()=>{
    ctx.beginPath();ctx.moveTo(-12,groundY+10);
    ctx.quadraticCurveTo(w*.5,groundY-34,w+12,groundY+10);
  };
  // A continuous cross-section connects to the scene bottom instead of floating
  // like a detached green disc. The actual soil illustration stays the texture.
  ctx.save();drawSoilEdge();ctx.lineTo(w+12,h+12);ctx.lineTo(-12,h+12);ctx.closePath();ctx.clip();
  ctx.fillStyle='#465344';ctx.fillRect(0,groundY-28,w,h-groundY+40);
  paintSurfaceTexture(ctx,surfaceMaterialArtwork,'soil',0,groundY-28,w,h-groundY+40,.53);
  const soilShade=ctx.createLinearGradient(0,groundY-18,0,h);
  soilShade.addColorStop(0,'rgba(238,206,127,.14)');soilShade.addColorStop(1,'rgba(9,25,39,.48)');
  ctx.fillStyle=soilShade;ctx.fillRect(0,groundY-28,w,h-groundY+40);ctx.restore();
  drawSoilEdge();ctx.strokeStyle='rgba(219,227,173,.84)';ctx.lineWidth=2.6;ctx.stroke();
  for(const [kind,x,color] of [['ball',w*.33,'#d8e5ef'],['feather',w*.67,'#9cf4d4']]){
    const artSize=Math.min(106,w*.20,h*.36);
    // Place the final toy image on the curved top of the continuous soil bed.
    // Physics distances stay untouched: only the drawing range is adjusted.
    const groundAtX=groundY+10-88*(x/w)*(1-x/w);
    const landingCenterY=groundAtX-artSize*.47;
    const y=top+(s[kind].distance/s.height)*(landingCenterY-top);
    const sway=kind==='feather'&&s.air&&s.status==='running'?Math.sin(s.time*7)*Math.min(10,w*.025):0;
    // A radial alpha shadow stays on the curved ground while the toy falls.
    // Its contrast and footprint follow visual clearance, never the physics solver.
    const shadow=groundShadowCue(1-s[kind].distance/s.height,kind);
    ctx.save();ctx.translate(x+sway*.28,groundAtX+2);
    ctx.scale(artSize*shadow.widthFactor,artSize*shadow.heightFactor);
    const penumbra=ctx.createRadialGradient(0,0,0,0,0,1);
    penumbra.addColorStop(0,`rgba(5,16,27,${shadow.opacity})`);
    penumbra.addColorStop(.58,`rgba(5,16,27,${shadow.opacity*.57})`);
    penumbra.addColorStop(1,'rgba(5,16,27,0)');
    ctx.fillStyle=penumbra;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
    if(s[kind].landedAt===null&&s[kind].distance>0){
      const speed=Math.max(0,s[kind].velocity),n=Math.min(4,Math.ceil(speed/2));
      for(let i=1;i<=n;i++){
        ctx.strokeStyle=kind==='ball'?`rgba(206,248,255,${.23-i*.035})`:`rgba(255,222,244,${.21-i*.03})`;
        ctx.lineWidth=2.3;ctx.lineCap='round';ctx.beginPath();
        ctx.moveTo(x+sway+(i-2.5)*10,y-artSize*.38-i*6);
        ctx.lineTo(x+sway+(i-2.5)*10,y-artSize*.45-i*9-Math.min(18,speed*1.5));ctx.stroke();
      }
    }
    const after=s[kind].landedAt===null?-1:(s.status==='done'&&Number.isFinite(s.visualFinishMs)?
      s.time+Math.min(1,(performance.now()-s.visualFinishMs)/1000):s.time)-s[kind].landedAt;
    const landing=landingCue(after);
    if(landing.alpha>0){
      ctx.strokeStyle=kind==='ball'?`rgba(198,241,255,${landing.alpha*.75})`:`rgba(252,222,254,${landing.alpha*.72})`;
      ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,groundAtX,landing.radius,landing.radius*.21,0,0,Math.PI*2);ctx.stroke();
      paintTwinkles(ctx,x,groundAtX,landing.alpha*.7,6,landing.radius*.9);
      // Airborne soil haze belongs to the air scene, not to the vacuum demonstration.
      if(s.air){
        const puffProgress=Math.max(0,Math.min(1,after/.74));
        const puffAlpha=landing.alpha*(kind==='ball'?.22:.10);
        ctx.save();ctx.fillStyle=`rgba(228,203,158,${puffAlpha})`;
        for(const direction of [-1,1]){
          ctx.beginPath();
          ctx.ellipse(x+direction*(8+23*puffProgress),groundAtX-4-5*puffProgress,
            7+8*puffProgress,2.5+3*puffProgress,0,0,Math.PI*2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    ctx.save();ctx.translate(x+sway,y);
    if(kind==='feather'&&s.status==='running')ctx.rotate(Math.sin(s.time*3.6)*.12);
    const painted=paintPhysicsToy(ctx,kind==='ball'?0:1,0,0,artSize*landing.scale);
    ctx.restore();
    if(painted)continue;
    ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=15;
    if(kind==='ball'){ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fill();}
    else{ctx.save();ctx.translate(x,y);ctx.rotate(-.3);ctx.beginPath();ctx.ellipse(0,0,10,26,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  }
  ctx.shadowBlur=0;
}

updateReadouts();
requestAnimationFrame(frame);
