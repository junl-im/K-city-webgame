# Soul Online Alpha 1.17 · 단일 표준 모드 / 실행 크기 고정 패치

## 목적

사용자가 실제 플레이에서 확인한 다음 문제를 직접 겨냥한 패치입니다.

- 구형 UI/배경 레이어가 여러 세대의 CSS와 함께 겹쳐 있다가 사라지는 현상
- 저화질/고화질/라이트/퀄리티 모드 분기가 화면과 에셋을 바꾸는 문제
- 모바일 브라우저 전체화면 또는 방향 변경 과정에서 화면 크기와 UI 배치가 다시 계산되는 문제

## 핵심 변경

### 1. 단일 표준 화면 모드

`Lite / Balanced / Quality` 자동 판정을 실제 렌더 기준에서는 하나의 표준 프로필로 고정했습니다.
기존 타입 호환을 위해 내부 tier 값은 `balanced`를 유지하지만, 1.17 이후 의미상으로는 `standard` 단일 모드입니다.

- `src/game/fieldEngineProfile105.ts`
- `src/game/fieldSpriteBudget106.ts`
- `src/ui/singleVisualMode117.ts`
- `src/ui/assetDelivery115.ts`

### 2. 에셋 로딩 경로 단일화

필드 스프라이트는 한 키에 한 URL만 시도합니다. 고화질 풀팩을 먼저 요청했다가 실패 후 lite/fallback으로 바뀌는 경쟁 로딩을 제거해, 다른 이미지가 잠깐 보이는 현상을 줄였습니다.

- `src/game/SolGame.ts`
- `src/data/assetManifest.ts`의 기존 표준 경로 사용

### 3. 구형 CSS 지연 로딩 중단

1.15의 route-aware CSS loader가 `alpha098~alpha110` 보정 CSS를 순차적으로 붙이면서 배경/레이어가 늦게 교체될 수 있었습니다. 1.17에서는 이미 정적 CSS와 1.14~1.17 보정 레이어로 충분하므로 구형 lazy stack을 비활성화했습니다.

- `src/ui/styleLoader115.ts`

### 4. 실행 크기 고정

게임 시작 순간의 viewport 크기를 캡처해 CSS 변수와 PixiJS 초기 canvas 크기에 동일하게 적용합니다. 이후 `resize`, `orientationchange`, `visualViewport.resize`가 발생해도 레이아웃 기준값을 바꾸지 않습니다.

- `src/ui/viewportLock117.ts`
- `src/game/SolGame.ts`
- `src/styles/alpha117.css`

### 5. 전체화면 자동 진입 중단

모바일 브라우저에서 fullscreen request가 화면 방향/크기를 바꾸는 경우가 있어 자동 전체화면 요청을 중단했습니다. 기존 전체화면 버튼도 실행 크기 유지 안내만 표시합니다.

- `src/main.ts`
- `index.html` meta `x5-fullscreen=false`, `full-screen=no`

### 6. 중복 배경/펫/동행자 더미 억제

타이틀은 한 장의 기준 키비주얼만 사용하도록 고정하고, 구형 `title-bg-044~078`, `title-hero-*`, companion/pet placeholder를 숨깁니다. 마을 배경도 한 기준 이미지로 고정합니다.

- `src/ui/singleVisualMode117.ts`
- `src/styles/alpha117.css`

## 검증

- `npm ci`
- `npm run build`
- `tsc --noEmit` 통과
- `vite build` 통과
- PWA 캐시: `soul-online-alpha-v1-17`

## 남은 주의점

브라우저 실기 터치는 이 환경에서 직접 검증하지 못했습니다. 다만 이번 패치는 화면이 돌아가거나 크기가 다시 계산되는 원인이 되는 fullscreen/orientation/visualViewport 재계산 흐름을 차단하는 방향입니다.
