/**
 * Dependency-free Chrome DevTools Protocol smoke check for responsive game UI.
 * Uses installed Chrome on ubuntu-latest, never downloads a browser nor stores artifacts.
 * Exercises the built HTML/CSS for responsive geometry in offline Chrome.
 * Actual PixiJS/gameplay and image pixel rendering require separate device QA.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, extname, resolve} from 'node:path';

const dist=resolve('dist');
assert.ok(existsSync(join(dist,'index.html')),'Build dist first');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.json':'application/json','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url||'/', 'http://localhost');
    const path=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const target=resolve(dist,path);
    if(!target.startsWith(dist+'/')) {res.writeHead(403);res.end();return;}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const run=async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  const url='http://127.0.0.1:'+address.port+'/';
  const executable=[process.env.GARDEN_CHROME,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
  assert.ok(executable,'Chrome/Chromium required for browser UI smoke test');
  const profile=await mkdtemp(join(tmpdir(),'garden-ui-chrome-'));
  const chrome=spawn(executable,[
    '--headless=new','--no-sandbox','--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader','--use-angle=swiftshader',
    '--remote-debugging-port=0','--no-first-run','--no-default-browser-check',
    '--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
  let socket;
  try{
    let port=0;
    for(let attempt=0;attempt<100;attempt++){
      try {port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(port)break;} catch {}
      if(chrome.exitCode!==null)throw Error('Chrome stopped during launch');
      await sleep(100);
    }
    assert.ok(port,'Chrome DevTools did not open');
    const targets=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
    assert.ok(targets[0]?.webSocketDebuggerUrl,'No Chrome page target');
    socket=new WebSocket(targets[0].webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    let number=0;const pending=new Map();
    socket.addEventListener('message',event=>{
      const message=JSON.parse(event.data);
      if(message.id&&pending.has(message.id)){
        const {resolve,reject,timeout}=pending.get(message.id);clearTimeout(timeout);pending.delete(message.id);
        if(message.error)reject(new Error(message.error.message));else resolve(message.result);
      }
    });
    const call=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++number;
      const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('Timed out: '+method));},12000);
      pending.set(id,{resolve,reject,timeout});
      socket.send(JSON.stringify({id,method,params}));
    });
    const evalJS=async expression=>{
      const out=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(out.exceptionDetails)throw Error('Browser JS error: '+out.exceptionDetails.text);
      return out.result.value;
    };
    await call('Page.enable');
    await call('Runtime.enable');
    // Restricted CI browsers can deny localhost/file:// navigation altogether.
    // Inject the ACTUAL Vite-generated DOM and CSS directly into about:blank,
    // keeping font, media query and real control geometry checks deterministic.
    const builtHTML=await readFile(join(dist,'index.html'),'utf8');
    const body=builtHTML.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i)?.[1];
    const stylesheet=builtHTML.match(/href="(\\.?\\/assets\\/[^"]+\\.css)"/)?.[1];
    assert.ok(body && stylesheet,'Built HTML or stylesheet not present');
    const builtCSS=await readFile(join(dist,stylesheet.replace(/^\\.?\\//,'')),'utf8');
    const injected=await evalJS('(()=>{document.body.innerHTML='+JSON.stringify(body)+';const s=document.createElement("style");s.textContent='+JSON.stringify(builtCSS)+';document.head.appendChild(s);return true;})()');
    assert.equal(injected,true,'Could not inject built HTML/CSS');
    assert.ok(await evalJS("Boolean(document.querySelector('#app') && document.querySelector('#town-button'))"),'Built game HTML shell not loaded');
    const booted=false; // Deliberate: scripts are not executed by offline HTML injection.
    console.log('Checking real Vite-built HTML/CSS in offline Chromium. Gameplay and painted pixel rendering are not verified.');
    const screens=[[320,568],[390,844],[667,375],[1280,800]];
    for(const [width,height] of screens){
      await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<761});
      await sleep(175);
      const report=await evalJS(`(()=>{ 
        const selectors=['#town-button','#farm-button','#lab-button','#nursery-button','#bag-button','#map-button','#book-button','#help-button','#creek-visit-button'];
        const bounds=selectors.map(selector=>{const el=document.querySelector(selector);if(!el||el.hidden)return null;const r=el.getBoundingClientRect();return {selector,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}).filter(Boolean);
        const out=bounds.filter(b=>b.x< -1||b.y< -1||b.right>innerWidth+1||b.bottom>innerHeight+1||b.width<37||b.height<37);
        const panel=getComputedStyle(document.querySelector('#town-button')).borderImageSource;
        const art=getComputedStyle(document.querySelector('#town-button .art-icon')).backgroundImage;
        return {screen:innerWidth+'x'+innerHeight,errors:out,buttonCount:bounds.length,paintedFrame:panel.includes('ui-button'),paintedIcon:art.includes('ui-icons'),scrollX:document.documentElement.scrollWidth-innerWidth};
      })()`);
      console.log('UI '+report.screen+': '+report.buttonCount+' painted controls, overflow '+report.scrollX+'px');
      assert.deepEqual(report.errors,[],'Controls overflow or shrink on '+report.screen+': '+JSON.stringify(report.errors));
      assert.ok(report.paintedFrame&&report.paintedIcon,'Painted button/icon missing on '+report.screen);
      assert.ok(report.scrollX<=2,'Horizontal document overflow '+report.scrollX+' at '+report.screen);
    }
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    if(booted){await evalJS("document.querySelector('#bag-button').click(); true");await sleep(180);}
    // If the GPU-less runner prevents PixiJS startup, test the actual modal
    // structure/CSS using a disposable markup fixture, never fake gameplay.
    const bag=await evalJS(`(()=>{
      const root=document.querySelector('#modal-root');
      const pane=document.querySelector('.modal');
      let fixture=false;
      if(root?.classList.contains('hidden')){
        fixture=true;root.classList.remove('hidden');
        document.querySelector('#modal-title').textContent='나의 가방';
        document.querySelector('#modal-content').innerHTML='<p class="garden-intro">소중한 정원 재료</p><div class="garden-tabs"><button class="garden-tab current">전체</button><button class="garden-tab">작물</button><button class="garden-tab">마법</button><button class="garden-tab">친구</button></div><div class="garden-bag"><div class="garden-slots"><button class="garden-slot"><span class="art-icon" data-art="berry"></span><strong>열매</strong></button><button class="garden-slot"><span class="art-icon" data-art="potion"></span><strong>정수</strong></button></div><section class="garden-detail"><h3>달콤한 열매</h3><p>마법 조합에 쓰는 열매</p></section></div>';
      }
      const r=pane.getBoundingClientRect();
      return {open:!root.classList.contains('hidden'),fixture,x:r.x,right:r.right,y:r.y,bottom:r.bottom};
    })()`);
    assert.ok(bag.open,'Inventory artwork/modal DOM not visible');
    assert.ok(bag.x>=-1&&bag.right<=391&&bag.y>=-1&&bag.bottom<=845,'Inventory popup out of phone viewport: '+JSON.stringify(bag));
    console.log('Inventory parchment CSS fit: OK (offline game DOM plus test inventory markup)');
    console.log('Offline Chromium responsive layout smoke: 4 viewport sizes + modal passed');
  } finally {
    try{socket?.close();}catch{}
    chrome.kill('SIGTERM');
    await new Promise(resolve=>{if(chrome.exitCode!==null)resolve();else {chrome.once('exit',resolve);setTimeout(resolve,2000);}});
    try{await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:100});}catch{}
  }
};
try {await run();} finally {await new Promise(resolve=>server.close(resolve));}
