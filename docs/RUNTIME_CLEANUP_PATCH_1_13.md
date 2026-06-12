# Soul Online Alpha 1.13 Runtime Cleanup Patch

## 목적

1.12까지 누적된 모바일 런타임/HUD 보정 위에 최종 유지보수 레이어를 추가했다. 이번 패치는 대형 CSS와 단일 `main.ts` 구조를 즉시 갈아엎지 않고, 실제 플레이 중 안전하게 작동하는 런타임 검사와 마지막 CSS safe-frame을 얹는 방식이다.

## 핵심 변경

- `src/ui/maintenance113.ts`
  - 현재 라우트(title/login/town/field), 런타임 등급(lite/balanced/quality), viewport, 고정 HUD overflow, 활성 팝업 수, 이미지 lazy/decode 정책을 검사한다.
  - `MutationObserver`로 body class와 주요 화면 hidden 상태 변화를 감지해 자동 동기화한다.
  - System Doctor에서 `1.13 정리 레이어` 항목으로 노출된다.

- `src/styles/alpha113.css`
  - HUD, 팝업, 인벤토리 격자, 액션 버튼의 최종 모바일 safe-frame을 보강한다.
  - K-city 네온 블루/화이트 톤의 글자 대비, 유리 패널, 터치 피드백을 강화한다.
  - lite 등급과 초소형 화면에서 blur/애니메이션 부담을 줄인다.

- `src/game/SolGame.ts`
  - Alpha 1.13 Pixi frame governor를 추가했다.
  - 숨김 탭에서는 12 FPS, lite/초소형 화면에서는 최대 26 FPS, balanced에서는 최대 38 FPS로 ticker 상한을 조정한다.
  - 기존 1.05 field engine profile을 기본값으로 유지하되, 실제 런타임 상태를 반영한다.

- `src/main.ts`
  - 1.13 모듈과 CSS를 부트 플로우에 연결했다.
  - System Doctor와 기술 진단 메타에 1.13 상태를 포함했다.

- `public/sw.js`
  - PWA 캐시명을 `soul-online-alpha-v1-13`으로 갱신했다.

## 빌드 검증

- `npm ci` 완료
- `npm run build` 완료
- `tsc --noEmit` 통과
- `vite build` 통과

## 다음 권장 작업

1. `src/styles.css`의 대형 누적 CSS를 실제 DOM 사용 셀렉터 기준으로 분리/축소한다.
2. `src/main.ts`의 반복 sync 호출을 `syncAllVisualSystems()` 같은 라우트 동기화 함수로 묶는다.
3. Pixi 스프라이트 시트는 Firebase 무료 플랜을 고려해 zone 단위 동적 import 또는 외부 CDN 캐시 정책으로 더 분리한다.
