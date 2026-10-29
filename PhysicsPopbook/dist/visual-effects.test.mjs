import assert from 'node:assert/strict';
import { landingCue,groundShadowCue,wavefrontSpacing,magnetBallPosition,pulleySceneMotion,leverFulcrumSpriteTop,orbitalTrailCount,orbitToySizes,litBulbOpacity,celebrationCue } from './visual-effects.mjs';

assert.equal(landingCue(-1).alpha,0);
assert.equal(landingCue(.9).alpha,0);
assert.equal(landingCue(0).alpha,1);
assert.ok(landingCue(.3).radius>landingCue(0).radius);
assert.ok(landingCue(.3).alpha<landingCue(0).alpha);
assert.ok(landingCue(.3).scale>0);
for(const kind of ['ball','feather']){
  const high=groundShadowCue(1,kind),low=groundShadowCue(0,kind);
  assert.ok(low.opacity>high.opacity,`${kind}: grounded shadow is darker`);
  assert.ok(low.widthFactor<high.widthFactor,`${kind}: grounded shadow is tighter`);
  assert.ok(low.opacity>0&&low.opacity<.3,`${kind}: shadow stays subtle`);
  assert.deepEqual(groundShadowCue(-1,kind),low,`${kind}: clearance is clamped below ground`);
  assert.deepEqual(groundShadowCue(9,kind),high,`${kind}: clearance is clamped above release height`);
}
assert.ok(groundShadowCue(.5,'feather').widthFactor>groundShadowCue(.5,'ball').widthFactor);
assert.ok(groundShadowCue(.5,'feather').opacity<groundShadowCue(.5,'ball').opacity);
assert.ok(Number.isFinite(groundShadowCue(NaN).opacity));
assert.ok(wavefrontSpacing(2)>wavefrontSpacing(.5),'Lower-frequency sound has farther-apart wavefronts');
assert.ok(Number.isFinite(wavefrontSpacing(Number.NaN)));
assert.equal(magnetBallPosition(0,false,1).x,magnetBallPosition(1,false,1).x,'Wood must not move toward magnet');
assert.equal(magnetBallPosition(.8,false,1).travel,0);
assert.ok(magnetBallPosition(1,true,.8).x<magnetBallPosition(0,true,.8).x,'Iron approaches magnet');
assert.ok(magnetBallPosition(1,true,.8).x<magnetBallPosition(1,true,.2).x,'Stronger pull approaches farther');
assert.ok(magnetBallPosition(0,true,.8,1).x<magnetBallPosition(0,true,.8,5).x,'Close ball starts nearer to magnet');
assert.ok(magnetBallPosition(0,false,.8,1).x<magnetBallPosition(0,false,.8,5).x,'Wood distance can change without attraction');
for(const type of ['fixed','moving']){
  const beginning=pulleySceneMotion(0,type),ending=pulleySceneMotion(1,type);
  const loadRise=beginning.loadY-ending.loadY;
  const handleDrop=ending.handleY-beginning.handleY;
  assert.ok(loadRise>0&&handleDrop>0,`${type}: pulled end must descend as load rises`);
  assert.ok(Math.abs(handleDrop/loadRise-(type==='moving'?2:1))<1e-9,`${type}: ideal pulley travel ratio`);
  assert.ok(ending.handleY<.80,`${type}: handle remains visible above mobile caption`);
}
assert.equal(orbitalTrailCount(0),0);
assert.equal(orbitalTrailCount(1),15);
assert.equal(orbitalTrailCount(10),15);
for(const [w,h] of [[320,390],[375,420],[760,450]]){
  const orbitUnit=Math.min(w*.38,h*.4)/1.8;
  const toys=orbitToySizes(w,h,orbitUnit);
  assert.ok((toys.sun+toys.explorer)/2<orbitUnit*.6,`${w}px: explorer must not overlap the Sun at 0.6 AU`);
}
assert.equal(litBulbOpacity(.8,false),0,'Open switch must show the unlit art');
assert.equal(litBulbOpacity(0,true),0,'No brightness means no lit overlay');
assert.ok(litBulbOpacity(.7,true)>litBulbOpacity(.3,true),'Bulb illustration tracks power');
assert.equal(litBulbOpacity(1,true),1,'Fully powered bulb uses the bright art');
assert.equal(celebrationCue(0).alpha,0);
assert.equal(celebrationCue(1).alpha,1);
console.log('Illustrated visual cues preserve motion bounds and sound-wave order');

for(const size of [48,72,98]){
  const beamY=360,visibleTip=leverFulcrumSpriteTop(beamY,size)+size*.20;
  assert.ok(visibleTip<=beamY&&beamY-visibleTip<=size*.04,
    'Visible fulcrum painting must meet the beam underside');
}
