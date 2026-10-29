/** Reusable raster textures for ground, ramps and toy laboratory stages.
 * The illustrations are 2×2 equal cells: felt, ice, wood, soil.
 * Geometry and motion remain computed by the science simulations.
 */
const CELLS = Object.freeze({felt:[0,0],ice:[1,0],wood:[0,1],soil:[1,1]});

/** Choose the visible floor for the story setting, independent of its physics. */
export function stageMaterialForEverydayLesson(lesson,mode){
  if(lesson==='friction')return mode==='ice'?'ice':'felt';
  if(lesson==='pendulum')return 'felt';
  return 'wood';
}

export function surfaceTextureBounds(width,height,name){
  if(!Object.hasOwn(CELLS,name))throw new RangeError(`Unknown material: ${name}`);
  if(!(width>0&&height>0))throw new RangeError('Material image must be loaded');
  const [column,row]=CELLS[name],cellWidth=width/2,cellHeight=height/2;
  // An inner pixel avoids lines from adjacent atlas quadrants after WebP filtering.
  const margin=Math.min(2,cellWidth*.01,cellHeight*.01);
  return {sx:column*cellWidth+margin,sy:row*cellHeight+margin,
    sw:cellWidth-2*margin,sh:cellHeight-2*margin};
}

export function paintSurfaceTexture(ctx,art,name,x,y,width,height,alpha=1){
  if(!art?.complete||!art.naturalWidth||!art.naturalHeight||width<=0||height<=0)return false;
  const {sx,sy,sw,sh}=surfaceTextureBounds(art.naturalWidth,art.naturalHeight,name);
  ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
  ctx.drawImage(art,sx,sy,sw,sh,x,y,width,height);
  ctx.restore();return true;
}

/** A shelf visually anchors the moveable toys. It does not change hit positions. */
export function paintToyStage(ctx,art,{y=216,width=648,height=91,material='wood'}={}){
  const left=-width/2;
  ctx.save();ctx.fillStyle='rgba(6,22,47,.35)';ctx.beginPath();
  ctx.ellipse(0,y+height*.61,width*.53,height*.48,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=18;ctx.shadowColor='rgba(15,17,46,.54)';
  ctx.fillStyle=material==='wood'?'#a26f52':'#614a50';
  ctx.beginPath();ctx.roundRect(left,y,width,height,24);ctx.fill();ctx.shadowBlur=0;
  ctx.clip();
  paintSurfaceTexture(ctx,art,material,left,y,width,height);
  const glaze=ctx.createLinearGradient(0,y,0,y+height);
  glaze.addColorStop(0,'rgba(255,251,221,.27)');
  glaze.addColorStop(.34,'rgba(255,255,255,0)');
  glaze.addColorStop(1,'rgba(17,32,56,.42)');
  ctx.fillStyle=glaze;ctx.fillRect(left,y,width,height);
  ctx.restore();
  ctx.save();ctx.strokeStyle='rgba(255,221,159,.68)';ctx.lineWidth=5;
  ctx.beginPath();ctx.roundRect(left+2,y+2,width-4,height-4,23);ctx.stroke();ctx.restore();
}


/** A miniature wooden stand visibly joins the inclined board to the floor shelf.
 * The post starts inside the ramp's 30px lower half, preventing a visual gap.
 */
export function inclineStandGeometry({x0,y0,x1,y1},shelfTop=215){
  const centerX=(x0+x1)/2,centerY=(y0+y1)/2;
  return {centerX,centerY,postTop:centerY+14,postBottom:shelfTop+8,
    postWidth:56,footTop:shelfTop-6,footWidth:132,footHeight:22};
}

/** Use the original painted wood atlas; the new support is visual-only. */
export function paintInclineStand(ctx,art,ramp,shelfTop=215){
  const g=inclineStandGeometry(ramp,shelfTop);
  const {centerX:cx,postTop,postBottom,postWidth,footTop,footWidth,footHeight}=g;
  if(postBottom<=postTop)return false;
  ctx.save();
  ctx.fillStyle='rgba(7,22,45,.36)';
  ctx.beginPath();ctx.ellipse(cx,footTop+17,89,15,0,0,Math.PI*2);ctx.fill();
  ctx.shadowColor='rgba(8,20,40,.62)';ctx.shadowBlur=17;ctx.shadowOffsetX=5;
  ctx.fillStyle='#a16f4c';ctx.beginPath();
  ctx.roundRect(cx-postWidth/2,postTop,postWidth,postBottom-postTop,13);ctx.fill();
  ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.clip();
  paintSurfaceTexture(ctx,art,'wood',cx-postWidth/2,postTop,postWidth,postBottom-postTop,.92);
  const shine=ctx.createLinearGradient(cx-postWidth/2,0,cx+postWidth/2,0);
  shine.addColorStop(0,'rgba(255,228,164,.39)');
  shine.addColorStop(.32,'rgba(255,241,195,.11)');
  shine.addColorStop(1,'rgba(31,42,62,.40)');
  ctx.fillStyle=shine;ctx.fillRect(cx-postWidth/2,postTop,postWidth,postBottom-postTop);
  ctx.restore();
  ctx.save();ctx.lineWidth=3;ctx.strokeStyle='rgba(255,224,164,.70)';
  ctx.beginPath();ctx.roundRect(cx-postWidth/2+2,postTop,postWidth-4,postBottom-postTop,12);ctx.stroke();
  ctx.restore();
  ctx.save();ctx.shadowColor='rgba(10,20,39,.45)';ctx.shadowBlur=8;
  ctx.fillStyle='#a4744e';ctx.beginPath();
  ctx.roundRect(cx-footWidth/2,footTop,footWidth,footHeight,10);ctx.fill();
  ctx.shadowBlur=0;ctx.clip();
  paintSurfaceTexture(ctx,art,'wood',cx-footWidth/2,footTop,footWidth,footHeight,.92);
  ctx.restore();
  ctx.save();ctx.strokeStyle='rgba(255,222,155,.76)';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(cx-footWidth/2+2,footTop+2,footWidth-4,footHeight-4,8);ctx.stroke();
  ctx.restore();
  // Individually rendered fixing bolts: two fasteners on the floor foot,
  // and one steel pivot collar immediately below the inclined plank.
  ctx.save();ctx.shadowColor='rgba(16,24,45,.38)';ctx.shadowBlur=4;
  for(const x of [cx-footWidth/2+18,cx+footWidth/2-18]){
    ctx.fillStyle='#596b7a';ctx.beginPath();ctx.arc(x,footTop+footHeight/2,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f3dbad';ctx.beginPath();ctx.arc(x-1.2,footTop+footHeight/2-1.2,2.7,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#b1a0a3';ctx.beginPath();ctx.roundRect(cx-31,postTop-2,62,17,6);ctx.fill();
  ctx.fillStyle='#fff0c2';ctx.fillRect(cx-20,postTop+1,40,3);
  ctx.restore();
  return true;
}

/** A wooden science-rack frame anchors the pendulum's pivot to the same
 * picture-book shelf as the other experiments. Only the drawing is affected.
 * The pivot coordinates come from the existing pendulum simulation. */
export function paintPendulumMount(ctx,art,pivotX=-18,pivotY=-176,shelfTop=215){
  const uprightX=-218, beamTop=pivotY-49;
  const left=uprightX-19, uprightWidth=38;
  ctx.save();
  ctx.fillStyle='rgba(7,20,44,.32)';
  ctx.beginPath();ctx.ellipse(uprightX,shelfTop+18,90,16,0,0,Math.PI*2);ctx.fill();
  ctx.shadowColor='rgba(5,20,41,.55)';ctx.shadowBlur=16;
  ctx.fillStyle='#976647';ctx.beginPath();
  ctx.roundRect(left,beamTop, uprightWidth,shelfTop+5-beamTop,13);ctx.fill();
  ctx.shadowBlur=0;ctx.clip();
  paintSurfaceTexture(ctx,art,'wood',left,beamTop,uprightWidth,shelfTop+5-beamTop,.88);
  ctx.fillStyle='rgba(24,35,57,.20)';ctx.fillRect(uprightX+6,beamTop,12,shelfTop+5-beamTop);
  ctx.restore();

  // The overhead beam visibly touches the pivot; the hanging string starts at its pin.
  const beamLeft=uprightX-6, beamRight=pivotX+13;
  ctx.save();ctx.shadowColor='rgba(8,20,41,.52)';ctx.shadowBlur=12;
  ctx.fillStyle='#ba8754';ctx.beginPath();
  ctx.roundRect(beamLeft,beamTop,beamRight-beamLeft,33,9);ctx.fill();
  ctx.shadowBlur=0;ctx.clip();
  paintSurfaceTexture(ctx,art,'wood',beamLeft,beamTop,beamRight-beamLeft,33,.9);
  const beamShine=ctx.createLinearGradient(0,beamTop,0,beamTop+33);
  beamShine.addColorStop(0,'rgba(255,239,177,.43)');
  beamShine.addColorStop(.48,'rgba(255,239,177,0)');
  beamShine.addColorStop(1,'rgba(53,42,59,.4)');
  ctx.fillStyle=beamShine;ctx.fillRect(beamLeft,beamTop,beamRight-beamLeft,33);
  ctx.restore();

  const footTop=shelfTop-15;
  ctx.save();ctx.fillStyle='#ad7953';ctx.beginPath();
  ctx.roundRect(uprightX-75,footTop,150,26,9);ctx.fill();ctx.clip();
  paintSurfaceTexture(ctx,art,'wood',uprightX-75,footTop,150,26,.94);
  ctx.restore();

  // Metal pin and paired rivets provide an identifiable apparatus joint.
  ctx.save();ctx.shadowColor='rgba(24,19,40,.35)';ctx.shadowBlur=5;
  for(const x of [uprightX-49,uprightX+49]){
    ctx.beginPath();ctx.fillStyle='#5d5f74';ctx.arc(x,footTop+13,7.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.fillStyle='#fbe0a2';ctx.arc(x-1.5,footTop+11.5,3.4,0,Math.PI*2);ctx.fill();
  }
  ctx.beginPath();ctx.fillStyle='#966e50';ctx.arc(pivotX,pivotY,24,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.fillStyle='#ffe3a5';ctx.arc(pivotX,pivotY,15,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.fillStyle='#6787a4';ctx.arc(pivotX,pivotY,8,0,Math.PI*2);ctx.fill();
  ctx.restore();return true;
}

/** Draw a textured ramp while retaining the physical line's exact angle. */
export function paintInclineMaterial(ctx,art,{x0,y0,x1,y1,material}){
  const length=Math.hypot(x1-x0,y1-y0);
  if(length<1)return;
  const angle=Math.atan2(y1-y0,x1-x0);
  ctx.save();ctx.translate((x0+x1)/2,(y0+y1)/2);ctx.rotate(angle);
  ctx.shadowColor='rgba(9,24,49,.67)';ctx.shadowBlur=21;ctx.shadowOffsetY=12;
  ctx.fillStyle=material==='ice'?'#7ac8e9':'#c9899c';
  ctx.beginPath();ctx.roundRect(-length/2,-30,length,60,18);ctx.fill();
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.clip();paintSurfaceTexture(ctx,art,material,-length/2,-30,length,60);
  const overlay=ctx.createLinearGradient(0,-30,0,30);
  overlay.addColorStop(0,'rgba(255,255,255,.40)');
  overlay.addColorStop(.37,'rgba(255,255,255,0)');
  overlay.addColorStop(1,material==='ice'?'rgba(12,115,184,.43)':'rgba(137,47,94,.37)');
  ctx.fillStyle=overlay;ctx.fillRect(-length/2,-30,length,60);ctx.restore();
  ctx.save();ctx.translate((x0+x1)/2,(y0+y1)/2);ctx.rotate(angle);
  ctx.strokeStyle=material==='ice'?'#d8fcff':'#ffe2c6';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(-length/2+18,-28);ctx.lineTo(length/2-18,-28);ctx.stroke();
  ctx.restore();
}
