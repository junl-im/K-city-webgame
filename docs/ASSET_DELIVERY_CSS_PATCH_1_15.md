# Soul Online Alpha 1.15 - Asset Delivery & Route-aware CSS Patch

## 목표

1. Firebase Hosting 무료 플랜에 맞게 배포 산출물의 대형 스프라이트 시트 중복 포함을 줄인다.
2. 1.14에서 분리한 CSS lazy loading을 route-aware 방식으로 개선한다.
3. 모바일 세로모드 HUD/팝업 safe-frame 보정을 유지하면서 초기 로딩 부담을 낮춘다.

## 핵심 변경

- `src/data/assetManifest.ts`
  - 2~3MB급 2.5D 캐릭터/몬스터 스프라이트 시트 fallback을 `public/assets/soulpack-lite` 경로로 변경했다.
  - 원본 고해상도 시트는 `src/assets/2p5d`에 보존한다.
  - 추후 고품질 풀팩을 쓰려면 동일 파일명을 `public/assets/soulpack`에 배치하고 브라우저 localStorage에 `soul-online-full-atlas-115=1`을 설정하면 기존 `runtimeTextureUrls`가 먼저 사용한다. 기본 Firebase 배포에서는 존재하지 않는 풀팩 404 요청을 줄이기 위해 이 경로를 자동 시도하지 않는다.

- `src/ui/styleLoader115.ts`
  - critical/town/field/deep CSS 그룹을 분리했다.
  - 첫 화면에서는 critical CSS만 우선 로드한다.
  - town/field/deep CSS는 실제 라우트 진입 또는 idle 시점에 순차 로드한다.
  - 데이터 절약 모드/느린 네트워크에서는 deep CSS 자동 drain을 보류한다.

- `src/ui/assetDelivery115.ts`
  - System Doctor에서 atlas 배포 상태를 확인할 수 있게 했다.
  - `external-lite`, `mixed`, `bundled-heavy` 모드로 진단한다.

- `src/styles/alpha115.css`
  - route-aware CSS loading 상태에서 HUD와 팝업의 safe-frame을 보강한다.
  - 초소형 화면과 reduced-motion 환경을 다시 방어한다.

## 빌드 검증

- `tsc --noEmit`
- `vite build`

위 두 단계가 통과해야 한다.
