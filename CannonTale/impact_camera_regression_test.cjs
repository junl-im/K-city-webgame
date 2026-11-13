// CannonTale v6.30 — camera/effects regression without a separate physics model.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function section(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing original game source: '+start);
 return html.slice(a,b);
}
const code=`
 const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
 ${section(' function impactCameraOffset(',' function resize(')}
 ({impactCameraOffset,followImpactCamera})
`;
const {impactCameraOffset,followImpactCamera}=vm.runInNewContext(code,{});
assert.deepEqual({x:impactCameraOffset(0,0).x,y:impactCameraOffset(0,0).y},{x:0,y:0},
 'No recoil when vibration is off');
for(const trauma of [1,10,26,200]){
 const a=impactCameraOffset(.134,trauma);
 const b=impactCameraOffset(.134,trauma);
 assert.equal(a.x,b.x,'Two identical render frames cannot randomly jump');
 assert.equal(a.y,b.y,'Two identical render frames cannot randomly jump');
 assert(Number.isFinite(a.x)&&Number.isFinite(a.y));
 assert(Math.abs(a.x)<=18&&Math.abs(a.y)<=11,
  'Shaking must remain limited on a narrow mobile viewport');
}
for(const dt of [1/120,1/60,1/30,.05]){
 const next=followImpactCamera(0,1000,dt);
 assert(next>0&&next<=32*dt*60+.0001,
  'A large destination change must never whip the screen across a frame');
}
function followFor(seconds,fps){
 let camera=0;
 for(let i=0;i<seconds*fps;i++)camera=followImpactCamera(camera,450,1/fps);
 return camera;
}
const perHz=[30,60,120].map(fps=>followFor(.45,fps));
assert(Math.max(...perHz)-Math.min(...perHz)<1,
 'Tracking over the same wall time should be nearly equal at 30/60/120Hz');
assert(perHz[0]>390&&perHz[0]<450,'The camera should approach smoothly, not snap');

// These references must come from real CannonTale stages, not a test-only
// copy. No global wind/sight/angle values are edited by the v6.30 effects.
assert(html.includes('const focusRank=critical?3:direct?2:big?1:0;'),
 'A split splash should never override a stronger center hit');
assert(html.includes('game.impactStreaks=game.impactStreaks.slice(-12);'),
 'A long duel must bound concurrent cinematic fragments');
assert(html.includes('game.impactStreaks=game.impactStreaks.filter(streak=>streak.life>0);'),
 'Expired impact pressure lines must be freed');
assert(html.includes('game.impactFocus=null;game.cameraFrameDt=1/60;game.actorAnim='),
 'Opening a new match must reset cinematic focus and temporal camera state');
assert(html.includes('game.impactStreaks=[];game.impactFocus=null;game.debris=[];'),
 'Leaving to the menu must clear all impact memories');
assert(html.includes('game.shake*=Math.pow(.82,dt*60);'),
 'Trauma should decay on physical elapsed time');
assert(html.includes("const cinematicFocus=game.impactFocus?.life>0"),
 'Cinematic focus must originate in the real impact event');
assert(html.includes("const focus=active?active.x-visible*.43"),
 'An active projectile must take camera priority over lingering effects');
assert(html.includes('game.cameraFrameDt=elapsed;'),
 'Rendered time must not be an assumed 60Hz');
assert(html.includes("drawImpactStreaks();"),
 'Directional pressure streaks must be in the live drawing layer');
assert(!html.match(/<svg[\s>]/i),'CannonTale is a no-SVG game');
console.log('CannonTale v6.30 impact/camera regression OK: '+JSON.stringify({camera30:perHz[0],camera60:perHz[1],camera120:perHz[2]}));
