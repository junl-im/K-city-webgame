// 《거짓말의 방》 LR-002 — 사라진 마지막 녹음
// 사건별 독립 저장 공간. LR-001 엔진과 원본 세이브는 변경하지 않는다.
// © 2026 곰같은여우. All rights reserved.

export const GAME_VERSION = 1;
export const STORAGE_KEY = 'gomfox.lie-room.case2.v1';

export const CASE = Object.freeze({
  id: 'LR-002',
  chapter: '2화 · 삭제된 목소리',
  title: '사라진 마지막 녹음',
  location: '여우 미술관 · 비공개 보존실',
  description: '밤 10시 13분, 진품 논란을 종결할 비공개 인터뷰의 원본 녹음 카드가 사라졌다. 미술관 관장, 복원사, 탐사 기자는 서로를 의심하지만 모두 다른 이유로 그날의 동선을 숨긴다.',
  objective: '세 사람의 거짓말을 구별하고 녹음 카드의 반출자와 원본 파일의 행방을 서로 독립적인 물증으로 입증하라.',
  finalQuestion: '누가 비공개 녹음을 빼돌렸을까?',
  culprit: 'F',
  openingLog: '진품 논란을 풀 녹음 카드가 보존실에서 사라졌다. 마지막으로 장치를 만진 사람과 파일의 이동 경로를 구분해 조사하자.',
  truthTimeline: [
    '22:05 · 최강현 관장의 비공개 면담. 녹음 카드는 그대로 보존됨',
    '22:10 · 서라온의 점검 사진에 밀봉된 녹음 카드가 확인됨',
    '22:11 · 차민혁 기자의 등록 장치가 보존실 카드 리더에 연결됨',
    '22:12 · 기자가 전용 케이스를 들고 서쪽 복도를 나가는 모습이 촬영됨',
    '22:16 · 기자 노트북 임시 파일의 해시가 사라진 녹음 원본과 일치함',
  ],
  suspects: [
    { id: 'D', name: '최강현', role: '미술관 관장', label: 'D', color: 'burgundy',
      intro: '그날 보존실 문 앞에도 간 적 없습니다. 제 일정은 전부 기록되어 있어요.',
      secret: '후원자와 비공개로 만났고 방문 사실을 숨겼다. 관장이 만난 시점은 카드가 사라지기 전이다.' },
    { id: 'E', name: '서라온', role: '미술품 복원사', label: 'E', color: 'teal',
      intro: '퇴근 전까지 장치에 손댄 적 없어요. 복원 보고서만 작성했죠.',
      secret: '손상된 녹음 장치의 보호 덮개를 임시 수리했다. 규정 위반을 숨겼지만 카드의 마지막 생존 사진을 남겼다.' },
    { id: 'F', name: '차민혁', role: '탐사 기자', label: 'F', color: 'indigo',
      intro: '저는 취재 허가가 없어서 복도 밖에서 기다렸어요. 원본을 본 적도 없고요.',
      secret: '보존실 리더에 등록된 취재 장비로 카드를 읽고 반출하여 자신의 노트북에 복제했다. 기사의 독점 공개를 위해 증거를 독차지하려 했다.' },
  ],
  evidence: [
    { id: 'E01', title: '원본 녹음 해시 기록', stamp: '22:02', kind: '음성 장치 로그', icon: '01',
      detail: '녹음 종료 시각 22:02. 봉인 카드의 원본 파일 해시는 8C71-A2이며 미술관 저장 장치에 별도로 기록됐다. 해시만으로 카드를 가져간 사람은 알 수 없다.',
      source: '보존실 오프라인 녹음기', leads: '원본 파일의 동일성 확인 기준', unlock: null },
    { id: 'E02', title: '보존실 분실 신고', stamp: '22:13', kind: '당직 보고서', icon: '02',
      detail: '당직자는 22:13에 녹음 카드 분실을 신고했다. 마지막 점검 이후 실제 반출까지의 시간대를 조사해야 한다.',
      source: '미술관 야간 당직대장', leads: '카드가 사라진 것으로 확인된 시점', unlock: null },
    { id: 'E03', title: '관장 면담 예약 메모', stamp: '22:05', kind: '방문 기록', icon: '03',
      detail: '관장 최강현은 22:05 후원자와 보존실 앞 상담실에 있었다. 그는 면담 사실을 숨겼지만 이후 카드 반출을 직접 입증하는 기록은 없다.',
      source: '후원자 안내 직원의 수기 예약부', leads: 'D가 숨긴 비공개 면담의 존재', unlock: 'd-meeting' },
    { id: 'E04', title: '덮개 수리 전후 사진', stamp: '22:10', kind: '작업 사진', icon: '04',
      detail: '복원사 서라온이 규정과 달리 녹음기 덮개를 직접 수리했다. 사진에는 22:10까지 밀봉된 원본 카드가 슬롯에 남아 있다.',
      source: '보존 작업실 카메라와 정비 노트', leads: 'E의 숨겨진 수리와 카드 최종 생존 시각', unlock: 'e-photo' },
    { id: 'E05', title: '취재 장치 연결 이력', stamp: '22:11', kind: '카드 리더 감사 로그', icon: '05',
      detail: '22:11, 보존실 카드 리더에 기자 차민혁의 취재 장비 일련번호 CM-27이 직접 연결됐다. 인증 서명은 기기 등록 장부와 일치한다. 단독으로는 반출까지 증명하지 않는다.',
      source: '보존실 카드 리더와 장비 등록부', leads: 'F의 접근 시각과 고유 장치 연결', unlock: 'f-device' },
    { id: 'E06', title: '서쪽 복도 영상', stamp: '22:12', kind: '보안 영상', icon: '06',
      detail: '22:12, 차민혁 기자가 녹음기 전용 케이스를 들고 보존실에서 나오는 모습이 촬영됐다. 케이스의 내용물은 화면만으로 단정할 수 없다.',
      source: '서쪽 복도 독립 CCTV', leads: 'F의 보존실 진입과 케이스 반출 동선', unlock: 'f-corridor' },
    { id: 'E07', title: '기자 노트북 임시 복제', stamp: '22:16', kind: '파일 검증 보고', icon: '07',
      detail: '기자 노트북의 승인된 분석 사본에서 22:16 생성된 음성 파일의 해시 8C71-A2가 확인됐다. E01의 원본 해시와 정확히 일치해 반출 후 복제된 원본임을 입증한다.',
      source: '디지털 감식 장비의 파일 해시 결과', leads: '사라진 녹음 원본과 F 장비의 직접 연결', unlock: 'f-copy' },
  ],
  questions: [
    { id: 'd-meeting', suspect: 'D', title: '22시 5분 면담을 숨긴 이유가 있나요?',
      reply: '후원자와 불편한 약속이 있었어요. 전시 진위와 무관한 사적인 협상이라 밝히고 싶지 않았습니다. 제 동선이 의심스럽다는 건 인정하죠.',
      reveals: ['E03'] },
    { id: 'd-security', suspect: 'D', title: '보존실 녹음기 보안은 누가 관리했나요?',
      reply: '녹음기 리더는 연결된 장비 번호를 기록해요. 누가 문을 열었는지와 실제로 파일을 가져갔는지는 다른 문제입니다.',
      reveals: [] },
    { id: 'e-photo', suspect: 'E', title: '녹음기 덮개를 고친 적이 있나요?',
      reply: '…덮개가 들떠서 잠깐 손봤어요. 사전 승인을 받지 못해 숨겼지만, 사진을 찍어 두었어요. 그때 카드는 분명히 있었습니다.',
      reveals: ['E04'] },
    { id: 'e-people', suspect: 'E', title: '작업을 마친 뒤 누구를 보았나요?',
      reply: '제가 나올 때 복도 끝에 기자님이 있었어요. 관장님과 약속이 있는 줄 알았죠. 평소 취재 장비를 들고 다니더군요.',
      reveals: [] },
    { id: 'f-device', suspect: 'F', title: 'CM-27 취재 장비를 보존실에 연결했나요?',
      reply: '기기는 제 것이 맞지만… 연결을 했다는 건 착각 아닐까요? 장비 번호는 여러 사람이 볼 수도 있잖아요.',
      reveals: ['E05'] },
    { id: 'f-corridor', suspect: 'F', title: '서쪽 복도를 나온 시간은 언제였나요?',
      reply: '저는 그쪽에 간 적이 없어요. 케이스를 들고 다니는 사람은 많습니다. 화면이 그렇게 선명한가요?',
      reveals: ['E06'] },
    { id: 'f-copy', suspect: 'F', title: '노트북에 남은 원본 복제 파일은 무엇이죠?',
      reply: '그 파일은… 제보자가 보내준 것일 수도 있어요. 해시가 같더라도 제 손으로 카드를 가져갔다고 단정할 수는 없잖아요.',
      reveals: ['E07'] },
  ],
});

export const CONFRONTATIONS = Object.freeze([
  { id: 'G01', suspect: 'D', evidence: 'E03', question: 'd-meeting',
    prompt: '방문 예약부에는 22시 5분 당신의 면담이 적혀 있어요.',
    reply: '인정합니다. 후원자의 재정 문제를 감추고 싶었어요. 하지만 녹음 카드는 그 뒤에도 보존실에 있었죠.',
    insight: '관장의 비밀 면담은 사실이지만 22:10 사진과 반출의 연결은 없다.' },
  { id: 'G02', suspect: 'E', evidence: 'E04', question: 'e-photo',
    prompt: '덮개 수리 사진에 분실된 카드가 아직 보이는군요.',
    reply: '맞아요. 무단으로 만진 걸 숨겼지만 녹음은 가져가지 않았어요. 수리 직후 찍은 사진의 촬영 시각을 검증해 주세요.',
    insight: '복원사의 규정 위반과 카드 절취는 별개의 사건이다.' },
  { id: 'G03', suspect: 'F', evidence: 'E05', question: 'f-device',
    prompt: '당신의 취재 장비 CM-27이 카드 리더에 연결됐어요.',
    reply: '제 장비니까 기록이 남을 수 있겠죠. 연결만으로 가져간 사람을 증명하지는 못합니다.',
    insight: '연결 기록은 접근의 객관적 증거지만 원본 소지까지는 추가 입증해야 한다.' },
  { id: 'G04', suspect: 'F', evidence: 'E06', question: 'f-corridor',
    prompt: '영상에 당신이 전용 케이스를 들고 복도를 나오는 모습이 보여요.',
    reply: '잠깐 들어간 건 맞습니다. 하지만 케이스에는 제 취재 소품만 있었어요.',
    insight: '복도에 가지 않았다는 최초 진술이 뒤집혔다. 내용물과 원본 복제의 연결이 중요하다.' },
  { id: 'G05', suspect: 'F', evidence: 'E07', question: 'f-copy',
    prompt: '노트북에 있는 파일의 해시가 미술관 원본 녹음과 일치합니다.',
    reply: '…저만 인터뷰의 진실을 알리는 게 옳다고 생각했어요. 독점 기사를 준비하면서 원본을 가져갔습니다.',
    insight: '장비 연결과 원본 해시 일치라는 별도 출처가 맞물려 반출이 입증됐다.' },
]);

export const TACTICS = Object.freeze([
  { id: 'D_E', suspect: 'D', tone: 'empathy', label: '후원자 부담 이해하기',
    prompt: '관장님이 감당해야 하는 후원자와의 관계부터 듣고 싶어요.',
    reply: '재단을 지키려면 때로는 말하기 어려운 약속도 있습니다. 그 사실이 절도를 의미하지는 않죠.',
    signal: '후원자를 말할 때 목소리가 낮아진다. 부끄러움과 범행 여부는 구분해야 한다.' },
  { id: 'D_P', suspect: 'D', tone: 'pressure', label: '은폐된 면담 압박하기',
    prompt: '당신이 숨긴 면담이 사건 직전에 있었다는 사실을 인정하시죠?',
    reply: '그건 숨겼습니다. 다만 카드가 없어진 시점과 제 면담을 섞지는 말아 주세요.',
    signal: '관장은 체면을 지키려 하지만 22:10 보존 사진의 존재를 부정하지 않는다.' },
  { id: 'E_E', suspect: 'E', tone: 'empathy', label: '작업 실수 이해하기',
    prompt: '장치를 망가뜨리지 않으려 했던 사정을 차분히 들려주세요.',
    reply: '가벼운 고장이었지만 규정 위반이 겁났어요. 그래서 사진을 따로 남겼습니다.',
    signal: '수리 이유를 묻자 시간과 사진에 대한 설명이 구체적으로 변한다.' },
  { id: 'E_P', suspect: 'E', tone: 'pressure', label: '무단 수리 책임 묻기',
    prompt: '승인 없이 녹음기를 연 사실을 왜 처음엔 숨겼나요?',
    reply: '정비 기록을 남기지 않은 건 제 잘못이에요. 하지만 카드를 옮기지는 않았어요.',
    signal: '작업 규정 위반에는 경계하지만 보존 사진을 증거로 제시한다.' },
  { id: 'F_E', suspect: 'F', tone: 'empathy', label: '취재 동기 듣기',
    prompt: '당신이 이 녹음에 그렇게 집착한 이유를 듣고 싶어요.',
    reply: '진실이 묻힐까 걱정했어요. 하지만 어느 기록을 어떻게 얻었는지는 지금 말하기 어렵습니다.',
    signal: '공익을 강조하지만 파일의 출처를 반복해서 피한다.' },
  { id: 'F_P', suspect: 'F', tone: 'pressure', label: '장비 기록 대조하기',
    prompt: '당신의 장비 로그와 복도 영상이 서로 연결됩니다. 왜 방문을 부인하죠?',
    reply: '기록을 해석하는 사람도 편견을 가질 수 있어요. 원본 파일이 어디 있는지부터 증명하세요.',
    signal: '접근 경위를 질문받으면 기록의 신뢰성을 먼저 공격한다.' },
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

const defaultLog = [{ who: '사건 기록', text: CASE.openingLog }];

export function createGame() {
  return {
    version: GAME_VERSION, caseId: CASE.id, screen: 'home', selectedSuspect: 'D',
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
    selectedSuspect: getSuspect(input.selectedSuspect) ? input.selectedSuspect : 'D',
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
  const selected = [...new Set((Array.isArray(proofIds) ? proofIds : []).filter(id => getEvidence(id)))];
  if (!getSuspect(suspectId) || selected.length < 2) return {
    kind: 'partial', heading: '근거가 충분하지 않아',
    explanation: '서로 다른 출처에서 확보한 기록 둘 이상을 제시해줘. 수상한 표정이나 거짓말만으로 범인을 정할 수는 없어.',
  };
  if (suspectId !== CASE.culprit) return {
    kind: 'wrong', heading: '거짓말과 범행을 혼동했어',
    explanation: suspectId === 'D'
      ? '관장은 후원자 면담을 숨겼지만 22시 10분 복원 사진 이후의 카드 반출을 입증하지 못해. 녹음기 연결 장치와 복제 파일을 확인해.'
      : '복원사는 허가 없이 덮개를 수리했지만 수리 직후 카드가 남아 있었다는 증거를 남겼어. 실제 복제 원본이 발견된 장비를 확인해.',
  };
  if (!selected.includes('E05') || !selected.includes('E07')) return {
    kind: 'partial', heading: '범인은 맞았지만 연결이 부족해',
    explanation: '차민혁이 수상한 건 맞아. 취재 장치의 카드 리더 연결 이력과 원본 녹음의 해시가 일치하는 복제 파일을 함께 제시하면 객관적 입증이 가능해.',
  };
  return {
    kind: 'correct', heading: '사건 해결 · 마지막 녹음을 찾았어',
    explanation: '차민혁은 취재 장비 CM-27로 보존실 녹음 카드에 접근한 뒤 몰래 반출해 노트북에 원본을 복제했어. 파일 해시가 일치해 출처가 확인됐지. 관장과 복원사도 거짓말했지만 서로 다른 비밀 때문이었어.',
  };
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
  if (judgeAccusation(CASE.culprit, ['E05', 'E07']).kind !== 'correct') errors.push('solution cannot be reached');
  return errors;
}
