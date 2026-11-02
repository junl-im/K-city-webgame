import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const source=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const rack=source.slice(source.indexOf('function capturedRack('),source.indexOf('function capturedGallery('));
const screen=source.slice(source.indexOf('function gameScreen('),source.indexOf('function gameOverlay('));
describe('간결한 패 영역',()=>{
 it('제목과 종류 글씨는 빼고 묶음별 접근 가능한 상세 보기는 유지한다',()=>{
  expect(rack).not.toContain('collection-head');expect(rack).not.toContain('collection-name');
  expect(rack).toContain('data-action="captures"');expect(rack).toContain('aria-label=');
 });
 it('특수 동작은 카운터와 같은 조작 영역에 표시한다',()=>{
  expect(screen).toContain('class="special-controls"');expect(screen).not.toContain('class="action-row ');
  expect(screen.indexOf('class="special-controls"')).toBeGreaterThan(screen.indexOf('class="player-controls"'));
 });
});
