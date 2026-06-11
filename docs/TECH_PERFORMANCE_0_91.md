# Soul Online Alpha 0.91 - Performance Budget & Runtime Stability

0.91은 0.90에서 복구한 첫 진입 화면을 유지하면서, 모바일 웹 환경에서 문제가 커질 수 있는 리소스 예산과 PWA 캐시 정책을 정리하는 기술 안정화 패치다.

## 핵심 변경

- `src/ui/assetBudget091.ts` 추가
  - Performance Resource Timing 기반으로 이미지/JS/CSS 전송량을 점검한다.
  - 총 리소스, 이미지 리소스, 대형 리소스 개수를 분리해 System Doctor에 표시한다.
  - 위험 구간에서는 `asset-budget-danger-091`, `perf-reduced-motion-091` 상태를 적용한다.
- `src/styles/alpha091.css` 추가
  - 진단 패널, 타이틀, 로그인, 마을 safe-frame을 0.91 기준으로 보강했다.
  - `lite-render-091`에서 과한 장식 애니메이션과 필터를 줄인다.
- Service Worker 캐시 정책 조정
  - 앱 셸과 코드 파일은 유지하되, 대형 이미지 런타임 캐시 누적을 줄여 Firebase 무료/모바일 저장소 부담을 낮춘다.
- System Doctor 개선
  - 리소스 예산, 라이트 모드, 이미지 lazy 정책 상태를 표시한다.
  - `리소스 점검`, `라이트 모드` 버튼을 추가했다.

## 남은 과제

- CSS 번들 자체가 아직 크므로 0.92부터 화면별 CSS 분리를 더 강하게 진행해야 한다.
- `main.ts`는 계속 모듈 분리가 필요하다.
- 대형 스프라이트 시트는 WebP가 있어도 여전히 무겁다. 필드/보스/직업별 지연 로딩 전략을 SolGame 쪽으로 확장해야 한다.
