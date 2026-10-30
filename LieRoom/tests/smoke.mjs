import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASE, createGame, safeRestore, askQuestion, toggleProof, judgeAccusation, validateCaseDefinition, CONFRONTATIONS, getConfrontation, canConfront, confrontEvidence, TACTICS, getPsychology, applyTactic, getInvestigationTimeline } from '../dist/core.mjs';

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
assert.match(fs.readFileSync(path.join(folder, 'index.html'), 'utf8'), /style\.css\?v=lr009/, 'stylesheet must use release version to avoid stale CDN');
assert.match(fs.readFileSync(path.join(folder, 'index.html'), 'utf8'), /app\.mjs\?v=lr009/, 'application must use release version to avoid stale CDN');
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

/* LR-005: artwork must be real local PNGs, and game controls must consume them. */
const illustratedAssets = [
  'lie-room-evidence-icons-v1.png',
  'lie-room-museum-night-v1.png',
  'lie-room-material-buttons-v1.png',
];
for (const file of illustratedAssets) {
  const asset = fs.readFileSync(path.join(folder, 'assets', file));
  assert.ok(asset.length > 100_000, 'art asset missing or empty: ' + file);
  assert.equal(asset.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'must be a real PNG: ' + file);
  assert.ok(asset.readUInt32BE(16) >= 900 && asset.readUInt32BE(20) >= 600, 'art asset too small: ' + file);
  assert.equal(asset.toString('ascii', 37, 41), 'IDAT', 'no embedded metadata chunks allowed: ' + file);
  assert.ok(stylesheet.includes(file), 'art asset not used: ' + file);
}
assert.match(application, /evidence-illustration art-/, 'evidence inventory requires illustrated item icons');
assert.match(application, /clue-art art-/, 'evidence detail requires the illustrated item art');
assert.match(application, /person-avatar \$\{person\.color\} person-/, 'suspect picker requires real portraits');
assert.match(stylesheet, /tactic-button\.empathy[\s\S]*?var\(--lr-panels\)/, 'empathy actions have dedicated painted material');
assert.match(stylesheet, /tactic-button\.pressure[\s\S]*?var\(--lr-panels\)/, 'pressure actions have dedicated painted material');
assert.match(stylesheet, /--lr-scene:url\(/, 'museum night backdrop must be local');


/* LR-006: chronological board must never leak locked clues. */
const openingTimeline = getInvestigationTimeline(createGame());
assert.deepEqual(openingTimeline.map(item => item.id), ['E01', 'E02']);
assert.equal(openingTimeline.some(item => item.id === 'E05'), false, 'undiscovered alarm must remain hidden');
assert.ok(openingTimeline.every(item => item.confrontation === '기록 확보'));
assert.match(application, /data-action="timeline"/, 'case timeline needs a visible entry');
assert.match(application, /data-action="confirm-new"/, 'reset requires explicit confirmation');
assert.match(application, /hasInvestigationProgress\(\)/, 'ongoing cases must be protected');
assert.match(stylesheet, /\.timeline-art\{/, 'timeline entries use painted evidence art');

/* LR-007: extra cast portraits are a future archive, not additional suspects in case one. */
const newCastPng = fs.readFileSync(path.join(folder, 'assets', 'lie-room-next-cast-atlas-v1.png'));
assert.ok(newCastPng.length > 100_000, 'new illustrated cast atlas missing');
assert.equal(newCastPng.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'new cast asset must be PNG');
assert.ok(newCastPng.readUInt32BE(16) >= 1200 && newCastPng.readUInt32BE(20) >= 1200, 'new atlas resolution too small');
assert.match(stylesheet, /lie-room-next-cast-atlas-v1\.png/, 'new cast atlas must be visible in the game');
assert.match(application, /data-action="cast"/, 'cast archive needs an entry');
assert.match(application, /data-action="cast-mood"/, 'cast portraits must have expression controls');
assert.match(application, /id: 'D'[\s\S]*id: 'E'[\s\S]*id: 'F'/, 'new cast identities must remain distinct');

assert.match(stylesheet, /\.cast-card-body\{position:absolute/, 'cast names must overlay portraits');
assert.match(stylesheet, /\.cast-gallery\{flex:0 0 auto\}/, 'cast grid must not shrink into clipping');
assert.match(application, /addEventListener\('contextmenu'/, 'disable browser right-click in game');
assert.match(application, /addEventListener\('dragstart'/, 'disable native drag in game');

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
assert.deepEqual(getInvestigationTimeline(game).map(item => item.id), ['E04','E01','E03','E05','E06','E07','E02']);
assert.equal(getInvestigationTimeline(game).find(item => item.id === 'E05').confrontation, '기록 확보');
game = confrontEvidence(game, 'E05').state;
game = confrontEvidence(game, 'E06').state;
game = confrontEvidence(game, 'E07').state;
assert.equal(game.confronted.length, 5);
assert.equal(getInvestigationTimeline(game).find(item => item.id === 'E05').confrontation, '대질 완료');
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
