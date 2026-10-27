import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import './style.css';

type Zone = 'town' | 'farm';
type Plot = { plantedAt: number | null };
type SaveData = { zone: Zone; seeds: number; berries: number; plots: Plot[] };
type Critter = 'fox' | 'bear' | 'cat' | 'rabbit';

const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 800;
const SAVE_KEY = 'gomfox.magic-garden.prototype.v1';
const GROW_TIME_MS = 18000;
const stageElement = document.getElementById('stage') as HTMLDivElement;
const zoneNameElement = document.getElementById('zone-name') as HTMLElement;
const guideElement = document.getElementById('guide') as HTMLElement;
const seedElement = document.getElementById('seed-count') as HTMLElement;
const berryElement = document.getElementById('berry-count') as HTMLElement;
const townButton = document.getElementById('town-button') as HTMLButtonElement;
const farmButton = document.getElementById('farm-button') as HTMLButtonElement;
const modalRoot = document.getElementById('modal-root') as HTMLElement;
const modalTitle = document.getElementById('modal-title') as HTMLElement;
const modalContent = document.getElementById('modal-content') as HTMLElement;

function restored(): SaveData {
  const fallback: SaveData = { zone: 'town', seeds: 5, berries: 0, plots: Array.from({ length: 12 }, () => ({ plantedAt: null })) };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;
    const parsed: Partial<SaveData> = JSON.parse(raw);
    if (parsed.zone !== 'town' && parsed.zone !== 'farm') return fallback;
    if (!Array.isArray(parsed.plots) || parsed.plots.length !== 12) return fallback;
    return {
      zone: parsed.zone,
      seeds: Math.max(0, Number(parsed.seeds) || 0),
      berries: Math.max(0, Number(parsed.berries) || 0),
      plots: parsed.plots.map((plot) => ({
        plantedAt: typeof plot?.plantedAt === 'number' && Number.isFinite(plot.plantedAt) ? plot.plantedAt : null,
      })),
    };
  } catch {
    return fallback;
  }
}

const saveData = restored();
let guideTimeout = 0;
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); }
  catch { showGuide('저장 공간이 부족해서 이번 변경을 저장하지 못했어.'); }
}
function showGuide(message: string) {
  guideElement.textContent = message;
  window.clearTimeout(guideTimeout);
  guideTimeout = window.setTimeout(() => { guideElement.textContent = saveData.zone === 'farm' ? '밭을 눌러 심고, 자라면 다시 눌러 수확해!' : '길을 눌러 움직이고, 큰 텃밭으로 여행해봐!'; }, 5000);
}
function updateHud() {
  seedElement.textContent = String(saveData.seeds);
  berryElement.textContent = String(saveData.berries);
  zoneNameElement.textContent = saveData.zone === 'town' ? '햇살 중앙 마을' : '바람의 큰 텃밭';
  townButton.classList.toggle('active', saveData.zone === 'town');
  farmButton.classList.toggle('active', saveData.zone === 'farm');
}
function openModal(title: string, content: string) {
  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modalRoot.classList.remove('hidden');
}
function closeModal() { modalRoot.classList.add('hidden'); }
(document.getElementById('modal-close') as HTMLButtonElement).addEventListener('click', closeModal);
modalRoot.addEventListener('click', (event) => { if (event.target === modalRoot) closeModal(); });

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
  const world = new Container();
  world.sortableChildren = true;
  app.stage.addChild(world);
  const art = { town: Texture.from(paintLandscape('town')), farm: Texture.from(paintLandscape('farm')) };
  const creatures: Record<Critter, Texture> = { fox: mascotTexture('fox'), bear: mascotTexture('bear'), cat: mascotTexture('cat'), rabbit: mascotTexture('rabbit') };
  const background = new Sprite(art[saveData.zone]);
  const rasterAssets: Record<Zone, string> = {
    town: 'town-scene-v1.png',
    farm: 'farm-scene-v1.png',
  };
  const loadingRasters: Partial<Record<Zone, Promise<void>>> = {};
  function loadRaster(zone: Zone): Promise<void> {
    if (loadingRasters[zone]) return loadingRasters[zone];
    // 고품질 원화는 해당 지역에 들어갈 때만 로드한다. 실패해도 기본 그림으로 플레이할 수 있다.
    const url = `${import.meta.env.BASE_URL}assets/${rasterAssets[zone]}`;
    const load = Assets.load<Texture>(url).then((texture) => {
      art[zone] = texture;
      if (saveData.zone === zone) background.texture = texture;
    }).catch(() => {
      // 오프라인 또는 저속 연결에서는 절차적 Canvas 배경을 그대로 사용한다.
    });
    loadingRasters[zone] = load;
    return load;
  }
  background.width = WORLD_WIDTH;
  background.height = WORLD_HEIGHT;
  background.eventMode = 'static';
  world.addChild(background);
  void loadRaster(saveData.zone);
  const objects = new Container(); objects.sortableChildren = true; world.addChild(objects);
  const cropsLayer = new Container(); cropsLayer.zIndex = 5; objects.addChild(cropsLayer);
  const player = new Sprite(creatures.fox);
  player.anchor.set(.5, 1);
  player.scale.set(.72);
  player.zIndex = 15;
  objects.addChild(player);
  const npcKinds: Critter[] = ['bear', 'cat', 'rabbit'];
  const npcs = npcKinds.map((kind, i) => {
    const sprite = new Sprite(creatures[kind]);
    sprite.anchor.set(.5, 1); sprite.scale.set(.65); sprite.zIndex = 9 + i;
    objects.addChild(sprite);
    return sprite;
  });
  const gate = new Container();
  gate.zIndex = 11; objects.addChild(gate);
  const gateBackground = new Graphics().roundRect(-98, -30, 196, 60, 18).fill({ color: '#fff4d1', alpha: .96 }).roundRect(-98, -30, 196, 60, 18).stroke({ color: '#a78054', width: 4 });
  const gateLabel = new Text({ text: '큰 텃밭으로 →', style: { fontFamily: 'sans-serif', fontSize: 22, fontWeight: 'bold', fill: '#694a2e' } });
  gateLabel.anchor.set(.5);
  gate.addChild(gateBackground, gateLabel);
  gate.eventMode = 'static'; gate.cursor = 'pointer';
  gate.on('pointertap', () => switchZone(saveData.zone === 'town' ? 'farm' : 'town'));

  const plotViews: Graphics[] = [];
  for (let i = 0; i < 12; i++) {
    const plot = new Graphics();
    const col = i % 4, row = Math.floor(i / 4);
    plot.position.set(410 + col * 191, 476 + row * 105);
    plot.zIndex = 4 + row;
    plot.eventMode = 'static'; plot.cursor = 'pointer';
    plot.on('pointertap', () => interactPlot(i));
    cropsLayer.addChild(plot); plotViews.push(plot);
  }
  let currentZone: Zone = saveData.zone;
  let px = currentZone === 'town' ? 619 : 247;
  let py = 585;
  let tx = px, ty = py;
  let clock = 0;
  let lastCropRender = 0;

  function drawPlots() {
    plotViews.forEach((plot, i) => {
      const crop = saveData.plots[i];
      plot.clear();
      plot.roundRect(-64, -26, 128, 75, 13).fill({ color: '#78411c', alpha: .22 });
      plot.roundRect(-64, -26, 128, 75, 13).stroke({ color: '#f0d3a0', alpha: .76, width: 2 });
      for (let line = 0; line < 3; line++) plot.moveTo(-54, -5 + line * 15).lineTo(54, -5 + line * 15).stroke({ color: '#6e401f', alpha: .35, width: 3 });
      if (crop.plantedAt !== null) {
        const percent = Math.min(1, Math.max(0, (Date.now() - crop.plantedAt) / GROW_TIME_MS));
        const scale = .55 + percent * .65;
        for (let sprout = -1; sprout <= 1; sprout++) {
          const sx = sprout * 27;
          plot.moveTo(sx, 19).lineTo(sx, 15 - 27 * scale).stroke({ color: '#4a9654', width: 6 });
          plot.ellipse(sx - 9, 9 - 20 * scale, 13 * scale, 7 * scale).fill({ color: '#65b95c' });
          plot.ellipse(sx + 9, 8 - 22 * scale, 13 * scale, 7 * scale).fill({ color: '#34884d' });
          if (percent >= 1) plot.circle(sx, 1, 9).fill({ color: '#ec5f6a' }).circle(sx - 3, -2, 3).fill({ color: '#fff3c8' });
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
      showGuide('톡! 씨앗을 심었어. 잠시 후 예쁜 열매가 열릴 거야.');
    } else if (Date.now() - crop.plantedAt >= GROW_TIME_MS) {
      crop.plantedAt = null;
      saveData.seeds += 2;
      saveData.berries += 3;
      showGuide('수확 성공! 🍓 열매 3개와 씨앗 2개를 얻었어!');
    } else {
      const remaining = Math.max(1, Math.ceil((GROW_TIME_MS - (Date.now() - crop.plantedAt)) / 1000));
      showGuide('쑥쑥 자라는 중이야! 약 ' + remaining + '초 후 수확할 수 있어.');
    }
    drawPlots(); updateHud(); persist();
  }
  function switchZone(next: Zone) {
    if (currentZone === next) return;
    currentZone = next;
    saveData.zone = next;
    background.texture = art[next];
    void loadRaster(next);
    px = next === 'farm' ? 218 : 940;
    py = 562; tx = px; ty = py;
    gateLabel.text = next === 'town' ? '큰 텃밭으로 →' : '← 중앙 마을로';
    gate.position.set(next === 'town' ? 1110 : 154, 600);
    cropsLayer.visible = next === 'farm';
    const loc = next === 'farm' ? '큰 텃밭에 도착했어! 흙을 눌러 씨앗을 심어봐.' : '햇살 마을에 돌아왔어. 여우 친구가 반겨줄 거야!';
    showGuide(loc); updateHud(); persist(); drawPlots();
    resize();
  }
  function resize() {
    const width = Math.max(1, stageElement.clientWidth), height = Math.max(1, stageElement.clientHeight);
    const portrait = width / height < .85;
    const scale = portrait ? Math.max(width / 760, height / 930) : Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    world.scale.set(scale);
    const worldWidth = WORLD_WIDTH * scale, worldHeight = WORLD_HEIGHT * scale;
    let x = width * .52 - px * scale, y = height * .53 - py * scale;
    x = worldWidth <= width ? (width - worldWidth) / 2 : Math.min(0, Math.max(width - worldWidth, x));
    y = worldHeight <= height ? (height - worldHeight) / 2 : Math.min(0, Math.max(height - worldHeight, y));
    world.position.set(x, y);
  }
  background.on('pointertap', (event) => {
    const local = world.toLocal(event.global);
    tx = Math.min(WORLD_WIDTH - 70, Math.max(70, local.x));
    ty = Math.min(WORLD_HEIGHT - 58, Math.max(350, local.y));
  });
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  townButton.addEventListener('click', () => switchZone('town'));
  farmButton.addEventListener('click', () => switchZone('farm'));
  (document.getElementById('bag-button') as HTMLButtonElement).addEventListener('click', () => openModal('🎒 나의 가방', '<p>🌱 씨앗: <b>' + saveData.seeds + '개</b></p><p>🍓 새콤 열매: <b>' + saveData.berries + '개</b></p><p>수확한 열매는 나중에 이상한 조합 실험실에서 사용하게 될 거야!</p>'));
  (document.getElementById('map-button') as HTMLButtonElement).addEventListener('click', () => openModal('🗺️ 마법정원 월드', '<p>🏡 햇살 중앙 마을 · 이동 가능</p><p>🌿 바람의 큰 텃밭 · 이동 가능</p><p>🌲 나무숲 · 준비 중</p><p>💧 폭포와 호수 · 준비 중</p><p>🧪 이상한 조합 실험실 · 준비 중</p><p>🥚 몬스터 연구소 · 준비 중</p>'));
  (document.getElementById('book-button') as HTMLButtonElement).addEventListener('click', () => openModal('📖 첫 정원 도감', '<ul><li>🦊 여우 — 호기심 많은 탐험가</li><li>🐻 곰 — 정원의 듬직한 친구</li><li>🐱 고양이 — 몬스터 돌봄 담당</li><li>🐰 토끼 — 씨앗과 조합 담당</li></ul><p>다음 단계에서 식물·몬스터 도감이 늘어날 거야!</p>'));
  (document.getElementById('help-button') as HTMLButtonElement).addEventListener('click', () => openModal('💡 어떻게 놀까?', '<ul><li>빈 땅을 누르면 여우가 그곳으로 걸어가.</li><li>상단의 마을 / 텃밭 버튼으로 지역을 오가.</li><li>텃밭 갈색 흙을 누르면 씨앗을 심을 수 있어.</li><li>작물이 익으면 다시 눌러 수확해!</li><li>진행 내용은 이 브라우저에 자동 저장돼.</li></ul>'));
  if (currentZone === 'farm') { currentZone = 'town'; switchZone('farm'); }
  else { gateLabel.text = '큰 텃밭으로 →'; gate.position.set(1110, 600); cropsLayer.visible = false; }
  drawPlots(); updateHud(); resize();
  app.ticker.add((ticker) => {
    const dt = Math.min(2.4, ticker.deltaTime);
    clock += ticker.deltaMS;
    const dx = tx - px, dy = ty - py, distance = Math.hypot(dx, dy);
    if (distance > 3) {
      const step = Math.min(distance, 3.5 * dt);
      px += dx / distance * step; py += dy / distance * step;
      player.rotation = dx < -1 ? -.015 : dx > 1 ? .015 : 0;
    } else { player.rotation *= .87; }
    player.position.set(px, py + Math.sin(clock / 240) * 2);
    npcs.forEach((sprite, i) => {
      const baseX = currentZone === 'town' ? [875, 1015, 620][i] : [946, 735, 330][i];
      const baseY = currentZone === 'town' ? [553, 577, 414][i] : [540, 385, 634][i];
      sprite.position.set(baseX + Math.sin(clock / (800 + i * 300)) * 8, baseY + Math.cos(clock / (320 + i * 100)) * 2);
    });
    if (clock - lastCropRender > 1100) { lastCropRender = clock; if (currentZone === 'farm') drawPlots(); }
    if (Math.abs(dx) + Math.abs(dy) > 4) resize();
  });
  showGuide(currentZone === 'farm' ? '밭을 눌러 씨앗을 심어봐!' : '길을 클릭하거나 터치하면 걸어갈 수 있어!');
}
start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  stageElement.textContent = '정원을 열지 못했어. 새로고침 후 다시 시도해 줘. (' + message + ')';
});
