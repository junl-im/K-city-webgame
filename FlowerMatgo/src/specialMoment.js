// Decorative, presentation-only event copy. Game rules decide these events.
// A concise title stays readable on a narrow phone; the rules engine's
// original event wording remains available as the small detail line.
const MOMENTS = Object.freeze({
  shake: {title:'흔들기!', detail:'같은 무늬 세 장을 흔들었어!', major:false},
  bomb: {title:'폭탄!', detail:'한 번에 몰아치는 강력한 한 수!', major:true},
  sweep: {title:'싹쓸이!', detail:'바닥패를 전부 가져왔어!', major:true},
  ppeok: {title:'뻑!', detail:'앗, 예상 못 한 반전!', major:false},
  ttadak: {title:'따닥!', detail:'같은 무늬 패가 한 번에!', major:false},
  jjok: {title:'쪽!', detail:'뒤집은 패가 딱 맞았어!', major:false},
  bright: {title:'광 획득!', detail:'반짝이는 광을 모았어!', major:false},
  double: {title:'쌍피 획득!', detail:'피 두 장의 가치!', major:false}
});

export const SPECIAL_FLASH_MS = 1540;

export function specialMoment(kind, originalText='') {
  if (kind === 'go') {
    const text = String(originalText || '');
    const count = Math.max(1, Number(text.match(/(\d+)고/)?.[1]) || 1);
    const rival = text.startsWith('상대');
    const detail = count >= 7 ? '멈출 수 없는 연속 고!' : count >= 4 ? '점점 더 뜨거워지는 승부!' : count >= 2 ? '한 번 더 도전!' : '승부를 이어가요!';
    return {kind:'go',title:`${rival?'상대 ':''}${count}고!`,detail,major:count>=3};
  }
  const normalized = Object.hasOwn(MOMENTS,kind) ? kind : 'special';
  const text = String(originalText || '').trim();
  const fixed = MOMENTS[normalized];
  if (!fixed) return {kind:normalized,title:text || '특별한 순간!',detail:'',major:false};
  if (normalized === 'bomb' && /핵폭탄/.test(text)) {
    return {kind:normalized,title:'핵폭탄!',detail:'강력한 연속 패! 꽃판이 들썩!',major:true};
  }
  if (normalized === 'bomb' && /두장폭탄/.test(text)) {
    return {kind:normalized,title:'두 장 폭탄!',detail:'두 장을 착착 이어 냈어!',major:true};
  }
  return {
    kind:normalized,
    title:fixed.title,
    detail:text && text !== fixed.title ? text : fixed.detail,
    major:fixed.major
  };
}
