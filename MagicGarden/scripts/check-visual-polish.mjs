import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('src/main.ts','utf8');
const stylesheet=readFileSync('src/visual-polish.css','utf8');
const previous=readFileSync('src/painted-layout.css','utf8');
const html=readFileSync('index.html','utf8');
let count=0;
assert.ok(src.includes("import './visual-polish.css';"),'Visual polish stylesheet not imported');count++;
assert.ok(src.indexOf("import './visual-polish.css';")>src.indexOf("import './painted-layout.css';"),'Visual rules must load after 9-slice foundations');count++;
for(const section of ['.area-panel','.area .art-icon','.bottom-hud button','.modal-head','.garden-slot','.garden-detail','.garden-recipe','.garden-ingredient','.garden-friend','.garden-tabs','.creek-visit','.guide']){
 assert.ok(stylesheet.includes(section),'Missing UI visual treatment: '+section);count++;
}
for(const rule of ['border-image-width:12px 20px','border-image-width:9px 15px','border-image:none','flex-direction:column','@media(max-width:370px)','max-height:610px','prefers-reduced-motion']){
 assert.ok(stylesheet.includes(rule),'Missing important visual/responsive rule: '+rule);count++;
}
assert.ok(previous.includes('border-image-source:url('),'Original painted raster frame should remain');count++;
assert.ok(stylesheet.indexOf('svg')<0 || stylesheet.includes('no SVG'),'No vector artwork expected');count++;
for(const name of ['town-button','farm-button','lab-button','nursery-button','bag-button','map-button','book-button','help-button']){
 assert.ok(html.includes('id="'+name+'"'),'Navigation target missing: '+name);count++;
}
console.log('v15 illustrated design hierarchy and mobile regression: '+count+' assertions passed.');

assert.ok(src.includes("setGuideIllustrations(liveStatus,"),'Incubation live status must use painted raster icon, not a native emoji');count++;
assert.ok(!src.includes("'🌲':'farm'") && !src.includes("'💧':'lab'") && !src.includes("'🌉':'map'"),'No misleading illustrated icon substitutions for nature landmarks');count++;
assert.ok(stylesheet.includes('.garden-hatch-status .art-icon'),'Real incubation illustration must not alter text line height');count++;
