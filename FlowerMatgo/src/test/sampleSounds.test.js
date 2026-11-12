import {describe,it,expect,vi} from 'vitest';
import {createSampleSounds,CARD_SAMPLES,CUE_SAMPLES} from '../sampleSounds.js';

function setup(fetchFile=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}))) {
 const sources=[];
 const context={state:'running',destination:{},decodeAudioData:vi.fn(async()=>({sample:true})),
  createBufferSource:()=>{const source={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};sources.push(source);return source;},
  createGain:()=>({gain:{value:0},connect:vi.fn(),disconnect:vi.fn()})};
 return {sources,context,fetchFile,player:createSampleSounds({getContext:()=>context,getVolume:()=>.8,fetchFile,baseUrl:'/'})};
}
describe('sample effects',()=>{
 it('falls back while loading, then caches and plays without a second request',async()=>{
  const {player,fetchFile,sources}=setup();
  expect(player.play(CARD_SAMPLES.flip)).toBe(false);
  await vi.waitFor(()=>expect(player.play(CARD_SAMPLES.flip)).toBe(true));
  expect(fetchFile).toHaveBeenCalledTimes(1);expect(sources[0].start).toHaveBeenCalledOnce();
 });
 it('keeps the fallback on a failed download and stops playing samples on mute',async()=>{
  const failure=setup(vi.fn(async()=>({ok:false})));
  expect(failure.player.play(CUE_SAMPLES.go)).toBe(false);
  await vi.waitFor(()=>expect(failure.fetchFile).toHaveBeenCalledOnce());
  await Promise.resolve();expect(failure.player.play(CUE_SAMPLES.go)).toBe(false);
  const {player,sources}=setup();player.play(CUE_SAMPLES.go);
  await vi.waitFor(()=>expect(player.play(CUE_SAMPLES.go)).toBe(true));
  player.stop();expect(sources[0].stop).toHaveBeenCalledOnce();
 });
 it('limits simultaneous sounds rather than starting another source',async()=>{
  const {player,sources}=setup();player.play(CARD_SAMPLES.land);
  await vi.waitFor(()=>expect(player.play(CARD_SAMPLES.land)).toBe(true));
  for(let i=0;i<6;i++) player.play(CARD_SAMPLES.land);
  expect(sources).toHaveLength(4);
 });
 it('makes room for a decisive effect without letting ordinary taps interrupt it',async()=>{
  const {player,sources}=setup();player.play(CARD_SAMPLES.land);player.play(CUE_SAMPLES.win);
  await vi.waitFor(()=>expect(player.play(CARD_SAMPLES.land)).toBe(true));
  for(let i=0;i<3;i++)player.play(CARD_SAMPLES.land);
  expect(sources).toHaveLength(4);
  await vi.waitFor(()=>expect(player.play(CUE_SAMPLES.win)).toBe(true));
  expect(sources).toHaveLength(5);expect(sources[0].stop).toHaveBeenCalledOnce();
  player.play(CARD_SAMPLES.land);expect(sources).toHaveLength(5);
 });
 it('recovers its playback capacity if starting a source throws',async()=>{
  const {player,context,sources}=setup();player.play(CARD_SAMPLES.land);
  await vi.waitFor(()=>expect(player.play(CARD_SAMPLES.land)).toBe(true));
  const create=context.createBufferSource;
  context.createBufferSource=()=>{const source=create();source.start=()=>{throw Error('failed');};return source;};
  for(let i=0;i<6;i++) expect(player.play(CARD_SAMPLES.land)).toBe(false);
  context.createBufferSource=create;
  expect(player.play(CARD_SAMPLES.land)).toBe(true);
  expect(sources.at(-1).start).toHaveBeenCalledOnce();
 });
 it('retries a failed download after a bounded delay',async()=>{
  let time=1000, attempts=0;
  const {context}=setup();
  const player=createSampleSounds({getContext:()=>context,getVolume:()=>1,baseUrl:'/',now:()=>time,fetchFile:async()=>{attempts++;return attempts===1?{ok:false}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};}});
  expect(player.play('card_tap')).toBe(false);
  await vi.waitFor(()=>expect(attempts).toBe(1));
  await Promise.resolve();await Promise.resolve();
  player.play('card_tap');expect(attempts).toBe(1);
  time+=5001;player.play('card_tap');
  await vi.waitFor(()=>expect(player.play('card_tap')).toBe(true));
  expect(attempts).toBe(2);
 });
 it('updates the gain of currently playing effects when volume changes',async()=>{
  const {context}=setup();const gains=[];let volume=.8;
  context.createGain=()=>{const gain={gain:{value:0},connect:vi.fn(),disconnect:vi.fn()};gains.push(gain);return gain;};
  const player=createSampleSounds({getContext:()=>context,getVolume:()=>volume,baseUrl:'/',fetchFile:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});
  player.play('card_tap');await vi.waitFor(()=>expect(player.play('card_tap')).toBe(true));
  volume=.2;player.volumeChanged();expect(gains[0].gain.value).toBeCloseTo(.09);
 });
});
