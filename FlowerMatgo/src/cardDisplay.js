// Printed lettering follows the classic Korean hwatu faces: only Hongdan and
// Cheongdan ribbons carry text. Chodan and the rain ribbon remain unlettered.
import { spokenCardName } from './cardNames.js';
export function cardVisualDetails(item, options = {}) {
  const tags = item.tags || [];
  const ribbonText = item.type === 'ribbon'
    ? (tags.includes('hongdan') ? '홍단' : tags.includes('cheongdan') ? '청단' : '')
    : '';
  const gookjinConverted = item.id === 'm09-01' && !!options.gookjinAsDoubleJunk;
  return {
    ribbonText,
    brightText: item.type === 'bright' ? '光' : '',
    doubleJunkText: item.type === 'doubleJunk' || gookjinConverted ? '쌍피' : '',
    gookjinConverted
  };
}

export function cardBookLabel(item) {
  if (item.id === 'm09-01') return '국진 · 쌍피 전환 가능';
  if (item.id === 'm11-02') return '똥쌍피 · 피 2장';
  if (item.id === 'm12-04') return '비쌍피 · 피 2장';
  if (item.id === 'm08-03' || item.id === 'm08-04') return '공산 흑백 억새 피';
  return spokenCardName(item);
}
