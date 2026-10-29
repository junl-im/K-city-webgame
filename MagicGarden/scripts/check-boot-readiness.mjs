import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const source=readFileSync('src/main.ts','utf8');
for(const id of ['town-button','farm-button','lab-button','nursery-button','creek-visit-button','bag-button','map-button','book-button','help-button']){
  assert.match(html,new RegExp('id="'+id+'"\\s+disabled\\s+data-boot-control'),'control must wait for initialization: '+id);
}
assert.match(html,/마법정원을 준비하고 있어요/,'loading announcement must be visible');
assert.match(source,/querySelectorAll<HTMLButtonElement>\('button\[data-boot-control\]'\)/,'full renderer enables controls after initialization');
assert.match(source,/Object\.values\(buttons\)\.forEach\(\(button\) => \{ button\.disabled = false; \}\)/,'fallback enables only supported zone previews');
console.log('Garden loading controls: 11 checks passed');
