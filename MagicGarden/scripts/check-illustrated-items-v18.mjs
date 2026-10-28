import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const src=readFileSync('src/main.ts','utf8');
const styles=readFileSync('src/illustrated-items-v18.css','utf8');
const name='public/assets/illustrated-items-v18.webp';
const bytes=readFileSync(name);
let tests=0;
assert.ok(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP','Painted atlas should be actual WebP');tests++;
assert.ok(['VP8X','VP8 ','VP8L'].includes(bytes.toString('ascii',12,16)),'WebP file header');tests++;
assert.ok(statSync(name).size<60_000,'Atlas exceeds lightweight mobile budget');tests++;
const atlasWidth=bytes.toString('ascii',12,16)==='VP8X'?bytes.readUIntLE(24,3)+1:0;
const atlasHeight=bytes.toString('ascii',12,16)==='VP8X'?bytes.readUIntLE(27,3)+1:0;
assert.deepEqual([atlasWidth,atlasHeight],[720,360],'Sheet must be exact 4x2 180px layout');tests++;
assert.ok(src.includes("import './illustrated-items-v18.css';"),'Artwork CSS imported');tests++;
assert.ok(src.indexOf("import './illustrated-items-v18.css';")>src.indexOf("import './button-proportions-v17.css';"),'Artwork CSS must load last');tests++;
for(const item of ['seed','berry','essence','egg','leafbud','bubble','sparkle','flower']) {
 assert.ok(styles.includes('.painted-'+item+'{'),'Missing actual cropped art for '+item);tests++;
}
for(const name of ['monsterHTML(kind)','itemHTML(item.art)','itemHTML(selected.art)','itemHTML(outputArt)','itemHTML(icon)','itemHTML(\'egg\')']){
 assert.ok(src.includes(name),'Painted item not connected to real gameplay: '+name);tests++;
}
assert.ok(src.includes("잎새콩:'leafbud'")&&src.includes("방울몽:'bubble'")&&src.includes("반짝몽:'sparkle'"),'Three monsters need distinct paintings');tests++;
assert.ok(!styles.includes('data:image/svg')&&!styles.includes('<svg'),'No SVG allowed');tests++;
console.log('v18 unique treasure & monster painted assets: '+tests+' checks passed');
