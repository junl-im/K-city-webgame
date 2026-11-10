// Chromium mobile viewport *simulation*, not a physical Android device benchmark.
// Reuse one tab for multiple battles, including teardown/re-entry, so lingering
// scene textures and JavaScript allocations are easier to spot.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:[
  '--disable-dev-shm-usage','--disable-webgl','--enable-precise-memory-info'
]});
const reports=[];
try{
  const context=await browser.newContext({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  await page.goto('http://127.0.0.1:8765/ForestGuard/?fgqa=1',
    {waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('#start-btn').waitFor({state:'visible'});
  const cdp=await context.newCDPSession(page);
  for(let session=0;session<4;session++){
    // Programmatic click avoids a previous wave's temporary modal scrim.
    await page.evaluate(()=>document.querySelector('#start-btn').click());
    await page.locator('#game-root canvas').waitFor({state:'attached',timeout:30000});
    await page.waitForTimeout(22000);
    await cdp.send('HeapProfiler.collectGarbage');
    const snapshot=await page.evaluate(()=>window.__ForestGuardQA?.performanceSnapshot());
    assert.ok(snapshot,'Combat performance snapshot missing');
    assert.ok(snapshot.textures>50&&snapshot.textures<750,
      'Unexpected texture count '+JSON.stringify(snapshot));
    assert.ok(snapshot.effects<=26&&snapshot.dyingSprites<=12&&snapshot.arrivals<=4,
      'Bounded particle/death effects exceeded: '+JSON.stringify(snapshot));
    assert.ok(snapshot.enemies<160&&snapshot.projectiles<100,
      'Unexpected entity accumulation: '+JSON.stringify(snapshot));
    reports.push(snapshot);
    assert.equal(failures.length,0,'Browser runtime errors: '+failures.join('; '));
    await page.evaluate(()=>document.querySelector('#home-btn').click());
    await page.locator('#menu').waitFor({state:'visible',timeout:10000});
  }
  // Scene texture counts remain stable across destruction/recreation;
  // allow a little variation in GC-controlled heap but flag gross leaks.
  const textureCounts=reports.map(report=>report.textures);
  assert.ok(Math.max(...textureCounts)-Math.min(...textureCounts)<=5,
    'Scene textures accumulate across battles: '+JSON.stringify(textureCounts));
  const heaps=reports.map(report=>report.usedJSHeap);
  if(heaps.every(Number.isFinite)){
    assert.ok(heaps.at(-1)-heaps[0]<35*1024*1024,
      'Potential heap growth after four battles: '+JSON.stringify(heaps));
  }
  console.log(JSON.stringify({kind:'mobile-chromium-soak',durationSeconds:88,
    device:'Chromium 390x844 mobile emulation, not Android hardware',
    sessions:reports},null,2));
  await context.close();
}finally{
  await browser.close();
}
