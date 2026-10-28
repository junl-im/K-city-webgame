import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const asset = name => new URL(`../../public/assets/${name}`, import.meta.url);

describe('꽃맞고 꽃마을 라스터 UI v15', () => {
  it('시작 배경과 전용 입체 버튼은 가벼운 WebP 원화로 배포한다', () => {
    expect(css).toContain("url('/assets/flower-playful-home-v15.webp')");
    expect(css).toContain("url('/assets/flower-jewel-button-v15.webp')");
    expect(statSync(asset('flower-playful-home-v15.webp')).size).toBeLessThan(500_000);
    expect(statSync(asset('flower-jewel-button-v15.webp')).size).toBeLessThan(350_000);
  });

  it('우리 캐릭터와 승인된 48장 화투 원판은 그대로 유지한다', () => {
    expect(css).toContain("url('/assets/mascots.png')");
    expect(css).toContain("url('/assets/hwatu-character-original-v19.webp')");
    expect(source).toContain("card('m03-01')");
    expect(source).toContain("card('m11-02')");
    expect(source).toContain("card('m08-01')");
  });

  it('새 타이틀과 명확한 시작 버튼 및 좁은 화면 규칙을 갖춘다', () => {
    expect(source).toContain('class="home-logo"');
    expect(source).toContain('btn--jewel');
    expect(source).toContain('home-quick-links');
    expect(css).toContain('@media (max-width:650px) and (max-height:710px)');
    expect(css).toContain('@media (max-width:650px) and (max-height:530px)');
  });
});
