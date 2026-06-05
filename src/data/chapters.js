export const CHAPTERS = [
  {
    id: "alley",
    name: "1장 골목길 비상망",
    theme: "밤마다 사라지는 가로등과 신고 기록",
    stages: [
      {
        id: "alley-1",
        name: "꺼진 가로등",
        level: 1,
        stamina: 2,
        enemyName: "그늘 불량배",
        enemy: { hp: 170, atk: 22, def: 8, spd: 8, tags: ["shadow"] },
        reward: { gold: 160, exp: 55, gems: 15 }
      },
      {
        id: "alley-2",
        name: "민원함의 낙서",
        level: 1,
        stamina: 3,
        enemyName: "낙서 괴이",
        enemy: { hp: 215, atk: 26, def: 10, spd: 10, tags: ["occult"] },
        reward: { gold: 210, exp: 70, gems: 20 }
      },
      {
        id: "alley-3",
        name: "첫 번째 균열",
        level: 2,
        stamina: 4,
        enemyName: "균열 감시자",
        enemy: { hp: 300, atk: 31, def: 14, spd: 11, tags: ["boss", "shadow"] },
        reward: { gold: 360, exp: 95, gems: 35 }
      }
    ]
  },
  {
    id: "station",
    name: "2장 폐선로 정거장",
    theme: "지도에서 사라진 역과 반복되는 막차 방송",
    stages: [
      {
        id: "station-1",
        name: "막차 안내음",
        level: 3,
        stamina: 5,
        enemyName: "승차권 망령",
        enemy: { hp: 410, atk: 42, def: 17, spd: 14, tags: ["occult"] },
        reward: { gold: 520, exp: 130, gems: 45 }
      },
      {
        id: "station-2",
        name: "유실물 보관소",
        level: 4,
        stamina: 5,
        enemyName: "분실 기억체",
        enemy: { hp: 520, atk: 48, def: 21, spd: 16, tags: ["shadow", "boss"] },
        reward: { gold: 720, exp: 170, gems: 60 }
      }
    ]
  }
];

export const DAILY_MISSIONS = [
  { id: "clear3", label: "사건 3회 해결", target: 3, reward: { gold: 500, gems: 30 } },
  { id: "draw1", label: "인재 1회 모집", target: 1, reward: { gold: 200, gems: 20 } },
  { id: "arena1", label: "아레나 1회 참여", target: 1, reward: { gold: 300, gems: 25 } }
];
