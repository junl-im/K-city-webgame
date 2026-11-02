/* ForestGuard v3.5 — Canvas trail + boss entrance; original assets only.
   Does not modify stage data, combat balance, saves, or button behavior. No SVG. */
(()=>{
  'use strict';
  const picker=document.getElementById('stage-select-panel');
  const content=document.querySelector('.stage-picker-content');
  const grid=document.getElementById('stage-grid');
  const pins=document.getElementById('stage-map-pins');
  if(!picker||!content||!grid||!pins)return;
  const route=document.createElement('canvas');
  route.className='stage-route-canvas';route.setAttribute('aria-hidden','true');
  content.prepend(route);
  let drawQueued=false;
  const pos=(el,bounds)=>{
    const r=el.getBoundingClientRect();
    return {x:r.left-bounds.left+r.width/2,y:r.top-bounds.top+r.height/2,
      left:r.left-bounds.left,right:r.right-bounds.left};
  };
  function paint(){
    drawQueued=false;
    if(picker.hidden||!picker.getBoundingClientRect().width)return;
    const tiles=[...grid.querySelectorAll('.stage-tile:not([hidden])')];
    const marks=[...pins.querySelectorAll('.stage-path-pin')];
    if(tiles.length!==4||marks.length!==4)return;
    const b=content.getBoundingClientRect(),width=b.width,height=b.height;
    if(width<1||height<1)return;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    route.width=Math.ceil(width*dpr);route.height=Math.ceil(height*dpr);
    const c=route.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
    const points=marks.map(el=>pos(el,b));
    const cards=tiles.map(el=>pos(el,b));
    c.lineCap='round';c.lineJoin='round';
    // A continuous curved trail joining the four illustrated chapter crests.
    const drawSpine=()=>{
      c.beginPath();c.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length;i++){
        const a=points[i-1],z=points[i],dy=z.y-a.y;
        c.bezierCurveTo(a.x+(i%2?17:-14),a.y+dy*.45,
          z.x-(i%2?21:-12),z.y-dy*.42,z.x,z.y);
      }
    };
    drawSpine();c.strokeStyle='rgba(7,29,18,.43)';c.lineWidth=6;c.stroke();
    drawSpine();c.strokeStyle='rgba(226,187,103,.42)';c.lineWidth=2.6;c.stroke();
    c.setLineDash([3,10]);drawSpine();c.strokeStyle='rgba(255,238,177,.37)';c.lineWidth=1.7;c.stroke();
    c.setLineDash([]);
    // Branches visibly tie every stage name to its point on the same forest path.
    cards.forEach((card,i)=>{
      const p=points[i],startX=card.right-8,startY=card.y,
        endX=p.x-19,endY=p.y,dx=endX-startX,selected=tiles[i].classList.contains('selected');
      c.beginPath();c.moveTo(startX,startY);
      c.bezierCurveTo(startX+dx*.44,startY,endX-dx*.2,endY,endX,endY);
      c.strokeStyle='rgba(12,30,20,.42)';c.lineWidth=selected?5:3;c.stroke();
      c.strokeStyle=selected?'rgba(255,228,152,.86)':'rgba(186,153,92,.38)';
      c.lineWidth=selected?2.2:1.15;c.stroke();
      if(selected){
        c.beginPath();c.arc(endX,endY,3,0,Math.PI*2);
        c.fillStyle='#ffe6a2';c.fill();
      }
    });
  }
  function queuePaint(){
    if(drawQueued)return;drawQueued=true;requestAnimationFrame(paint);
  }
  new MutationObserver(queuePaint).observe(pins,{childList:true,subtree:true});
  new MutationObserver(queuePaint).observe(grid,{childList:true,subtree:true});
  new MutationObserver(queuePaint).observe(picker,{attributes:true,attributeFilter:['hidden','data-chapter']});
  if('ResizeObserver' in window)new ResizeObserver(queuePaint).observe(content);
  window.addEventListener('resize',queuePaint,{passive:true});
  queuePaint();

})();
