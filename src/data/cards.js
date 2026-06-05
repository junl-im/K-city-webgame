export const GRADES = {
  R: { label: "R", power: 1, color: "grade-r" },
  SR: { label: "SR", power: 1.28, color: "grade-sr" },
  SSR: { label: "SSR", power: 1.62, color: "grade-ssr" }
};

export const FACTIONS = {
  ward: "방범대",
  civic: "시민망",
  tech: "네온공학",
  occult: "이면계"
};

export const ELEMENTS = {
  light: "광휘",
  shadow: "그림자",
  spark: "전류",
  oath: "맹세"
};

export const CARD_POOL = [
  {
    id: "r_minseo_patrol",
    name: "한민서",
    title: "골목 순찰자",
    grade: "R",
    faction: "ward",
    element: "oath",
    role: "guard",
    cost: 2,
    glyph: "巡",
    quote: "도시는 작아도 지킬 곳은 많아.",
    stats: { hp: 88, atk: 18, def: 12, spd: 9 },
    skill: { name: "방패 진입", type: "shield", scale: 0.26, text: "아군 전체에게 짧은 보호막" },
    passive: { name: "동네 지형", text: "방범대가 2명 이상이면 방어 +8%" }
  },
  {
    id: "r_jun_wrench",
    name: "오준",
    title: "전파 수리공",
    grade: "R",
    faction: "tech",
    element: "spark",
    role: "striker",
    cost: 2,
    glyph: "電",
    quote: "전선 하나만 이어도 흐름이 바뀐다.",
    stats: { hp: 72, atk: 24, def: 8, spd: 12 },
    skill: { name: "과전류", type: "burst", scale: 1.28, text: "가장 약한 적에게 전류 피해" },
    passive: { name: "잔류 전하", text: "치명타 시 추가 전류 피해" }
  },
  {
    id: "r_sora_dispatch",
    name: "유소라",
    title: "민원 기록관",
    grade: "R",
    faction: "civic",
    element: "light",
    role: "support",
    cost: 2,
    glyph: "記",
    quote: "작은 신고 하나가 큰 사건을 막아요.",
    stats: { hp: 68, atk: 17, def: 9, spd: 14 },
    skill: { name: "상황 공유", type: "heal", scale: 0.42, text: "가장 다친 아군 회복" },
    passive: { name: "민원망", text: "시민망 카드마다 속도 +3%" }
  },
  {
    id: "sr_hwarang_drone",
    name: "강화랑",
    title: "드론 기동대장",
    grade: "SR",
    faction: "tech",
    element: "spark",
    role: "striker",
    cost: 3,
    glyph: "翼",
    quote: "위에서 보면 숨을 곳이 없지.",
    stats: { hp: 96, atk: 32, def: 11, spd: 18 },
    skill: { name: "삼각 포위망", type: "multi", scale: 0.72, text: "무작위 적 3회 타격" },
    passive: { name: "공중 정찰", text: "첫 턴 아군 명중 +12%" }
  },
  {
    id: "sr_mira_oracle",
    name: "서미라",
    title: "이면 점술가",
    grade: "SR",
    faction: "occult",
    element: "shadow",
    role: "control",
    cost: 3,
    glyph: "夢",
    quote: "그림자는 먼저 도착한 소식이야.",
    stats: { hp: 82, atk: 29, def: 10, spd: 16 },
    skill: { name: "불길한 예보", type: "weaken", scale: 0.84, text: "적 전체 공격 약화 후 피해" },
    passive: { name: "몽중 표식", text: "이면계 2명 이상이면 스킬 피해 +10%" }
  },
  {
    id: "sr_taeho_medic",
    name: "마태호",
    title: "야간 응급반",
    grade: "SR",
    faction: "civic",
    element: "light",
    role: "support",
    cost: 3,
    glyph: "救",
    quote: "구조는 전투가 끝난 뒤가 아니라 지금 한다.",
    stats: { hp: 110, atk: 21, def: 16, spd: 11 },
    skill: { name: "골든타임", type: "heal", scale: 0.68, text: "가장 다친 아군 대량 회복" },
    passive: { name: "심폐 루틴", text: "아군이 쓰러질 때 1회 보호막" }
  },
  {
    id: "sr_yena_blade",
    name: "백예나",
    title: "우산검 학생회장",
    grade: "SR",
    faction: "ward",
    element: "oath",
    role: "duelist",
    cost: 3,
    glyph: "傘",
    quote: "비가 오면, 칼집이 하나 더 생겨.",
    stats: { hp: 92, atk: 35, def: 12, spd: 17 },
    skill: { name: "빗금 베기", type: "burst", scale: 1.48, text: "가장 강한 적에게 결투 피해" },
    passive: { name: "정정당당", text: "상대보다 빠르면 공격 +9%" }
  },
  {
    id: "ssr_arin_archon",
    name: "윤아린",
    title: "네온 집행관",
    grade: "SSR",
    faction: "ward",
    element: "light",
    role: "leader",
    cost: 5,
    glyph: "判",
    quote: "빛은 심판이 아니라 방향이다.",
    stats: { hp: 148, atk: 46, def: 22, spd: 19 },
    skill: { name: "제로 라이트 오더", type: "execute", scale: 1.75, text: "체력이 낮은 적 처형, 처치 시 재행동" },
    passive: { name: "도시 헌장", text: "모든 아군 공격/방어 +8%" }
  },
  {
    id: "ssr_raven_ghost",
    name: "레이븐",
    title: "404번 해커",
    grade: "SSR",
    faction: "tech",
    element: "shadow",
    role: "control",
    cost: 5,
    glyph: "404",
    quote: "문이 없으면, 주소를 지우면 돼.",
    stats: { hp: 116, atk: 52, def: 15, spd: 24 },
    skill: { name: "블랙아웃 루프", type: "weaken", scale: 1.16, text: "적 전체 약화와 침묵 확률" },
    passive: { name: "백도어", text: "전투 시작 시 가장 빠른 적 속도 감소" }
  },
  {
    id: "ssr_haneul_shaman",
    name: "천하늘",
    title: "옥상 무녀",
    grade: "SSR",
    faction: "occult",
    element: "oath",
    role: "support",
    cost: 5,
    glyph: "巫",
    quote: "도시의 옥상에도 별자리는 떠.",
    stats: { hp: 132, atk: 38, def: 19, spd: 21 },
    skill: { name: "결계: 별비", type: "shield", scale: 0.62, text: "전체 보호막과 지속 회복" },
    passive: { name: "별의 조율", text: "서로 다른 속성 3개 이상이면 스킬 게이지 +1" }
  },
  {
    id: "ssr_ryu_exile",
    name: "류시온",
    title: "폐선로 망명자",
    grade: "SSR",
    faction: "occult",
    element: "shadow",
    role: "striker",
    cost: 5,
    glyph: "亡",
    quote: "사라진 역은 아직 종착지를 기억한다.",
    stats: { hp: 124, atk: 58, def: 14, spd: 20 },
    skill: { name: "종착 없는 칼날", type: "multi", scale: 0.94, text: "연속 4회 그림자 피해" },
    passive: { name: "망명자의 호흡", text: "체력이 낮을수록 피해 증가" }
  },
  {
    id: "ssr_noa_librarian",
    name: "노아",
    title: "기록도서관 AI",
    grade: "SSR",
    faction: "civic",
    element: "spark",
    role: "leader",
    cost: 5,
    glyph: "AI",
    quote: "분실된 기억까지 색인합니다.",
    stats: { hp: 122, atk: 44, def: 18, spd: 23 },
    skill: { name: "아카식 리로드", type: "heal", scale: 0.86, text: "회복 후 가장 강한 아군 재충전" },
    passive: { name: "시민 데이터레이크", text: "전투 보상 경험치 +8%" }
  }
];

export function getCard(cardId) {
  return CARD_POOL.find((card) => card.id === cardId);
}

export function getStarterCards() {
  return ["r_minseo_patrol", "r_jun_wrench", "r_sora_dispatch"].map((cardId, index) => ({
    instanceId: `starter-${cardId}-${index}`,
    cardId,
    level: 1,
    xp: 0,
    locked: index === 0
  }));
}
