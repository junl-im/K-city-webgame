export type TitleEntryState090 = {
  visible: boolean;
  buttonVisible: boolean;
  buttonRect: string;
  titleClasses: string;
};

type TitleEntryElements090 = {
  titleScreen: HTMLElement;
  startButton: HTMLButtonElement;
  loginScreen?: HTMLElement | null;
};

export function ensureTitleEntry090({ titleScreen, startButton, loginScreen }: TitleEntryElements090): TitleEntryState090 {
  titleScreen.classList.add('title-screen-090');
  titleScreen.classList.remove('hidden');
  titleScreen.setAttribute('aria-hidden', 'false');
  titleScreen.dataset.entryReady090 = 'true';
  startButton.classList.add('start-game-btn-090');
  startButton.type = 'button';
  startButton.disabled = false;
  startButton.removeAttribute('aria-hidden');
  startButton.setAttribute('aria-label', '소울 온라인 시작');
  startButton.dataset.entryReady090 = 'true';
  if (!startButton.textContent?.trim()) startButton.textContent = 'TOUCH TO START';
  if (loginScreen && !document.body.classList.contains('login-active')) {
    loginScreen.classList.add('hidden');
    loginScreen.setAttribute('aria-hidden', 'true');
  }
  return inspectTitleEntry090(titleScreen, startButton);
}

export function markTitleEntryTransition090({ titleScreen, startButton, loginScreen }: TitleEntryElements090) {
  titleScreen.classList.add('hidden');
  titleScreen.setAttribute('aria-hidden', 'true');
  startButton.dataset.entryReady090 = 'transitioned';
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    loginScreen.setAttribute('aria-hidden', 'false');
  }
}

export function inspectTitleEntry090(titleScreen: HTMLElement, startButton: HTMLButtonElement): TitleEntryState090 {
  const titleStyle = window.getComputedStyle(titleScreen);
  const buttonStyle = window.getComputedStyle(startButton);
  const rect = startButton.getBoundingClientRect();
  const visible = !titleScreen.classList.contains('hidden') && titleStyle.display !== 'none' && titleStyle.visibility !== 'hidden' && Number(titleStyle.opacity || '1') > 0.05;
  const buttonVisible = visible && buttonStyle.display !== 'none' && buttonStyle.visibility !== 'hidden' && Number(buttonStyle.opacity || '1') > 0.05 && rect.width >= 80 && rect.height >= 32;
  return {
    visible,
    buttonVisible,
    buttonRect: `${Math.round(rect.width)}x${Math.round(rect.height)} @ ${Math.round(rect.left)},${Math.round(rect.top)}`,
    titleClasses: titleScreen.className
  };
}

export function titleEntryHealthLabel090(state: TitleEntryState090) {
  if (!state.visible) return { label: '타이틀 숨김', level: 'warn' as const, hint: state.titleClasses };
  if (!state.buttonVisible) return { label: '시작 버튼 가림', level: 'warn' as const, hint: state.buttonRect };
  return { label: 'TOUCH START 정상', level: 'ok' as const, hint: state.buttonRect };
}
