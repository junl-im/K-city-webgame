# Soul Online Alpha 0.87 덮어쓰기 패치

Soul Online 0.87은 외형 확장보다 기술 기반 정리에 집중한 안정화 패치입니다. 0.86 위에 그대로 덮어쓰는 소스 패치로 사용할 수 있습니다.

## 적용 순서

1. GitHub Desktop에서 현재 상태를 커밋합니다.
2. ZIP 압축을 해제합니다.
3. 프로젝트 루트에 그대로 복사해서 덮어씁니다.
4. `npm install`
5. `npm run build`
6. Firebase Hosting 사용 시 `firebase deploy --only hosting`

## 0.87 핵심

- 버전을 `0.87.0`으로 갱신했습니다.
- PWA 캐시를 `soul-online-alpha-v0-87`로 갱신했습니다.
- `src/styles/alpha087.css`를 추가해서 CSS 분리 작업을 시작했습니다.
- `src/ui/screenSafety.ts`를 추가해 UI 화면 이탈 검사 대상과 body 상태 반영을 모듈화했습니다.
- `src/ui/contentIntegrity.ts`를 추가해 아이템/스킬/카드/몬스터/사냥터/퀘스트 연결성 그래프를 점검합니다.
- `src/ui/healthPanelRenderer.ts`를 추가해 System Doctor/Tech Health 렌더링을 main.ts 밖으로 분리하기 시작했습니다.
- 설정/계정의 기술 점검 패널에 콘텐츠 연결 그래프 상태와 렌더링 예산 정보를 추가했습니다.
- `PlayerSave` 타입의 중복 `inventory` 선언을 제거했습니다.
- 마을 일일 의뢰 초기화용 kill record에 후반 몬스터 ID를 모두 포함했습니다.
- 작은 화면/낮은 화면에서 패널, 드로어, 시트, 상세 모달이 화면 밖으로 나가지 않도록 0.87 safe-frame CSS를 보강했습니다.

## 아직 남은 큰 과제

- `src/main.ts`는 여전히 비대합니다. 가방/스킬/상점 렌더러를 다음 패치에서 실제 파일 단위로 더 분리해야 합니다.
- `src/styles.css`는 여전히 큽니다. 0.87부터 새 CSS는 `src/styles/alpha087.css`처럼 분리해서 누적 충돌을 줄여야 합니다.
- 대형 이미지/스프라이트는 모바일 첫 로딩 최적화가 계속 필요합니다.
