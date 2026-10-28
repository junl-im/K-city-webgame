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
