/* 라니 수비대 v0.6 — 독자 Canvas 모션 및 PNG UI 문양 | © 2026 곰같은여우
 * Source character paintings remain the original ForestGuard PNG assets.
 * Every animation frame below is newly assembled from that character's painting.
 * No SVG, emoji glyphs or third-party character art.
 */
(function(global){
  'use strict';
  const STATES=['idle','run','attack','hurt','victory'];
  const COLORS={fox:'#ee9c56',megafox:'#f6cc6d',bear:'#d1a078',rabbit:'#b5e9ed',cat:'#f4af7b',sprout:'#9dd16a',runner:'#f38a6b',brute:'#aebc7e',boss:'#d1b58d',thorn:'#83bb66',crystal:'#a8d5e7',shroom:'#f2b371',guardian:'#b1c68a'};
  const cache=new Map();
  const ICON_SHEET='./art/rani-ui-icons-v04.webp?v=20261031g';
  const ICON_TILE={fox:0,play:1,back:2,help:3,coin:4,power:5,sword:5,skill:5,multi:5,haste:10,speed:10,ice:11,rabbit:11,wall:13,shield:13,flame:12,cat:6,crit:14,target:14,spark:6,roots:4,pierce:5,ward:13,hunter:14,evo:6,leaf:4,lock:7,star:8,pause:9,refresh:15};
  function stroke(c,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';}
  function line(c,coords){c.beginPath();c.moveTo(coords[0],coords[1]);for(let i=2;i<coords.length;i+=2)c.lineTo(coords[i],coords[i+1]);c.stroke();}
  function polygon(c,points,fill){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fillStyle=fill;c.fill();}
  function drawIcon(c,name){
    c.clearRect(0,0,56,56);c.translate(28,28);
    stroke(c,'#65422c',4);c.fillStyle='#ffe7a8';
    const key={power:'sword',haste:'speed',multi:'arrows',ice:'snow',wall:'shield',flame:'flame',rabbit:'moon',cat:'bomb',crit:'target',spark:'bolt',skill:'sword',evo:'leaf'}[name]||name;
    if(key==='sword'){
      c.rotate(-Math.PI/4);polygon(c,[[-5,-22],[0,-27],[5,-22],[4,10],[-4,10]],'#fff0c4');
      line(c,[-12,10,12,10]);stroke(c,'#8d5434',6);line(c,[0,10,0,22]);c.fillStyle='#f5c365';c.fillRect(-5,19,10,6);
    }else if(key==='shield'){
      polygon(c,[[0,-23],[19,-15],[17,6],[0,23],[-17,6],[-19,-15]],'#a3c789');
      stroke(c,'#fff1b5',3);line(c,[0,-15,0,14]);line(c,[-11,-3,11,-3]);
    }else if(key==='snow'){
      stroke(c,'#d6f9ff',5);for(let i=0;i<3;i++){c.rotate(Math.PI/3);line(c,[-19,0,19,0]);}
    }else if(key==='flame'){
      polygon(c,[[0,-26],[10,-8],[14,-20],[22,1],[15,18],[0,24],[-16,16],[-21,2],[-10,-15],[-8,1]],'#ff9d54');
      polygon(c,[[0,-10],[8,2],[7,17],[-6,16],[-9,4]],'#fff2ab');
    }else if(key==='bolt'){
      polygon(c,[[2,-26],[-15,2],[-3,2],[-10,24],[18,-8],[4,-8]],'#fff0a4');
    }else if(key==='speed'||key==='arrows'){
      const count=key==='arrows'?3:2;stroke(c,'#ffeec2',4);
      for(let i=0;i<count;i++){const y=(i-(count-1)/2)*12;line(c,[-21,y,16,y]);line(c,[6,y-7,17,y,6,y+7]);}
    }else if(key==='moon'){
      c.fillStyle='#fcf1b7';c.beginPath();c.arc(0,0,21,0,Math.PI*2);c.fill();
      c.globalCompositeOperation='destination-out';c.beginPath();c.arc(9,-8,18,0,Math.PI*2);c.fill();c.globalCompositeOperation='source-over';
    }else if(key==='bomb'){
      c.fillStyle='#6b6063';c.beginPath();c.arc(0,7,18,0,Math.PI*2);c.fill();
      stroke(c,'#ffe8a2',4);line(c,[3,-12,9,-21,18,-23]);c.fillStyle='#ffcb70';c.fillRect(-8,0,7,7);
    }else if(key==='target'){
      stroke(c,'#fff1c3',5);c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.stroke();
      c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.stroke();line(c,[-26,0,-13,0]);line(c,[13,0,26,0]);
    }else if(key==='leaf'){
      c.rotate(-.6);c.beginPath();c.ellipse(0,0,14,22,0,0,Math.PI*2);c.fillStyle='#b7da81';c.fill();stroke(c,'#fff3bd',3);line(c,[0,20,0,-19]);
    }else if(key==='pause'){
      c.fillStyle='#f7e5b7';c.fillRect(-13,-18,9,36);c.fillRect(5,-18,9,36);
    }else if(key==='play'){
      polygon(c,[[-12,-21],[21,0],[-12,21]],'#f6dfad');
    }else if(key==='back'){
      stroke(c,'#fff1c3',6);line(c,[11,-19,-9,0,11,19]);
    }else if(key==='lock'){
      stroke(c,'#efd9a5',6);c.beginPath();c.arc(0,-8,12,Math.PI,0);c.stroke();c.fillStyle='#c6a66e';c.fillRect(-17,-6,34,27);
    }else if(key==='star'){
      const points=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?10:23;points.push([Math.cos(a)*r,Math.sin(a)*r]);}polygon(c,points,'#ffe69e');
    }else{
      c.fillStyle='#f6e1a5';c.beginPath();c.arc(0,0,15,0,Math.PI*2);c.fill();
    }
  }
  function icon(name){
    if(cache.has(name))return cache.get(name);
    const canvas=document.createElement('canvas');canvas.width=56;canvas.height=56;
    drawIcon(canvas.getContext('2d'),name);
    const url=canvas.toDataURL('image/png');cache.set(name,url);return url;
  }
  function setIcon(element,name){
    if(!element)return;
    const tile=ICON_TILE[name];
    if(tile!==undefined){
      element.style.backgroundImage='url("'+ICON_SHEET+'")';
      element.style.backgroundSize='400% 400%';
      element.style.backgroundPosition=((tile%4)*100/3)+'% '+(Math.floor(tile/4)*100/3)+'%';
    }else{
      element.style.backgroundImage='url("'+icon(name)+'")';
      element.style.backgroundSize='contain';
      element.style.backgroundPosition='center';
    }
    element.style.backgroundRepeat='no-repeat';
    element.classList.add('painted-icon');element.textContent='';
    if(element.tagName!=='BUTTON')element.setAttribute('aria-hidden','true');
  }
  function portrait(element,id){
    if(!element)return;
    const index={fox:0,bear:1,rabbit:2,cat:3}[id];
    if(id==='megafox'){
      element.style.backgroundImage='url("./art/rani-evolution.png")';
      element.style.backgroundSize='400% 200%';element.style.backgroundPosition='0% 0%';
    }else if(index!==undefined){
      element.style.backgroundImage='url("./art/forest-characters.png")';
      element.style.backgroundSize='400% 200%';
      element.style.backgroundPosition=(index%4*100/3)+'% 0%';
    }else{
      element.style.backgroundImage='url("'+icon('leaf')+'")';
      element.style.backgroundSize='contain';element.style.backgroundPosition='center';
    }
    element.style.backgroundRepeat='no-repeat';element.textContent='';
    element.classList.add('portrait-icon');element.setAttribute('aria-hidden','true');
  }
  function baseTexture(id){return id==='megafox'?'evo-0':(COLORS[id]&&['sprout','runner','brute','boss','thorn','crystal','shroom','guardian'].includes(id)?'enemy-'+id:'hero-'+id);}
  function motionPaint(c,img,id,state,frame){
    const phase=frame/4*Math.PI*2;
    c.clearRect(0,0,128,128);
    const shadow=state==='run'?4:0;
    c.fillStyle='rgba(10,35,27,.18)';c.beginPath();c.ellipse(64,111,27+shadow,5,0,0,Math.PI*2);c.fill();
    let dx=0,dy=0,rot=0,sx=1,sy=1;
    if(state==='idle'){dy=Math.sin(phase)*2;sx=1+Math.sin(phase)*.015;sy=1-Math.sin(phase)*.018;}
    if(state==='run'){dx=Math.sin(phase)*4;dy=-Math.abs(Math.sin(phase))*7;rot=Math.sin(phase)*.065;}
    if(state==='attack'){dx=frame===1?-7:frame===2?10:0;rot=frame===1?-.13:frame===2?.15:0;sy=frame===1?.94:1.03;}
    if(state==='hurt'){dx=frame%2?-7:5;rot=frame%2?-.13:.10;sy=.94;}
    if(state==='victory'){dy=frame%2?-12:-4;rot=Math.sin(phase)*.08;sx=1.04;}
    c.save();c.translate(64+dx,64+dy);c.rotate(rot);c.scale(sx,sy);c.drawImage(img,-62,-62,124,124);c.restore();
    if(state==='run'){stroke(c,'rgba(255,240,190,.55)',3);line(c,[30,104,19-frame*3,103]);line(c,[95,107,103+frame*2,105]);}
    if(state==='attack'){
      c.save();c.translate(64,52);c.rotate((frame-1)*.18);
      stroke(c,id==='rabbit'?'#b7f2fc':'#ffebb0',4);
      c.beginPath();c.arc(0,0,44,-1.35,-.85);c.stroke();c.restore();
    }
    if(state==='hurt'){c.fillStyle='rgba(255,106,86,.19)';c.fillRect(0,0,128,128);}
    if(state==='victory'){c.fillStyle='#ffe0a1';for(let i=0;i<3;i++){const x=22+i*40,y=17+(i%2)*17;c.beginPath();c.arc(x,y,2+frame%2,0,Math.PI*2);c.fill();}}
  }
  function build(scene){
    const textures=scene.textures;
    for(const id of Object.keys(COLORS)){
      const key=baseTexture(id);
      if(!textures.exists(key))continue;
      const img=textures.get(key).getSourceImage();
      for(const state of STATES)for(let frame=0;frame<4;frame++){
        const k='motion-'+id+'-'+state+'-'+frame;
        if(textures.exists(k))continue;
        const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
        motionPaint(canvas.getContext('2d'),img,id,state,frame);
        textures.addCanvas(k,canvas);
      }
    }
  }
  function animate(sprite,id,defaultState,now){
    if(!sprite||!sprite.active)return;
    const current=sprite.getData('motionState');
    const state=current&&now<sprite.getData('motionUntil')?current:defaultState;
    const frame=Math.floor(now/(state==='run'?105:state==='attack'?75:state==='hurt'?85:state==='victory'?125:180))%4;
    const key='motion-'+id+'-'+state+'-'+frame;
    if(sprite.scene.textures.exists(key)&&sprite.texture.key!==key)sprite.setTexture(key);
  }
  function trigger(sprite,state,until){
    if(!sprite||!sprite.active)return;
    sprite.setData('motionState',state);sprite.setData('motionUntil',until);
  }
  global.ForestGuardVisuals={build,animate,trigger,icon,setIcon,portrait};
})(window);
