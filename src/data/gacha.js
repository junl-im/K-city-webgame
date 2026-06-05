export const BANNER = {
  id: "neon-oath-001",
  title: "네온 선서 픽업",
  subtitle: "SSR 윤아린 / SSR 노아 출현 확률 상승",
  singleCost: 120,
  tenCost: 1080,
  pityAt: 70,
  rates: {
    SSR: 0.03,
    SR: 0.17,
    R: 0.8
  },
  pickup: {
    SSR: ["ssr_arin_archon", "ssr_noa_librarian"],
    SR: ["sr_yena_blade", "sr_hwarang_drone"]
  }
};

export function gradeByRoll(value, pity, pityAt = BANNER.pityAt) {
  if (pity + 1 >= pityAt) return "SSR";
  if (value < BANNER.rates.SSR) return "SSR";
  if (value < BANNER.rates.SSR + BANNER.rates.SR) return "SR";
  return "R";
}
