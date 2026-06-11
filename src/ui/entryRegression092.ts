import type { HealthLevel } from './technicalHealth';

export interface EntryRegressionReport092 {
  level: HealthLevel;
  label: string;
  hint: string;
  missingClasses: string[];
  startButtonVisible: boolean;
  startButtonInsideViewport: boolean;
}

const REQUIRED_BODY_CLASSES_092 = ['fantasy-ui-092', 'entry-flow-ready-090'];
const REQUIRED_TITLE_CLASSES_092 = ['title-screen-092', 'title-entry-guard-092'];
const REQUIRED_LOGIN_CLASSES_092 = ['login-screen-092'];
const REQUIRED_TOWN_CLASSES_092 = ['town-screen-092'];

export function repairEntryRegressionClasses092(params: {
  body: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen?: HTMLElement | null;
  startButton: HTMLElement;
}) {
  addAll092(params.body, REQUIRED_BODY_CLASSES_092);
  addAll092(params.titleScreen, REQUIRED_TITLE_CLASSES_092);
  addAll092(params.loginScreen, REQUIRED_LOGIN_CLASSES_092);
  if (params.townScreen) addAll092(params.townScreen, REQUIRED_TOWN_CLASSES_092);
  params.startButton.classList.add('start-game-btn-090', 'start-game-btn-092');
  params.startButton.setAttribute('data-entry-guard-092', 'ready');
}

export function inspectEntryRegression092(params: {
  body: HTMLElement;
  titleScreen: HTMLElement;
  loginScreen: HTMLElement;
  townScreen?: HTMLElement | null;
  startButton: HTMLElement;
}): EntryRegressionReport092 {
  const missingClasses = [
    ...missingOn092(params.body, REQUIRED_BODY_CLASSES_092),
    ...missingOn092(params.titleScreen, REQUIRED_TITLE_CLASSES_092),
    ...missingOn092(params.loginScreen, REQUIRED_LOGIN_CLASSES_092),
    ...(params.townScreen ? missingOn092(params.townScreen, REQUIRED_TOWN_CLASSES_092) : [])
  ];
  const startButtonVisible = isVisible092(params.startButton);
  const startButtonInsideViewport = isInsideViewport092(params.startButton);
  const level: HealthLevel = missingClasses.length || !startButtonVisible || !startButtonInsideViewport ? 'warn' : 'ok';
  const label = level === 'ok' ? '정상' : missingClasses.length ? '클래스 보정' : !startButtonVisible ? '버튼 가림' : '화면 이탈';
  return {
    level,
    label,
    hint: missingClasses.length
      ? `누락 ${missingClasses.join(', ')}`
      : startButtonVisible && startButtonInsideViewport
        ? 'TOUCH TO START 회귀 검사 통과'
        : `visible ${startButtonVisible ? 'OK' : 'NO'} · viewport ${startButtonInsideViewport ? 'OK' : 'NO'}`,
    missingClasses,
    startButtonVisible,
    startButtonInsideViewport
  };
}

function addAll092(target: HTMLElement, classes: string[]) {
  for (const className of classes) target.classList.add(className);
}

function missingOn092(target: HTMLElement, classes: string[]) {
  return classes.filter((className) => !target.classList.contains(className));
}

function isVisible092(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const style = getComputedStyle(target);
  return rect.width >= 44 && rect.height >= 32 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0.05;
}

function isInsideViewport092(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  return rect.left >= -2 && rect.top >= -2 && rect.right <= width + 2 && rect.bottom <= height + 2;
}
