import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASE, createGame, safeRestore, askQuestion, toggleProof, judgeAccusation, validateCaseDefinition, CONFRONTATIONS, getConfrontation, canConfront, confrontEvidence, TACTICS, getPsychology, applyTactic } from '../dist/core.mjs';

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
const atlas = fs.readFileSync(path.join(folder, 'assets', 'lie-room-expression-atlas-v1.png'));
assert.ok(atlas.length > 100_000, 'expression atlas is missing');
assert.equal(atlas.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'atlas must be a real PNG');
assert.ok(atlas.readUInt32BE(16) >= 900 && atlas.readUInt32BE(20) >= 900, 'atlas dimensions are too small');
const application = fs.readFileSync(path.join(folder, 'app.mjs'), 'utf8');
const stylesheet = fs.readFileSync(path.join(folder, 'style.css'), 'utf8');
assert.match(application, /portrait-art person-/, 'witness artwork is not in the game');
assert.match(stylesheet, /lie-room-expression-atlas-v1\.png/, 'expression atlas is not linked');
assert.match(application, /data-action="sfx"/, 'sound toggle must exist');
assert.match(application, /sfxEnabled = false/, 'sound must be off by default');

assert.equal(CASE.suspects.length, 3);
assert.equal(CASE.questions.length, 7);
assert.equal(CASE.evidence.length, 7);
assert.equal(CONFRONTATIONS.length, 5);
assert.equal(TACTICS.length, 6);
let psych = { ...createGame(), selectedSuspect: 'C' };
assert.equal(getPsychology(psych, 'C').label, '신중');
const pressureFirst = applyTactic(psych, 'C_P');
assert.equal(getPsychology(pressureFirst.state, 'C').stress, 2);
assert.equal(getPsychology(pressureFirst.state, 'C').label, '경계');
assert.equal(applyTactic(pressureFirst.state, 'C_P').state, pressureFirst.state, 'tactic cannot repeat');
assert.equal(applyTactic(pressureFirst.state, 'A_E').state, pressureFirst.state, 'wrong suspect cannot be targeted');
const pressuredQuestion = askQuestion(pressureFirst.state, 'c-gallery');
assert.ok(pressuredQuestion.added.includes('E06'), 'tactics must not lock crucial evidence');
assert.match(pressuredQuestion.message, /말없이 손을 만지작거린다/, 'tense mood affects testimony delivery');
const pressureThenEmpathy = applyTactic(pressureFirst.state, 'C_E').state;
assert.equal(getPsychology(pressureThenEmpathy, 'C').label, '신중');
const empathyFirst = applyTactic(psych, 'C_E').state;
assert.equal(getPsychology(empathyFirst, 'C').label, '신뢰');
const empathyThenPressure = applyTactic(empathyFirst, 'C_P').state;
assert.equal(getPsychology(empathyThenPressure, 'C').label, '신뢰', 'rapport cushions later pressure');

let game = createGame();
assert.deepEqual(game.discovered, ['E01', 'E02']);
game = { ...game, screen: 'play', selectedSuspect: 'A' };
const a = askQuestion(game, 'a-alibi');
game = a.state;
assert.deepEqual(a.added, ['E03']);
assert.equal(canConfront(game, 'E03'), true);
const confrontedA = confrontEvidence(game, 'E03');
assert.deepEqual(confrontedA.state.confronted, ['F01']);
assert.match(confrontedA.message, /가족/);
assert.equal(canConfront(confrontedA.state, 'E03'), false);
assert.equal(confrontEvidence(confrontedA.state, 'E03').state, confrontedA.state);
game = confrontedA.state;
assert.equal(askQuestion(game, 'a-alibi').added.length, 0, 'questions cannot duplicate discoveries');
assert.equal(askQuestion(game, 'c-gallery').state, game, 'cannot question other suspect by ID');

game = { ...game, selectedSuspect: 'B' };
game = askQuestion(game, 'b-card').state;
assert.ok(game.discovered.includes('E04'));
assert.equal(canConfront(game, 'E05'), false, 'cannot confront a different suspect');
assert.equal(getConfrontation('B', 'E04').id, 'F02');
game = confrontEvidence(game, 'E04').state;
game = { ...game, selectedSuspect: 'C' };
for (const id of ['c-alarm', 'c-gallery', 'c-parcel']) game = askQuestion(game, id).state;
assert.equal(game.discovered.length, 7);
game = confrontEvidence(game, 'E05').state;
game = confrontEvidence(game, 'E06').state;
game = confrontEvidence(game, 'E07').state;
assert.equal(game.confronted.length, 5);
assert.equal(game.log.at(-1).who, '박도하');

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
assert.equal(restored.confronted.length, 5);
assert.deepEqual(safeRestore({ version: 1, caseId: 'LR-001', confronted: ['F01'] }).confronted, [], 'cannot restore confrontations without discovery and questioning');
assert.deepEqual(safeRestore({ version: 1, caseId: 'LR-001', asked: ['a-alibi'], discovered: ['E03'], confronted: ['F01','F01','FAKE'] }).confronted, ['F01']);
assert.deepEqual(safeRestore({ version: 1, caseId: 'LR-001' }).confronted, [], 'existing v1 saves migrate without data loss');
assert.deepEqual(safeRestore({ version: 1, caseId: 'LR-001' }).tactics, [], 'old saves have an empty psychology record');
assert.deepEqual(safeRestore({ version: 1, caseId: 'LR-001', tactics: ['C_E', 'C_E', 'FAKE'] }).tactics, ['C_E']);
assert.equal(getPsychology(safeRestore(JSON.parse(JSON.stringify(empathyThenPressure))), 'C').label, '신뢰');
assert.equal(safeRestore({ version: -1 }).screen, 'home');
assert.equal(safeRestore({ version: 1, caseId: 'LR-001', discovered: ['fake'], asked: ['fake'] }).discovered.length, 2);

console.log(`PASS LieRoom ${CASE.id}: 3 suspects, 7 clues, 7 questions, 3 outcomes, 5 confrontations, 6 psychology choices, original PNG portraits, optional audio, safe save, no SVG`);
