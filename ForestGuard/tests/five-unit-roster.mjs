import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const layout=src.slice(src.indexOf('    layoutHeroSprites(){'),src.indexOf('    resizeBattleCamera(){'));
const recruit=src.slice(src.indexOf('    recruitHero(id){'),src.indexOf('    chooseFirstCompanion(id,automatic=false){'));
const Fake=new Function('HERO_RECRUIT_ORDER','HERO_POSITIONS','V','renderSlots','showBanner','HEROES',
  'return class FakeScene{'+layout+recruit+'}')(
  [1,3,0,4],[58,134,210,286,362],{trigger(){}},()=>{},()=>{},
  {fox:{name:'Fox'},bear:{name:'Bear'},rabbit:{name:'Rabbit'},cat:{name:'Cat'}});
function sprite(x,y){return {x,y,active:true,displayWidth:0,
  setPosition(x,y){this.x=x;this.y=y;return this},
  setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this},
  setDepth(d){this.depth=d;return this}}}
const s=new Fake();
Object.assign(s,{heroIds:[null,null,'fox',null,null],heroSprites:[null,null,sprite(210,568),null,null],
  attackTimes:[0,0,0,0,0],gameClock:0,
  add:{image(x,y){return sprite(x,y)},ellipse(x,y){return {setDepth(){return this},destroy(){}}}},
  tweens:{add(){}}
});
s.layoutHeroSprites();
assert.equal(s.heroSprites[2].displayWidth,94,'Starting fox retains a large portrait');
assert.equal(s.recruitHero('bear'),true);
assert.deepEqual(s.heroIds,[null,'bear','fox',null,null]);
assert.equal(s.recruitHero('bear'),false,'Must diversify before duplicate species');
assert.equal(s.recruitHero('rabbit'),true);
assert.deepEqual(s.heroIds,[null,'bear','fox','rabbit',null]);
assert.equal(s.heroSprites[2].displayWidth,86,'Three characters resize');
assert.equal(s.recruitHero('cat'),true);
assert.deepEqual(s.heroIds,['cat','bear','fox','rabbit',null]);
assert.equal(s.heroSprites[2].displayWidth,79,'Four characters resize');
assert.equal(s.recruitHero('rabbit'),true);
assert.deepEqual(s.heroIds,['cat','bear','fox','rabbit','rabbit']);
assert.ok(s.heroSprites.every(Boolean),'Every one of five seats has a rendered defender');
assert.equal(s.heroSprites[2].displayWidth,72,'Five characters fit smaller artwork');
assert.equal(s.recruitHero('bear'),false,'A full formation cannot take another unit');
assert.equal(new Set(s.heroIds).size,4,'Five seats still preserve four different species');
console.log('ForestGuard 1-to-5 roster, centered fox and duplicate cap: PASS');
