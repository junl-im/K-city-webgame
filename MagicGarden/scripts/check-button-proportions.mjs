import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/main.ts','utf8');
const css=readFileSync('src/button-proportions-v17.css','utf8');
const previous=readFileSync('src/button-art-v16.css','utf8');
let count=0;
assert.ok(source.includes("import './button-proportions-v17.css';"));count++;
assert.ok(source.indexOf("import './button-proportions-v17.css';")>source.indexOf("import './button-art-v16.css';"),'Aspect rules must override stretched v16 backgrounds');count++;
for(const id of ['#app .area{','#app .garden-tabs .garden-tab{','#app .modal .link-button{','#app .modal-head{','#app .creek-visit{','#app .bottom-hud button{']){
 assert.ok(css.includes(id),'Missing role '+id);count++;
}
for(const n of ['region-cream','tab-paper','tab-selected','action-sage','action-rose','action-gold','badge-wood']){
 assert.ok(css.includes('ui-v16-'+n+'.png'),'Raster family missing '+n);count++;
}
for(const cssRequired of ['border-image-source:', 'border-image-slice:', 'border-image-width:', 'fill;', '@media(max-width:760px)', '@media(max-width:370px)', 'prefers-reduced-motion', '#modal-close']){
 assert.ok(css.includes(cssRequired),'Framing rule missing: '+cssRequired);count++;
}
assert.ok(!css.includes('background-size:100% 100%'),'Stretching hand-painted corners destroys their shape');count++;
assert.ok(!css.includes('data:image/svg')&&!css.includes('<svg'),'Must never include SVG');count++;
assert.ok(previous.includes('ui-v16-region-cream.png'),'Keep original painted PNGs in source; v17 corrects only presentation');count++;
console.log('v17 painterly frame proportions: '+count+' static checks passed');
