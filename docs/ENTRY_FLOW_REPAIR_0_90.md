# Soul Online Alpha 0.90 - Entry Flow Repair & Technical Polish

## 목적

0.90은 첫 화면 `TOUCH TO START`가 보이지 않거나 클릭되지 않는 문제를 최우선으로 복구하는 핫픽스다. 0.87~0.89에서 화면/성능 안정화 레이어가 분리되면서 `index.html`의 초기 클래스와 런타임 클래스가 어긋날 가능성이 있었고, 여러 세대의 타이틀 CSS가 누적되어 시작 버튼이 다른 레이어에 가려질 수 있었다.

## 수정 내용

- `title-screen-090`, `start-game-btn-090`, `fantasy-ui-090` 레이어 추가
- 첫 페인트 단계에서 타이틀 화면을 강제로 안전 상태로 복구하는 `titleEntry090` 모듈 추가
- `TOUCH TO START` 버튼을 화면 safe-area 안쪽에 항상 보이도록 `z-index`, `opacity`, `pointer-events`, 크기, 레이아웃을 강제 보정
- 버튼이 아닌 타이틀 화면 터치도 접속 화면으로 넘어가도록 fallback 입력 추가
- System Doctor / Tech Health에 `첫 화면` 진단 타일 추가
- 저성능 모드에서 0.90 타이틀 애니메이션도 줄이도록 `perf-reduced-motion-090` 추가
- PWA 캐시를 `soul-online-alpha-v0-90`으로 갱신

## 확인 기준

- 첫 접속 시 타이틀 화면이 보여야 한다.
- `TOUCH TO START` 버튼이 모바일 세로 화면 안에 보여야 한다.
- 버튼 터치 또는 빈 타이틀 영역 터치 시 로그인 화면으로 넘어가야 한다.
- `npm run build`가 통과해야 한다.

## 다음 과제

- CSS 번들이 830KB 이상으로 증가했다. 0.91부터는 CSS 중복 제거와 화면별 CSS chunk 분리를 진행해야 한다.
- 대형 스프라이트 시트는 아직 모바일 첫 로딩 병목이다. Pixi/필드 진입 시점의 지연 로딩과 캐릭터별 필요한 시트만 불러오는 구조가 필요하다.
