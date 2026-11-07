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
  expect(audio.src).toContain('/rani-voice-v3/jjok.mp3');expect(audio.volume).toBe(.6);expect(audio.play).toHaveBeenCalledTimes(1);
  p.enqueue(['jjok']);audio.onended();expect(audio.src).toContain('/rani-voice-v3/sweep.mp3');expect(audio.play).toHaveBeenCalledTimes(2);
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
  expect(audio.src).toContain('/start-v4.mp3');
  p.clear();p.enqueue(['start'],{force:true});expect(audio.play).toHaveBeenCalledTimes(2);
 });
 it('keeps the current callout but replaces old queued cues with round results',()=>{
  FakeAudio.instances=[];let time=1000;
  const p=createVoicePlayer({getEnabled:()=>true,getVolume:()=>.8,AudioClass:FakeAudio,now:()=>time});
  p.unlock();p.enqueue(['jjok','take','bonus']);const audio=FakeAudio.instances[0];
  p.enqueue(['gobak','win'],{replacePending:true});time+=5000;audio.onended();
  expect(audio.src).toContain('/gobak.mp3');audio.onended();
  expect(audio.src).toContain('/win.mp3');expect(audio.play).toHaveBeenCalledTimes(3);
 });
});
