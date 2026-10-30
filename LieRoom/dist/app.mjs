// LR-010: isolated per-case engines and storage; preserve the first case untouched.
const selectedCase = new URLSearchParams(window.location.search).get('case') === '2' ? '2' : '1';
const engine = await import(selectedCase === '2' ? './case2-core.mjs?v=lr010' : './core.mjs?v=lr010');
const { CASE, GAME_VERSION, STORAGE_KEY, createGame, safeRestore, getSuspect, getEvidence, askQuestion, toggleProof, judgeAccusation, CONFRONTATIONS, getConfrontation, canConfront, confrontEvidence, TACTICS, getPsychology, applyTactic, getInvestigationTimeline } = engine;
const IS_SECOND_CASE = CASE.id === 'LR-002';

const root = document.querySelector('#app');
const toastNode = document.querySelector('#toast');
let state = load();
let modal = '';
let toastTimeout;
const SFX_KEY = 'gomfox.lie-room.sfx';
let sfxEnabled = false;
let audioContext = null;
let castMood = 'neutral';
let evidenceFilter = 'all';
let revealMoment = null;
let revealTimer = null;
function showReveal(title, detail) {
  revealMoment = { title, detail };
  clearTimeout(revealTimer);
  render();
  revealTimer = setTimeout(() => { revealMoment = null; render(); }, 1900);
}

const FIRST_CAST = Object.freeze([
  { id: 'A', name: '한유리', role: '야간 경비원', note: '첫 번째 사건 · 규정 위반을 숨긴 목격자' },
  { id: 'B', name: '윤서진', role: '전시 기획자', note: '첫 번째 사건 · 출입증을 빌려준 기획자' },
  { id: 'C', name: '박도하', role: '전시 보조원', note: '첫 번째 사건 · 사라진 전시품의 반출자' },
]);
const NEXT_CAST = Object.freeze([
  { id: 'D', name: '최강현', role: '미술관 관장', note: '냉철한 원칙주의자 · 은발과 금테 안경' },
  { id: 'E', name: '서라온', role: '미술품 복원사', note: '예리한 관찰자 · 묶은 머리와 복원 작업복' },
  { id: 'F', name: '차민혁', role: '탐사 기자', note: '집요한 취재자 · 짧은 곱슬머리와 트렌치코트' },
]);
try { sfxEnabled = localStorage.getItem(SFX_KEY) === 'on'; } catch {}

function playSfx(kind = 'clue') {
  if (!sfxEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequencies = { clue: 610, tactic: 440, confront: 320, correct: 760, wrong: 220 };
    oscillator.type = kind === 'confront' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequencies[kind] || 480, now);
    oscillator.frequency.exponentialRampToValueAtTime((frequencies[kind] || 480) * 1.22, now + .13);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.065, now + .022);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .2);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + .21);
  } catch { /* Browsers without Web Audio remain fully playable. */ }
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
function load() { try { return safeRestore(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { return createGame(); } }
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
function update(next) { state = next; const ok = save(); render(); if (!ok) announce('브라우저 저장 공간에 접근하지 못했어. 새로고침하면 진행 기록이 사라질 수 있어.'); }
function announce(message) { toastNode.hidden = false; toastNode.textContent = message; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toastNode.hidden = true; }, 3600); }
function hasInvestigationProgress() { return state.asked.length > 0 || state.discovered.length > 2 || state.tactics.length > 0 || state.confronted.length > 0 || state.proof.length > 0 || Boolean(state.result); }
function revealLabel(ids) { return ids.length ? `새 증거 ${ids.length}개 발견 · ${ids.map(id => getEvidence(id)?.title).join(', ')}` : '진술을 확인했어.'; }

function header() {
  return `<header class="topbar">
    <button class="brand" data-action="home" aria-label="거짓말의 방 메인으로"><span class="brand-seal" aria-hidden="true"></span><span><strong>거짓말의 방</strong><small>곰같은여우의 추리 기록</small></span></button>
    <div class="top-actions"><span class="pilot-mark">CASE FILE / ${escapeHtml(CASE.id.slice(-3))}</span><button class="sound-button" data-action="sfx" aria-pressed="${sfxEnabled}" aria-label="효과음 ${sfxEnabled ? '끄기' : '켜기'}">${sfxEnabled ? '효과음 켬' : '효과음 끔'}</button><button class="round-button" data-action="help" aria-label="게임 안내">?</button></div>
  </header>`;
}

function home() {
  const canResume = hasInvestigationProgress() || ['play', 'verdict', 'result'].includes(state.screen);
  return `<main class="home-screen">
    <div class="home-hero">
      <div class="hero-copy"><p class="eyebrow">MYSTERY · SOCIAL DEDUCTION</p><h1>누구나 비밀은 있다.<br><em>하지만 모두가 범인은 아니다.</em></h1><p class="hero-lead">세 사람, 서로 다른 거짓말. 진실을 밝혀낼 단서는 이미 사건 안에 있다.</p><div class="hero-actions"><button class="primary-button" data-action="new">${IS_SECOND_CASE ? "두 번째 사건 수사하기" : "첫 사건 수사하기"} <span aria-hidden="true">↗</span></button>${canResume ? '<button class="quiet-button" data-action="resume">이어하기</button>' : ''}</div></div>
      <div class="hero-art"><img class="fox-hero-image" src="./assets/fox-detective.png" alt="" loading="eager"><div class="ribbon">RESTRICTED ACCESS</div><div class="hero-caption"><div class="hero-stamp">THE LIE ROOM</div><p>사건 속에 숨은 진실을 찾아라</p></div></div>
    </div>
    <div class="section-head"><div><p class="eyebrow">PLAY MODES</p><h2>수사 기록 보관소</h2></div><button class="cast-entry-button" data-action="cast">인물 도감 · 6명 보기</button></div>
    <section class="mode-grid" aria-label="게임 모드">
      <button class="mode-card ${!IS_SECOND_CASE ? 'mode-active' : 'mode-cross'}" data-action="${IS_SECOND_CASE ? 'switch-case' : 'new'}" data-id="1"><span class="mode-number">01 / PLAYABLE</span><strong>사라진 은빛 가면</strong><small>첫 번째 사건 · 도난 미스터리</small><span class="mode-go">${IS_SECOND_CASE ? '첫 사건으로 이동' : '이 사건 시작'} ↗</span></button>
      <button class="mode-card ${IS_SECOND_CASE ? 'mode-active' : 'mode-cross'}" data-action="${IS_SECOND_CASE ? 'new' : 'switch-case'}" data-id="2"><span class="mode-number">02 / PLAYABLE</span><strong>사라진 마지막 녹음</strong><small>두 번째 사건 · 음성 기록 수사</small><span class="mode-go">${IS_SECOND_CASE ? '이 사건 시작' : '둘째 사건으로 이동'} ↗</span></button>
      <div class="mode-card mode-locked"><span class="mode-number">03 / COMING SOON</span><strong>수상한 방문객</strong><small>신분 판별·선택</small></div>
      <div class="mode-card mode-locked"><span class="mode-number">04 / COMING SOON</span><strong>사라진 메시지</strong><small>디지털 기록 수사</small></div>
      <div class="mode-card mode-locked"><span class="mode-number">05 / COMING SOON</span><strong>60초 미스터리</strong><small>빠른 결정적 단서</small></div>
      <div class="mode-card mode-locked"><span class="mode-number">06 / COMING SOON</span><strong>배신자 게임</strong><small>숨겨진 역할 심리전</small></div>
    </section>
    <footer class="site-footer">© 2026 곰같은여우 · 자체 창작 게임의 권리 보유 · 오프라인 규칙 엔진</footer>
  </main>`;
}

function intro() {
  return `<main class="intro-screen"><article class="case-opening">
    <p class="eyebrow">CASE FILE ${CASE.id}</p><div class="chapter-tag">${escapeHtml(CASE.chapter || "1화 · 사라진 전시품")}</div><h1>${escapeHtml(CASE.title)}</h1>
    <p class="opening-location">${escapeHtml(CASE.location)}</p><p class="opening-story">${escapeHtml(CASE.description)}</p>
    <div class="mission-box"><strong>이번 사건의 임무</strong><p>${escapeHtml(CASE.objective)}</p></div>
    <div class="opening-rules"><span>용의자 3명</span><span>숨겨진 증거 5개</span><span>결론은 단 하나</span></div>
    <div class="intro-actions"><button class="primary-button" data-action="enter">심문 시작하기 ↗</button><button class="quiet-button" data-action="home">보관소로</button></div>
  </article></main>`;
}

function people() {
  return `<aside class="people-pane"><div class="pane-title"><span>PERSONNEL</span><strong>관계자</strong></div><div class="people-list">${CASE.suspects.map(person => `<button class="person-item ${state.selectedSuspect === person.id ? 'selected' : ''}" data-action="suspect" data-id="${person.id}" aria-pressed="${state.selectedSuspect === person.id}"><span class="person-avatar ${person.color} person-${person.id}" aria-hidden="true"></span><span class="person-info"><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)}</small></span><span class="person-arrow" aria-hidden="true">›</span></button>`).join('')}</div><button class="history-link" data-action="history">심문 기록 보기 <span aria-hidden="true">↗</span></button></aside>`;
}

function portrait() {
  const person = getSuspect(state.selectedSuspect);
  const mood = getPsychology(state, person.id);
  const confronted = CONFRONTATIONS.some(item => item.suspect === person.id && state.confronted.includes(item.id));
  const moodClass = mood.label === '경계' || confronted ? 'mood-guard' : mood.label === '신뢰' ? 'mood-trust' : 'mood-cautious';
  const reaction = confronted ? '증거 대질 후 진술 재검토 중' : mood.label === '경계' ? '경계 · 기록과 교차 검증' : mood.label === '신뢰' ? '신뢰 · 진술 검증 필요' : '신중 · 질문을 이어가자';
  return `<div class="portrait-stage ${person.color} ${moodClass}"><div class="portrait-art person-${person.id}" aria-hidden="true"></div><div class="window-blind"></div><div class="portrait-mark">${person.label}</div><div class="portrait-shine"></div><div class="portrait-name"><span>WITNESS ${person.label}</span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)}</small></div><span class="portrait-hint">심리 신호 · ${escapeHtml(reaction)}</span></div>`;
}

function discussion() {
  const person = getSuspect(state.selectedSuspect);
  const last = [...state.log].reverse().find(item => item.who === person.name);
  const text = last ? last.text : person.intro;
  const questions = CASE.questions.filter(item => item.suspect === person.id);
  const mood = getPsychology(state, person.id);
  const tactics = TACTICS.filter(item => item.suspect === person.id);
  const total = CASE.questions.filter(item => item.suspect === person.id).length;
  const asked = questions.filter(item => state.asked.includes(item.id)).length;
  const signal = mood.stress >= 2 ? '상대가 경계하고 있어. 표정보다 객관적인 기록을 확인해.' : mood.trust >= 2 ? '대화가 부드러워졌어. 아직 진술을 증거로 검증해야 해.' : '중립적인 분위기야. 먼저 동선을 확인해봐.';
  return `<section class="interrogation-pane">
    ${portrait()}
    <div class="dialogue-panel"><div class="dialogue-heading"><strong>${escapeHtml(person.name)}</strong><span>진술 확인</span></div><p>${escapeHtml(text)}</p></div>
    <div class="psychology-panel" id="investigation-psych" aria-label="심리 접근"><div class="psy-head"><strong>심리 접근</strong><span>신뢰 ${mood.trust} · 긴장 ${mood.stress} · ${escapeHtml(mood.label)}</span></div><div class="psy-meters"><div class="psy-meter"><span>신뢰</span><div class="psy-meter-track"><i style="width:${Math.min(100,mood.trust/3*100)}%"></i></div></div><div class="psy-meter stress"><span>긴장</span><div class="psy-meter-track"><i style="width:${Math.min(100,mood.stress/3*100)}%"></i></div></div></div><p class="psy-signal">${escapeHtml(signal)}</p><div class="tactic-list">${tactics.map(tactic => `<button class="tactic-button ${tactic.tone} ${state.tactics.includes(tactic.id) ? 'used' : ''}" data-action="tactic" data-id="${escapeHtml(tactic.id)}" ${state.tactics.includes(tactic.id) ? 'disabled' : ''}>${escapeHtml(tactic.label)} ${state.tactics.includes(tactic.id) ? '✓' : '↗'}</button>`).join('')}</div></div>
    <div class="investigation-actions" aria-label="수사 도구"><button class="investigation-action action-question" data-action="jump-questions">질문하기</button><button class="investigation-action action-evidence" data-action="jump-evidence">증거 확인</button><button class="investigation-action action-psych" data-action="jump-psych">심리 분석</button><button class="investigation-action action-record" data-action="history">심문 기록</button></div><div class="question-panel" id="investigation-questions"><div class="pane-title"><span>QUESTION</span><strong>어떤 질문을 하겠어? (${asked}/${total})</strong></div><div class="question-list">${questions.map((question, index) => `<button class="question-button" data-action="ask" data-id="${question.id}" ${state.asked.includes(question.id) ? 'disabled' : ''}><span>${index + 1 < 10 ? `0${index + 1}` : index + 1}</span><strong>${escapeHtml(question.title)}</strong><span class="question-arrow">${state.asked.includes(question.id) ? '확인' : '↗'}</span></button>`).join('')}</div></div>
  </section>`;
}

function evidence() {
  const discovered = state.discovered.map(id => getEvidence(id)).filter(Boolean);
  const ready = discovered.filter(item => canConfront(state, item.id));
  const visible = evidenceFilter === 'ready' ? ready : discovered;
  return `<aside class="evidence-pane" id="investigation-evidence"><div class="pane-title"><span>EVIDENCE</span><strong>확보한 증거 <small>${discovered.length} / ${CASE.evidence.length}</small></strong></div><p class="pane-description">증거를 눌러 출처와 발생 시각을 확인해봐.</p>
    <div class="evidence-filters"><button data-action="evidence-filter" data-id="all" aria-pressed="${evidenceFilter === 'all'}">전체 ${discovered.length}</button><button data-action="evidence-filter" data-id="ready" aria-pressed="${evidenceFilter === 'ready'}">대질 가능 ${ready.length}</button></div><div class="evidence-list">${visible.map(item => `<button class="evidence-card" data-action="detail" data-id="${item.id}"><span class="evidence-id"><span class="evidence-illustration art-${item.id}" aria-hidden="true"></span><span class="evidence-index">${item.icon}</span></span><span class="evidence-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.kind)} · ${escapeHtml(item.stamp)}</small>${canConfront(state, item.id) ? '<small class="confront-ready">대질 가능</small>' : state.confronted.includes(getConfrontation(state.selectedSuspect, item.id)?.id) ? '<small class="confront-done">대질 완료</small>' : ''}</span><span class="evidence-open" aria-hidden="true">+</span></button>`).join('')}</div>
    <div class="submit-block"><p>거짓말이 진범을 뜻하지는 않아.</p><button class="primary-button" data-action="verdict">추리 정리 · 고발하기 ↗</button></div>
  </aside>`;
}

let mobilePanel = 'interrogation';
function play() {
  return `<main class="play-screen" data-mobile-panel="${mobilePanel}"><div class="game-bar"><div><p class="eyebrow">ACTIVE INVESTIGATION</p><strong>${escapeHtml(CASE.title)}</strong></div><div class="progress-tags"><span>질문 ${state.asked.length}/${CASE.questions.length}</span><span>증거 ${state.discovered.length}/${CASE.evidence.length}</span><span>심리 ${state.tactics.length}/${TACTICS.length}</span><span class="confront-progress">대질 ${state.confronted.length}/${CONFRONTATIONS.length}</span><button class="timeline-button" data-action="timeline">수사 시간선</button><button class="plain-button" data-action="home">저장 후 나가기</button></div></div><nav class="mobile-investigation-tabs" aria-label="수사 화면 전환"><button data-action="mobile-panel" data-id="people" aria-pressed="${mobilePanel === 'people'}">인물</button><button data-action="mobile-panel" data-id="interrogation" aria-pressed="${mobilePanel === 'interrogation'}">심문</button><button data-action="mobile-panel" data-id="evidence" aria-pressed="${mobilePanel === 'evidence'}">증거 ${state.discovered.length}</button></nav><div class="game-layout">${people()}${discussion()}${evidence()}</div></main>`;
}

function verdict() {
  return `<main class="verdict-screen"><article class="verdict-sheet"><p class="eyebrow">FINAL DEDUCTION</p><h1>${escapeHtml(CASE.finalQuestion || "누가 은빛 가면을 가져갔을까?")}</h1><p class="verdict-lead">한 명을 지목하고, 범행과 연결되는 서로 다른 출처의 증거를 두 개 이상 골라줘.</p>
    <div class="verdict-subhead">01 · 용의자 지목</div><div class="accuse-list">${CASE.suspects.map(item => `<button class="accuse-button ${state.accusation === item.id ? 'active' : ''}" data-action="accuse" data-id="${item.id}" aria-pressed="${state.accusation === item.id}"><span>${item.label}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.role)}</small></button>`).join('')}</div>
    <div class="verdict-subhead">02 · 근거 선택 <small>${state.proof.length} / 3</small></div><div class="proof-list">${state.discovered.map(id => { const e = getEvidence(id); const selected = state.proof.includes(id); return `<button data-action="proof" data-id="${id}" class="proof-button ${selected ? 'active' : ''}" aria-pressed="${selected}"><span class="proof-check">${selected ? '✓' : '+'}</span><span><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.source)}</small></span></button>`; }).join('')}</div>
    <div class="verdict-actions"><button class="quiet-button" data-action="timeline">시간선 확인</button><button class="quiet-button" data-action="back-to-play">추가 조사</button><button class="primary-button" data-action="submit" ${!state.accusation || state.proof.length < 2 ? 'disabled' : ''}>최종 고발하기 ↗</button></div>
  </article></main>`;
}

function result() {
  const truthTimeline = CASE.truthTimeline || [
    '21:11 · B의 출입증을 C가 전달받음',
    '21:13 · C의 PIN으로 경보 해제',
    '21:14 · C의 뒷문 출입 확인',
    '21:16 · C 명의의 무게가 다른 상자 출고 등록',
    '사후 검증 · 상자의 봉인과 실물 확인으로 가면 발견',
  ];
  const result = state.result || { kind: 'partial', heading: '더 조사해보자', explanation: '증거를 다시 확인해줘.' };
  return `<main class="result-screen"><article class="result-sheet ${result.kind}"><p class="eyebrow">CASE REPORT / ${CASE.id}</p><div class="result-symbol">${result.kind === 'correct' ? '✓' : result.kind === 'wrong' ? '×' : '?'}</div><h1>${escapeHtml(result.heading)}</h1><p>${escapeHtml(result.explanation)}</p>
  ${result.kind === 'correct' ? `<div class="truth-timeline"><strong>확정된 사건 시간선</strong>${truthTimeline.map(event => `<div>${escapeHtml(event)}</div>`).join('')}</div><div class="completed-stamp">CASE SOLVED · ${escapeHtml(CASE.chapter || "첫 사건")} 해결</div><p class="confront-summary">증거 대질 ${state.confronted.length}/${CONFRONTATIONS.length}건 · 진범을 맞혔어도 다른 사람의 거짓말을 더 검증할 수 있어.</p>` : `<div class="mission-box"><strong>다시 생각할 점</strong><p>의심스러운 진술과 범행의 직접 증거를 구분하면 진실에 더 가까워질 수 있어.</p></div>`}
    <div class="result-actions"><button class="primary-button" data-action="back-to-play">${result.kind === 'correct' ? '사건 다시 살펴보기' : '추가 조사하기'} ↗</button><button class="quiet-button" data-action="home">메인으로</button></div>
  </article></main>`;
}

function renderModal() {
  if (!modal) return '';
  if (modal === 'help') return `<div class="modal-backdrop" data-action="close"><section class="modal-card" role="dialog" aria-modal="true" aria-label="게임 방법"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">HOW TO PLAY</p><h2>거짓말을 찾는 네 단계</h2><ol><li>관계자를 선택해 공감이나 압박으로 심리 반응을 관찰하고 질문해봐.</li><li>증거를 눌러 출처와 시간을 비교해.</li><li>해당 인물에게 증거를 직접 제시해 모순을 추궁해.</li><li>범인과 독립적인 증거를 두 개 이상 제출해.</li></ol><p class="modal-note">거짓말이 꼭 범죄를 뜻하지는 않아. 질문과 증거를 신중하게 연결해봐.</p></section></div>`;
  if (modal === 'confirm-reset') return `<div class="modal-backdrop" data-action="close"><section class="modal-card reset-modal" role="dialog" aria-modal="true" aria-label="새 사건 시작 확인"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">CASE FILE / NOTICE</p><h2>현재 수사를 처음부터 시작할까?</h2><p>새 사건을 시작하면 현재 사건의 질문, 증거, 대질과 추리 기록이 초기화돼. 기존 기록을 계속 이어갈 수도 있어.</p><div class="reset-actions"><button class="quiet-button" data-action="close">기존 수사 유지</button><button class="primary-button" data-action="confirm-new">처음부터 다시 시작</button></div></section></div>`;
  if (modal === 'timeline') {
    const entries = getInvestigationTimeline(state);
    return `<div class="modal-backdrop" data-action="close"><section class="modal-card timeline-modal" role="dialog" aria-modal="true" aria-label="수사 시간선"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">CHRONOLOGY / ${escapeHtml(CASE.id)}</p><h2>수사 시간선</h2><p class="timeline-lead">확보한 자료 ${entries.length}/${CASE.evidence.length}건 · 실제 확인한 기록만 시간순으로 정리했어. 시간선의 빈칸은 아직 확인되지 않았어.</p><div class="timeline-list">${entries.map(item => `<button class="timeline-entry" data-action="timeline-detail" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.stamp)} ${escapeHtml(item.title)} 증거 보기"><span class="timeline-time">${escapeHtml(item.stamp)}</span><span class="timeline-art art-${escapeHtml(item.id)}" aria-hidden="true"></span><span class="timeline-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.source)}</small><em>${escapeHtml(item.leads)}</em></span><span class="timeline-status">${escapeHtml(item.confrontation)}</span></button>`).join('')}</div><p class="timeline-note">주의 · 거짓 진술 하나가 곧 범행 증거는 아니야. 서로 다른 출처의 기록을 교차 확인해.</p><button class="quiet-button" data-action="close">수사 화면으로 돌아가기</button></section></div>`;
  }
  if (modal === 'cast') {
    const roster = [
      ...FIRST_CAST.map(person => ({ ...person, next: false })),
      ...NEXT_CAST.map(person => ({ ...person, next: true })),
    ];
    const moods = [{ id: 'neutral', label: '기본' }, { id: 'trust', label: '신뢰' }, { id: 'guard', label: '경계' }];
    return `<div class="modal-backdrop" data-action="close"><section class="modal-card cast-modal" role="dialog" aria-modal="true" aria-label="등장인물 도감"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">CHARACTER ARCHIVE / ORIGINAL ART</p><h2>등장인물 도감</h2><p class="cast-description">첫 사건과 두 번째 사건에 등장하는 총 6명의 관계자야. 기본·신뢰·경계 표정을 비교하고 각 사건에서 직접 심문해 봐.</p><div class="cast-mood-tabs" role="group" aria-label="표정 비교">${moods.map(m => `<button data-action="cast-mood" data-id="${m.id}" aria-pressed="${castMood===m.id}" class="${castMood===m.id?'active':''}">${m.label} 표정</button>`).join('')}</div><div class="cast-gallery">${roster.map(person => `<article class="cast-card"><div class="cast-face ${person.next?'cast-face-next':'cast-face-now'} cast-${person.id} cast-${castMood}" aria-hidden="true"></div><div class="cast-card-body"><small>${person.next?'2번 사건 관계자':'1번 사건 관계자'}</small><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role)}</span><p>${escapeHtml(person.note)}</p></div></article>`).join('')}</div><div class="cast-foot">전체 6명 · 표정 원화 18컷 · 자체 제작 PNG · SVG 사용 안 함</div></section></div>`;
  }
  if (modal === 'history') return `<div class="modal-backdrop" data-action="close"><section class="modal-card history-modal" role="dialog" aria-modal="true" aria-label="심문 기록"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">INTERROGATION LOG</p><h2>심문 기록</h2><p class="psych-journal-title">심리 접근 ${state.tactics.length}/${TACTICS.length}건 · 긴장은 유죄의 증거가 아니야</p><div class="psych-journal">${state.tactics.map(id => { const t = TACTICS.find(item => item.id === id); return t ? `<div><strong>${escapeHtml(getSuspect(t.suspect).name)} · ${escapeHtml(t.label)}</strong><p>${escapeHtml(t.signal)}</p></div>` : ''; }).join('') || '<p>인물을 선택하고 심리 접근을 시도해봐.</p>'}</div><p class="confront-journal-title">증거 대질 ${state.confronted.length}/${CONFRONTATIONS.length}건</p><div class="confront-journal">${state.confronted.map(id => { const item = CONFRONTATIONS.find(c => c.id === id); return item ? `<div><strong>${escapeHtml(getSuspect(item.suspect).name)} · ${escapeHtml(getEvidence(item.evidence).title)}</strong><p>${escapeHtml(item.insight)}</p></div>` : ''; }).join('') || '<p>증거를 확보한 다음 해당 인물에게 직접 제시해봐.</p>'}</div><div class="transcript">${state.log.map(item => `<div class="transcript-entry"><strong>${escapeHtml(item.who)}</strong><p>${escapeHtml(item.text)}</p></div>`).join('')}</div></section></div>`;
  const e = getEvidence(modal);
  if (!e) return '';
  return `<div class="modal-backdrop" data-action="close"><section class="modal-card detail-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(e.title)}"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">EVIDENCE / ${escapeHtml(e.id)}</p><div class="clue-graphic"><span class="clue-art art-${escapeHtml(e.id)}" aria-hidden="true"></span><span class="clue-meta"><span>자료번호 ${escapeHtml(e.icon)}</span><small>${escapeHtml(e.kind)}</small></span></div><h2>${escapeHtml(e.title)}</h2><p class="detail-stamp">기록 시각 ${escapeHtml(e.stamp)} · ${escapeHtml(e.source)}</p><p>${escapeHtml(e.detail)}</p><div class="evidence-insight"><strong>수사 포인트</strong><span>${escapeHtml(e.leads)}</span></div>${(() => {
    const match = getConfrontation(state.selectedSuspect, e.id);
    if (!match) return '<p class="confront-hint">이 증거와 직접 연결되는 인물을 선택하면 대질할 수 있어.</p>';
    if (state.confronted.includes(match.id)) return `<div class="evidence-insight confronted-note"><strong>대질 완료 · ${escapeHtml(getSuspect(match.suspect).name)}</strong><span>${escapeHtml(match.insight)}</span></div>`;
    if (!canConfront(state, e.id)) return '<p class="confront-hint">먼저 해당 인물의 관련 질문을 확인해야 대질할 수 있어.</p>';
    return `<button class="primary-button confront-button" data-action="confront" data-id="${escapeHtml(e.id)}">${escapeHtml(getSuspect(match.suspect).name)}에게 증거 제시하기 ↗</button>`;
  })()}<button class="quiet-button" data-action="close">기록 확인</button></section></div>`;
}

function render() {
  const current = state.screen;
  root.innerHTML = `<div class="app-shell ${IS_SECOND_CASE ? 'case-two' : 'case-one'}">${header()}${current === 'home' ? home() : current === 'intro' ? intro() : current === 'play' ? play() : current === 'verdict' ? verdict() : result()}${renderModal()}${revealMoment ? `<div class="reveal-moment" role="status" aria-live="polite"><div class="reveal-moment-inner"><small>INVESTIGATION UPDATE</small><strong>${escapeHtml(revealMoment.title)}</strong><span>${escapeHtml(revealMoment.detail)}</span></div></div>` : ''}</div>`;
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog) dialog.querySelector('.close-button')?.focus();
}

root.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'mobile-panel') { if (['people', 'interrogation', 'evidence'].includes(id)) { mobilePanel = id; render(); } return; }
  if (action === 'jump-questions' || action === 'jump-evidence' || action === 'jump-psych') {
    if (window.matchMedia('(max-width: 767px)').matches) { mobilePanel = action === 'jump-evidence' ? 'evidence' : 'interrogation'; render(); }
    const target = root.querySelector(action === 'jump-questions' ? '#investigation-questions' : action === 'jump-evidence' ? '#investigation-evidence' : '#investigation-psych');
    if (target) {
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      target.classList.add('investigation-focused');
      setTimeout(() => target.classList.remove('investigation-focused'), 1800);
    }
    return;
  }
  if (action === 'evidence-filter') { if (id === 'all' || id === 'ready') { evidenceFilter = id; render(); } return; }
  if (action === 'sfx') {
    sfxEnabled = !sfxEnabled;
    try { localStorage.setItem(SFX_KEY, sfxEnabled ? 'on' : 'off'); } catch {}
    render();
    playSfx('clue');
    announce(`효과음 ${sfxEnabled ? '켜짐' : '꺼짐'}`);
    return;
  }
  if (action === 'close' && event.target.closest('.modal-card') && event.target !== button) return;
  if (action === 'close') { modal = ''; render(); return; }
  if (action === 'tactic') {
    const reaction = applyTactic(state, id);
    if (reaction.state !== state) {
      update(reaction.state);
      playSfx('tactic');
      announce(`심리 신호 · ${reaction.signal}`);
    } else announce('이미 사용했거나 현재 인물에게 사용할 수 없는 접근이야.');
    return;
  }
  if (action === 'confront') {
    const confrontation = confrontEvidence(state, id);
    if (confrontation.state !== state) {
      modal = '';
      update(confrontation.state);
      playSfx('confront');
      showReveal('증언과 증거가 충돌했다', confrontation.insight);
    } else announce('먼저 관련 진술과 증거를 확보해야 해.');
    return;
  }
  if (action === 'switch-case') {
    const destination = new URL(window.location.href);
    if (id === '2') destination.searchParams.set('case', '2');
    else destination.searchParams.delete('case');
    window.location.assign(destination.href);
    return;
  }
  if (action === 'cast-mood') { if (['neutral', 'trust', 'guard'].includes(id)) { castMood = id; render(); } return; }
  if (action === 'help' || action === 'history' || action === 'detail' || action === 'timeline' || action === 'cast') { modal = action === 'detail' ? id : action; render(); return; }
  if (action === 'timeline-detail') { if (state.discovered.includes(id)) { modal = id; render(); } return; }
  if (action === 'confirm-new') { modal = ''; update({ ...createGame(), screen: 'intro' }); return; }
  if (action === 'home') { modal = ''; update({ ...state, screen: 'home' }); return; }
  if (action === 'new') {
    if (hasInvestigationProgress()) { modal = 'confirm-reset'; render(); return; }
    modal = ''; update({ ...createGame(), screen: 'intro' }); return;
  }
  if (action === 'resume') { modal = ''; update({ ...state, screen: state.result ? 'result' : 'play' }); return; }
  if (action === 'enter') { update({ ...state, screen: 'play' }); return; }
  if (action === 'suspect') { update({ ...state, selectedSuspect: id }); return; }
  if (action === 'ask') {
    const answer = askQuestion(state, id);
    update(answer.state);
    if (answer.added.length) playSfx('clue');
    if (answer.added.length) showReveal('새로운 증거 발견', revealLabel(answer.added));
    else announce(revealLabel(answer.added));
    return;
  }
  if (action === 'verdict') { update({ ...state, screen: 'verdict' }); return; }
  if (action === 'back-to-play') { update({ ...state, screen: 'play' }); return; }
  if (action === 'accuse') { update({ ...state, accusation: id }); return; }
  if (action === 'proof') { const next = toggleProof(state, id); update(next); if (next === state) announce('최대 3개의 증거를 선택할 수 있어.'); return; }
  if (action === 'submit') {
    const outcome = judgeAccusation(state.accusation, state.proof);
    update({ ...state, screen: 'result', result: outcome });
    playSfx(outcome.kind === 'correct' ? 'correct' : 'wrong');
  }
});

document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal) { modal = ''; render(); } });
window.addEventListener('storage', event => { if (event.key !== STORAGE_KEY) return; state = load(); modal = ''; render(); announce('다른 탭의 최신 진행 기록을 반영했어.'); });
render();
