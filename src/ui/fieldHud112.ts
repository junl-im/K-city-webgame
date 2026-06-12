import type { HealthLevel } from './technicalHealth';

export interface FieldHudReport112 {
  level: HealthLevel;
  route: 'field' | 'town' | 'login';
  checked: number;
  overflowCount: number;
  touchTargets: number;
  compact: boolean;
  message: string;
  hint: string;
}

type FieldHudInstallOptions112 = {
  gameRoot?: HTMLElement;
};

const HUD_SELECTORS_112 = [
  '.hud-top',
  '.resource-strip',
  '.target-card',
  '.field-quest-tracker',
  '.field-minimap',
  '.combat-log',
  '.combat-log-toggle',
  '.joystick',
  '.action-dock',
  '.skill-dock'
];

let installed112 = false;
let hudResizeTimer112 = 0;

/**
 * 필드 HUD가 모바일 세로 화면 밖으로 나가지 않도록 런타임 safe frame을 동기화합니다.
 * CSS 누적 패치 위에 최종 보정 레이어만 얹는 방식이라 기존 레이아웃을 크게 건드리지 않습니다.
 */
export function installFieldHud112(root: Document = document, _options: FieldHudInstallOptions112 = {}) {
  if (installed112) return syncFieldHud112(root);
  installed112 = true;
  root.body.classList.add('field-hud-112');
  annotateHudElements112(root);
  syncFieldHud112(root);

  const schedule = () => {
    window.clearTimeout(hudResizeTimer112);
    hudResizeTimer112 = window.setTimeout(() => syncFieldHud112(root), 70);
  };
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  root.addEventListener('pointerdown', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.dock-btn, .skill-btn, .combat-log-toggle, .field-quest-tracker');
    if (!target) return;
    target.classList.add('hud-touch-down-112');
    window.setTimeout(() => target.classList.remove('hud-touch-down-112'), 140);
  }, { passive: true });
  return inspectFieldHud112(root);
}

export function syncFieldHud112(root: Document = document) {
  annotateHudElements112(root);
  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth || root.documentElement.clientWidth || 0);
  const height = Math.round(vv?.height || window.innerHeight || root.documentElement.clientHeight || 0);
  const compact = width <= 380 || height <= 690;
  root.body.classList.toggle('field-hud-compact-112', compact);
  root.documentElement.style.setProperty('--field-vvw-112', `${width}px`);
  root.documentElement.style.setProperty('--field-vvh-112', `${height}px`);
  root.documentElement.style.setProperty('--field-top-gap-112', `${Math.max(10, Math.round(height * 0.015))}px`);
  root.documentElement.style.setProperty('--field-bottom-gap-112', `${Math.max(12, Math.round(height * 0.02))}px`);
  root.body.dataset.fieldHud112 = inspectFieldHud112(root).level;
}

export function inspectFieldHud112(root: Document = document): FieldHudReport112 {
  const route = root.body.classList.contains('field-active') ? 'field' : root.body.classList.contains('town-active') ? 'town' : 'login';
  const width = window.visualViewport?.width || window.innerWidth || root.documentElement.clientWidth || 0;
  const height = window.visualViewport?.height || window.innerHeight || root.documentElement.clientHeight || 0;
  const targets = Array.from(root.querySelectorAll<HTMLElement>(HUD_SELECTORS_112.join(','))).filter(isVisible112);
  let overflowCount = 0;
  let worst = '';
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    const overflow = Math.max(0, -rect.left, -rect.top, rect.right - width, rect.bottom - height);
    if (overflow > 2) {
      overflowCount += 1;
      if (!worst) worst = classLabel112(target);
    }
  }
  const touchTargets = Array.from(root.querySelectorAll<HTMLElement>('.dock-btn, .skill-btn, .combat-log-toggle')).filter((target) => {
    const rect = target.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  }).length;
  const compact = width <= 380 || height <= 690;
  const level: HealthLevel = overflowCount > 0 ? 'warn' : 'ok';
  return {
    level,
    route,
    checked: targets.length,
    overflowCount,
    touchTargets,
    compact,
    message: overflowCount ? `HUD 이탈 ${overflowCount}개` : 'HUD safe frame 정상',
    hint: `checked ${targets.length} · touch ${touchTargets} · ${compact ? 'compact' : 'standard'}${worst ? ` · worst ${worst}` : ''}`
  };
}

function annotateHudElements112(root: Document) {
  root.querySelectorAll<HTMLElement>(HUD_SELECTORS_112.join(',')).forEach((element) => {
    element.dataset.hudSafe112 = 'true';
  });
  root.querySelectorAll<HTMLElement>('.dock-btn, .skill-btn').forEach((button) => {
    button.dataset.touchTarget112 = 'true';
  });
}

function isVisible112(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
}

function classLabel112(element: HTMLElement) {
  return Array.from(element.classList).slice(0, 2).join('.') || element.tagName.toLowerCase();
}
