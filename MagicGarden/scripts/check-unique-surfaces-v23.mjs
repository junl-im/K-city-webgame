import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const file=(name)=>readFileSync(new URL('../'+name,import.meta.url));
const css=file('src/unique-surfaces-v23.css').toString('utf8');
const main=file('src/main.ts').toString('utf8');
const imports=[...main.matchAll(/import '\.\/[^']+\.css';/g)].map(x=>x[0]);
if(!imports.at(-1)?.includes('unique-surfaces-v23.css'))throw Error('v23 UI skin must load last');
if(!css.includes('border-image:none!important'))throw Error('Shared border-image not fully disabled');
if(/background-size\s*:\s*100%\s+100%/i.test(css))throw Error('Stretched art source reintroduced');
if(/ui-v2[34]-[^']+\.png/.test(css))throw Error('Unoptimized UI PNG still referenced');
const names=[
 ...['town','farm','lab','nursery','menu-bag','menu-map','menu-book','menu-help','hud-brand','hud-seed','hud-berry','hud-guide','creek','modal-title','close'].map(x=>'ui-v23-'+x),
 ...['brew','craft-egg','hatch','save-export','incubate','save-import','confirm-import','cancel-import','zone-town','zone-farm','zone-lab','zone-nursery','open-book','creek-toggle'].map(x=>'ui-v24-action-'+x),
 ...['all','crop','magic','friends'].map(x=>'ui-v24-tab-'+x)
];
const sourceHashes=new Set(),optimizedHashes=new Set();
let sourceBytes=0,optimizedBytes=0;
for(const name of names){
 const png=file('public/assets/'+name+'.png');
 const webp=file('public/assets/'+name+'.webp');
 if(png.subarray(1,4).toString()!=='PNG')throw Error('Not PNG: '+name);
 if(webp.subarray(0,4).toString()!=='RIFF'||webp.subarray(8,12).toString()!=='WEBP')throw Error('Not WebP: '+name);
 const srcHash=createHash('sha256').update(png).digest('hex');
 const webpHash=createHash('sha256').update(webp).digest('hex');
 if(sourceHashes.has(srcHash)||optimizedHashes.has(webpHash))throw Error('Duplicate painting: '+name);
 sourceHashes.add(srcHash);optimizedHashes.add(webpHash);
 if(!css.includes("url('/assets/"+name+".webp')"))throw Error('WebP art not referenced: '+name);
 if(webp.length>=png.length)throw Error('Optimization regression: '+name);
 sourceBytes+=png.length;optimizedBytes+=webp.length;
}
if(names.length!==33)throw Error('Wrong inventory size');
if(optimizedBytes>sourceBytes*.25)throw Error('Optimized UI budget exceeded');
console.log('33 unique transparent WebP paintings verified: '+(sourceBytes/1048576).toFixed(1)+' MiB PNG source -> '+(optimizedBytes/1048576).toFixed(1)+' MiB WebP runtime');
