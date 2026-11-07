import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { goVoice, openingVoice, roundVoices, turnVoices } from '../voiceEvents.js';
import { voiceAssetName } from '../voicePlayer.js';

describe('실제 게임 음성 파일', () => {
  it('선공·특수 상황·정산에서 선택되는 모든 음원이 존재한다', () => {
    const cues = new Set([
      'start','stop','shake','double','hurry','decide','chongtong',
      openingVoice('human','playing'),openingVoice('computer','playing'),
      ...Array.from({length:11},(_,index)=>goVoice(index+1)),
      ...turnVoices({openingPpeok:{},specialEvents:[{kind:'ppeok'}]}),
      ...turnVoices({specialEvents:['bomb','sweep','ppeok','ppeok-capture','self-ppeok','jjok','ttadak'].map(kind=>({kind})),bonusCards:['b'],missionCompleted:true}),
      ...turnVoices({stolenPee:['p']},'human'),...turnVoices({stolenPee:['p']},'computer'),
      ...turnVoices({},'human',['청단','홍단','초단','고도리'].map(label=>({label}))),
      ...roundVoices({phase:'round-ended',winner:'human',settlement:{baks:['pi-bak','gwang-bak','meong-bak','go-bak'].map(code=>({code}))}}),
      ...roundVoices({phase:'round-ended',winner:'computer'}),
      ...roundVoices({phase:'round-ended',roundResult:'nagari'})
    ]);
    for (const id of cues) {
      const filename=voiceAssetName(id);
      const file=fileURLToPath(new URL(`../../public/assets/rani-voice-v3/${filename}.mp3`,import.meta.url));
      expect(existsSync(file),`${id} 음원 누락`).toBe(true);
      expect(statSync(file).size,`${id} 음원 비어 있음`).toBeGreaterThan(1000);
      if (id==='start') expect(statSync(file).size,'시작 대사 세 구간 확인').toBeGreaterThan(30000);
    }
  });
});
