import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const load=p=>readFileSync(join(process.cwd(),p),'utf8');
const base=load('src/style.css');
const fix=load('src/painted-layout.css');
const source=load('src/main.ts');
let cases=0;
assert.ok(!base.includes('.hud-stats span{'), 'Status chip selector must not style nested art icons');cases++;
assert.ok(base.includes('.hud-stats>span{'), 'Use direct-child status selector');cases++;
assert.ok(source.includes("import './painted-layout.css';"), 'UI repair must be imported last');cases++;
assert.ok(!fix.includes('<svg') && !fix.includes('data:image/svg'), 'No SVG art may be introduced');cases++;
for(const name of ['ui-parchment-v1.webp','ui-button-wood-v1.webp','ui-button-pink-v1.webp','ui-button-green-v1.webp','ui-scroll-track-v1.webp','ui-scroll-thumb-v1.webp']){
 assert.ok(fix.includes(name),'Missing dedicated raster art '+name);cases++;
}
for(const test of ['border-image-slice:62 54 58 54 fill','border-image-slice:28 48 29 48 fill','#app .brand','#app .bottom-hud button','#app .modal-head','#app .modal .link-button','#app .garden-slot','#app .area-panel','#app .hud-stats>span','.modal::-webkit-scrollbar-thumb','@media(max-width:760px)','@media(max-width:370px)','@media(max-height:540px)','prefers-reduced-motion']){
 assert.ok(fix.includes(test),'Missing responsive painted repair '+test);cases++;
}
assert.ok(fix.indexOf('#app .modal-head')<fix.indexOf('@media(max-width:760px)'));cases++;
console.log('Painted button/frame & mobile layout regressions: '+cases+' checks passed.');
