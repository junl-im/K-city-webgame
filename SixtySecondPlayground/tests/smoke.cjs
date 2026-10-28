/* 오프라인 정적 검사: 실제 브라우저에서의 터치 플레이를 대체하지 않습니다. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const dist = path.join(project, 'dist');
const js = fs.readFileSync(path.join(dist, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(dist, 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const asset = file => path.join(dist, 'assets', file);

new vm.Script(js, {filename: 'app.js'});
assert.match(html, /시제품 v2\.2/);
assert.match(html, /<title>곰같은여우와 함께하는 오늘의 60초 놀이터<\/title>/, '게임 정식 제목은 정확해야 합니다');
assert.match(html, /<h1 tabindex="-1">오늘의 <em>60초 놀이터<\/em><\/h1>/, '메인 제목은 오늘의 60초 놀이터여야 합니다');
assert.match(html, /<span>곰같은여우와 함께하는<\/span><span>오늘의 60초 놀이터<\/span>/, '상위 브랜드는 전체 제목을 유지해야 합니다');
assert.match(js, /<button type="button" class="game-card" data-game=/, '게임 카드 전체를 누르면 열려야 합니다');
assert.doesNotMatch(js, /<button class="play-button" data-game=/, '카드 안에 별도 버튼을 중첩하지 않아야 합니다');
assert.match(js, /\$\('#gameGrid'\)\.dataset\.filter=filter/, '필터 결과에 맞춰 카드 배치가 바뀌어야 합니다');
assert.match(css, /body\[data-view="games"\] \.game-grid\{grid-template-columns:repeat\(7/, '낮은 데스크톱에서는 일곱 게임을 한 줄로 표시');
assert.match(css, /@media\(min-width:1180px\) and \(min-height:830px\)/, '높은 데스크톱에서는 큰 카드 배치를 사용');
assert.match(css, /@media\(max-width:700px\) and \(max-height:700px\)/, '낮은 모바일 화면의 전용 밀도 조정');
assert.match(css, /body\[data-view="games"\] footer\{display:none\}/, '게임 선택 화면의 불필요한 푸터 스크롤 방지');
assert.match(css, /\.game-grid\[data-filter="all"\]\{grid-template-columns:repeat\(8/, 'PC의 일곱 카드는 8트랙 그리드로 4+3 중앙 배치');
assert.match(css, /\.game-grid\[data-filter="all"\]>\.game-card:nth-child\(5\)\{grid-column:2 \/ span 2\}/, '두 번째 줄 세 카드가 가운데 정렬되어야 합니다');
assert.match(css, /\.game-grid\[data-filter="all"\]>\.game-card:last-child\{\s*grid-column:1 \/ -1/, '모바일 마지막 카드는 가로 전체 폭을 차지해야 합니다');
assert.match(html, /id="backHome"/, '게임 선택 페이지에 메인 돌아가기 버튼 필요');
assert.match(html, /id="catalogIntro"/, '게임 선택 전용 페이지의 안내 배너 필요');
assert.match(js, /function navigateView\(view\)/, '페이지 단위 이동 함수 필요');
assert.match(js, /window\.history\.pushState/, '게임 목록은 독립 URL을 가져야 합니다');
assert.match(js, /window\.addEventListener\('popstate'/, '브라우저 뒤로 가기와 앞으로 가기 지원');
assert.match(js, /new URLSearchParams\(window\.location\.search\)/, '직접 URL 진입과 새로고침 후 페이지 유지 필요');
assert.ok(!js.includes('scrollIntoView'), '전체 게임 둘러보기 버튼이 아래로 스크롤하면 안 됩니다');
assert.match(css, /body\[data-view="home"\] #games\{display:none!important\}/, '게임 목록은 메인 아래에 노출되지 않아야 합니다');
assert.match(js, /wonderland-60sec-state-v1/, '기록 저장 키가 바뀌면 안 됩니다');
assert.match(js, /timeZone:'Asia\/Seoul'/, '공식 도전은 한국시간 기준입니다');

const gameSource = js.match(/const GAMES = \[([\s\S]*?)\n  \];/);
assert.ok(gameSource, '게임 정의가 필요합니다');
const games = [...gameSource[1].matchAll(/id:'([a-z]+)'/g)].map(match => match[1]);
assert.deepEqual(games, ['whack', 'number', 'spot', 'stroop', 'memory', 'sort', 'mystery']);

const guideText = js.split('const GAME_GUIDES = ')[1]?.split('\n  const IMPACT_MARKS')[0]?.trim().replace(/;$/, '');
assert.ok(guideText, '7개 미니게임 전용 놀이법 필요');
const guides = vm.runInNewContext(`(${guideText})`);
assert.deepEqual(Object.keys(guides).sort(), [...games].sort(), '모든 게임마다 전용 놀이법 1개씩 필요');
for(const game of games){
  const guide=guides[game];
  assert.equal(guide.steps.length,3, `${game}: 놀이법 정확히 3단계`);
  assert.ok(guide.steps.every(step=>step.length>=10),`${game}: 설명은 구체적이어야 합니다`);
  assert.ok(guide.hint.length>=15,`${game}: 진행 중 도움말 한 줄 필요`);
}
const impactText=js.split('const IMPACT_MARKS = ')[1]?.split('\n  const SORT_FAMILIES')[0]?.trim().replace(/;$/, '');
assert.ok(impactText,'게임별 타격 효과 모티프 정의 필요');
const impactMarks=vm.runInNewContext(`(${impactText})`);
assert.deepEqual(Object.keys(impactMarks).sort(),[...games].sort(),'7개 게임에 각자의 타격 모티프 필요');
assert.ok(games.every(id=>impactMarks[id].length>=1), '각 게임별 표시 기호 필요');
assert.match(guides.spot.steps.join(' '),/오른쪽/,'다른 그림 찾기는 오른쪽 판이 정답 터치 대상입니다');
assert.match(guides.stroop.steps.join(' '),/실제 색/,'색깔 함정은 글자 색 구별을 설명해야 합니다');
assert.match(guides.memory.steps.join(' '),/사라지고/,'기억왕은 별이 사라진 다음 누르는 구조입니다');

const mascots = ['lulu', 'momo', 'coco', 'dudu'];
const required = [
  ...games.map(id => `game-${id}.webp`),
  ...mascots.map(id => `${id}.webp`),
  ...mascots.flatMap(id => [`${id}-happy-v07.webp`, `${id}-oops-v07.webp`]),
  'park-v3.webp',
  'friends-celebration-v06.webp',
  'ui-pointer-v16.webp', 'ui-atlas-v16.webp', 'ui-button-v16.webp', 'ui-button-soft-v17.webp',
  'ui-button-compact-v18.webp', 'ui-button-daily-v18.webp', 'ui-button-action-v18.webp', 'ui-button-secondary-v18.webp',
  'game-whack-icons-atlas-v19.webp', 'game-spot-animals-atlas-v23.webp'
];
for (const name of required) {
  assert.ok(fs.existsSync(asset(name)), `필수 원화 없음: ${name}`);
  assert.ok(fs.statSync(asset(name)).size > 0, `빈 이미지: ${name}`);
}
for(const name of ['ui-pointer-v16.webp','ui-atlas-v16.webp','ui-button-v16.webp','ui-button-soft-v17.webp','ui-button-compact-v18.webp','ui-button-daily-v18.webp','ui-button-action-v18.webp','ui-button-secondary-v18.webp']){
  assert.ok(fs.statSync(asset(name)).size < 150 * 1024,`${name}: UI 일러스트는 150KB 미만으로 유지`);
}

const explicit = [
  ...html.matchAll(/\.\/assets\/([\w.-]+\.(?:webp|png))/g),
  ...css.matchAll(/\.\/assets\/([\w.-]+\.(?:webp|png))/g)
];
for (const match of explicit) assert.ok(fs.existsSync(asset(match[1])), `참조 누락: ${match[1]}`);

function checkNoSvg(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) checkNoSvg(name);
    else assert.ok(!entry.name.toLowerCase().endsWith('.svg'), `SVG 금지: ${name}`);
  }
}
checkNoSvg(dist);
checkNoSvg(path.join(project, 'source-assets'));
assert.ok(!/data:image\/svg\+xml|<svg\b/i.test(html + css + js), 'SVG 삽입 금지');
assert.match(css, /ui-atlas-v16\.webp/, '일러스트 UI 아이콘 아틀라스 필요');
assert.match(css, /game-whack-icons-atlas-v19\.webp/, '몬스터 콩콩 전용 게임 원화 아틀라스 필요');
assert.match(css, /game-spot-animals-atlas-v23\.webp/, '다른 그림 찾기 전용 동물 원화 아틀라스 필요');
assert.match(css, /clip-path:circle\(42% at 50% 50%\)/, '다른 동물의 그림 조각이 칸에 섞이지 않게 자르기');
assert.match(js, /paintSpotCell\(sample,icon\)/, '왼쪽 기준 그림도 전용 원화로 렌더링해야 합니다');
assert.match(js, /paintSpotCell\(b,icon\)/, '오른쪽 정답 버튼도 전용 원화로 렌더링해야 합니다');
assert.match(js, /function paintWhackCell\(button,symbol\)/, '몬스터 게임 타일에는 이모지 대신 원화 연결 필요');
assert.match(js, /paintWhackCell\(cell,symbol\)/, '몬스터 게임은 매 판 원화로 렌더링해야 합니다');
assert.match(css, /\.filter-pills button\[data-filter="observation"\]::before/, '탐색 필터마다 별도 그림 장식 필요');
assert.match(css, /ui-button-soft-v17\.webp/, '파스텔 일러스트 시작 버튼 필요');
for(const [id,selector] of [['daily','\\.mini-cta\\.illustrated-cta'],['compact','\\.game-foot \\.play-button'],['action','#modalBody>\\.action-button\\.illustrated-primary'],['secondary','#pauseExit']]){
  assert.match(css,new RegExp(`ui-button-${id}-v18\\.webp`),`${id}: 개별 버튼 원화 필요`);
  assert.match(css,new RegExp(selector),`${id}: 전용 버튼 스타일 필요`);
}
assert.match(css, /#modalBody>\.action-button\.illustrated-primary\{[^\n]*width:min\(284px,100%\)/, '게임 시작 버튼의 불필요한 가로 100% 확장을 방지해야 합니다');
assert.match(css, /#pauseResume\{[^\n]*width:min\(231px,100%\)/, '이어하기 버튼은 문구에 맞는 폭이어야 합니다');
assert.match(css, /\.main-button\.illustrated-cta\{width:max-content/, '메인 버튼이 내용 너비에 맞춰야 합니다');
assert.ok(!css.includes('url(\'./assets/ui-button-v16.webp\')'), '이전 강한 보석색 버튼은 사용하지 않습니다');
assert.match(css, /clickHandBop 2\.8s/, '손가락 움직임은 천천히 자연스럽게');
assert.match(css, /\.filter-pills button\.active\{background:#e4d6f5/, '활성 필터는 진한 보라색 대신 부드러운 색상');
assert.match(css, /ui-pointer-v16\.webp/, '손가락 클릭 일러스트 필요');
assert.match(css, /@keyframes clickHandBop/, '손가락 클릭 애니메이션 필요');
assert.match(css, /prefers-reduced-motion:reduce[^\n]*\.click-hand/, '움직임 줄이기 설정에서 손가락 애니메이션을 중지해야 합니다');
assert.match(css, /::-webkit-scrollbar-thumb/, 'WebKit 게임 스크롤바 스타일 필요');
assert.match(css, /scrollbar-color:/, 'Firefox 게임 스크롤바 스타일 필요');
assert.match(js, /addEventListener\('contextmenu',function\(event\)\{event\.preventDefault\(\)/, '우클릭 메뉴 방지 필요');
assert.match(js, /addEventListener\('dragstart',function\(event\)\{event\.preventDefault\(\)/, '이미지 드래그 방지 필요');
assert.match(js, /addEventListener\('selectstart',function\(event\)\{event\.preventDefault\(\)/, '텍스트 선택 드래그 방지 필요');
assert.match(css, /touch-action:manipulation/, '터치 버튼 조작은 허용해야 합니다');
for(const id of ['heroDaily','dailyCardStart','startPreview'])assert.ok(html.includes(`id="${id}"`)||js.includes(`id="${id}"`),`${id}: 시작 버튼 유지`);

assert.match(js, /playNote\(/, '새 게임 효과음이 필요합니다');
assert.match(css, /\.spot-pair\{grid-template-columns:minmax\(0,2fr\) minmax\(0,3fr\)/);
assert.match(js, /s\.round>=11\?3:s\.round>=6\?2:1/, '3단계 난도 전환 필요');
assert.match(js, /round-count[^\n]*roundCount/, '현재 판 수 배지 필요');
assert.match(js, /#roundCount'\)\.textContent='제 '\+s\.round/, '현재 판 수가 매 판 갱신돼야 합니다');
assert.match(css, /\.round-count\{/, '작은 화면용 판 수 배지 스타일 필요');
assert.match(js, /const sample=document\.createElement\('span'\)/, '왼쪽 기준 그림은 터치 버튼이 아니어야 합니다');
assert.match(js, /b\.classList\.add\('done'\)/, '숫자 게임 완료 칸은 CSS와 동일한 상태를 써야 합니다');
assert.match(js, /stageChip\.classList\.add\('stage-up'\)/, '새 단계 안내 애니메이션 필요');
assert.match(css, /\.arena\[data-game\] button\.answer-reveal/, '오답 시 정답 위치 표시 스타일 필요');
assert.match(css, /\.arena\[data-game\] > \.combo-burst/, '콤보 알림이 게임판 배치를 밀지 않아야 합니다');
assert.match(js, /combo\.parentElement\.classList\.toggle\('combo-hot'/, '콤보 HUD 강조 필요');
assert.match(css, /prefers-reduced-motion:reduce[^\n]*\.host-emote/, '새 연출도 움직임 줄이기 설정을 지켜야 합니다');
assert.match(html, /id="modalPause"/, '게임 중 일시정지 버튼 필요');
assert.match(html, /id="modalHelp"[^>]*aria-label="게임 놀이법 보기"/, '게임 중 도움말 버튼과 접근성 이름 필요');
assert.match(html, /id="pauseMascot"/, '도움말에는 해당 안내원의 기존 원화 표시');
assert.match(js, /showPause\('help'\)/, '도움말이 일시정지 화면을 사용해야 합니다');
assert.match(js, /const guide=GAME_GUIDES\[game\.id\]/, '소개 화면이 게임별 놀이법을 표시해야 합니다');
assert.match(css, /\.howto-guide li::before/, '3단계 놀이법에 번호가 보여야 합니다');
assert.match(css, /\.arena\[data-game\] > \.tap-impact/, '선택한 위치에 타격감 출력 필요');
assert.match(css, /\.arena\[data-game\] > \.tap-particle/, '정답 파티클 스타일 필요');
assert.match(css, /prefers-reduced-motion:reduce[^\n]*\.tap-particle/, '움직임 줄이기 설정에서 입자를 숨겨야 합니다');
for(const id of games)assert.ok(css.includes(`.arena[data-game="${id}"]`)&&css.includes(`--impact-color`),`${id}: 게임별 색상 적용`);
for(const keyframe of ['whackSquash','numberStamp','pictureFlash','colorPop','memoryBloom','attributeGlow','mysteryReveal']){
  assert.match(css,new RegExp('@keyframes '+keyframe+'\\{'),`게임별 선택 반응 ${keyframe} 필요`);
}
const origins = [...js.matchAll(/\bfeedback\([^\n]*,100,(cell|b)\)/g)];
assert.equal(origins.length,8,'8가지 정답·오답 호출 경로에서 누른 버튼 위치를 제공해야 합니다');
const impactSource=js.match(/function tapImpact\(origin,correct,gameId\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(impactSource, '선택 위치 이펙트 함수가 필요합니다');
const impacts=[];
const hitArena={getBoundingClientRect:()=>({left:100,top:100,width:240,height:240}),append:element=>impacts.push(element)};
const fakeImpactElement=()=>({style:{setProperty:()=>{}},setAttribute:()=>{},remove:()=>{},textContent:'',className:''});
const makeImpact=(reduce,mobile)=>vm.runInNewContext(`(${impactSource})`,{
  $:()=>hitArena,
  document:{createElement:fakeImpactElement},
  window:{matchMedia:query=>({matches:query.includes('reduced-motion')?reduce:mobile})},
  setTimeout:()=>{},IMPACT_MARKS:impactMarks,Math
});
const offscreen={getBoundingClientRect:()=>({left:-200,top:-200,width:45,height:45})};
makeImpact(false,false)(offscreen,true,'whack');
assert.equal(impacts.length,5,'PC에서 타격 중심 1개와 입자 4개만 생성');
assert.equal(impacts[0].style.left,'20px','화면 가장자리의 타격 위치를 게임판 안쪽으로 제한');
assert.equal(impacts[0].style.top,'20px','위쪽 가장자리 타격 위치도 제한');
assert.equal(impacts[0].textContent,impactMarks.whack,'게임 전용 모티프 표시');
impacts.length=0;
makeImpact(false,true)(offscreen,true,'number');
assert.equal(impacts.length,3,'모바일에서는 입자 2개만 생성');
impacts.length=0;
makeImpact(true,false)(offscreen,true,'memory');
assert.equal(impacts.length,1,'움직임 줄이기 환경에서는 입자 생성 금지');
impacts.length=0;
makeImpact(false,false)(offscreen,false,'spot');
assert.equal(impacts.length,1,'오답 시 과한 입자 생성 금지');
assert.match(html, /id="pauseScreen"[^>]*role="dialog"/, '일시정지 확인창 필요');
assert.match(html, /id="pauseResume"/, '계속하기 버튼 필요');
assert.match(html, /id="pauseExit"/, '나가기 버튼 필요');
assert.match(js, /if\(session\)showPause\('exit'\)/, '닫기 요청은 즉시 종료하지 않고 확인해야 합니다');
assert.match(js, /visibilitychange/, '탭 이동 시 자동으로 일시정지해야 합니다');
assert.match(js, /scheduleRoundTask\(s,function\(\)\{/, '문제 전환 대기시간도 일시정지 지원해야 합니다');
assert.match(css, /\.modal\.is-playing \.hud\{position:sticky/, '모바일 점수판이 스크롤 중 보여야 합니다');

// 가짜 단조 시계로 시간·문제 전환이 정말 멈추는지 확인합니다.
const timerFns = js.slice(js.indexOf('  function scheduleRoundTask('), js.indexOf('  function showPause('));
assert.ok(timerFns.includes('function resumeSession('), '일시정지 시간 처리 함수 필요');
let clock = 1000, timerIndex = 0, tickCalls = 0;
const jobs = new Map();
const fakeClasses = new Set();
const timerContext = vm.createContext({
  performance:{now:()=>clock},
  setTimeout:(fn,ms)=>{const id=++timerIndex;jobs.set(id,{at:clock+ms,fn});return id;},
  clearTimeout:id=>jobs.delete(id),
  cancelAnimationFrame:()=>{},
  animFrame:0,
  $:()=>({classList:{add:cls=>fakeClasses.add(cls),remove:cls=>fakeClasses.delete(cls)}}),
  tick:()=>{tickCalls++;},
  session:null
});
vm.runInContext(timerFns,timerContext);
const active={deadline:clock+60000,pausedAt:null,roundTimeout:null,roundTask:null,roundRemaining:0,roundDueAt:null};
timerContext.session=active;
let roundFired=0;
timerContext.scheduleRoundTask(active,()=>{roundFired++;},950);
clock+=300;
timerContext.pauseSession(active);
assert.equal(jobs.size,0,'일시정지 시 예약된 라운드 전환이 취소돼야 합니다');
assert.equal(active.roundRemaining,650,'남은 문제 전환 대기시간을 정확히 보존');
assert.ok(fakeClasses.has('is-paused'),'게임판 일시정지 스타일 적용');
clock+=30000;
assert.equal(active.deadline,61000,'멈춰있는 동안 전체 제한시간이 줄지 않아야 합니다');
timerContext.resumeSession(active);
assert.equal(active.deadline,91000,'일시정지한 30초를 정확히 보충');
assert.equal(tickCalls,1,'재개 시 타이머 그림 갱신');
assert.equal(jobs.size,1,'남은 650ms 문제 타이머 재설정');
clock+=649;
assert.equal(roundFired,0,'정해진 시간 전에 다음 라운드가 시작하면 안 됩니다');
clock+=1;
for(const [id,job] of jobs)if(job.at<=clock){jobs.delete(id);job.fn();}
assert.equal(roundFired,1,'재개 후 정확히 남은 시간만큼 기다려야 합니다');
assert.equal(active.roundTask,null,'처리된 타이머는 다시 실행되지 않아야 합니다');

const hostText = js.split('const HOST_LINES = ')[1].split('\n  const mascotSource')[0].trim().replace(/;$/, '');
const hostLines = vm.runInNewContext(`(${hostText})`);
assert.deepEqual(Object.keys(hostLines).sort(),['두두','루루','모모','코코'].sort(),'네 안내원 모두 고유 반응이 필요합니다');
for(const [name,voice] of Object.entries(hostLines)){
  assert.ok(voice.intro.length>=5,`${name} 시작 대사 필요`);
  assert.ok(voice.success.length>=3&&voice.wrong.length>=2,`${name} 정답·오답 대사 다양성 필요`);
  assert.equal(new Set([...voice.success,...voice.wrong]).size,voice.success.length+voice.wrong.length,`${name} 반응 대사가 중복되면 안 됩니다`);
  assert.ok(voice.combo.length>=5,`${name} 콤보 대사 필요`);
  assert.ok(voice.marks.length>=3&&/^#[0-9a-f]{6}$/i.test(voice.color),`${name} 개성 있는 효과 필요`);
}

const revealSource = js.match(/function revealAnswer\(selected,answer\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(revealSource, '정답·오답 선택 표시 함수 필요');
const revealAnswer = vm.runInNewContext(`(${revealSource})`);
const fakeButton = () => {
  const classes=new Set();
  return {classes,classList:{add:value=>classes.add(value)}};
};
const right=fakeButton();
revealAnswer(right,right);
assert.ok(right.classes.has('answer-correct'),'정답 선택 시 녹색 강조');
assert.ok(!right.classes.has('answer-reveal'),'정답은 두 번 강조하지 않습니다');
const wrong=fakeButton(),answer=fakeButton();
revealAnswer(wrong,answer);
assert.ok(wrong.classes.has('answer-wrong'),'오답 선택 시 분홍색 강조');
assert.ok(answer.classes.has('answer-reveal'),'오답 시 진짜 정답도 표시');

const quizText = js.split('const MYSTERY_QUIZ = ')[1].split('\n  // 5×4 PNG/WebP')[0].trim().replace(/;$/, '');
const quizzes = vm.runInNewContext(`(${quizText})`);
const questions = [];
for (const level of [1, 2, 3]) {
  assert.equal(quizzes[level].length, 10, `${level}단계 미스터리는 정확히 10문제`);
  for (const entry of quizzes[level]) {
    assert.equal(entry.a.length, 3, '정답 1개와 오답 2개');
    assert.equal(new Set(entry.a).size, 3, '선택지 중복 금지');
    assert.ok(entry.q.length >= 5 && entry.a.every(value => value.length), '문항 텍스트 필요');
    questions.push(entry.q);
  }
}
assert.equal(new Set(questions).size, 30, '30문항이 모두 달라야 합니다');

const familyText = js.split('const SORT_FAMILIES = ')[1].split('\n  const SPOT_ICON_SETS')[0].trim().replace(/;$/, '');
const families = vm.runInNewContext(`(${familyText})`);
assert.equal(families.length, 5, '분류 대상은 5개 속성');
assert.ok(families.every(group => group.items.length >= 4), '각 속성별 4개 이상 원소');
assert.ok(families[0].items.includes('🕯️')&&!families[0].items.includes('🌞'),'불꽃과 하늘로 혼동될 수 있는 그림 제외');
assert.match(js, /families\.filter\(function\(f\)\{return f\.name!==s\.lastSortFamily;/, '같은 연구소 속성 연속 등장 방지');
assert.match(js, /drawWithoutRepeats\(s,'sort-'\+picked\.name,picked\.items\)/, '연구소 속성별 그림 중복 방지');

const spotText = js.split('const SPOT_ICON_SETS = ')[1].split('\n  const MYSTERY_QUIZ')[0].trim().replace(/;$/, '');
const spotSets = vm.runInNewContext(`(${spotText})`);
const spotArtText = js.split('const SPOT_ART = ')[1].split('\n  const gameById')[0].trim().replace(/;$/, '');
const spotArt = vm.runInNewContext(`(${spotArtText})`);
assert.equal(Object.keys(spotArt).length, 20, '20종 동물 원화가 모두 연결되어야 합니다');
assert.equal(new Set(Object.values(spotArt).map(item => item[0])).size, 20, '각 동물의 원화 칸은 중복되면 안 됩니다');
assert.ok(Object.values(spotArt).every(item => item[0]>=0 && item[0]<20 && item[1]), '원화 인덱스와 접근성 이름 필요');
assert.equal(spotSets.length, 3, '다른 그림 3단계 아이콘 목록');
for (const icons of spotSets) {
  assert.ok(icons.length >= 16, '아이콘 후보가 충분해야 합니다');
  assert.equal(new Set(icons).size, icons.length, '같은 단계에 중복 아이콘이 없어야 합니다');
  assert.ok(icons.every(icon => spotArt[icon]), '모든 퍼즐 대상에 해당하는 원화가 있어야 합니다');
}
const indexSource = js.match(/function pickDifferentIndex\(size,previous\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(indexSource, '같은 정답 위치 연속 등장 방지 함수 필요');
const pickIndex = vm.runInNewContext(`(${indexSource})`,{rand:n=>Math.floor(Math.random()*n),Number});
for(let previous=0;previous<9;previous++)for(let attempt=0;attempt<200;attempt++){
  const selected=pickIndex(9,previous);
  assert.ok(selected>=0&&selected<9,'정답 위치는 9칸 안에 있어야 합니다');
  assert.notEqual(selected,previous,'정답 위치가 바로 다음 판에 같은 칸이면 안 됩니다');
}
assert.equal(pickIndex(1,0),0,'선택 가능한 칸이 한 개뿐이면 정상 반환');
assert.match(js, /pickDifferentIndex\(9,s\.lastWhackTarget\)/, '몬스터 콩콩 중복 위치 방지');
assert.match(js, /pickDifferentIndex\(9,s\.memoryTarget\)/, '1초 기억왕 중복 위치 방지');
const spotSource = js.match(/function makeSpotPuzzle\(stage,previousIndex\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(spotSource, '다른 그림 생성 함수 필요');
const spotPuzzle = vm.runInNewContext(`(${spotSource})`, {
  SPOT_ICON_SETS:spotSets,
  pickDifferentIndex:pickIndex,
  rand:n=>Math.floor(Math.random()*n),
  shuffle:items=>{
    const copy=items.slice();
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
});
for(const stage of [1,2,3]){
  let previousChanged=-1;
  for(let attempt=0;attempt<200;attempt++){
    const puzzle=spotPuzzle(stage,previousChanged);
    if(previousChanged!==-1)assert.notEqual(puzzle.changed,previousChanged,'다른 그림 정답 칸 연속 중복 금지');
    previousChanged=puzzle.changed;
    assert.equal(puzzle.base.length, 9, '기준 그림은 9칸');
    assert.equal(puzzle.right.length, 9, '비교 그림은 9칸');
    assert.equal(new Set(puzzle.base).size, 9, '기준 그림의 각 칸은 서로 달라야 합니다');
    const differences=puzzle.base.flatMap((icon,index)=>icon===puzzle.right[index]?[]:[index]);
    assert.equal(differences.length, 1, '그림은 정확히 한 칸만 달라야 합니다');
    assert.equal(differences[0],puzzle.changed, '정답 칸은 실제 차이와 일치해야 합니다');
    assert.ok(!puzzle.base.includes(puzzle.right[puzzle.changed]), '다른 친구는 기준 그림에 없어야 합니다');
  }
}

const drawSource = js.match(/function drawWithoutRepeats\(s,key,items\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(drawSource, '중복 없는 문제 뽑기 함수 필요');
const draw = vm.runInNewContext(`(${drawSource})`, {shuffle: items => items.slice()});
const bagState = {};
const expected = Array.from({length:10}, (_,i) => i);
const picks = expected.map(() => draw(bagState, 'test', expected));
assert.equal(new Set(picks).size, 10, '문제 보유량만큼 중복 없이 뽑아야 합니다');
assert.notEqual(draw(bagState, 'test', expected), picks.at(-1), '덱 재시작 시 바로 같은 문제 금지');

const stroopSource=js.match(/function nextStroopPair\(s,stage,colorCount\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(stroopSource,'색깔 함정 조합을 고르게 사용해야 합니다');
const nextStroop=vm.runInNewContext(`(${stroopSource})`,{drawWithoutRepeats:draw,Number});
for(const [stage,colorCount,poolSize] of [[1,4,16],[2,5,20],[3,6,30]]){
  const deck={};const seen=new Set();
  for(let i=0;i<poolSize;i++){
    const pair=nextStroop(deck,stage,colorCount);
    assert.ok(pair.ink>=0&&pair.ink<colorCount&&pair.word>=0&&pair.word<colorCount,'색깔 선택지는 존재해야 합니다');
    if(stage>1)assert.notEqual(pair.ink,pair.word,'2단계 이후 글자 뜻과 실제 색은 달라야 합니다');
    const code=pair.ink+':'+pair.word;
    assert.ok(!seen.has(code),'조합을 모두 쓰기 전에 같은 문제를 반복하면 안 됩니다');
    seen.add(code);
  }
  assert.equal(seen.size,poolSize,'단계별 모든 조합을 1회씩 사용해야 합니다');
}

console.log(`OK: ${games.length}개 게임, ${Object.keys(hostLines).length}명 안내원, ${questions.length}개 미스터리, 다른 그림 600판, 색 조합 66개, 9칸 중복 방지 1,800회, ${required.length}개 필수 WebP, SVG 0개`);
