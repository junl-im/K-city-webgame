import { CASE, GAME_VERSION, STORAGE_KEY, createGame, safeRestore, getSuspect, getEvidence, askQuestion, toggleProof, judgeAccusation } from './core.mjs';

const root = document.querySelector('#app');
const toastNode = document.querySelector('#toast');
let state = load();
let modal = '';
let toastTimeout;

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
function load() { try { return safeRestore(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { return createGame(); } }
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
function update(next) { state = next; const ok = save(); render(); if (!ok) announce('브라우저 저장 공간에 접근하지 못했어. 새로고침하면 진행 기록이 사라질 수 있어.'); }
function announce(message) { toastNode.hidden = false; toastNode.textContent = message; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toastNode.hidden = true; }, 3600); }
function revealLabel(ids) { return ids.length ? `새 증거 ${ids.length}개 발견 · ${ids.map(id => getEvidence(id)?.title).join(', ')}` : '진술을 확인했어.'; }

function header() {
  return `<header class="topbar">
    <button class="brand" data-action="home" aria-label="거짓말의 방 메인으로"><span class="brand-seal">狐</span><span><strong>거짓말의 방</strong><small>곰같은여우의 추리 기록</small></span></button>
    <div class="top-actions"><span class="pilot-mark">CASE FILE / 001</span><button class="round-button" data-action="help" aria-label="게임 안내">?</button></div>
  </header>`;
}

function home() {
  const canResume = state.asked.length > 0 || state.discovered.length > 2 || ['play', 'verdict', 'result'].includes(state.screen);
  return `<main class="home-screen">
    <div class="home-hero">
      <div class="hero-copy"><p class="eyebrow">MYSTERY · SOCIAL DEDUCTION</p><h1>누구나 비밀은 있다.<br><em>하지만 모두가 범인은 아니다.</em></h1><p class="hero-lead">세 사람, 서로 다른 거짓말. 진실을 밝혀낼 단서는 이미 사건 안에 있다.</p><div class="hero-actions"><button class="primary-button" data-action="new">첫 사건 수사하기 <span aria-hidden="true">↗</span></button>${canResume ? '<button class="quiet-button" data-action="resume">이어하기</button>' : ''}</div></div>
      <div class="hero-art"><img class="fox-hero-image" src="./assets/fox-detective.png" alt="" loading="eager"><div class="ribbon">RESTRICTED ACCESS</div><div class="hero-caption"><div class="hero-stamp">THE LIE ROOM</div><p>사건 속에 숨은 진실을 찾아라</p></div></div>
    </div>
    <div class="section-head"><div><p class="eyebrow">PLAY MODES</p><h2>수사 기록 보관소</h2></div><span class="subtle-text">5가지 모드 중 1가지 선공개</span></div>
    <section class="mode-grid" aria-label="게임 모드">
      <button class="mode-card mode-active" data-action="new"><span class="mode-number">01 / PLAYABLE</span><strong>심문실</strong><small>증언·증거·반전</small><span class="mode-go">사건 입장 ↗</span></button>
      <div class="mode-card mode-locked"><span class="mode-number">02 / COMING SOON</span><strong>수상한 방문객</strong><small>신분 판별·선택</small></div>
      <div class="mode-card mode-locked"><span class="mode-number">03 / COMING SOON</span><strong>사라진 메시지</strong><small>디지털 기록 수사</small></div>
      <div class="mode-card mode-locked"><span class="mode-number">04 / COMING SOON</span><strong>60초 미스터리</strong><small>빠른 결정적 단서</small></div>
      <div class="mode-card mode-locked"><span class="mode-number">05 / COMING SOON</span><strong>배신자 게임</strong><small>숨겨진 역할 심리전</small></div>
    </section>
    <footer class="site-footer">© 2026 곰같은여우 · 자체 창작 게임의 권리 보유 · 오프라인 규칙 엔진</footer>
  </main>`;
}

function intro() {
  return `<main class="intro-screen"><article class="case-opening">
    <p class="eyebrow">CASE FILE ${CASE.id}</p><div class="chapter-tag">1화 · 사라진 전시품</div><h1>${escapeHtml(CASE.title)}</h1>
    <p class="opening-location">${escapeHtml(CASE.location)}</p><p class="opening-story">${escapeHtml(CASE.description)}</p>
    <div class="mission-box"><strong>이번 사건의 임무</strong><p>${escapeHtml(CASE.objective)}</p></div>
    <div class="opening-rules"><span>용의자 3명</span><span>숨겨진 증거 5개</span><span>결론은 단 하나</span></div>
    <div class="intro-actions"><button class="primary-button" data-action="enter">심문 시작하기 ↗</button><button class="quiet-button" data-action="home">보관소로</button></div>
  </article></main>`;
}

function people() {
  return `<aside class="people-pane"><div class="pane-title"><span>PERSONNEL</span><strong>관계자</strong></div><div class="people-list">${CASE.suspects.map(person => `<button class="person-item ${state.selectedSuspect === person.id ? 'selected' : ''}" data-action="suspect" data-id="${person.id}" aria-pressed="${state.selectedSuspect === person.id}"><span class="person-avatar ${person.color}">${person.label}</span><span class="person-info"><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)}</small></span><span class="person-arrow" aria-hidden="true">›</span></button>`).join('')}</div><button class="history-link" data-action="history">심문 기록 보기 <span aria-hidden="true">↗</span></button></aside>`;
}

function portrait() {
  const person = getSuspect(state.selectedSuspect);
  return `<div class="portrait-stage ${person.color}"><div class="window-blind"></div><div class="portrait-mark">${person.label}</div><div class="portrait-shine"></div><div class="portrait-name"><span>WITNESS ${person.label}</span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)}</small></div><span class="portrait-hint">증언은 사실과 다를 수 있어</span></div>`;
}

function discussion() {
  const person = getSuspect(state.selectedSuspect);
  const last = [...state.log].reverse().find(item => item.who === person.name);
  const text = last ? last.text : person.intro;
  const questions = CASE.questions.filter(item => item.suspect === person.id);
  return `<section class="interrogation-pane">
    ${portrait()}
    <div class="dialogue-panel"><div class="dialogue-heading"><strong>${escapeHtml(person.name)}</strong><span>진술 확인</span></div><p>${escapeHtml(text)}</p></div>
    <div class="question-panel"><div class="pane-title"><span>QUESTION</span><strong>어떤 질문을 하겠어?</strong></div><div class="question-list">${questions.map((question, index) => `<button class="question-button" data-action="ask" data-id="${question.id}" ${state.asked.includes(question.id) ? 'disabled' : ''}><span>${index + 1 < 10 ? `0${index + 1}` : index + 1}</span><strong>${escapeHtml(question.title)}</strong><span class="question-arrow">${state.asked.includes(question.id) ? '확인' : '↗'}</span></button>`).join('')}</div></div>
  </section>`;
}

function evidence() {
  const discovered = state.discovered.map(id => getEvidence(id)).filter(Boolean);
  return `<aside class="evidence-pane"><div class="pane-title"><span>EVIDENCE</span><strong>확보한 증거 <small>${discovered.length} / ${CASE.evidence.length}</small></strong></div><p class="pane-description">증거를 눌러 출처와 발생 시각을 확인해봐.</p>
    <div class="evidence-list">${discovered.map(item => `<button class="evidence-card" data-action="detail" data-id="${item.id}"><span class="evidence-id">${item.icon}</span><span class="evidence-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.kind)} · ${escapeHtml(item.stamp)}</small></span><span class="evidence-open" aria-hidden="true">+</span></button>`).join('')}</div>
    <div class="submit-block"><p>거짓말이 진범을 뜻하지는 않아.</p><button class="primary-button" data-action="verdict">추리 정리 · 고발하기 ↗</button></div>
  </aside>`;
}

function play() {
  return `<main class="play-screen"><div class="game-bar"><div><p class="eyebrow">ACTIVE INVESTIGATION</p><strong>${escapeHtml(CASE.title)}</strong></div><div class="progress-tags"><span>질문 ${state.asked.length}/${CASE.questions.length}</span><span>증거 ${state.discovered.length}/${CASE.evidence.length}</span><button class="plain-button" data-action="home">저장 후 나가기</button></div></div><div class="game-layout">${people()}${discussion()}${evidence()}</div></main>`;
}

function verdict() {
  return `<main class="verdict-screen"><article class="verdict-sheet"><p class="eyebrow">FINAL DEDUCTION</p><h1>누가 은빛 가면을 가져갔을까?</h1><p class="verdict-lead">한 명을 지목하고, 범행과 연결되는 서로 다른 출처의 증거를 두 개 이상 골라줘.</p>
    <div class="verdict-subhead">01 · 용의자 지목</div><div class="accuse-list">${CASE.suspects.map(item => `<button class="accuse-button ${state.accusation === item.id ? 'active' : ''}" data-action="accuse" data-id="${item.id}" aria-pressed="${state.accusation === item.id}"><span>${item.label}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.role)}</small></button>`).join('')}</div>
    <div class="verdict-subhead">02 · 근거 선택 <small>${state.proof.length} / 3</small></div><div class="proof-list">${state.discovered.map(id => { const e = getEvidence(id); const selected = state.proof.includes(id); return `<button data-action="proof" data-id="${id}" class="proof-button ${selected ? 'active' : ''}" aria-pressed="${selected}"><span class="proof-check">${selected ? '✓' : '+'}</span><span><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.source)}</small></span></button>`; }).join('')}</div>
    <div class="verdict-actions"><button class="quiet-button" data-action="back-to-play">추가 조사</button><button class="primary-button" data-action="submit" ${!state.accusation || state.proof.length < 2 ? 'disabled' : ''}>최종 고발하기 ↗</button></div>
  </article></main>`;
}

function result() {
  const result = state.result || { kind: 'partial', heading: '더 조사해보자', explanation: '증거를 다시 확인해줘.' };
  return `<main class="result-screen"><article class="result-sheet ${result.kind}"><p class="eyebrow">CASE REPORT / ${CASE.id}</p><div class="result-symbol">${result.kind === 'correct' ? '✓' : result.kind === 'wrong' ? '×' : '?'}</div><h1>${escapeHtml(result.heading)}</h1><p>${escapeHtml(result.explanation)}</p>
  ${result.kind === 'correct' ? `<div class="truth-timeline"><strong>확정된 사건 시간선</strong><div>21:11 · B의 출입증을 C가 전달받음</div><div>21:13 · C의 PIN으로 경보 해제</div><div>21:14 · C의 뒷문 출입 확인</div><div>21:16 · 출고 상자에서 가면 발견</div></div><div class="completed-stamp">CASE SOLVED · 첫 사건 해결</div>` : `<div class="mission-box"><strong>다시 생각할 점</strong><p>의심스러운 진술과 범행의 직접 증거를 구분하면 진실에 더 가까워질 수 있어.</p></div>`}
    <div class="result-actions"><button class="primary-button" data-action="back-to-play">${result.kind === 'correct' ? '사건 다시 살펴보기' : '추가 조사하기'} ↗</button><button class="quiet-button" data-action="home">메인으로</button></div>
  </article></main>`;
}

function renderModal() {
  if (!modal) return '';
  if (modal === 'help') return `<div class="modal-backdrop" data-action="close"><section class="modal-card" role="dialog" aria-modal="true" aria-label="게임 방법"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">HOW TO PLAY</p><h2>거짓말을 찾는 세 단계</h2><ol><li>관계자를 선택해 여러 질문을 해봐.</li><li>확보한 증거의 출처와 시간대를 비교해.</li><li>범인과 독립적인 증거를 두 개 이상 제출해.</li></ol><p class="modal-note">거짓말이 꼭 범죄를 뜻하지는 않아. 질문과 증거를 신중하게 연결해봐.</p></section></div>`;
  if (modal === 'history') return `<div class="modal-backdrop" data-action="close"><section class="modal-card history-modal" role="dialog" aria-modal="true" aria-label="심문 기록"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">INTERROGATION LOG</p><h2>심문 기록</h2><div class="transcript">${state.log.map(item => `<div class="transcript-entry"><strong>${escapeHtml(item.who)}</strong><p>${escapeHtml(item.text)}</p></div>`).join('')}</div></section></div>`;
  const e = getEvidence(modal);
  if (!e) return '';
  return `<div class="modal-backdrop" data-action="close"><section class="modal-card detail-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(e.title)}"><button class="close-button" data-action="close" aria-label="닫기">×</button><p class="eyebrow">EVIDENCE / ${escapeHtml(e.id)}</p><div class="clue-graphic"><span>${escapeHtml(e.icon)}</span><small>${escapeHtml(e.kind)}</small></div><h2>${escapeHtml(e.title)}</h2><p class="detail-stamp">기록 시각 ${escapeHtml(e.stamp)} · ${escapeHtml(e.source)}</p><p>${escapeHtml(e.detail)}</p><div class="evidence-insight"><strong>수사 포인트</strong><span>${escapeHtml(e.leads)}</span></div><button class="primary-button" data-action="close">기록 확인</button></section></div>`;
}

function render() {
  const current = state.screen;
  root.innerHTML = `<div class="app-shell">${header()}${current === 'home' ? home() : current === 'intro' ? intro() : current === 'play' ? play() : current === 'verdict' ? verdict() : result()}${renderModal()}</div>`;
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog) dialog.querySelector('.close-button')?.focus();
}

root.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'close' && event.target.closest('.modal-card') && event.target !== button) return;
  if (action === 'close') { modal = ''; render(); return; }
  if (action === 'help' || action === 'history' || action === 'detail') { modal = action === 'detail' ? id : action; render(); return; }
  if (action === 'home') { modal = ''; update({ ...state, screen: 'home' }); return; }
  if (action === 'new') { modal = ''; update({ ...createGame(), screen: 'intro' }); return; }
  if (action === 'resume') { modal = ''; update({ ...state, screen: state.result ? 'result' : 'play' }); return; }
  if (action === 'enter') { update({ ...state, screen: 'play' }); return; }
  if (action === 'suspect') { update({ ...state, selectedSuspect: id }); return; }
  if (action === 'ask') {
    const answer = askQuestion(state, id);
    update(answer.state);
    announce(revealLabel(answer.added));
    return;
  }
  if (action === 'verdict') { update({ ...state, screen: 'verdict' }); return; }
  if (action === 'back-to-play') { update({ ...state, screen: 'play' }); return; }
  if (action === 'accuse') { update({ ...state, accusation: id }); return; }
  if (action === 'proof') { const next = toggleProof(state, id); update(next); if (next === state) announce('최대 3개의 증거를 선택할 수 있어.'); return; }
  if (action === 'submit') {
    const outcome = judgeAccusation(state.accusation, state.proof);
    update({ ...state, screen: 'result', result: outcome });
  }
});

document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal) { modal = ''; render(); } });
window.addEventListener('storage', event => { if (event.key !== STORAGE_KEY) return; state = load(); modal = ''; render(); announce('다른 탭의 최신 진행 기록을 반영했어.'); });
render();
