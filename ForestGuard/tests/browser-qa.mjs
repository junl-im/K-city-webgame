import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const origin='http://127.0.0.1:8765/ForestGuard/';
const sizes=[
  {width:320,height:568},{width:360,height:740},{width:390,height:844},
  {width:430,height:932},{width:1365,height:768}
];
mkdirSync(new URL('../test-output/',import.meta.url),{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const reports=[];
try{
  for(const size of sizes){
    const context=await browser.newContext({viewport:size,deviceScaleFactor:1,
      isMobile:size.width<500,hasTouch:size.width<500});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin,{waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('#stage-grid button').first().waitFor({timeout:25000});
    const menu=await page.evaluate(()=>{
      const shell=document.querySelector('.shell').getBoundingClientRect();
      const start=document.querySelector('#start-btn').getBoundingClientRect();
      const stageButtons=document.querySelectorAll('#stage-grid button');
      return {scrollX:document.documentElement.scrollWidth-window.innerWidth,
        scrollY:document.documentElement.scrollHeight-window.innerHeight,
        shell:{left:shell.left,right:shell.right,top:shell.top,bottom:shell.bottom},
        start:{left:start.left,right:start.right,top:start.top,bottom:start.bottom},
        stageCount:stageButtons.length,svgCount:document.querySelectorAll('svg').length};
    });
    assert.equal(menu.stageCount,12,'All map stages must render');
    assert.equal(menu.svgCount,0,'SVG prohibited');
    assert.ok(menu.scrollX<=2&&menu.scrollY<=2,'Menu unexpectedly scrolls: '+JSON.stringify(menu));
    assert.ok(menu.start.top>=0&&menu.start.bottom<=size.height+2,'Start button clipped');
    await page.locator('#start-btn').click({timeout:20000});
    await page.locator('#game-root canvas').waitFor({timeout:25000});
    await page.waitForTimeout(420);
    const battle=await page.evaluate(()=>{
      const arena=document.querySelector('.arena-wrap').getBoundingClientRect();
      const canvas=document.querySelector('#game-root canvas').getBoundingClientRect();
      const hud=[...document.querySelectorAll('.battle-hud button')].filter(x=>!x.hidden).map(x=>{
        const r=x.getBoundingClientRect();return {id:x.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      });
      const buttons=[...document.querySelectorAll('.battle-toolbar button')].map(x=>{
        const r=x.getBoundingClientRect();return {id:x.id||x.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      });
      return {
        scrollX:document.documentElement.scrollWidth-window.innerWidth,
        scrollY:document.documentElement.scrollHeight-window.innerHeight,
        svgCount:document.querySelectorAll('svg').length,
        canvas:{left:canvas.left,right:canvas.right,top:canvas.top,bottom:canvas.bottom},
        arena:{left:arena.left,right:arena.right,top:arena.top,bottom:arena.bottom},
        hud,buttons,visibleStage:document.getElementById('wave-label').textContent
      };
    });
    assert.equal(battle.svgCount,0,'No SVG in live battle');
    assert.ok(battle.scrollX<=2&&battle.scrollY<=2,'Battle page must fit a viewport: '+JSON.stringify(battle));
    assert.ok(battle.canvas.left>=battle.arena.left-2&&battle.canvas.right<=battle.arena.right+2,'Canvas horizontal clipping');
    assert.ok(battle.canvas.top>=battle.arena.top-2&&battle.canvas.bottom<=battle.arena.bottom+2,'Canvas vertical clipping');
    for(const group of [battle.hud,battle.buttons]){
      for(let i=0;i<group.length;i++){
        const b=group[i];
        assert.ok(b.left>=-2&&b.right<=size.width+2&&b.top>=-2&&b.bottom<=size.height+2,'Control out of viewport: '+JSON.stringify(b));
        for(let j=i+1;j<group.length;j++){
          const c=group[j],w=Math.min(b.right,c.right)-Math.max(b.left,c.left),
            h=Math.min(b.bottom,c.bottom)-Math.max(b.top,c.top);
          assert.ok(w<=2||h<=2,'Touch controls overlap: '+JSON.stringify([b,c]));
        }
      }
    }
    await page.screenshot({path:new URL('../test-output/forest-'+size.width+'x'+size.height+'.png',import.meta.url).pathname});
    assert.deepEqual(errors,[],'Uncaught browser error');
    reports.push({viewport:size,menu:'PASS',battle:'PASS',hud: battle.hud.length,buttons:battle.buttons.length});
    await context.close();
  }
}finally{await browser.close();}
console.log('ForestGuard Chromium mobile viewport QA PASS');
console.log(JSON.stringify(reports,null,2));
