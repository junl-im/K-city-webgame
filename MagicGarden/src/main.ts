import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import './style.css';
import './theme-art.css';
import './illustrated-content.css';
import './painted-layout.css';
import './visual-polish.css';
import './button-art-v16.css';
import './button-proportions-v17.css';
import './illustrated-items-v18.css';
import './unique-surfaces-v23.css';
import { resolveHorizontalFacing, resolveWalkHeading, type HorizontalFacing, type WalkHeading } from './walk-motion';
import { advanceMovement, calculateCameraTarget, smoothFollow } from './movement-camera';
import { isWalkable, planGardenRoute, segmentIsWalkable, type Point } from './garden-navigation';
import { creekSurfacePose, creekFallPose, creekShouldAnimate, creekSurfaceCount, creekCascadeCount } from './creek-flow';
import { PAINTED_AMBIENCE, ambiencePose, type PaintedTile } from './painted-environment';
import { FOREGROUND_PAINTINGS, footDepth, foregroundDepth, foregroundMotion } from './garden-depth';

type Zone = 'town' | 'farm' | 'lab' | 'nursery';
type MonsterKind = '잎새콩' | '방울몽' | '반짝몽';
const MONSTER_KINDS: MonsterKind[] = ['잎새콩', '방울몽', '반짝몽'];
const ZONE_LABELS: Record<Zone, string> = { town: '햇살 중앙 마을', farm: '바람의 큰 텃밭', lab: '이상한 조합 실험실', nursery: '포근한 몬스터 연구소' };
const NEXT_ZONE: Record<Zone, Zone> = { town: 'farm', farm: 'lab', lab: 'nursery', nursery: 'town' };
const ZONE_NAV: Record<Zone, string> = { town: '마을', farm: '큰 텃밭', lab: '조합 실험실', nursery: '몬스터 연구소' };
type Plot = { plantedAt: number | null };
type SaveData = { zone: Zone; seeds: number; berries: number; plots: Plot[]; essence: number; eggs: number; incubatingAt: number | null; monsters: MonsterKind[] };
type Critter = 'fox' | 'bear' | 'cat' | 'rabbit';

const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 800;
const SAVE_KEY = 'gomfox.magic-garden.prototype.v1';
const GROW_TIME_MS = 18000;
const HATCH_TIME_MS = 30000;
const stageElement = document.getElementById('stage') as HTMLDivElement;
const zoneNameElement = document.getElementById('zone-name') as HTMLElement;
const guideElement = document.getElementById('guide') as HTMLElement;
const seedElement = document.getElementById('seed-count') as HTMLElement;
const berryElement = document.getElementById('berry-count') as HTMLElement;
const townButton = document.getElementById('town-button') as HTMLButtonElement;
const farmButton = document.getElementById('farm-button') as HTMLButtonElement;
const labButton = document.getElementById('lab-button') as HTMLButtonElement;
const nurseryButton = document.getElementById('nursery-button') as HTMLButtonElement;
const creekVisitButton = document.getElementById('creek-visit-button') as HTMLButtonElement;
const modalRoot = document.getElementById('modal-root') as HTMLElement;
const modalTitle = document.getElementById('modal-title') as HTMLElement;
const modalContent = document.getElementById('modal-content') as HTMLElement;
const modalStatus = document.getElementById('modal-status') as HTMLElement;

function restored(): SaveData {
  const fallback: SaveData = { zone: 'town', seeds: 5, berries: 0, plots: Array.from({ length: 12 }, () => ({ plantedAt: null })), essence: 0, eggs: 0, incubatingAt: null, monsters: [] };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;
    const parsed: Partial<SaveData> = JSON.parse(raw);
    if (typeof parsed.zone !== 'string' || !Object.prototype.hasOwnProperty.call(ZONE_LABELS, parsed.zone)) return fallback;
    if (!Array.isArray(parsed.plots) || parsed.plots.length !== 12) return fallback;
    return {
      zone: parsed.zone,
      seeds: Math.max(0, Number(parsed.seeds) || 0),
      berries: Math.max(0, Number(parsed.berries) || 0),
      plots: parsed.plots.map((plot) => ({
        plantedAt: typeof plot?.plantedAt === 'number' && Number.isFinite(plot.plantedAt) ? plot.plantedAt : null,
      })),
      essence: Math.max(0, Math.floor(Number(parsed.essence) || 0)),
      eggs: Math.max(0, Math.floor(Number(parsed.eggs) || 0)),
      incubatingAt: typeof parsed.incubatingAt === 'number' && Number.isFinite(parsed.incubatingAt) ? parsed.incubatingAt : null,
      monsters: Array.isArray(parsed.monsters) ? parsed.monsters.filter((kind): kind is MonsterKind => MONSTER_KINDS.includes(kind)) : [],
    };
  } catch {
    return fallback;
  }
}


// UI illustrations use one compact WebP atlas, never generic emoji/system glyphs or SVG.
const GARDEN_UI_PICTURES: Record<string, string> = {
  '🏡':'town', '🏠':'town', '🌿':'farm', '🌱':'farm',
  '🧪':'lab', '🥚':'nursery', '🗺️':'map',
  '🎒':'bag', '📖':'book', '💡':'help', '🍓':'berry', '✨':'potion',
  '🌟':'potion', '🐾':'event', '📤':'gift', '📥':'bag', '🐰':'rabbit',
  '🦊':'fox', '🐻':'bear', '🐱':'cat', '🎉':'gift',
};
const GARDEN_EMOJI = Object.keys(GARDEN_UI_PICTURES).sort((a,b) => b.length - a.length);
function illustratedText(html: string): string {
  let output = html;
  for (const pictogram of GARDEN_EMOJI) {
    output = output.split(pictogram).join('<span class="art-icon" data-art="' + GARDEN_UI_PICTURES[pictogram] + '" aria-hidden="true"></span>');
  }
  return output;
}
function setGuideIllustrations(node: HTMLElement, text: string) {
  const fragments: Node[] = [];
  let rest = text;
  while (rest.length) {
    let best = -1, icon = '';
    for (const pictogram of GARDEN_EMOJI) {
      const at = rest.indexOf(pictogram);
      if (at >= 0 && (best < 0 || at < best)) { best = at; icon = pictogram; }
    }
    if (best < 0) { fragments.push(document.createTextNode(rest)); break; }
    if (best > 0) fragments.push(document.createTextNode(rest.slice(0,best)));
    const art = document.createElement('span');
    art.className = 'art-icon';
    art.dataset.art = GARDEN_UI_PICTURES[icon];
    art.setAttribute('aria-hidden','true');
    fragments.push(art);
    rest = rest.slice(best + icon.length);
  }
  node.replaceChildren(...fragments);
}
// Stop right-click menus and draggable UI artifacts without blocking scroll, focus or input editing.
const gardenRoot = document.getElementById('app') as HTMLElement;
gardenRoot.addEventListener('contextmenu',(e) => e.preventDefault());
gardenRoot.addEventListener('dragstart',(e) => e.preventDefault());
gardenRoot.addEventListener('selectstart',(e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('input,textarea,[contenteditable="true"]')) e.preventDefault();
});

const saveData = restored();

type SaveArchive = { app: 'gomfox.magic-garden'; version: 1; exportedAt: string; data: SaveData };
function validatedArchive(input: unknown): SaveData | null {
  if (!input || typeof input !== 'object') return null;
  const archive = input as Record<string, unknown>;
  if (archive.app !== 'gomfox.magic-garden' || archive.version !== 1 || !archive.data || typeof archive.data !== 'object') return null;
  const data = archive.data as Record<string, unknown>;
  const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
  const timestamp = (value: unknown): value is number | null => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000_000_000);
  if (typeof data.zone !== 'string' || !Object.prototype.hasOwnProperty.call(ZONE_LABELS, data.zone)) return null;
  if (!count(data.seeds) || !count(data.berries) || !count(data.essence) || !count(data.eggs) || !timestamp(data.incubatingAt)) return null;
  if (!Array.isArray(data.plots) || data.plots.length !== 12 || !data.plots.every((plot) => plot && typeof plot === 'object' && timestamp(plot.plantedAt))) return null;
  if (!Array.isArray(data.monsters) || data.monsters.length > 1000 || !data.monsters.every((kind) => MONSTER_KINDS.includes(kind))) return null;
  return {
    zone: data.zone as Zone, seeds: data.seeds, berries: data.berries,
    plots: data.plots.map((plot) => ({ plantedAt: plot.plantedAt })),
    essence: data.essence, eggs: data.eggs, incubatingAt: data.incubatingAt,
    monsters: [...data.monsters],
  };
}
function saveArchive(): SaveArchive {
  return { app: 'gomfox.magic-garden', version: 1, exportedAt: new Date().toISOString(), data: saveData };
}

let guideTimeout = 0;
function persist(): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); return true; }
  catch { showGuide('저장 공간이 부족해서 이번 변경을 저장하지 못했어.'); return false; }
}
function showGuide(message: string) {
  setGuideIllustrations(guideElement, message);
  if (!modalRoot.classList.contains('hidden')) modalStatus.textContent = message;
  window.clearTimeout(guideTimeout);
  guideTimeout = window.setTimeout(() => { setGuideIllustrations(guideElement, saveData.zone === 'farm' ? '밭을 눌러 심고, 자라면 다시 눌러 수확해!' : saveData.zone === 'lab' ? '조합대에서 열매를 마법 정수로 바꿔봐!' : saveData.zone === 'nursery' ? '따뜻한 부화실에서 새 친구를 만나봐!' : '길을 눌러 움직이고, 큰 텃밭으로 여행해봐!'); }, 5000);
}
function updateHud() {
  seedElement.textContent = String(saveData.seeds);
  berryElement.textContent = String(saveData.berries);
  zoneNameElement.textContent = ZONE_LABELS[saveData.zone];
  townButton.classList.toggle('active', saveData.zone === 'town');
  farmButton.classList.toggle('active', saveData.zone === 'farm');
  labButton.classList.toggle('active', saveData.zone === 'lab');
  nurseryButton.classList.toggle('active', saveData.zone === 'nursery');
  creekVisitButton.hidden = saveData.zone !== 'town';
}
// Keep keyboard interaction inside the picture-book panel, including on rerenders.
const modalCloseButton = document.getElementById('modal-close') as HTMLButtonElement;
let focusBeforeModal: HTMLElement | null = null;
function openModal(title: string, content: string) {
  const opening = modalRoot.classList.contains('hidden');
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const previousAction = !opening && active && modalContent.contains(active) ? active.dataset.gameAction : undefined;
  if (opening) focusBeforeModal = active;
  if (opening || modalTitle.dataset.modalTitle !== title) modalStatus.textContent = '';
  modalTitle.dataset.modalTitle = title;
  const modalSurfaceByTitle: Record<string, string> = {
    '🎒 나의 가방': 'bag',
    '🧪 이상한 조합 실험실': 'lab',
    '🥚 포근한 몬스터 연구소': 'nursery',
    '📖 첫 정원 도감': 'book',
    '📥 저장파일 확인': 'save',
    '🗺️ 마법정원 월드': 'map',
    '💡 어떻게 놀까?': 'help',
  };
  modalRoot.dataset.surface = modalSurfaceByTitle[title] ?? 'help';
  modalTitle.innerHTML = illustratedText(title);
  modalContent.innerHTML = illustratedText(content);
  modalRoot.classList.remove('hidden');
  if (opening) modalCloseButton.focus();
  else if (previousAction) {
    const replacement = Array.from(modalContent.querySelectorAll<HTMLElement>('[data-game-action]'))
      .find((item) => item.dataset.gameAction === previousAction && !item.hasAttribute('disabled'));
    (replacement ?? modalCloseButton).focus();
  } else if (!modalRoot.contains(document.activeElement)) modalCloseButton.focus();
}
function closeModal() {
  if (modalRoot.classList.contains('hidden')) return;
  modalRoot.classList.add('hidden');
  const original = focusBeforeModal;
  focusBeforeModal = null;
  if (original?.isConnected && !modalRoot.contains(original)) original.focus();
}
modalCloseButton.addEventListener('click', closeModal);
modalRoot.addEventListener('click', (event) => { if (event.target === modalRoot) closeModal(); });
window.addEventListener('keydown', (event) => {
  if (modalRoot.classList.contains('hidden')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
  if (event.key !== 'Tab') return;
  const focusable = Array.from(modalRoot.querySelectorAll<HTMLElement>(
    'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])'
  )).filter((item) => item.tabIndex >= 0 && item.getClientRects().length > 0);
  if (!focusable.length) { event.preventDefault(); modalCloseButton.focus(); return; }
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !modalRoot.contains(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !modalRoot.contains(document.activeElement))) {
    event.preventDefault(); first.focus();
  }
});

function rand(seed: number) {
  let current = seed >>> 0;
  return () => {
    current = (1664525 * current + 1013904223) >>> 0;
    return current / 4294967296;
  };
}
function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = document.createElement('canvas');
  element.width = w;
  element.height = h;
  const context = element.getContext('2d');
  if (!context) throw new Error('Canvas 2D를 사용할 수 없는 브라우저야.');
  return [element, context];
}
function path(ctx: CanvasRenderingContext2D, points: number[], fill: string, stroke?: string, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, evergreen: boolean) {
  blob(ctx, x + size * .14, y + size * .08, size * .65, size * .22, '#42654833');
  ctx.fillStyle = '#82603c'; ctx.fillRect(x - size * .08, y - size * .4, size * .17, size * .45);
  if (evergreen) {
    for (let i = 0; i < 3; i++) {
      const width = size * (.53 - i * .09);
      const top = y - size * (1.4 - i * .3);
      path(ctx, [x, top, x - width, y - size * (.35 + i * .16), x + width, y - size * (.35 + i * .16)], i % 2 ? '#357b54' : '#1f634c', '#174d4288', 2);
    }
  } else {
    const colors = ['#3d9156', '#72aa46', '#a5c861'];
    blob(ctx, x - size * .32, y - size * .8, size * .49, size * .44, colors[0]);
    blob(ctx, x + size * .27, y - size * .96, size * .5, size * .51, colors[1]);
    blob(ctx, x - size * .05, y - size * 1.22, size * .52, size * .49, colors[2]);
  }
}
function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number) {
  blob(ctx, x + 40, y + 25, 184, 37, '#517b5438');
  path(ctx, [x - 138, y - 118, x + 95, y - 124, x + 166, y - 95, x + 162, y + 21, x - 138, y + 26], '#f6dba5', '#b8895d', 4);
  path(ctx, [x - 148, y - 125, x - 65, y - 224, x + 71, y - 195, x + 169, y - 114, x + 75, y - 134], '#ae643d', '#793d2c', 6);
  path(ctx, [x - 148, y - 125, x - 66, y - 225, x + 77, y - 194, x + 71, y - 133], '#d78552', '#85472d', 5);
  path(ctx, [x - 136, y - 111, x - 66, y - 184, x + 3, y - 115], '#ffe3b2', '#b68f66', 4);
  ctx.fillStyle = '#2e805d'; ctx.fillRect(x - 23, y - 93, 70, 119);
  ctx.strokeStyle = '#805637'; ctx.lineWidth = 6; ctx.strokeRect(x - 23, y - 93, 70, 119);
  blob(ctx, x + 32, y - 27, 5, 5, '#fad57e');
  ctx.fillStyle = '#b9e8e9'; ctx.fillRect(x + 78, y - 81, 48, 45);
  ctx.strokeStyle = '#99673c'; ctx.lineWidth = 6; ctx.strokeRect(x + 78, y - 81, 48, 45);
  ctx.beginPath(); ctx.moveTo(x + 101, y - 81); ctx.lineTo(x + 101, y - 36); ctx.moveTo(x + 78, y - 60); ctx.lineTo(x + 126, y - 60); ctx.stroke();
  for (let i = 0; i < 4; i++) blob(ctx, x + 110 + i * 13, y + 10, 12, 9, i % 2 ? '#f4b05d' : '#e77661');
  ctx.fillStyle = '#d8b081'; ctx.fillRect(x - 25, y + 26, 75, 14);
  ctx.fillRect(x - 38, y + 40, 102, 8);
}
function drawBridge(ctx: CanvasRenderingContext2D, x: number, y: number) {
  blob(ctx, x + 30, y + 22, 168, 31, '#3c644b44');
  path(ctx, [x - 122, y - 44, x + 100, y - 62, x + 168, y + 62, x - 46, y + 77], '#bd8451', '#7c5132', 7);
  ctx.lineWidth = 3; ctx.strokeStyle = '#714829';
  for (let i = 0; i < 12; i++) {
    const x0 = x - 115 + i * 20, y0 = y - 40 - i * 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 73, y0 + 112); ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const xx = x - 120 + i * 63;
    blob(ctx, xx, y - 56 + i * 2, 8, 8, '#b88051');
    ctx.fillStyle = '#795333'; ctx.fillRect(xx - 4, y - 80 + i * 2, 9, 35);
  }
}
function drawWaterfall(ctx: CanvasRenderingContext2D) {
  path(ctx, [70, 189, 408, 177, 389, 309, 124, 325], '#765b49', '#705441', 7);
  path(ctx, [164, 178, 330, 172, 333, 306, 165, 311], '#70bfd4', '#e4f9ff', 5);
  for (let i = 0; i < 14; i++) {
    ctx.beginPath(); ctx.strokeStyle = i % 2 ? '#d7f9ff88' : '#ffffffb8'; ctx.lineWidth = 3 + i % 3;
    ctx.moveTo(172 + i * 11, 189); ctx.bezierCurveTo(175 + i * 11, 231, 171 + i * 11, 274, 169 + i * 11, 300); ctx.stroke();
  }
  for (let i = 0; i < 20; i++) blob(ctx, 170 + i * 8, 310 + Math.sin(i) * 7, 16, 6, '#e8fdffcc');
}
function paintLandscape(zone: Zone): HTMLCanvasElement {
  const [c, ctx] = canvas(WORLD_WIDTH, WORLD_HEIGHT);
  const rng = rand(zone === 'town' ? 28122 : 874213);
  const sky = ctx.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, '#89cbe9'); sky.addColorStop(.3, '#d5edbf'); sky.addColorStop(.95, '#95be75');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  path(ctx, [0, 209, 150, 183, 328, 213, 510, 161, 707, 215, 917, 166, 1080, 192, 1280, 147, 1280, 370, 0, 369], '#a6ce85');
  path(ctx, [0, 278, 139, 240, 342, 279, 569, 220, 777, 257, 1062, 205, 1280, 228, 1280, 800, 0, 800], '#89ba69');
  path(ctx, [0, 351, 277, 319, 615, 365, 923, 330, 1280, 363, 1280, 800, 0, 800], '#a0c67a');
  for (let i = 0; i < 120; i++) {
    const x = rng() * WORLD_WIDTH, y = 280 + rng() * 530;
    blob(ctx, x, y, 3 + rng() * 8, 1 + rng() * 3, rng() > .5 ? '#cae8a3a0' : '#689f5b70');
  }
  if (zone === 'town') {
    path(ctx, [0, 486, 114, 451, 201, 530, 360, 658, 502, 744, 513, 800, 0, 800], '#388dc1', '#b7edf0', 9);
    path(ctx, [0, 500, 112, 473, 184, 540, 332, 680, 503, 766, 484, 800, 0, 800], '#71c5d7a6');
    ctx.strokeStyle = '#dfc995'; ctx.lineWidth = 83; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(696, 784); ctx.bezierCurveTo(659, 676, 493, 638, 589, 522); ctx.bezierCurveTo(679, 406, 790, 452, 853, 329); ctx.stroke();
    ctx.strokeStyle = '#f6e0b2'; ctx.lineWidth = 59; ctx.stroke();
    drawWaterfall(ctx);
    drawBridge(ctx, 180, 641);
    drawHouse(ctx, 907, 363);
    for (let i = 0; i < 6; i++) drawTree(ctx, 85 + i * 190, 318 + (i % 2) * 55, 58 + i % 3 * 11, i % 3 === 0);
  } else {
    ctx.strokeStyle = '#e8d09b'; ctx.lineWidth = 82; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(98, 730); ctx.bezierCurveTo(241, 660, 175, 506, 250, 407); ctx.bezierCurveTo(410, 307, 726, 334, 1106, 399); ctx.stroke();
    ctx.strokeStyle = '#f3e2b5'; ctx.lineWidth = 57; ctx.stroke();
    path(ctx, [191, 353, 835, 333, 1045, 718, 275, 780], '#a8c77c', '#77a85a', 4);
    for (let i = 0; i < 6; i++) drawTree(ctx, 118 + i * 206, 306 + (i % 3) * 45, 66, false);
    for (let i = 0; i < 4; i++) {
      const x = 1030 + i * 47, y = 475 + (i % 2) * 89;
      drawTree(ctx, x, y, 53, true);
    }
    drawHouse(ctx, 936, 321);
  }
  for (let i = 0; i < 85; i++) {
    const x = rng() * WORLD_WIDTH, y = 360 + rng() * 470;
    if (zone === 'town' && x < 460 && y > 470) continue;
    const colors = ['#fff6d5', '#ff9cab', '#eacb6e', '#d6ddff'];
    const color = colors[Math.floor(rng() * colors.length)];
    blob(ctx, x + 2, y + 1, 4 + rng() * 4, 3, '#4d9d4b');
    blob(ctx, x, y, 2.5 + rng() * 2, 2 + rng() * 2, color);
  }
  // 마지막에 가벼운 가장자리 그늘을 더해 화면이 실제 작은 세상처럼 보이게 한다.
  const shadow = ctx.createRadialGradient(650, 430, 180, 650, 430, 790);
  shadow.addColorStop(0, '#ffffff00'); shadow.addColorStop(1, '#3a5c2a38');
  ctx.fillStyle = shadow; ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  return c;
}
function mascotTexture(kind: Critter): Texture {
  const [c, ctx] = canvas(140, 150);
  const colors: Record<Critter, { main: string; shade: string; ear: string; cheeks: string }> = {
    fox: { main: '#df8a4b', shade: '#aa5f30', ear: '#ebaa8f', cheeks: '#fff0d6' },
    bear: { main: '#a77952', shade: '#72513c', ear: '#d9b290', cheeks: '#fbe9cc' },
    cat: { main: '#7d8b98', shade: '#566471', ear: '#e6b7b0', cheeks: '#f0eee7' },
    rabbit: { main: '#eee7df', shade: '#bcb9b5', ear: '#f3bfc4', cheeks: '#fff6ec' },
  };
  const a = colors[kind];
  blob(ctx, 73, 135, 46, 11, '#3c55334a');
  if (kind === 'fox') {
    path(ctx, [104, 108, 138, 91, 129, 133, 90, 128], a.main, a.shade, 4);
    path(ctx, [128, 117, 137, 92, 131, 122], a.cheeks);
  }
  blob(ctx, 70, 100, 35, 37, a.main);
  blob(ctx, 55, 129, 13, 9, a.shade); blob(ctx, 88, 129, 13, 9, a.shade);
  if (kind === 'rabbit') {
    blob(ctx, 47, 33, 13, 30, a.main); blob(ctx, 92, 31, 13, 32, a.main);
    blob(ctx, 47, 31, 6, 23, a.ear); blob(ctx, 92, 29, 6, 25, a.ear);
  } else if (kind === 'fox' || kind === 'cat') {
    path(ctx, [34, 55, 37, 15, 67, 39], a.main, a.shade, 3);
    path(ctx, [75, 36, 104, 15, 110, 55], a.main, a.shade, 3);
    path(ctx, [41, 42, 41, 26, 54, 39], a.ear);
    path(ctx, [87, 39, 101, 25, 103, 45], a.ear);
  } else {
    blob(ctx, 39, 47, 17, 19, a.main); blob(ctx, 103, 47, 17, 19, a.main);
    blob(ctx, 39, 47, 9, 11, a.ear); blob(ctx, 103, 47, 9, 11, a.ear);
  }
  blob(ctx, 70, 65, 48, 41, a.main);
  blob(ctx, 70, 82, 29, 22, a.cheeks);
  blob(ctx, 52, 64, 5, 6, '#2e3027'); blob(ctx, 89, 64, 5, 6, '#2e3027');
  blob(ctx, 50, 63, 2, 2, '#ffffff'); blob(ctx, 87, 63, 2, 2, '#ffffff');
  blob(ctx, 70, 79, 5, 4, '#6f4843');
  blob(ctx, 37, 81, 8, 5, '#f8ad9d99'); blob(ctx, 102, 81, 8, 5, '#f8ad9d99');
  ctx.fillStyle = kind === 'fox' ? '#5f9f74' : kind === 'bear' ? '#83b6c5' : kind === 'cat' ? '#d5a4ae' : '#c8b8dc';
  ctx.beginPath(); ctx.moveTo(50, 103); ctx.quadraticCurveTo(70, 112, 90, 103); ctx.lineTo(91, 123); ctx.quadraticCurveTo(70, 136, 49, 123); ctx.closePath(); ctx.fill();
  return Texture.from(c);
}

async function start() {
  const app = new Application();
  await app.init({ resizeTo: stageElement, background: '#8dcab3', antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 1.5), autoDensity: true, preference: 'webgl' });
  stageElement.appendChild(app.canvas);
  app.canvas.style.visibility = 'hidden';
  const world = new Container();
  world.sortableChildren = true;
  app.stage.addChild(world);
  const art: Record<Zone, Texture> = { town: Texture.from(paintLandscape('town')), farm: Texture.from(paintLandscape('farm')), lab: Texture.from(paintLandscape('lab')), nursery: Texture.from(paintLandscape('nursery')) };
  const creatures: Record<Critter, Texture> = { fox: mascotTexture('fox'), bear: mascotTexture('bear'), cat: mascotTexture('cat'), rabbit: mascotTexture('rabbit') };
  const background = new Sprite(art[saveData.zone]);
  const rasterAssets: Partial<Record<Zone, string>> = {
    town: 'town-scene-v1.webp',
    farm: 'farm-scene-v1.webp',
    lab: 'lab-scene-v1.webp',
    nursery: 'nursery-scene-v1.webp',
  };
  const loadingRasters: Partial<Record<Zone, Promise<boolean>>> = {};
  const readyRasters = new Set<Zone>();
  let transitionToken = 0;
  function loadRaster(zone: Zone): Promise<boolean> {
    const filename = rasterAssets[zone];
    if (!filename) return Promise.resolve(false);
    if (loadingRasters[zone]) return loadingRasters[zone];
    // 고품질 원화는 해당 지역에 들어갈 때만 로드한다. 실패해도 기본 그림으로 플레이할 수 있다.
    const url = `${import.meta.env.BASE_URL}assets/${filename}`;
    const load = Assets.load<Texture>(url).then((texture) => {
      art[zone] = texture;
      readyRasters.add(zone);
      if (saveData.zone === zone) {
        background.texture = texture;
        background.width = WORLD_WIDTH;
        background.height = WORLD_HEIGHT;
      }
      return true;
    }).catch(() => {
      delete loadingRasters[zone];
      return false;
    });
    loadingRasters[zone] = load;
    return load;
  }
  background.width = WORLD_WIDTH;
  background.height = WORLD_HEIGHT;
  background.eventMode = 'static';
  world.addChild(background);
  await loadRaster(saveData.zone);
  app.canvas.style.visibility = '';

  // 손그림 투명 WebP 물결이 마을에만 흐른다. 클릭/터치 이벤트와는 무관하다.
  // 납작한 배경의 실제 그림 위로 덮이므로 마스크로 개울 가장자리와 폭포만 제한한다.
  const creekOverlay = new Container();
  creekOverlay.zIndex = .3;
  creekOverlay.eventMode = 'none';
  world.addChild(creekOverlay);
  const creekMask = new Graphics();
  creekMask.eventMode = 'none';
  // 교량 그림 주변은 일부러 비워 두어 흐름이 다리 난간 위를 칠하지 않도록 한다.
  creekMask.moveTo(0, 509).quadraticCurveTo(100, 452, 192, 539)
    .stroke({ color: 0xffffff, width: 69, cap: 'round' });
  creekMask.moveTo(334, 672).quadraticCurveTo(401, 738, 481, 795)
    .stroke({ color: 0xffffff, width: 88, cap: 'round' });
  creekMask.poly([164, 177, 330, 172, 334, 307, 163, 313]).fill(0xffffff);
  world.addChild(creekMask);
  creekOverlay.mask = creekMask;
  creekOverlay.visible = false; // Shown only when the illustrated effect has actually loaded.
  let creekUserPaused = false;
  let creekLoadFailed = false;
  function creekStatusText(): string {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return '기기의 움직임 줄이기 설정에 따라 정지해 있어.';
    if (creekUserPaused) return '잠시 멈춘 상태야. 다시 흐르게 할 수 있어.';
    if (creekLoadFailed) return '물결 원화를 불러오지 못했어. 다시 시도해줘.';
    if (!creekLoaded) return '마을의 물결 원화를 준비하는 중이야.';
    return '계곡 잔물결과 폭포가 흐르고 있어!';
  }
  function syncCreekStatus() {
    const label = document.getElementById('creek-state');
    if (label) label.textContent = creekStatusText();
  }
  const creekSprites: { sprite: Sprite; index: number; waterfall: boolean }[] = [];
  let creekElapsed = 0;
  let creekUpdateElapsed = 0;
  let creekLoaded = false;
  let creekLoading: Promise<void> | null = null;
  const loadCreekArt = () => {
    if (creekLoading) return creekLoading;
    const base = import.meta.env.BASE_URL;
    creekLoading = Promise.all([
      Assets.load<Texture>(`${base}assets/creek-shimmer-v1.webp`),
      Assets.load<Texture>(`${base}assets/creek-cascade-v1.webp`),
    ]).then(([surface, waterfall]) => {
      if (creekLoaded) return;
      creekLoaded = true;
      creekLoadFailed = false;
      for (let i=0;i<creekSurfaceCount(false);i++) {
        const sprite=new Sprite(surface);
        sprite.anchor.set(.5);
        // Larger painted highlights are deliberately visible against the high-detail town painting.
        sprite.width=76+(i%4)*11;
        sprite.height=20+(i%3)*3;
        sprite.alpha=.59+(i%4)*.04;
        const surfacePos=creekSurfacePose(i,creekElapsed);
        sprite.position.set(surfacePos.x,surfacePos.y);
        sprite.rotation=surfacePos.angle;
        sprite.eventMode='none';
        creekOverlay.addChild(sprite);
        creekSprites.push({ sprite, index:i, waterfall:false });
      }
      for (let i=0;i<creekCascadeCount(false);i++) {
        const sprite=new Sprite(waterfall);
        sprite.anchor.set(.5);
        sprite.width=25+(i%3)*4;
        sprite.height=106+(i%3)*9;
        sprite.alpha=.53+(i%3)*.055;
        const fallPos=creekFallPose(i,creekElapsed);
        sprite.position.set(fallPos.x,fallPos.y);
        sprite.eventMode='none';
        creekOverlay.addChild(sprite);
        creekSprites.push({ sprite, index:i, waterfall:true });
      }
      creekOverlay.visible = saveData.zone === 'town' && !creekUserPaused &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      syncCreekStatus();
    }).catch(() => {
      // Leave the hand-painted background intact and explain missing assets in Help.
      creekLoadFailed = true;
      creekLoading=null;
      syncCreekStatus();
    });
    return creekLoading;
  };
  if (saveData.zone === 'town' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) void loadCreekArt();

  // v19: all floating petals, potion glints and nursery lights are painted
  // cutouts from the v18 transparent WebP, never Graphics() placeholder shapes.
  // A single tiny atlas is also shared by planting/brewing/hatching rewards.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ambience = new Container();
  ambience.eventMode = 'none';
  ambience.zIndex = .55;
  world.addChild(ambience);
  const ambientItems: { sprite:Sprite; anchor:(typeof PAINTED_AMBIENCE)[number] }[] = [];
  const paintedTiles:Partial<Record<PaintedTile,Texture>> = {};
  let ambientUpdateElapsed = 0;
  const tileSequence:PaintedTile[] = ['seed','berry','essence','egg','leafbud','bubble','sparkle','flower'];
  void Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/illustrated-items-v18.webp`).then((sheet)=>{
    const frameWidth=Math.floor(sheet.width/4),frameHeight=Math.floor(sheet.height/2);
    if(frameWidth<80||frameHeight<80) return;
    tileSequence.forEach((tile,index)=>{
      paintedTiles[tile]=new Texture({
        source:sheet.source,
        frame:new Rectangle((index%4)*frameWidth,Math.floor(index/4)*frameHeight,frameWidth,frameHeight),
      });
    });
    PAINTED_AMBIENCE.forEach((anchor)=>{
      const texture=paintedTiles[anchor.tile];
      if(!texture) return;
      const sprite=new Sprite(texture);
      sprite.anchor.set(.5);
      sprite.width=anchor.size;sprite.height=anchor.size;
      const pos=ambiencePose(anchor,0,prefersReducedMotion);
      sprite.position.set(pos.x,pos.y);
      sprite.alpha=pos.alpha;
      sprite.eventMode='none';
      sprite.visible=anchor.zone===saveData.zone;
      ambience.addChild(sprite);
      ambientItems.push({sprite,anchor});
    });
    // Foreground flowers are sorted using the same foot Y as the fox/NPCs.
    // They cannot capture clicks and never cover an entire building or bridge.
    FOREGROUND_PAINTINGS.forEach((anchor)=>{
      const texture=paintedTiles[anchor.tile];
      if(!texture)return;
      const sprite=new Sprite(texture);
      sprite.anchor.set(.5,1);
      sprite.position.set(anchor.x,anchor.y);
      sprite.width=anchor.size;sprite.height=anchor.size;
      sprite.alpha=anchor.opacity;
      sprite.zIndex=foregroundDepth(anchor);
      sprite.eventMode='none';
      sprite.visible=anchor.zone===saveData.zone;
      objects.addChild(sprite);
      foregroundItems.push({sprite,anchor});
    });
  }).catch(()=>{ /* Painted environmental details are optional when offline. */ });

  const objects = new Container(); objects.sortableChildren = true; objects.zIndex = 1; world.addChild(objects);
  const foregroundItems: {sprite:Sprite;anchor:(typeof FOREGROUND_PAINTINGS)[number]}[]=[];
  const effectLayer = new Container(); effectLayer.eventMode = 'none'; effectLayer.zIndex = 2; world.addChild(effectLayer);
  const bursts: {sprite:Sprite;vx:number;vy:number;age:number;life:number;baseScale:number}[] = [];
  function clearBurstEffects(){
    for(const effect of bursts) effect.sprite.destroy();
    bursts.length=0;
  }
  function emitBurst(x:number,y:number,kind:'seed'|'berry'|'alchemy'|'egg'|'hatch'){
    if(prefersReducedMotion) return;
    const tileChoices:Record<typeof kind,PaintedTile[]> = {
      seed:['seed','flower'],berry:['berry','flower'],
      alchemy:['essence','flower'],egg:['egg','flower'],
      hatch:['leafbud','bubble','sparkle','flower'],
    };
    const choices=tileChoices[kind];
    // The same original paintings used in the inventory now become tiny
    // floating rewards. No vector dots, circles or CSS-created icons.
    for(let i=0;i<(kind==='hatch'?12:7);i++){
      const texture=paintedTiles[choices[i%choices.length]];
      if(!texture) continue;
      const sprite=new Sprite(texture);
      sprite.anchor.set(.5);
      const size=20+(i%3)*6;
      sprite.width=size;sprite.height=size;
      sprite.position.set(x,y);
      sprite.alpha=.92;
      sprite.eventMode='none';
      effectLayer.addChild(sprite);
      const angle=-Math.PI+Math.PI*(i/Math.max(1,kind==='hatch'?11:6));
      bursts.push({sprite,vx:Math.cos(angle)*(1.15+(i%3)*.7),
        vy:-1.55-Math.abs(Math.sin(angle))*1.3,age:0,life:490+(i%4)*105,
        baseScale:sprite.scale.x});
    }
    while(bursts.length>60)bursts.shift()?.sprite.destroy();
  }
  const player = new Sprite(creatures.fox);
  player.anchor.set(.5, 1);
  player.scale.set(.72);
  player.zIndex = 585;
  player.eventMode = 'static'; player.cursor = 'pointer';
  player.on('pointertap', () => openFriend('fox'));
  objects.addChild(player);
  const npcKinds: Critter[] = ['bear', 'cat', 'rabbit'];
  const npcs = npcKinds.map((kind, i) => {
    const sprite = new Sprite(creatures[kind]);
    sprite.anchor.set(.5, 1); sprite.scale.set(.65); sprite.zIndex = 500 + i;
    sprite.eventMode = 'static'; sprite.cursor = 'pointer';
    sprite.on('pointertap', () => openFriend(kind));
    objects.addChild(sprite);
    return sprite;
  });
  // 좌우는 한 장의 원화를 반전해서 보여주고, 위아래는 자세와 발자국으로 표현한다.
  // 발밑 그림자는 캐릭터보다 낮은 깊이에 그린다.
  const makeShadow = () => {
    const shadow = new Graphics().ellipse(0, 0, 42, 13).fill({ color: '#2a4a30', alpha: .25 });
    shadow.eventMode = 'none';
    objects.addChild(shadow);
    return shadow;
  };
  const playerShadow = makeShadow();
  const npcShadows = npcKinds.map(() => makeShadow());
  let friendArtScale = 1;
  let foxArtScale = 1;
  let foxFourWayReady = false;
  const foxDirections: Partial<Record<WalkHeading, Texture>> = {};
  // 원화가 천천히 도착해도 즉시 플레이할 수 있도록 기존 캐릭터를 먼저 보여준다.
  // WebP 한 장의 4분면을 같은 GPU 텍스처로 공유해 모바일 다운로드와 메모리를 줄인다.
  void Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/friends-atlas-v1.webp`).then((sheet) => {
    const splitX = Math.floor(sheet.width / 2);
    const splitY = Math.floor(sheet.height / 2);
    const clip = (col: number, row: number) => new Texture({
      source: sheet.source,
      frame: new Rectangle(col * splitX, row * splitY, col ? sheet.width - splitX : splitX, row ? sheet.height - splitY : splitY),
    });
    if (!foxFourWayReady) player.texture = clip(0, 0);
    npcs[0].texture = clip(1, 0);
    npcs[1].texture = clip(0, 1);
    npcs[2].texture = clip(1, 1);
    friendArtScale = .25;
  }).catch(() => {
    // 로딩이 실패하면 게임은 기존 Canvas 캐릭터로 계속 진행한다.
  });
  // 네 방향 원화가 등록되면 우선 사용한다. 미등록/오류 시 기존 여우 그림으로 계속 플레이한다.
  void Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/fox-four-directions-v1.webp`).then((sheet) => {
    const halfWidth = Math.floor(sheet.width / 2);
    const halfHeight = Math.floor(sheet.height / 2);
    const clip = (col: number, row: number) => new Texture({
      source: sheet.source,
      frame: new Rectangle(col * halfWidth, row * halfHeight, col ? sheet.width - halfWidth : halfWidth, row ? sheet.height - halfHeight : halfHeight),
    });
    foxDirections.down = clip(0, 0);
    foxDirections.right = clip(1, 0);
    foxDirections.up = clip(0, 1);
    foxDirections.left = clip(1, 1);
    foxArtScale = 160 / halfHeight;
    foxFourWayReady = true;
    player.texture = foxDirections.down;
  }).catch(() => { /* 구버전 캐릭터와 움직임은 그대로 유지 */ });
  // 목표를 표시하는 바닥 링. 클릭을 가로채지 않는다.
  const walkMark = new Graphics().circle(0, 0, 17).stroke({ color: '#fffbee', width: 4, alpha: .95 }).circle(0, 0, 10).stroke({ color: '#6aa873', width: 3, alpha: .85 });
  walkMark.visible = false; walkMark.eventMode = 'none';
  objects.addChild(walkMark);
  // Dotted wayfinding hints render behind characters; they never capture touches.
  const routeHints = new Graphics();
  routeHints.eventMode = 'none';
  routeHints.zIndex = 340;
  objects.addChild(routeHints);
  function showRouteHints(start: Point, route: Point[]) {
    routeHints.clear();
    let from = start, drawn = 0;
    for (const to of route) {
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const samples = Math.floor(length / 38);
      for (let i = 1; i <= samples && drawn < 48; i++) {
        const t = i * 38 / length;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;
        routeHints.circle(x, y + 3, 7).fill({ color: '#405e3c', alpha: .12 });
        routeHints.circle(x, y, 3.2).fill({ color: '#fff3c2', alpha: .8 });
        routeHints.circle(x - 1, y - 1, 1.1).fill({ color: '#ffffff', alpha: .95 });
        drawn++;
      }
      from = to;
    }
    routeHints.alpha = .85;
    routeHints.visible = drawn > 0;
  }
  function clearRouteHints() { routeHints.clear(); routeHints.visible = false; }
  let markAge = 0;

  const gate = new Container();
  // A wooden wayfinding sign should sit on the ground, not above everything.
  gate.zIndex = footDepth(600)+18; objects.addChild(gate);
  const gateBackground = new Graphics().roundRect(-98, -30, 196, 60, 18).fill({ color: '#fff4d1', alpha: .96 }).roundRect(-98, -30, 196, 60, 18).stroke({ color: '#a78054', width: 4 });
  const gateLabel = new Text({ text: '큰 텃밭으로 →', style: { fontFamily: 'sans-serif', fontSize: 17, fontWeight: '900', fill: '#344d37', stroke: { color: '#fff9e8', width: 3 } } });
  gateLabel.anchor.set(.5);
  gateLabel.position.x = 18;
  gateLabel.zIndex = 10;
  gate.addChild(gateBackground, gateLabel);
  gate.eventMode = 'static'; gate.cursor = 'pointer';
  gate.on('pointertap', () => switchZone(NEXT_ZONE[currentZone]));

  const station = new Container();
  station.zIndex = footDepth(485)+22; objects.addChild(station);
  const stationFrame = new Graphics().roundRect(-123, -39, 246, 78, 19).fill({ color: '#fff4cf', alpha: .96 }).roundRect(-123, -39, 246, 78, 19).stroke({ color: '#9e7547', width: 5 });
  const stationText = new Text({ text: '조합 시작', style: { fontFamily: 'sans-serif', fontSize: 22, fontWeight: '900', fill: '#344b40', stroke: { color: '#fffcf2', width: 3 } } });
  stationText.anchor.set(.5);
  stationText.position.x = 17;
  stationText.zIndex = 10;
  station.addChild(stationFrame, stationText);
  station.eventMode = 'static'; station.cursor = 'pointer';
  station.on('pointertap', () => { if (currentZone === 'lab') openLab(); else if (currentZone === 'nursery') openNursery(); });
  // v26: each destination and each workshop owns a distinct hand-painted raster sign.
  // The source image is fitted uniformly: never assign width and height separately.
  const gateSurface = new Sprite(Texture.EMPTY);
  gateSurface.anchor.set(.5);
  gateSurface.eventMode = 'none';
  gateSurface.visible = false;
  gate.addChildAt(gateSurface, 0);
  const stationSurface = new Sprite(Texture.EMPTY);
  stationSurface.anchor.set(.5);
  stationSurface.eventMode = 'none';
  stationSurface.visible = false;
  station.addChildAt(stationSurface, 0);

  const gateArtByDestination: Record<Zone, string> = {
    town: 'ui-v26-gate-town.webp',
    farm: 'ui-v26-gate-farm.webp',
    lab: 'ui-v26-gate-lab.webp',
    nursery: 'ui-v26-gate-nursery.webp',
  };
  const stationArtByZone: Partial<Record<Zone, string>> = {
    lab: 'ui-v26-station-lab.webp',
    nursery: 'ui-v26-station-nursery.webp',
  };
  let signRevision = 0;
  function fitOriginalSign(sprite: Sprite, texture: Texture, maxWidth: number, maxHeight: number) {
    sprite.texture = texture;
    const scale = Math.min(maxWidth / texture.width, maxHeight / texture.height);
    sprite.scale.set(scale);
    sprite.visible = true;
  }
  function refreshWorldSignArt(zone: Zone) {
    const revision = ++signRevision;
    gateSurface.visible = false;
    gateBackground.visible = true;
    const gateFile = gateArtByDestination[NEXT_ZONE[zone]];
    void Assets.load<Texture>(import.meta.env.BASE_URL + 'assets/' + gateFile).then((texture) => {
      if (revision !== signRevision) return;
      fitOriginalSign(gateSurface, texture, 196, 60);
      gateBackground.visible = false;
    }).catch(() => { /* The readable light cream fallback remains usable offline. */ });

    stationSurface.visible = false;
    stationFrame.visible = true;
    const stationFile = stationArtByZone[zone];
    if (stationFile) {
      void Assets.load<Texture>(import.meta.env.BASE_URL + 'assets/' + stationFile).then((texture) => {
        if (revision !== signRevision) return;
        fitOriginalSign(stationSurface, texture, 246, 78);
        stationFrame.visible = false;
      }).catch(() => { /* Retain the live label and playable station. */ });
    }
  }

  const plotViews: Graphics[] = [];
  const cropArtViews: Graphics[] = [];
  const ripePlots: boolean[] = Array(12).fill(false);
  for (let i = 0; i < 12; i++) {
    const plot = new Graphics();
    const col = i % 4, row = Math.floor(i / 4);
    plot.position.set(365 + col * 208, 443 + row * 98);
    plot.hitArea = new Rectangle(-83, -58, 166, 105);
    const cropArt = new Graphics();
    cropArt.eventMode = 'none';
    cropArt.position.set(0, 24);
    plot.addChild(cropArt);
    // 밭과 캐릭터의 앞뒤 순서를 같은 발 위치 기준으로 계산한다.
    plot.zIndex = plot.position.y + 20;
    plot.eventMode = 'static'; plot.cursor = 'pointer';
    plot.on('pointertap', () => interactPlot(i));
    plot.visible = saveData.zone === 'farm';
    objects.addChild(plot); plotViews.push(plot); cropArtViews.push(cropArt);
  }
  const cropSprites = cropArtViews.map((plant) => {
    const image = new Sprite(Texture.WHITE);
    image.anchor.set(.5, 1);
    image.position.set(0, 0);
    image.width = 116; image.height = 113;
    image.visible = false;
    image.eventMode = 'none';
    plant.addChild(image);
    return image;
  });
  const cropTextures: Texture[] = [];
  void Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/ui-crop-stages-v1.webp`).then((sheet) => {
    const w = Math.floor(sheet.width / 2), h = Math.floor(sheet.height / 2);
    for (let i = 0; i < 4; i++) {
      cropTextures.push(new Texture({
        source: sheet.source,
        frame: new Rectangle((i % 2) * w, Math.floor(i / 2) * h, w, h),
      }));
    }
    drawPlots();
  }).catch(() => { /* Existing crops remain playable if art cannot load. */ });
  let currentZone: Zone = saveData.zone;
  let px = currentZone === 'town' ? 619 : 247;
  let py = 585;
  let tx = px, ty = py;
  let plannedRoute: Point[] = [];
  let clock = 0;
  let walkDistance = 0;
  let footstepDistance = 0;
  let lastFoot = 0;
  let walkHeading: WalkHeading = 'down';
  let horizontalFacing: HorizontalFacing = 1;
  const npcFacingMemory: HorizontalFacing[] = [1, 1, 1];
  const footprints: { sprite: Graphics; age: number }[] = [];
  function leaveFootprint(x: number, y: number, dx: number, dy: number) {
    if (prefersReducedMotion) return;
    const length = Math.max(1, Math.hypot(dx, dy));
    const side = lastFoot % 2 === 0 ? 1 : -1;
    lastFoot++;
    const footprint = new Graphics().ellipse(0, 0, 6, 3).fill({ color: '#fff6c6', alpha: .53 });
    footprint.position.set(x - dx / length * 13 + -dy / length * side * 6, y - dy / length * 13 + dx / length * side * 6);
    footprint.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    footprint.zIndex = y - 2;
    footprint.eventMode = 'none';
    objects.addChild(footprint);
    footprints.push({ sprite: footprint, age: 0 });
    while (footprints.length > 18) footprints.shift()?.sprite.destroy();
  }
  let lastCropRender = 0;
  let lastNurseryRender = 0;

  function drawPlots() {
    plotViews.forEach((plot, i) => {
      const crop = saveData.plots[i];
      plot.clear();
      const plant = cropArtViews[i];
      plant.clear();
      cropSprites[i].visible = false;
      ripePlots[i] = false;
      // 네모난 버튼 대신 원화 속 흙밭과 어울리는 낮은 둔덕을 사용한다.
      plot.ellipse(0, 21, 75, 28).fill({ color: '#5a3317', alpha: .24 });
      plot.ellipse(0, 14, 70, 23).fill({ color: '#925b30', alpha: .18 });
      plot.moveTo(-55, 11).quadraticCurveTo(0, 26, 55, 11).stroke({ color: '#3e2412', alpha: .26, width: 2.5 });
      plot.moveTo(-39, 0).quadraticCurveTo(0, 12, 39, 0).stroke({ color: '#d7a56b', alpha: .23, width: 2 });
      if (crop.plantedAt !== null) {
        const percent = Math.min(1, Math.max(0, (Date.now() - crop.plantedAt) / GROW_TIME_MS));
        ripePlots[i] = percent >= 1;
        if (cropTextures.length === 4) {
          const stage = Math.min(3, Math.floor(percent * 4));
          const picture = cropSprites[i];
          if (picture.texture !== cropTextures[stage]) picture.texture = cropTextures[stage];
          picture.visible = true;
          picture.alpha = 1;
          // Keep every atlas frame at the same calibrated in-world size, not its raw pixel size.
          picture.width = 116;
          picture.height = 108;
        } else {
          const height = 12 + percent * 40;
          const leaf = 5 + percent * 9;
          for (let sprout = -1; sprout <= 1; sprout++) {
          const sx = sprout * 31;
          plant.moveTo(sx, -1).quadraticCurveTo(sx + 3, -height * .55, sx, -height).stroke({ color: '#337d3f', width: 5 });
          plant.ellipse(sx - leaf * .72, -height * .57, leaf, leaf * .54).fill('#6ab954');
          plant.ellipse(sx + leaf * .72, -height * .73, leaf, leaf * .58).fill('#39994c');
          if (percent > .34) plant.ellipse(sx - 6, -height * .98, leaf * .9, leaf * .45).fill('#8bd15e');
          if (percent > .72) {
            const berryRadius = 4 + Math.min(1, (percent - .72) / .28) * 5;
            plant.circle(sx - 8, -height + 2, berryRadius).fill('#ed6477');
            plant.circle(sx + 6, -height + 7, berryRadius * .88).fill('#d9465e');
            plant.circle(sx - 10, -height, 2).fill('#fff6d1');
            plant.moveTo(sx - 12, -height - 7).lineTo(sx - 7, -height - 11).lineTo(sx - 2, -height - 6).stroke({ color: '#6fb64f', width: 2 });
          }
        }
        if (percent >= 1) {
          plant.ellipse(0, -36, 64, 31).stroke({ color: '#ffe6a1', width: 3, alpha: .72 });
          plant.circle(0, -66, 5).fill('#fff4bc');
          plant.circle(32, -58, 3).fill('#ffffff');
        }
        }
      }
    });
  }
  function interactPlot(i: number) {
    const crop = saveData.plots[i];
    if (crop.plantedAt === null) {
      if (saveData.seeds <= 0) { showGuide('씨앗이 부족해! 익은 열매를 수확하면 씨앗도 돌아와.'); return; }
      crop.plantedAt = Date.now();
      saveData.seeds -= 1;
      emitBurst(plotViews[i].x, plotViews[i].y - 5, 'seed');
      showGuide('톡! 씨앗을 심었어. 잠시 후 예쁜 열매가 열릴 거야.');
    } else if (Date.now() - crop.plantedAt >= GROW_TIME_MS) {
      crop.plantedAt = null;
      saveData.seeds += 2;
      saveData.berries += 3;
      emitBurst(plotViews[i].x, plotViews[i].y - 30, 'berry');
      showGuide('수확 성공! 🍓 열매 3개와 씨앗 2개를 얻었어!');
    } else {
      const remaining = Math.max(1, Math.ceil((GROW_TIME_MS - (Date.now() - crop.plantedAt)) / 1000));
      showGuide('쑥쑥 자라는 중이야! 약 ' + remaining + '초 후 수확할 수 있어.');
    }
    drawPlots(); updateHud(); persist();
  }

  function openFriend(kind: Critter) {
    const dialogues: Record<Critter, { name: string; message: string; tip: string; place: Zone }> = {
      fox: { name: '🦊 여우', message: '여기가 우리 마법정원이야! 이 길 너머에는 매일 새로운 발견이 기다리고 있어.', tip: '텃밭에서 열매를 기르고 실험실과 연구소로 가져가 보자!', place: 'farm' },
      bear: { name: '🐻 곰', message: '어서 와! 정원은 서두르지 않아도 괜찮아. 씨앗은 천천히 자란단다.', tip: '큰 텃밭의 12칸을 눌러 심고, 다 자라면 다시 눌러 수확해 봐.', place: 'farm' },
      cat: { name: '🐱 고양이', message: '쉿, 작은 알이 꿈꾸고 있어. 깨어나면 따뜻하게 맞아 줘야 해!', tip: '신비한 알을 만들었다면 연구소에서 30초 동안 품어 줘.', place: 'nursery' },
      rabbit: { name: '🐰 토끼', message: '나랑 반짝반짝 조합 실험해 볼래? 열매 세 개면 신기한 정수를 만들 수 있어!', tip: '정수 2개를 모으면 신비한 알을 제작할 수 있어.', place: 'lab' },
    };
    const friend = dialogues[kind];
    openModal(friend.name + '와 이야기',
      '<p>' + friend.message + '</p><p class="modal-note">💡 ' + friend.tip + '</p>' +
      '<button type="button" class="link-button" data-game-action="zone-' + friend.place + '">🗺️ ' + ZONE_LABELS[friend.place] + ' 이동하기</button>');
  }


  // UI values come from live saveData, not from the approved visual mockup.
  type BagKey = 'seeds' | 'berries' | 'essence' | 'eggs' | 'monsters';
  type BagTab = 'all' | 'crop' | 'magic' | 'friends';
  const bagList: {key:BagKey;tab:BagTab;name:string;art:string;detail:string;destination:string;label:string}[] = [
    {key:'seeds',tab:'crop',name:'새싹 씨앗',art:'farm',detail:'큰 텃밭에 심어 열매를 키우는 씨앗이야.',destination:'zone-farm',label:'텃밭에서 심기'},
    {key:'berries',tab:'crop',name:'달콤한 열매',art:'berry',detail:'세 개를 모으면 조합실에서 마법 정수로 바꿀 수 있어.',destination:'zone-lab',label:'마법 정수 조합'},
    {key:'essence',tab:'magic',name:'마법 정수',art:'potion',detail:'두 개를 모으면 신비한 알을 만들 수 있어.',destination:'zone-lab',label:'신비한 알 만들기'},
    {key:'eggs',tab:'magic',name:'신비한 알',art:'egg',detail:'고양이가 있는 연구소에서 30초 동안 품어봐.',destination:'zone-nursery',label:'연구소에서 부화'},
    {key:'monsters',tab:'friends',name:'발견한 친구',art:'event',detail:'부화한 몬스터들의 이름을 도감에 기록했어.',destination:'open-book',label:'정원 도감 열기'},
  ];
  let bagTab:BagTab='all', bagChoice:BagKey='berries';
  const iconHTML = (icon:string):string => '<span class="art-icon" data-art="' + icon + '" aria-hidden="true"></span>';
  // Hand-painted items share one 25 KiB transparent WebP: keep them separate
  // from the 36px navigation icons so large inventory images stay crisp.
  type PaintedItem = 'seed'|'berry'|'essence'|'egg'|'leafbud'|'bubble'|'sparkle'|'flower';
  const itemPaintings:Record<string,PaintedItem> = {
    farm:'seed',berry:'berry',potion:'essence',egg:'egg',event:'leafbud',
    seed:'seed',essence:'essence',leafbud:'leafbud',bubble:'bubble',
    sparkle:'sparkle',flower:'flower',
  };
  const monsterPaintings:Record<MonsterKind,PaintedItem> = {
    잎새콩:'leafbud',방울몽:'bubble',반짝몽:'sparkle',
  };
  const itemHTML = (key:string):string =>
    '<span class="painted-item painted-'+(itemPaintings[key] || 'flower')+'" aria-hidden="true"></span>';
  const monsterHTML = (kind:MonsterKind):string => itemHTML(monsterPaintings[kind]);
  const amount = (key:BagKey):number => key==='monsters' ? saveData.monsters.length : saveData[key];
  function openBag() {
    const visible = bagList.filter(item=>bagTab==='all'||item.tab===bagTab);
    if(!visible.some(item=>item.key===bagChoice)) bagChoice=visible[0].key;
    const selected = bagList.find(item=>item.key===bagChoice)!;
    const tabs: {key:BagTab;label:string}[] = [
      {key:'all',label:'전체'},{key:'crop',label:'작물'},{key:'magic',label:'마법'},{key:'friends',label:'친구'}
    ];
    const tabsHTML=tabs.map(tab=>'<button type="button" class="garden-tab'+(tab.key===bagTab?' current':'')+
      '" aria-pressed="'+(tab.key===bagTab)+'" data-game-action="bag-tab-'+tab.key+'">'+tab.label+'</button>').join('');
    const gridHTML=visible.map(item=>'<button type="button" class="garden-slot'+(item.key===bagChoice?' current':'')+
      '" aria-pressed="'+(item.key===bagChoice)+'" data-game-action="bag-item-'+item.key+'">'+
      '<span class="slot-illustration">'+itemHTML(item.art)+'</span><strong>'+item.name+'</strong>'+
      '<span class="slot-quantity">'+amount(item.key)+'</span></button>').join('');
    openModal('🎒 나의 가방',
      '<p class="garden-intro">정원에서 모은 보물들이야. 그림을 눌러 자세히 살펴봐!</p>'+
      '<div class="garden-tabs" role="group" aria-label="아이템 분류">'+tabsHTML+'</div>'+
      '<div class="garden-bag"><div class="garden-slots" role="group" aria-label="실제 보유 아이템">'+gridHTML+'</div>'+
      '<section class="garden-detail"><div class="garden-detail-picture">'+itemHTML(selected.art)+'</div>'+
      '<h3>'+selected.name+'</h3><p class="garden-owned">보유 수량 <b>'+amount(selected.key)+'</b></p>'+
      '<p>'+selected.detail+'</p>'+
      '<button type="button" class="link-button" data-game-action="'+selected.destination+'">'+selected.label+'</button></section></div>'+
      '<div class="save-actions"><button type="button" class="link-button secondary-action" data-game-action="save-export">'+iconHTML('gift')+' 저장파일 내보내기</button>'+
      '<button type="button" class="link-button secondary-action" data-game-action="save-import">'+iconHTML('bag')+' 저장파일 불러오기</button></div>'+
      '<p class="modal-note">실제 진행 내용은 브라우저에 자동 저장돼. 다른 기기로 옮길 때는 저장파일을 사용해줘.</p>');
  }
  function ingredient(icon:string,name:string,have:number,need:number):string {
    return '<div class="garden-ingredient'+(have<need?' lacking':'')+'">'+
      '<span class="ingredient-icon">'+itemHTML(icon)+'</span><strong>'+name+'</strong>'+
      '<small>'+have+' / '+need+'개</small></div>';
  }
  function recipe(heading:string,inputArt:string,inputName:string,have:number,need:number,outputArt:string,outputName:string,action:string):string {
    return '<section class="garden-recipe"><h3>'+heading+'</h3><div class="garden-recipe-visual">'+
      ingredient(inputArt,inputName,have,need)+
      '<div class="garden-result"><small>완성</small>'+itemHTML(outputArt)+'<strong>'+outputName+'</strong></div></div>'+
      '<button type="button" class="link-button'+(have<need?' needs-items':'')+'" data-game-action="'+action+'">'+
      itemHTML(outputArt)+(have<need ? '재료가 부족해 ('+need+'개 필요)' : outputName+' 만들기')+'</button></section>';
  }
  function openLab() {
    openModal('🧪 이상한 조합 실험실',
      '<div class="garden-scene garden-lab"><div class="scene-caption">'+iconHTML('lab')+
      '<strong>토끼의 마법 조합</strong><small>열매를 정수로, 정수를 알로!</small></div></div>'+
      '<div class="garden-counts"><span>'+iconHTML('berry')+' 열매 <b>'+saveData.berries+'</b></span>'+
      '<span>'+iconHTML('potion')+' 정수 <b>'+saveData.essence+'</b></span>'+
      '<span>'+iconHTML('egg')+' 알 <b>'+saveData.eggs+'</b></span></div>'+
      recipe('첫 번째 조합 · 반짝이는 정수','berry','달콤한 열매',saveData.berries,3,'potion','마법 정수 1개','brew')+
      recipe('두 번째 조합 · 신비한 알','potion','마법 정수',saveData.essence,2,'egg','신비한 알 1개','craft-egg')+
      '<button type="button" class="link-button secondary-action" data-game-action="zone-farm">'+iconHTML('farm')+' 큰 텃밭에서 재료 모으기</button>');
  }
  function openNursery() {
    const incubating=saveData.incubatingAt!==null;
    const remaining=!incubating?0:Math.max(0,Math.ceil((HATCH_TIME_MS-(Date.now()-saveData.incubatingAt!))/1000));
    const progress=!incubating?0:Math.min(100,Math.floor((Date.now()-saveData.incubatingAt!)/HATCH_TIME_MS*100));
    const status=!incubating?'신비한 알을 기다리는 포근한 둥지야.' :
      remaining>0 ? '고양이가 알을 돌보는 중… '+remaining+'초 남았어.' : '알이 반짝반짝! 이제 부화시켜봐!';
    const friends=saveData.monsters.length
      ? saveData.monsters.map(kind=>'<span class="garden-discovery">'+monsterHTML(kind)+kind+'</span>').join('')
      : '<span class="garden-empty">첫 친구를 부화시키면 이곳에 기록돼.</span>';
    openModal('🥚 포근한 몬스터 연구소',
      '<div class="garden-scene garden-nursery"><div class="garden-egg'+(incubating?' awakening':'')+'">'+
      itemHTML('egg')+'<small>'+(incubating?'알이 깨어나는 중':'따뜻한 알 둥지')+'</small></div></div>'+
      '<div class="garden-counts"><span>'+iconHTML('egg')+' 보유 알 <b>'+saveData.eggs+'</b></span>'+
      '<span>'+itemHTML('leafbud')+' 만난 친구 <b>'+saveData.monsters.length+'</b></span></div>'+
      '<p class="garden-hatch-status" id="hatch-live-status" aria-live="polite">'+status+'</p>'+
      '<div class="hatch-progress" role="progressbar" aria-label="알의 부화 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+progress+'">'+
      '<span id="hatch-progress-fill" style="width:'+progress+'%"></span></div>'+
      (!incubating?'<button type="button" class="link-button" data-game-action="incubate">'+iconHTML('egg')+' 알 한 개 둥지에 넣기</button>':
      '<button type="button" class="link-button" data-game-action="hatch"'+(remaining>0?' disabled':'')+'>'+
      iconHTML('egg')+(remaining>0?'알을 품고 있어…':'부화 확인하기')+'</button>')+
      '<section class="garden-discoveries"><h3>발견한 정원 친구</h3><div class="garden-discovery-list">'+friends+'</div></section>'+
      '<button type="button" class="link-button secondary-action" data-game-action="zone-lab">'+iconHTML('lab')+' 실험실로 돌아가기</button>');
  }
  function openBook() {
    const friends=[['fox','여우','정원 탐험가'],['bear','곰','텃밭의 친구'],['cat','고양이','알의 연구원'],['rabbit','토끼','조합 담당']];
    const portraits=friends.map(([art,name,role])=>'<div class="garden-friend">'+iconHTML(art)+
      '<strong>'+name+'</strong><small>'+role+'</small></div>').join('');
    const monsters=saveData.monsters.length ? saveData.monsters.map(kind=>
      '<span class="garden-discovery">'+monsterHTML(kind)+kind+'</span>').join('') :
      '<span class="garden-empty">아직 발견한 몬스터가 없어. 연구소에서 만나봐!</span>';
    openModal('📖 첫 정원 도감','<p class="garden-intro">정원의 친구들과 발견한 생명을 기록하는 책이야.</p>'+
      '<div class="garden-friends">'+portraits+'</div>'+
      '<section class="garden-discoveries"><h3>발견한 몬스터 · '+saveData.monsters.length+'마리</h3>'+
      '<div class="garden-discovery-list">'+monsters+'</div></section>'+
      '<p class="modal-note">발견한 몬스터는 각자의 작은 손그림으로 기록돼. 친구를 더 만나보자!</p>'+
      '<button type="button" class="link-button secondary-action" data-game-action="zone-nursery">'+iconHTML('nursery')+' 연구소에서 친구 만나기</button>');
  }
  let pendingImport: SaveData | null = null;
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json,application/json';
  importInput.hidden = true;
  document.body.appendChild(importInput);
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    if (file.size > 2_000_000) { openBag(); showGuide('저장파일이 너무 커! 2MB 이하 JSON 파일을 선택해줘.'); return; }
    try {
      const data = validatedArchive(JSON.parse(await file.text()));
      if (!data) { openBag(); showGuide('마법정원 v1 저장파일이 아니거나 내용이 손상됐어.'); return; }
      pendingImport = data;
      openModal('📥 저장파일 확인',
        '<p>불러올 지역: <b>' + ZONE_LABELS[data.zone] + '</b></p>' +
        '<p>🌱 씨앗 ' + data.seeds + '개 · 🍓 열매 ' + data.berries + '개 · 🐾 몬스터 ' + data.monsters.length + '마리</p>' +
        '<p><b>적용하면 현재 기기의 진행 내용이 이 파일로 바뀌어.</b> 기존 진행이 필요하다면 먼저 내보내기로 백업해줘.</p>' +
        '<button type="button" class="link-button" data-game-action="confirm-import">이 저장파일 적용하기</button>' +
        '<button type="button" class="link-button secondary-action" data-game-action="cancel-import">취소하고 가방으로</button>');
    } catch {
      openBag();
      showGuide('저장파일을 읽지 못했어. 정상적인 JSON 파일인지 확인해줘.');
    }
  });
  modalContent.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-game-action]');
    if (!button) return;
    const action = button.dataset.gameAction;
    if (action === 'brew') {
      if (saveData.berries < 3) { showGuide('🍓 열매 3개가 필요해! 텃밭에서 수확해봐.'); return; }
      saveData.berries -= 3; saveData.essence += 1;
      emitBurst(660, 430, 'alchemy');
      showGuide('펑! 열매가 반짝이는 마법 정수로 변했어!'); openLab();
    } else if (action === 'craft-egg') {
      if (saveData.essence < 2) { showGuide('✨ 마법 정수 2개가 필요해!'); return; }
      saveData.essence -= 2; saveData.eggs += 1;
      emitBurst(660, 430, 'egg');
      showGuide('앗! 신비한 알이 생겼어. 몬스터 연구소로 가져가 봐!'); openLab();
    } else if (action === 'incubate') {
      if (saveData.eggs < 1 || saveData.incubatingAt !== null) { showGuide('부화할 수 있는 알이 아직 없어!'); return; }
      saveData.eggs -= 1; saveData.incubatingAt = Date.now();
      emitBurst(685, 430, 'egg');
      showGuide('고양이가 알을 포근한 이불에 눕혔어. 30초 동안 기다려봐!'); openNursery();
    } else if (action === 'hatch') {
      if (saveData.incubatingAt === null) return;
      if (Date.now() - saveData.incubatingAt < HATCH_TIME_MS) { showGuide('아직 깨어나는 중이야! 조금만 더 기다려줘.'); openNursery(); return; }
      const kind = MONSTER_KINDS[saveData.monsters.length % MONSTER_KINDS.length];
      saveData.monsters.push(kind); saveData.incubatingAt = null;
      emitBurst(685, 415, 'hatch');
      showGuide('축하해! 🎉 ' + kind + '이(가) 정원의 새 친구가 됐어!'); openNursery();
    } else if (action?.startsWith('bag-tab-')) {
      const key=action.slice(8);
      if(key==='all'||key==='crop'||key==='magic'||key==='friends'){bagTab=key;openBag();}
      return;
    } else if (action?.startsWith('bag-item-')) {
      const key=action.slice(9);
      if(bagList.some(item=>item.key===key)){bagChoice=key as BagKey;openBag();}
      return;
    } else if (action==='open-book') {
      openBook();return;
    } else if (action === 'creek-toggle') {
      if (prefersReducedMotion) {
        showGuide('움직임 줄이기 설정을 사용 중이라 계곡 물빛은 정지 상태야.'); return;
      }
      creekUserPaused = creekLoadFailed ? false : !creekUserPaused;
      creekLoadFailed = false;
      creekOverlay.visible = !creekUserPaused && creekLoaded && currentZone === 'town';
      if (!creekUserPaused && !creekLoaded && currentZone === 'town') void loadCreekArt();
      openHelp(); return;
    } else if (action === 'save-export') {
      try {
        const blob = new Blob([JSON.stringify(saveArchive(), null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'gomfox-magic-garden-save-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);
        showGuide('저장파일 다운로드를 요청했어. 파일이 저장됐는지 확인해줘!');
      } catch {
        showGuide('저장파일을 준비하지 못했어. 브라우저 저장 기능을 확인해줘.');
      }
      return;
    } else if (action === 'save-import') {
      importInput.click();
      return;
    } else if (action === 'confirm-import') {
      if (!pendingImport) { openBag(); return; }
      const imported = pendingImport;
      pendingImport = null;
      Object.assign(saveData, imported);
      if (currentZone !== imported.zone) switchZone(imported.zone);
      drawPlots(); updateHud();
      const saved = persist();
      closeModal();
      showGuide(saved ? '저장파일을 불러왔어! 마법정원으로 돌아온 걸 환영해!' : '파일 내용은 불러왔지만 브라우저 자동 저장에 실패했어.');
      return;
    } else if (action === 'cancel-import') {
      pendingImport = null; openBag(); return;
    } else if (action?.startsWith('zone-')) {
      const next = action.slice(5);
      if (Object.prototype.hasOwnProperty.call(ZONE_LABELS, next)) {
        closeModal(); switchZone(next as Zone);
      }
      return;
    } else {
      return;
    }
    updateHud(); persist();
  });

  function switchZone(next: Zone) {
    const request = ++transitionToken;
    if (currentZone === next) return;
    if (!readyRasters.has(next)) {
      showGuide('새로운 풍경을 준비하고 있어요. 잠시만 기다려 주세요.');
      void loadRaster(next).then((ready) => {
        if (request !== transitionToken) return;
        if (!ready) {
          showGuide('풍경을 불러오지 못했어요. 연결을 확인하고 다시 눌러 주세요.');
          return;
        }
        switchZone(next);
      });
      return;
    }
    currentZone = next;
    saveData.zone = next;
    // Zone-specific art must never leak into the next painted room.
    for(const item of ambientItems) item.sprite.visible=item.anchor.zone===next;
    for(const item of foregroundItems) item.sprite.visible=item.anchor.zone===next;
    clearBurstEffects();
    closeModal();
    creekOverlay.visible = next === 'town' && creekLoaded && !creekUserPaused && !prefersReducedMotion;
    if (next === 'town' && !prefersReducedMotion && !creekUserPaused) void loadCreekArt();
    background.texture = art[next];
    background.width = WORLD_WIDTH;
    background.height = WORLD_HEIGHT;
    void loadRaster(next);
    px = next === 'farm' ? 218 : next === 'town' ? 940 : 610;
    py = 562; tx = px; ty = py;
    plannedRoute = [];
    clearRouteHints();
    walkHeading = 'down';
    horizontalFacing = 1;
    walkDistance = 0;
    footstepDistance = 0;
    gateLabel.text = ZONE_NAV[NEXT_ZONE[next]] + ' →';
    gate.position.set(next === 'town' ? 1110 : next === 'farm' ? 154 : 1060, 600);
    gate.zIndex=footDepth(600)+18;
    plotViews.forEach((plot) => { plot.visible = next === 'farm'; });
    walkMark.visible = false;
    station.visible = next === 'lab' || next === 'nursery';
    station.position.set(next === 'lab' ? 660 : 685, 485);
    station.zIndex=footDepth(485)+22;
    stationText.text = next === 'lab' ? '조합 시작' : '부화실 열기';
    refreshWorldSignArt(next);
    const loc = next === 'farm' ? '큰 텃밭에 도착했어! 흙을 눌러 씨앗을 심어봐.' : next === 'lab' ? '토끼의 실험실이야! 수확한 열매로 신기한 조합을 해봐.' : next === 'nursery' ? '고양이가 돌보는 몬스터 연구소야. 알을 부화시켜봐!' : '햇살 마을에 돌아왔어. 여우 친구가 반겨줄 거야!';
    showGuide(loc); updateHud(); persist(); drawPlots();
    refreshCamera(true);
  }
  // Camera follows the character gently, but viewport or zone changes snap to a safe target.
  function refreshCamera(instant = false, elapsedMs = 16.667) {
    const width = Math.max(1, stageElement.clientWidth);
    const height = Math.max(1, stageElement.clientHeight);
    const target = calculateCameraTarget(width, height, WORLD_WIDTH, WORLD_HEIGHT, px, py);
    if (Math.abs(world.scale.x - target.scale) > .0001) {
      world.scale.set(target.scale);
      instant = true;
    }
    world.position.set(
      instant ? target.x : smoothFollow(world.x, target.x, elapsedMs, 120),
      instant ? target.y : smoothFollow(world.y, target.y, elapsedMs, 120),
    );
  }
  function guideFoxTo(tapped: Point) {
    const route = planGardenRoute(currentZone, { x: px, y: py }, tapped);
    if (!route.length) {
      plannedRoute = [];
      clearRouteHints();
      tx = px; ty = py;
      walkMark.visible = false;
      if (Math.hypot(tapped.x-px,tapped.y-py) > 5) showGuide('그곳으로 가는 길을 찾지 못했어. 다른 길을 눌러줘!');
      return;
    }
    plannedRoute = route;
    showRouteHints({ x: px, y: py }, route);
    tx = route[0].x; ty = route[0].y;
    const last = route[route.length - 1];
    if (!isWalkable(currentZone, tapped.x, tapped.y)) showGuide('그곳은 지나갈 수 없어서 가까운 길까지 안내할게!');
    markAge = 0;
    walkMark.position.set(last.x, last.y);
    walkMark.zIndex = last.y + 2;
    walkMark.alpha = 1;
    walkMark.scale.set(1);
    walkMark.visible = true;
  }
  background.on('pointertap', (event) => {
    if (!modalRoot.classList.contains('hidden')) return;
    const local = world.toLocal(event.global);
    guideFoxTo({
      x: Math.min(WORLD_WIDTH - 70, Math.max(70, local.x)),
      y: Math.min(WORLD_HEIGHT - 58, Math.max(350, local.y)),
    });
  });
  // The brook lies left of the default town spawn and is off-screen on portrait phones.
  // This painted button follows the same collision-aware walking path, then the camera follows.
  creekVisitButton.addEventListener('click', () => {
    if (currentZone !== 'town') return;
    if (!modalRoot.classList.contains('hidden')) closeModal();
    guideFoxTo({ x: 528, y: 675 });
    showGuide('계곡 쪽으로 산책해보자! 물빛이 반짝이는 곳까지 걸어갈게.');
    if (!prefersReducedMotion && !creekUserPaused) void loadCreekArt();
  });
  window.addEventListener('resize', () => refreshCamera(true));
  window.visualViewport?.addEventListener('resize', () => refreshCamera(true));
  townButton.addEventListener('click', () => switchZone('town'));
  farmButton.addEventListener('click', () => switchZone('farm'));
  labButton.addEventListener('click', () => switchZone('lab'));
  nurseryButton.addEventListener('click', () => switchZone('nursery'));
  (document.getElementById('bag-button') as HTMLButtonElement).addEventListener('click', openBag);
  (document.getElementById('map-button') as HTMLButtonElement).addEventListener('click', () => openModal('🗺️ 마법정원 월드', '<p>가고 싶은 지역을 눌러 바로 이동해봐!</p><div class="zone-choices"><button class="link-button" type="button" data-game-action="zone-town">🏡 중앙 마을</button><button class="link-button" type="button" data-game-action="zone-farm">🌿 큰 텃밭</button><button class="link-button" type="button" data-game-action="zone-lab">🧪 실험실</button><button class="link-button" type="button" data-game-action="zone-nursery">🥚 연구소</button></div><p class="modal-note">숲길·계곡·나무다리는 마을 풍경에 일부 있어. 별도의 탐험 지역과 집 안 공간은 아직 준비 중이야.</p>'));

  (document.getElementById('book-button') as HTMLButtonElement).addEventListener('click', openBook);
  function openHelp() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const switchLabel = creekUserPaused || creekLoadFailed ? '계곡 물결 다시 켜기' : '계곡 물결 잠시 멈추기';
    openModal('💡 어떻게 놀까?', '<ul><li>빈 땅을 누르면 여우가 4방향으로 걸어가! 장애물이 있으면 반짝이는 길 표시를 따라 돌아가며, 막힌 곳은 가까운 안전한 위치로 이동해.</li><li>여우·곰·고양이·토끼를 누르면 각자의 이야기를 듣고 관련 지역으로 이동할 수 있어.</li><li>지역 버튼이나 화면의 길 안내판, 지도 메뉴로 4개 구역을 오갈 수 있어.</li><li>텃밭에 씨앗을 심고 자라면 다시 눌러 수확해.</li><li>실험실에서 열매를 정수로, 정수를 알로 조합해!</li><li>연구소에서 알을 품으면 30초 후 친구가 부화해.</li><li>가방에서 JSON 저장파일을 내려받고 다른 기기로 불러올 수 있어.</li><li>진행 내용은 이 브라우저에 자동 저장돼.</li></ul>' +
      '<section class="creek-help" aria-label="계곡 물결 효과"><span class="creek-paint" aria-hidden="true"></span><div class="creek-help-copy"><strong>마을의 살아 있는 계곡</strong><p id="creek-state">' + creekStatusText() + '</p></div>' +
      '<button class="link-button secondary-action" type="button" data-game-action="creek-toggle"' +
      (reduced ? ' disabled title="움직임 줄이기가 설정되어 있어요"' : '') + '>' + switchLabel + '</button>' +
      '<p class="modal-note">마을에 가서 물가를 살펴봐. 움직임 줄이기를 사용하면 물의 움직임은 자동으로 꺼져.</p></section>');
  }
  (document.getElementById('help-button') as HTMLButtonElement).addEventListener('click', openHelp);

  if (currentZone !== 'town') { const firstZone = currentZone; currentZone = 'town'; switchZone(firstZone); }
  else { gateLabel.text = ZONE_NAV[NEXT_ZONE.town] + ' →'; gate.position.set(1110, 600); plotViews.forEach((plot) => { plot.visible = false; }); station.visible = false; refreshWorldSignArt('town'); }
  drawPlots(); updateHud(); refreshCamera(true);
  app.ticker.add((ticker) => {
    const dt = Math.min(2.4, ticker.deltaTime);
    clock += ticker.deltaMS;
    // 30fps 이하로만 좌표를 갱신해 모바일 GPU/CPU 사용량을 억제한다.
    if (creekShouldAnimate(currentZone, prefersReducedMotion || creekUserPaused, creekLoaded && creekOverlay.visible)) {
      creekElapsed += Math.min(ticker.deltaMS, 66.7);
      creekUpdateElapsed += Math.min(ticker.deltaMS, 66.7);
      if (creekUpdateElapsed >= 33.33) {
        creekUpdateElapsed = 0;
        for (const particle of creekSprites) {
          const pos = particle.waterfall ?
            creekFallPose(particle.index, creekElapsed) :
            creekSurfacePose(particle.index, creekElapsed);
          particle.sprite.position.set(pos.x,pos.y);
          particle.sprite.rotation = particle.waterfall ? 0 : pos.angle;
          // 투명 수면 반짝임은 수시로 옅어져 반복 패턴의 기계적인 느낌을 줄인다.
          particle.sprite.alpha = (particle.waterfall ? .54 : .60) +
            Math.sin(creekElapsed / 730 + particle.index * 1.93) * .075;
        }
      }
    }
    // Tapping a menu cancels walking instead of leaving the fox moving under a dialog.
    if (!modalRoot.classList.contains('hidden')) {
      plannedRoute = [];
      clearRouteHints();
      tx = px; ty = py;
      walkMark.visible = false;
    }
    const dx = tx - px, dy = ty - py, distance = Math.hypot(dx, dy);
    const nextStep = advanceMovement(px, py, tx, ty, Math.min(ticker.deltaMS, 40));
    const validStep = segmentIsWalkable(currentZone, { x: px, y: py }, { x: nextStep.x, y: nextStep.y });
    if (!validStep) {
      plannedRoute = [];
      clearRouteHints();
      tx = px; ty = py;
      walkMark.visible = false;
    }
    const moving = validStep && nextStep.traveled > .001;
    if (moving) {
      const moveX = nextStep.x - px;
      const moveY = nextStep.y - py;
      px = nextStep.x; py = nextStep.y;
      // Actual world displacement, not a screen tap or remaining target, determines facing.
      walkHeading = resolveWalkHeading(moveX, moveY, walkHeading);
      horizontalFacing = resolveHorizontalFacing(moveX, walkHeading, horizontalFacing);
      walkDistance += nextStep.traveled;
      footstepDistance += nextStep.traveled;
      if (footstepDistance >= 27) {
        footstepDistance %= 27;
        leaveFootprint(px, py, moveX, moveY);
      }
    } else {
      if (validStep) { px = nextStep.x; py = nextStep.y; }
      footstepDistance = 0;
    }
    // Consume a reached waypoint before the next ticker; no frame uses a diagonal shortcut through scenery.
    if (validStep && plannedRoute.length && Math.hypot(px-tx,py-ty) <= 2.5) {
      plannedRoute.shift();
      if (plannedRoute.length) { tx=plannedRoute[0].x; ty=plannedRoute[0].y; }
      else { tx=px; ty=py; clearRouteHints(); }
    }
    // 전용 4방향 원화는 원본 텍스처를 교체하고 거울 반전은 대체 원화에서만 사용한다.
    // 상하 방향은 약한 자세 변화와 이동 거리 기반 걸음으로 표현한다.
    const moveTilt = moving && !prefersReducedMotion ? Math.max(-1, Math.min(1, dx / distance)) * .075 : 0;
    player.rotation += (moveTilt - player.rotation) * Math.min(1, dt * .23);
    const moveSkew = moving && !prefersReducedMotion ? (walkHeading === 'up' ? -.095 : walkHeading === 'down' ? .095 : 0) : 0;
    player.skew.x += (moveSkew - player.skew.x) * Math.min(1, dt * .21);
    // 실제 이동 거리에 비례해 발걸음이 진행된다. 목적지에서 멈추면 걷기 애니메이션도 멈춘다.
    const perspective = .61 + Math.max(0, Math.min(1, (py - 350) / 450)) * .11;
    const stride = walkDistance / 12;
    const playerBounce = prefersReducedMotion ? 0 : moving ? Math.abs(Math.sin(stride)) * 6.5 : Math.sin(clock / 520) * .8;
    const walkingSquash = !prefersReducedMotion && moving ? Math.cos(stride * 2) * .046 : 0;
    const depthLean = moving && !prefersReducedMotion ? (walkHeading === 'up' ? .93 : walkHeading === 'down' ? 1.05 : 1) : 1;
    // 방향 전용 원화는 거울 반전을 쓰지 않고 원본 프레임을 선택한다.
    if (foxFourWayReady) {
      const directionTexture = foxDirections[walkHeading];
      if (directionTexture && player.texture !== directionTexture) player.texture = directionTexture;
    }
    const renderFacing = foxFourWayReady ? 1 : horizontalFacing;
    const renderArtScale = foxFourWayReady ? foxArtScale : friendArtScale;
    player.scale.set(renderFacing * perspective * renderArtScale * (1 + walkingSquash), perspective * renderArtScale * depthLean * (prefersReducedMotion ? 1 : 1 + Math.sin(clock / 440) * .009 - walkingSquash));
    player.position.set(px, py - playerBounce);
    player.zIndex = py;
    playerShadow.position.set(px, py + 4);
    playerShadow.zIndex = py - .1;
    playerShadow.scale.set(perspective * 1.18 * (1 - playerBounce / 22));
    for (let i = footprints.length - 1; i >= 0; i--) {
      const track = footprints[i];
      track.age += ticker.deltaMS;
      track.sprite.alpha = Math.max(0, 1 - track.age / 750);
      if (track.age >= 750) {
        track.sprite.destroy();
        footprints.splice(i, 1);
      }
    }
    if (walkMark.visible) {
      if (plannedRoute.length > 0) {
        markAge = 0;
        walkMark.alpha = prefersReducedMotion ? .85 : .75 + .1 * Math.sin(clock / 250);
        walkMark.scale.set(prefersReducedMotion ? 1 : 1 + .06 * Math.sin(clock / 220));
        if (routeHints.visible) routeHints.alpha = prefersReducedMotion ? .68 : .65 + .15 * Math.sin(clock / 250);
      } else {
        markAge += ticker.deltaMS;
        walkMark.alpha = Math.max(0, 1 - markAge / 450);
        walkMark.scale.set(.95 + markAge / 1800);
        if (markAge >= 450) walkMark.visible = false;
      }
    }
    npcs.forEach((sprite, i) => {
      const baseX = currentZone === 'town' ? [875, 1015, 620][i] : [946, 735, 330][i];
      const baseY = currentZone === 'town' ? [553, 577, 414][i] : [540, 385, 634][i];
      const patrolPhase = clock / (1100 + i * 320) + i;
      const x = baseX + (prefersReducedMotion ? 0 : Math.sin(patrolPhase) * 19);
      const y = baseY + (prefersReducedMotion ? 0 : Math.cos(clock / (320 + i * 100)) * 2);
      const size = .59 + Math.max(0, Math.min(1, (y - 350) / 450)) * .1;
      const breathe = prefersReducedMotion ? 1 : 1 + Math.sin(clock / (520 + i * 100) + i) * .018;
      // 반환점 부근에서 방향을 매 프레임 반전하지 않도록 작은 완충 구간을 둔다.
      const patrolVelocity = Math.cos(patrolPhase);
      if (!prefersReducedMotion && Math.abs(patrolVelocity) > .18) npcFacingMemory[i] = patrolVelocity > 0 ? 1 : -1;
      const npcFacing = npcFacingMemory[i];
      const npcStep = prefersReducedMotion ? 0 : Math.abs(Math.sin(patrolPhase * 5)) * 2.4;
      sprite.scale.set(npcFacing * size * friendArtScale, size * friendArtScale * breathe);
      sprite.rotation = prefersReducedMotion ? 0 : npcFacing * Math.sin(patrolPhase * 5) * .037;
      sprite.position.set(x, y - npcStep);
      sprite.zIndex = y;
      npcShadows[i].position.set(x, y + 4);
      npcShadows[i].zIndex = y - .1;
      npcShadows[i].scale.set(size * 1.15);
    });
    if (!prefersReducedMotion) {
      gate.position.y = 600 + Math.sin(clock / 750) * 2;
      if (station.visible) station.position.y = 485 + Math.sin(clock / 520) * 3;
      if (currentZone === 'farm') {
        cropArtViews.forEach((plant, i) => {
          const planted = saveData.plots[i].plantedAt !== null;
          plant.rotation = planted ? Math.sin(clock / (460 + i * 13) + i * .8) * .029 : 0;
          const pulse = ripePlots[i] ? 1 + Math.sin(clock / 230 + i) * .045 : 1;
          plant.scale.set(pulse);
        });
      }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i];
      burst.age += ticker.deltaMS;
      const frameStep = Math.min(2, ticker.deltaMS / 16.667);
      burst.sprite.position.x += burst.vx * frameStep;
      burst.sprite.position.y += burst.vy * frameStep;
      burst.sprite.alpha = Math.max(0, 1 - burst.age / burst.life);
      burst.sprite.scale.set(burst.baseScale*(.85+burst.age/burst.life*.4));
      if (burst.age >= burst.life) {
        burst.sprite.destroy();
        bursts.splice(i, 1);
      }
    }
    ambientUpdateElapsed+=Math.min(ticker.deltaMS,66.7);
    // At most 20 position updates per second; frozen decorative originals
    // remain visible when the user enables reduced-motion accessibility.
    if(ambientUpdateElapsed>=50){
      ambientUpdateElapsed=0;
      for(const {sprite,anchor} of ambientItems){
        if(anchor.zone!==currentZone || !sprite.visible) continue;
        const pose=ambiencePose(anchor,clock,prefersReducedMotion);
        sprite.position.set(pose.x,pose.y);
        sprite.rotation=pose.rotation;
        sprite.alpha=pose.alpha;
        const originalScale=anchor.size/180;
        sprite.scale.set(originalScale*pose.scale);
      }
      // Same 20fps budget as background ambience; only current zone updates.
      for(const {sprite,anchor} of foregroundItems){
        if(anchor.zone!==currentZone || !sprite.visible)continue;
        const motion=foregroundMotion(anchor,clock,prefersReducedMotion);
        sprite.rotation=motion.rotation;
        sprite.alpha=motion.opacity;
      }
    }
    if (clock - lastCropRender > 420) { lastCropRender = clock; if (currentZone === 'farm') drawPlots(); }
    if (clock - lastNurseryRender > 500) {
      lastNurseryRender = clock;
      const liveStatus = document.getElementById('hatch-live-status');
      const progressFill = document.getElementById('hatch-progress-fill');
      if (liveStatus && progressFill && saveData.incubatingAt !== null) {
        const age = Math.max(0, Date.now() - saveData.incubatingAt);
        const remaining = Math.max(0, Math.ceil((HATCH_TIME_MS - age) / 1000));
        const percent = Math.min(100, Math.floor(age / HATCH_TIME_MS * 100));
        setGuideIllustrations(liveStatus, remaining ? `🐱 고양이가 알을 돌보는 중… ${remaining}초` : '✨ 알이 반짝반짝! 부화시켜봐!');
        progressFill.style.width = percent + '%';
        progressFill.parentElement?.setAttribute('aria-valuenow', String(percent));
        const button = modalContent.querySelector<HTMLButtonElement>('button[data-game-action="hatch"]');
        if (button) {
          button.disabled = remaining > 0;
          const renderState = remaining > 0 ? 'waiting' : 'ready';
          if (button.dataset.renderState !== renderState) {
            button.dataset.renderState = renderState;
            button.innerHTML = iconHTML('egg') + (remaining > 0 ? '알을 품고 있어…' : '부화 확인하기');
          }
        }
      }
    }
    refreshCamera(false, Math.min(ticker.deltaMS, 40));
  });
  document.querySelectorAll<HTMLButtonElement>('button[data-boot-control]').forEach((button) => { button.disabled = false; });
  showGuide(saveData.zone === 'farm' ? '밭을 눌러 씨앗을 심어봐!' : saveData.zone === 'lab' ? '조합대를 터치해 마법 정수를 만들어봐!' : saveData.zone === 'nursery' ? '부화실을 터치해 새 친구를 만나봐!' : '길을 클릭하거나 터치하면 걸어갈 수 있어!');
}
start().catch((error: unknown) => {
  // Pixi v8 needs GPU rendering. On restricted browsers, show the raster
  // scenery as an explicitly limited preview, without changing saved progress.
  const message = error instanceof Error ? error.message : String(error);
  const fallbackImages: Record<Zone, string> = {
    town: 'town-scene-v1.webp',
    farm: 'farm-scene-v1.webp',
    lab: 'lab-scene-v1.webp',
    nursery: 'nursery-scene-v1.webp',
  };
  gardenRoot.classList.add('garden-renderer-preview');
  const note = document.createElement('p');
  note.className = 'garden-renderer-notice';
  note.setAttribute('role', 'status');
  note.textContent = '그래픽 가속을 사용할 수 없는 브라우저라 풍경 미리보기만 표시 중이야. 게임 조작은 그래픽 지원 브라우저에서 이용해 줘.';
  stageElement.replaceChildren(note);
  const buttons: Record<Zone, HTMLButtonElement> = {
    town: townButton, farm: farmButton, lab: labButton, nursery: nurseryButton,
  };
  const showPreview = (zone: Zone) => {
    stageElement.style.backgroundImage = 'url("' + import.meta.env.BASE_URL + 'assets/' + fallbackImages[zone] + '")';
    stageElement.style.backgroundPosition = 'center';
    stageElement.style.backgroundSize = 'cover';
    stageElement.style.backgroundRepeat = 'no-repeat';
    zoneNameElement.textContent = ZONE_LABELS[zone];
    for (const key of Object.keys(buttons) as Zone[]) {
      buttons[key].classList.toggle('active', key === zone);
    }
  };
  for (const zone of Object.keys(buttons) as Zone[]) {
    buttons[zone].addEventListener('click', () => showPreview(zone));
  }
  Object.values(buttons).forEach((button) => { button.disabled = false; });
  showPreview(saveData.zone);
  console.warn('Garden renderer preview mode:', message);
});
