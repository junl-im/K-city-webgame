import {describe,it,expect,vi} from 'vitest';
import {createVoicePlayer} from '../voicePlayer.js';

class FakeAudio {
 static instances=[];
 constructor(){this.play=vi.fn(()=>Promise.resolve());this.pause=vi.fn();this.load=vi.fn();this.removeAttribute=vi.fn();FakeAudio.instances.push(this);}
}
describe('game voice playback',()=>{
 it('waits for a gesture, queues clips without overlap and suppresses repeated cues',()=>{
  FakeAudio.instances=[];let t=10000;
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.6,AudioClass:FakeAudio,now:()=>t});
  p.enqueue(['jjok']);expect(FakeAudio.instances).toHaveLength(0);
  p.unlock();p.enqueue(['jjok','sweep']);const audio=FakeAudio.instances[0];
  expect(audio.src).toContain('/rani-voice-v4/jjok.mp3');expect(audio.volume).toBe(.6);expect(audio.play).toHaveBeenCalledTimes(1);
  p.enqueue(['jjok']);audio.onended();expect(audio.src).toContain('/rani-voice-v4/sweep.mp3');expect(audio.play).toHaveBeenCalledTimes(2);
  t+=9000;audio.onended();expect(audio.play).toHaveBeenCalledTimes(2);
 });
 it('cancels queued speech and does not play while voice is disabled',()=>{
  FakeAudio.instances=[];let enabled=true;
  const p=createVoicePlayer({getEnabled:()=>enabled,getVolume:()=>.8,AudioClass:FakeAudio});p.unlock();p.enqueue(['go1','go2']);
  const audio=FakeAudio.instances[0];p.clear();expect(audio.pause).toHaveBeenCalledOnce();expect(audio.onended).toBeNull();
  enabled=false;p.enqueue(['go3']);expect(audio.play).toHaveBeenCalledOnce();
 });
 it('allows an explicit preview to replay immediately',()=>{
  FakeAudio.instances=[];
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.8,AudioClass:FakeAudio,now:()=>10000});
  p.unlock();p.enqueue(['start']);const audio=FakeAudio.instances[0];
  expect(audio.src).toContain('/start-v5.mp3');
  p.clear();p.enqueue(['start'],{force:true});expect(audio.play).toHaveBeenCalledTimes(2);
 });
 it('uses the revised opening announcement rather than an old cached file',()=>{
  FakeAudio.instances=[];
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.8,AudioClass:FakeAudio});
  p.unlock();p.enqueue(['first_human']);
  expect(FakeAudio.instances[0].src).toContain('/first_human-v2.mp3');
 });
 it('keeps the current callout and only the latest waiting result',()=>{
  FakeAudio.instances=[];let time=1000;
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.8,AudioClass:FakeAudio,now:()=>time});
  p.unlock();p.enqueue(['jjok','take','bonus']);const audio=FakeAudio.instances[0];
  p.enqueue(['gobak','win'],{replacePending:true});time+=200;audio.onended();
  expect(audio.src).toContain('/win-v2.mp3');expect(audio.play).toHaveBeenCalledTimes(2);
 });
 it('replaces an older waiting cue when a newer event arrives',()=>{
  FakeAudio.instances=[];let time=1000;
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.8,AudioClass:FakeAudio,now:()=>time});
  p.unlock();p.enqueue(['jjok']);const audio=FakeAudio.instances[0];
  p.enqueue(['take']);time+=700;p.enqueue(['sweep']);audio.onended();
  expect(audio.src).toContain('/sweep.mp3');expect(audio.play).toHaveBeenCalledTimes(2);
 });
 it('drops a waiting cue that is already too old',()=>{
  FakeAudio.instances=[];let time=1000;
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.8,AudioClass:FakeAudio,now:()=>time});
  p.unlock();p.enqueue(['jjok']);const audio=FakeAudio.instances[0];p.enqueue(['sweep']);time+=2600;audio.onended();
  expect(audio.play).toHaveBeenCalledTimes(1);
 });
});
