import { CARD_POOL, ELEMENTS, FACTIONS, getCard, GRADES } from "../data/cards.js";
import { CHAPTERS, DAILY_MISSIONS } from "../data/chapters.js";
import { BANNER } from "../data/gacha.js";
import { computePower } from "../game/battle.js";

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function compactNumber(value) {
  return new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

export function gradeBadge(grade) {
  return `<span class="badge ${GRADES[grade]?.color || ""}">${esc(grade)}</span>`;
}

export function cardHTML(owned, state, options = {}) {
  const card = getCard(owned.cardId);
  const inTeam = state.team.includes(owned.instanceId);
  const power = Math.round((card.stats.hp * 0.4 + card.stats.atk * 9 + card.stats.def * 5 + card.stats.spd * 7) * GRADES[card.grade].power * (1 + (owned.level - 1) * 0.08));
  return `
    <article class="unit-card ${GRADES[card.grade].color} ${inTeam ? "selected" : ""}">
      <div class="unit-card__top">
        ${gradeBadge(card.grade)}
        <span class="chip">Lv.${owned.level}</span>
      </div>
      <div class="unit-card__glyph">${esc(card.glyph)}</div>
      <h3>${esc(card.name)}</h3>
      <p>${esc(card.title)}</p>
      <div class="meta-row"><span>${esc(FACTIONS[card.faction])}</span><span>${esc(ELEMENTS[card.element])}</span><span>${esc(card.role)}</span></div>
      <div class="stat-grid tiny">
        <span>HP <b>${Math.round(card.stats.hp * (1 + owned.level * 0.08))}</b></span>
        <span>ATK <b>${Math.round(card.stats.atk * (1 + owned.level * 0.08))}</b></span>
        <span>PWR <b>${power}</b></span>
      </div>
      <div class="skill-box"><b>${esc(card.skill.name)}</b><br>${esc(card.skill.text)}</div>
      ${options.actions === false ? "" : `
        <div class="card-actions">
          <button class="ghost" data-action="toggle-team" data-id="${esc(owned.instanceId)}">${inTeam ? "편성 해제" : "팀 편성"}</button>
          <button class="ghost" data-action="train-card" data-id="${esc(owned.instanceId)}">훈련</button>
        </div>
      `}
    </article>
  `;
}

export function renderBottomNav(currentTab) {
  const tabs = [
    ["city", "⌂", "마을"],
    ["battle", "◇", "사건"],
    ["roster", "♟", "요원"],
    ["gacha", "✦", "모집"],
    ["missions", "✓", "임무"],
    ["arena", "⚔", "대결"]
  ];
  return `
    <nav class="bottom-nav">
      ${tabs.map(([id, icon, label]) => `
        <button class="${currentTab === id ? "active" : ""}" data-action="tab" data-tab="${id}">
          <b>${icon}</b><span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

export function renderHeader(state, user, firebaseReady) {
  const progress = Math.min(100, Math.round((state.profile.exp / state.profile.nextExp) * 100));
  return `
    <header class="topbar">
      <div>
        <span class="eyebrow">2.5D 도시 방범 RPG</span>
        <h1>K-시티 이너월드</h1>
      </div>
      <button class="login-pill ${user ? "online" : ""}" data-action="open-login">
        ${user ? "온라인" : state.profile.level >= 2 ? "로그인 필요" : "게스트"}
      </button>
      <div class="resource-strip">
        <span>Lv.${state.profile.level}</span>
        <span>⚡ ${state.profile.stamina}/${state.profile.maxStamina}</span>
        <span>◎ ${compactNumber(state.profile.gold)}</span>
        <span>◆ ${compactNumber(state.profile.gems)}</span>
        <span>전투력 ${compactNumber(computePower(state))}</span>
      </div>
      <div class="xp"><i style="width:${progress}%"></i></div>
      ${firebaseReady ? "" : `<p class="warn-line">Firebase 환경값이 없어 로컬 데모 모드로 실행 중입니다.</p>`}
    </header>
  `;
}

export function renderIntro(state) {
  return `
    <section class="splash screen-panel">
      <div class="logo-orb">KC</div>
      <span class="eyebrow">창작 IP / 모바일 카드 전술 RPG</span>
      <h2>무너진 도시의 주민센터를 재건하고,<br>이면세계의 균열을 막아라.</h2>
      <p>
        첫 시작은 로그인 없이 바로 플레이합니다. Lv.2가 되면 계정 로그인과 클라우드 저장,
        유저 대결, 랭킹이 열립니다.
      </p>
      <div class="splash-actions">
        <button class="primary big" data-action="enter-game">게임 시작</button>
        <button class="ghost big" data-action="open-login">계정 연동</button>
      </div>
      <div class="feature-grid">
        <span>전술 공명</span><span>확률+천장 모집</span><span>비동기 PvP</span><span>시설 성장</span>
      </div>
    </section>
  `;
}

export function renderCity(state) {
  const buildings = [
    ["center", "주민센터", "계정/보상/도시 레벨의 중심"],
    ["station", "경찰서", "사건 난이도와 보상 해금"],
    ["generator", "발전소", "스태미나 최대치 증가"],
    ["agency", "알바천국", "인재 모집 할인 이벤트"],
    ["archive", "보관함", "장비와 기억 파편 보관"],
    ["academy", "훈련소", "전체 요원 성장 효율"],
    ["lab", "연구소", "이면계 공명 연구" ]
  ];
  return `
    <section class="screen-panel city-view">
      <div class="section-title">
        <div><span class="eyebrow">Night shift command</span><h2>주민센터 비상대책반</h2></div>
        <button class="ghost" data-action="tab" data-tab="battle">출동</button>
      </div>
      <div class="city-map">
        ${buildings.map(([id, name, desc]) => `
          <article class="building-card">
            <b>${esc(name)} Lv.${state.buildings[id]}</b>
            <p>${esc(desc)}</p>
            <button class="ghost" data-action="upgrade-building" data-id="${id}">업그레이드</button>
          </article>
        `).join("")}
      </div>
      <div class="story-card">
        <b>현재 사건</b>
        <p>골목길의 가로등이 동시에 꺼지고, 민원 기록에는 존재하지 않는 신고자가 반복됩니다.</p>
      </div>
    </section>
  `;
}

export function renderBattle(state, loginGate) {
  return `
    <section class="screen-panel">
      <div class="section-title">
        <div><span class="eyebrow">Case operation</span><h2>출동 작전</h2></div>
        <span class="chip">팀 전투력 ${compactNumber(computePower(state))}</span>
      </div>
      ${loginGate ? `<div class="gate-card"><b>Lv.2 계정 연동 필요</b><p>이제부터 전투 기록, 뽑기, 랭킹, PvP는 로그인 후 저장됩니다.</p><button class="primary" data-action="open-login">로그인하고 계속</button></div>` : ""}
      ${CHAPTERS.map((chapter) => `
        <div class="chapter-card">
          <h3>${esc(chapter.name)}</h3>
          <p>${esc(chapter.theme)}</p>
          <div class="stage-list">
            ${chapter.stages.map((stage) => {
              const cleared = state.profile.clearedStages.includes(stage.id);
              const locked = state.profile.level < stage.level;
              return `
                <article class="stage-row ${cleared ? "cleared" : ""}">
                  <div><b>${esc(stage.name)}</b><span>권장 Lv.${stage.level} / ⚡ ${stage.stamina}</span></div>
                  <button class="${locked ? "locked" : "primary"}" data-action="start-stage" data-id="${stage.id}" ${locked ? "disabled" : ""}>${cleared ? "재출동" : "출동"}</button>
                </article>
              `;
            }).join("")}
          </div>
        </div>
      `).join("")}
      ${state.battleLog.length ? `
        <div class="log-card"><b>최근 전투 로그</b>${state.battleLog.map((line) => `<p>${esc(line.text || line)}</p>`).join("")}</div>
      ` : ""}
    </section>
  `;
}

export function renderRoster(state) {
  const sorted = [...state.ownedCards].sort((a, b) => {
    const ca = getCard(a.cardId);
    const cb = getCard(b.cardId);
    return GRADES[cb.grade].power - GRADES[ca.grade].power || b.level - a.level;
  });
  return `
    <section class="screen-panel">
      <div class="section-title">
        <div><span class="eyebrow">Agent deck</span><h2>요원 관리</h2></div>
        <span class="chip">${state.team.length}/5 편성</span>
      </div>
      <div class="team-strip">
        ${state.team.map((id) => {
          const owned = state.ownedCards.find((item) => item.instanceId === id);
          return owned ? cardHTML(owned, state, { actions: false }) : "";
        }).join("")}
      </div>
      <div class="card-grid">
        ${sorted.map((owned) => cardHTML(owned, state)).join("")}
      </div>
    </section>
  `;
}

export function renderGacha(state, loginGate) {
  return `
    <section class="screen-panel">
      <div class="banner-card">
        <span class="eyebrow">Recruit banner</span>
        <h2>${esc(BANNER.title)}</h2>
        <p>${esc(BANNER.subtitle)}</p>
        <div class="rate-row">
          <span>SSR ${(BANNER.rates.SSR * 100).toFixed(1)}%</span>
          <span>SR ${(BANNER.rates.SR * 100).toFixed(1)}%</span>
          <span>R ${(BANNER.rates.R * 100).toFixed(1)}%</span>
          <span>천장 ${state.profile.pity}/${BANNER.pityAt}</span>
        </div>
        ${loginGate ? `<div class="gate-card compact">Lv.2부터 모집은 로그인 후 가능합니다.</div>` : ""}
        <div class="splash-actions">
          <button class="primary" data-action="draw" data-count="1">1회 모집 ◆${BANNER.singleCost}</button>
          <button class="primary" data-action="draw" data-count="10">10회 모집 ◆${BANNER.tenCost}</button>
        </div>
      </div>
      <div class="codex">
        ${CARD_POOL.map((card) => `
          <article class="codex-row ${GRADES[card.grade].color}">
            ${gradeBadge(card.grade)}<b>${esc(card.name)}</b><span>${esc(card.title)}</span><small>${esc(FACTIONS[card.faction])} · ${esc(ELEMENTS[card.element])}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderMissions(state) {
  return `
    <section class="screen-panel">
      <div class="section-title"><div><span class="eyebrow">Daily network</span><h2>임무</h2></div></div>
      <div class="mission-list">
        ${DAILY_MISSIONS.map((mission) => {
          const progress = state.missions[mission.id] || 0;
          const done = progress >= mission.target;
          const claimed = state.missions.claimed.includes(mission.id);
          return `
            <article class="mission-row ${done ? "done" : ""}">
              <div><b>${esc(mission.label)}</b><span>${progress}/${mission.target} · 보상 ◎${mission.reward.gold || 0} ◆${mission.reward.gems || 0}</span></div>
              <button class="ghost" data-action="claim-mission" data-id="${mission.id}" ${!done || claimed ? "disabled" : ""}>${claimed ? "완료" : "수령"}</button>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function renderArena(state, user, leaderboard, loginGate) {
  return `
    <section class="screen-panel">
      <div class="section-title">
        <div><span class="eyebrow">Asynchronous PvP</span><h2>시민 네트워크 대결</h2></div>
        <span class="chip">점수 ${state.profile.arenaScore}</span>
      </div>
      ${!user ? `<div class="gate-card"><b>PvP는 로그인 필요</b><p>상대 매칭, 전투 기록, 랭킹은 Firebase Auth와 Firestore에 저장됩니다.</p><button class="primary" data-action="open-login">로그인</button></div>` : `
        <div class="arena-card">
          <p>내 팀 스냅샷으로 대기 중인 유저와 자동 매칭합니다. 실시간 액션 PvP가 아니라 모바일 웹에 맞춘 비동기 결투입니다.</p>
          <button class="primary" data-action="pvp-match">대결 찾기</button>
          ${state.pvp.roomId ? `<button class="ghost" data-action="pvp-cancel">대기 취소</button>` : ""}
        </div>
      `}
      ${state.pvp.lastResult ? `
        <div class="log-card"><b>최근 대결 결과</b><p>승자 UID: ${esc(state.pvp.lastResult.winnerUid)}</p>${(state.pvp.lastResult.log || []).slice(-8).map((line) => `<p>${esc(line.text)}</p>`).join("")}</div>
      ` : ""}
      <div class="section-title small"><h3>랭킹</h3><button class="ghost" data-action="refresh-ranking">새로고침</button></div>
      <div class="rank-list">
        ${leaderboard.length ? leaderboard.map((row, index) => `
          <article class="rank-row"><b>#${index + 1} ${esc(row.displayName || "센터장")}</b><span>점수 ${row.score || 0} · Lv.${row.level || 1}</span></article>
        `).join("") : `<p class="muted">아직 랭킹 데이터가 없습니다.</p>`}
      </div>
    </section>
  `;
}

export function renderLoginModal(user, message = "") {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal-card" data-stop>
        <button class="modal-x" data-action="close-modal">×</button>
        <span class="eyebrow">Firebase Auth</span>
        <h2>센터장 계정</h2>
        ${message ? `<p class="notice">${esc(message)}</p>` : ""}
        ${user ? `
          <p><b>${esc(user.displayName || user.email || "로그인됨")}</b> 계정으로 연결되어 있습니다.</p>
          <button class="ghost full" data-action="logout">로그아웃</button>
        ` : `
          <label>이메일<input id="login-email" type="email" autocomplete="email" placeholder="you@example.com"></label>
          <label>비밀번호<input id="login-password" type="password" autocomplete="current-password" placeholder="6자 이상"></label>
          <div class="split">
            <button class="primary" data-action="login-email">이메일 로그인</button>
            <button class="ghost" data-action="signup-email">가입</button>
          </div>
          <button class="ghost full" data-action="login-google">Google 로그인</button>
        `}
      </section>
    </div>
  `;
}

export function renderToast(toast) {
  return toast ? `<div class="toast">${esc(toast)}</div>` : "";
}
