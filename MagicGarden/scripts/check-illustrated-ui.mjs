import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root=process.cwd();
const page=readFileSync(join(root,'index.html'),'utf8');
const script=readFileSync(join(root,'src/main.ts'),'utf8');
const art=readFileSync(join(root,'src/theme-art.css'),'utf8');
let count=0;
for(const id of ['town-button','farm-button','lab-button','nursery-button','bag-button','map-button','book-button','help-button','modal-close','seed-count','berry-count']){
 assert.ok(page.includes('id="'+id+'"'),id+' missing');count++;
}
for(const icon of ['town','farm','lab','nursery','bag','map','book','help','berry','close']){
 assert.ok(art.includes('[data-art="'+icon+'"]'),icon+' raster icon mapping missing');count++;
}
for(const target of ['contextmenu','dragstart','selectstart','setGuideIllustrations','illustratedText','theme-art.css']){
 assert.ok(script.includes(target),target+' interaction protection absent');count++;
}
for(const name of ['ui-icons-v1.webp','ui-parchment-v1.webp','ui-button-green-v1.webp','ui-button-pink-v1.webp','ui-button-wood-v1.webp','ui-scroll-track-v1.webp','ui-scroll-thumb-v1.webp']){
 const bytes=readFileSync(join(root,'public/assets',name));
 assert.ok(bytes.byteLength>=200 && bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP',name+' raster is invalid');
 count++;
}
assert.ok(art.includes('::-webkit-scrollbar-thumb') && art.includes('scrollbar-color'));count++;
assert.ok(art.includes('touch-action:pan-y') && art.includes('overscroll-behavior:contain'));count++;
assert.equal(/<span[^>]*>🎒|<span[^>]*>🌷/.test(page),false,'old emoji menu remains');count++;
console.log('Illustrated UI guard passed ('+count+' cases).');
