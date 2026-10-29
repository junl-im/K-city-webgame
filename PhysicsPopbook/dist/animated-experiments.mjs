/**
 * Illustrated motion layers for the five everyday experiments.
 * Real physical quantities come from everyday-core.mjs; pixels are a storybook scale.
 * All featured objects are raster art. Canvas primitives only provide the stage and cues.
 */

import { celebrationCue, paintTwinkles } from './visual-effects.mjs?rev=20261029-artfix01';
import {paintToyStage,paintInclineMaterial,paintInclineStand,paintSurfaceTexture,stageMaterialForEverydayLesson} from './surface-materials.mjs?rev=20261029-artfix01';

const clamp01 = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const PI = Math.PI;
const available = img => !!(img && img.complete && img.naturalWidth > 0);

/** Keep the illustrated ramp at the angle shown by the experiment controls. */
export function inclineSceneGeometry(degrees, travel = 0) {
  const angle = Math.max(10, Math.min(40, Number(degrees) || 25)) * PI / 180;
  const length = 480;
  const dx = length * Math.cos(angle), dy = length * Math.sin(angle);
  const x0 = -dx / 2, y0 = 22 - dy / 2;
  const x1 = dx / 2, y1 = 22 + dy / 2;
  const t = .12 + .72 * clamp01(travel / 430);
  const contactX = x0 + dx * t, contactY = y0 + dy * t;
  // Account for transparent margins in the shoe illustration. A smaller lift
  // leaves the illustrated curved toe in contact rather than hovering above it.
  const shoeOffset = 90;
  return { angle, x0, y0, x1, y1, contactX, contactY,
    shoeX: contactX + Math.sin(angle) * shoeOffset,
    shoeY: contactY - Math.cos(angle) * shoeOffset };
}

/** Visual-only footprint on an illustrated surface. */
export function frictionFootprintCue(mode, progress, sliding){
  const p=clamp01(progress),ice=mode==='ice';
  return {width:ice?73:85,opacity:ice?.18:.28,
    sheen:ice?.19+.20*p:.07,trailAlpha:sliding?.18+.33*p:0};
}

/** Underwater stone shadow becomes compact and darker as the stone sinks. */
export function waterbedShadowCue(sunkFraction){
  const p=clamp01(sunkFraction);
  return {opacity:.065+.28*p,radiusX:94-30*p,radiusY:14-4*p};
}

/** A duck is top-heavy: its submerged VOLUME is not its submerged image height. */
export function floatingObjectPlacement(submergedFraction, waterline = -54, height = 202) {
  const fraction = clamp01(submergedFraction);
  // Keep the head and beak dry while the broad body sits in the water.
  // This is deliberately a silhouette cue, not a volume-to-height conversion.
  const emergedHeight = (.38 + (1 - fraction) * .5) * height;
  return { top: waterline - emergedHeight, emergedHeight,
    visibleSubmergedHeight: height - emergedHeight };
}

/** Anchor the melting ice inside the illustrated glass of warm water.
 * The visual cube shrinks in volume with storyMotion().iceScale; it never
 * becomes a separate puddle on the table or floats outside the glass.
 */
export function heatGlassPlacement(iceScale){
  const fraction=clamp01(iceScale);
  // The WebP has transparent edge padding; its visible gold base meets the
  // wooden shelf when rendered 300 storybook pixels tall.
  return {glassX:13,glassY:-49,glassWidth:286,glassHeight:300,waterline:75,
    cubeSize:170*fraction,cubeCenterY:78+(1-fraction)*10};
}

export function storyMotion(lesson, progress, reading, settings = {}) {
  const p = clamp01(progress);
  switch (lesson) {
    case 'inertia': {
      const speed = Math.max(0, Number(settings.speed) || 3);
      const abrupt = settings.mode === 'sudden';
      // The cart's visible journey grows with the actual braking distance.
      // Pixel positions are compressed to fit a picture-book stage, not to scale.
      const stopDistance = Math.max(0, Number(reading.stopDistanceMeters) || 0);
      const cartMax = 30 + 170 * stopDistance / (stopDistance + 1.3);
      const cart = cartMax * (1 - Math.pow(1 - p, 2));
      // At the same speed an abrupt stop produces a larger forward separation.
      const separation = (abrupt ? 110 : 44) * (.65 + speed * .12) * Math.pow(p, 1.15);
      const apple = cart + separation;
      return { cart, apple, separation: Math.max(0, apple - cart) };
    }
    case 'friction': {
      const displacementMeters = reading.sliding ?
        .5 * reading.accelerationMetersPerSecondSquared * Math.pow(3.5 * p, 2) : 0;
      return { travel: 430 * (1 - Math.exp(-displacementMeters * .10)),
        sliding: reading.sliding };
    }
    case 'buoyancy':
      // The 146px sprite rectangle contains about 16px of transparent bottom padding.
      // Finish at 221px so the visible stone, not the empty sprite edge, touches the pebble bed (y=154).
      return { depth: reading.floats ? reading.submergedFraction : 1,
        sink: reading.floats ? 0 : 221 * (1 - Math.pow(1 - p, 2)),
        bob: reading.floats ? Math.sin(p * 5 * PI) * Math.min(7, p * 26) : 0 };
    case 'pendulum': {
      const elapsedSeconds = 3.5 * p;
      return { theta: reading.amplitudeDegrees * PI / 180 *
        Math.cos(elapsedSeconds * 2 * PI / reading.periodSeconds), elapsedSeconds };
    }
    case 'heat': {
      const fraction = clamp01(reading.meltedFraction * p);
      return { fraction, iceScale: Math.cbrt(1 - fraction), puddle: 44 + 130 * fraction };
    }
    default: return {};
  }
}

function picture(ctx, art, sx, sy, sw, sh, x, y, w, h) {
  if (available(art)) ctx.drawImage(art, sx, sy, sw, sh, x, y, w, h);
}

const atlasCells={
  apple:[0,0,627,464],duck:[627,0,627,465],
  stone:[0,465,627,398],bell:[627,465,627,424],ice:[0,863,627,391]
};
function prop(ctx,atlas,name,x,y,w,h){
  if(!available(atlas))return;
  const [sx,sy,sw,sh]=atlasCells[name];
  const rx=atlas.naturalWidth/1254,ry=atlas.naturalHeight/1254;
  ctx.drawImage(atlas,sx*rx,sy*ry,sw*rx,sh*ry,x,y,w,h);
}

function ellipse(ctx, x, y, rx, ry, color, opacity = 1) {
  ctx.save();ctx.globalAlpha *= opacity;ctx.fillStyle = color;
  ctx.beginPath();ctx.ellipse(x, y, rx, ry, 0, 0, 2 * PI);ctx.fill();ctx.restore();
}

function softSpot(ctx, x, y, r, color) {
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}

function stars(ctx, p, x, y, count = 9) {
  for(let i=0;i<count;i++) {
    const a=i*2.39996 + p*2,dist=55+((i*37)%165),r=2+(i%3)*1.1;
    const sx=x+Math.cos(a)*dist,sy=y+Math.sin(a)*dist*.70;
    ellipse(ctx,sx,sy,r,r,i%2?'#d2ffff':'#ffe49d',.38+(i%4)*.11);
  }
}

function title(ctx, text, sub) {
  // On narrow phones the accessible scene header and results panel already
  // carry these words; drawing them again on the canvas covers the toy.
  if(ctx.canvas && ctx.canvas.clientWidth > 0 && ctx.canvas.clientWidth < 520)return;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 27px system-ui, sans-serif';ctx.lineWidth=6;
  ctx.strokeStyle='rgba(8,25,59,.92)';ctx.strokeText(text,0,-250);
  ctx.fillStyle='#fff4cf';ctx.fillText(text,0,-250);
  if(sub){ctx.font='700 16px system-ui, sans-serif';ctx.lineWidth=4;
    ctx.strokeText(sub,0,-219);ctx.fillStyle='#e4f6ff';ctx.fillText(sub,0,-219);}
  ctx.restore();
}

function inertia(ctx, art, atlas, p, data, settings) {
  const move=storyMotion('inertia',p,data,settings);
  softSpot(ctx,-80,40,285,'rgba(157,127,248,.19)');
  ctx.save();ctx.beginPath();ctx.ellipse(-179,32,203,260,0,0,2*PI);ctx.clip();
  ctx.drawImage(art,-355+move.cart*.40,-211,564,524);ctx.restore();
  ctx.strokeStyle='rgba(255,211,125,.44)';ctx.lineWidth=7;ctx.beginPath();
  ctx.ellipse(-179,32,203,260,0,0,2*PI);ctx.stroke();
  const appleX=-8+move.apple,appleY=-108-Math.sin(p*PI)*48;
  if(p>0) {
    ctx.save();ctx.strokeStyle='rgba(255,232,124,.65)';ctx.lineWidth=5;
    ctx.setLineDash([10,12]);ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(-37,-96);ctx.quadraticCurveTo(appleX*.55,-190,appleX-15,appleY+35);
    ctx.stroke();ctx.restore();
    for(let i=0;i<4;i++)ellipse(ctx,appleX-32-i*25,appleY+45+i*3,7-i,5-i*.5,'#fce2a0',.55-i*.1);
    // The cart slows while the loose apple keeps traveling; these traces are decorative.
    for(let i=0;i<5;i++){
      const q=(p*1.9+i/5)%1;
      ellipse(ctx,-215+move.cart*.40-i*13,174-q*19,2.6+q*4,2.1+q*2,'#d7e5ff',(1-q)*.42);
    }
  }
  ctx.save();ctx.shadowColor='rgba(255,166,100,.5)';ctx.shadowBlur=18;
  prop(ctx,atlas,'apple',appleX-85,appleY-91,172,163);ctx.restore();
  stars(ctx,p,appleX,appleY,7);
  title(ctx,p===0?'사과도 함께 달려요!':settings.mode==='sudden'?'앗! 사과가 앞으로 쏙!':'사과는 계속 가려 해요!',
    `수레 정지 시간 ${data.stopTimeSeconds.toFixed(1)}초`);
}

function friction(ctx, art, shoe, materialAtlas, p, data, settings) {
  const motion=storyMotion('friction',p,data,settings);
  const isIce=settings.mode==='ice';
  softSpot(ctx,0,50,300,isIce?'rgba(96,218,255,.29)':'rgba(255,134,196,.23)');
  stars(ctx,p,0,123,16);
  // Ramp and shoe share the same true inclination as the displayed control.
  const degree=Number(settings.slopeDegrees)||25;
  const ramp=inclineSceneGeometry(degree,motion.travel);
  const {x0,y0,x1,y1,shoeX,shoeY}=ramp;
  paintInclineStand(ctx,materialAtlas,ramp);
  paintInclineMaterial(ctx,materialAtlas,{x0,y0,x1,y1,material:isIce?'ice':'felt'});
  // Felt compresses at the sole; hard ice keeps a narrower, cooler glint.
  // Both marks follow the exact incline, even when its angle is changed.
  const contact=frictionFootprintCue(settings.mode,p,data.sliding);
  ctx.save();ctx.translate(ramp.contactX,ramp.contactY);ctx.rotate(ramp.angle);
  const contactShade=ctx.createRadialGradient(17,-27,2,17,-27,contact.width);
  contactShade.addColorStop(0,`rgba(8,30,57,${contact.opacity})`);
  contactShade.addColorStop(1,'rgba(8,30,57,0)');
  ctx.fillStyle=contactShade;ctx.beginPath();ctx.ellipse(17,-29,contact.width,10,0,0,2*PI);ctx.fill();
  ctx.strokeStyle=isIce?`rgba(225,253,255,${contact.sheen})`:`rgba(255,222,223,${contact.sheen})`;
  ctx.lineWidth=isIce?2.3:1.4;ctx.lineCap='round';
  for(const d of [-38,-11,17,43]){
    ctx.beginPath();ctx.moveTo(d,-30);ctx.lineTo(d+8,-28);ctx.stroke();
  }
  ctx.restore();
  const t=motion.travel/430;
  ctx.save();ctx.translate(shoeX,shoeY);ctx.rotate(ramp.angle);
  ellipse(ctx,0,88,77,10,'#071c41',.22);
  if(available(shoe)){
    ctx.filter=isIce?'none':'hue-rotate(121deg) saturate(1.15)';
    ctx.drawImage(shoe,-107,-90,215,195);ctx.filter='none';
  }
  ctx.restore();
  if(t>.03){
    for(let i=0;i<6;i++)ellipse(ctx,ramp.contactX-Math.cos(ramp.angle)*(34+i*22),
      ramp.contactY-Math.sin(ramp.angle)*(34+i*22),5.5,4.4,isIce?'#b4faff':'#ffd8ee',.65-i*.085);
    // Ice leaves silky sliding streaks; the rough surface kicks up tiny warm dust.
    ctx.save();ctx.lineCap='round';ctx.lineWidth=isIce?3:1.9;
    for(let i=0;i<4;i++){
      ctx.strokeStyle=isIce?`rgba(195,251,255,${.53-i*.1})`:`rgba(255,223,176,${.58-i*.13})`;
      const d=40+i*22;
      ctx.beginPath();ctx.moveTo(ramp.contactX-Math.cos(ramp.angle)*d,ramp.contactY-Math.sin(ramp.angle)*d);
      ctx.lineTo(ramp.contactX-Math.cos(ramp.angle)*(d+25),ramp.contactY-Math.sin(ramp.angle)*(d+25));ctx.stroke();
    }
    ctx.restore();
  }
  title(ctx,!data.sliding?'폭신한 길이 잡아줘요!':isIce?'슈우욱~ 미끄럼 출발!':'앗, 여기서도 미끄러져요!',
    data.sliding?`경사 ${degree}° · ${data.accelerationMetersPerSecondSquared.toFixed(1)} m/s²`:`경사 ${degree}° · 아직 제자리!`);
}

function buoyancy(ctx, atlas, materialAtlas, p, data, settings) {
  const motion=storyMotion('buoyancy',p,data);
  const isDuck=settings.mode==='duck';
  softSpot(ctx,0,171,298,'rgba(153,124,244,.19)');
  const x=-218,y=-133,ww=436,hh=326,waterline=-54;
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,ww,hh,38);ctx.clip();
  const water=ctx.createLinearGradient(0,waterline,0,y+hh);
  water.addColorStop(0,'rgba(123,248,255,.62)');water.addColorStop(.4,'rgba(49,173,234,.40)');water.addColorStop(1,'rgba(13,105,185,.65)');
  ctx.fillStyle=water;ctx.fillRect(x,waterline,ww,hh);
  // The aquarium floor has real miniature pebbles, subdued by the water above.
  paintSurfaceTexture(ctx,materialAtlas,'soil',x+8,y+hh-39,ww-16,33,.47);
  const depthTint=ctx.createLinearGradient(0,y+hh-40,0,y+hh);
  depthTint.addColorStop(0,'rgba(77,184,231,.30)');depthTint.addColorStop(1,'rgba(15,78,145,.44)');
  ctx.fillStyle=depthTint;ctx.fillRect(x+8,y+hh-42,ww-16,42);
  // Water refracts soft glints over the pebbles; the stone casts a shadow
  // toward that bed before touching it. No dynamics are fed back to buoyancy.
  const stoneShadow=waterbedShadowCue(isDuck?0:motion.sink/221);
  ctx.save();
  const stoneShade=ctx.createRadialGradient(0,y+hh-30,0,0,y+hh-30,stoneShadow.radiusX);
  stoneShade.addColorStop(0,`rgba(6,40,66,${isDuck?.03:stoneShadow.opacity})`);
  stoneShade.addColorStop(1,'rgba(6,40,66,0)');
  ctx.fillStyle=stoneShade;ctx.beginPath();ctx.ellipse(0,y+hh-30,stoneShadow.radiusX,stoneShadow.radiusY,0,0,2*PI);ctx.fill();
  ctx.strokeStyle='rgba(197,251,255,.12)';ctx.lineWidth=2;
  for(const i of [-2,-1,0,1,2]){
    ctx.beginPath();ctx.ellipse(i*72+12,y+hh-17+(i%2)*4,24,4,0,0,PI);ctx.stroke();
  }
  ctx.restore();
  for(let i=0;i<6;i++){const yy=waterline+30+i*39;ctx.strokeStyle='rgba(225,255,255,.1)';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,yy,150-i*12,12,0,0,PI);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle='rgba(196,250,255,.87)';ctx.lineWidth=11;
  ctx.beginPath();ctx.roundRect(x,y,ww,hh,38);ctx.stroke();
  ctx.strokeStyle='rgba(251,255,255,.9)';ctx.lineWidth=6;ctx.beginPath();
  ctx.ellipse(0,waterline,218,25,0,0,2*PI);ctx.stroke();
  const objY=-137+motion.sink;
  if(isDuck){
    const duck=floatingObjectPlacement(motion.depth,waterline,202);
    prop(ctx,atlas,'duck',-131,duck.top+motion.bob,266,202);
    // The body is behind a transparent foreground-water layer, not pasted on top.
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,ww,hh,38);ctx.clip();
    const front=ctx.createLinearGradient(0,waterline,0,waterline+170);
    front.addColorStop(0,'rgba(144,249,255,.27)');
    front.addColorStop(1,'rgba(38,157,231,.17)');
    ctx.fillStyle=front;ctx.fillRect(x,waterline,ww,hh);ctx.restore();
    // The waterline overdraw separates emerged and submerged parts.
    ctx.strokeStyle='rgba(172,253,255,.8)';ctx.lineWidth=7;ctx.beginPath();
    ctx.ellipse(0,waterline+5,120+Math.sin(p*21)*9,12,0,0,PI);ctx.stroke();
    if(p>.01){
      const spread=90+p*48;
      ctx.strokeStyle=`rgba(226,255,255,${Math.max(.1,.59-p*.34)})`;ctx.lineWidth=2.8;
      ctx.beginPath();ctx.ellipse(0,waterline+9,spread,7+Math.sin(p*9)*2,0,0,PI);ctx.stroke();
    }
  }else{
    prop(ctx,atlas,'stone',-111,objY-60,225,146);
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,ww,hh,38);ctx.clip();
    ctx.fillStyle='rgba(65,190,248,.18)';ctx.fillRect(x,waterline,ww,hh);ctx.restore();
    for(let i=0;i<6;i++){const t=(p*2+i/6)%1;
      ellipse(ctx,-22+Math.sin(i*7)*60,objY+12-t*190,3+i%3*2,5+i%3*3,'#d6ffff',(1-t)*.75);}
    if(p>.02&&p<.58){
      const ripple=p/.58;
      ctx.strokeStyle=`rgba(204,255,255,${.67*(1-ripple)})`;ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(0,waterline+7,42+ripple*150,7+ripple*10,0,0,PI);ctx.stroke();
      for(let i=0;i<5;i++)ellipse(ctx,-65+i*32,waterline-7-Math.sin(ripple*PI)*26-(i%2)*9,4,5,'#d6ffff',.65*(1-ripple));
    }
  }
  title(ctx,isDuck?'노랑 오리 둥둥~':'돌멩이는 퐁당!',
    isDuck?`몸체 부피의 약 ${Math.round(motion.depth*100)}%가 잠겨요`:'돌도 물이 위로 밀어줘요!');
}

function pendulum(ctx, atlas, p, data, settings) {
  const motion=storyMotion('pendulum',p,data);
  softSpot(ctx,0,-40,275,'rgba(212,168,255,.22)');
  stars(ctx,p,-8,15,16);
  const pivotX=-18,pivotY=-176;
  const len=177+(Number(settings.length)||1)*77;
  const bobX=pivotX+Math.sin(motion.theta)*len,bobY=pivotY+Math.cos(motion.theta)*len;
  if(p>.04){
    for(let i=3;i>=1;i--){
      const previous=storyMotion('pendulum',Math.max(0,p-i*.024),data).theta;
      const ghostX=pivotX+Math.sin(previous)*len,ghostY=pivotY+Math.cos(previous)*len;
      ellipse(ctx,ghostX,ghostY,15,15,'#e6c2ff',.08+(4-i)*.045);
    }
  }
  ctx.strokeStyle='#63427a';ctx.lineWidth=17;ctx.lineCap='round';ctx.beginPath();
  ctx.moveTo(-238,-192);ctx.quadraticCurveTo(-135,-252,pivotX,pivotY);ctx.stroke();
  ctx.strokeStyle='#ffd478';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(pivotX,pivotY);ctx.lineTo(bobX,bobY);ctx.stroke();
  ellipse(ctx,pivotX,pivotY,22,22,'#ffe59b');ellipse(ctx,pivotX,pivotY,11,11,'#ad74dc');
  ctx.save();ctx.translate(bobX,bobY);ctx.rotate(motion.theta*.15);
  prop(ctx,atlas,'bell',-102,-88,205,190);ctx.restore();
  ctx.save();ctx.setLineDash([6,10]);ctx.strokeStyle='rgba(248,218,255,.63)';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(pivotX,pivotY,len,PI*.32,PI*.68);ctx.stroke();ctx.restore();
  title(ctx,settings.mode==='moon'?'달에서는 더 느릿느릿~':'별방울이 흔들흔들!',
    `왕복 약 ${data.periodSeconds.toFixed(2)}초`);
}

function heat(ctx, art, atlas, glass, p, data) {
  const m=storyMotion('heat',p,data);
  softSpot(ctx,-95,-14,240,'rgba(255,199,99,.24)');
  ctx.save();ctx.beginPath();ctx.ellipse(-183,39,188,236,0,0,2*PI);ctx.clip();
  ctx.drawImage(art,-328,-206,616,553);ctx.restore();
  ctx.strokeStyle='rgba(255,204,120,.37)';ctx.lineWidth=7;ctx.beginPath();
  ctx.ellipse(-183,39,188,236,0,0,2*PI);ctx.stroke();
  // The lesson mixes ice and warm water IN a vessel. A separate ice puddle
  // outside the teapot would illustrate a different physical experiment.
  const glassScene=heatGlassPlacement(m.iceScale);
  const {glassX,glassY,glassWidth,glassHeight,waterline,cubeSize,cubeCenterY}=glassScene;
  const cx=glassX+glassWidth/2;
  ellipse(ctx,cx,213,119,13,'#091c3d',.33);
  if(available(glass))ctx.drawImage(glass,glassX,glassY,glassWidth,glassHeight);
  else {
    ctx.save();ctx.fillStyle='rgba(63,187,242,.53)';ctx.beginPath();
    ctx.roundRect(glassX+9,waterline,glassWidth-18,151,27);ctx.fill();ctx.restore();
  }
  if(cubeSize>1){
    ctx.save();ctx.globalAlpha=Math.min(1,m.iceScale*1.8);
    prop(ctx,atlas,'ice',cx-cubeSize/2,cubeCenterY-cubeSize/2,cubeSize,cubeSize);ctx.restore();
    // A pale water veil hides part of the ice below the same waterline.
    ctx.save();ctx.beginPath();ctx.roundRect(glassX+20,waterline,glassWidth-40,glassY+glassHeight-waterline-15,15);ctx.clip();
    ctx.fillStyle='rgba(55,166,223,.19)';ctx.fillRect(glassX+20,waterline,glassWidth-40,160);ctx.restore();
  }
  if(p>0){for(let i=0;i<6;i++){const q=(p*1.4+i/6)%1;
    ellipse(ctx,cx+Math.sin(i*4+q*3)*74,waterline+110-q*92,2.5+i%2,4+i%3,'#e7ffff',(1-q)*.59);}}
  // Melting appears as ripples INSIDE the glass; the water stays contained.
  if(m.fraction>.01){
    for(let i=0;i<3;i++){
      const q=(p*.8+i/3)%1;
      ctx.strokeStyle=`rgba(228,255,255,${.36*(1-q)*m.fraction})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(cx+Math.sin(i*3)*26,waterline,15+q*73,3+q*5,0,0,2*PI);ctx.stroke();
    }
  }
  title(ctx,m.fraction>=.995?'얼음이 사르르 사라졌어요!':'따뜻한 물이 얼음을 녹여요!',
    `얼음이 ${Math.round(m.fraction*100)}% 녹았어요`);
}

export function drawEverydayScene(ctx, {lesson, art, atlas, shoe, surfaceAtlas, waterGlass, width, height, progress, reading, settings}) {
  const p=clamp01(progress);
  ctx.save();
  const scale=Math.min(width/760,height/565,1.22);
  ctx.translate(width*.5,height*.535);ctx.scale(scale,scale);
  softSpot(ctx,0,6,350,'rgba(126,188,251,.12)');
  if(available(art)&&available(atlas)) {
    // Floor material belongs behind each moving toy. Keep the physics geometry on top.
    paintToyStage(ctx,surfaceAtlas,{y:215,width:640,height:85,material:stageMaterialForEverydayLesson(lesson,settings.mode)});
    if(lesson==='inertia')inertia(ctx,art,atlas,p,reading,settings);
    if(lesson==='friction')friction(ctx,art,shoe,surfaceAtlas,p,reading,settings);
    if(lesson==='buoyancy')buoyancy(ctx,atlas,surfaceAtlas,p,reading,settings);
    if(lesson==='pendulum')pendulum(ctx,atlas,p,reading,settings);
    if(lesson==='heat')heat(ctx,art,atlas,waterGlass,p,reading);
    stars(ctx,p,0,22,8);
    // A short, consistent success cue across all five tactile picture-book chapters.
    const finale=celebrationCue(p);
    if(finale.alpha>0){
      const point=lesson==='inertia'?{x:142,y:-113}:lesson==='friction'?{x:120,y:40}:
        lesson==='buoyancy'?{x:0,y:-54}:lesson==='pendulum'?{x:22,y:83}:{x:153,y:89};
      paintTwinkles(ctx,point.x,point.y,finale.alpha*.71,9,finale.spread);
    }
  } else {
    title(ctx,'장난감 친구들이 준비 중이에요!','조금만 기다려 주세요');
  }
  ctx.restore();
}
