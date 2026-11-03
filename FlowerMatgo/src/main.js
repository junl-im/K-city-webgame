import { handHint } from './handHint.js';
import './style.css';
import {
  createInitialGame, chooseGo, chooseStop, chooseChongtong,
  playTurn, playBomb, playFlipOnlyTurn, declareShake,
  getMatchingFloorCards, getDrawFloorChoice, getFlipOnlyDrawChoice, isValidGameState, nextRoundMultiplier, scoreFor, setMissionEnabled
} from './engine/gameState';
import { chooseAiCard, chooseAiMove, chooseAiGoStop, chooseAiChongtong } from './engine/ai/strategy';
import { findBombOptions, findShakeOptions } from './engine/rules/specialRules';
import { getCard, HWATU_CARDS } from './engine/cards';
import { ALLOWED_STAKES, STAKES, canUseStake, normalizeStake } from './stakeRules.js';
import { captureDisplayCount, groupedCaptures } from './capturedCards.js';
import { currentBakWarnings } from './bakWarnings.js';
import { opponentSetWarnings } from './opponentSetWarnings.js';
import { missionView } from './missionView.js';
import { doubleOffer } from './doubleStake.js';
import { floorDensity } from './floorLayout.js';
import { artworkOrdinal, cardBookLabel, cardVisualDetails } from './cardDisplay.js';
import { hwatuFamily, spokenActionText, spokenCardName } from './cardNames.js';
import { animateResolvedTurn, motionOrigin } from './turnPresentation.js';
import { eventAnnouncement } from './specialPresentation.js';
import { SPECIAL_FLASH_MS, specialMoment } from './specialMoment.js';
import { cardSoundProfile } from './cardSoundDesign.js';
import { newlyCompletedCombos } from './scoreCombos.js';
import { HUMAN_TURN_MS, HUMAN_TURN_SECONDS, humanTurnSignature, humanChoiceSignature, secondsLeft, shouldRestartClockAfterTurn } from './turnTiming.js';
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
  game: null, settledUuid: null, nextMultiplier: 1, doubleStake: null, sound: true, autoMode: false, missionsEnabled: true, pendingGookjinChoice: false, pendingDrawChoice: null
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
    const held=save.doubleStake;
    if (!held || !Number.isSafeInteger(held.amount) || held.amount<=0 || !save.game) save.doubleStake=null;
    else if (!held.gameUuid && save.game.gameUuid===held.originUuid) {
      // The opening animation itself is not persisted. Refund if interrupted.
      save.wallet += held.amount; save.doubleStake=null;
    }
    save.pendingGookjinChoice = save.pendingGookjinChoice === true && !!save.game?.humanCaptured?.includes('m09-01') && save.settledUuid !== save.game.gameUuid;
    const pending=save.pendingDrawChoice, g=save.game;
    const validTurn=g?.phase==='playing' && g.currentPlayer==='human';
    const expected=validTurn && pending?.kind==='flip' && g.humanBombSkips>0 ? getFlipOnlyDrawChoice(g)
      : validTurn && pending?.kind==='play' && g.humanHand.includes(pending.cardId) ? getDrawFloorChoice(g,pending.cardId,pending.playedMatchId) : null;
    save.pendingDrawChoice=expected && Array.isArray(pending.candidateIds) && expected.drawnCardId===pending.drawnCardId && expected.candidateIds.join(',')===pending.candidateIds.join(',') ? pending : null;
    save.screen = save.game && save.screen === 'game' ? 'game' : 'home';
    return save;
  } catch {
    return base;
  }
}
let app = loadSave();
let overlay = null;
let galleryOwner = 'human';
let galleryType = null;
let selectedMatch = null;
let selectedTriple = app.game?.phase==='playing' && app.game?.currentPlayer==='human' && app.game?.humanPendingShakeMonth ? {month:app.game.humanPendingShakeMonth,mode:'shake'} : null;
let decisionReview = false;
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
function effects(label, kind = 'special', visualKind = kind, silent = false) {
  flash = spokenActionText(label);
  flashKind = visualKind;
  clearTimeout(fxTimer);
  if (!silent) tone(kind);
  fxTimer = setTimeout(() => { flash = '';flashKind = 'special'; if (app.screen === 'game' && app.game?.phase !== 'round-ended' && !turnTransition) render(); }, SPECIAL_FLASH_MS);
}
const RIVALS = [
  {nick:'느긋한 밤톨이',animal:'bear'}, {nick:'장난꾸러기 여울',animal:'fox'},
  {nick:'꽃패의 달인 설이',animal:'cat'}, {nick:'재빠른 단풍이',animal:'redpanda'},
  {nick:'행운의 보리',animal:'bear'}, {nick:'반짝이는 호두',animal:'fox'}, {nick:'달빛 마루',animal:'cat'}, {nick:'승부사 루루',animal:'redpanda'}
];
function opponent() { const level = DIFFICULTIES.find(d => d.id === app.difficulty) || DIFFICULTIES[1]; return ['opening','game'].includes(app.screen) && RIVALS[app.rivalIndex] ? {...level,...RIVALS[app.rivalIndex]} : level; }
function opponentReaction(g, humanScore, computerScore) {
  if (g.phase === 'round-ended') return g.winner === 'computer' ? '헤헤, 이번 판은 내 승리!' : '다음 판은 꼭 이길 거야!';
  if (g.currentPlayer === 'computer') return {
    bear: '으음, 어떤 패를 낼까~?', fox: '헤헷, 이건 내 차례!', cat: '잠깐, 수를 읽는 중이야.'
  }[opponent().animal] || '이번 판도 재미있게!';
  if (humanScore >= 3 && humanScore > computerScore) return '오, 오늘 감이 좋은데?!';
  if (computerScore >= 3 && computerScore > humanScore) return '후후, 나를 따라잡아 봐!';
  return opponent().quote;
}
function characterClass(animal) { return 'mascot mascot--' + animal; }
function portrait(animal, extra = '') { return `<span aria-hidden="true" class="${characterClass(animal)} ${extra}"></span>`; }
function scoreOf(g, p) { return scoreFor(g,p); }

function card(id, options = {}) {
  const item = getCard(id);
  if (!item) return '';
  const visual = cardVisualDetails(item, options);
  const interactive = !!options.action;
  const small = !!options.small;
  const bonus = item.month === 0;
  const [month, ordinal] = bonus ? [0, 0] : [item.month, Number(id.slice(-2))];
  const x = ordinal ? ((artworkOrdinal(id, ordinal) - 1) / 3 * 100).toFixed(5) : 0;
  const y = month ? ((month - 1) / 11 * 100).toFixed(5) : 0;
  const bonusSlot = ['bonus-pee-1','bonus-pee-2','bonus-double-pee-1'].indexOf(id);
  const style = bonus ? `style="--bonus-x:${(Math.max(0,bonusSlot)/2*100).toFixed(5)}%"` : `style="--card-x:${x}%;--card-y:${y}%"`;
  const aria = `${options.shakeHint ? '흔들기 가능 · ' : ''}${spokenCardName(item,{gookjinAsDoubleJunk:options.gookjinAsDoubleJunk})} · ${visual.gookjinConverted ? '쌍피' : item.typeLabel}${options.mission ? ' · 미션패' : ''}`;
  // Every 광 face has its 光 seal printed inside the v19 raster already.
  // No extra bright mark: otherwise the glyph appears twice on small phones.
  const mark = `${visual.doubleJunkText ? `<span class="hwatu__double-mark" aria-hidden="true">${visual.doubleJunkText}</span>` : ''}${options.mission ? '<span class="mission-card-mark" aria-hidden="true">미션</span>' : ''}`;
  const classes = `hwatu hwatu--month-${String(month).padStart(2,'0')} hwatu--ordinal-${String(ordinal).padStart(2,'0')} ${small?'hwatu--small':''} ${options.tiny?'hwatu--tiny':''} ${bonus?'hwatu--bonus':''} ${options.pileIndex?'hwatu--pile-'+options.pileIndex:''} ${interactive?'hwatu--interactive':''} ${options.matchHint?(interactive?'hwatu--match-hint':'hwatu--match-idle'):''} ${options.quietHint?'hwatu--quiet-hint':''} ${options.bonusHint?'hwatu--bonus-hint':''} ${visual.gookjinConverted?'hwatu--converted':''}`;
  return `<${interactive ? 'button' : 'div'} class="${classes}" ${style} data-card="${safe(id)}" ${interactive ? `type="button" data-action="${options.action}" aria-label="${safe(aria)} ${['pickmatch','draw-choice'].includes(options.action)?'먹기':'내기'}"` : `role="img" aria-label="${safe(aria)}" title="${safe(aria)}"`}>
    ${bonus ? `<span class="hwatu__face"></span><span class="hwatu__bonus-banner" aria-hidden="true">보너스</span><span class="hwatu__bonus-mark" aria-hidden="true">${safe(item.typeLabel)}</span>` : `<span class="hwatu__face"></span>${mark}${options.shakeHint ? '<span class="hwatu__shake-hint" aria-hidden="true"></span>' : ''}`}
  </${interactive ? 'button' : 'div'}>`;
}
function cardBack(small = false) {
  return `<span aria-label="뒷면 화투패" class="hwatu hwatu--back ${small?'hwatu--small':''}"><span class="hwatu__face"></span></span>`;
}
function uiIcon(name) { return `<span class="ui-icon ui-icon--${name}" aria-hidden="true"></span>`; }
function brand() { return `<div class="brand"><span class="brand__bloom">${uiIcon('bloom')}</span><span>곰같은여우의 <b>라니맞고</b></span></div>`; }
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
    <div class="opening-stage"><p class="opening-kicker">✿ 라니맞고 한판 준비 ✿</p><h1>${titles[phase]}</h1><p class="opening-description">${descriptions[phase]}</p>
      ${illustration}
      ${phase==='pick'?'':`<button type="button" class="opening-skip" data-action="opening-skip">${phase==='shuffle'?'선 정하기로':'바로 진행'} ›</button>`}
    </div><div class="opening-friends" aria-hidden="true">${portrait('bear')}${portrait('fox')}${portrait('cat')}</div>
  </main>`;
}

function home() {
  const resume = app.game && (app.game.phase !== 'round-ended' || (app.game.roundResult === 'nagari' && !!app.doubleStake));
  return `<main class="scene scene--home">
    <header class="nav top-safe">${brand()}<span class="top-pill">✿ 동물 친구들의 꽃놀이마당</span></header>
    <section class="home-content">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot">✿</span> 오늘도 꽃놀이마당 OPEN <span class="eyebrow-dot">✿</span></p>
        <h1 class="home-logo"><small>곰같은여우의</small><img class="rani-title-art" src="${import.meta.env.BASE_URL}assets/rani-title-v1.png" alt="라니맞고" width="900" height="300"></h1>
        <p class="hero-hook">라니와 함께, 한판 할까?</p>
        <p class="lead">밤톨이, 여울, 설이가 기다리는<br><strong>웃음꽃 피는 맞고 한판!</strong></p>
        <p class="home-invite">♧ 익숙한 화투, 우리 친구들만의 반짝이는 승부 ♧</p>
        <div class="home-actions">
          ${btn(`${resume ? '이어서 한판!' : '게임 시작!'}`, resume ? 'resume' : 'select', 'btn--primary btn--huge btn--jewel')}
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
        ${btn(canEnter?'라니맞고 시작하기':'놀이머니가 부족해요','start','btn--primary btn--huge')}
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

function capturedRack(g, who='human') {
  const human=who==='human', cards=human?g.humanCaptured:g.computerCaptured;
  const asDoubleJunk=human?g.humanGookjinAsDoubleJunk:g.computerGookjinAsDoubleJunk;
  const score=scoreOf(g,who);
  const warnings=currentBakWarnings(score,scoreOf(g,human?'computer':'human'),cards.length,g.pointValue);
  const setWarnings=human ? [] : opponentSetWarnings(g);
  return `<div class="collection-rack ${human?'collection-rack--human':'collection-rack--opponent'}" aria-label="${human?'내가':'상대가'} 먹은 실제 화투패">
    <div class="collection-groups">${groupedCaptures(g,who).map(group => `
      <button class="collection-group" type="button" data-capture-type="${group.id}" data-empty="${group.cards.length===0}" data-action="captures" data-value="${who}:${group.id}" aria-label="${human?'내':'상대'}가 먹은 ${group.name} 카드 ${group.cards.length}장${group.id==='junk'?` · 점수 계산 ${captureDisplayCount(group,score)}장`:''} 전체 보기">
        ${warnings.includes(group.id==='junk'?'피박 주의':group.id==='bright'?'광박 주의':'') ? `<span class="rack-warning" role="status">${group.id==='junk'?'피박 주의':'광박 주의'}</span>` : ''}${setWarnings.some(w=>w.group===group.id) ? `<span class="opponent-set-warning" role="status">${setWarnings.filter(w=>w.group===group.id).map(w=>w.label.replace(' 비상','')).join('·')} 비상</span>` : ''}<span class="collection-preview">${group.cards.length ? group.cards.map((id,index)=>`<span class="capture-stack-card">${card(id,{tiny:true,gookjinAsDoubleJunk:asDoubleJunk})}${group.id==='junk' && index===group.cards.length-1 ? `<span class="capture-pi-count" aria-label="피 ${score.junkCount}장">${score.junkCount}</span>` : ''}</span>`).join('') : ''}
          </span>
      </button>`).join('')}</div>
  </div>`;
}
function capturedGallery(g, who, selectedType) {
  const groups=groupedCaptures(g,who);
  const selected=groups.find(group=>group.id===selectedType);
  if (selected) {
    groups.splice(groups.indexOf(selected),1);
    groups.unshift(selected);
  }
  const count=(who==='human'?g.humanCaptured:g.computerCaptured).length;
  const score=scoreOf(g,who);
  return `<div class="modal-shade"><section class="modal-box gallery-box" role="dialog" aria-modal="true" aria-label="먹은 화투패 전체 보기">
    <div class="gallery-heading"><div><p class="eyebrow">MY FLOWER CARDS</p><h2>${who==='human'?'내가 먹은 패':'상대가 먹은 패'} <small>${count}장</small></h2></div><button class="gallery-close" type="button" data-action="close" aria-label="닫기">✕</button></div>
    <p class="gallery-note">${selected?`${selected.name} 패를 먼저 보여드려요. 다른 종류도 아래에서 확인할 수 있어요.`:'같은 종류의 화투패를 모아 점수를 만들어요. 패를 크게 보고 확인해 봐!'}</p>
    <details class="gallery-score"><summary><span>점수 내역 <strong>${score.total}점</strong></span><span class="gallery-score__toggle" aria-hidden="true"></span></summary><div class="gallery-score__body">
      ${score.lines.length?`<ul>${score.lines.map(line=>`<li><span><b>${safe(line.label)}</b><small>${safe(line.description)}</small></span><strong>${line.points > 0 ? '+' : ''}${line.points}점</strong></li>`).join('')}</ul>`:'<p>아직 점수가 되는 조합이 없어요.</p>'}
      <p>쌍피와 보너스피는 점수 계산 시 2장 이상으로 셉니다.</p>
    </div></details>
    ${groups.map(group=>`<section class="gallery-section"><div class="gallery-section-head"><strong>${group.name}</strong><span>${group.cards.length}장${group.id==='junk' && score.junkCount!==group.cards.length?` · 피 계산 ${score.junkCount}`:''}</span></div><div class="gallery-cards">${group.cards.length?group.cards.map(id=>card(id,{gookjinAsDoubleJunk:who==='human'?g.humanGookjinAsDoubleJunk:g.computerGookjinAsDoubleJunk})).join(''):'<span class="gallery-empty">아직 먹은 패가 없어요</span>'}</div></section>`).join('')}
    ${btn('돌아가기','close','btn--primary btn--wide')}
  </section></div>`;
}

function gameButtons(g) {
  const actions = [];
  if (g.phase === 'playing' && g.currentPlayer === 'human') {
    for (const b of findBombOptions(g.humanHand, g.floorCards, true)) {
      actions.push(`<button data-action="bomb" data-value="${b.month}" class="action-chip action-chip--warm" type="button">${hwatuFamily(b.month)} 폭탄</button>`);
    }
    for (const b of findShakeOptions(g.humanHand, g.floorCards, g.humanShakenMonths || [])) {
      actions.push(`<button data-action="shake" data-value="${b.month}" class="action-chip" type="button">${hwatuFamily(b.month)} 흔들기</button>`);
    }
    if (g.humanBombSkips > 0 && !g.humanHand.length) {
      actions.push(`<button data-action="flip" class="action-chip" type="button">↻ 더미 뒤집기</button>`);
    }
  }
  if (g.humanCaptured.includes('m09-01') && ((g.phase==='playing' && g.currentPlayer==='human') || (g.phase==='awaiting-go-stop' && g.pendingDecision==='human'))) {
    actions.push(`<button data-action="gookjin" class="action-chip" type="button">🍶 국진: ${g.humanGookjinAsDoubleJunk?'쌍피':'열끗'}</button>`);
  }
  return actions.join('');
}
// Preview uses its own non-card markup so deck flight animation still targets
// the real face-down deck, never one of the mission thumbnails.
function missionEffectLabel(effect) {
  if (!effect) return '패마다 배수';
  if (effect.kind==='points') return `점수 ${effect.value>0?'+':''}${effect.value}점`;
  if (effect.kind==='multiplier') return `정산 ×${effect.value}`;
  return effect.kind==='steal' ? '피 뺏기' : '피 주기';
}
function missionCompactLabel(mission) {
  const effect = mission.effect;
  if (mission.unconditional) return `무조건 ×${effect.value}배`;
  if (!effect) return `×${mission.humanMultiplier}배`;
  if (effect.kind === 'points') return `${effect.value > 0 ? '+' : ''}${effect.value}점`;
  if (effect.kind === 'multiplier') return `×${effect.value}배`;
  return effect.kind === 'steal' ? '피 뺏기' : '피 주기';
}
function switchContents(enabled, completed = false) {
  return `<span class="game-switch__track" aria-hidden="true"><span class="game-switch__thumb"></span></span><span class="game-switch__label">${completed || (enabled ? '켬' : '끔')}</span>`;
}
function missionPanel(mission) {
  if (!mission) return '<div class="mission-empty">이번 판 미션 없음</div>';
  const effect=mission.unconditional ? `무조건 ${missionEffectLabel(mission.effect)}` : missionEffectLabel(mission.effect);
  const accessible=mission.targets.map(target => spokenCardName(getCard(target.id))+': '+(target.owner==='human'?'내가 획득':target.owner==='computer'?'상대 획득':'미획득')).join(', ');
  const thumbs=mission.targets.map(target => {
    const item=getCard(target.id), ordinal=Number(target.id.slice(-2));
    const x=((artworkOrdinal(target.id,ordinal)-1)/3*100).toFixed(5), y=((item.month-1)/11*100).toFixed(5);
    return `<span class="mission-mini mission-mini--${target.owner || 'open'}" style="--mission-x:${x}%;--mission-y:${y}%"><span class="mission-mini__face"></span>${target.owner ? `<span class="mission-mini__owner">${target.owner==='human'?'나':'상대'}</span>` : ''}</span>`;
  }).join('');
  return `<div class="mission-widget"><button type="button" class="mission-panel" data-action="mission" aria-label="미션: ${safe(accessible)}. ${safe(effect)}. ${mission.requiredCount ? `목표 ${mission.requiredCount}장, 나 ${mission.humanCount}장, 상대 ${mission.computerCount}장.` : ''} 자세히 보기"><span class="mission-panel__title" aria-hidden="true">미션</span><span class="mission-panel__content" aria-hidden="true"><span class="mission-panel__cards">${thumbs}</span><span class="mission-panel__reward">${mission.unconditional ? `<span class="mission-unconditional-art" aria-hidden="true"></span><strong>×${mission.effect.value}배</strong>` : `<strong>${safe(missionCompactLabel(mission))}</strong>`}${mission.requiredCount ? `<small>${mission.humanCount}/${mission.requiredCount}</small>` : ''}</span></span></button><button type="button" class="mission-toggle" data-action="mission-toggle" aria-label="${mission.locked?'종료된 미션은 변경할 수 없어요':`미션 사용 ${mission.enabled?'끄기':'켜기'}`}" aria-pressed="${mission.enabled}" ${mission.locked?'disabled title="종료된 미션은 변경할 수 없어요"':''}>${switchContents(mission.enabled, mission.failed ? '종료' : mission.locked ? '완료' : '')}</button></div>`;
}

function autoButtonContent(enabled) {
  return `<span class="auto-control__icon" aria-hidden="true"></span><span class="auto-control__title">자동치기</span><span class="auto-control__state">${enabled?'켜짐':'꺼짐'}</span>`;
}

function gameScreen() {
  const g = app.game;
  if (!g) return home();
  const me = scoreOf(g,'human');
  const ai = scoreOf(g,'computer');
  const yourTurn = g.phase==='playing' && g.currentPlayer==='human';
  const pending = g.humanPendingShakeMonth;
  const mission = missionView(g);
  const isMission = id => !!mission && mission.enabled && (!mission.effect || !mission.resolvedBy) && mission.targets.some(target => target.id === id);
  const specialActionButtons = gameButtons(g);
  const shakeMonths = new Set(g.phase === 'playing' && !pending ? findShakeOptions(g.humanHand, g.floorCards, g.humanShakenMonths || []).map(option => option.month) : []);
  const hand = [...g.humanHand].sort((a,b)=>((getCard(a)?.month||0)-(getCard(b)?.month||0)));
  const floor = [...g.floorCards].sort((a,b)=>(getCard(a)?.month||0)-(getCard(b)?.month||0));
  const active = g.phase==='playing' ? (yourTurn?'내 차례':'상대 차례') : g.phase==='awaiting-go-stop' ? '고 / 스톱 선택' : g.phase==='awaiting-chongtong'?'총통!':'한 판 종료';
  const opponentMood = g.phase==='round-ended' ? (g.winner==='computer'?'victory':'surprised')
    : !yourTurn ? 'thinking' : ai.total > me.total ? 'confident' : ai.total < me.total ? 'surprised' : 'ready';
  return `<main class="scene scene--game" data-game-uuid="${safe(g.gameUuid)}">
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
      <div class="captured-grid">${capturedRack(g,'computer')}</div>
      <div class="mission-status-row">${missionPanel(mission)}<div class="center-status"><span class="status-orb"></span>${active}<span class="round-counter">${g.turnNumber+1}턴</span>${(g.roundMultiplier || 1)>1?`<strong class="round-multiplier" aria-label="이번 판 정산 ${g.roundMultiplier}배">${g.roundMultiplier}배 판</strong>`:''}${app.doubleStake?.gameUuid===g.gameUuid?`<strong class="round-multiplier">×${app.doubleStake.level || 2} 도전 · ${kr(app.doubleStake.amount)}냥</strong>`:''}</div></div>
      <div class="field-heading"><strong>바닥패 ${floor.length}장</strong><span>같은 무늬를 맞춰 획득!</span></div>
      <div class="field-row">
        <div class="deck-pile">${cardBack()}<small>남은 패 <b>${g.drawPile.length}</b></small></div>
        <div class="floor-area" data-density="${floorDensity(floor.length)}" aria-label="바닥에 놓인 화투패">${floor.length ? floor.map(id=>{const pile=(g.ppeokPiles||[]).find(p=>p.cardIds.includes(id)); if(!pile) return card(id,{mission:isMission(id)}); const ids=floor.filter(cardId=>pile.cardIds.includes(cardId)); return id===ids[0] ? `<span class="floor-pile" aria-label="싼 패 ${ids.length}장">${ids.map((cardId,index)=>card(cardId,{pileIndex:index+1,mission:isMission(cardId)})).join('')}</span>` : '';}).join('') : '<div class="empty-floor">바닥패가 없어요 ✿</div>'}</div>
      </div>
      <div class="game-message" aria-live="polite" title="${safe(spokenActionText(g.lastAction))}">${safe(spokenActionText(g.lastAction))}</div>
    </div>
    <div class="player-area bottom-safe">
      <div class="player-status"><div><span class="mascot mascot--bear player-mini-avatar" aria-hidden="true"></span><span class="me-badge">나</span><strong>${me.total}점</strong><span class="go-count">${g.humanGoCount ? g.humanGoCount+'고' : '고 없음'}</span></div>${specialActionButtons ? `<span class="special-controls" role="group" aria-label="가능한 특수 행동">${specialActionButtons}</span>` : ''}${flash && flashKind !== 'event-list' ? `<span class="event-plaque" role="status" aria-live="polite">${safe(specialMoment(flashKind,flash).title)}</span>` : ''}</div>
      ${capturedRack(g)}
      <div class="hand-heading"><strong>내 패 ${hand.length}장</strong> <span>${yourTurn?'패를 눌러 내기':'상대 차례'}</span></div>
      <div class="hand-workspace">
      <div class="my-hand" aria-label="내 손패">${hand.length ? hand.map(id=>card(id,{mission:isMission(id),shakeHint:shakeMonths.has(getCard(id)?.month),action:yourTurn?'play':null,matchHint:(!yourTurn || !pending || getCard(id)?.month===pending) && handHint(g,id)==='match',quietHint:handHint(g,id)==='dead',bonusHint:handHint(g,id)==='bonus'})).join('') : ((g.humanBombSkips || 0)?'':'<span class="no-cards">손패를 모두 냈어!</span>')}${Array.from({length:g.humanBombSkips || 0},(_,index)=>`<button type="button" class="bomb-empty-card" data-action="flip" aria-label="폭탄 빈 패 ${index+1}, 사용하면 더미만 뒤집기" ${yourTurn && !pending?'':'disabled'}><span class="bomb-empty-label">폭탄패</span></button>`).join('')}</div>
        <span class="player-controls">${humanTurnSignature(app.screen,g) ? `<span class="turn-clock" role="timer" aria-label="내 차례 남은 시간"><span class="turn-clock__time"><strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초</span><span class="turn-clock__rail"><span class="turn-clock__fill" data-turn-fill></span></span></span>` : '<span class="turn-clock turn-clock--waiting">상대 차례</span>'}<button type="button" class="action-chip action-chip--auto ${app.autoMode?'is-on':''}" data-action="automode" aria-label="자동 치기 ${app.autoMode?'끄기':'켜기'}" aria-pressed="${app.autoMode}">${autoButtonContent(app.autoMode)}</button></span>
      </div>
    </div>

    ${flash && ['event-list','go','shake'].includes(flashKind) ? `<div class="central-event" aria-hidden="true">${safe(specialMoment(flashKind,flash).title)}</div>` : ''}
    <div class="turn-countdown" aria-hidden="true" hidden><strong></strong></div>
    ${gameOverlay(g)}
  </main>`;
}

function missionOverlay(g) {
  const mission=missionView(g);
  if (!mission) return '';
  return `<div class="modal-shade modal-shade--decision"><section class="modal-box mission-dialog" role="dialog" aria-modal="true" aria-labelledby="mission-title">
    <h2 id="mission-title">미션</h2><p>${mission.unconditional ? `조건 없이 승자의 정산에 ×${mission.effect.value}배가 적용돼요. 판이 끝나기 전 켜고 끌 수 있어요.` : mission.effect ? `미션패 ${mission.requiredCount || 1}장을 먼저 획득한 사람에게 ${safe(missionEffectLabel(mission.effect))} 효과가 적용돼요. 배수는 승리 정산에 반영돼요.` : '미션패를 한 장씩 먹을 때마다 그 사람의 미션 배수가 두 배가 돼요.'}</p>
    <div class="mission-targets">${mission.targets.map(target=>`<div class="mission-target">${card(target.id,{small:true})}<small>${target.owner==='human'?'내가 획득':target.owner==='computer'?'상대 획득':'미획득'}</small></div>`).join('')}</div>
    <p class="mission-progress">${mission.effect ? (mission.resolvedBy ? (!mission.enabled?'미션 꺼짐 · 효과 없음':mission.resolvedBy==='human'?'내가 완료':'상대가 완료') : mission.failed ? '달성 가능한 패가 남지 않았어요' : (mission.enabled?'나 '+mission.humanCount+'/'+(mission.requiredCount||1)+' · 상대 '+mission.computerCount+'/'+(mission.requiredCount||1):'미션 꺼짐')) : `나 ${mission.humanCount}장 · ×${mission.humanMultiplier} <span>상대 ${mission.computerCount}장 · ×${mission.computerMultiplier}</span>`}</p>
    <p class="mission-note">${mission.effect ? '미션패의 위치는 공개되지 않아요. 꺼진 동안 목표 장수를 채우면 효과 없이 종료돼요. 이동할 피가 없으면 피 이동 효과가 없어요.' : '미션패 3장이 모두 획득되기 전까지 켜고 끌 수 있어요. 꺼져 있으면 미션 배수는 적용되지 않아요.'}</p>
    ${btn('돌아가기','close','btn--primary btn--wide')}
  </section></div>`;
}

function gameOverlay(g) {
  if (app.pendingGookjinChoice || overlay==='gookjin-choice') return `<div class="modal-shade modal-shade--decision"><section class="modal-box modal-box--choice" role="dialog" aria-modal="true" aria-labelledby="gookjin-choice-title">
    <div class="decision-kicker">국진 · 9월 열끗</div><h2 id="gookjin-choice-title">국진을 어떻게 쓸까요?</h2><p class="decision-hint">열끗 또는 피 두 장으로 계산해요. 나중에 다시 바꿀 수 있어요.</p>
    <div class="gookjin-card">${card('m09-01')}</div><div class="choice-actions"><button type="button" class="btn decision-option" data-action="gookjin-set" data-value="animal"><strong>열끗으로</strong><small>그림 패</small></button><button type="button" class="btn decision-option decision-option--go" data-action="gookjin-set" data-value="junk"><strong>쌍피로</strong><small>피 2장</small></button></div>${choiceTimer()}</section></div>`;
  if (overlay==='mission') return missionOverlay(g);
  if (overlay==='captures') return capturedGallery(g, galleryOwner, galleryType);
  if (overlay==='cardbook') return cardbookOverlay();
  if (app.pendingDrawChoice) {
    const choice=app.pendingDrawChoice;
    return `<div class="modal-shade modal-shade--decision"><section class="modal-box modal-box--match" role="dialog" aria-modal="true" aria-labelledby="draw-choice-title"><div class="decision-kicker">더미에서 나올 패 미리보기</div><div class="draw-choice-context">${choice.kind==='play'?`<div><small>선택한 내 손패</small>${card(choice.cardId)}</div><span aria-hidden="true">→</span>`:''}<div><small>더미에서 나올 패</small>${card(choice.drawnCardId)}</div></div><h2 id="draw-choice-title">이 패와 맞는 바닥패를 골라요</h2><p class="decision-hint">아래는 바닥에 놓인 패입니다. 함께 가져갈 한 장을 선택하세요.</p><div class="match-choices" role="group" aria-label="뒤집은 패와 맞는 바닥패">${choice.candidateIds.map(id=>card(id,{action:'draw-choice'})).join('')}</div>${choiceTimer()}</section></div>`;
  }
  if (selectedTriple) {
    const triple=selectedTriple, ids=g.humanHand.filter(id=>getCard(id)?.month===triple.month);
    const bomb=findBombOptions(g.humanHand,g.floorCards,true).some(b=>b.month===triple.month && b.kind==='three-card-bomb');
    return `<div class="modal-shade modal-shade--decision"><section class="modal-box modal-box--match triple-choice" role="dialog" aria-modal="true" aria-labelledby="triple-title"><div class="decision-kicker">${hwatuFamily(triple.month)} 세 장</div><h2 id="triple-title">${triple.mode==='shake'?'낼 패 한 장을 골라주세요':'어떻게 낼까요?'}</h2><p class="decision-hint">${triple.mode==='shake'?'흔들기를 선언했어요. 세 장 중 한 장을 내세요.':'흔들거나 폭탄으로 한 번에 낼 수 있어요.'}</p><div class="match-choices">${ids.map(id=>card(id,{action:triple.mode==='shake'?'triple-shake-card':null})).join('')}</div>${triple.mode==='choice'?`<div class="choice-actions"><button class="btn decision-option" type="button" data-action="triple-shake"><strong>흔들기</strong><small>한 장 골라 내기</small></button>${bomb?'<button class="btn decision-option decision-option--go" type="button" data-action="triple-bomb"><strong>폭탄</strong><small>세 장 내고 빈 차례 2회</small></button>':''}</div><div class="triple-secondary"><button type="button" class="btn btn--ghost" data-action="triple-ordinary">그냥 한 장 내기</button><button type="button" class="btn btn--quiet" data-action="triple-cancel">돌아가기</button></div>`:''}${choiceTimer()}</section></div>`;
  }
  if (selectedMatch) {
    return `<div class="modal-shade modal-shade--decision"><section class="modal-box modal-box--match" role="dialog" aria-modal="true" aria-labelledby="match-choice-title" aria-describedby="match-choice-help">
      <div class="decision-kicker">같은 무늬 2장</div><h2 id="match-choice-title">먹을 패를 골라줘!</h2>
      <p id="match-choice-help" class="decision-hint">패나 이름을 누르면 바로 획득해.</p>
      <div class="match-choices" role="group" aria-label="먹을 화투패 선택">${selectedMatch.matches.map((id,index)=>`<div class="match-choice" data-action="pickmatch" data-card="${safe(id)}"><span class="match-choice__number">${index+1}번 패</span>${card(id,{action:'pickmatch'})}<small class="match-choice__name">${safe(spokenCardName(getCard(id)))}</small></div>`).join('')}</div>
      ${choiceTimer()}
      <div class="decision-cancel">${btn('돌아가기','cancelmatch','btn--ghost')}</div></section></div>`;
  }
  if (g.phase === 'awaiting-go-stop' && g.pendingDecision === 'human') {
    if (decisionReview) return `<div class="decision-review" role="region" aria-label="고 스톱 결정 전 판 확인"><span>판 확인 중 · 시간 일시정지</span><button type="button" data-action="decision-return">고·스톱 선택으로</button></div>`;
    return `<div class="modal-shade modal-shade--decision"><section class="modal-box modal-box--choice" role="dialog" aria-modal="true" aria-labelledby="go-stop-title" aria-describedby="go-stop-help">
      <div class="decision-kicker">이번 판 선택</div><h2 id="go-stop-title">고? 아니면 스톱?</h2>
      <div class="decision-score"><span>현재 내 점수</span><strong>${scoreOf(g,'human').total}<small>점</small></strong></div>
      <p id="go-stop-help" class="decision-hint">계속 도전할까, 지금 점수로 이길까?</p>
      <button type="button" class="decision-review-button" data-action="decision-review">내 패와 상대 패 확인하기</button>
      <div class="choice-actions" role="group" aria-label="고 또는 스톱">
        <button type="button" class="btn decision-option decision-option--go" data-action="go"><strong>고!</strong><small>더 치기</small></button>
        <button type="button" class="btn decision-option decision-option--stop" data-action="stop"><strong>스톱!</strong><small>지금 끝내기</small></button>
      </div>
      <p class="decision-timer" role="timer" aria-label="결정 남은 시간">남은 시간 <strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초 · 시간 종료 시 스톱, 자동 ON</p>
    </section></div>`;
  }
  if (g.phase === 'awaiting-chongtong' && g.pendingDecision === 'human') {
    return `<div class="modal-shade"><div class="modal-box"><div class="modal-flower">✦</div><h2>총통! 네 장이 모였어!</h2><p>바로 승리하거나 계속 칠 수 있어.</p><p class="decision-timer">남은 선택 시간 <strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초 · 만료 시 스톱, 자동 ON</p><div class="choice-actions">${btn('바로 스톱','chongtong-stop','btn--primary')}${btn('계속 치기','chongtong-go','btn--warm')}</div></div></div>`;
  }
  if (g.phase === 'round-ended') {
    const nagari = g.roundResult === 'nagari';
    const win = g.winner === 'human' && !nagari;
    const outcome = nagari ? 'draw' : win ? 'win' : 'lose';
    const amount = Math.max(0, g.settlement?.displayAmount || 0);
    const myScore = scoreOf(g,'human').total;
    const rivalScore = scoreOf(g,'computer').total;
    const winningCards = nagari ? [] : (win ? g.humanCaptured : g.computerCaptured).slice(-3);
    const finalPoints = g.settlement?.finalScore;
    const offer = doubleOffer(g);
    const canDouble = !!offer && !app.doubleStake && hasEnoughForTable(app.wallet-offer.amount, g.pointValue);
    return `<div class="modal-shade modal-shade--result"><section class="modal-box result-box result-box--${outcome}" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div class="result-ribbon" aria-label="이번 판 결과">${nagari?'다시 승부!':win?'내가 이겼어!':'상대 승리'}</div>
      <div class="result-hero">${!nagari ? `<span class="result-medal result-medal--${win?'win':'lose'}" aria-label="${win?'승리':'패배'}">${win?'승':'패'}</span>` : ''}<div class="result-mascot">${portrait(nagari?'fox':win?'bear':opponent().animal)}</div>
        <div class="result-hero__words"><h2 id="result-title">${nagari?'나가리! 다음 판으로':win?'와! 한판 이겼어!':'아쉽다, 다음 판엔 이기자!'}</h2>
          <p>${nagari?'이번 판은 승패 없이 끝났어. 다음 판에서 다시 겨뤄!':safe(spokenActionText(g.lastAction))}</p></div></div>
      <div class="result-duel" role="group" aria-label="이번 판 점수 비교">
        <div class="result-duel__player ${win?'is-winner':''}"><span>나</span><strong>${myScore}<small>점</small></strong>${win?'<em>승리</em>':''}</div>
        <span class="result-duel__versus" aria-hidden="true">:</span>
        <div class="result-duel__player ${!nagari&&!win?'is-winner':''}"><span>${safe(opponent().nick)}</span><strong>${rivalScore}<small>점</small></strong>${!nagari&&!win?'<em>승리</em>':''}</div>
      </div>
      ${winningCards.length ? `<div class="result-card-peek" aria-label="승자의 획득 화투패 일부"><span>승자의 패</span><div class="result-card-peek__cards">${winningCards.map(id=>card(id,{small:true,gookjinAsDoubleJunk:win?g.humanGookjinAsDoubleJunk:g.computerGookjinAsDoubleJunk})).join('')}</div></div>` : ''}
      ${win ? `<div class="result-prize"><span>이번 판 획득${g.doublePayout ? '<br>더블 승리금 포함' : ''}</span><strong>+${kr(amount+(g.doublePayout || 0))} <small>냥</small></strong></div>` : ''}
      ${offer && canDouble ? `<div class="double-offer"><button type="button" class="double-offer__button" data-action="next-double" aria-describedby="double-offer-help"><span>묻고 더블로!</span><strong>×${offer.level}</strong></button><p id="double-offer-help">${kr(offer.amount)}냥 걸기 · 승리 시 ${kr(offer.amount*2)}냥 받기<br>패배 시 건 금액을 잃어요. 다음 판 정산은 별도예요.</p></div>` : offer ? `<p class="double-explanation">묻고 더블로 ×${offer.level}: 승리금을 걸고 남은 놀이머니가 부족해 선택할 수 없어요.</p>` : ''}
      ${!win ? `<div class="result-stats"><div><span>${nagari?'이번 판 결과':'정산 점수'}</span><strong>${nagari?'무승부':finalPoints==null?'—':finalPoints+'점'}</strong></div><div><span>${nagari?'다음 판 배수':'사용 놀이머니'}</span><strong>${nagari?'×'+app.nextMultiplier:'−'+kr(amount)+' 냥'}</strong></div></div>` : ''}
      ${!nagari && g.settlement?.steps?.length ? `<details class="settlement-details"><summary>정산 과정 보기 · 미션 ×${g.settlement.missionMultiplier || 1}</summary><ol>${g.settlement.steps.map(step=>`<li><span>${safe(step.label)}</span><strong>${safe(step.formula)} = ${kr(step.value)}점</strong></li>`).join('')}</ol>${g.settlement.paymentExemptReason ? `<p>${safe(g.settlement.paymentExemptReason)}</p>` : ''}</details>` : ''}
      <div class="result-wallet">보유 놀이머니 <b>✦ ${kr(app.wallet)}냥</b></div>
      ${nagari && app.doubleStake ? `<p class="double-explanation">걸어 둔 승리금 ${kr(app.doubleStake.amount)}냥은 다음 판으로 이어집니다.</p>` : ''}
      ${!win && !nagari && g.doubleForfeit ? `<p class="double-explanation">이전 판에서 걸어 둔 승리금 ${kr(g.doubleForfeit)}냥을 잃었습니다.</p>` : ''}
      <div class="result-actions">
        ${btn('다음 판 치기','next','btn--primary btn--wide')}
        ${canEmergencyRecharge(app.wallet)?btn('긴급 무료 충전 +30만 냥','recharge','btn--ghost btn--wide'):''}
        ${btn('그만치기','home','btn--quiet')}</div>
    </section></div>`;
  }
  return '';
}
function choiceTimer() { return `<p class="decision-timer" role="timer" aria-label="선택 남은 시간">남은 시간 <strong data-turn-seconds>${HUMAN_TURN_SECONDS}</strong>초 · 시간 종료 시 자동 선택, 자동 ON</p>`; }
function helpOverlay() {
  return `<div class="modal-shade"><div class="modal-box help-box"><h2>🎴 라니맞고, 이렇게 즐겨!</h2>
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
function exitOverlay() {
  return `<div class="modal-shade flower-exit-shade"><section class="modal-box flower-exit-box" role="dialog" aria-modal="true" aria-labelledby="flower-exit-title" aria-describedby="flower-exit-help">
    <div class="flower-exit-portrait" aria-hidden="true">${portrait('fox')}</div>
    <h2 id="flower-exit-title">라니맞고에서 나갈까요?</h2><p id="flower-exit-help">진행 중인 판은 이 기기에 남아 있어요.</p>
    <div class="flower-exit-actions">${btn('계속 놀기','exit-stay','btn--primary btn--wide')}${btn('나가기','exit-leave','btn--quiet btn--wide')}</div>
  </section></div>`;
}
function render() {
  const previousHand=ROOT.querySelector('.my-hand');
  const previousGame=ROOT.querySelector('.scene--game')?.dataset.gameUuid;
  const previousScroll=previousHand?.scrollLeft ?? 0;
  const focusedCard=previousHand?.contains(document.activeElement) ? document.activeElement.dataset.card : null;
  let html = app.screen==='opening' && opening ? openingScreen() : app.screen==='select' ? selectScreen() : app.screen==='game' && app.game ? gameScreen() : home();
  if (overlay==='help') html += helpOverlay();
  if (overlay==='cardbook' && app.screen!=='game') html += cardbookOverlay();
  if (overlay==='exit') html += exitOverlay();
  ROOT.removeAttribute('data-card-art');
  ROOT.innerHTML = html;
  const hand=ROOT.querySelector('.my-hand');
  if (hand && previousGame && previousGame===app.game?.gameUuid) {
    hand.scrollLeft=previousScroll;
    if (focusedCard && !ROOT.querySelector('.modal-shade')) {
      [...hand.querySelectorAll('button[data-card]')].find(button=>button.dataset.card===focusedCard)?.focus({preventScroll:true});
    }
  }
  syncHandScrollHint();
  syncTurnClock();
  if (overlay==='exit') ROOT.querySelector('[data-action="exit-stay"]')?.focus({preventScroll:true});
}
function syncHandScrollHint() {
  const hand=ROOT.querySelector('.my-hand'), hint=ROOT.querySelector('.hand-scroll-hint');
  if (hand && hint) hint.hidden=hand.scrollWidth<=hand.clientWidth+1;
}
function clearAutoTimer() {
  clearTimeout(autoTimer);
  autoTimer = null;
}
function updateClockFace() {
  const times = ROOT.querySelectorAll('[data-turn-seconds]');
  const fill = ROOT.querySelector('[data-turn-fill]');
  const countdown = ROOT.querySelector('.turn-countdown');
  if (!clockKey) { if(countdown) countdown.hidden=true; return; }
  const left = clockPaused ? clockRemaining : Math.max(0, clockDeadline - performance.now());
  for (const time of times) time.textContent = String(secondsLeft(left));
  if (countdown) { const n=secondsLeft(left), number=countdown.querySelector('strong'), value=String(n);countdown.hidden=clockPaused || n<1 || n>5;if(number.textContent!==value){number.textContent=value;if(!countdown.hidden && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) number.animate?.([{transform:'scale(.82)',opacity:.72},{transform:'scale(1.08)',opacity:1,offset:.55},{transform:'scale(1)',opacity:1}],{duration:240,easing:'ease-out'});} }
  const urgent = !clockPaused && left > 0 && left <= 5000;
  ROOT.querySelectorAll('.turn-clock').forEach(clock => clock.classList.toggle('is-urgent',urgent));
  if (countdown) countdown.classList.toggle('is-final', urgent && left <= 3000);
  if (fill) { fill.parentElement?.classList.toggle('is-urgent', urgent);fill.style.width = `${Math.max(0, Math.min(100, left / HUMAN_TURN_MS * 100))}%`; }
}
function syncTurnClock() {
  const key = humanChoiceSignature(app.screen,app.game,{gookjin:app.pendingGookjinChoice || overlay==='gookjin-choice',draw:app.pendingDrawChoice,triple:selectedTriple,match:selectedMatch});
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
  // A backgrounded mobile browser can suspend timers while wall time keeps
  // passing. Preserve the player's remaining time until they return.
  const blocked = turnTransition || (!!overlay && overlay!=='gookjin-choice') || decisionReview || document.hidden;
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
      if (!document.hidden && clockKey && performance.now() >= clockDeadline && expiredKey !== clockKey) {
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
  if ((!forced && !app.autoMode) || !clockKey || turnTransition || (overlay && overlay!=='gookjin-choice') || decisionReview || document.hidden) return;
  const randomItem = list => list[Math.floor(Math.random()*list.length)];
  if (forced && !app.autoMode) {app.autoMode=true;save();}
  if (app.pendingGookjinChoice || overlay==='gookjin-choice') {mutate('gookjin-set',randomItem(['animal','junk']));return;}
  if (app.pendingDrawChoice) {mutate('draw-choice',undefined,randomItem(app.pendingDrawChoice.candidateIds));return;}
  if (selectedMatch) { humanPlay(selectedMatch.cardId,randomItem(selectedMatch.matches),true,undefined,true); return; }
  if (selectedTriple) {
    const ids=g.humanHand.filter(id=>getCard(id)?.month===selectedTriple.month);
    const id=randomItem(ids);selectedTriple=null;
    if (id) {const matches=getMatchingFloorCards(g.floorCards,id);humanPlay(id,matches.length===2?randomItem(matches):undefined,true,undefined,true);}
    return;
  }
  if (g.phase === 'awaiting-go-stop') { mutate('stop'); return; }
  if (g.phase === 'awaiting-chongtong') { mutate('chongtong-stop'); return; }
  if (g.phase !== 'playing' || g.currentPlayer !== 'human') return;
  try {
    if (forced) {
      const available=g.humanHand.filter(id=>!g.humanPendingShakeMonth || getCard(id)?.month===g.humanPendingShakeMonth);
      const id=randomItem(available);
      if (id) {const matches=getMatchingFloorCards(g.floorCards,id);humanPlay(id,matches.length===2?randomItem(matches):undefined,true,undefined,true);}
      else if (g.humanBombSkips>0) mutate('flip','auto');
      return;
    }
    // The selector may advance its private random seed: never mutate the live
    // game state while merely choosing a timed/automatic move.
    const move = chooseAiMove(structuredClone(g), 'human', 'normal').move;
    if (!move) return;
    if (move.kind === 'flip-only') { mutate('flip','auto'); return; }
    // Shaking and bombs are explicit player choices, never silently declared
    // by the countdown or auto-play (including a four-card shake/bomb).
    if (move.kind === 'shake' || move.kind === 'bomb') {
      const id = chooseAiCard(structuredClone(g), 'human', 'normal');
      if (id) {
        const matches = getMatchingFloorCards(g.floorCards,id);
        humanPlay(id, matches.length === 2 ? matches[0] : undefined,true,undefined,true);
      }
      return;
    }
    const matches = getMatchingFloorCards(g.floorCards,move.cardId);
    humanPlay(move.cardId,move.playedMatchId || (matches.length===2 ? matches[0] : undefined),true,undefined,true);
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
  if (!g || app.pendingGookjinChoice || g.phase!=='round-ended' || app.settledUuid===g.gameUuid) return;
  app.settledUuid = g.gameUuid;
  app.stats.rounds++;
  if (g.roundResult === 'nagari') {
    app.stats.draws++;
    app.nextMultiplier = nextRoundMultiplier('nagari', g.roundMultiplier || 1);
  } else {
    const money = Math.max(0, g.settlement?.displayAmount || 0);
    if (g.winner === 'human') {
      app.stats.wins++; app.wallet += money;
      if (app.doubleStake?.gameUuid === g.gameUuid) { g.doublePayout=app.doubleStake.amount * 2; g.doubleLevel=app.doubleStake.level || 2; app.wallet += g.doublePayout; app.doubleStake=null; }
      app.stats.high = Math.max(app.stats.high, g.settlement?.finalScore || 0);
      effects('참 잘했어! 승리!', 'win');
    } else {
      app.stats.losses++; app.wallet = Math.max(0, app.wallet-money);
      if (app.doubleStake?.gameUuid === g.gameUuid) { g.doubleForfeit=app.doubleStake.amount; app.doubleStake=null; }
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
  // Keep the score callout within the visible phone viewport. The rising
  // animation needs headroom above opponent portraits and the bottom HUD.
  const safeX = Math.max(50, Math.min(window.innerWidth - 50, rect.left + rect.width / 2));
  const safeY = Math.max(90, Math.min(window.innerHeight - 40, rect.top - 8));
  pop.style.left = `${safeX}px`;
  pop.style.top = `${safeY}px`;
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
  const gotGookjin = !!result && !app.game?.humanCaptured?.includes('m09-01') && next.humanCaptured.includes('m09-01');
  if (result && motion && app.screen==='game' && !turnTransition) {
    turnTransition = true;
    const scene = ROOT.querySelector('.scene--game');
    scene?.classList.add('is-resolving');
    scene?.setAttribute('aria-busy','true');
    syncTurnClock();
    // Keep the old cards visible while they fly, but checkpoint the resolved
    // engine state now. Reloading during the flight must never replay a turn.
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...app, game: next, pendingGookjinChoice: app.pendingGookjinChoice || gotGookjin })); }
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
  // A bonus card keeps the same turn number. Give the replacement move a
  // fresh clock so a timeout cannot leave automatic play stuck on that turn.
  if (shouldRestartClockAfterTurn(result,next)) {
    clockKey=null;expiredKey=null;
  }
  if (gotGookjin) app.pendingGookjinChoice = true;
  const specialText = eventAnnouncement(result, previous?.currentPlayer);
  const missionText = result?.missionCards?.length ? `${previous?.currentPlayer==='computer'?'상대 ':''}${result.missionEffect ? '미션 완료 · '+result.missionEffect : result.missionRequired > 1 ? '미션패 '+result.missionProgress+'/'+result.missionRequired : '미션패 ×'+(result.missionMultiplier || 1)}` : null;
  const eventText = [specialText, missionText].filter(Boolean).join(' · ');
  finishRound();
  if (eventText) effects(eventText, 'special', 'event-list', !!motion);
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
  if (app.screen!=='game' || !g || g.phase==='round-ended' || selectedMatch || selectedTriple || overlay || app.pendingGookjinChoice || app.pendingDrawChoice) return;
  const computerChoice = g.pendingDecision==='computer' && (g.phase==='awaiting-go-stop' || g.phase==='awaiting-chongtong');
  if (!computerChoice && !(g.phase==='playing' && g.currentPlayer==='computer')) return;
  // commitGame already waits for the throw, flip and capture before the next turn.
  aiTimer = setTimeout(runAI, 420 + (app.difficulty==='hard'?260:app.difficulty==='easy'?100:180));
}
function runAI() {
  const g=app.game;
  if (!g || app.screen!=='game' || turnTransition || overlay || selectedTriple || app.pendingGookjinChoice || app.pendingDrawChoice) return;
  try {
    let next, result=null;
    if (g.phase==='awaiting-go-stop' && g.pendingDecision==='computer') {
      const c=chooseAiGoStop(g,'computer',app.difficulty);
      next=c==='go'?chooseGo(g,'computer'):chooseStop(g,'computer');
      effects(c==='go'?`상대 ${next.computerGoCount}고!`:'상대 스톱!', 'special', c==='go'?'go':'special');
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
        effects('상대 흔들기!', 'special', 'shake');
        const target=staged.computerHand.find(id=>getCard(id)?.month===move.month);
        if (target) result=playTurn(staged,'computer',target);
        else return;
      } else result=playTurn(g,'computer',move.cardId,{playedMatchId:move.playedMatchId});
      next=result.state;
      commitGame(next,result,{player:'computer',handRect:move.kind==='flip-only'?deckRect:handRect,deckRect,playedMatchId:move.playedMatchId});
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
  const {seed, winner, rematch, roundMultiplier} = opening;
  clearOpening();
  app.game = createInitialGame(seed,app.difficulty,app.stake,winner,roundMultiplier);
  if (app.game.mission?.effect) app.game.mission.enabled = app.missionsEnabled !== false;
  if (app.doubleStake) app.doubleStake.gameUuid = app.game.gameUuid;
  if (!rematch && app.game.phase !== 'round-ended') {
    app.game.lastAction = `${winner === 'human' ? '내가' : '상대가'} 선 뽑기에서 이겨 먼저 칩니다.`;
  }
  app.screen = 'game';
  app.settledUuid = null;
  // The opening deal can itself end in nagari. Settle it before showing the
  // result, just as for a round that ends during play.
  finishRound();save();render();queueAI();
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

function startNew(rematch = false, roundMultiplier = app.nextMultiplier) {
  decisionReview = false;
  if (!rematch && app.doubleStake?.gameUuid && app.game?.phase!=='round-ended') { effects('보류한 승리금이 있어 진행 중인 판을 이어가 주세요.'); render(); return; }
  app.stake = normalizeStake(app.difficulty,app.stake);
  if (!hasEnoughForTable(app.wallet, app.stake)) {
    overlay=null; effects(canEmergencyRecharge(app.wallet)?'오링! 긴급 충전을 이용해줘!':'더 낮은 판을 선택해줘!');
    app.screen='select'; render(); return;
  }
  const seed=crypto.getRandomValues(new Uint32Array(1))[0] || Date.now();
  const previousRival = Number.isInteger(app.rivalIndex) ? app.rivalIndex : -1;
  app.rivalIndex = (seed % (RIVALS.length - 1) + (previousRival < 0 ? 0 : previousRival + 1)) % RIVALS.length;
  clearOpening();clearTimeout(aiTimer);clearAutoTimer();
  opening=createOpeningFlow(seed,{
    previousGame: app.game,
    rematch,
    daytime: new Date().getHours() >= 6 && new Date().getHours() < 18
  });
  opening.roundMultiplier = roundMultiplier;
  // Keep the previous round until a carried stake is attached to the next
  // deal; otherwise an interrupted opening loses the only recoverable state.
  if (!rematch && !app.doubleStake) app.game=null;
  app.screen='opening';selectedMatch=null;selectedTriple=null;app.pendingGookjinChoice=false;app.pendingDrawChoice=null;overlay=null;
  save();render();
  openingTimer=setTimeout(advanceOpening,OPENING_SHUFFLE_MS);
}
function humanPlay(id, matchId, skipTriple=false, drawnMatchId=undefined, automated=false) {
  const g=app.game;
  if (!g || turnTransition || g.currentPlayer!=='human' || g.phase!=='playing') return;
  const month=getCard(id)?.month;
  if (!skipTriple && !g.humanPendingShakeMonth && findShakeOptions(g.humanHand,g.floorCards,g.humanShakenMonths || []).some(option=>option.month===month)) {
    selectedTriple={month,initial:id,mode:'choice'};render();return;
  }
  const matches=getMatchingFloorCards(g.floorCards,id);
  if (!matchId && matches.length===2) {
    selectedMatch={cardId:id,matches};render();return;
  }
  selectedMatch=null;
  if (!automated && !drawnMatchId) {
    const drawChoice=getDrawFloorChoice(g,id,matchId);
    if (drawChoice) {
      app.pendingDrawChoice={kind:'play',cardId:id,playedMatchId:matchId || null,...drawChoice};
      save();render();return;
    }
  }
  ROOT.querySelector('.modal-shade--decision')?.remove();
  const handRect = motionOrigin(ROOT.querySelector(`.my-hand [data-card="${id}"]`));
  const deckRect = motionOrigin(ROOT.querySelector('.deck-pile .hwatu'));
  try { const result=playTurn(g,'human',id,{playedMatchId:matchId,drawnMatchId});commitGame(result.state,result,{player:'human',handRect,deckRect,playedMatchId:matchId}); }
  catch(err) { console.error(err);effects(err.message || '다른 패를 골라줘');render(); }
}
function mutate(action, value, cardId) {
  // A resolved game is checkpointed while cards fly; leave it intact.
  if (action === 'automode') {
    app.autoMode = !app.autoMode;
    if (app.autoMode) selectedMatch = null; else clearAutoTimer();
    if (turnTransition) {
      try { const checkpoint=JSON.parse(localStorage.getItem(SAVE_KEY)); if(checkpoint){checkpoint.autoMode=app.autoMode;localStorage.setItem(SAVE_KEY,JSON.stringify(checkpoint));} } catch { /* In-memory mode remains available. */ }
      const button=ROOT.querySelector('[data-action="automode"]');
      if(button){button.innerHTML=autoButtonContent(app.autoMode);button.classList.toggle('is-on',app.autoMode);button.setAttribute('aria-pressed',String(app.autoMode));button.setAttribute('aria-label','자동 치기 '+(app.autoMode?'끄기':'켜기'));}
    } else {save();render();}
    return;
  }
  if (turnTransition) return;
  switch (action) {
    case 'exit-stay': overlay=null;render();ROOT.querySelector('.home-actions button')?.focus({preventScroll:true});return;
    case 'exit-leave': overlay=null;save();if (flowerHadPrevious && history.length>2) history.go(-2);else location.assign('https://meta-deee1.web.app/ai-cleaner/');return;
    case 'decision-review': if (app.game?.phase==='awaiting-go-stop' && app.game.pendingDecision==='human') { decisionReview=true; render(); } return;
    case 'decision-return': decisionReview=false; render(); return;
    case 'home': clearOpening();clearTimeout(aiTimer); overlay=null; selectedMatch=null;selectedTriple=null;decisionReview=false;app.screen='home';save();render();return;
    case 'opening-home': if (app.doubleStake && !app.doubleStake.gameUuid) { app.wallet+=app.doubleStake.amount;app.doubleStake=null; } clearOpening();overlay=null;app.screen='home';save();render();return;
    case 'opening-skip': advanceOpening();return;
    case 'pick-dealer': pickOpeningDealer(Number(value));return;
    case 'select': clearOpening();clearTimeout(aiTimer);overlay=null;app.screen='select';save();render();return;
    case 'resume': if (app.game){app.screen='game';selectedTriple=app.game.phase==='playing' && app.game.currentPlayer==='human' && app.game.humanPendingShakeMonth ? {month:app.game.humanPendingShakeMonth,mode:'shake'} : null;render();queueAI()} else {app.screen='select';render()}return;
    case 'difficulty': if(!ALLOWED_STAKES[value])return;app.difficulty=value;app.stake=normalizeStake(value,app.stake);save();render();return;
    case 'stake': if(!canUseStake(app.difficulty,Number(value)))return;app.stake=Number(value);save();render();return;
    case 'start': startNew(false);return;
    case 'next': startNew(true);return;
    case 'next-double':
      if (!app.game || app.doubleStake || app.game.phase!=='round-ended' || app.game.winner!=='human' || app.game.roundResult==='nagari' || app.settledUuid!==app.game.gameUuid) return;
      { const offer=doubleOffer(app.game);
        if (!offer || !hasEnoughForTable(app.wallet-offer.amount,app.game.pointValue)) return;
        app.wallet-=offer.amount; app.doubleStake={amount:offer.amount,level:offer.level,originUuid:app.game.gameUuid,gameUuid:null};
        startNew(true,1);return; }
    case 'recharge':
      if (!canEmergencyRecharge(app.wallet)) { effects('오링일 때만 긴급 충전할 수 있어');render();return; }
      app.wallet+=EMERGENCY_RECHARGE;
      save();effects('긴급 '+kr(EMERGENCY_RECHARGE)+'냥 충전!','win');render();return;
    case 'help': overlay='help';render();return;
    case 'cardbook': overlay='cardbook';render();return;
    case 'mission-toggle': if (app.game?.mission && !missionView(app.game)?.locked) { app.game=setMissionEnabled(app.game,app.game.mission.enabled===false); app.missionsEnabled=app.game.mission.enabled; save(); render(); } return;
    case 'mission': if (missionView(app.game)) {overlay='mission';render();} return;
    case 'captures': {
      if(!app.game)return;
      const [owner, type] = (value || '').split(':');
      galleryOwner=owner==='computer'?'computer':'human';
      galleryType=['bright','animal','ribbon','junk'].includes(type) ? type : null;
      overlay='captures';render();return;
    }
    case 'close': overlay=null;render();queueAI();return;
    case 'sound': app.sound=!app.sound;save();render();return;
    case 'play': humanPlay(cardId);return;
    case 'pickmatch': if (selectedMatch) humanPlay(selectedMatch.cardId,cardId,true);return;
    case 'cancelmatch': selectedMatch=null;render();return;
    case 'triple-cancel': selectedTriple=null;render();return;
    case 'triple-ordinary': { const id=selectedTriple?.initial; selectedTriple=null;if(id)humanPlay(id,undefined,true);return; }
    case 'triple-shake': {
      if (!selectedTriple || selectedTriple.mode!=='choice') return;
      try { const next=declareShake(app.game,'human',selectedTriple.month); selectedTriple={...selectedTriple,mode:'shake'}; effects('흔들기!', 'special', 'shake');commitGame(next); }
      catch(err) { effects(err.message||'흔들 수 없어요');render(); }
      return;
    }
    case 'triple-shake-card': selectedTriple=null;humanPlay(cardId,undefined,true);return;
    case 'triple-bomb': { const month=selectedTriple?.month; selectedTriple=null;ROOT.querySelector('.modal-shade--decision')?.remove();if(month)mutate('bomb',String(month));return; }
    case 'gookjin': overlay='gookjin-choice';render();return;
    case 'gookjin-set': {
      if (value!=='animal' && value!=='junk') return;
      try { const next=setGookjinChoice(app.game,'human',value==='junk');app.pendingGookjinChoice=false;overlay=null;commitGame(next); }
      catch(err) { effects(err.message||'국진을 선택할 수 없어요');render(); }
      return;
    }
    case 'draw-choice': {
      const choice=app.pendingDrawChoice;
      if (!choice || !choice.candidateIds.includes(cardId)) return;
      app.pendingDrawChoice=null;ROOT.querySelector('.modal-shade--decision')?.remove();
      if (choice.kind==='flip') mutate('flip',cardId);
      else humanPlay(choice.cardId,choice.playedMatchId || undefined,true,cardId);
      return;
    }
  }
  const g=app.game;
  if (!g || app.screen!=='game') return;
  try {
    let next=g, result=null;
    if (action==='go') { next=chooseGo(g,'human');effects(`${next.humanGoCount}고!`, 'special', 'go'); }
    else if (action==='stop') next=chooseStop(g,'human');
    else if (action==='chongtong-go') next=chooseChongtong(g,'human','continue');
    else if (action==='chongtong-stop') next=chooseChongtong(g,'human','stop');
    else if (action==='bomb') { result=playBomb(g,'human',Number(value));next=result.state; }
    else if (action==='shake') { next=declareShake(g,'human',Number(value));selectedTriple={month:Number(value),mode:'shake'};effects('흔들기!', 'special', 'shake'); }
    else if (action==='flip') {
      if (!value) {
        const drawChoice=getFlipOnlyDrawChoice(g);
        if (drawChoice) { app.pendingDrawChoice={kind:'flip',...drawChoice};save();render();return; }
      }
      result=playFlipOnlyTurn(g,'human',value==='auto'?undefined:value || undefined);next=result.state;
    }
    else return;
    const handCard=result?.playedCardId && ROOT.querySelector(`.my-hand [data-card="${result.playedCardId}"]`);
    const handRect=motionOrigin(handCard || ROOT.querySelector('.my-hand .hwatu'));
    const deckRect=motionOrigin(ROOT.querySelector('.deck-pile .hwatu'));
    commitGame(next,result,result?{player:'human',handRect:action==='flip'?deckRect:handRect,deckRect}:null);
  } catch(err) { console.error(err);effects(err.message||'진행할 수 없어');render(); }
}
import { setGookjinChoice } from './engine/gameState';

document.addEventListener('visibilitychange', syncTurnClock);
window.addEventListener('resize',syncHandScrollHint);
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
  // Keep the originally pressed card as the click target on mouse and touch,
  // even when visual feedback moves it before the pointer is released.
  try { hand.setPointerCapture?.(e.pointerId); }
  catch { /* Pointer capture is optional; a normal single tap still works. */ }
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
    else if (selectedTriple) {if(selectedTriple.mode==='choice'){selectedTriple=null;render();}}
    else if (overlay) {overlay=null;render();queueAI()}
    else if(app.screen==='opening') mutate('opening-home');
    else if(app.screen==='game') mutate('home');
  }
});
// One same-document history guard lets Back unwind game UI before leaving.
// Keep the caller's existing history state and never clear saved gameplay.
const flowerHadPrevious=history.state?.flowerHadPrevious ?? (history.length>1 && !!document.referrer);
if (!history.state?.flowerGuard) {
  history.replaceState({...history.state,flowerBase:true,flowerHadPrevious},'',location.href);
  history.pushState({...history.state,flowerBase:false,flowerGuard:true,flowerHadPrevious},'',location.href);
}
window.addEventListener('popstate',()=>{
  history.pushState({...history.state,flowerBase:false,flowerGuard:true,flowerHadPrevious},'',location.href);
  if (turnTransition) return;
  if (overlay) {overlay=null;render();queueAI();return;}
  if (selectedMatch) {selectedMatch=null;render();return;}
  if (selectedTriple?.mode==='choice') {selectedTriple=null;render();return;}
  if (decisionReview) {decisionReview=false;render();return;}
  if (app.screen==='opening') {mutate('opening-home');return;}
  if (app.screen==='game' || app.screen==='select') {mutate('home');return;}
  overlay='exit';render();
});
finishRound();save();render();queueAI();
