import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
test('large physics atlases start loading only when an experiment is opened',()=>{
  const ensureStart=app.indexOf('function ensureExperimentTextures(lesson){');
  const ensureEnd=app.indexOf('\nconst heatWaterGlassArtwork=',ensureStart);
  assert.ok(ensureStart>0&&ensureEnd>ensureStart,'Lazy-load helper is present before regular toy assets');
  const before=app.slice(0,ensureStart);
  const helper=app.slice(ensureStart,ensureEnd);
  assert.doesNotMatch(before,/surfaceMaterialArtwork\.src\s*=\s*['"]\.\/assets\/physics-surface-atlas-v18\.png/,
    'Floor atlas must not download during landing-page initialization');
  assert.doesNotMatch(before,/apparatusMaterialArtwork\.src\s*=/,
    'Apparatus atlas must not download during landing-page initialization');
  assert.match(helper,/surfaceMaterialArtwork\.src\s*=\s*['"]\.\/assets\/physics-surface-atlas-v18\.png/);
  assert.match(helper,/EVERYDAY_IDS\.includes\(lesson\)/);
  assert.match(helper,/apparatusMaterialArtwork\.src\s*=\s*['"]\.\/assets\/physics-apparatus-materials-v01\.png/);
  const openLab=app.slice(app.indexOf('function openLab('),app.indexOf('function openLab(')+280);
  assert.match(openLab,/ensureExperimentTextures\(lesson\)/,
    'Entering the lab requests the relevant high resolution textures');
});

test('standard physics 2D fallback draws on a real material shelf',()=>{
  assert.match(app,/paintMechanicsPlatform\(ctx,surfaceMaterialArtwork,w,h\)/);
  assert.doesNotMatch(app,/\.svg(?:[?'"]|$)/,'No new vector stand-in assets');
});
