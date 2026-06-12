import { Container, Graphics, Sprite, Text } from 'pixi.js';

/**
 * PixiJS 8 전투 연출을 한곳에서 관리하는 경량 헬퍼입니다.
 * - 게임 로직과 이펙트 로직을 분리해 SolGame.ts가 더 이상 거대해지지 않게 합니다.
 * - 저사양 모드에서는 호출부에서 isLite를 넘겨 이펙트 수와 지속 시간을 줄일 수 있습니다.
 * - 모든 좌표는 이미 isoToScreen으로 변환된 화면 좌표를 기준으로 받습니다.
 */
export type CombatTickerLike = {
  add: (fn: (ticker: { deltaMS: number }) => void) => void;
  remove: (fn: (ticker: { deltaMS: number }) => void) => void;
};

export type CombatSystemOptions = {
  ticker: CombatTickerLike;
  world: Container;
  fxLayer: Container;
  isLite?: () => boolean;
};

export type TweenOptions = {
  duration: number;
  ease?: (t: number) => number;
  onUpdate: (t: number) => void;
  onDone?: () => void;
};

export type FloatingDamageOptions = {
  text: string;
  x: number;
  y: number;
  color: number;
  critical?: boolean;
  important?: boolean;
};

export class CombatSystem {
  private shakeSerial = 0;

  constructor(private readonly options: CombatSystemOptions) {}

  /** 기본 Tween. ticker.deltaMS 기반이라 프레임 드랍 시에도 시간이 밀리지 않습니다. */
  tween({ duration, ease = easeOutCubic, onUpdate, onDone }: TweenOptions) {
    const realDuration = this.options.isLite?.() ? Math.max(0.07, duration * 0.72) : duration;
    let elapsed = 0;
    const tick = (ticker: { deltaMS: number }) => {
      elapsed += ticker.deltaMS / 1000;
      const raw = clamp01(elapsed / Math.max(0.001, realDuration));
      onUpdate(ease(raw));
      if (raw >= 1) {
        this.options.ticker.remove(tick);
        onDone?.();
      }
    };
    this.options.ticker.add(tick);
  }

  /** 캐릭터가 적 방향으로 순식간에 대시했다가 제자리로 돌아오는 손맛 모션입니다. */
  dashAndReturn(target: Container, dx: number, dy: number, options: { duration?: number; lift?: number; rotate?: number } = {}) {
    const startX = target.x;
    const startY = target.y;
    const startRotation = target.rotation;
    const duration = options.duration ?? 0.22;
    const lift = options.lift ?? 6;
    const rotate = options.rotate ?? 0.12;
    this.tween({
      duration,
      ease: easeOutBackLite,
      onUpdate: (t) => {
        const pulse = Math.sin(t * Math.PI);
        target.x = startX + dx * pulse;
        target.y = startY + dy * pulse - lift * pulse;
        target.rotation = startRotation + rotate * pulse;
      },
      onDone: () => {
        target.x = startX;
        target.y = startY;
        target.rotation = startRotation;
      }
    });
  }

  /** 몬스터 피격 시 0.1초 백색 플래시와 짧은 압축/반동을 줍니다. */
  hitFlash(sprite: Sprite, options: { duration?: number; shakeX?: number; squash?: number } = {}) {
    const startTint = sprite.tint;
    const startX = sprite.x;
    const startScaleY = sprite.scale.y;
    const duration = options.duration ?? 0.1;
    const shakeX = options.shakeX ?? 4.5;
    const squash = options.squash ?? 0.1;
    sprite.tint = 0xffffff;
    this.tween({
      duration,
      ease: linear,
      onUpdate: (t) => {
        sprite.x = startX + Math.sin(t * Math.PI * 4) * shakeX * (1 - t);
        sprite.scale.y = startScaleY * (1 - squash * Math.sin(t * Math.PI));
        sprite.alpha = 0.92 + Math.sin(t * Math.PI) * 0.08;
      },
      onDone: () => {
        sprite.tint = startTint;
        sprite.x = startX;
        sprite.scale.y = startScaleY;
        sprite.alpha = 1;
      }
    });
  }

  /** 캐주얼 RPG 스타일의 대미지 텍스트. 위로 둥실 뜨면서 살짝 튕겨 사라집니다. */
  floatingDamageText({ text, x, y, color, critical = false, important = false }: FloatingDamageOptions) {
    if (this.options.isLite?.() && !important) return;
    const label = new Text({
      text,
      style: {
        fill: color,
        fontFamily: 'Arial, Pretendard, system-ui, sans-serif',
        fontSize: critical ? 23 : 18,
        fontWeight: '900',
        letterSpacing: 0.4,
        stroke: { color: 0x08101f, width: critical ? 6 : 5 },
        dropShadow: {
          color: 0x72e7ff,
          alpha: critical ? 0.45 : 0.18,
          blur: critical ? 8 : 4,
          distance: 0
        }
      }
    });
    label.anchor.set(0.5);
    label.position.set(x, y - 58);
    label.scale.set(critical ? 0.86 : 0.92);
    this.options.fxLayer.addChild(label);
    this.tween({
      duration: critical ? 0.86 : 0.72,
      ease: easeOutCubic,
      onUpdate: (t) => {
        const bounce = Math.sin(t * Math.PI);
        label.y = y - 58 - 44 * t - bounce * 7;
        label.x = x + Math.sin(t * Math.PI * 2) * (critical ? 5 : 2.5);
        label.alpha = t > 0.72 ? Math.max(0, 1 - (t - 0.72) / 0.28) : 1;
        label.scale.set((critical ? 1 : 0.92) + bounce * (critical ? 0.28 : 0.18));
      },
      onDone: () => label.destroy()
    });
  }

  /** 강한 타격 전용 카메라 셰이크. world 컨테이너를 흔들고 원위치로 복구합니다. */
  cameraShake(options: { strength?: number; duration?: number } = {}) {
    if (this.options.isLite?.()) return;
    const serial = ++this.shakeSerial;
    const baseX = this.options.world.x;
    const baseY = this.options.world.y;
    const strength = options.strength ?? 9;
    const duration = options.duration ?? 0.22;
    this.tween({
      duration,
      ease: linear,
      onUpdate: (t) => {
        if (serial !== this.shakeSerial) return;
        const damp = 1 - t;
        this.options.world.x = baseX + (Math.random() - 0.5) * strength * damp;
        this.options.world.y = baseY + (Math.random() - 0.5) * strength * 0.72 * damp;
      },
      onDone: () => {
        if (serial !== this.shakeSerial) return;
        this.options.world.x = baseX;
        this.options.world.y = baseY;
      }
    });
  }

  /** 팝업 UI가 작은 점에서 탄성 있게 열리는 값을 반환하는 공용 easing입니다. */
  static elasticOpen(t: number) {
    return easeOutElastic(clamp01(t));
  }
}

export function linear(t: number) {
  return t;
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

export function easeOutBackLite(t: number) {
  const c1 = 1.42;
  const c3 = c1 + 1;
  const x = clamp01(t) - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

export function easeOutElastic(t: number) {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
