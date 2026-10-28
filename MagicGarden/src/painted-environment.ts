/**
 * v19 quiet hand-painted world ambience.
 * These are anchors for existing transparent WebP illustrations, not vectors.
 * Areas are chosen as decorative scenic edges rather than walking targets.
 * Data is static and shared with the PixiJS scene (no new downloadable art).
 */
export type PaintedZone = 'town'|'farm'|'lab'|'nursery';
export type PaintedTile = 'seed'|'berry'|'essence'|'egg'|'leafbud'|'bubble'|'sparkle'|'flower';
export type AmbientAnchor = {
  zone:PaintedZone; tile:PaintedTile; x:number; y:number;
  size:number; alpha:number; phase:number; drift:number;
};
export const PAINTED_AMBIENCE:ReadonlyArray<AmbientAnchor> = [
  {zone:'town',tile:'flower', x:354,y:413,size:42,alpha:.66,phase:.3,drift:5},
  {zone:'town',tile:'flower', x:742,y:397,size:37,alpha:.61,phase:1.9,drift:7},
  {zone:'town',tile:'flower', x:1113,y:544,size:31,alpha:.57,phase:2.7,drift:5},
  {zone:'town',tile:'sparkle',x:454,y:508,size:31,alpha:.40,phase:3.8,drift:8},
  {zone:'town',tile:'flower', x:561,y:742,size:34,alpha:.52,phase:5.3,drift:4},
  {zone:'farm',tile:'flower', x:249,y:435,size:40,alpha:.62,phase:.6,drift:5},
  {zone:'farm',tile:'seed',   x:1118,y:472,size:32,alpha:.47,phase:1.8,drift:6},
  {zone:'farm',tile:'flower', x:974,y:713,size:40,alpha:.61,phase:3.7,drift:5},
  {zone:'farm',tile:'flower', x:379,y:745,size:31,alpha:.48,phase:4.8,drift:4},
  {zone:'farm',tile:'berry',  x:782,y:426,size:31,alpha:.44,phase:5.4,drift:6},
  {zone:'lab',tile:'essence',x:485,y:397,size:31,alpha:.65,phase:.5,drift:10},
  {zone:'lab',tile:'flower', x:379,y:573,size:30,alpha:.43,phase:1.8,drift:5},
  {zone:'lab',tile:'essence',x:839,y:454,size:36,alpha:.61,phase:3.6,drift:9},
  {zone:'lab',tile:'sparkle',x:759,y:623,size:28,alpha:.40,phase:5.2,drift:7},
  {zone:'nursery',tile:'egg', x:430,y:451,size:37,alpha:.60,phase:1.2,drift:5},
  {zone:'nursery',tile:'flower',x:864,y:603,size:39,alpha:.65,phase:2.5,drift:5},
  {zone:'nursery',tile:'sparkle',x:759,y:421,size:29,alpha:.40,phase:4.7,drift:8},
  {zone:'nursery',tile:'flower',x:341,y:687,size:32,alpha:.51,phase:5.5,drift:4},
];
export function ambiencePose(anchor:AmbientAnchor, timeMs:number, reducedMotion:boolean){
  if(reducedMotion) return {x:anchor.x,y:anchor.y,rotation:0,alpha:anchor.alpha,scale:1};
  const time=Math.max(0,timeMs)/1000;
  return {
    x:anchor.x+Math.sin(time*.63+anchor.phase)*anchor.drift,
    y:anchor.y+Math.sin(time*.82+anchor.phase*1.3)*anchor.drift*.48,
    rotation:Math.sin(time*.57+anchor.phase)*.056,
    alpha:Math.max(.19,Math.min(.87,anchor.alpha+Math.sin(time*.91+anchor.phase)*.095)),
    scale:1+Math.sin(time*.66+anchor.phase)*.035,
  };
}
