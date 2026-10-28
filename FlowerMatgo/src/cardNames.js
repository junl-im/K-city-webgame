import { getCard } from './engine/cards';

// Keep months for the rules engine, but speak like people do at a hwatu table.
// In particular, "똥" and "비" are recognizable card families, not UI dates.
const FAMILIES = Object.freeze([
  '', '솔', '매조', '벚꽃', '흑싸리', '난초', '모란',
  '홍싸리', '공산', '국화', '단풍', '똥', '비'
]);

export function hwatuFamily(month) {
  const value = Number(month);
  return Number.isInteger(value) && value >= 1 && value <= 12
    ? FAMILIES[value] : '화투';
}

export function spokenCardName(itemOrId, { gookjinAsDoubleJunk = false } = {}) {
  const item = typeof itemOrId === 'string' ? getCard(itemOrId) : itemOrId;
  if (!item) return '화투패';
  if (item.month === 0) return item.name;
  if (item.id === 'm01-01') return '솔광';
  if (item.id === 'm11-01') return '똥광';
  if (item.id === 'm09-01') return gookjinAsDoubleJunk ? '국진 쌍피' : '국진';
  if (item.id === 'm11-02') return '똥쌍피';
  if (item.id === 'm12-04') return '비쌍피';
  if (item.type === 'junk') return `${hwatuFamily(item.month)} 피`;
  if (item.type === 'ribbon') return `${hwatuFamily(item.month)} ${item.name}`;
  return item.name;
}

// Presentation only: scores, turns and stored engine messages stay untouched.
export function spokenActionText(message) {
  return String(message ?? '').replace(/(1[0-2]|[1-9])월/g,
    (_, month) => hwatuFamily(Number(month)));
}
