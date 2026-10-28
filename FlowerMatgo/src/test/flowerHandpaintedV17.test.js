import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const assets=new URL('../../public/assets/',import.meta.url);

describe('꽃맞고 v17 손그림 일러스트 UI 계약', () => {
  it('실제 비트맵 손그림 버튼과 한지 패널을 연결하고 크기는 가볍게 유지한다', () => {
    for (const name of ['flower-handpainted-button-v17.webp','flower-handpainted-paper-v17.webp','flower-game-floor-mat-v18.webp']) {
      const file=new URL(name,assets);
      const bytes=readFileSync(file);
      expect(bytes.toString('ascii',0,4)).toBe('RIFF');
      expect(bytes.toString('ascii',8,12)).toBe('WEBP');
      expect(statSync(file).size).toBeLessThan(150_000);
      expect(css).toContain(`url('/assets/${name}')`);
    }
  });

  it('홈 로고와 버튼에서 디지털 외곽선·번쩍임 대신 차분한 손그림을 사용한다', () => {
    expect(css).toContain('/* Ink and paper carry the home title; remove the plastic extrusion. */');
    expect(css).toContain('font-family:\'Nanum Myeongjo\',Georgia,serif;');
    expect(css).toContain('text-shadow:0 2px 1px #faf4e5');
    expect(css).toContain('animation:none;');
    expect(css).toContain('.scene--game .action-chip--auto.is-on');
    expect(css).toContain('@media (max-width:650px)');
    expect(css).toContain("background:rgba(29,69,53,.12) url('/assets/flower-game-floor-mat-v18.webp')");
  });

  it('48장 원판 색상과 화투 문양 이미지 바이트를 전혀 수정하지 않는다', () => {
    const official=readFileSync(new URL('hwatu-strict90-labeled-atlas-v3.webp',assets));
    const hash=createHash('sha256').update(official).digest('hex');
    expect(hash).toBe('eac16912a99706e8e0f400e1f17c6a2af84a14cce74f5cfa917dde7919258533');
  });
});
