# Soul Online Alpha 0.87 기술 구조 안정화

## 목표

0.87의 목표는 화면을 더 화려하게 만드는 것이 아니라, 계속 커지는 프로젝트가 무너지지 않도록 기술 기반을 나누는 것입니다.

## 변경 사항

- `src/styles/alpha087.css`
  - 0.87 전용 safe-frame, System Doctor, Tech Health, 렌더링 예산 UI를 분리했습니다.
  - 앞으로 신규 CSS는 가능한 한 `styles.css` 끝에 계속 붙이지 않고 버전/기능별 파일로 분리합니다.

- `src/ui/screenSafety.ts`
  - UI 화면 이탈 검사 셀렉터를 한 곳으로 모았습니다.
  - 검사 결과에 따라 `ui-overflow-risk`, `ui-narrow-087`, `ui-short-087` body 클래스를 반영합니다.

- `src/ui/contentIntegrity.ts`
  - 직업, 아이템, 스킬, 카드, 카드 세트, 영혼, 몬스터, 사냥터, 스토리, 일일 의뢰의 연결성을 점검합니다.
  - 누락된 드랍 아이템, 누락된 보상 아이템, 잘못된 몬스터 참조, 중복 ID를 빠르게 찾는 목적입니다.

- `src/ui/healthPanelRenderer.ts`
  - System Doctor와 Tech Health HTML 렌더링을 main.ts에서 일부 분리했습니다.
  - 다음 단계에서 가방/스킬/상점 렌더러도 같은 방식으로 분리할 수 있습니다.

## 점검 결과

- TypeScript 빌드가 통과해야 합니다.
- Vite 빌드가 통과해야 합니다.
- PWA 캐시는 `soul-online-alpha-v0-87` 기준입니다.
- Firebase 프로젝트 ID는 기존 연결을 깨지 않기 위해 유지합니다. 게임 표기는 Soul Online으로 유지합니다.

## 다음 단계

0.88에서는 가방/스킬/상점 렌더러를 실제 모듈로 분리하고, 상점 구매 확인 UX와 가방 필터 상태를 더 안정화하는 것이 우선입니다.
