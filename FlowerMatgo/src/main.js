import './style.css';
import {
  createInitialGame, chooseGo, chooseStop, chooseChongtong,
  playTurn, playBomb, playFlipOnlyTurn, declareShake,
  getMatchingFloorCards, isValidGameState, nextRoundMultiplier
} from './engine/gameState';
import { chooseAiMove, chooseAiGoStop, chooseAiChongtong } from './engine/ai/strategy';
import { calculateCapturedScore } from './engine/rules/scoring';
import { findBombOptions, findShakeOptions } from './engine/rules/specialRules';
import { getCard, HWATU_CARDS } from './engine/cards';
import { ALLOWED_STAKES, STAKES, canUseStake, normalizeStake } from './stakeRules.js';
import { groupedCaptures } from './capturedCards.js';
import { cardBookLabel, cardVisualDetails } from './cardDisplay.js';
import { hwatuFamily, spokenActionText, spokenCardName } from './cardNames.js';
import { animateResolvedTurn, motionOrigin } from './turnPresentation.js';
import { specialPresentation } from './specialPresentation.js';
import { SPECIAL_FLASH_MS, specialMoment } from './specialMoment.js';
import { cardSoundProfile } from './cardSoundDesign.js';
import { newlyCompletedCombos } from './scoreCombos.js';
import { HUMAN_TURN_MS, HUMAN_TURN_SECONDS, humanTurnSignature, secondsLeft } from './turnTiming.js';
import { canEmergencyRecharge, EMERGENCY_RECHARGE, hasEnoughForTable } from './rechargePolicy.js';
import {
  createOpeningFlow, revealDealerCards,
  OPENING_SHUFFLE_MS, OPENING_REVEAL_MS, OPENING_DEAL_MS
} from './openingFlow.js';

const ROOT = document.querySelector('#app');
const SAVE_KEY = 'gomfox-flower-matgo-v01';
const DIFFICULTIES = [
  { id: 'easy', name: '초보', nick: '느긋한 밤톨이', animal: 'bear', quote: '천천히 해도 괜찮아!', desc: '규칙을 익히며 편하게 즐겨요.' },
  { id: 'normal', name: '중수', nick: '장난꾸러기 여울', animal: 'fox', quote: '이번 패는 내 거야!', desc: '읽고 뺏고, 제법 영리한 승부.' },
  { id: 'hard', name: '고수', nick: '꽃패의 달인 설이', animal: 'cat', quote: '수는 이미 읽었어.', desc: '틈을 놓치지 않는 까다로운 상대.' }
];
const BASE_WALLET = 1000000;
const kr = n => Math.round(Number(n)||0).toLocaleString('ko-KR');
const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultSave = () => ({
  screen: 'home', difficulty: 'normal', stake: 100, wallet: BASE_WALLET,
  stats: {wins:0, losses:0, draws:0, high:0, rounds:0},
  game: null, settledUuid: null, nextMultiplier: 1, sound: true, autoMode: false
});

function loadSave() {
  const base = defaultSave();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!raw || typeof raw !== 'object') return base;
    const save = { ...base, ...raw, stats: { ...base.stats, ...(raw.stats || {}) } };
    if (!DIFFICULTIES.some(d => d.id === save.difficulty)) save.difficulty = 'normal';
    // Remove the legacy artwork selection from old saves. The original-style
    // mascot atlas is now the only face artwork, regardless of saved settings.
    delete save.cardArt;
    save.autoMode = save.autoMode === true;
    save.stake = normalizeStake(save.difficulty, save.stake);
    if (!Number.isFinite(save.wallet)) save.wallet = BASE_WALLET;
    save.wallet = Math.max(0, Math.round(save.wallet));
    if (save.game && !isValidGameState(save.game)) save.game = null;
    save.screen = save.game && save.screen === 'game' ? 'game' : 'home';
    return save;
  } catch {
    return base;
  }
}
let app = loadSave();
let overlay = null;
let galleryOwner = 'human';
let selectedMatch = null;
let aiTimer = null;
let fxTimer = null;
let flash = '';
let flashKind = 'special';
let audioCtx = null;
let turnTransition = false;
let turnTransitionTimer = null;
let clockInterval = null;
let autoTimer = null;
let clockKey = null;
let clockDeadline = 0;
let clockRemaining = HUMAN_TURN_MS;
let clockPaused = false;
let expiredKey = null;
let opening = null;
let openingTimer = null;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(app)); }
  catch { /* Private browsing may reject storage. In-memory play still works. */ }
}
function tone(kind = 'tap') {
  if (!app.sound) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = kind === 'win' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(kind === 'win' ? 660 : kind === 'special' ? 490 : 360, t);
    osc.frequency.exponentialRampToValueAtTime(kind === 'win' ? 900 : 190, t + .13);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.07, t + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .22);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + .24);
  } catch { /* Silent fallback. */ }
}
// The short filtered-noise crackle supplies the familiar weight of cards
// meeting a wooden table, without external audio files or download latency.
function cardSound(kind = 'land') {
  if (!app.sound) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const profile = cardSoundProfile(kind);
    const length = profile.duration;
    const buffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * length), audioCtx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = profile.frequency;
    filter.Q.value = .82;
    const snap = audioCtx.createGain();
    snap.gain.setValueAtTime(.0001, t);
    snap.gain.exponentialRampToValueAtTime(profile.noiseGain, t + .006);
    snap.gain.exponentialRampToValueAtTime(.0001, t + length);
    noise.connect(filter); filter.connect(snap); snap.connect(audioCtx.destination);
    noise.start(t); noise.stop(t + length);
    const bass = audioCtx.createOscillator();
    const body = audioCtx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(profile.bass, t);
    bass.frequency.exponentialRampToValueAtTime(92, t + .075);
    body.gain.setValueAtTime(.035, t);
    body.gain.exponentialRampToValueAtTime(.0001, t + .09);
    bass.connect(body); body.connect(audioCtx.destination);
    bass.start(t); bass.stop(t + .10);
    if (['pair','jjok','ttadak','double','bomb','sweep'].includes(kind)) {
      // A bomb lands with two short answering taps, softer than the card snap.
      const delays = kind === 'bomb' ? [.055,.125]
        : kind === 'ttadak' ? [.045,.098]
        : kind === 'sweep' ? [.075] : [.055];
      for (const delay of delays) {
        const tick = audioCtx.createOscillator();
        const tickGain = audioCtx.createGain();
        tick.type = 'sine';
        tick.frequency.setValueAtTime(300, t + delay);
        tick.frequency.exponentialRampToValueAtTime(135, t + delay + .07);
        tickGain.gain.setValueAtTime(.0001, t + delay);
        tickGain.gain.exponentialRampToValueAtTime(kind === 'bomb' ? .037 : .028, t + delay + .007);
        tickGain.gain.exponentialRampToValueAtTime(.0001, t + delay + .075);
        tick.connect(tickGain); tickGain.connect(audioCtx.destination);
        tick.start(t + delay); tick.stop(t + delay + .08);
      }
    }
  } catch { /* A browser without WebAudio can still play every turn. */ }
}
function effects(label, kind = 'special', visualKind = kind) {
  flash = spokenActionText(label);
  flashKind = visualKind;
  clearTimeout(fxTimer);
  tone(kind);
  fxTimer = setTimeout(() => { flash = '';flashKind = 'special'; if (app.screen === 'game' && !turnTransition) render(); }, SPECIAL_FLASH_MS);
}
function opponent() { return DIFFICULTIES.find(d => d.id === app.difficulty) || DIFFICULTIES[1]; }
function opponentReaction(g, humanScore, computerScore) {
  if (g.phase === 'round-ended') return g.winner === 'computer' ? '헤헤, 이번 판은 내 승리!' : '다음 판은 꼭 이길 거야!';
  if (g.currentPlayer === 'computer') return {
    bear: '으음, 어떤 패를 낼까~?', fox: '헤헷, 이건 내 차례!', cat: '잠깐, 수를 읽는 중이야.'
  }[opponent().animal];
  if (humanScore >= 3 && humanScore > computerScore) return '오, 오늘 감이 좋은데?!';
  if (computerScore >= 3 && computerScore > humanScore) return '후후, 나를 따라잡아 봐!';
  return opponent().quote;
}
function characterClass(animal) { return 'mascot mascot--' + animal; }
function portrait(animal, extra = '') { return `<span aria-hidden="true" class="${characterClass(animal)} ${extra}"></span>`; }
function scoreOf(g, p) {
  const human = p === 'human';
  return calculateCapturedScore(human ? g.humanCaptured : g.computerCaptured,
    { gookjinAsDoubleJunk: human ? g.humanGookjinAsDoubleJunk : g.computerGookjinAsDoubleJunk });
}
function card(id, options = {}) {
  const item = getCard(id);
  if (!item) return '';
  const visual = cardVisualDetails(item, options);
  const interactive = !!options.action;
  const small = !!options.small;
  const bonus = item.month === 0;
  const [month, ordinal] = bonus ? [0, 0] : [item.month, Number(id.slice(-2))];
  const x = ordinal ? ((ordinal - 1) / 3 * 100).toFixed(5) : 0;
  const y = month ? ((month - 1) / 11 * 100).toFixed(5) : 0;
  const bonusSlot = ['bonus-pee-1','bonus-pee-2','bonus-double-pee-1'].indexOf(id);
  const style = bonus ? `style="--bonus-x:${(Math.max(0,bonusSlot)/2*100).toFixed(5)}%"` : `style="--card-x:${x}%;--card-y:${y}%"`;
  const aria = `${spokenCardName(item,{gookjinAsDoubleJunk:options.gookjinAsDoubleJunk})} · ${item.typeLabel}`;
  // Every 광 face has its 光 seal printed inside the v19 raster already.
  // No extra bright mark: otherwise the glyph appears twice on small phones.
  const mark = `${visual.doubleJunkText ? `<span class="hwatu__double-mark" aria-hidden="true">${visual.doubleJunkText}</span>` : ''}`;
  const classes = `hwatu hwatu--month-${String(month).padStart(2,'0')} hwatu--ordinal-${String(ordinal).padStart(2,'0')} ${small?'hwatu--small':''} ${options.tiny?'hwatu--tiny':''} ${bonus?'hwatu--bonus':''} ${interactive?'hwatu--interactive':''} ${options.hint?'hwatu--hint':''} ${visual.gookjinConverted?'hwatu--converted':''}`;
  return `<${interactive ? 'button' : 'div'} class="${classes}" ${style} data-card="${safe(id)}" ${interactive ? `type="button" data-action="${options.action}" aria-label="${safe(aria)} 내기"` : `role="img" aria-label="${safe(aria)}" title="${safe(aria)}"`}>
    ${bonus ? `<span class="hwatu__face"></span><span class="hwatu__bonus-mark" aria-hidden="true">${safe(item.typeLabel)}</span>` : `<span class="hwatu__face"></span>${mark}`}
  </${interactive ? 'button' : 'div'}>`;
}
function cardBack(small = false) {
  return `<span aria-label="뒷면 화투패" class="hwatu hwatu--back ${small?'hwatu--small':''}"><span class="hwatu__face"></span></span>`;
}
function uiIcon(name) { return `<span class="ui-icon ui-icon--${name}" aria-hidden="true"></span>`; }
function brand() { return `<div class="brand"><span class="brand__bloom">${uiIcon('bloom')}</span><span>곰같은여우의 <b>꽃맞고</b></span></div>`; }
function btn(label, action, extras = '') { return `<button type="button" class="btn ${extras}" data-action="${action}">${label}</button>`; }

function openingScreen() {
  if (!opening) return home();
  const phase = opening.phase;
  const outcome = opening.winner === 'human' ? '내가 먼저!' : `${opponent().nick} 선공!`;
  const titles = {
    shuffle: '화투패를 섞는 중!',
    pick: '선 정하기 · 패를 골라줘!',
    reveal: '누가 먼저 칠까?',
    deal: '자, 패를 나눌게!'
  };
  const descriptions = {
    shuffle: opening.rematch ? '한 판 더! 새 패를 골고루 섞을게.' : '친구들과 첫 승부, 새로운 패를 골고루 섞을게.',
    pick: `뒷면 패 중 한 장을 눌러줘. ${opening.daytime ? '낮에는 높은 무늬가 선!' : '밤에는 낮은 무늬가 선!'}`,
    reveal: `${outcome} · 패를 나눠줄게!`,
    deal: `${outcome} · 손패 10장씩 차례로 배분 중!`
  };
  let illustration = '';
  if (phase === 'shuffle') {
    illustration = `<div class="opening-shuffle" role="status" aria-label="화투패를 섞는 중">
      ${Array.from({length:7},(_,index)=>`<span class="opening-shuffle__card" style="--shuffle-i:${index};--shuffle-left:${(index-3)*-14}px;--shuffle-right:${(index-3)*17}px;--shuffle-rotate-left:${(index-3)*-8}deg;--shuffle-rotate-right:${(index-3)*7}deg">${cardBack()}</span>`).join('')}
    </div>`;
  } else if (phase === 'pick') {
    illustration = `<div class="opening-dealer-grid" aria-label="선 정하기 화투패 12장">
      ${opening.dealerCards.map((_,index)=>`<button type="button" class="opening-dealer-pick" data-action="pick-dealer" data-value="${index}" aria-label="${index+1}번째 선 정하기 패 선택">${cardBack()}</button>`).join('')}
    </div><p class="opening-rule">내가 고른 패와 상대가 뽑은 패를 공개해 선공을 결정해!</p>`;
  } else if (phase === 'reveal') {
    illustration = `<div class="opening-reveal" role="status" aria-live="polite">
      <div class="opening-reveal__choice ${opening.winner==='human'?'is-winner':''}"><b>내가 뽑은 패</b>${card(opening.dealerCards[opening.humanIndex])}<span>${safe(hwatuFamily(getCard(opening.dealerCards[opening.humanIndex])?.month))}</span></div>
      <strong class="opening-reveal__vs">VS</strong>
      <div class="opening-reveal__choice ${opening.winner==='computer'?'is-winner':''}"><b>${safe(opponent().nick)}</b>${card(opening.dealerCards[opening.computerIndex])}<span>${safe(hwatuFamily(getCard(opening.dealerCards[opening.computerIndex])?.month))}</span></div>
    </div><div class="opening-winner">${outcome}</div>`;
  } else {
    illustration = `<div class="opening-deal" role="status" aria-label="화투패 배분 중">
      <span class="opening-deal__label">${safe(opponent().nick)} · 10장</span>
      <div class="opening-deal__hand opening-deal__hand--computer">${Array.from({length:10},(_,index)=>`<span class="opening-deal__card" style="--deal-i:${index}">${cardBack()}</span>`).join('')}</div>
      <div class="opening-deal__deck">${cardBack()}<span>착착, 잘 섞인 패!</span></div>
      <div class="opening-deal__hand opening-deal__hand--human">${Array.from({length:10},(_,index)=>`<span class="opening-deal__card" style="--deal-i:${index}">${cardBack()}</span>`).join('')}</div>
      <span class="opening-deal__label">내 손패 · 10장</span>
    </div>`;
  }
  return `<main class="scene scene--opening">
    <header class="opening-top top-safe"><button type="button" class="nav-round" data-action="opening-home" aria-label="메인으로">${uiIcon('home')}</button>${brand()}<span class="opening-top__step">${phase==='pick'||phase==='reveal'?'선 정하기':'패 준비'}</span></header>
    <div class="opening-stage"><p class="opening-kicker">✿ 꽃맞고 한판 준비 ✿</p><h1>${titles[phase]}</h1><p class="opening-description">${descriptions[phase]}</p>
      ${illustration}
      ${phase==='pick'?'':`<button type="button" class="opening-skip" data-action="opening-skip">${phase==='shuffle'?'선 정하기로':'바로 진행'} ›</button>`}
    </div><div class="opening-friends" aria-hidden="true">${portrait('bear')}${portrait('fox')}${portrait('cat')}</div>
  </main>`;
}

function home() {
  const resume = app.game && app.game.phase !== 'round-ended';
  return `<main class="scene scene--home">
    <header class="nav top-safe">${brand()}<span class="top-pill">✿ 동물 친구들의 꽃놀이마당</span></header>
    <section class="home-content">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot">✿</span> 오늘도 꽃놀이마당 OPEN <span class="eyebrow-dot">✿</span></p>
        <h1 class="home-logo"><small>곰같은여우의</small><span><i>꽃</i><em>맞고</em></span></h1>
        <p class="hero-hook">꽃이 피면, 한판 할까?</p>
        <p class="lead">밤톨이, 여울, 설이가 기다리는<br><strong>웃음꽃 피는 맞고 한판!</strong></p>
        <p class="home-invite">♧ 익숙한 화투, 우리 친구들만의 반짝이는 승부 ♧</p>
        <div class="home-actions">
          ${btn(`${uiIcon('bloom')} ${resume ? '이어서 한판!' : '게임 시작!'}`, resume ? 'resume' : 'select', 'btn--primary btn--huge btn--jewel')}
          <div class="home-quick-links">
            ${resume ? btn('새 게임', 'select', 'btn--ghost') : btn(`${uiIcon('help')} 게임 방법`, 'help', 'btn--ghost')}
            ${btn(`${uiIcon('album')} 화투패 도감`, 'cardbook', 'btn--ghost')}
          </div>
        </div>
      </div>
      <div class="hero-animals" aria-label="곰과 여우, 고양이 동물 친구들">
        <div class="hero-card-fan" aria-hidden="true">${card('m03-01')}${card('m11-02')}${card('m08-01')}</div>
        <span class="hero-speech" aria-hidden="true">우리랑 한판 할래? ✿</span>
        ${portrait('bear','hero-bear')}${portrait('fox','hero-fox')}${portrait('cat','hero-cat')}
      </div>
    </section>
    <footer class="home-footer bottom-safe"><button data-action="sound" class="text-button sound-control" type="button">${uiIcon('bell')} ${app.sound?'효과음 켜짐':'효과음 꺼짐'}</button></footer>
  </main>`;
}

function selectScreen() {
  const allowed = ALLOWED_STAKES[app.difficulty] || ALLOWED_STAKES.normal;
  const emergency = canEmergencyRecharge(app.wallet);
  const canEnter = hasEnoughForTable(app.wallet, app.stake);
  return `<main class="scene scene--select">
    <header class="nav top-safe">${brand()}${btn('← 돌아가기','home','btn--quiet')}</header>
    <section class="setup-wrap">
      <div class="setup-heading"><span class="eyebrow">✿ 꽃놀이 친구 고르기 ✿</span><h2>오늘은 누구와 한판?</h2><p>마음에 드는 친구를 골라 봐. 셋 다 개성이 넘쳐!</p></div>
      <div class="opponents">
        ${DIFFICULTIES.map(d => `<button class="opponent-card opponent-card--${d.animal} ${app.difficulty===d.id?'is-active':''}" type="button" data-action="difficulty" data-value="${d.id}" aria-pressed="${app.difficulty===d.id}">
          <span class="opponent-card__speech">${d.quote}</span>
          ${portrait(d.animal)}
          <div class="opponent-card__text"><strong>${d.name}</strong><span>${d.nick}</span><small>${d.desc}</small></div>
          <span class="opponent-card__check">${app.difficulty===d.id?'✓':'○'}</span>
        </button>`).join('')}
      </div>
      <div class="stakes"><div><h3>한 점당 놀이머니</h3><small>난이도별 제한 · 실제 현금과 무관해</small><p class="stake-limit">${opponent().name} 난이도: <b>${allowed.map(kr).join(' · ')}냥</b> 가능</p></div>
        <div class="stake-row">${STAKES.map(v => `<button class="stake ${app.stake===v?'is-active':''} ${!canUseStake(app.difficulty,v)?'is-locked':''}" data-action="stake" data-value="${v}" type="button" aria-pressed="${app.stake===v}" ${!canUseStake(app.difficulty,v)?`disabled title="${opponent().name} 난이도에서는 선택할 수 없어요"`:''}>${kr(v)}<small>냥</small>${!canUseStake(app.difficulty,v)?'<span class="stake-lock">잠김</span>':''}</button>`).join('')}</div>
      </div>
      <div class="setup-bottom">
        <div class="wallet"><span>보유 놀이머니</span><strong>✦ ${kr(app.wallet)} 냥</strong>${emergency?`<button type="button" class="emergency-charge" data-action="recharge">${uiIcon('coins')} 긴급 무료 충전 +30만 냥</button>`:''}</div>
        ${btn(canEnter?'꽃맞고 시작하기 →':'놀이머니가 부족해요','start','btn--primary btn--huge')}
      </div>
    </section>
    <footer class="setup-footer bottom-safe">${emergency?'✿ 오링! 가장 작은 판도 시작할 수 없을 때만 긴급 무료 충전이 열려.':canEnter?'✿ 가상 놀이머니로만 즐기는 무료 싱글 맞고야.':'✿ 지금 판이 부담되면 초보 난이도의 낮은 점당 금액을 골라줘.'}</footer>
  </main>`;
}

function capturedSummary(g, who) {
  const s = scoreOf(g, who);
  const cap = who === 'human' ? g.humanCaptured : g.computerCaptured;
  return `<div class="capture-summary">
    <div class="capture-title"><button type="button" data-action="captures" data-value="${who}" class="capture-open">${who==='human'?'내':'상대'} 획득 ${cap.length}장 <span>보기</span></button><b>${s.total}점</b></div>
    <div class="capture-cats"><span>광 ${s.brightCount}</span><span>열 ${s.animalCount}</span><span>띠 ${s.ribbonCount}</span><span>피 ${s.junkCount}</span></div>
  </div>`;
}

function capturedRack(g) {
  return `<div class="collection-rack" aria-label="내가 먹은 실제 화투패">
    <div class="collection-head"><span>✿ <b>먹은 패</b> <small>${g.humanCaptured.length}장</small></span><button type="button" data-action="captures" data-value="human" aria-label="획득한 패 전체 펼쳐보기">전체 보기</button></div>
    <div class="collection-groups">${groupedCaptures(g,'human').map(group => `
      <button class="collection-group" type="button" data-capture-type="${group.id}" data-action="captures" data-value="human" aria-label="먹은 ${group.name} ${group.cards.length}장 전체 보기">
        <span class="collection-name">${group.name} <strong>${group.cards.length}</strong></span>
        <span class="collection-preview">${group.cards.length ? group.cards.slice(-3).map(id=>card(id,{tiny:true,gookjinAsDoubleJunk:g.humanGookjinAsDoubleJunk})).join('') : '<i>−</i>'}
          ${group.cards.length>3?`<em>+${group.cards.length-3}</em>`:''}</span>
      </button>`).join('')}</div>
  </div>`;
}
function capturedGallery(g, who) {
  const groups=groupedCaptures(g,who);
  const count=(who==='human'?g.humanCaptured:g.computerCaptured).length;
  return `<div class="modal-shade"><section class="modal-box gallery-box" role="dialog" aria-modal="true" aria-label="먹은 화투패 전체 보기">
    <div class="gallery-heading"><div><p class="eyebrow">MY FLOWER CARDS</p><h2>${who==='human'?'내가 먹은 패':'상대가 먹은 패'} <small>${count}장</small></h2></div><button class="gallery-close" type="button" data-action="close" aria-label="닫기">✕</button></div>
    <p class="gallery-note">같은 종류의 화투패를 모아 점수를 만들어요. 패를 크게 보고 확인해 봐!</p>
    ${groups.map(group=>`<section class="gallery-section"><div class="gallery-section-head"><strong>${group.name}</strong><span>${group.cards.length}장</span></div><div class="gallery-cards">${group.cards.length?group.cards.map(id=>card(id,{gookjinAsDoubleJunk:who==='human'?g.humanGookjinAsDoubleJunk:g.computerGookjinAsDoubleJunk})).join(''):'<span class="gallery-empty">아직 먹은 패가 없어요</span>'}</div></section>`).join('')}
    ${btn('돌아가기','close','btn--primary btn--wide')}
  </section></div>`;
}

function gameButtons(g) {
  const actions = [];
  if (g.phase === 'playing' && g.currentPlayer === 'human') {
    for (const b of findBombOptions(g.humanHand, g.floorCards, true)) {
      actions.push(`<button data-action="bomb" data-value="${b.month}" class="action-chip action-chip--warm" type="button">💥 ${hwatuFamily(b.month)} 폭탄</button>`);
    }
    for (const b of findShakeOptions(g.humanHand, g.floorCards, g.humanShakenMonths || [])) {
      actions.push(`<button data-action="shake" data-value="${b.month}" class="action-chip" type="button">✨ ${hwatuFamily(b.month)} 흔들기</button>`);
    }
    if (g.humanBombSkips > 0 && !g.humanHand.length) {
      actions.push(`<button data-action="flip" class="action-chip" type="button">↻ 더미 뒤집기</button>`);
    }
  }
  if (g.humanCaptured.includes('m09-01')) {
    actions.push(`<button data-action="gookjin" class="action-chip" type="button">🍶 국진: ${g.humanGookjinAsDoubleJunk?'쌍피':'열끗'}</button>`);
  }
  return actions.join('');
}
function gameScreen() {
  const g = app.game;
  if (!g) return home();
  const me = scoreOf(g,'human');
  const ai = scoreOf(g,'computer');
  const yourTurn = g.phase==='playing' && g.currentPlayer==='human';
  const pending = g.humanPendingShakeMonth;
  const hand = [...g.humanHand].sort((a,b)=>((getCard(a)?.month||0)-(getCard(b)?.month||0)));
  const floor = [...g.floorCards].sort((a,b)=>(getCard(a)?.month||0)-(getCard(b)?.month||0));
  const active = g.phase==='playing' ? (yourTurn?'내 차례':'상대가 생각 중…') : g.phase==='awaiting-go-stop' ? '고 / 스톱 선택' : g.phase==='awaiting-chongtong'?'총통!':'한 판 종료';
  const opponentMood = g.phase==='round-ended' ? (g.winner==='computer'?'victory':'surprised')
    : !yourTurn ? 'thinking' : ai.total > me.total ? 'confident' : ai.total < me.total ? 'surprised' : 'ready';
  return `<main class="scene scene--game">
    <header class="game-top top-safe">
      <button class="nav-round" data-action="home" title="메인으로" aria-label="메인으로" type="button">${uiIcon('home')}</button>
      <div class="game-title">${brand()}<small>점당 ${kr(g.pointValue)}냥</small></div>
      <div class="game-wallet" aria-label="보유 놀이머니"><span>내 지갑</span><b>✦ ${kr(app.wallet)}</b></div>
      <button class="nav-round" data-action="cardbook" type="button" title="48장 화투패 도감" aria-label="48장 화투패 도감">${uiIcon('album')}</button>
      <button class="nav-round" data-action="help" type="button" title="도움말" aria-label="도움말">${uiIcon('help')}</button>
    </header>
    <div class="opponent-hud opponent-hud--${opponentMood}">
      <span class="opponent-hud__flower" aria-hidden="true">✿</span>
      ${portrait(opponent().animal,'opponent-avatar')}
      <div class="hud-text"><b>${opponent().nick}</b><span>${opponentReaction(g,me.total,ai.total)}</span></div>
      <div class="score-badge"><strong>${ai.total}</strong><small>점</small></div>
      <span class="opponent-hud__sparkle" aria-hidden="true">✦</span>
      <div class="opponent-hand" aria-label="상대 손패 ${g.computerHand.length}장">${Array.from({length:Math.min(g.computerHand.length,5)},()=>cardBack(true)).join('')}<small class="opponent-hand__count">${g.computerHand.length}장</small></div>
    </div>
    <div class="table-play">
      <span class="table-play__flower table-play__flower--left" aria-hidden="true">✿</span>
      <span class="table-play__flower table-play__flower--right" aria-hidden="true">✿</span>
      <div class="center-status"><span class="status-orb"></span>${active}<span class="round-counter">${g.turnNumber+1}턴</span>${humanTurnSignature(app.screen,g) ? `<span class="turn-clock" role="timer" aria-label="내 차례 남은 시간"><span class="turn-clock__time"><strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초</span><span class="turn-clock__rail"><span class="turn-clock__fill" data-turn-fill></span></span></span>` : ''}</div>
      <div class="field-heading"><strong>바닥패 ${floor.length}장</strong><span>같은 무늬를 맞춰 획득!</span></div>
      <div class="field-row">
        <div class="deck-pile">${cardBack()}<small>남은 패 <b>${g.drawPile.length}</b></small></div>
        <div class="floor-area" data-density="${floor.length >= 13 ? 'packed' : floor.length >= 9 ? 'busy' : 'normal'}" aria-label="바닥에 놓인 화투패">${floor.length ? floor.map(id=>card(id)).join('') : '<div class="empty-floor">바닥패가 없어요 ✿</div>'}</div>
      </div>
      <div class="captured-grid">${capturedSummary(g,'computer')}</div>
      <div class="game-message" aria-live="polite" title="${safe(spokenActionText(g.lastAction))}">${safe(spokenActionText(g.lastAction))}</div>
    </div>
    <div class="player-area bottom-safe">
      <div class="player-status"><div><span class="mascot mascot--bear player-mini-avatar" aria-hidden="true"></span><span class="me-badge">나</span><strong>${me.total}점</strong><span class="go-count">${g.humanGoCount ? g.humanGoCount+'고' : '고 없음'}</span></div><span class="player-status__hint">${yourTurn ? (pending ? hwatuFamily(pending)+' 흔들기! 패를 내자' : '내 패를 골라줘!') : '화투패를 모아 7점을 노려봐 ✿'}</span></div>
      ${capturedRack(g)}
      <div class="hand-heading"><strong>내 패 ${hand.length}장</strong> <span>${yourTurn?'패를 눌러 내기':'상대 차례'}</span></div>
      <div class="my-hand" aria-label="내 손패">${hand.length ? hand.map(id=>card(id,{action:yourTurn?'play':null,hint:yourTurn && getMatchingFloorCards(g.floorCards,id).length>0})).join('') : '<span class="no-cards">손패를 모두 냈어!</span>'}</div>
      <div class="action-row"><button type="button" class="action-chip action-chip--auto ${app.autoMode?'is-on':''}" data-action="automode" aria-pressed="${app.autoMode}">자동 ${app.autoMode?'ON':'OFF'}</button>${gameButtons(g)}<button type="button" class="action-chip action-chip--muted sound-control" data-action="sound" aria-label="${app.sound?'소리 켜짐':'소리 꺼짐'}" title="${app.sound?'소리 켜짐':'소리 꺼짐'}">${uiIcon('bell')} ${app.sound?'소리 켜짐':'소리 꺼짐'}</button></div>
    </div>
    ${flash ? (()=>{const moment=specialMoment(flashKind,flash);return `<div class="effect-burst effect-burst--${safe(moment.kind)} ${moment.major?'effect-burst--major':'effect-burst--minor'}" role="status" aria-live="assertive"><span class="effect-burst__illustration" aria-hidden="true"></span><strong class="effect-burst__headline">${safe(moment.title)}</strong>${moment.detail?`<small class="effect-burst__detail">${safe(moment.detail)}</small>`:''}</div>`;})() : ''}
    ${gameOverlay(g)}
  </main>`;
}

function gameOverlay(g) {
  if (overlay==='captures') return capturedGallery(g, galleryOwner);
  if (overlay==='cardbook') return cardbookOverlay();
  if (selectedMatch) {
    return `<div class="modal-shade"><div class="modal-box"><h2>어느 패를 먹을까?</h2><p>같은 무늬가 두 장이야. 원하는 패를 골라줘.</p><p class="decision-timer">남은 선택 시간 <strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초</p>
      <div class="match-choices">${selectedMatch.matches.map(id => card(id,{action:'pickmatch'})).join('')}</div>
      ${btn('취소','cancelmatch','btn--ghost')}</div></div>`;
  }
  if (g.phase === 'awaiting-go-stop' && g.pendingDecision === 'human') {
    return `<div class="modal-shade"><div class="modal-box modal-box--choice"><div class="modal-flower">✿</div><p class="eyebrow">YOUR CHOICE</p><h2>고? 아니면 스톱?</h2><p>현재 <b>${scoreOf(g,'human').total}점</b>! 더 높은 점수에 도전할까?</p><p class="decision-timer">남은 선택 시간 <strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초 · 만료 시 스톱</p>
      <div class="choice-actions">${btn('고! 더 간다','go','btn--warm')}${btn('스톱! 이겼다','stop','btn--primary')}</div></div></div>`;
  }
  if (g.phase === 'awaiting-chongtong' && g.pendingDecision === 'human') {
    return `<div class="modal-shade"><div class="modal-box"><div class="modal-flower">✦</div><h2>총통! 네 장이 모였어!</h2><p>바로 승리하거나 계속 칠 수 있어.</p><p class="decision-timer">남은 선택 시간 <strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초 · 만료 시 스톱</p><div class="choice-actions">${btn('바로 스톱','chongtong-stop','btn--primary')}${btn('계속 치기','chongtong-go','btn--warm')}</div></div></div>`;
  }
  if (g.phase === 'round-ended') {
    const win = g.winner === 'human';
    const nagari = g.roundResult === 'nagari';
    const amount = g.settlement?.displayAmount || 0;
    return `<div class="modal-shade modal-shade--result"><div class="modal-box result-box">
      <div class="result-mascot">${portrait(win?'bear':opponent().animal)}</div>
      <div class="result-star">${nagari?'✿':win?'🏆':'🍂'}</div><p class="eyebrow">ROUND COMPLETE</p>
      <h2>${nagari?'나가리! 다음 판으로':win?'와! 한판 이겼어!':'아쉽다, 다음 판엔 이기자!'}</h2>
      <p>${safe(spokenActionText(g.lastAction))}</p>
      <div class="result-stats"><div><span>이번 판 점수</span><strong>${g.settlement?.finalScore??'-'}점</strong></div><div><span>${nagari?'다음 판 배수':win?'획득 놀이머니':'사용 놀이머니'}</span><strong class="${win?'positive':''}">${nagari?'×'+app.nextMultiplier:(win?'+':'−')+kr(amount)+' 냥'}</strong></div></div>
      <div class="result-wallet">현재 보유 <b>✦ ${kr(app.wallet)}냥</b></div>
      ${btn('다음 판 치기','next','btn--primary btn--wide')}
      ${canEmergencyRecharge(app.wallet)?btn('긴급 무료 충전 +30만 냥','recharge','btn--ghost btn--wide'):''}
      ${btn('메인으로','home','btn--quiet')}
    </div></div>`;
  }
  return '';
}
function helpOverlay() {
  return `<div class="modal-shade"><div class="modal-box help-box"><h2>🎴 꽃맞고, 이렇게 즐겨!</h2>
    <ol><li>첫 판에는 패를 섞고 한 장씩 뽑아 선을 정해. 다음 판은 전 판 승자가 먼저 쳐.</li><li>내 손패를 눌러 바닥에 같은 무늬가 있으면 먹어.</li><li>패가 바닥에 착지하면 더미 한 장을 뒤집고 먹은 패를 가져와.</li><li>내 차례와 고/스톱 선택은 20초! 시간이 끝나면 자동으로 진행돼.</li><li><b>자동 ON</b>이면 내 패도 자동으로 내고, OFF면 직접 골라.</li><li><b>내가 먹은 패</b>는 손패 바로 위에 실제 화투 그림으로 쌓여. 종류를 누르면 모두 크게 펼쳐 보여!</li><li>광·열끗·띠·피를 모아 7점부터 고 또는 스톱!</li><li>고는 더 높은 점수를 노리고, 스톱은 지금 점수로 승리해.</li></ol>
    <p>쌍피·광박·피박·고박·흔들기·폭탄·뻑도 적용돼. 난이도는 AI가 선택하는 수의 수준을 바꾸며 패 분배는 동일한 규칙으로 섞어.</p>
    <div class="help-mini">놀이머니는 전부 무료이고, 현금으로 교환할 수 없어. 현재 기기에만 저장돼.</div>
    ${btn('알겠어!','close','btn--primary btn--wide')}</div></div>`;
}
function cardbookOverlay() {
  const months = Array.from({length:12},(_,i)=>i+1);
  return `<div class="modal-shade"><section class="modal-box cardbook-box" role="dialog" aria-modal="true" aria-label="48장 화투패 도감">
    <div class="gallery-heading"><div><p class="eyebrow">ORIGINAL HWATU × CUTE FRIENDS</p><h2>우리의 48장 화투패</h2></div><button class="gallery-close" type="button" data-action="close" aria-label="닫기">✕</button></div>
    <div class="cardbook-intro"><p>친숙한 원래 화투의 색감·문양·광·띠·쌍피 구분을 유지하고, 동물 친구들을 자연스럽게 더한 고정 화투패야.</p></div>
    <div class="cardbook-legend"><span><b>홍단·청단</b> 글씨 띠</span><span><b>초단·비띠</b> 민무늬</span><span><b>똥쌍피·비쌍피</b> 2장 가치</span><span><b>국진</b> 쌍피 전환</span><span><b>공산</b> 흑백 억새</span></div>
    <div class="cardbook-months">${months.map(month=>{
      const cards=HWATU_CARDS.filter(c=>c.month===month);
      return `<section class="cardbook-month"><h3>${safe(hwatuFamily(month))} <span>${safe(cards[0].monthName)}</span></h3><div class="cardbook-row">${cards.map(c=>`<div class="cardbook-cell">${card(c.id)}<small>${safe(cardBookLabel(c))}</small></div>`).join('')}</div></section>`;
    }).join('')}</div>
    ${btn('도감 닫기','close','btn--primary btn--wide')}
  </section></div>`;
}
function render() {
  let html = app.screen==='opening' && opening ? openingScreen() : app.screen==='select' ? selectScreen() : app.screen==='game' && app.game ? gameScreen() : home();
  if (overlay==='help') html += helpOverlay();
  if (overlay==='cardbook' && app.screen!=='game') html += cardbookOverlay();
  ROOT.removeAttribute('data-card-art');
  ROOT.innerHTML = html;
  syncTurnClock();
}
function clearAutoTimer() {
  clearTimeout(autoTimer);
  autoTimer = null;
}
function updateClockFace() {
  const times = ROOT.querySelectorAll('[data-turn-seconds]');
  const fill = ROOT.querySelector('[data-turn-fill]');
  if (!times.length || !fill || !clockKey) return;
  const left = clockPaused ? clockRemaining : Math.max(0, clockDeadline - performance.now());
  for (const time of times) time.textContent = String(secondsLeft(left));
  const rail = fill.parentElement;
  rail?.classList.toggle('is-urgent', left <= 5000);
  fill.style.width = `${Math.max(0, Math.min(100, left / HUMAN_TURN_MS * 100))}%`;
}
function syncTurnClock() {
  const key = humanTurnSignature(app.screen, app.game);
  if (key !== clockKey) {
    clockKey = key;
    clockRemaining = HUMAN_TURN_MS;
    clockDeadline = performance.now() + HUMAN_TURN_MS;
    clockPaused = false;
    expiredKey = null;
    clearAutoTimer();
  }
  if (!key) {
    clearInterval(clockInterval); clockInterval = null;
    clearAutoTimer();
    return;
  }
  const blocked = turnTransition || !!overlay;
  if (blocked) {
    if (!clockPaused) {
      clockRemaining = Math.max(0, clockDeadline - performance.now());
      clockPaused = true;
    }
    clearInterval(clockInterval); clockInterval = null;
    clearAutoTimer();
  } else {
    if (clockPaused) {
      clockDeadline = performance.now() + clockRemaining;
      clockPaused = false;
    }
    if (!clockInterval) clockInterval = setInterval(() => {
      updateClockFace();
      if (clockKey && performance.now() >= clockDeadline && expiredKey !== clockKey) {
        expiredKey = clockKey;
        clearAutoTimer();
        autoTakeTurn(true);
      }
    }, 150);
    if (app.autoMode && !autoTimer && expiredKey !== clockKey) {
      autoTimer = setTimeout(() => {
        autoTimer = null;
        autoTakeTurn(false);
      }, 650);
    }
  }
  updateClockFace();
}
function autoTakeTurn(forced = false) {
  const g = app.game;
  if ((!forced && !app.autoMode) || !humanTurnSignature(app.screen,g) || turnTransition || overlay) return;
  if (selectedMatch) { humanPlay(selectedMatch.cardId,selectedMatch.matches[0]); return; }
  if (g.phase === 'awaiting-go-stop') { mutate('stop'); return; }
  if (g.phase === 'awaiting-chongtong') { mutate('chongtong-stop'); return; }
  if (g.phase !== 'playing' || g.currentPlayer !== 'human') return;
  try {
    // The selector may advance its private random seed: never mutate the live
    // game state while merely choosing a timed/automatic move.
    const move = chooseAiMove(structuredClone(g), 'human', 'normal').move;
    if (!move) return;
    if (move.kind === 'bomb') { mutate('bomb',String(move.month)); return; }
    if (move.kind === 'flip-only') { mutate('flip'); return; }
    if (move.kind === 'shake') {
      const deckRect = motionOrigin(ROOT.querySelector('.deck-pile .hwatu'));
      const shaken = declareShake(g,'human',move.month);
      const id = shaken.humanHand.find(cardId => getCard(cardId)?.month === move.month);
      if (id) {
        const handRect = motionOrigin(ROOT.querySelector(`.my-hand [data-card="${id}"]`));
        const matches = getMatchingFloorCards(shaken.floorCards,id);
        const result = playTurn(shaken,'human',id,{playedMatchId:matches.length === 2 ? matches[0] : undefined});
        commitGame(result.state,result,{player:'human',handRect,deckRect});
      }
      return;
    }
    const matches = getMatchingFloorCards(g.floorCards,move.cardId);
    humanPlay(move.cardId,move.playedMatchId || (matches.length===2 ? matches[0] : undefined));
  } catch (error) {
    console.error('Automatic turn failed:',error);
    effects('다시 패를 선택해 줘');
    // The countdown must not fire repeatedly after an invalid auto move.
    clearInterval(clockInterval); clockInterval = null;
    clearAutoTimer();
  }
}
function finishRound() {
  const g = app.game;
  if (!g || g.phase!=='round-ended' || app.settledUuid===g.gameUuid) return;
  app.settledUuid = g.gameUuid;
  app.stats.rounds++;
  if (g.roundResult === 'nagari') {
    app.stats.draws++;
    app.nextMultiplier = nextRoundMultiplier(g.roundMultiplier || 1);
  } else {
    const money = Math.max(0, g.settlement?.displayAmount || 0);
    if (g.winner === 'human') {
      app.stats.wins++; app.wallet += money;
      app.stats.high = Math.max(app.stats.high, g.settlement?.finalScore || 0);
      effects('참 잘했어! 승리!', 'win');
    } else {
      app.stats.losses++; app.wallet = Math.max(0, app.wallet-money);
      effects('다음 판은 꼭 이기자!', 'special');
    }
    app.nextMultiplier=1;
  }
}
function showScoreGain(player, points) {
  if (points <= 0 || app.screen !== 'game' || app.game?.phase === 'round-ended') return;
  const anchor = ROOT.querySelector(player === 'human' ? '.player-status strong' : '.score-badge strong');
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  try {
    anchor.animate?.([
      {transform:'scale(1)',filter:'brightness(1)'},
      {transform:'scale(1.3)',filter:'brightness(1.5)',offset:.48},
      {transform:'scale(1)',filter:'brightness(1)'}
    ],{duration:460,easing:'ease-out'});
  } catch { /* Score updates work without visual effects too. */ }
  const celebrant = ROOT.querySelector(player === 'human' ? '.player-mini-avatar' : '.opponent-avatar');
  if (celebrant) {
    celebrant.classList.add('mascot--cheering');
    setTimeout(() => celebrant.classList.remove('mascot--cheering'), 920);
  }
  const pop = document.createElement('span');
  pop.className = `score-gain ${player === 'human' ? 'score-gain--human' : 'score-gain--computer'}`;
  pop.setAttribute('aria-live','polite');
  pop.textContent = `+${points}점`;
  pop.style.left = `${rect.left + rect.width / 2}px`;
  pop.style.top = `${rect.top - 8}px`;
  ROOT.appendChild(pop);
  setTimeout(() => pop.remove(), 950);
}
function showScoreSet(player, combo) {
  if (!combo || app.screen !== 'game') return;
  const anchor = ROOT.querySelector(player === 'human' ? '.player-status' : '.opponent-hud');
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const label = document.createElement('span');
  label.className = `score-set score-set--${player}`;
  label.setAttribute('role','status');
  label.textContent = `${combo.label} 완성! +${combo.points}점`;
  label.style.left = `${Math.max(100, Math.min(window.innerWidth - 100, rect.left + rect.width / 2))}px`;
  label.style.top = `${player === 'human' ? rect.top - 34 : rect.bottom + 22}px`;
  ROOT.appendChild(label);
  setTimeout(() => label.remove(), 1320);
}
function commitGame(next, result=null, motion=null) {
  if (result && motion && app.screen==='game' && !turnTransition) {
    turnTransition = true;
    const scene = ROOT.querySelector('.scene--game');
    scene?.classList.add('is-resolving');
    scene?.setAttribute('aria-busy','true');
    syncTurnClock();
    // Keep the old cards visible while they fly, but checkpoint the resolved
    // engine state now. Reloading during the flight must never replay a turn.
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...app, game: next })); }
    catch { /* In-memory play is still supported when storage is unavailable. */ }
    let wait = 0;
    try { wait = animateResolvedTurn({root:ROOT, result, cardHTML:id=>card(id), sound:cardSound, ...motion}); }
    catch(error) { console.error('Card animation failed; recovering turn:',error); }
    if (wait > 0) {
      turnTransitionTimer = setTimeout(() => {
        turnTransitionTimer = null;
        turnTransition = false;
        commitGame(next,result);
      },wait);
      return;
    }
    turnTransition = false;
  }
  const previous = app.game;
  const scoreGains = previous ? [
    ['human', scoreOf(next,'human').total - scoreOf(previous,'human').total],
    ['computer', scoreOf(next,'computer').total - scoreOf(previous,'computer').total]
  ] : [];
  const completedSets = previous ? ['human','computer'].flatMap(player =>
    newlyCompletedCombos(scoreOf(previous,player),scoreOf(next,player))
      .map(combo => ({player,combo}))) : [];
  app.game = next;
  if (result?.specialEvents?.length) effects(result.specialEvents.map(e=>e.label).join(' · '), 'special', specialPresentation(result)?.kind || 'special');
  finishRound();
  save(); render();
  for (const [player, points] of scoreGains) showScoreGain(player, points);
  for (const {player,combo} of completedSets) showScoreSet(player,combo);
  if (result?.captured?.length && !motion && !result.playedCardId && !result.drawnCardId) cardSound('capture');
  queueAI();
}
function queueAI() {
  clearTimeout(aiTimer);
  if (turnTransition) return;
  const g=app.game;
  if (app.screen!=='game' || !g || g.phase==='round-ended' || selectedMatch) return;
  const computerChoice = g.pendingDecision==='computer' && (g.phase==='awaiting-go-stop' || g.phase==='awaiting-chongtong');
  if (!computerChoice && !(g.phase==='playing' && g.currentPlayer==='computer')) return;
  // commitGame already waits for the throw, flip and capture before the next turn.
  aiTimer = setTimeout(runAI, 420 + (app.difficulty==='hard'?260:app.difficulty==='easy'?100:180));
}
function runAI() {
  const g=app.game;
  if (!g || app.screen!=='game' || turnTransition) return;
  try {
    let next, result=null;
    if (g.phase==='awaiting-go-stop' && g.pendingDecision==='computer') {
      const c=chooseAiGoStop(g,'computer',app.difficulty);
      next=c==='go'?chooseGo(g,'computer'):chooseStop(g,'computer');
      effects(c==='go'?'고!':'스톱!');
    } else if (g.phase==='awaiting-chongtong' && g.pendingDecision==='computer') {
      next=chooseChongtong(g,'computer',chooseAiChongtong(g,app.difficulty));
    } else if (g.phase==='playing' && g.currentPlayer==='computer') {
      const handRect = motionOrigin(ROOT.querySelector('.opponent-hand .hwatu--back'));
      const deckRect = motionOrigin(ROOT.querySelector('.deck-pile .hwatu'));
      const move=chooseAiMove(g,'computer',app.difficulty).move;
      if (!move) return;
      if (move.kind==='bomb') result=playBomb(g,'computer',move.month);
      else if (move.kind==='flip-only') result=playFlipOnlyTurn(g,'computer');
      else if (move.kind==='shake') {
        const staged=declareShake(g,'computer',move.month);
        const target=staged.computerHand.find(id=>getCard(id)?.month===move.month);
        if (target) result=playTurn(staged,'computer',target);
        else return;
      } else result=playTurn(g,'computer',move.cardId,{playedMatchId:move.playedMatchId});
      next=result.state;
      commitGame(next,result,{player:'computer',handRect:move.kind==='flip-only'?deckRect:handRect,deckRect});
      return;
    } else return;
    commitGame(next,result);
  } catch(err) {
    console.error('AI turn failed:',err);
    effects('잠깐! 상대 턴을 복구하고 있어');
    // Avoid a CPU loop while making the error visible.
    clearTimeout(aiTimer);
  }
}
function clearOpening() {
  clearTimeout(openingTimer);
  openingTimer = null;
  opening = null;
}

function finishOpening() {
  if (!opening || !opening.winner || app.screen !== 'opening') return;
  const {seed, winner, rematch} = opening;
  clearOpening();
  app.game = createInitialGame(seed,app.difficulty,app.stake,winner,app.nextMultiplier);
  if (!rematch && app.game.phase !== 'round-ended') {
    app.game.lastAction = `${winner === 'human' ? '내가' : '상대가'} 선 뽑기에서 이겨 먼저 칩니다.`;
  }
  app.screen = 'game';
  app.settledUuid = null;
  save();render();queueAI();
}

function advanceOpening() {
  if (!opening || app.screen !== 'opening') return;
  clearTimeout(openingTimer);
  openingTimer = null;
  if (opening.phase === 'shuffle') {
    opening.phase = opening.rematch ? 'deal' : 'pick';
    cardSound('shuffle');
  } else if (opening.phase === 'reveal') {
    opening.phase = 'deal';
    cardSound('land');
  } else if (opening.phase === 'deal') {
    finishOpening();
    return;
  } else return;
  render();
  if (opening.phase === 'deal') openingTimer = setTimeout(advanceOpening,OPENING_DEAL_MS);
}

function pickOpeningDealer(index) {
  if (!opening || opening.phase !== 'pick' || app.screen !== 'opening') return;
  try {
    opening = revealDealerCards(opening,index);
    cardSound('flip');
    render();
    openingTimer = setTimeout(advanceOpening,OPENING_REVEAL_MS);
  } catch(error) { console.error('Dealer selection failed:',error); }
}

function startNew(rematch = false) {
  app.stake = normalizeStake(app.difficulty,app.stake);
  if (!hasEnoughForTable(app.wallet, app.stake)) {
    overlay=null; effects(canEmergencyRecharge(app.wallet)?'오링! 긴급 충전을 이용해줘!':'더 낮은 판을 선택해줘!');
    app.screen='select'; render(); return;
  }
  const seed=crypto.getRandomValues(new Uint32Array(1))[0] || Date.now();
  clearOpening();clearTimeout(aiTimer);clearAutoTimer();
  opening=createOpeningFlow(seed,{
    previousGame: app.game,
    rematch,
    daytime: new Date().getHours() >= 6 && new Date().getHours() < 18
  });
  if (!rematch) app.game=null;
  app.screen='opening';selectedMatch=null;overlay=null;
  save();render();
  openingTimer=setTimeout(advanceOpening,OPENING_SHUFFLE_MS);
}
function humanPlay(id, matchId) {
  const g=app.game;
  if (!g || turnTransition || g.currentPlayer!=='human' || g.phase!=='playing') return;
  const matches=getMatchingFloorCards(g.floorCards,id);
  if (!matchId && matches.length===2) {
    selectedMatch={cardId:id,matches};render();return;
  }
  selectedMatch=null;
  const handRect = motionOrigin(ROOT.querySelector(`.my-hand [data-card="${id}"]`));
  const deckRect = motionOrigin(ROOT.querySelector('.deck-pile .hwatu'));
  try { const result=playTurn(g,'human',id,{playedMatchId:matchId});commitGame(result.state,result,{player:'human',handRect,deckRect}); }
  catch(err) { console.error(err);effects(err.message || '다른 패를 골라줘');render(); }
}
function mutate(action, value, cardId) {
  if (turnTransition) return;
  switch (action) {
    case 'home': clearOpening();clearTimeout(aiTimer); overlay=null; selectedMatch=null;app.screen='home';save();render();return;
    case 'opening-home': clearOpening();overlay=null;app.screen='home';save();render();return;
    case 'opening-skip': advanceOpening();return;
    case 'pick-dealer': pickOpeningDealer(Number(value));return;
    case 'select': clearOpening();clearTimeout(aiTimer);overlay=null;app.screen='select';save();render();return;
    case 'resume': if (app.game){app.screen='game';render();queueAI()} else {app.screen='select';render()}return;
    case 'difficulty': if(!ALLOWED_STAKES[value])return;app.difficulty=value;app.stake=normalizeStake(value,app.stake);save();render();return;
    case 'stake': if(!canUseStake(app.difficulty,Number(value)))return;app.stake=Number(value);save();render();return;
    case 'start': startNew(false);return;
    case 'next': startNew(true);return;
    case 'recharge':
      if (!canEmergencyRecharge(app.wallet)) { effects('오링일 때만 긴급 충전할 수 있어');render();return; }
      app.wallet+=EMERGENCY_RECHARGE;
      save();effects('긴급 '+kr(EMERGENCY_RECHARGE)+'냥 충전!','win');render();return;
    case 'help': overlay='help';render();return;
    case 'cardbook': overlay='cardbook';render();return;
    case 'captures': if(!app.game)return;galleryOwner=value==='computer'?'computer':'human';overlay='captures';render();return;
    case 'close': overlay=null;render();return;
    case 'sound': app.sound=!app.sound;save();render();return;
    case 'automode':
      app.autoMode = !app.autoMode;
      if (app.autoMode) selectedMatch = null;
      save();render();return;
    case 'play': humanPlay(cardId);return;
    case 'pickmatch': if (selectedMatch) humanPlay(selectedMatch.cardId,cardId);return;
    case 'cancelmatch': selectedMatch=null;render();return;
  }
  const g=app.game;
  if (!g || app.screen!=='game') return;
  try {
    let next=g, result=null;
    if (action==='go') next=chooseGo(g,'human');
    else if (action==='stop') next=chooseStop(g,'human');
    else if (action==='chongtong-go') next=chooseChongtong(g,'human','continue');
    else if (action==='chongtong-stop') next=chooseChongtong(g,'human','stop');
    else if (action==='bomb') { result=playBomb(g,'human',Number(value));next=result.state; }
    else if (action==='shake') { next=declareShake(g,'human',Number(value));effects('흔들기!'); }
    else if (action==='flip') { result=playFlipOnlyTurn(g,'human');next=result.state; }
    else if (action==='gookjin') { const {setGookjinChoice}=awaitImportHack(); next=setGookjinChoice(g,'human',!g.humanGookjinAsDoubleJunk); }
    else return;
    const handCard=result?.playedCardId && ROOT.querySelector(`.my-hand [data-card="${result.playedCardId}"]`);
    const handRect=motionOrigin(handCard || ROOT.querySelector('.my-hand .hwatu'));
    const deckRect=motionOrigin(ROOT.querySelector('.deck-pile .hwatu'));
    commitGame(next,result,result?{player:'human',handRect:action==='flip'?deckRect:handRect,deckRect}:null);
  } catch(err) { console.error(err);effects(err.message||'진행할 수 없어');render(); }
}
// Static import uses this same shared engine. Kept as a small named adapter for the UI.
import { setGookjinChoice } from './engine/gameState';
function awaitImportHack() { return {setGookjinChoice}; }

document.addEventListener('click',e=>{
  const target=e.target.closest('[data-action]');
  if (!target || !ROOT.contains(target)) return;
  mutate(target.dataset.action,target.dataset.value,target.dataset.card);
});
// A finger resting on one of the overlapping hand cards previews the actual
// matching floor card(s). This is visual feedback only: releasing the finger
// still uses the existing single-tap play action and unchanged game rules.
let pressedCardPreview = null;
let pressedCardPreviewTimer = null;
function clearPressedCardPreview() {
  clearTimeout(pressedCardPreviewTimer);
  pressedCardPreviewTimer = null;
  if (!pressedCardPreview) return;
  pressedCardPreview.hand.classList.remove('hwatu--finger-pressed');
  for (const item of pressedCardPreview.floor) item.classList.remove('hwatu--finger-match');
  pressedCardPreview = null;
}
document.addEventListener('pointerdown',e=>{
  if (turnTransition || app.screen !== 'game' || app.game?.currentPlayer !== 'human') return;
  const hand = e.target.closest?.('.my-hand button[data-action="play"][data-card]');
  if (!hand || !ROOT.contains(hand)) return;
  clearPressedCardPreview();
  const matching = new Set(getMatchingFloorCards(app.game.floorCards,hand.dataset.card));
  const floor = [...ROOT.querySelectorAll('.floor-area [data-card]')]
    .filter(item => matching.has(item.dataset.card));
  hand.classList.add('hwatu--finger-pressed');
  for (const item of floor) item.classList.add('hwatu--finger-match');
  pressedCardPreview = {hand,floor};
});
for (const type of ['pointerup','pointercancel']) {
  document.addEventListener(type,()=>{
    if (pressedCardPreview) pressedCardPreviewTimer = setTimeout(clearPressedCardPreview,160);
  });
}
// Prevent browser-native image dragging, long-press selection and context
// menus inside the game. These are not gameplay gestures; ordinary taps,
// keyboard activation and screen-reader button controls remain available.
for (const type of ['contextmenu','dragstart','selectstart']) {
  document.addEventListener(type,e=>{
    if (ROOT.contains(e.target)) e.preventDefault();
  });
}
document.addEventListener('keydown',e=>{
  if (e.key==='Escape') {
    if (selectedMatch) {selectedMatch=null;render()}
    else if (overlay) {overlay=null;render()}
    else if(app.screen==='opening') mutate('opening-home');
    else if(app.screen==='game') mutate('home');
  }
});
finishRound();render();queueAI();
