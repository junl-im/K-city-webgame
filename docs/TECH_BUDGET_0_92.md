# Soul Online Alpha 0.92 - CSS Budget & Entry Regression Guard

0.92는 0.90에서 복구한 첫 화면을 계속 보호하면서, 0.91에서 확인된 CSS 번들 증가와 대형 리소스 부담을 런타임에서 더 명확하게 추적하는 기술 안정화 패치다.

## 적용 내용

- 첫 화면 회귀 검사 모듈 추가: `src/ui/entryRegression092.ts`
- CSS 예산 진단 모듈 추가: `src/ui/cssBudget092.ts`
- 0.92 전용 안전 CSS 분리: `src/styles/alpha092.css`
- System Doctor / Tech Health에 진입 회귀와 CSS 예산 타일 추가
- 진단 액션에 `진입 검사`, `CSS 점검` 추가
- Pixi 필드 에셋 로딩을 무제한 `Promise.all`에서 제한 병렬 로딩으로 변경
- PWA 캐시 버전 `soul-online-alpha-v0-92` 적용

## 확인한 위험 요소

- CSS 번들은 여전히 800KB 이상이라 장기적으로 화면별 CSS를 더 분리해야 한다.
- 대형 캐릭터/몬스터 스프라이트가 2MB 이상이므로 모바일 첫 필드 진입에서 체감 로딩이 생길 수 있다.
- Firebase 프로젝트 ID는 연결 식별자라 유지하고, 게임 표기는 계속 Soul Online / 소울 온라인을 기준으로 둔다.

## 다음 권장 방향

0.93은 `SolGame`의 필드 렌더링과 에셋 로딩을 더 나누고, 스프라이트 시트를 사용 필드 기준으로 늦게 불러오는 구조로 확장하는 것이 좋다.
