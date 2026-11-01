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
    await page.goto(origin+'?fgqa=1',{waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('#stage-grid button').first().waitFor({state:'attached',timeout:25000});
    const menuOrder=await page.evaluate(()=>{
      const actions=document.querySelector('.menu-actions').getBoundingClientRect();
      const story=document.querySelector('.story-panel').getBoundingClientRect();
      const title=document.querySelector('.brand').getBoundingClientRect();
      const hero=document.querySelector('.title-hero-art').getBoundingClientRect();
      return {actionsTop:actions.top,actionsBottom:actions.bottom,storyTop:story.top,titleBottom:title.bottom,
        heroHeight:hero.height,utilityButtons:document.querySelectorAll('.home-utility-btn').length,
        illustrated:!!document.querySelector('.title-hero-art')};
    });
    assert.equal(menuOrder.illustrated,true,'Illustrated title must be present');
    await page.locator('.title-hero-art').evaluate(async img=>{
      if(!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
      if(!img.naturalWidth)throw new Error('Title original art unavailable');
    });
    assert.ok(menuOrder.actionsTop>=menuOrder.titleBottom-2,'Buttons must not overlap the title');
    assert.ok(menuOrder.utilityButtons===2&&menuOrder.heroHeight>=145,
      'Home title art and top utility buttons must be clearly visible');
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
    const homeArt=await page.evaluate(()=>{
      const art=document.querySelector('.title-hero-art');
      const hero=art.getBoundingClientRect();
      const main=document.querySelector('.menu-actions-top').getBoundingClientRect();
      return {heroHeight:hero.height,heroBottom:hero.bottom,mainTop:main.top,
        artLoaded:art.complete&&art.naturalWidth>0,
        help:!document.getElementById('help-btn').hidden,
        intel:!document.getElementById('intel-btn').hidden};
    });
    assert.ok(homeArt.artLoaded&&homeArt.heroHeight>=145,
      'The actual home must prominently display the illustration, not a flat placeholder');
    assert.ok(homeArt.mainTop>=homeArt.heroBottom-2&&homeArt.help&&homeArt.intel,
      'Start action and home utility actions must remain reachable');
    const homeFlow=await page.evaluate(()=>{
      const start=document.getElementById('start-btn').getBoundingClientRect();
      const spot=document.querySelector('.home-stage-spot').getBoundingClientRect();
      const label=document.getElementById('home-stage-title').getBoundingClientRect();
      const stage=document.getElementById('stage-list-btn').getBoundingClientRect();
      const footer=document.querySelector('.menu-bottom').getBoundingClientRect();
      const title=document.querySelector('.title-hero-art');
      return {startBottom:start.bottom,stageTop:spot.top,cardHeight:spot.height,
        labelCenter:(label.top+label.bottom)/2,stageCenter:(stage.top+stage.bottom)/2,
        footerBottom:footer.bottom,mask:getComputedStyle(title).maskImage,
        artSrc:title.currentSrc};
    });
    assert.ok(homeFlow.stageTop-homeFlow.startBottom>=-2&&
      homeFlow.stageTop-homeFlow.startBottom<=50,
      'Home quest and start action must form one compact composition: '+JSON.stringify(homeFlow));
    assert.ok(homeFlow.cardHeight<=140&&
      Math.abs(homeFlow.stageCenter-homeFlow.labelCenter)<=66,
      'Stage info and stage-select action drift apart: '+JSON.stringify(homeFlow));
    assert.ok(homeFlow.footerBottom<=size.height+2&&
      homeFlow.mask==='none'&&homeFlow.artSrc.includes('rani-title-v31.webp'),
      'Transparent hand-painted title and footer must fit without clipping');
    await page.screenshot({path:new URL('../test-output/home-'+size.width+'x'+size.height+'.png',import.meta.url).pathname});
    // Explicitly navigate the dedicated stage picker, no more scattered empty waypoint boxes.
    await page.locator('#stage-list-btn').click({timeout:20000});
    assert.equal(await page.locator('#stage-select-panel').isVisible(),true,'Stage selection opens as a real screen');
    await page.locator('#stage-grid button').first().waitFor({state:'visible'});
    assert.equal(await page.locator('#stage-map-pins .stage-path-pin').count(),4,
      'Each chapter must show exactly four illustrated route markers');
    assert.equal(await page.locator('#stage-map-pins button:not([disabled])').count(),1,
      'Only the first waypoint should be unlocked on fresh save');
    assert.equal(await page.locator('#stage-grid .stage-tile:visible').count(),4,
      'Chapter view must show four illustrated stages, not twelve plain text rows');
    assert.equal(await page.locator('#stage-grid .stage-tile-art:visible').count(),4);
    await page.locator('#stage-chapter-tabs [data-chapter="1"]').click();
    assert.equal(await page.locator('#stage-grid .stage-tile:visible').count(),4);
    assert.equal(await page.locator('#stage-chapter-tabs [data-chapter="1"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#stage-map-number').innerText(),'제2장');
    const chapterTwoArt=await page.locator('#stage-select-panel').evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.ok(chapterTwoArt.includes('misty-canyon-v08.png'),'Chapter 2 must have independent canyon art');
    assert.equal(await page.locator('#stage-map-pins button:not([disabled])').count(),0,
      'Future chapter map must not unlock stages prematurely');
    await page.locator('#stage-chapter-tabs [data-chapter="2"]').click();
    assert.equal(await page.locator('#stage-map-number').innerText(),'제3장');
    const chapterThreeArt=await page.locator('#stage-select-panel').evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.ok(chapterThreeArt.includes('moonlit-highland-v08.png'),'Chapter 3 must use moonlit art');
    await page.locator('#stage-chapter-tabs [data-chapter="0"]').click();
    assert.equal(await page.locator('#stage-map-number').innerText(),'제1장');
    const picked=await page.evaluate(()=>{
      const p=document.querySelector('#stage-select-panel').getBoundingClientRect();
      const list=document.querySelector('#stage-grid').getBoundingClientRect();
      const enter=document.querySelector('#stage-enter-btn').getBoundingClientRect();
      return {panel:p.width,listLeft:list.left,listRight:list.right,enterRight:enter.right,
        scrollX:document.documentElement.scrollWidth-innerWidth,scrollY:document.documentElement.scrollHeight-innerHeight};
    });
    assert.ok(picked.scrollX<=2&&picked.scrollY<=2,'Stage picker overflow');
    assert.ok(picked.enterRight<=size.width+2,'Stage entry clipped');
    const continuous=await page.evaluate(()=>{
      const s=selector=>getComputedStyle(document.querySelector(selector));
      return {list:parseFloat(s('#stage-grid').borderLeftWidth),
        map:parseFloat(s('.stage-map-preview').borderLeftWidth),
        footer:parseFloat(s('.stage-choice-footer').borderTopWidth),
        world:s('.stage-select-panel').backgroundImage.includes('forest-worldmap-v05.webp'),
        pickerColor:s('.stage-select-panel').backgroundColor,
        innerBackground:s('.stage-map-preview').backgroundImage};
    });
    assert.ok(continuous.world&&continuous.list===0&&continuous.map===0&&continuous.footer===0,
      'One painted map without vertical/horizontal dividing frames');
    assert.equal(continuous.innerBackground,'none','No second landscape in stage map section');
    assert.equal(continuous.pickerColor,'rgb(7, 27, 22)',
      'Stage picker must have an opaque painted base, never reveal title or home buttons');
    await page.screenshot({path:new URL('../test-output/stage-picker-'+size.width+'x'+size.height+'.png',import.meta.url).pathname});
    await page.locator('#stage-back-btn').click();
    assert.equal(await page.locator('#stage-select-panel').isHidden(),true,'Stage picker closes to home');
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
        backdrop:getComputedStyle(document.getElementById('arena-wrap')).backgroundImage,
        hud,buttons,visibleStage:document.getElementById('wave-label').textContent
      };
    });
    const paintedControls=await page.evaluate(()=>
      ['home-btn','pause-btn'].map(id=>getComputedStyle(document.getElementById(id)).backgroundImage));
    assert.ok(paintedControls.every(bg=>bg.includes('rani-ui-icons-v04.webp')),
      'Home and pause must show actual hand-painted decals, not blank gradients');
    assert.equal(battle.svgCount,0,'No SVG in live battle');
    assert.equal(battle.backdrop,'none','Phaser battlefield must not have duplicate wallpaper');
    assert.ok(battle.scrollX<=2&&battle.scrollY<=2,'Battle page must fit a viewport: '+JSON.stringify(battle));
    assert.ok(battle.canvas.left>=battle.arena.left-2&&battle.canvas.right<=battle.arena.right+2,'Canvas horizontal clipping');
    assert.ok(Math.abs(battle.canvas.left-battle.arena.left)<=2&&Math.abs(battle.canvas.right-battle.arena.right)<=2,
      'Battle must fill both sides without gutters: '+JSON.stringify(battle));
    assert.ok(Math.abs(battle.canvas.top-battle.arena.top)<=2&&Math.abs(battle.canvas.bottom-battle.arena.bottom)<=2,
      'Battle canvas must fill arena height: '+JSON.stringify(battle));
    const fortHud=await page.evaluate(()=>{
      const strip=document.querySelector('.fort-status-row').getBoundingClientRect();
      const arena=document.getElementById('arena-wrap').getBoundingClientRect();
      const hp=document.getElementById('fort-health').getBoundingClientRect();
      return {stripTop:strip.top,stripBottom:strip.bottom,arenaBottom:arena.bottom,hpWidth:hp.width};
    });
    assert.ok(Math.abs(fortHud.stripTop-fortHud.arenaBottom)<=2,'Fort HP must be outside and below battlefield');
    assert.ok(fortHud.hpWidth>100,'Fort HP bar must be readable, not visually hidden');
    const roster=await page.evaluate(()=>window.__ForestGuardQA.rosterInfo());
    assert.deepEqual(roster.ids,[null,null,'fox',null,null],'Five-seat formation must open with central fox only');
    assert.deepEqual(roster.positions,[58,134,210,286,362]);
    assert.equal(await page.locator('.hero-slot').count(),5,'Five usable slots must fit in the battle toolbar');
    const edges=await page.locator('.hero-slot').evaluateAll(nodes=>nodes.map(node=>{
      const p=node.getBoundingClientRect();return {x:p.x,right:p.right,width:p.width,top:p.top,bottom:p.bottom};
    }));
    assert.ok(edges.every(x=>x.width>=28&&x.x>=-2&&x.right<=size.width+2),
      'Five portraits must not clip off-screen');
    assert.ok(edges.every(x=>Math.abs(x.top-edges[0].top)<=2&&x.bottom<=size.height+2),
      'Five heroes must sit on ONE visible toolbar row, never wrap to a second row');
    const layers=await page.evaluate(()=>window.__ForestGuardQA?.renderInfo());
    assert.ok(layers&&layers.artLoaded,'New independent wall artwork must load');
    assert.equal(layers.frontTexture,'painted-rampart-front','Original painted wall foreground must render');
    assert.ok(layers.frontDepth>layers.heroDepth&&layers.frontY>layers.heroY,
      'Hero bodies should stand behind the illustrated wall');
    assert.ok(layers.heroY<=575&&layers.heroHeight>=90,'Hero should stand above battlements');
    assert.equal(layers.fieldCount,1,'Exactly one stage background must render');
    if(size.width===390){
      await page.waitForFunction(()=>window.__ForestGuardQA.damageFeedback()!==null,null,{timeout:12000});
      const damageNow=await page.evaluate(()=>window.__ForestGuardQA.damageFeedback());
      assert.ok(damageNow.ordinaryBarHidden,'Ordinary mobs must not show an HP bar');
      assert.ok(damageNow.floatCount>0,'Real hits must create readable floating damage numbers');
      await page.screenshot({path:new URL('../test-output/damage-feedback-390.png',import.meta.url).pathname});
      const ranges=await page.evaluate(()=>window.__ForestGuardQA.heroRanges());
      assert.deepEqual(ranges,{fox:535,megafox:690,bear:345,rabbit:605,cat:470});
      assert.equal(await page.evaluate(()=>window.__ForestGuardQA.showEliteIntro('shroom')),true);
      await page.waitForTimeout(1100);
      const visible=await page.evaluate(()=>window.__ForestGuardQA.eliteInfo());
      assert.ok(visible&&visible.alpha>.94&&visible.labelAlpha>.94,
        'Elite announcement must remain legible after 1.1 seconds');
      await page.screenshot({path:new URL('../test-output/elite-intro-held-390.png',import.meta.url).pathname});
      await page.waitForTimeout(2200);
      assert.equal(await page.evaluate(()=>window.__ForestGuardQA.eliteInfo()),null,
        'Elite announcement should clear naturally after 2.7 seconds');
    }
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
    if(size.width===390){
      // A real first-wave combat smoke: fast-forward, verify the free recruit, reopen it from the empty perch.
      await page.locator('#speed-btn').click();
      await page.waitForFunction(()=>{
        const modal=document.querySelector('#modal-layer');
        return !modal.hidden && modal.querySelectorAll('.recruit-card').length===3;
      },null,{timeout:50000});
      assert.equal(await page.locator('.recruit-card').count(),3,'Three distinct first companions');
      await page.locator('#modal-close').click();
      assert.equal(await page.locator('#modal-layer').isHidden(),true,'Recruit can be deferred');
      await page.locator('.hero-slot.empty').first().click();
      assert.equal(await page.locator('.recruit-card').count(),3,'Empty pedestal reopens recruitment');
      await page.locator('.recruit-rabbit').click();
      assert.equal(await page.locator('.hero-slot:not(.empty)').count(),2,'Recruit joins the defense');
      assert.equal(await page.locator('.hero-slot.empty').count(),3,'Three future reinforcement slots remain');
      await page.screenshot({path:new URL('../test-output/forest-recruited-rabbit.png',import.meta.url).pathname});
      // Restart once and verify real-time expiry without touching any companion card.
      await page.locator('#home-btn').click();
      await page.locator('#start-btn').click();
      await page.locator('#game-root canvas').waitFor();
      await page.locator('#speed-btn').click();
      await page.waitForFunction(()=>{
        const modal=document.getElementById('modal-layer');
        return !modal.hidden&&document.querySelectorAll('.recruit-card').length===3;
      },null,{timeout:50000});
      const initialCountdown=await page.locator('#recruit-countdown').textContent();
      assert.match(initialCountdown,/남은 시간/);
      await page.waitForFunction(()=>{
        const alive=document.querySelectorAll('.hero-slot:not(.empty)');
        return alive.length===2&&document.getElementById('modal-layer').hidden;
      },null,{timeout:20000});
      assert.equal(await page.locator('.hero-slot:not(.empty)').count(),2,'Timed choice should add a hero');
      assert.match((await page.locator('.hero-slot:not(.empty)').allTextContents()).join(' '),/곰 수호자/,'Stage 1 fallback should be bear');
      await page.screenshot({path:new URL('../test-output/forest-auto-recruit-bear.png',import.meta.url).pathname});
    }
    // The boss HUD uses the same DOM as combat; test a visible long-name state at each viewport.
    const bossLayout=await page.evaluate(()=>{
      const boss=document.getElementById('boss-hud');
      const arena=document.getElementById('arena-wrap');
      boss.hidden=false;
      arena.classList.add('has-boss');
      document.getElementById('boss-title').textContent='거대한 숲의 수호자';
      const r=boss.getBoundingClientRect();
      boss.hidden=true;
      arena.classList.remove('has-boss');
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    });
    assert.ok(bossLayout.left>=-2&&bossLayout.right<=size.width+2,'Boss HUD must fit mobile viewport');
    assert.ok(bossLayout.top>=-2&&bossLayout.bottom<=size.height+2,'Boss HUD vertical clipping');
    await page.screenshot({path:new URL('../test-output/forest-'+size.width+'x'+size.height+'.png',import.meta.url).pathname});
    assert.deepEqual(errors,[],'Uncaught browser error');
    reports.push({viewport:size,menu:'PASS',battle:'PASS',hud: battle.hud.length,buttons:battle.buttons.length});
    await context.close();
  }
  // Render the ACTUAL full results screen in Chromium, not a simulated static preview.
  for(const size of [{width:320,height:568},{width:390,height:844}]){
    const context=await browser.newContext({viewport:size,deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(origin+'?fgqa=1',{waitUntil:'domcontentloaded'});
    await page.locator('#start-btn').click();
    await page.locator('#game-root canvas').waitFor({timeout:25000});
    await page.waitForFunction(()=>typeof window.__ForestGuardQA?.finish==='function'&&
      document.getElementById('wave-label').textContent.includes(' / '));
    await page.evaluate(()=>window.__ForestGuardQA.finish(true));
    await page.locator('#modal-box.result-dialog.result-win').waitFor();
    assert.equal(await page.locator('.result-star.earned').count(),3,'Full HP victory earns three stars');
    assert.equal(await page.locator('.result-stat').count(),3,'Show real currency, HP and squad metrics');
    assert.equal(await page.locator('#modal-actions button').count(),2,'Next stage and map actions');
    const winLayout=await page.evaluate(()=>{
      const r=document.querySelector('#modal-box').getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        scrollX:document.documentElement.scrollWidth-innerWidth,
        scrollY:document.documentElement.scrollHeight-innerHeight,
        stats:[...document.querySelectorAll('.result-stat strong')].map(n=>n.textContent)};
    });
    assert.ok(winLayout.left>=-2&&winLayout.right<=size.width+2&&
      winLayout.top>=-2&&winLayout.bottom<=size.height+2,'Illustrated results must fit mobile screen');
    assert.ok(winLayout.scrollX<=2&&winLayout.scrollY<=2,'Results must not scroll document');
    await page.screenshot({path:new URL('../test-output/forest-results-win-'+size.width+'.png',import.meta.url).pathname});
    await page.locator('#modal-actions button').first().click();
    await page.waitForFunction(()=>document.getElementById('stage-name').textContent==='달리는 버섯들'&&
      document.getElementById('modal-layer').hidden,{timeout:25000});
    await page.locator('#game-root canvas').waitFor();
    await page.waitForFunction(()=>document.getElementById('wave-label').textContent.includes(' / '));
    await page.evaluate(()=>window.__ForestGuardQA.finish(false));
    await page.locator('#modal-box.result-dialog:not(.result-win)').waitFor();
    assert.equal(await page.locator('.result-star.earned').count(),0,'Failure must not show earned stars');
    assert.match(await page.locator('#modal-actions button').first().innerText(),/다시 도전/);
    await page.screenshot({path:new URL('../test-output/forest-results-loss-'+size.width+'.png',import.meta.url).pathname});
    assert.deepEqual(errors,[],'Results browser exceptions');
    await context.close();
  }
  // If the stage painting fails, the game must never expose the old Canvas fallback.
  const failedCtx=await browser.newContext({viewport:{width:360,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const failedPage=await failedCtx.newPage();
  await failedPage.route('**/forest-entrance-v08.png**',route=>route.abort('failed'));
  await failedPage.goto(origin,{waitUntil:'domcontentloaded'});
  await failedPage.locator('#start-btn').click();
  await failedPage.waitForFunction(()=>{
    const layer=document.getElementById('modal-layer');
    return !layer.hidden&&document.getElementById('modal-kicker').textContent==='원화 로딩 문제';
  },null,{timeout:25000});
  assert.equal(await failedPage.locator('#game-root canvas').count(),0,'No primitive canvas fallback on asset failure');
  assert.equal(await failedPage.locator('#menu').isVisible(),true,'Menu must remain available');
  await failedCtx.close();
}finally{await browser.close();}
console.log('ForestGuard Chromium mobile viewport QA PASS');
console.log(JSON.stringify(reports,null,2));
