import { Rectangle, Sprite, Texture } from 'pixi.js';

export type SpriteMotion = 'idle' | 'walk' | 'run' | 'attack' | 'hit' | 'death' | 'skill';
export type SpriteDirection = 's' | 'sw' | 'w' | 'nw' | 'n' | 'ne' | 'e' | 'se';

export interface SpriteSheetMeta {
  frameWidth: number;
  frameHeight: number;
  rows: SpriteDirection[];
  actions: Record<SpriteMotion, { start: number; frames: number; fps: number; loop: boolean }>;
}

export const HUMANOID_SHEET_META: SpriteSheetMeta = {
  frameWidth: 160,
  frameHeight: 240,
  rows: ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'],
  actions: {
    idle: { start: 0, frames: 4, fps: 4, loop: true },
    walk: { start: 4, frames: 8, fps: 9, loop: true },
    run: { start: 12, frames: 8, fps: 13, loop: true },
    attack: { start: 20, frames: 8, fps: 16, loop: false },
    hit: { start: 28, frames: 4, fps: 13, loop: false },
    death: { start: 32, frames: 8, fps: 9, loop: false },
    skill: { start: 40, frames: 8, fps: 12, loop: false }
  }
};

export const MONSTER_SHEET_META: SpriteSheetMeta = {
  frameWidth: 160,
  frameHeight: 200,
  rows: ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'],
  actions: {
    idle: { start: 0, frames: 4, fps: 4, loop: true },
    walk: { start: 4, frames: 8, fps: 8, loop: true },
    run: { start: 12, frames: 8, fps: 11, loop: true },
    attack: { start: 20, frames: 8, fps: 13, loop: false },
    hit: { start: 28, frames: 4, fps: 12, loop: false },
    death: { start: 32, frames: 8, fps: 8, loop: false },
    skill: { start: 40, frames: 8, fps: 10, loop: false }
  }
};

export function directionFromIsoVector(dx: number, dy: number): SpriteDirection {
  if (Math.abs(dx) + Math.abs(dy) < 0.0001) return 's';
  const sx = dx - dy;
  const sy = dx + dy;
  const angle = Math.atan2(sy, sx);
  const octant = Math.round(angle / (Math.PI / 4));
  const normalized = (octant + 8) % 8;
  // Screen-space octants: 0 east, 1 south-east, 2 south, 3 south-west, 4 west, 5 north-west, 6 north, 7 north-east.
  return ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'][normalized] as SpriteDirection;
}

export class SpriteSheetAnimator {
  readonly sprite: Sprite;
  private frames: Record<string, Texture[]> = {};
  private motion: SpriteMotion = 'idle';
  private direction: SpriteDirection = 's';
  private elapsed = 0;
  private locked = false;
  private fallback: SpriteMotion = 'idle';

  constructor(sheet: Texture, private meta: SpriteSheetMeta, anchorY = 0.94) {
    for (const direction of meta.rows) {
      const row = meta.rows.indexOf(direction);
      for (const [motion, action] of Object.entries(meta.actions) as Array<[SpriteMotion, SpriteSheetMeta['actions'][SpriteMotion]]>) {
        const key = this.key(motion, direction);
        this.frames[key] = [];
        for (let frame = 0; frame < action.frames; frame += 1) {
          this.frames[key].push(
            new Texture({
              source: sheet.source,
              frame: new Rectangle((action.start + frame) * meta.frameWidth, row * meta.frameHeight, meta.frameWidth, meta.frameHeight),
              orig: new Rectangle(0, 0, meta.frameWidth, meta.frameHeight),
              defaultAnchor: { x: 0.5, y: anchorY }
            })
          );
        }
      }
    }
    this.sprite = new Sprite(this.currentFrames()[0]);
    this.sprite.anchor.set(0.5, anchorY);
  }

  setDirection(direction: SpriteDirection) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.applyFrame();
  }

  setMotion(motion: SpriteMotion) {
    if (this.locked && motion !== 'death') return;
    if (this.motion === motion) return;
    this.motion = motion;
    this.elapsed = 0;
    this.locked = false;
    this.applyFrame();
  }

  playOnce(motion: SpriteMotion, fallback: SpriteMotion = 'idle') {
    this.motion = motion;
    this.fallback = fallback;
    this.elapsed = 0;
    this.locked = true;
    this.applyFrame();
  }

  update(dt: number) {
    const action = this.meta.actions[this.motion];
    if (!action) return;
    this.elapsed += dt;
    const duration = action.frames / Math.max(1, action.fps);
    if (!action.loop && this.elapsed >= duration) {
      this.locked = false;
      this.setMotion(this.fallback);
      return;
    }
    this.applyFrame();
  }

  private applyFrame() {
    const frames = this.currentFrames();
    if (!frames.length) return;
    const action = this.meta.actions[this.motion];
    const rawIndex = Math.floor(this.elapsed * action.fps);
    const index = action.loop ? rawIndex % frames.length : Math.min(frames.length - 1, rawIndex);
    this.sprite.texture = frames[index];
  }

  private currentFrames() {
    return this.frames[this.key(this.motion, this.direction)] || this.frames[this.key(this.motion, 's')] || [];
  }

  private key(motion: SpriteMotion, direction: SpriteDirection) {
    return `${motion}:${direction}`;
  }
}
