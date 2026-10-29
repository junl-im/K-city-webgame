import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const REV='20261029-v281support';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const importedPaths=source=>[...source.matchAll(/from\s+['"]([.][/][^'"]+)['"]/g)].map(match=>match[1]);

test('app and nested drawing modules use one release revision',()=>{
  for(const name of ['app.js','animated-experiments.mjs']){
    const imports=importedPaths(read(name));
    assert.ok(imports.length>0,name+' imports');
    for(const imp of imports)assert.ok(imp.endsWith('?rev='+REV),name+' uses stale module '+imp);
  }
});

test('HTML stylesheet and entry module share versioned filenames',()=>{
  const html=read('index.html');
  assert.match(html,new RegExp('styles\\.css\\?rev='+REV));
  assert.match(html,new RegExp('app\\.js\\?rev='+REV));
});

test('no new vector raster fallbacks hide an asset-loading defect',()=>{
  const html=read('index.html');
  assert.ok(!html.includes('<svg'), 'Do not add inline SVG as a fallback for authored raster artwork');
});
