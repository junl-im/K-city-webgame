import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('src/unique-surfaces-v23.css');
const main=read('src/main.ts');
const assets=[
 'town','farm','lab','nursery',
 'menu-bag','menu-map','menu-book','menu-help',
 'hud-brand','hud-seed','hud-berry','hud-guide',
 'creek','modal-title','close'
];
if(!main.includes("import './unique-surfaces-v23.css';"))throw Error('v23 sheet not imported');
const imports=[...main.matchAll(/import '\.\/[^']+\.css';/g)].map(x=>x[0]);
if(!imports.at(-1)?.includes('unique-surfaces-v23.css'))throw Error('v23 overrides must load last');
if(/background-size\s*:\s*100%\s+100%/i.test(css))throw Error('Stretched image size reintroduced');
if(!css.includes('border-image:none!important'))throw Error('Legacy nine-slice frame not disabled');
const hashes=new Set();
for(const name of assets){
 const p='public/assets/ui-v23-'+name+'.png';
 const content=readFileSync(new URL('../'+p,import.meta.url));
 if(content.subarray(1,4).toString()!=='PNG')throw Error('Not a PNG '+p);
 if(content.length<1000)throw Error('Suspiciously small PNG '+p);
 const hash=createHash('sha256').update(content).digest('hex');
 if(hashes.has(hash))throw Error('Duplicate art reused: '+name);
 hashes.add(hash);
 if(!css.includes("url('/assets/ui-v23-"+name+".png')"))throw Error('Painting not mapped: '+name);
}
const actionHashes=new Set(hashes);
for(const name of ['brew','craft-egg','hatch','save-export']){
 const p='public/assets/ui-v24-action-'+name+'.png';
 const content=readFileSync(new URL('../'+p,import.meta.url));
 if(content.subarray(1,4).toString()!=='PNG')throw Error('Not a PNG '+p);
 const hash=createHash('sha256').update(content).digest('hex');
 if(actionHashes.has(hash))throw Error('Duplicate art reused: '+name);
 actionHashes.add(hash);
 if(!css.includes("url('/assets/ui-v24-action-"+name+".png')"))throw Error('Action art not mapped: '+name);
}
console.log('v24 unique art: 19 distinct PNGs and no stretched background frames');
