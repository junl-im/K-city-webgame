import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/main.ts','utf8');
const css=readFileSync('src/illustrated-content.css','utf8');
let count=0;
for(const token of ['function openBag()','function openLab()','function openNursery()','function openBook()','class="garden-bag"','class="garden-recipe"','class="garden-scene garden-nursery"','class="garden-discoveries"','id="hatch-live-status"','id="hatch-progress-fill"',"button.innerHTML = iconHTML('egg')","saveData.monsters.map"]) {
 assert.ok(source.includes(token),'Missing content UI: '+token);count++;
}
for(const token of ['.garden-slots','.garden-recipe-visual','.garden-nursery','.garden-egg.awakening','.garden-tabs','@media(max-width:600px)','prefers-reduced-motion']) {
 assert.ok(css.includes(token),'Missing style: '+token);count++;
}
assert.ok(source.includes("saveData.berries >= 3") || source.includes("saveData.berries < 3"));count++;
console.log('Illustrated content contract passed ('+count+' checks).');
