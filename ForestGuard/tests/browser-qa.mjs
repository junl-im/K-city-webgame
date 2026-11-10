import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const origin='http://127.0.0.1:8765/ForestGuard/';
const sizes=[
  {width:320,height:568},{width:360,height:740},{width:390,height:844},
  {width:430,height:932},{width:488,height:734},{width:1365,height:768}
];
mkdirSync(new URL('../test-output/',import.meta.url),{recursive:true});
// CI software renderer: prevent headless SwiftShader framebuffer attachment errors.
// Production retains Phaser.AUTO/WebGL; all gameplay and DOM flows are still tested.
const browser=await chromium.launch({headless:true,
  ...(process.env.FG_CHROMIUM_EXECUTABLE?{executablePath:process.env.FG_CHROMIUM_EXECUTABLE}:{}),
  args:['--disable-dev-shm-usage','--disable-webgl']});
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
    const paintedButtons=await page.evaluate(()=>{
      const names=['start-btn','help-btn','intel-btn','stage-list-btn'];
      return Object.fromEntries(names.map(name=>[name,getComputedStyle(document.getElementById(name)).backgroundImage]));
    });
    for(const [button,art] of Object.entries({
      'start-btn':'btn-gold-v33.webp',
      'help-btn':'btn-parchment-v33.webp',
      'intel-btn':'btn-stone-v33.webp',
      'stage-list-btn':'btn-sapphire-v33.webp'
    })){
      assert.ok(paintedButtons[button].includes(art),
        'Original independent painted surface missing on '+button+': '+paintedButtons[button]);
    }
    assert.ok(menu.scrollX<=2&&menu.scrollY<=2,'Menu unexpectedly scrolls: '+JSON.stringify(menu));
    const rearLayout=await page.locator('.home-party-v35').evaluate(img=>{
      const p=img.getBoundingClientRect(),s=getComputedStyle(img);
      return {left:p.left,right:p.right,bottom:p.bottom,height:p.height,
        loaded:img.complete&&img.naturalWidth>0,fit:s.objectFit};
    });
    assert.ok(rearLayout.loaded&&rearLayout.fit==='contain'&&rearLayout.height>=120,
      'Rear-facing illustrated heroes must load at their original proportions');
    assert.ok(rearLayout.left>=-1&&rearLayout.right<=size.width+1&&rearLayout.bottom<=size.height+1,
      'Rear hero painting clipped by over-wide layout: '+JSON.stringify(rearLayout));
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
    const homeLettering=await page.evaluate(()=>{
      const start=document.querySelector('#start-btn');
      const label=document.createRange();label.selectNodeContents(start.firstChild);
      const button=start.getBoundingClientRect(),ink=label.getBoundingClientRect();
      const board=document.querySelector('.home-stage-spot').getBoundingClientRect();
      const copy=document.querySelector('.home-stage-copy').getBoundingClientRect();
      const action=document.querySelector('#stage-list-btn').getBoundingClientRect();
      const title=document.querySelector('.home-stage-copy strong').getBoundingClientRect();
      const story=document.querySelector('.home-stage-copy span').getBoundingClientRect();
      return {startCenter:(button.left+button.right)/2,labelCenter:(ink.left+ink.right)/2,
        board:{left:board.left,right:board.right,top:board.top,bottom:board.bottom},
        copy:{left:copy.left,right:copy.right,top:copy.top,bottom:copy.bottom},
        action:{left:action.left,right:action.right,top:action.top,bottom:action.bottom},
        titleRight:title.right,storyRight:story.right,
        font:getComputedStyle(start).fontFamily};
    });
    assert.ok(Math.abs(homeLettering.startCenter-homeLettering.labelCenter)<=3.5,
      'Start lettering must be centered independently of its painted play icon: '+JSON.stringify(homeLettering));
    assert.ok(homeLettering.copy.left>=homeLettering.board.left+9&&
      homeLettering.copy.right+4<=homeLettering.action.left&&
      homeLettering.action.right<=homeLettering.board.right-8&&
      homeLettering.copy.top>=homeLettering.board.top+5&&
      homeLettering.copy.bottom<=homeLettering.board.bottom-5&&
      homeLettering.action.top>=homeLettering.board.top+5&&
      homeLettering.action.bottom<=homeLettering.board.bottom-5,
      'Quest title, description and stage button must stay within separate wooden sign areas: '+JSON.stringify(homeLettering));
    assert.ok(homeLettering.titleRight<=homeLettering.copy.right+.5&&
      homeLettering.storyRight<=homeLettering.copy.right+.5,
      'Quest lettering must never push into the action illustration');
    const missionType=await page.evaluate(()=>{
      const copy=document.getElementById('home-stage-story');
      const board=document.querySelector('.home-stage-spot');
      const story=copy.getBoundingClientRect();
      const surface=board.getBoundingClientRect();
      return {fontSize:parseFloat(getComputedStyle(copy).fontSize),
        whiteSpace:getComputedStyle(copy).whiteSpace,
        boardBottom:surface.bottom,storyBottom:story.bottom};
    });
    assert.ok(missionType.fontSize>=(size.width<=360?10.5:11),
      'Mission text must be legible on the painted wooden sign: '+JSON.stringify(missionType));
    assert.equal(missionType.whiteSpace,'normal','Mission story should wrap instead of silently disappearing');
    assert.ok(missionType.storyBottom<=missionType.boardBottom+2,
      'Mission story must stay within its painting: '+JSON.stringify(missionType));
    const forestNotice=await page.locator('#home-stage-story').evaluate(el=>({
      height:el.clientHeight,scrollHeight:el.scrollHeight,clamp:getComputedStyle(el).webkitLineClamp
    }));
    assert.ok(forestNotice.scrollHeight<=forestNotice.height+2,
      'The complete forest notice must be visible, not cut off with ellipsis: '+JSON.stringify(forestNotice));
    if(size.width<=360)assert.equal(forestNotice.clamp,'2',
      'Short portrait phones need two readable lines on the forest sign');
    const homeButtons=await page.evaluate(()=>
      ['#start-btn','#resume-btn','#stage-list-btn','#help-btn','#intel-btn'].map(sel=>{
        const el=document.querySelector(sel),s=getComputedStyle(el);
        return {sel,border:parseFloat(s.borderTopWidth),shadow:s.boxShadow,font:s.fontFamily};
      }));
    assert.ok(homeButtons.every(x=>x.border===0&&x.shadow==='none'),
      'Illustrated home buttons must not have extra CSS rectangle borders/shadows: '+JSON.stringify(homeButtons));
    assert.ok(homeButtons.find(x=>x.sel==='#start-btn').font.includes('Apple SD Gothic Neo'),
      'Primary start label must use the consistent Korean UI family');
    const startAfter=await page.locator('#start-btn').evaluate(el=>getComputedStyle(el,'::after').content);
    assert.equal(startAfter,'none','Legacy button pseudo-outline must be removed');
    await page.screenshot({path:new URL('../test-output/home-'+size.width+'x'+size.height+'.png',import.meta.url).pathname});
    // Explicitly navigate the dedicated stage picker, no more scattered empty waypoint boxes.
    await page.locator('#stage-list-btn').click({timeout:20000});
    assert.equal(await page.locator('#stage-select-panel').isVisible(),true,'Stage selection opens as a real screen');
    const stageBorders=await page.evaluate(()=>
      ['#stage-back-btn','.stage-chapter-tab','#stage-grid .stage-tile.selected','#stage-enter-btn'].map(sel=>{
        const s=getComputedStyle(document.querySelector(sel));return {sel,border:parseFloat(s.borderTopWidth),font:s.fontFamily};
      }));
    assert.ok(stageBorders.every(x=>x.border===0),'Stage button overlays returned: '+JSON.stringify(stageBorders));
    assert.ok(stageBorders.every(x=>x.font.includes('Apple SD Gothic Neo')),'Stage buttons should use the same Korean UI family');
    const stageCardArt=await page.evaluate(()=>{
      const selected=getComputedStyle(document.querySelector('#stage-grid .stage-tile.selected')).backgroundImage;
      const locked=getComputedStyle(document.querySelector('#stage-grid .stage-tile.locked')).backgroundImage;
      return {selected,locked};
    });
    assert.ok(stageCardArt.selected.includes('btn-gold-v33.webp')&&
      stageCardArt.selected.includes('linear-gradient'),
      'Stage title must remain legible over its gold painted surface');
    assert.ok(stageCardArt.locked.includes('btn-stone-v33.webp'),
      'Locked stages must use the weathered stone painting');
    await page.locator('#stage-grid .stage-tile:visible').first().waitFor({state:'visible'});
    assert.equal(await page.locator('#stage-map-pins .stage-path-pin').count(),4,
      'Each chapter must show exactly four illustrated route markers');
    assert.equal(await page.locator('#stage-map-pins button:not([disabled])').count(),1,
      'Only the first waypoint should be unlocked on fresh save');
    assert.equal(await page.locator('#stage-grid .stage-tile:visible').count(),4,
      'Chapter view must show four illustrated stages, not twelve plain text rows');
    assert.equal(await page.locator('#stage-grid .stage-tile-art:visible').count(),4);
    const stageType=await page.evaluate(()=>{
      const textNodes=[...document.querySelectorAll('#stage-grid .stage-tile:not([hidden])')]
        .flatMap(tile=>[...tile.querySelectorAll('.stage-list-name,.stage-tile-summary,.tiny')]
          .map(el=>({tile:tile.getBoundingClientRect().toJSON(),box:el.getBoundingClientRect().toJSON(),
            text:el.textContent,overflow:getComputedStyle(el).overflowX})));
      const footer=document.querySelector('#stage-select-panel .stage-choice-description').getBoundingClientRect();
      const enter=document.querySelector('#stage-enter-btn').getBoundingClientRect();
      return {textNodes,footer:footer.toJSON(),enter:enter.toJSON(),
        enterAlignment:getComputedStyle(document.querySelector('#stage-enter-btn')).justifyContent};
    });
    assert.ok(stageType.textNodes.every(({tile,box,overflow})=>
      box.width>0&&box.left>=tile.left-1&&box.right<=tile.right-1&&
      box.top>=tile.top-1&&box.bottom<=tile.bottom+1&&overflow==='hidden'),
      'Stage names and captions must remain within their illustrated wooden/stone cards: '+JSON.stringify(stageType.textNodes));
    assert.ok(stageType.footer.width>0&&stageType.footer.right<stageType.enter.left+1,
      'Stage footer description must stay to the left of its illustrated enter button');
    assert.equal(stageType.enterAlignment,'center','Departure text must be centered on its illustrated button');
    const ascent=await page.evaluate(()=>{
      const pins=[...document.querySelectorAll('#stage-map-pins .stage-path-pin')];
      const first=pins.find(pin=>pin.getAttribute('aria-label').startsWith('1-1 '));
      const boss=pins.find(pin=>pin.getAttribute('aria-label').startsWith('1-4 '));
      return {firstY:first.getBoundingClientRect().y,bossY:boss.getBoundingClientRect().y,
        selectedY:document.querySelector('#stage-grid .stage-tile.selected').getBoundingClientRect().y,
        lockedBossY:[...document.querySelectorAll('#stage-grid .stage-tile')].find(tile=>tile.classList.contains('boss')&&!tile.hidden).getBoundingClientRect().y};
    });
    assert.ok(ascent.firstY>ascent.bossY&&ascent.selectedY>ascent.lockedBossY,
      'Forest adventure must begin at the bottom and advance toward the boss');
    await page.locator('#stage-chapter-tabs [data-chapter="1"]').click();
    assert.equal(await page.locator('#stage-grid .stage-tile:visible').count(),4);
    assert.equal(await page.locator('#stage-chapter-tabs [data-chapter="1"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#stage-map-number').innerText(),'제2장');
    assert.equal(await page.locator('#stage-picker-name').innerText(),'반딧불 골짜기');
    assert.equal(await page.locator('#stage-enter-btn').isDisabled(),true,
      'A locked chapter must not send the player to the previously selected stage');
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
    assert.equal(await page.locator('#stage-enter-btn').isEnabled(),true,
      'Returning to an unlocked chapter restores a playable departure action');
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
    if(size.width===390){
      const thorn=await page.evaluate(()=>window.__ForestGuardQA.thornPaintingQA());
      assert.ok(thorn&&thorn.loaded&&thorn.allLoaded,
        'Chapter 1 thorn beetle needs its own decoded four-pose artwork: '+JSON.stringify(thorn));
      assert.ok(thorn.sourceSize[0]>=1000&&thorn.sourceSize[1]>=1000,
        'Beetle needs mobile-readable original painted detail');
      assert.equal(thorn.uniqueActionPoses,4,
        'Thorn must visibly distinguish idle, sprint, horn attack and hurt');
      assert.ok(thorn.transparentCorners&&thorn.frames.every(([w,h])=>w>=128&&h>=128),
        'Thorn poses must be square, cut out and alpha transparent: '+JSON.stringify(thorn));
      const runner=await page.evaluate(()=>window.__ForestGuardQA.runnerPaintingQA());
      assert.ok(runner&&runner.loaded&&runner.allLoaded,
        'Chapter 1 mushroom runner needs its own decoded four-pose artwork: '+JSON.stringify(runner));
      assert.ok(runner.sourceSize[0]>=1000&&runner.sourceSize[1]>=1000,
        'Mushroom runner needs detailed original 2×2 artwork');
      assert.equal(runner.uniqueActionPoses,4,
        'Runner must visibly distinguish ready, sprint, reaching attack and recoil');
      assert.ok(runner.transparentCorners&&runner.frames.every(([w,h])=>w>=128&&h>=128),
        'Runner poses must be alpha cutouts and preserve transparent corners: '+JSON.stringify(runner));
      const attackMotion=await page.evaluate(()=>window.__ForestGuardQA.scoutAttackMotionQA());
      assert.ok(attackMotion&&Object.values(attackMotion.species).every(species=>
        species.count===6&&species.distinctPaintings>=5),
        'The two scouts need six readable, individually composed attack beats: '+JSON.stringify(attackMotion));
      assert.ok(attackMotion.retreat<0&&attackMotion.southwardRelease>0&&
        Math.abs(attackMotion.finish)<.001,
        'Enemy attack must wind up north and then release toward the southern fort');
      const alphas=await page.evaluate(()=>window.__ForestGuardQA.monsterCutoutAlpha());
      assert.ok(alphas&&Object.keys(alphas).length===10,'All ten monster textures must exist');
      assert.ok(Object.entries(alphas).every(([,corners])=>corners.every(value=>value===0)),
        'Original opaque monster atlas corners must be cut out: '+JSON.stringify(alphas));
      const hurt=await page.evaluate(()=>window.__ForestGuardQA.monsterHurtPaintingQA());
      assert.equal(hurt.loaded,true,'New independent painted monster hurt atlas must decode');
      const strike=await page.evaluate(()=>window.__ForestGuardQA.paintedStrikeQA());
      assert.ok(strike&&strike.loaded&&strike.played,
        'v5.8 woodland impact painting must load and play: '+JSON.stringify(strike));
      assert.deepEqual(strike.textureSize,[256,256],
        'v5.8 impact texture should be a bounded mobile-scale raster');
      assert.ok(strike.transparentCorners&&strike.beforeHP===strike.afterHP&&
        strike.afterCount===strike.beforeCount+1,
        'Painted impact may not add damage or opaque corners: '+JSON.stringify(strike));
      assert.ok(hurt.sourceSize[0]>=1000&&hurt.sourceSize[1]>=500,
        'Ten-species hurt atlas should retain detailed transparent source art');
      assert.equal(Object.keys(hurt.items).length,10,'Every monster needs its own hit painting');
      assert.ok(Object.entries(hurt.items).every(([,item])=>
        item.transparentCorners&&item.opaquePixels>=80),
        'No new opaque rectangular backing or missing species in v4.9 hit art: '+JSON.stringify(hurt));
      const cleanup=await page.evaluate(()=>{
        const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
        const c=canvas.getContext('2d',{willReadFrequently:true});
        c.fillStyle='#78b76a';c.fillRect(12,12,37,37);
        c.fillStyle='#fa1010';c.fillRect(11,18,1,22); // chroma-key fringe attached to body
        c.fillStyle='#e8c283';c.fillRect(57,58,3,3); // disconnected atlas debris
        c.fillStyle='rgba(184,209,166,.10)';c.fillRect(54,6,6,4); // faint stray pixels outside silhouette
        const report=window.ForestGuardVisuals.cleanEnemyFrame(c,64,64);
        const alpha=(x,y)=>c.getImageData(x,y,1,1).data[3];
        return {report,body:alpha(30,30),fringe:alpha(11,22),island:alpha(58,59),ghost:alpha(56,8)};
      });
      assert.ok(cleanup.body===255&&cleanup.fringe===0&&cleanup.island===0&&cleanup.ghost===0&&
        cleanup.report.fringe>=20&&cleanup.report.islands>=9&&cleanup.report.wisps>=20,
      'Monster matte cleanup must keep the body and remove moving chroma fragments: '+JSON.stringify(cleanup));
      const broadHalo=await page.evaluate(()=>{
        const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
        const c=canvas.getContext('2d',{willReadFrequently:true});
        c.fillStyle='#78b76a';c.fillRect(12,12,37,37);
        c.fillStyle='rgba(190,226,153,.1)';c.fillRect(43,2,20,9);
        const report=window.ForestGuardVisuals.cleanEnemyFrame(c,64,64);
        return {report,haloAlpha:c.getImageData(59,5,1,1).data[3]};
      });
      assert.ok(broadHalo.haloAlpha>0,'Larger intentional spell glow must survive matte cleanup: '+JSON.stringify(broadHalo));
    }
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
    const battleButtonArt=await page.evaluate(()=>
      ['#home-btn','#view-btn','#speed-btn','#pause-btn','#repair-btn','#evo-btn','#skill-btn']
        .map(sel=>{const s=getComputedStyle(document.querySelector(sel));
          return {sel,border:parseFloat(s.borderTopWidth),shadow:s.boxShadow,image:s.backgroundImage};
        }));
    assert.ok(battleButtonArt.every(x=>x.border===0&&x.shadow==='none'),
      'HUD button frames must come only from painted art: '+JSON.stringify(battleButtonArt));
    assert.ok(battleButtonArt.find(x=>x.sel==='#view-btn').image.includes('btn-sapphire-v33.webp'));
    assert.ok(battleButtonArt.find(x=>x.sel==='#speed-btn').image.includes('btn-emerald-v33.webp'));
    const hudLabelFont=await page.locator('.battle-toolbar .hero-slot').first().evaluate(slot=>
      parseFloat(getComputedStyle(slot.querySelector('span:last-child')).fontSize));
    assert.ok(hudLabelFont>=9,'Painted hero slot labels should remain readable on narrow mobile: '+hudLabelFont);
    const hudLettering=await page.evaluate(()=>{
      const rect=el=>el.getBoundingClientRect();
      const stage=rect(document.querySelector('.battle-hud .hud-stage'));
      const controls=rect(document.querySelector('.battle-hud .hud-right'));
      const label=document.querySelector('.battle-hud .hud-stage span');
      const longNames=['고양이 기술자','토끼 마법사','진화 여우','영입 선택','곰 수호자'];
      const slots=[...document.querySelectorAll('.hero-slot')].map((slot,i)=>{
        const ink=slot.querySelector('span:last-child'),old=ink.textContent;
        ink.textContent=longNames[i];
        const type=getComputedStyle(ink),area=rect(ink),frame=rect(slot);
        const result={label:longNames[i],clamp:type.webkitLineClamp,
          height:ink.clientHeight,scrollHeight:ink.scrollHeight,
          left:area.left,right:area.right,frameLeft:frame.left,frameRight:frame.right,
          bottom:area.bottom,frameBottom:frame.bottom};
        ink.textContent=old;return result;
      });
      const command=['#evo-btn','#skill-btn'].map(sel=>{
        const button=document.querySelector(sel),caption=button.querySelector('small');
        const old=caption.textContent;caption.textContent='달빛 진화';
        const clip=caption.scrollHeight-caption.clientHeight;
        const result={sel,clip,clamp:getComputedStyle(caption).webkitLineClamp,
          bottom:rect(caption).bottom,frameBottom:rect(button).bottom};
        caption.textContent=old;return result;
      });
      return {stageRight:stage.right,controlsLeft:controls.left,stageFont:parseFloat(getComputedStyle(label).fontSize),
        slots,command};
    });
    assert.ok(hudLettering.stageRight<=hudLettering.controlsLeft+1&&hudLettering.stageFont>=10,
      'Chapter lettering must not collide with repair and game controls: '+JSON.stringify(hudLettering));
    assert.ok(hudLettering.slots.every(s=>s.clamp==='2'&&s.scrollHeight<=s.height+2&&
      s.left>=s.frameLeft-1&&s.right<=s.frameRight+1&&s.bottom<=s.frameBottom+1),
      'Two-line companion names must remain legible on their individual raster station: '+JSON.stringify(hudLettering.slots));
    assert.ok(hudLettering.command.every(c=>c.clamp==='2'&&c.clip<=2&&c.bottom<=c.frameBottom+1),
      'Skill and evolution captions must fit completely within painted controls: '+JSON.stringify(hudLettering.command));
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
    const commandType=await page.evaluate(()=>{
      const hero=document.querySelector('.hero-slot span:last-child');
      const command=document.getElementById('skill-caption');
      return {heroFont:parseFloat(getComputedStyle(hero).fontSize),
        commandFont:parseFloat(getComputedStyle(command).fontSize)};
    });
    assert.ok(commandType.heroFont>=8.5&&commandType.commandFont>=8.5,
      'Battle roster/skill labels must remain legible on illustrated controls: '+JSON.stringify(commandType));
    const layers=await page.evaluate(()=>window.__ForestGuardQA?.renderInfo());
    assert.ok(layers&&layers.artLoaded,'New independent wall artwork must load');
    assert.equal(layers.frontTexture,'painted-rampart-front','Original painted wall foreground must render');
    assert.ok(layers.frontDepth>layers.heroDepth&&layers.frontY>layers.heroY,
      'Hero bodies should stand behind the illustrated wall');
    assert.ok(layers.heroY<=575&&layers.heroHeight>=90,'Hero should stand above battlements');
    assert.equal(layers.fieldCount,1,'Exactly one stage background must render');
    if(size.width===390){
      const elemental=await page.evaluate(()=>window.__ForestGuardQA.elementVisuals());
      assert.ok(elemental.sourceReady,'Original four-element painting must load in battle');
      assert.deepEqual(elemental.textures,{forest:true,frost:true,stone:true,flame:true},
        'Every elemental painting quadrant must become a Phaser texture');
      const cues=await page.evaluate(()=>window.__ForestGuardQA.previewElementCues());
      assert.deepEqual(cues,[true,true,true,true],'All four original elemental combat cues must render');
      await page.waitForTimeout(130);
      await page.screenshot({path:new URL('../test-output/element-combat-v39-390.png',import.meta.url).pathname});
      const motion=await page.evaluate(()=>window.__ForestGuardQA.motionInfo());
      assert.deepEqual(motion,{heroAttack8:true,foxRasterReady:true,
        paintedHeroAttacks:{bear:true,rabbit:true,cat:true,megafox:true},
        ordinaryHurt5:true,hurtDuration:400,eliteAttack6:true,
        eliteHurt6:true,paintedMonsterHurt:true,paintedMonsterKinds:10,
        ordinaryDeath5:true,eliteDeath6:true,deathDuration:510,heroDuration:520},
        'All painted rear attacks and 5/6-frame monster hit reactions must load at runtime');
      const release=await page.evaluate(()=>window.__ForestGuardQA.attackReleaseQA());
      assert.ok(release?.staged&&release.socket&&release.launchCount===1&&
        release.releaseDelay>=200&&release.releaseDelay<=240&&release.animation==='attack',
        'Painted fox attack must wind up before its hidden bolt leaves the moving weapon: '+JSON.stringify(release));
      const shroomPainting=await page.evaluate(()=>window.__ForestGuardQA.shroomAttackPaintingQA());
      assert.deepEqual(shroomPainting,{loaded:true,returnPoses:true,fullMotion:true,transparentCorners:true},
        'Mushroom elite must have six continuous transparent painted attack frames');
      const gesture=await page.evaluate(()=>window.__ForestGuardQA.attackGestureQA());
      assert.ok(gesture&&gesture.state==='attack'&&gesture.animation&&
        gesture.scaleRatio>1.005&&gesture.scaleRatio<1.07&&gesture.preservedAspect&&
        gesture.gameplayY===260,
        'Attack beat must visibly lift a proportional painted monster without altering gameplay: '+JSON.stringify(gesture));
      const chroma=await page.evaluate(()=>window.__ForestGuardQA.attackFrameSpill());
      assert.deepEqual(chroma,{fox:0,bear:0,rabbit:0,cat:0,megafox:0},
        'No saturated-red background contamination in the five rear-attack textures');
      const death=await page.evaluate(()=>window.__ForestGuardQA.previewDefeat());
      assert.ok(death.enemyCountUnchanged&&death.deathCount>=1&&
        death.texture==='motion-sprout-hurt-2',
        'The final hand-painted hurt must remain visible without delaying wave accounting');
      await page.waitForTimeout(150);
      const dyingTexture=await page.evaluate(()=>window.__ForestGuardQA.previewDeathFrame());
      assert.ok(dyingTexture?.startsWith('motion-sprout-death-'),
        'The defeated monster must transition from hurt into the original death animation');
      await page.screenshot({path:new URL('../test-output/monster-death-v43-390.png',import.meta.url).pathname});
      await page.waitForFunction(()=>window.__ForestGuardQA.deathFxCount()===0,null,{timeout:1600});
      const tracked=await page.evaluate(()=>window.__ForestGuardQA.damageNumberTrack());
      assert.ok(tracked?.alive&&tracked.shift>22,'Damage number must follow moving enemy position');
      await page.screenshot({path:new URL('../test-output/motion-impact-v40-390.png',import.meta.url).pathname});
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
    if(size.width===320){
      // The narrowest phone must render the real painted free-reroll control
      // and readable growth captions, without a detached CSS pill.
      assert.equal(await page.evaluate(()=>window.__ForestGuardQA.previewGrowth(['power','ice','bear'])),true);
      const compactGrowth=await page.locator('#modal-box.growth-dialog').evaluate(box=>{
        const reroll=box.querySelector('#modal-actions .modal-action.alt');
        const button=reroll.getBoundingClientRect(),dialog=box.getBoundingClientRect();
        const paint=getComputedStyle(reroll);
        const cardDetails=[...box.querySelectorAll('.draft-card small')].map(el=>({
          fontSize:parseFloat(getComputedStyle(el).fontSize),
          bottom:el.getBoundingClientRect().bottom,
          cardBottom:el.closest('.draft-card').getBoundingClientRect().bottom
        }));
        return {background:paint.backgroundImage,border:parseFloat(paint.borderTopWidth),
          radius:paint.borderRadius,shadow:paint.boxShadow,
          button:{left:button.left,right:button.right,top:button.top,bottom:button.bottom,height:button.height},
          dialog:{top:dialog.top,bottom:dialog.bottom},cardDetails};
      });
      assert.ok(compactGrowth.background.includes('btn-sapphire-v33.webp')&&
        compactGrowth.border===0&&compactGrowth.radius==='0px'&&compactGrowth.shadow==='none',
        'Growth reroll must use the original painted sapphire image without CSS frames: '+JSON.stringify(compactGrowth));
      assert.ok(compactGrowth.button.left>=0&&compactGrowth.button.right<=size.width&&
        compactGrowth.button.height>=44&&compactGrowth.button.bottom<=size.height+2&&
        compactGrowth.dialog.top>=-2&&compactGrowth.dialog.bottom<=size.height+2,
        'Growth reroll and dialog must fit the narrow phone: '+JSON.stringify(compactGrowth));
      assert.ok(compactGrowth.cardDetails.every(x=>x.fontSize>=10&&x.bottom<=x.cardBottom+2),
        'Growth card lettering must be legible and remain inside each painting: '+JSON.stringify(compactGrowth));
      await page.screenshot({path:new URL('../test-output/growth-painted-reroll-320.png',import.meta.url).pathname});
      await page.locator('#modal-close').click();
      assert.equal(await page.locator('#modal-layer').isHidden(),true);
    }
    if(size.width===390){
      // A real first-wave combat smoke: fast-forward, verify the free recruit, reopen it from the empty perch.
      await page.locator('#speed-btn').click();
      await page.waitForFunction(()=>{
        const modal=document.querySelector('#modal-layer');
        return !modal.hidden && modal.querySelectorAll('.recruit-card').length===3;
      },null,{timeout:50000});
      assert.equal(await page.locator('.recruit-card').count(),3,'Three distinct first companions');
      assert.equal(await page.locator('.recruit-card.recommended').count(),1,'Exactly one recommended companion');
      assert.equal(await page.locator('.recruit-tag').count(),1,'Only one recommendation badge in first-companion UI');
      assert.equal(await page.locator('.recruit-card.recommended .recruit-tag').count(),1,'Badge belongs to the recommended card');
      const recruitHeading=await page.locator('#modal-box.recruit-dialog .modal-top').evaluate(header=>{
        const root=header.closest('#modal-box').getBoundingClientRect();
        const label=header.querySelector('#modal-kicker').getBoundingClientRect();
        const close=header.querySelector('.close-button').getBoundingClientRect();
        return {offset:Math.abs((label.left+label.right)/2-(root.left+root.right)/2),
          labelRight:label.right,closeLeft:close.left,columns:getComputedStyle(header).gridTemplateColumns};
      });
      assert.ok(recruitHeading.offset<=3&&recruitHeading.labelRight<=recruitHeading.closeLeft+1&&
        recruitHeading.columns.split(' ').length===3,
        'Companion chapter cue must center between the painted scene and the close control: '+JSON.stringify(recruitHeading));
      const illustratedClose=await page.locator('#modal-close').evaluate(el=>{
        const css=getComputedStyle(el);
        return {art:css.backgroundImage,size:css.backgroundSize,position:css.backgroundPosition,
          border:parseFloat(css.borderTopWidth),font:parseFloat(css.fontSize)};
      });
      assert.ok(illustratedClose.art.includes('rani-ui-icons-v04.webp')&&
        illustratedClose.size==='400% 400%'&&illustratedClose.position.startsWith('66.')&&
        illustratedClose.border===0&&illustratedClose.font===0,
        'Dismiss control must use an illustrated back-arrow, not the generic CSS circle: '+JSON.stringify(illustratedClose));
      const crispText=await page.locator('.recruit-card').evaluateAll(cards=>cards.map(card=>({
        heading:getComputedStyle(card.querySelector('strong')).fontFamily,
        description:getComputedStyle(card.querySelector('small')).wordBreak,
        badge:card.querySelectorAll('.recruit-tag').length,
        cardPainting:getComputedStyle(card).backgroundImage,
        painted:getComputedStyle(card.querySelector('.recruit-portrait')).backgroundImage
      })));
      assert.ok(crispText.every(c=>c.heading.includes('Apple SD Gothic Neo')&&
        c.description==='keep-all'&&c.painted.includes('-cutout-v50.webp')&&
        c.cardPainting.includes('forest-choice-card-v50.webp')&&c.badge<=1),
        'Selection cards need consistent Korean text, painted art and only one badge');
      const badgeLayout=await page.locator('.recruit-card').evaluateAll(cards=>cards.map(card=>{
        const portrait=card.querySelector('.recruit-portrait').getBoundingClientRect();
        const slot=card.querySelector('.recruit-badge-line').getBoundingClientRect();
        const title=card.querySelector('strong').getBoundingClientRect();
        return {recommended:card.classList.contains('recommended'),
          portraitBottom:portrait.bottom,slotTop:slot.top,slotBottom:slot.bottom,
          titleTop:title.top,tagCount:card.querySelectorAll('.recruit-tag').length};
      }));
      assert.ok(badgeLayout.length===3&&badgeLayout.every(item=>
        item.slotTop>=item.portraitBottom-2&&item.slotBottom<=item.titleTop+2&&
        item.tagCount===(item.recommended?1:0)),
        'Recommendation text must occupy its own row, never overlap a portrait: '+JSON.stringify(badgeLayout));
      const forestModal=await page.locator('#modal-box').evaluate(box=>({
        panel:getComputedStyle(box).backgroundImage,
        backdrop:getComputedStyle(document.querySelector('#modal-layer .modal-scrim')).backgroundImage
      }));
      assert.equal(forestModal.panel,'none','Companion selection must not show an extra rectangular background');
      assert.ok(forestModal.backdrop.includes('forest-entrance-v08.png'),
        'Choice modal should share a single illustrated forest backdrop');
      await page.setViewportSize({width:320,height:568});
      const compactChoice=await page.locator('#modal-box').evaluate(box=>{
        const r=box.getBoundingClientRect(),rows=[...box.querySelectorAll('.recruit-card')].map(c=>c.getBoundingClientRect());
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
          scrollHeight:box.scrollHeight,clientHeight:box.clientHeight,
          cards:rows.map(a=>({left:a.left,right:a.right,bottom:a.bottom}))};
      });
      assert.ok(compactChoice.top>=-2&&compactChoice.bottom<=570&&
        compactChoice.left>=-2&&compactChoice.right<=322&&
        compactChoice.cards.every(c=>c.left>=-2&&c.right<=322&&c.bottom<=570),
        '320px recruit cards must remain fully inside the phone viewport: '+JSON.stringify(compactChoice));
      await page.setViewportSize(size);
      const rabbitArt=await page.locator('.recruit-rabbit .recruit-portrait').evaluate(async portrait=>{
        const background=getComputedStyle(portrait).backgroundImage;
        const source=background.match(/url\((?:["'])?([^"')]+)(?:["'])?\)/)?.[1];
        if(!source)return {source:'',redPixels:-1};
        const img=new Image();img.src=source;await img.decode();
        const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0);
        const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
        let redPixels=0;
        for(let y=0;y<canvas.height*.13;y++)for(let x=Math.floor(canvas.width*.73);x<canvas.width;x++){
          const index=(y*canvas.width+x)*4,r=pixels[index],g=pixels[index+1],b=pixels[index+2];
          if(r>125&&r>g*1.55&&r>b*1.45)redPixels++;
        }
        return {source,redPixels,cornerAlpha:pixels[3]};
      });
      assert.match(rabbitArt.source,/recruit-rabbit-cutout-v50\.webp/,'Transparent rabbit painting loaded');
      assert.ok(rabbitArt.redPixels<20,'Red recommendation plaque must not be baked into rabbit art: '+JSON.stringify(rabbitArt));
      assert.equal(rabbitArt.cornerAlpha,0,'Hero art must have real transparent outer pixels, not a hidden rectangular photo');
      const recruitLayout=await page.locator('.recruit-card').evaluateAll(cards=>cards.map(card=>{
        const outer=card.getBoundingClientRect();
        const portrait=card.querySelector('.recruit-portrait').getBoundingClientRect();
        const name=card.querySelector('strong').getBoundingClientRect();
        const detail=card.querySelector('small').getBoundingClientRect();
        const paint=getComputedStyle(card),art=getComputedStyle(card.querySelector('.recruit-portrait'));
        return {outer:{left:outer.left,right:outer.right,bottom:outer.bottom},
          portrait:{top:portrait.top,bottom:portrait.bottom},name:{top:name.top,bottom:name.bottom},
          detail:{top:detail.top,bottom:detail.bottom},
          border:parseFloat(paint.borderTopWidth),fit:art.backgroundSize};
      }));
      assert.ok(recruitLayout.every(x=>x.border===0&&x.fit==='contain'&&
        x.portrait.bottom<=x.name.top+2&&x.name.bottom<=x.detail.top+2&&
        x.detail.bottom<=x.outer.bottom+2&&x.outer.left>=-2&&x.outer.right<=size.width+2),
        'Original companion paintings, titles and details may not overlap or clip: '+JSON.stringify(recruitLayout));
      const recruitBox=await page.locator('#modal-box').evaluate(box=>{
        const r=box.getBoundingClientRect(),title=box.querySelector('#modal-title').getBoundingClientRect(),
          description=box.querySelector('#modal-description').getBoundingClientRect(),
          cards=box.querySelector('.card-grid').getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollHeight:box.scrollHeight,
          clientHeight:box.clientHeight,titleBottom:title.bottom,descriptionTop:description.top,
          descriptionBottom:description.bottom,cardsTop:cards.top};
      });
      assert.ok(recruitBox.titleBottom<=recruitBox.descriptionTop+2&&
        recruitBox.descriptionBottom<=recruitBox.cardsTop+55&&
        recruitBox.left>=-2&&recruitBox.right<=size.width+2,
        'Recruit dialog text, painting and cards must stay aligned: '+JSON.stringify(recruitBox));
      await page.screenshot({path:new URL('../test-output/recruit-v45-390.png',import.meta.url).pathname});
      await page.locator('#modal-close').click();
      assert.equal(await page.locator('#modal-layer').isHidden(),true,'Recruit can be deferred');
      await page.locator('.hero-slot.empty').first().click();
      assert.equal(await page.locator('.recruit-card').count(),3,'Empty pedestal reopens recruitment');
      await page.locator('.recruit-rabbit').click();
      assert.equal(await page.locator('.hero-slot:not(.empty)').count(),2,'Recruit joins the defense');
      assert.equal(await page.locator('.hero-slot.empty').count(),3,'Three future reinforcement slots remain');
      // v5.0.1: all three icon sources must crop correctly, not show their full sprite sheet.
      assert.equal(await page.evaluate(()=>window.__ForestGuardQA.previewGrowth(['power','ice','bear'])),true);
      assert.equal(await page.locator('.draft-card').count(),3,'Growth modal preserves three active choices');
      const growthHeading=await page.locator('#modal-box.growth-dialog .modal-top').evaluate(header=>{
        const root=header.closest('#modal-box').getBoundingClientRect();
        const label=header.querySelector('#modal-kicker').getBoundingClientRect();
        return Math.abs((label.left+label.right)/2-(root.left+root.right)/2);
      });
      assert.ok(growthHeading<=3,'Growth chapter cue must be centered over its three choices');
      const growthBox=await page.locator('#modal-box').evaluate(box=>{
        const r=box.getBoundingClientRect(),cards=[...box.querySelectorAll('.draft-card')].map(node=>{
          const bounds=node.getBoundingClientRect(),heading=node.querySelector('strong').getBoundingClientRect(),
            detail=node.querySelector('small').getBoundingClientRect(),
            icon=node.querySelector('.spell-emoji'),style=getComputedStyle(icon);
          return {left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom,
            painting:getComputedStyle(node).backgroundImage,
            iconImage:style.backgroundImage,iconSize:style.backgroundSize,
            expectedIconSize:style.getPropertyValue('--rani-icon-size').trim(),
            iconPosition:style.backgroundPosition,
            expectedIconPosition:style.getPropertyValue('--rani-icon-position').trim(),
            companion:icon.dataset.heroArt||null,
            headingBottom:heading.bottom,detailTop:detail.top,detailBottom:detail.bottom};
        });
        return {left:r.left,right:r.right,bottom:r.bottom,background:getComputedStyle(box).backgroundImage,cards};
      });
      assert.ok(growthBox.left>=-2&&growthBox.right<=size.width+2&&
        growthBox.cards.every(card=>card.painting.includes('forest-choice-card-v50.webp')&&
          card.headingBottom<=card.detailTop+2&&card.detailBottom<=card.bottom+2),
        'Growth cards must have distinct non-overlapping descriptions: '+JSON.stringify(growthBox));
      assert.deepEqual(growthBox.cards.map(card=>card.iconSize),['400% 400%','200% 200%','contain'],
        'Growth icons must display a single skill/element tile or companion painting, never the full atlas');
      assert.ok(growthBox.cards.every(card=>card.iconSize===card.expectedIconSize)&&
        growthBox.cards[0].iconPosition===growthBox.cards[0].expectedIconPosition&&
        growthBox.cards[1].iconPosition===growthBox.cards[1].expectedIconPosition&&
        growthBox.cards[0].iconImage.includes('rani-ui-icons-v04.webp')&&
        growthBox.cards[1].iconImage.includes('rani-element-spells-v38.png')&&
        growthBox.cards[2].iconImage.includes('recruit-bear-cutout-v50.webp')&&
        growthBox.cards[2].companion==='bear',
        'Wrong illustration/crop in growth choices: '+JSON.stringify(growthBox.cards));
      await page.screenshot({path:new URL('../test-output/growth-v45-390.png',import.meta.url).pathname});
      await page.locator('.draft-card').first().click();
      assert.equal(await page.locator('#modal-layer').isHidden(),true,'Growth choice applies and closes');
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
    if(size.width===390){
      const boss=await page.evaluate(()=>window.__ForestGuardQA.bossSingleIndicator());
      assert.deepEqual(boss,{upper:true,overhead:false,warningBar:false},
        'Elite health and name must appear only in the fixed upper HUD');
    }
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
    const resultHeading=await page.locator('#modal-box.result-dialog .modal-top').evaluate(header=>{
      const root=header.closest('#modal-box').getBoundingClientRect();
      const label=header.querySelector('#modal-kicker').getBoundingClientRect();
      return Math.abs((label.left+label.right)/2-(root.left+root.right)/2);
    });
    assert.ok(resultHeading<=3,'Victory scene chapter cue must align with title and stars');
    const starTrim=await page.locator('.result-star.earned').evaluateAll(nodes=>
      nodes.map(node=>getComputedStyle(node).clipPath));
    assert.ok(starTrim.every(value=>value.includes('21.5%')),
      'Packed star atlas must trim the stray red flame fragments under every reward star: '+starTrim.join(', '));
    assert.equal(await page.locator('.result-stat').count(),3,'Show real currency, HP and squad metrics');
    const resultStatFonts=await page.locator('.result-stat').evaluateAll(items=>items.map(item=>({
      label:parseFloat(getComputedStyle(item.querySelector('span:not(.result-stat-icon)')).fontSize),
      amount:parseFloat(getComputedStyle(item.querySelector('strong')).fontSize)
    })));
    assert.ok(resultStatFonts.every(stat=>stat.label>=10&&stat.amount>=11),
      'Results must keep reward captions and totals readable on 320px phones: '+JSON.stringify(resultStatFonts));
    assert.equal(await page.locator('#modal-actions button').count(),2,'Next stage and map actions');
    const winLayout=await page.evaluate(()=>{
      const box=document.querySelector('#modal-box'),r=box.getBoundingClientRect();
      const scene=document.querySelector('.result-hero-scene'),sceneRect=scene.getBoundingClientRect();
      const buttons=[...document.querySelectorAll('#modal-actions button')].map(node=>{
        const rect=node.getBoundingClientRect();
        return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};
      });
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        scrollX:document.documentElement.scrollWidth-innerWidth,
        scrollY:document.documentElement.scrollHeight-innerHeight,
        panel:getComputedStyle(box).backgroundImage,
        backdrop:getComputedStyle(document.querySelector('#modal-layer .modal-scrim')).backgroundImage,
        art:getComputedStyle(scene).backgroundImage,
        sceneBottom:sceneRect.bottom,
        statisticsTop:document.querySelector('.result-stats').getBoundingClientRect().top,
        buttons,stats:[...document.querySelectorAll('.result-stat strong')].map(n=>n.textContent)};
    });
    assert.ok(winLayout.left>=-2&&winLayout.right<=size.width+2&&
      winLayout.top>=-2&&winLayout.bottom<=size.height+2,'Illustrated results must fit mobile screen');
    assert.ok(winLayout.scrollX<=2&&winLayout.scrollY<=2,'Results must not scroll document');
    assert.equal(winLayout.panel,'none','Result dialogue must not add a second opaque rectangular background');
    assert.match(winLayout.backdrop,/forest-entrance-v08\.png/,'Results share one forest scene');
    assert.match(winLayout.art,/rani-rearguard-v35\.png/,'Result character artwork remains a separate original cutout');
    assert.ok(!winLayout.art.includes('forest-entrance-v08.png'),'Result panel must not duplicate the scene backdrop');
    assert.ok(winLayout.sceneBottom<=winLayout.statisticsTop+2,'Result painting and rewards must not overlap');
    assert.ok(winLayout.buttons.length===2&&winLayout.buttons.every(b=>
      b.left>=-2&&b.right<=size.width+2&&b.top>=-2&&b.bottom<=size.height+2),
      'Result actions must stay visible on a single phone screen: '+JSON.stringify(winLayout.buttons));
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
  // A transient stage-painting request must recover on the second attempt.
  const retryCtx=await browser.newContext({viewport:{width:360,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const retryPage=await retryCtx.newPage();
  let biomeRequests=0;
  await retryPage.route('**/forest-entrance-v08.png?v=20261031i**',route=>{
    biomeRequests++;
    return biomeRequests===1?route.abort('failed'):route.continue();
  });
  await retryPage.goto(origin+'?fgqa=1',{waitUntil:'domcontentloaded'});
  await retryPage.locator('#start-btn').click();
  await retryPage.locator('#game-root canvas').waitFor({state:'attached',timeout:30000});
  assert.ok(biomeRequests>=2,'Transient biome download must retry without a failure modal');
  assert.equal(await retryPage.locator('#modal-layer').isHidden(),true,'Successful retry must enter combat');
  await retryCtx.close();
  // If both regional PNG attempts fail, keep the illustrated WebP battlefield.
  const failedCtx=await browser.newContext({viewport:{width:360,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const failedPage=await failedCtx.newPage();
  let fallbackAttempts=0;
  await failedPage.route('**/forest-entrance-v08.png**',route=>{fallbackAttempts++;return route.abort('failed');});
  await failedPage.goto(origin,{waitUntil:'domcontentloaded'});
  await failedPage.locator('#start-btn').click();
  await failedPage.locator('#game-root canvas').waitFor({state:'attached',timeout:30000});
  assert.ok(fallbackAttempts>=2,'Regional PNG must retry before illustrated fallback');
  assert.equal(await failedPage.locator('#modal-layer').isHidden(),true,'WebP fallback must allow combat without a failure modal');
  assert.equal(await failedPage.locator('#menu').isHidden(),true,'Illustrated fallback must enter the battlefield');
  await failedCtx.close();
  // Chapter 1 sentinel and every chapter boss have independent 2×2 paintings.
  // The local-only QA hook never changes a saved public unlock progression.
  const bossCtx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const bossPage=await bossCtx.newPage();
  const bossErrors=[];bossPage.on('pageerror',error=>bossErrors.push(error.message));
  await bossPage.goto(origin+'?fgqa=1',{waitUntil:'domcontentloaded'});
  await bossPage.evaluate(()=>window.__ForestGuardQA.openChapterBossForQA(0));
  await bossPage.locator('#game-root canvas').waitFor({state:'attached',timeout:30000});
  const sentinel=await bossPage.evaluate(()=>window.__ForestGuardQA.chapterOneSentinelQA());
  assert.ok(sentinel?.loaded&&sentinel.frames.every(Boolean)&&sentinel.frameSize.every(v=>v===224)&&
    sentinel.background.includes('chapter1-forest-sentinel-v52.webp')&&
    sentinel.portrait.includes('chapter-sentinel')&&sentinel.title==='숲길 파수꾼',
  'Chapter 1 sentinel must retain its six painted actions and matching HUD: '+JSON.stringify(sentinel));
  const guardianSpear=await bossPage.evaluate(()=>window.__ForestGuardQA.sentinelSpearPaintingQA());
  assert.ok(guardianSpear?.loaded&&guardianSpear.sourceSize.every(v=>v>=1000)&&
    guardianSpear.distinctPaintings===4&&guardianSpear.frames.every(frame=>
      frame.size.every(n=>n===192)&&frame.visible>300&&frame.corners.every(a=>a===0)),
    'Guardian needs four distinct transparent illustrated charge, spear and impact effects: '+JSON.stringify(guardianSpear));
  const spearHit=await bossPage.evaluate(()=>window.__ForestGuardQA.fireSentinelSpearForQA());
  await bossPage.waitForTimeout(750);
  const afterSpear=await bossPage.evaluate(()=>window.__ForestGuardQA.sentinelHPForQA());
  assert.equal(afterSpear,spearHit.expectedAfter,
    'Painted sentinel spear must damage fort once, for exactly 45 HP');
  await bossPage.waitForTimeout(400);
  await bossPage.screenshot({path:new URL('../test-output/chapter-sentinel-0-390.png',import.meta.url).pathname});
  for(const [stage,asset,title] of [
    [3,'chapter1-root-giant-v52.webp','뿌리 거인'],
    [7,'chapter2-masked-mole-v51.webp','가면 두더지'],
    [11,'chapter3-black-bell-v51.webp','검은 종의 주인']
  ]){
    await bossPage.evaluate(id=>window.__ForestGuardQA.openChapterBossForQA(id),stage);
    await bossPage.waitForFunction(id=>window.__ForestGuardQA.chapterBossPaintingQA()?.stage===id,stage,{timeout:30000});
    const painting=await bossPage.evaluate(()=>window.__ForestGuardQA.chapterBossPaintingQA());
    assert.ok(painting.loaded&&painting.frameSize.every(v=>v===224)&&
      painting.attackFrames.every(Boolean)&&painting.hurtFrames.every(Boolean),
      title+' must load six separate painted action/impact poses: '+JSON.stringify(painting));
    const result=await bossPage.evaluate(()=>window.__ForestGuardQA.previewChapterBossForQA());
    assert.ok(result.background.includes(asset)&&result.bossTitle===title,
      title+' upper HUD must use its matching painted portrait: '+JSON.stringify(result));
    await bossPage.waitForTimeout(450);
    await bossPage.screenshot({path:new URL('../test-output/chapter-boss-'+stage+'-390.png',import.meta.url).pathname});
  }
  assert.deepEqual(bossErrors,[],'New chapter boss browser exceptions');
  await bossCtx.close();
}finally{await browser.close();}
console.log('ForestGuard Chromium mobile viewport QA PASS');
console.log(JSON.stringify(reports,null,2));
