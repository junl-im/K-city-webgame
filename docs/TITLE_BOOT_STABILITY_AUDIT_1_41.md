# Soul Online 1.41 - 첫 화면 안정화 추가 점검 패치

## 목적
1.40에서 main.ts 지연 로딩 구조를 도입했지만, 첫 화면/로그인 전환이 여전히 민감할 수 있어 1.41에서는 boot 레이어를 더 단순하고 강하게 정리했다.

## 핵심 원칙
- 그래픽 품질은 낮추지 않는다.
- 1.27 타이틀 키비주얼과 1.35/1.36 레퍼런스 UI를 유지한다.
- 2.5D 고해상도 캐릭터/몬스터 에셋을 유지한다.
- 첫 화면에서는 boot.ts와 alpha141.css만 먼저 작동하게 한다.
- 무거운 main.ts는 START 이후 로그인 화면을 먼저 보여준 뒤 로드한다.

## 수정 요약
- src/boot.ts를 1.41 기준으로 재정리했다.
- src/styles/alpha141.css를 추가해 첫 화면 세로 프레임, START 히트박스, 라우팅 가시성을 보정했다.
- START 버튼은 투명 히트박스로 유지하고 최상단 터치 레이어에 고정했다.
- 중복 TOUCH TO START 텍스트/장식은 숨기고, 레퍼런스 키아트 안의 비주얼만 사용한다.
- title/login/town/field route를 1.41 class 기준으로 다시 정리했다.
- 인앱 브라우저에서는 requestFullscreen/screen.orientation.lock 호출을 조용히 무력화한다.
- visualViewport resize/orientationchange 상황에서도 세로 프레임 크기를 다시 안정적으로 계산한다.

## 검증
- npm ci --no-audit --no-fund --prefer-online 통과
- npm run build 통과
- tsc --noEmit 통과
- vite build 통과
- npm audit --audit-level=high --omit=optional 결과 0 vulnerabilities
- verifyProjectIntegrity 통과
- 자동 workflow build.yml 하나만 유지
