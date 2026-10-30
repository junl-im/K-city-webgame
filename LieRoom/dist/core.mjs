// 《거짓말의 방》 — deterministic, zero-API case engine.
// © 2026 곰같은여우. All rights reserved.

export const GAME_VERSION = 1;
export const STORAGE_KEY = 'gomfox.lie-room.v1';

export const CASE = Object.freeze({
  id: 'LR-001',
  title: '사라진 은빛 가면',
  location: '여우 미술관 · 야간 전시실',
  description: '밤 9시 18분, 특별 전시 중이던 은빛 가면이 사라졌다. 현장에 접근할 수 있었던 세 사람은 모두 자신에게 불리한 사실을 숨기고 있다.',
  objective: '거짓말을 찾아내고, 진범과 범행을 입증할 두 가지 독립 증거를 제출하라.',
  culprit: 'C',
  suspects: [
    { id: 'A', name: '한유리', role: '야간 경비원', label: 'A', color: 'peach', intro: '그 시간엔 계속 로비에 있었어요. 전시실엔 가지 않았고요.', secret: '근무 도중 가족을 만나러 잠시 자리를 비웠지만 절도에는 관여하지 않았다.' },
    { id: 'B', name: '윤서진', role: '전시 기획자', label: 'B', color: 'lavender', intro: '출입증은 늘 제가 갖고 있었어요. 남에게 빌려준 적 없어요.', secret: '규정을 어기고 C에게 출입증을 빌려줬으나 도난은 몰랐다.' },
    { id: 'C', name: '박도하', role: '전시 보조원', label: 'C', color: 'sage', intro: '그날 전시실 근처에는 간 적도 없습니다. 포장 업무만 했어요.', secret: 'B의 출입증으로 들어가 경보를 해제한 후 은빛 가면을 출고 상자에 숨겼다.' },
  ],
  evidence: [
    { id: 'E01', title: '전시장 출입 기록', stamp: '21:12', kind: '시스템 로그', icon: '01', detail: '21:12에 기획자 윤서진(B)의 출입증이 사용됐다. 이 기록만으로 실제 사용자를 특정할 수는 없다.', source: '미술관 전자 출입 서버', leads: 'B의 카드 사용 사실 확인', unlock: null },
    { id: 'E02', title: '도난 신고서', stamp: '21:18', kind: '공식 기록', icon: '02', detail: '전시 담당자가 21:18에 은빛 가면 분실을 확인했다. 21:10~21:18 사이 출입 인물의 동선이 핵심이다.', source: '미술관 당직 보고서', leads: '사건 시간 범위', unlock: null },
    { id: 'E03', title: '복도 목격 메모', stamp: '21:13', kind: '목격 기록', icon: '03', detail: '직원은 21:13에 경비원 한유리(A)를 전시장 옆 복도에서 봤다. A의 로비 근무 진술은 틀렸지만, 가면 절도와의 연결은 없다.', source: '청소 직원의 서명 메모', leads: 'A의 알리바이 모순', unlock: 'a-alibi' },
    { id: 'E04', title: '출입증 전달 사진', stamp: '21:11', kind: '현장 사진', icon: '04', detail: '21:11 사진에는 윤서진(B)이 박도하(C)에게 목걸이형 출입증을 건네는 장면이 찍혔다. B의 거짓말은 드러났지만 실제 사용자는 아직 검증해야 한다.', source: '직원 휴게실 카메라', leads: 'B의 출입증 대여와 C의 카드 소지', unlock: 'b-card' },
    { id: 'E05', title: '경보 해제 로그', stamp: '21:13', kind: '보안 기록', icon: '05', detail: '전시실 경보가 21:13에 박도하(C) 개인에게 부여된 PIN으로 해제됐다. 해당 시각 PIN 입력을 확인하는 별도의 장치 기록이다.', source: '경보 장치 내부 로그', leads: 'C의 비밀 출입 가능성', unlock: 'c-alarm' },
    { id: 'E06', title: '뒷문 CCTV', stamp: '21:14', kind: '영상 기록', icon: '06', detail: '전시장 뒷문 CCTV에는 21:14 박도하(C)가 포장 상자를 들고 나오는 장면이 남아 있다. C가 전시장에 가지 않았다는 진술과 정면으로 충돌한다.', source: '전시실 뒤편 고정 카메라', leads: 'C의 전시장 출입 직접 확인', unlock: 'c-gallery' },
    { id: 'E07', title: '출고 명세서', stamp: '21:16', kind: '물류 기록', icon: '07', detail: '21:16 박도하(C) 이름으로 등록된 출고 상자의 무게가 출고 신청서보다 상당히 무겁다. 상자의 봉인과 실물 확인으로 은빛 가면이 발견된다.', source: '미술관 물류 출고 시스템', leads: '가면 반출을 입증하는 물류 기록', unlock: 'c-parcel' },
  ],
  questions: [
    { id: 'a-alibi', suspect: 'A', title: '9시 10분부터 어디에 있었나요?', reply: '로비에만 있었다고 했지만… 잠시 가족을 만나러 복도로 나갔어요. 미안해요. 경비 근무를 비운 게 드러날까 봐 숨겼어요.', reveals: ['E03'] },
    { id: 'a-people', suspect: 'A', title: '그날 다른 직원은 봤나요?', reply: '서진 씨가 보조원 도하 씨와 근무 교대를 이야기하는 건 들었어요. 물건을 옮기는 일은 평소에도 있었고요.', reveals: [] },
    { id: 'b-card', suspect: 'B', title: '출입증을 다른 사람에게 준 적 있나요?', reply: '사실 도하 씨가 물품 확인이 급하다고 해서 잠깐 빌려줬어요. 제가 규정을 어긴 건 맞지만, 도난은 정말 몰랐어요.', reveals: ['E04'] },
    { id: 'b-schedule', suspect: 'B', title: '당시 전시실에 왜 출입해야 했나요?', reply: '새 물품 반입을 준비하는 시간이었어요. 제 카드는 그 시간대에 통할 수 있었지만 직접 들어갔던 건 아니에요.', reveals: [] },
    { id: 'c-gallery', suspect: 'C', title: '전시장 뒷문을 통과했나요?', reply: '아니요, 제가 뒷문에 갔다니요? 누군가 제 옷차림을 착각한 거겠죠.', reveals: ['E06'] },
    { id: 'c-alarm', suspect: 'C', title: '보안 경보 PIN은 누가 알고 있나요?', reply: '보조원마다 개인 번호가 있긴 해요. 하지만 저는 그날 경보 장치를 만진 적이 없어요.', reveals: ['E05'] },
    { id: 'c-parcel', suspect: 'C', title: '9시 16분 출고 상자는 무엇이었나요?', reply: '평범한 포장재였을 거예요. 정확히 기억나진 않아요. 무게까지 제가 확인하진 않았습니다.', reveals: ['E07'] },
  ],
});

// Evidence confrontation is optional: it deepens the interview without blocking the verdict.
export const CONFRONTATIONS = Object.freeze([
  { id: 'F01', suspect: 'A', evidence: 'E03', question: 'a-alibi', prompt: '복도 목격 기록에는 21시 13분에 당신이 있었다고 적혀 있어요.', reply: '맞아요. 가족이 걱정돼서 잠깐 만났어요. 근무지를 비운 게 들킬까 봐 로비에 있었다고 거짓말했어요. 가면은 손대지 않았어요.', insight: '근무 규정 위반을 감추려는 거짓말과 절도 증거는 서로 다르다.' },
  { id: 'F02', suspect: 'B', evidence: 'E04', question: 'b-card', prompt: '출입증을 도하 씨에게 건네는 장면이 사진에 찍혔어요.', reply: '사진은 사실이에요. 출입증을 빌려준 일로 징계를 받을까 봐 숨겼죠. 하지만 도하 씨가 그걸로 뭘 할지는 몰랐어요.', insight: '출입증 소유자와 실제 사용자를 구분해야 한다.' },
  { id: 'F03', suspect: 'C', evidence: 'E05', question: 'c-alarm', prompt: '경보 장치에 당신 개인 PIN이 입력된 기록이 있어요.', reply: '제 PIN을 누가 알아냈을 수도 있잖아요. 저는 경보 장치를 해제한 적이 없어요. 기록만으로 저라고 할 수 있나요?', insight: '개인 PIN은 중요한 연결고리지만 영상 또는 물류 기록과 교차 확인해야 한다.' },
  { id: 'F04', suspect: 'C', evidence: 'E06', question: 'c-gallery', prompt: '21시 14분 뒷문 영상에 포장 상자를 든 당신이 보여요.', reply: '…포장재를 옮기러 갔던 건 맞아요. 전시실 근처에는 안 갔다고 한 건 잘못 말했어요. 하지만 상자 안이 가면이었다는 증거는요?', insight: '전시장 접근에 대한 부인은 뒤집혔다. 상자의 내용물을 입증할 자료가 남아 있다.' },
  { id: 'F05', suspect: 'C', evidence: 'E07', question: 'c-parcel', prompt: '당신 명의로 출고된 상자는 신고한 물품보다 훨씬 무거웠어요.', reply: '그건… 포장할 때 제가 따로 넣은 게 있어서… 정확히 기억나지 않아요. 실제 상자를 열어 봤나요?', insight: '출고 기록만으로는 내용물을 단정할 수 없다. 상자의 봉인과 실물 확인 결과를 함께 보자.' },
]);

// LR-003: optional psychology choices. Non-verbal cues do not replace evidence.
export const TACTICS = Object.freeze([
  { id: 'A_E', suspect: 'A', tone: 'empathy', label: '가족 사정 이해하기', prompt: '근무를 떠날 수밖에 없었던 이유부터 차분히 말해줄래요?', reply: '가족에게 급한 일이 있었어요. 경비원으로서 잘못했지만, 그게 가면을 훔쳤다는 뜻은 아니잖아요.', signal: '가족 이야기를 할 때 말의 속도가 느려지고 어깨의 긴장이 풀린다.' },
  { id: 'A_P', suspect: 'A', tone: 'pressure', label: '근무 이탈 추궁하기', prompt: '당신이 자리를 비운 순간에 가면이 사라졌어요. 왜 숨겼죠?', reply: '근무 기록 때문에 혼날까 봐요! 제가 잘못한 건 알지만 도둑으로 몰아가진 말아 주세요.', signal: '근무 규정 이야기에 즉각 반응하지만 전시품의 위치에 대한 정보는 드러나지 않는다.' },
  { id: 'B_E', suspect: 'B', tone: 'empathy', label: '규정 위반과 절도 구분하기', prompt: '출입증을 빌려준 실수와 도난에 관여한 일은 다를 수 있어요.', reply: '그렇게 말해 주니 다행이에요. 카드 사용 기록 때문에 제가 범인으로 보일까 두려웠어요.', signal: '출입증의 책임을 언급하자 설명이 길어진다. 실제 사용자 확인은 여전히 필요하다.' },
  { id: 'B_P', suspect: 'B', tone: 'pressure', label: '출입증 책임 묻기', prompt: '규정을 어기고 출입증을 건넨 사실을 왜 처음부터 감췄나요?', reply: '징계가 무서웠어요. 그렇다고 제가 가면을 가져간 건 아니에요. 사용한 사람을 먼저 확인해 주세요.', signal: '질문의 핵심이 범행에서 징계로 옮겨갈 때 방어적으로 변한다.' },
  { id: 'C_E', suspect: 'C', tone: 'empathy', label: '포장 업무부터 듣기', prompt: '바쁜 포장 근무 중이었겠죠. 당시 동선부터 함께 정리해 볼까요?', reply: '상자가 여럿이었어요. 제가 어디를 들렀는지 하나하나 기억할 자신은 없어요.', signal: '동선을 넓게 설명하지만 시각과 상자 번호를 특정하는 데 주저한다.' },
  { id: 'C_P', suspect: 'C', tone: 'pressure', label: '동선 모순 압박하기', prompt: '경보 기록과 뒷문 영상이 달라요. 같은 설명을 반복할 생각인가요?', reply: '기록이 전부 정확하다는 보장이 있나요? 그날 포장 업무가 얼마나 혼잡했는지 아세요?', signal: '질문에 직접 답하지 않고 기록 자체의 신뢰성을 먼저 공격한다.' },
]);

export function getPsychology(state, suspectId) {
  let trust = 0;
  let stress = 0;
  for (const id of state.tactics || []) {
    const tactic = TACTICS.find(item => item.id === id);
    if (!tactic || tactic.suspect !== suspectId) continue;
    if (tactic.tone === 'empathy') {
      if (stress > 0) { stress = Math.max(0, stress - 1); trust = Math.min(3, trust + 1); }
      else trust = Math.min(3, trust + 2);
    } else if (trust > 0) {
      // Established rapport cushions a hard question, but tension still rises.
      stress = Math.min(3, stress + 1);
    } else stress = Math.min(3, stress + 2);
  }
  const label = stress >= 2 ? '경계' : trust >= 2 ? '신뢰' : '신중';
  return { trust, stress, label };
}

export function applyTactic(state, tacticId) {
  const tactic = TACTICS.find(item => item.id === tacticId);
  if (!tactic || tactic.suspect !== state.selectedSuspect || state.tactics?.includes(tacticId)) return { state, message: '', signal: '' };
  const before = getPsychology(state, tactic.suspect);
  const reply = before.stress >= 2 && tactic.tone === 'empathy'
    ? '상대는 경계를 늦추지 않지만 조금씩 설명을 이어간다. ' + tactic.reply
    : before.trust >= 2 && tactic.tone === 'pressure'
      ? '상대는 감정을 추스르며 답한다. ' + tactic.reply
      : tactic.reply;
  const next = {
    ...state, tactics: [...(state.tactics || []), tacticId],
    log: [...state.log, { who: '나 · 심리 접근', text: tactic.prompt }, { who: getSuspect(tactic.suspect).name, text: reply }].slice(-22),
  };
  return { state: next, message: reply, signal: tactic.signal };
}

export function getConfrontation(suspectId, evidenceId) {
  return CONFRONTATIONS.find(item => item.suspect === suspectId && item.evidence === evidenceId);
}

export function canConfront(state, evidenceId) {
  const entry = getConfrontation(state.selectedSuspect, evidenceId);
  return Boolean(entry && state.discovered.includes(evidenceId) && state.asked.includes(entry.question) && !state.confronted?.includes(entry.id));
}

export function confrontEvidence(state, evidenceId) {
  if (!canConfront(state, evidenceId)) return { state, message: '', insight: '' };
  const entry = getConfrontation(state.selectedSuspect, evidenceId);
  const next = {
    ...state,
    confronted: [...(state.confronted || []), entry.id],
    log: [...state.log, { who: '나 · 증거 제시', text: entry.prompt }, { who: getSuspect(entry.suspect).name, text: (
      getPsychology(state, entry.suspect).stress >= 2 ? '상대가 목소리를 높인다. ' :
      getPsychology(state, entry.suspect).trust >= 2 ? '상대는 질문을 끝까지 듣고 답한다. ' : ''
    ) + entry.reply }].slice(-22),
  };
  return { state: next, message: next.log.at(-1).text, insight: entry.insight };
}

const defaultLog = [{ who: '사건 기록', text: '은빛 가면이 사라졌다. 세 사람을 심문하고 서로 다른 출처의 증거를 모아 진상을 밝히자.' }];

export function createGame() {
  return {
    version: GAME_VERSION, caseId: CASE.id, screen: 'home', selectedSuspect: 'A',
    asked: [], confronted: [], tactics: [], discovered: ['E01', 'E02'], proof: [], accusation: '',
    log: defaultLog.map(item => ({ ...item })), result: null, detailId: '',
  };
}

export function getSuspect(id) { return CASE.suspects.find(item => item.id === id); }
export function getEvidence(id) { return CASE.evidence.find(item => item.id === id); }
export function getQuestion(id) { return CASE.questions.find(item => item.id === id); }

export function safeRestore(input) {
  const base = createGame();
  if (!input || typeof input !== 'object' || input.version !== GAME_VERSION || input.caseId !== CASE.id) return base;
  const validEvidence = CASE.evidence.map(item => item.id);
  const validQuestions = CASE.questions.map(item => item.id);
  const discovered = [...new Set((Array.isArray(input.discovered) ? input.discovered : []).filter(id => validEvidence.includes(id)))];
  for (const id of ['E01', 'E02']) if (!discovered.includes(id)) discovered.unshift(id);
  const asked = [...new Set((Array.isArray(input.asked) ? input.asked : []).filter(id => validQuestions.includes(id)))];
  return {
    ...base,
    screen: ['home', 'intro', 'play', 'verdict', 'result'].includes(input.screen) ? input.screen : 'home',
    selectedSuspect: getSuspect(input.selectedSuspect) ? input.selectedSuspect : 'A',
    asked,
    tactics: [...new Set((Array.isArray(input.tactics) ? input.tactics : []).filter(id => TACTICS.some(item => item.id === id)))],
    confronted: [...new Set((Array.isArray(input.confronted) ? input.confronted : []).filter(id => {
      const item = CONFRONTATIONS.find(c => c.id === id);
      return item && discovered.includes(item.evidence) && asked.includes(item.question);
    }))],
    discovered,
    proof: [...new Set((Array.isArray(input.proof) ? input.proof : []).filter(id => discovered.includes(id)))].slice(0, 3),
    accusation: getSuspect(input.accusation) ? input.accusation : '',
    log: Array.isArray(input.log) ? input.log.filter(v => v && typeof v.who === 'string' && typeof v.text === 'string').slice(-22) : base.log,
    result: input.result && ['correct', 'partial', 'wrong'].includes(input.result.kind) ? input.result : null,
    detailId: '',
  };
}

export function askQuestion(state, questionId) {
  const question = getQuestion(questionId);
  if (!question || question.suspect !== state.selectedSuspect) return { state, added: [], message: '' };
  if (state.asked.includes(questionId)) return { state, added: [], message: '이 질문은 이미 확인했어.' };
  const added = question.reveals.filter(id => !state.discovered.includes(id));
  const suspect = getSuspect(question.suspect);
  const next = {
    ...state,
    asked: [...state.asked, questionId],
    discovered: [...state.discovered, ...added],
    log: [...state.log, { who: '나', text: question.title }, { who: suspect.name, text: (
      getPsychology(state, question.suspect).stress >= 2 ? '상대는 한동안 말없이 손을 만지작거린다. ' :
      getPsychology(state, question.suspect).trust >= 2 ? '상대는 차분해진 목소리로 말한다. ' : ''
    ) + question.reply }].slice(-22),
  };
  return { state: next, added, message: next.log.at(-1).text };
}

// LR-006: only discovered evidence appears; unknown clues and the solution stay hidden.
export function getInvestigationTimeline(state) {
  const found = new Set(state.discovered || []);
  const confronted = new Set(state.confronted || []);
  return CASE.evidence
    .filter(item => found.has(item.id))
    .map(item => {
      const match = CONFRONTATIONS.find(entry => entry.evidence === item.id);
      return {
        id: item.id,
        stamp: item.stamp,
        title: item.title,
        source: item.source,
        leads: item.leads,
        confrontation: match && confronted.has(match.id) ? '대질 완료' : '기록 확보',
      };
    })
    .sort((a, b) => a.stamp.localeCompare(b.stamp, 'ko') || a.id.localeCompare(b.id));
}

export function toggleProof(state, evidenceId) {
  if (!state.discovered.includes(evidenceId)) return state;
  if (state.proof.includes(evidenceId)) return { ...state, proof: state.proof.filter(id => id !== evidenceId) };
  if (state.proof.length >= 3) return state;
  return { ...state, proof: [...state.proof, evidenceId] };
}

export function judgeAccusation(suspectId, proofIds) {
  const selected = [...new Set(proofIds.filter(id => getEvidence(id)))];
  if (!getSuspect(suspectId) || selected.length < 2) return { kind: 'partial', heading: '증거가 더 필요해', explanation: '두 가지 이상의 서로 다른 기록을 증거로 선택해줘. 단순한 거짓말만으로 범인을 단정할 수는 없어.' };
  if (suspectId !== CASE.culprit) return { kind: 'wrong', heading: '의심이 진실을 가렸어', explanation: suspectId === 'A' ? 'A는 로비 근무를 이탈한 사실을 숨겼지만 절도에 관여하지 않았어. 경보와 반출 증거를 다시 보자.' : 'B는 출입증 대여를 숨겼어. 하지만 카드가 사용됐다는 기록과 실제 사용자가 같다는 뜻은 아니야.' };
  const hasPersonalAlarm = selected.includes('E05');
  const hasIndependentTrail = selected.includes('E06') || selected.includes('E07');
  if (!hasPersonalAlarm || !hasIndependentTrail) return { kind: 'partial', heading: '범인은 맞혔지만 입증이 부족해', explanation: 'C가 수상한 건 맞지만 확정하려면 경보 PIN 기록과 독립적인 CCTV 또는 물류 기록을 함께 제시해야 해.' };
  return { kind: 'correct', heading: '사건 해결 · 진범 확인', explanation: 'C는 B의 출입증을 빌려 전시장에 접근하고 자신의 PIN으로 경보를 해제했어. 이후 CCTV와 출고 기록으로 반출 행적이 확인됐지. A와 B의 거짓말은 다른 이유에서 나온 것이었어.' };
}

export function validateCaseDefinition() {
  const errors = [];
  const ids = CASE.evidence.map(e => e.id);
  if (new Set(ids).size !== ids.length) errors.push('duplicate evidence IDs');
  const qs = CASE.questions.map(q => q.id);
  if (new Set(qs).size !== qs.length) errors.push('duplicate question IDs');
  for (const e of CASE.evidence) if (e.unlock && !qs.includes(e.unlock)) errors.push(`missing unlock question ${e.id}`);
  for (const q of CASE.questions) {
    if (!getSuspect(q.suspect)) errors.push(`unknown suspect ${q.id}`);
    for (const id of q.reveals) if (!ids.includes(id)) errors.push(`missing evidence ${id}`);
  }
  for (const e of CASE.evidence) if (e.unlock && !getQuestion(e.unlock).reveals.includes(e.id)) errors.push(`unreachable evidence ${e.id}`);
  const tacticIds = TACTICS.map(t => t.id);
  if (new Set(tacticIds).size !== tacticIds.length) errors.push('duplicate tactic IDs');
  for (const tactic of TACTICS) if (!getSuspect(tactic.suspect) || !['empathy', 'pressure'].includes(tactic.tone)) errors.push(`invalid tactic ${tactic.id}`);
  const confrontationIds = CONFRONTATIONS.map(c => c.id);
  if (new Set(confrontationIds).size !== confrontationIds.length) errors.push('duplicate confrontation IDs');
  for (const item of CONFRONTATIONS) {
    const q = getQuestion(item.question);
    if (!getSuspect(item.suspect) || !getEvidence(item.evidence) || !q || q.suspect !== item.suspect || !q.reveals.includes(item.evidence)) {
      errors.push(`invalid confrontation ${item.id}`);
    }
  }
  if (!getSuspect(CASE.culprit)) errors.push('culprit missing');
  if (judgeAccusation(CASE.culprit, ['E05', 'E06']).kind !== 'correct') errors.push('solution cannot be reached');
  return errors;
}
