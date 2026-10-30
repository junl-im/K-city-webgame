import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASE, createGame, safeRestore, askQuestion, toggleProof, judgeAccusation, validateCaseDefinition } from '../dist/core.mjs';

const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
for (const file of ['index.html', 'style.css', 'app.mjs', 'core.mjs']) assert.ok(fs.statSync(path.join(folder, file)).size > 200, `${file} missing`);
assert.deepEqual(validateCaseDefinition(), [], 'case definition is inconsistent');

const pages = ['index.html', 'style.css', 'app.mjs', 'core.mjs'];
for (const file of pages) {
  const text = fs.readFileSync(path.join(folder, file), 'utf8');
  assert.doesNotMatch(text, /<\s*svg\b|\.svg\b|data:image\/svg\+xml/i, `SVG is forbidden: ${file}`);
  assert.doesNotMatch(text, /https?:\/\/[^'"\s]+\.(svg|js|css)\b/i, `unexpected external dependency: ${file}`);
}
assert.match(fs.readFileSync(path.join(folder, 'index.html'), 'utf8'), /lang="ko"/);
assert.equal(CASE.suspects.length, 3);
assert.equal(CASE.questions.length, 7);
assert.equal(CASE.evidence.length, 7);

let game = createGame();
assert.deepEqual(game.discovered, ['E01', 'E02']);
game = { ...game, screen: 'play', selectedSuspect: 'A' };
const a = askQuestion(game, 'a-alibi');
game = a.state;
assert.deepEqual(a.added, ['E03']);
assert.equal(askQuestion(game, 'a-alibi').added.length, 0, 'questions cannot duplicate discoveries');
assert.equal(askQuestion(game, 'c-gallery').state, game, 'cannot question other suspect by ID');

game = { ...game, selectedSuspect: 'B' };
game = askQuestion(game, 'b-card').state;
assert.ok(game.discovered.includes('E04'));
game = { ...game, selectedSuspect: 'C' };
for (const id of ['c-alarm', 'c-gallery', 'c-parcel']) game = askQuestion(game, id).state;
assert.equal(game.discovered.length, 7);

game = toggleProof(game, 'E05');
game = toggleProof(game, 'E06');
assert.deepEqual(game.proof, ['E05', 'E06']);
assert.equal(judgeAccusation('C', game.proof).kind, 'correct');
assert.equal(judgeAccusation('A', game.proof).kind, 'wrong');
assert.equal(judgeAccusation('B', game.proof).kind, 'wrong');
assert.equal(judgeAccusation('C', ['E01', 'E04']).kind, 'partial');
assert.equal(judgeAccusation('C', ['E05', 'E07']).kind, 'correct');
game = toggleProof(game, 'E07');
assert.equal(game.proof.length, 3);
assert.equal(toggleProof(game, 'E04'), game, 'only three proofs can be submitted');
assert.equal(toggleProof(game, 'E05').proof.includes('E05'), false, 'selected proof can be removed');

const restored = safeRestore(JSON.parse(JSON.stringify(game)));
assert.equal(restored.discovered.length, 7);
assert.equal(restored.asked.length, 5);
assert.equal(safeRestore({ version: -1 }).screen, 'home');
assert.equal(safeRestore({ version: 1, caseId: 'LR-001', discovered: ['fake'], asked: ['fake'] }).discovered.length, 2);

console.log(`PASS LieRoom ${CASE.id}: 3 suspects, 7 clues, 7 questions, 3 outcomes, safe save, no SVG`);
