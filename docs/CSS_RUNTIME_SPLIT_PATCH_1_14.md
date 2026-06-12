# Soul Online Alpha 1.14 - CSS Runtime Split & Mobile HUD Stabilization

## 목표

Alpha 1.13 기준 프로젝트는 빌드는 안정적이지만, `styles.css`와 0.98~1.13 보정 CSS가 정적 번들에 누적되어 초기 CSS가 1MB 이상으로 커져 있었다. 1.14는 대량 삭제로 인한 회귀를 피하면서도 초기 로딩 부담과 유지보수 비용을 줄이는 것을 목표로 한다.

## 변경 요약

- `src/ui/styleLoader114.ts` 추가
  - 0.98~1.13 보정 CSS를 정적 import에서 분리
  - 첫 프레임 이후 `requestIdleCallback`/fallback timer로 순차 로드
  - 로드 상태를 `body.dataset.styleLoader114`, `body.dataset.styleLoaded114`, CSS 변수 `--css-lazy-progress-114`로 노출
  - System Doctor용 `inspectStyleLoader114()` 제공
- `src/styles/alpha114.css` 추가
  - CSS 로딩 진행 상태 표시용 1px 저간섭 인디케이터
  - 모바일 safe-area HUD 최종 보정
  - 공격/스킬/도크 버튼 최소 터치 영역 44px 보장
  - 팝업 최대 높이와 초소형 화면 보정
  - reduced-motion 환경 대응
- `src/main.ts` 정리
  - `alpha098.css`~`alpha113.css` 정적 import 제거
  - `alpha114.css`만 정적 import
  - 반복되던 sync 호출 묶음을 `syncLegacyVisualStack114()`로 통합
  - System Doctor에 `1.14 CSS 분리` 항목 추가
- `public/sw.js`
  - 캐시 버전 `soul-online-alpha-v1-14` 갱신

## 빌드/배포 영향

- Vite는 동적 CSS import를 별도 CSS chunk로 분리한다.
- 첫 화면은 `styles.css`와 `alpha114.css`의 기본 스타일로 먼저 표시된다.
- 과거 보정 레이어는 첫 페인트 이후 순차 적용되어 기존 UI 품질을 보존한다.
- Firebase Hosting 무료 플랜 관점에서 캐시 정책은 유지하며, 파일명 해시 기반 immutable 캐시와 service worker 버전 갱신을 함께 사용한다.

## 다음 권장 작업

1. `styles.css` 내부의 중복 셀렉터를 실제 사용 DOM 기준으로 부분 통합
2. `src/main.ts`의 렌더 함수와 town/field 라우팅 로직 분리
3. 2MB급 스프라이트 시트를 public runtime asset 또는 lite atlas 우선 정책으로 추가 분리
