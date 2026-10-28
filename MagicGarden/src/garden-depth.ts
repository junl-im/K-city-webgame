
/**
 * v20: Y-sorted hand-painted foreground accents.
 *
 * These are tiny REAL WebP cutouts already shipped in v18, never synthetic
 * Pixi vector foliage. They are composited alongside the fox and NPCs,
 * unlike the distant flowers which correctly remain behind all characters.
 *
 * Large architecture/water occlusion must await pixel-verified paintings;
 * do not obscure the town with guessed rectangular screenshot masks.
 */
export type ForegroundZone = 'town'|'farm'|'lab'|'nursery';
export type ForegroundTile = 'flower'|'leafbud'|'berry'|'sparkle';
export type ForegroundAnchor = {
  zone:ForegroundZone;tile:ForegroundTile;x:number;y:number;
  size:number;opacity:number;phase:number;
};
export const FOREGROUND_PAINTINGS:ReadonlyArray<ForegroundAnchor> = [
  {zone:'town',tile:'flower',x:332,y:609,size:58,opacity:.87,phase:.5},
  {zone:'town',tile:'flower',x:790,y:646,size:48,opacity:.82,phase:1.9},
  {zone:'town',tile:'flower',x:1132,y:674,size:54,opacity:.84,phase:2.8},
  {zone:'farm',tile:'leafbud',x:250,y:627,size:57,opacity:.87,phase:1.1},
  {zone:'farm',tile:'flower',x:970,y:683,size:59,opacity:.86,phase:2.4},
  {zone:'farm',tile:'berry',x:1136,y:619,size:48,opacity:.76,phase:4.2},
  {zone:'lab',tile:'flower',x:421,y:611,size:51,opacity:.85,phase:.9},
  {zone:'lab',tile:'sparkle',x:1004,y:632,size:39,opacity:.71,phase:2.8},
  {zone:'nursery',tile:'flower',x:921,y:664,size:53,opacity:.87,phase:1.4},
  {zone:'nursery',tile:'leafbud',x:360,y:646,size:48,opacity:.83,phase:3.2},
];
/** Decorative roots touch the same ground plane as the character's feet. */
export function footDepth(y:number):number {
  if(!Number.isFinite(y)) return 0;
  return Math.max(0,Math.min(800,y));
}
export function foregroundDepth(anchor:ForegroundAnchor):number {
  // Small sprites, but their leaves sit slightly in front of the root.
  return footDepth(anchor.y)+2;
}
export function foregroundMotion(anchor:ForegroundAnchor,elapsedMs:number,reducedMotion:boolean) {
  if(reducedMotion) return {rotation:0,opacity:anchor.opacity};
  const seconds=Math.max(0,elapsedMs)/1000;
  return {
    rotation:Math.sin(seconds*.56+anchor.phase)*.034,
    opacity:Math.max(.60,Math.min(.92,anchor.opacity+Math.sin(seconds*.74+anchor.phase)*.035)),
  };
}
