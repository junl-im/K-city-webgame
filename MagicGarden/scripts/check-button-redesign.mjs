import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const src=readFileSync('src/main.ts','utf8'),css=readFileSync('src/button-art-v16.css','utf8');
const names=['region-cream','badge-wood','tab-paper','tab-selected','action-rose','action-gold','action-sage'];
let checks=0;
assert.ok(src.includes("import './button-art-v16.css';"));checks++;
assert.ok(src.indexOf("import './button-art-v16.css';")>src.indexOf("import './visual-polish.css';"));checks++;
for(const name of names){
 const p='public/assets/ui-v16-'+name+'.png';
 const b=readFileSync(p);
 assert.ok(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));checks++;
 assert.ok(statSync(p).size<60000);checks++;
 assert.ok(css.includes('ui-v16-'+name+'.png'));checks++;
}
for(const t of ['#app .area{','#app .bottom-hud button{','#app .garden-tabs .garden-tab{','#app .modal .link-button{','#app .modal-head{','#app .creek-visit{','border-image:none','@media(max-width:760px)','@media(max-width:370px)','prefers-reduced-motion','focus-visible']){
 assert.ok(css.includes(t),'Missing role/contract: '+t);checks++;
}
assert.ok(!css.includes('data:image/svg')&&!css.includes('<svg'));checks++;
console.log('v16 painted button contracts passed ('+checks+' assertions)');
