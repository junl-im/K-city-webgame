import { audioTrackUrls } from '../data/assetManifest';

export type AudioScene = 'title' | 'town' | 'field' | 'boss';
export type SfxName = 'ui' | 'confirm' | 'attack' | 'hit' | 'skill' | 'heal' | 'reward' | 'level' | 'error' | 'boss' | 'buy' | 'enhance';

export interface AudioSettings {
  bgm: boolean;
  sfx: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
}

const STORAGE_KEY = 'soul-online-audio-settings-v3';

const DEFAULT_SETTINGS: AudioSettings = {
  bgm: true,
  sfx: true,
  masterVolume: 0.72,
  bgmVolume: 0.38,
  sfxVolume: 0.72
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

class AudioService {
  private context: AudioContext | null = null;
  private settings: AudioSettings = this.loadSettings();
  private scene: AudioScene = 'title';
  private bgmNodes: { oscillator: OscillatorNode; gain: GainNode; filter: BiquadFilterNode }[] = [];
  private bgmGain: GainNode | null = null;
  private bgmElement: HTMLAudioElement | null = null;
  private pulseTimer = 0;
  private melodyStep = 0;
  private unlocked = false;
  private bgmToken = 0;
  private mode: 'file' | 'synth' | 'off' = 'off';

  getSettings() {
    return { ...this.settings };
  }

  getBgmMode() {
    return this.mode;
  }

  isUnlocked() {
    return this.unlocked;
  }

  async unlock() {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor && !this.context) this.context = new Ctor({ latencyHint: 'interactive' });
    if (this.context?.state === 'suspended') await this.context.resume().catch(() => undefined);
    this.unlocked = !this.context || this.context.state === 'running';
    if (this.unlocked) this.play('ui');
    if (this.unlocked && this.settings.bgm) this.startBgm(this.scene);
    return this.unlocked;
  }

  setScene(scene: AudioScene) {
    this.scene = scene;
    if (this.settings.bgm && this.unlocked) this.startBgm(scene);
  }

  toggleBgm() {
    this.settings.bgm = !this.settings.bgm;
    this.saveSettings();
    if (this.settings.bgm) this.startBgm(this.scene);
    else this.stopBgm();
    return this.getSettings();
  }

  toggleSfx() {
    this.settings.sfx = !this.settings.sfx;
    this.saveSettings();
    if (this.settings.sfx) this.play('confirm');
    return this.getSettings();
  }

  setMasterVolume(value: number) {
    this.settings.masterVolume = clamp01(value);
    this.saveSettings();
    this.updateBgmGain();
  }

  setBgmVolume(value: number) {
    this.settings.bgmVolume = clamp01(value);
    this.saveSettings();
    this.updateBgmGain();
  }

  setSfxVolume(value: number) {
    this.settings.sfxVolume = clamp01(value);
    this.saveSettings();
  }

  play(name: SfxName) {
    if (!this.settings.sfx || !this.context || !this.unlocked) return;
    const now = this.context.currentTime;
    const master = this.context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.settings.masterVolume * this.settings.sfxVolume), now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + this.sfxDuration(name));
    master.connect(this.context.destination);

    const makeTone = (freq: number, offset: number, duration: number, type: OscillatorType = 'sine', gain = 0.46) => {
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const g = this.context.createGain();
      const f = this.context.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * this.sfxEndRatio(name)), now + offset + duration);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(name === 'hit' || name === 'attack' ? 1800 : 2600, now + offset);
      g.gain.setValueAtTime(0.0001, now + offset);
      g.gain.exponentialRampToValueAtTime(gain, now + offset + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      osc.connect(f).connect(g).connect(master);
      osc.start(now + offset);
      osc.stop(now + offset + duration + 0.02);
    };

    if (name === 'ui') makeTone(520, 0, 0.07, 'triangle', 0.18);
    else if (name === 'confirm') { makeTone(520, 0, 0.07, 'triangle', 0.22); makeTone(780, 0.055, 0.09, 'triangle', 0.18); }
    else if (name === 'attack') { makeTone(180, 0, 0.12, 'sawtooth', 0.13); makeTone(920, 0.015, 0.07, 'triangle', 0.10); }
    else if (name === 'hit') { makeTone(90, 0, 0.11, 'sawtooth', 0.20); makeTone(220, 0.02, 0.08, 'triangle', 0.15); }
    else if (name === 'skill') { makeTone(420, 0, 0.2, 'triangle', 0.22); makeTone(840, 0.05, 0.22, 'sine', 0.18); }
    else if (name === 'heal') { makeTone(392, 0, 0.15, 'sine', 0.18); makeTone(659, 0.08, 0.18, 'sine', 0.18); makeTone(988, 0.16, 0.2, 'sine', 0.11); }
    else if (name === 'reward') { makeTone(523, 0, 0.1, 'triangle', 0.18); makeTone(784, 0.075, 0.12, 'triangle', 0.16); makeTone(1046, 0.16, 0.16, 'sine', 0.12); }
    else if (name === 'level') { makeTone(392, 0, 0.16, 'triangle', 0.18); makeTone(523, 0.12, 0.16, 'triangle', 0.18); makeTone(784, 0.24, 0.24, 'sine', 0.16); }
    else if (name === 'error') makeTone(140, 0, 0.18, 'sawtooth', 0.14);
    else if (name === 'boss') { makeTone(70, 0, 0.34, 'sawtooth', 0.18); makeTone(110, 0.06, 0.34, 'triangle', 0.10); }
    else if (name === 'buy') { makeTone(660, 0, 0.08, 'triangle', 0.14); makeTone(990, 0.07, 0.09, 'sine', 0.11); }
    else if (name === 'enhance') { makeTone(260, 0, 0.12, 'triangle', 0.16); makeTone(980, 0.08, 0.22, 'sine', 0.18); }

    window.setTimeout(() => master.disconnect(), (this.sfxDuration(name) + 0.08) * 1000);
  }

  private startBgm(scene: AudioScene) {
    if (!this.unlocked || !this.settings.bgm) return;
    this.stopBgm();
    const token = ++this.bgmToken;
    void this.startFileBgm(scene, token);
  }

  private async startFileBgm(scene: AudioScene, token: number) {
    const url = audioTrackUrls[scene];
    try {
      const audio = new Audio(new URL(url, window.location.href).href);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.bgmVolumeValue();
      this.bgmElement = audio;
      await audio.play();
      if (token !== this.bgmToken || !this.settings.bgm) {
        audio.pause();
        return;
      }
      this.mode = 'file';
    } catch {
      if (token === this.bgmToken) this.startSynthBgm(scene);
    }
  }

  private startSynthBgm(scene: AudioScene) {
    if (!this.context || !this.unlocked || !this.settings.bgm) return;
    const now = this.context.currentTime;
    this.melodyStep = 0;
    this.bgmGain = this.context.createGain();
    this.bgmGain.gain.setValueAtTime(0.0001, now);
    this.bgmGain.connect(this.context.destination);
    this.updateBgmGain(1.2);
    this.mode = 'synth';

    const palette = this.scenePalette(scene);
    this.bgmNodes = palette.map((freq, index) => {
      const oscillator = this.context!.createOscillator();
      const filter = this.context!.createBiquadFilter();
      const gain = this.context!.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(scene === 'boss' ? 260 : 420 + index * 90, now);
      filter.Q.setValueAtTime(0.38, now);
      gain.gain.setValueAtTime(index === 0 ? 0.006 : index === 1 ? 0.003 : 0.002, now);
      oscillator.connect(filter).connect(gain).connect(this.bgmGain!);
      oscillator.start(now + index * 0.04);
      return { oscillator, gain, filter };
    });

    this.scheduleBgmPulse();
  }

  private stopBgm() {
    this.bgmToken += 1;
    this.mode = 'off';
    if (this.bgmElement) {
      try {
        this.bgmElement.pause();
        this.bgmElement.currentTime = 0;
        this.bgmElement.src = '';
      } catch {}
      this.bgmElement = null;
    }
    if (this.pulseTimer) window.clearInterval(this.pulseTimer);
    this.pulseTimer = 0;
    const now = this.context?.currentTime || 0;
    for (const node of this.bgmNodes) {
      try {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), now);
        node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        node.oscillator.stop(now + 0.42);
      } catch {}
    }
    this.bgmNodes = [];
    if (this.bgmGain) {
      const gain = this.bgmGain;
      window.setTimeout(() => gain.disconnect(), 520);
    }
    this.bgmGain = null;
  }

  private updateBgmGain(fade = 0.08) {
    if (this.bgmElement) this.bgmElement.volume = this.bgmVolumeValue();
    if (!this.bgmGain || !this.context) return;
    const value = Math.max(0.0001, this.bgmVolumeValue() * 0.12);
    const now = this.context.currentTime;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(Math.max(0.0001, this.bgmGain.gain.value), now);
    this.bgmGain.gain.exponentialRampToValueAtTime(value, now + fade);
  }

  private bgmVolumeValue() {
    return clamp01(this.settings.masterVolume * this.settings.bgmVolume);
  }

  private scheduleBgmPulse() {
    if (this.pulseTimer) window.clearInterval(this.pulseTimer);
    this.pulseTimer = window.setInterval(() => {
      if (!this.context || !this.bgmGain || !this.bgmNodes.length) return;
      const now = this.context.currentTime;
      const scale = this.sceneScale(this.scene);
      const chord = this.scenePalette(this.scene);
      const chordPhase = Math.floor(this.melodyStep / 8) % 4;

      for (const [index, node] of this.bgmNodes.entries()) {
        const target = chord[index] * [1, chordPhase === 1 ? 1.125 : 1, chordPhase === 2 ? 1.2 : 1, chordPhase === 3 ? 0.875 : 1][Math.min(3, chordPhase)];
        node.oscillator.frequency.exponentialRampToValueAtTime(Math.max(44, target), now + 1.1);
        node.filter.frequency.exponentialRampToValueAtTime(this.scene === 'boss' ? 300 : 480 + index * 80, now + 0.9);
      }

      const melody = scale[this.melodyStep % scale.length];
      const harmony = scale[(this.melodyStep + 3) % scale.length] * 0.5;
      this.playBgmNote(melody, 0, 0.72, this.scene === 'boss' ? 0.020 : 0.016);
      if (this.melodyStep % 4 === 0) this.playBgmNote(harmony, 0.20, 1.15, this.scene === 'boss' ? 0.014 : 0.010);
      this.melodyStep += 1;
    }, this.scene === 'boss' ? 1080 : 1180);
  }

  private playBgmNote(freq: number, offset: number, duration: number, gainValue: number) {
    if (!this.context || !this.bgmGain) return;
    const now = this.context.currentTime + offset;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * (this.scene === 'boss' ? 0.992 : 1.002), now + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.scene === 'boss' ? 560 : 1450, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(filter).connect(gain).connect(this.bgmGain);
    osc.start(now);
    osc.stop(now + duration + 0.04);
    window.setTimeout(() => gain.disconnect(), (duration + offset + 0.12) * 1000);
  }

  private scenePalette(scene: AudioScene) {
    if (scene === 'town') return [146.83, 220.0, 293.66];
    if (scene === 'field') return [123.47, 185.0, 277.18];
    if (scene === 'boss') return [61.74, 92.5, 123.47];
    return [110.0, 164.81, 246.94];
  }

  private sceneScale(scene: AudioScene) {
    if (scene === 'town') return [587.33, 659.25, 739.99, 880.0, 987.77, 880.0, 739.99, 659.25, 587.33, 493.88, 440.0, 493.88];
    if (scene === 'field') return [493.88, 554.37, 659.25, 739.99, 830.61, 739.99, 659.25, 554.37, 493.88, 415.3, 369.99, 415.3];
    if (scene === 'boss') return [220.0, 246.94, 293.66, 329.63, 369.99, 329.63, 293.66, 246.94, 220.0, 185.0, 164.81, 185.0];
    return [440.0, 493.88, 554.37, 659.25, 739.99, 659.25, 554.37, 493.88, 440.0, 369.99, 329.63, 369.99];
  }

  private sfxDuration(name: SfxName) {
    if (name === 'level') return 0.54;
    if (name === 'boss') return 0.42;
    if (name === 'skill' || name === 'heal' || name === 'enhance') return 0.34;
    if (name === 'reward') return 0.36;
    return 0.18;
  }

  private sfxEndRatio(name: SfxName) {
    if (name === 'attack' || name === 'hit' || name === 'boss' || name === 'error') return 0.52;
    return 1.35;
  }

  private loadSettings(): AudioSettings {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<AudioSettings>;
      return {
        bgm: typeof parsed.bgm === 'boolean' ? parsed.bgm : DEFAULT_SETTINGS.bgm,
        sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : DEFAULT_SETTINGS.sfx,
        masterVolume: clamp01(parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume),
        bgmVolume: clamp01(parsed.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume),
        sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume)
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }
}

export const audioService = new AudioService();
