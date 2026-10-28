import assert from 'node:assert/strict';
import { storyMotion, inclineSceneGeometry, frictionFootprintCue, floatingObjectPlacement, waterbedShadowCue, heatGlassPlacement } from './animated-experiments.mjs';
import { inertiaReading, frictionReading, buoyancyReading, pendulumReading, heatReading } from './everyday-core.mjs';

const slow = inertiaReading(3,'gentle');
const abrupt = inertiaReading(3,'sudden');
const slowMove = storyMotion('inertia',1,slow,{speed:3,mode:'gentle'});
const abruptMove = storyMotion('inertia',1,abrupt,{speed:3,mode:'sudden'});
assert.ok(abruptMove.separation>slowMove.separation,'Abrupt braking visibly separates apple from cart more');
assert.equal(storyMotion('inertia',0,abrupt,{speed:3,mode:'sudden'}).separation,0);
for(const braking of ['gentle','sudden']){
  const low=storyMotion('inertia',1,inertiaReading(1,braking),{speed:1,mode:braking});
  const high=storyMotion('inertia',1,inertiaReading(5,braking),{speed:5,mode:braking});
  assert.ok(high.cart>low.cart,`${braking}: larger speed must move cart farther`);
  assert.ok(high.separation>low.separation,`${braking}: larger speed must project loose apple farther`);
}
assert.ok(storyMotion('inertia',1,slow,{speed:3,mode:'gentle'}).cart >
  storyMotion('inertia',1,abrupt,{speed:3,mode:'sudden'}).cart,
  'Gentle braking must visibly yield a longer stopping distance at the same speed');

const rough = frictionReading('rough',25);
const ice = frictionReading('ice',25);
assert.equal(storyMotion('friction',1,rough).travel,0,'Rough surface should hold at 25 degrees');
assert.ok(storyMotion('friction',1,ice).travel>250,'Ice shoe visibly slides downhill');
assert.equal(storyMotion('friction',0,ice).travel,0);
for(const degrees of [10,15,20,25,30,35,40]){
  for(const travel of [0,215,430]){
    const g=inclineSceneGeometry(degrees,travel);
    assert.ok(Math.abs(Math.atan2(g.y1-g.y0,g.x1-g.x0)*180/Math.PI-degrees)<1e-9,
      'Ramp geometric angle must match the selected degree');
    assert.ok(g.contactX>=g.x0 && g.contactX<=g.x1,'Shoe contact must stay on ramp');
    assert.ok(g.contactY>=g.y0 && g.contactY<=g.y1,'Shoe contact must stay within ramp height');
    assert.ok(Math.abs(Math.hypot(g.shoeX-g.contactX,g.shoeY-g.contactY)-90)<1e-9,
      'Shoe raster origin must remain above the ramp even at extreme inclines');
  }
}
const feltContact=frictionFootprintCue('rough',0,false);
const icyContact=frictionFootprintCue('ice',1,true);
assert.ok(feltContact.opacity>icyContact.opacity,'Soft felt has a deeper contact footprint');
assert.ok(icyContact.sheen>feltContact.sheen,'Shiny ice has stronger contact glints');
assert.equal(feltContact.trailAlpha,0,'A stationary shoe leaves no moving skid trail');
assert.ok(frictionFootprintCue('ice',1,true).trailAlpha>frictionFootprintCue('ice',0,true).trailAlpha);

assert.equal(storyMotion('buoyancy',1,buoyancyReading('duck',0)).sink,0);
assert.equal(storyMotion('buoyancy',1,buoyancyReading('stone',0)).sink,221);
const stoneAtRest = storyMotion('buoyancy',1,buoyancyReading('stone',0));
const tankPebbleTop = -133+326-39;
// The source atlas stone leaves about 16px of transparent padding below its visible paint.
const stoneVisibleBottom = (-137+stoneAtRest.sink)-60+(146-16);
assert.equal(stoneVisibleBottom,tankPebbleTop,'Visible rock pixels should touch the aquarium pebble bed');
assert.equal(waterbedShadowCue(stoneAtRest.sink/221).opacity,waterbedShadowCue(1).opacity);
for(const salinity of [0,15,30]){
  const reading=buoyancyReading('duck',salinity);
  const placement=floatingObjectPlacement(reading.submergedFraction);
  assert.ok(placement.emergedHeight>202*.5,'The floating duck must keep its beak above water');
  assert.ok(placement.visibleSubmergedHeight>0 && placement.visibleSubmergedHeight<202,
    'The floating duck must visibly intersect the water');
}
assert.ok(floatingObjectPlacement(buoyancyReading('duck',30).submergedFraction).top <
  floatingObjectPlacement(buoyancyReading('duck',0).submergedFraction).top,
  'More buoyant salt water must lift the visible duck slightly higher');
assert.ok(waterbedShadowCue(1).opacity>waterbedShadowCue(0).opacity,
  'Sunken stone should cast a darker bed shadow than one near the surface');
assert.ok(waterbedShadowCue(1).radiusX<waterbedShadowCue(0).radiusX,
  'Contact shadow should tighten at the aquarium floor');
assert.deepEqual(waterbedShadowCue(-2),waterbedShadowCue(0));
assert.deepEqual(waterbedShadowCue(4),waterbedShadowCue(1));

const short = pendulumReading(.4,'earth',20);
const long = pendulumReading(1.6,'moon',20);
assert.ok(long.periodSeconds>short.periodSeconds);
assert.ok(Math.abs(storyMotion('pendulum',0,short).theta-20*Math.PI/180)<1e-10);
assert.ok(Math.abs(storyMotion('pendulum',short.periodSeconds/3.5,short).theta-20*Math.PI/180)<1e-10);

const all=storyMotion('heat',1,heatReading(70,15,400));
const some=storyMotion('heat',1,heatReading(10,70,200));
assert.equal(all.iceScale,0,'Enough heat melts the whole cube');
assert.ok(some.iceScale>0 && some.iceScale<1,'Insufficient heat leaves visible ice');
assert.ok(storyMotion('heat',-.4,heatReading(40,40,200)).iceScale<=1);
for(const fraction of [1,.8,.4,.1,0]){
  const scene=heatGlassPlacement(fraction);
  assert.ok(scene.waterline>scene.glassY && scene.waterline<scene.glassY+scene.glassHeight);
  assert.ok(scene.cubeSize>=0 && scene.cubeSize<=scene.glassWidth-20);
  assert.ok(scene.cubeCenterY-scene.cubeSize/2>=scene.glassY,
    'Ice never appears above the opening of its water glass');
  assert.ok(scene.cubeCenterY+scene.cubeSize/2<=scene.glassY+scene.glassHeight,
    'Ice remains inside the water glass');
}
assert.equal(heatGlassPlacement(0).cubeSize,0,'Fully melted ice disappears inside the water');
assert.equal(heatGlassPlacement(3).cubeSize,heatGlassPlacement(1).cubeSize);

console.log('Animated experiment motion tests passed');
