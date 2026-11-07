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
  expect(audio.src).toContain('/rani-voice/jjok.mp3');expect(audio.volume).toBe(.6);expect(audio.play).toHaveBeenCalledTimes(1);
  p.enqueue(['jjok']);audio.onended();expect(audio.src).toContain('/rani-voice/sweep.mp3');expect(audio.play).toHaveBeenCalledTimes(2);
  t+=9000;audio.onended();expect(audio.play).toHaveBeenCalledTimes(2);
 });
 it('cancels queued speech and does not play while voice is disabled',()=>{
  FakeAudio.instances=[];let enabled=true;
  const p=createVoicePlayer({getEnabled:()=>enabled,getVolume:()=>.8,AudioClass:FakeAudio});p.unlock();p.enqueue(['go1','go2']);
  const audio=FakeAudio.instances[0];p.clear();expect(audio.pause).toHaveBeenCalledOnce();expect(audio.onended).toBeNull();
  enabled=false;p.enqueue(['go3']);expect(audio.play).toHaveBeenCalledOnce();
 });
});
