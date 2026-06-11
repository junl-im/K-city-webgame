# Soul Online Alpha 0.86 덮어쓰기 패치

이 패치는 Soul Online 0.85 이후에 적용하는 기술 안정화/구조 분리 기반 패치입니다.

## 적용 방법

1. GitHub Desktop에서 현재 상태를 먼저 커밋합니다.
2. 이 ZIP의 내용을 프로젝트 루트에 그대로 덮어씁니다.
3. `npm install`을 실행합니다.
4. `npm run build`로 빌드를 확인합니다.
5. Firebase Hosting 사용 시 `firebase deploy --only hosting`으로 배포합니다.

## 0.86 핵심

- 버전을 `0.86.0`으로 갱신했습니다.
- PWA 캐시를 `soul-online-alpha-v0-86`으로 갱신했습니다.
- `fantasy-ui-086`, `title/login/town-screen-086` 안정화 레이어를 추가했습니다.
- `src/ui/technicalHealth.ts`를 새로 분리해 UI 안전 검사, 세이브 무결성 검사, 성능 분류, 연결성 매트릭스를 모듈화했습니다.
- System Doctor를 0.86으로 확장해 에셋 로딩, PWA 상태, 마을/필드 라우트 연결성을 함께 보여줍니다.
- UI 화면 이탈 감지 대상을 System Doctor/Tech Health 패널까지 확장했습니다.
- 저성능 상태에서 장식 애니메이션을 더 빨리 줄이는 `perf-reduced-motion-086` 가드를 추가했습니다.
- 드로어/시트/상세 모달/가방/스킬/상점 화면에 `contain`/`content-visibility` 기반 성능 격리를 추가했습니다.

## 아직 남은 큰 과제

- `src/main.ts`와 `src/styles.css`는 여전히 큽니다. 0.87부터는 가방/스킬/상점 렌더러를 실제 파일 단위로 분리해야 합니다.
- Firebase 프로젝트 ID는 현재 호스팅 연결 때문에 그대로 두는 것이 안전합니다. 게임 표기는 Soul Online으로 유지합니다.
- 대형 스프라이트 시트는 모바일 첫 로딩 최적화가 더 필요합니다.
