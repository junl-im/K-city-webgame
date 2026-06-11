# Soul Online Alpha 0.91 덮어쓰기 패치

Soul Online 0.91은 첫 화면 안정성을 유지하면서 리소스 예산, 라이트 렌더 모드, PWA 런타임 캐시 정책을 보강하는 성능 안정화 패치입니다.

## 적용 방법

1. GitHub Desktop에서 현재 상태를 먼저 커밋합니다.
2. 이 패치 ZIP을 프로젝트 루트에 압축 해제해 덮어씁니다.
3. `npm install`을 실행합니다.
4. `npm run build`를 실행합니다.
5. Firebase Hosting 사용 시 `firebase deploy --only hosting`으로 배포합니다.

## 0.91 핵심

- 버전을 `0.91.0`으로 갱신했습니다.
- PWA 캐시를 `soul-online-alpha-v0-90`으로 갱신했습니다.
- `src/ui/titleEntry090.ts`를 추가해 첫 화면 표시 상태를 런타임에서 복구/진단합니다.
- `src/styles/alpha090.css`를 추가해 `TOUCH TO START` 버튼이 화면 밖으로 나가거나 다른 레이어에 가려지지 않도록 보정했습니다.
- 타이틀 화면 빈 영역 터치도 시작 입력으로 처리하는 fallback을 추가했습니다.
- System Doctor / Tech Health에 첫 화면 표시 진단을 추가했습니다.
- 저성능 상태에서 0.91 타이틀 애니메이션을 줄이는 성능 가드를 추가했습니다.

## 검증

- `npm run build` 성공
- TypeScript 검사 통과
- Vite 빌드 성공
