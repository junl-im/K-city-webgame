/** Light-weight deterministic visual cues. None of these alter the physics. */
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function landingCue(secondsSinceLanding){
  if(!Number.isFinite(secondsSinceLanding)||secondsSinceLanding<0||secondsSinceLanding>.74){
    return {alpha:0,radius:0,scale:1};
  }
  const p=secondsSinceLanding/.74;
  return {alpha:Math.pow(1-p,1.6),radius:14+p*57,scale:1-.085*Math.sin(p*Math.PI)};
}

/** Contact shadow for a falling toy over a flat local patch of soil.
 * clearanceFraction: 1 at release height, 0 at landing. Purely visual.
 * A feather makes a softer, wider footprint than a dense metal ball.
 */
export function groundShadowCue(clearanceFraction,kind='ball'){
  const clearance=clamp(Number.isFinite(clearanceFraction)?clearanceFraction:1,0,1);
  const close=1-clearance;
  const feather=kind==='feather';
  return {
    opacity:(feather?.19:.27)*(.12+.88*Math.pow(close,1.7)),
    widthFactor:(feather?.33:.23)+clearance*(feather?.24:.20),
    heightFactor:(feather?.056:.062)+clearance*.026
  };
}

/** Equal sound speed: screen wavefront spacing is proportional to wavelength, capped for mobile. */
export function wavefrontSpacing(wavelengthMeters){
  if(!Number.isFinite(wavelengthMeters)||wavelengthMeters<=0)return 24;
  return clamp(43*wavelengthMeters,24,86);
}

/** Fractions of the isolated magnet sprite; wood remains exactly still. */
export function magnetBallPosition(progress,attracts,visualPull,distanceCm=2){
  const travel=attracts?clamp(progress,0,1)*clamp(visualPull,0,1):0;
  const startX=.80+.03*(clamp(distanceCm,1,5)-2);
  return {x:startX-.27*travel,y:.40+.04*travel,travel};
}

/** Visible tip of the fulcrum WebP starts about 20% below its transparent top. */
export function leverFulcrumSpriteTop(beamY,spriteSize){
  return beamY-spriteSize*.22;
}

/** 2D pulley screen-space travel: the handle goes down as the load rises. */
export function pulleySceneMotion(progress,pulleyType){
  const p=clamp(Number.isFinite(progress)?progress:0,0,1);
  const loadTravel=.11*p;
  return {
    loadY:.70-loadTravel,
    handleY:pulleyType==='moving'?.54+loadTravel*2:.59+loadTravel
  };
}

export function orbitalTrailCount(fraction,maximum=15){
  return Math.round(clamp(fraction,0,1)*clamp(maximum,0,24));
}

/** Keep planet sprites smaller than the innermost circular orbit on narrow screens. */
export function orbitToySizes(viewWidth,viewHeight,orbitUnit){
  return {
    sun:Math.min(90,viewWidth*.16,viewHeight*.25,orbitUnit*.68),
    explorer:Math.min(48,viewWidth*.11,viewHeight*.18,orbitUnit*.4)
  };
}

/** A lit bulb is an overlay on the OFF artwork, never a permanently luminous sprite. */
export function litBulbOpacity(brightness,closed){
  return closed&&brightness>0?clamp(.12+.88*Math.sqrt(brightness),0,1):0;
}

export function celebrationCue(progress){
  const p=clamp(Number.isFinite(progress)?progress:0,0,1);
  return {alpha:clamp((p-.76)/.18,0,1),spread:42+90*Math.pow(p,2)};
}

export function paintTwinkles(ctx,x,y,alpha=1,count=8,spread=42){
  if(alpha<=0)return;
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<count;i++){
    const a=i*2.39996-.7,r=spread*(.45+((i*17)%11)/17);
    const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.68;
    const size=2.5+i%3*1.7;
    ctx.globalAlpha=alpha*(.54+(i%3)*.15);
    ctx.strokeStyle=i%2?'#d6fff6':'#ffe29c';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(px-size,py);ctx.lineTo(px+size,py);
    ctx.moveTo(px,py-size);ctx.lineTo(px,py+size);ctx.stroke();
  }
  ctx.restore();
}
