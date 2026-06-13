export type FieldLoadStage124 = 'idle' | 'starting' | 'textures' | 'mounting' | 'ready' | 'failed';

export type FieldLoadReport124 = {
  label: string;
  level: 'ok' | 'warn';
  message: string;
  hint: string;
};

type FieldLoadOptions124 = {
  zoneName: string;
  sceneLabel?: HTMLElement | null;
};

type FieldLoadController124 = {
  start: () => void;
  update: (loaded: number, total: number, key?: string) => void;
  complete: () => void;
  fail: (error?: unknown) => void;
};

type SoulWindow124 = Window & {
  SOUL_FIELD_LOAD_POLISH_124?: boolean;
  SOUL_FIELD_LOAD_STAGE_124?: FieldLoadStage124;
};

let installed124 = false;
let stage124: FieldLoadStage124 = 'idle';
let lastZone124 = '대기';
let lastKey124 = '';
let lastLoaded124 = 0;
let lastTotal124 = 0;
let startedAt124 = 0;
let completedAt124 = 0;
let slowWarningCount124 = 0;
let lastError124 = '';
let slowTimer124 = 0;
let verySlowTimer124 = 0;

export function installFieldLoadPolish124(documentRef: Document) {
  if (installed124) return inspectFieldLoadPolish124(documentRef);
  installed124 = true;
  const win = documentRef.defaultView as SoulWindow124 | null;
  if (win) {
    win.SOUL_FIELD_LOAD_POLISH_124 = true;
    win.SOUL_FIELD_LOAD_STAGE_124 = stage124;
  }
  documentRef.documentElement.classList.add('soul-field-load-polish-124');
  documentRef.body.classList.add('field-load-polish-124');
  documentRef.body.dataset.alphaVersion = '1.25.0';

  win?.addEventListener('pageshow', () => {
    if (stage124 === 'failed') documentRef.body.classList.add('field-load-failed-124');
    if (stage124 === 'ready') documentRef.body.classList.add('field-ready-124');
  }, { passive: true });

  return inspectFieldLoadPolish124(documentRef);
}

export function createFieldEntryController124(documentRef: Document, options: FieldLoadOptions124): FieldLoadController124 {
  installFieldLoadPolish124(documentRef);
  const label = options.sceneLabel || null;

  const setStage = (next: FieldLoadStage124) => {
    stage124 = next;
    const win = documentRef.defaultView as SoulWindow124 | null;
    if (win) win.SOUL_FIELD_LOAD_STAGE_124 = next;
    documentRef.body.dataset.fieldLoadStage124 = next;
  };

  const paint = () => {
    const total = Math.max(1, lastTotal124 || 1);
    const pct = Math.max(0, Math.min(100, Math.round((lastLoaded124 / total) * 100)));
    documentRef.documentElement.style.setProperty('--field-load-pct-124', `${pct}%`);
    documentRef.body.dataset.fieldLoadPct124 = String(pct);
    documentRef.body.dataset.fieldLoadKey124 = shortenKey124(lastKey124);
    if (label && stage124 !== 'ready' && stage124 !== 'failed') {
      const part = lastTotal124 > 0 ? `${lastLoaded124}/${lastTotal124}` : '준비 중';
      const asset = lastKey124 ? ` · ${shortenKey124(lastKey124)}` : '';
      label.textContent = `${lastZone124} 2.5D 로딩 ${part}${asset}`;
    }
  };

  return {
    start() {
      clearTimers124(documentRef);
      lastZone124 = options.zoneName || '사냥터';
      lastKey124 = '';
      lastLoaded124 = 0;
      lastTotal124 = 0;
      lastError124 = '';
      startedAt124 = performance.now();
      completedAt124 = 0;
      setStage('starting');
      documentRef.body.classList.remove('field-ready-124', 'field-load-failed-124', 'field-load-slow-124', 'field-load-very-slow-124');
      documentRef.body.classList.add('field-loading-124');
      paint();

      slowTimer124 = window.setTimeout(() => {
        if (stage124 === 'ready' || stage124 === 'failed') return;
        slowWarningCount124 += 1;
        documentRef.body.classList.add('field-load-slow-124');
        if (label) label.textContent = `${lastZone124} 2.5D 에셋을 조금 더 불러오는 중입니다`;
      }, 5200);

      verySlowTimer124 = window.setTimeout(() => {
        if (stage124 === 'ready' || stage124 === 'failed') return;
        slowWarningCount124 += 1;
        documentRef.body.classList.add('field-load-very-slow-124');
        if (label) label.textContent = `${lastZone124} 로딩이 길어지고 있어요 · 첫 입장만 오래 걸릴 수 있습니다`;
      }, 12000);
    },
    update(loaded, total, key = '') {
      lastLoaded124 = Math.max(0, loaded);
      lastTotal124 = Math.max(total || 0, lastLoaded124);
      lastKey124 = key || lastKey124;
      setStage(/Sheet$/.test(key) ? 'textures' : stage124 === 'starting' ? 'textures' : stage124);
      paint();
    },
    complete() {
      completedAt124 = performance.now();
      clearTimers124(documentRef);
      setStage('ready');
      documentRef.body.classList.remove('field-loading-124', 'field-load-slow-124', 'field-load-very-slow-124', 'field-load-failed-124');
      documentRef.body.classList.add('field-ready-124');
      documentRef.documentElement.style.setProperty('--field-load-pct-124', '100%');
      if (label) label.textContent = `${lastZone124} 입장 완료`;
    },
    fail(error) {
      clearTimers124(documentRef);
      setStage('failed');
      lastError124 = error instanceof Error ? error.message : String(error || 'field load failed');
      documentRef.body.classList.remove('field-loading-124', 'field-load-slow-124', 'field-load-very-slow-124');
      documentRef.body.classList.add('field-load-failed-124');
      if (label) label.textContent = `${lastZone124} 입장 실패`;
    }
  };
}

export function markFieldMounting124(documentRef: Document) {
  stage124 = 'mounting';
  const win = documentRef.defaultView as SoulWindow124 | null;
  if (win) win.SOUL_FIELD_LOAD_STAGE_124 = stage124;
  documentRef.body.dataset.fieldLoadStage124 = stage124;
}

export function inspectFieldLoadPolish124(_documentRef: Document): FieldLoadReport124 {
  const elapsed = startedAt124 ? Math.round((completedAt124 || performance.now()) - startedAt124) : 0;
  const pct = lastTotal124 > 0 ? Math.round((lastLoaded124 / Math.max(1, lastTotal124)) * 100) : 0;
  const level: 'ok' | 'warn' = !installed124 || stage124 === 'failed' || slowWarningCount124 > 0 ? 'warn' : 'ok';
  return {
    label: '1.24 2.5D 로딩',
    level,
    message: installed124 ? `${stage124} · ${lastZone124} · ${pct}%` : '미설치',
    hint: `${lastLoaded124}/${lastTotal124 || 0} · ${elapsed}ms · ${shortenKey124(lastKey124)}${lastError124 ? ` · ${lastError124}` : ''}`
  };
}

function clearTimers124(documentRef: Document) {
  if (slowTimer124) window.clearTimeout(slowTimer124);
  if (verySlowTimer124) window.clearTimeout(verySlowTimer124);
  slowTimer124 = 0;
  verySlowTimer124 = 0;
  documentRef.body.classList.remove('field-load-slow-124', 'field-load-very-slow-124');
}

function shortenKey124(key: string) {
  if (!key) return '대기';
  return key.replace(/Sheet$/, '').replace(/^monster/, '몹 ').replace(/^hero/, '영웅 ');
}
