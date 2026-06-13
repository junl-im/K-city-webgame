# Soul Online Alpha 1.27 - 시작 화면 키비주얼 복구 패치

## 목적

1.26까지 안정화 패치가 누적되면서 첫 시작 화면이 원래 요청했던 0.60 계열 원화풍 키비주얼에서 멀어졌다. 1.27은 기능 확장 없이 첫 시작 화면만 명확히 복구하는 패치다.

## 핵심 변경

- `src/assets/ui/title-keyvisual-060.webp`를 시작 화면의 단일 기준 키비주얼로 복구했다.
- 첫 페인트에서도 이미지가 보이도록 동일 에셋을 `public/assets/ui/fantasy/title-keyvisual-060.webp`로 배치하고 `index.html`에서 preload한다.
- 구형 타이틀 레이어(`title-bg`, `title-copy`, `title-hero`, rune, companion, glow)를 숨기고 단일 키비주얼만 표시한다.
- baked 로고가 들어간 이미지 위에 별도 `소울 온라인` 텍스트가 겹치지 않도록 title-copy를 숨겼다.
- 상단 `루미나 원정대 / BGM ON / v1.27.0` 네비게이션을 기준 이미지와 유사한 글래스 pill 형태로 복구했다.
- `TOUCH TO START` 버튼을 하단 중앙에 배치하고 유리/네온 느낌을 강화했다.
- START 클릭/타이틀 터치 로그인 진입 흐름은 1.20~1.26 복구 커널 구조를 유지했다.

## 수정 파일

- `index.html`
- `src/main.ts`
- `src/ui/titleRevival127.ts`
- `src/styles/alpha127.css`
- `public/assets/ui/fantasy/title-keyvisual-060.webp`
- `public/sw.js`
- `package.json`
- `package-lock.json`

## 검증

- `npm run build` 통과
- `tsc --noEmit` 통과
- `vite build` 통과

## 주의

타이틀 화면의 하단 작은 `TOUCH TO START` 장식은 원본 0.60 키비주얼 이미지에 포함된 baked 텍스트다. 1.27은 원래 느낌을 살리기 위해 이를 제거하지 않고, 실제 클릭 가능한 큰 START 버튼만 위에 별도로 유지한다.
