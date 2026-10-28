import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/button-proportions-v17.css', 'utf8');
const previous = readFileSync('src/button-art-v16.css', 'utf8');
let checks = 0;

assert.ok(source.includes("import './button-proportions-v17.css';")); checks++;
assert.ok(source.indexOf("import './button-proportions-v17.css';") > source.indexOf("import './button-art-v16.css';"),
  'Finishing CSS must override the older ornate button skins'); checks++;

for (const selector of ['#app .area{', '#app .garden-tabs .garden-tab{', '#app .modal .link-button{',
  '#app .modal-head{', '#app .creek-visit{', '#app .bottom-hud button{']) {
  assert.ok(css.includes(selector), 'Missing button role: ' + selector); checks++;
}
for (const painting of ['region-cream','tab-paper','tab-selected','action-sage','action-rose','action-gold','badge-wood']) {
  assert.ok(css.includes('ui-v16-' + painting + '.png'), 'Missing approved artwork: ' + painting); checks++;
}
for (const feature of ['background-size:cover', 'background-position:center', 'border-image:none',
  'border-radius:12px', 'min-height:44px', '@media(max-width:760px)', '@media(max-width:370px)',
  'prefers-reduced-motion', '#app #modal-close', '#app .bottom-hud button small{']) {
  assert.ok(css.includes(feature), 'Missing v22 quiet-frame feature: ' + feature); checks++;
}
for (const distorted of ['border-image-source:', 'border-image-slice:', 'border-image-width:',
  'background-size:100% 100%', 'border-width:12px', 'border-width:22px']) {
  assert.ok(!css.includes(distorted), 'Avoid ornamental border stretching: ' + distorted); checks++;
}
assert.ok(previous.includes('ui-v16-region-cream.png'), 'Keep the source painted art in v16 CSS'); checks++;
assert.ok(!css.includes('data:image/svg') && !css.includes('<svg'), 'No SVG anywhere'); checks++;

console.log('v22 calm hand-painted button borders: ' + checks + ' static checks passed.');
