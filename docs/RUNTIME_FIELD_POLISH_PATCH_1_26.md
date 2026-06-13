# Soul Online Alpha 1.26 Runtime / Field Polish Patch

## 목표

1.25의 2.5D 고해상도 에셋 복구 방향을 유지하면서, 첫 실행과 사냥터 진입 흐름을 더 안전하게 다듬는다.

## 핵심 변경

- `src/ui/runtimePolish126.ts` 추가
  - title / login / town / field 중 현재 route 하나만 보이도록 보조 정리
  - `#game-root`에 중복 canvas가 남으면 최신 canvas만 유지
  - 펫, 동행, 룬, 회전 가드, 구형 고스트 레이어 재등장 차단
  - touch-action / tap highlight를 주요 버튼에 일괄 보정
  - 실행 당시 viewport 변수 누락 시 복구
- `src/styles/alpha126.css` 추가
  - 필드 입장 중 사냥터 버튼 중복 입력 방지
  - 필드 UI 충돌 시 조이스틱/액션 버튼 추가 보정
  - 작은 화면에서 HUD/타깃/퀘스트 폭 보정
- `src/ui/fieldRuntimePolish125.ts` 보강
  - 필드 입장 상태가 비정상적으로 오래 유지될 때 watchdog으로 busy 플래그 복구
- `src/main.ts` 보강
  - 1.26 런타임 다듬기 커널 설치
  - route 전환 시 1.26 route sync 추가
  - 필드 메뉴 버튼의 중복 click listener 제거
  - System Doctor에 1.26 런타임 다듬기 항목 추가
- PWA 캐시 버전 갱신
  - `soul-online-alpha-v1-26`

## 검증

- `npm run build`
  - `tsc --noEmit`
  - `vite build`

## 주의

브라우저에 오래된 서비스워커가 남아 있으면 첫 접속 1회는 새로고침이 필요할 수 있다.
