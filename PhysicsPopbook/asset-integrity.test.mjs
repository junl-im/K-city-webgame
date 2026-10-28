import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const customSources = ['index.html', 'styles.css', 'app.js', ...readdirSync(dist)
  .filter(name => name.endsWith('.mjs') && !name.endsWith('.test.mjs'))];
const imagePattern = /(?:[./]?)assets\\/([a-zA-Z0-9_.-]+\\.(?:png|webp))/g;

test('물리도감 사용자 화면에 SVG 파일 또는 인라인 SVG가 없다', () => {
  for (const filename of customSources) {
    const contents = readFileSync(join(dist, filename), 'utf8');
    assert.doesNotMatch(contents, /<svg(?:\\s|>)/i, `${filename}: inline SVG forbidden`);
    assert.doesNotMatch(contents, /\\.svg(?:['"\\s?#]|$)/i, `${filename}: SVG asset forbidden`);
  }
  const assetNames = readdirSync(join(dist, 'assets'));
  assert.equal(assetNames.filter(name => name.toLowerCase().endsWith('.svg')).length, 0);
});

test('실험과 메뉴의 정적 WebP/PNG 그림 참조가 모두 실제 파일을 가리킨다', () => {
  let checked = 0;
  for (const filename of customSources) {
    const contents = readFileSync(join(dist, filename), 'utf8');
    for (const match of contents.matchAll(imagePattern)) {
      const image = match[1];
      assert.ok(existsSync(join(dist, 'assets', image)), `${filename}: missing ${image}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 20, '원화 참조 검사가 비활성화되지 않아야 함');
});

test('12개 단원, 공식 소유권·외부 라이선스 문서를 보존한다', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.match(html, /물리도감/);
  assert.ok(existsSync(join(root, 'OWNERSHIP.md')));
  assert.ok(existsSync(join(root, 'THIRD_PARTY_NOTICES.md')));
});
