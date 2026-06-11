# Alpha 0.86 Technical Refactor Foundation

0.86은 Soul Online의 기술 점검 기능을 단순 HTML 덧붙이기에서 벗어나 실제 모듈화 단계로 이동시키는 패치다. 목표는 기능이 계속 늘어나도 연결성, 저장 안정성, UI 안전 영역, 성능 상태를 한 곳에서 추적하는 것이다.

## 변경 사항

- `ALPHA_VERSION = 0.86.0`
- PWA 캐시 `soul-online-alpha-v0-86`
- `fantasy-ui-086` / `title-screen-086` / `login-screen-086` / `town-screen-086`
- 신규 모듈 `src/ui/technicalHealth.ts`
- System Doctor 0.86
- 연결성 매트릭스
- 에셋 예열 액션
- 저성능 장식 억제 클래스 `perf-reduced-motion-086`

## 새 모듈 역할

`src/ui/technicalHealth.ts`는 다음 기능을 담당한다.

- `auditUiBounds`: 화면 밖으로 나간 UI 탐지
- `classifyPerformance`: FPS와 Long Task 기준 성능 상태 분류
- `inspectSaveIntegrity`: 세이브 데이터의 ID/장착/가방/카드/스킬 연결 검사
- `inspectRuntimeAssets`: 현재 DOM 이미지 로딩 상태 점검
- `buildConnectivityRows`: 마을 패널, 필드 엔진, 세이브, 클라우드, PWA 상태 요약

## 연결성 체크 기준

0.86에서 보는 연결성은 다음이다.

- 마을 콘텐츠 라우트가 현재 탭과 맞는지
- 필드 스냅샷과 Pixi 게임 인스턴스가 같이 살아 있는지
- 캐릭터 세이브가 마을/계정/필드 화면과 이어지는지
- Firebase 쓰기가 보류 상태인지
- Service Worker가 정상 준비되었는지

## 성능 체크 기준

- FPS 50 이상: 양호
- FPS 30~49 또는 Long Task 증가: 주의
- FPS 30 미만, 220ms 이상 Long Task, Long Task 10회 이상: 저사양 모드 권장

저성능 상태에서는 장식 애니메이션과 일부 필터를 줄여 실제 조작 반응을 우선한다.

## 다음 0.87 권장 작업

0.87부터는 다음 파일 분리를 권장한다.

- `src/ui/renderInventory.ts`
- `src/ui/renderSkills.ts`
- `src/ui/renderShop.ts`
- `src/ui/renderAccount.ts`
- `src/styles/ui-fantasy.css`
- `src/styles/ui-town.css`
- `src/styles/ui-field.css`

0.86은 이 분리를 시작하기 전에 안전하게 검사할 수 있는 기반을 먼저 만든 단계다.
