import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/main.ts', 'utf8');
const checks = [
  ['initial modal opening remembers its invoking control', /if \(opening\) focusBeforeModal = active;/],
  ['opening moves keyboard focus into dialog', /if \(opening\) modalCloseButton\.focus\(\);/],
  ['rerender keeps the selected action focus', /item\.dataset\.gameAction === previousAction/],
  ['rerender falls back to close control', /\(replacement \?\? modalCloseButton\)\.focus\(\);/],
  ['closing guards repeated operations', /if \(modalRoot\.classList\.contains\('hidden'\)\) return;/],
  ['closing returns focus to original trigger', /original\?\.isConnected && !modalRoot\.contains\(original\)/],
  ['Escape closes and prevents default action', /event\.key === 'Escape'.*event\.preventDefault\(\); closeModal\(\);/],
  ['Tab key is bounded by the active dialog', /if \(event\.key !== 'Tab'\) return;/],
  ['backwards Tab wraps to last control', /event\.shiftKey && \(document\.activeElement === first/],
  ['forwards Tab wraps to first control', /!event\.shiftKey && \(document\.activeElement === last/],
  ['hidden and disabled inputs cannot enter focus order', /item\.tabIndex >= 0 && item\.getClientRects\(\)\.length > 0/],
];
for (const [message, expected] of checks) assert.match(source, expected, message);
assert.doesNotMatch(source, /document\.querySelector\('svg'\)/, 'No vector art introduced');
console.log('v21 modal focus source contracts: ' + checks.length + ' checks passed.');