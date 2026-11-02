import {readFileSync, statSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

describe('꽃 카운트다운 이미지',()=>{
  it('투명 PNG 자산과 사전 로딩이 실제로 준비되어 있다',()=>{
    const asset=new URL('../../public/assets/flower-countdown-frame-v1.png',import.meta.url);
    const bytes=readFileSync(asset);
    expect(bytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
    expect(bytes.readUInt32BE(16)).toBe(384);
    expect(bytes.readUInt32BE(20)).toBe(384);
    expect(bytes[25]).toBe(6);
    expect(statSync(asset).size).toBeLessThan(400_000);
    expect(readFileSync(new URL('../../index.html',import.meta.url),'utf8')).toContain('rel="preload" href="/assets/flower-countdown-frame-v1.png"');
  });
});
