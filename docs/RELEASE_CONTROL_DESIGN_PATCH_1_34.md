# Soul Online Alpha 1.34 - 초대규모 릴리즈/대안책/디자인 보완 패치

## 핵심 원칙

- 그래픽 품질을 낮추지 않는다.
- 1.27 타이틀 키비주얼을 유지한다.
- 2.5D 고해상도 캐릭터/몬스터 에셋을 유지한다.
- 렉/접속 문제는 로딩 순서, 중복 실행, 캐시, Firebase 무료 플랜 대응으로 해결한다.

## GitHub Actions 중복 실행 정리

1.33 기준으로 `.github/workflows/build.yml`과 `.github/workflows/pages.yml`이 둘 다 push에 반응할 수 있었다. GitHub Pages 자체 빌드가 켜져 있으면 Actions가 3번 보이는 상황이 생길 수 있다.

1.34에서는 다음처럼 정리했다.

- `build.yml`만 push/pull_request에서 자동 실행한다.
- `pages.yml`은 수동 실행 전용으로 변경한다.
- 두 workflow 모두 concurrency를 적용해 같은 브랜치의 이전 실행을 취소한다.
- preflight에서 자동 workflow가 여러 개면 경고를 출력한다.

Firebase Hosting을 사용한다면 GitHub Pages workflow는 수동 상태로 두는 것이 안전하다.

## 접속/대안책 보강

- `src/ui/releaseControl134.ts` 추가.
- START/로그인/마을/필드 버튼의 중복 탭을 차단한다.
- 로그인 버튼이 disabled 상태로 고착되면 복구한다.
- title/login/town/field 중 한 장면만 보이도록 최종 보정한다.
- 중복 Pixi canvas가 생기면 최신 canvas만 남긴다.
- 로컬 세이브 백업 mirror를 1.34 전용으로 보강한다.
- 오프라인/지연 상태에서는 로컬 플레이를 우선한다.

## 디자인 보완

- `src/styles/alpha134.css` 추가.
- 타이틀 키비주얼의 원화풍 분위기는 유지하면서 START 버튼과 상단 pill의 유리/네온 마감을 강화했다.
- 로그인/팝업/마을 패널의 외곽선과 그림자를 상용 게임 UI 느낌으로 보강했다.
- 오프라인/복구 상태를 알려주는 작은 상태 pill을 추가했다.

## 검증

- `npm ci --no-audit --no-fund --prefer-online` 통과.
- `npm run build` 통과.
- `tsc --noEmit` 통과.
- `vite build` 통과.
- `npm audit --audit-level=high --omit=optional` 취약점 0개.
- package-lock 내부 registry 오염 없음.
