# Soul Online Alpha 1.31 - Firebase 무료 플랜/의존성/접속 대안책 패치

## 방향

1.31은 그래픽을 낮추지 않고 접속 안정성과 Firebase 무료 플랜 대응을 보강한 패치다.
1.27 타이틀 키비주얼과 1.23 이후의 2.5D 고해상도 에셋은 그대로 유지한다.

## 핵심 변경

- Firebase Analytics 동적 로드를 제거해 로그인/저장에 필요한 Auth + Firestore만 로드한다.
- 자동 저장의 Firestore 쓰기를 로컬 우선 큐 방식으로 완화한다.
- 전투 중 잦은 변경은 로컬 저장을 즉시 수행하고, 클라우드는 최소 간격 이후 예약 저장한다.
- 랭킹 문서는 명시 저장 또는 충분한 변화/시간 경과가 있을 때만 갱신한다.
- 클라우드 세이브 읽기는 짧은 TTL 캐시를 사용해 같은 화면에서 중복 Firestore read를 줄인다.
- 서비스워커는 index.html만 network-first로 두고, hashed JS/CSS/assets는 cache-first로 바꿔 재접속 트래픽을 줄인다.
- 구형 soul-online-alpha 캐시는 1.31 기준으로 정리한다.
- System Doctor에 `1.31 Firebase 무료 플랜` 항목을 추가했다.
- pixi.js, typescript, vite 버전을 exact pin으로 고정해 의존성 변동성을 줄였다.

## Firebase 무료 플랜 대응

- 로컬 저장은 항상 우선한다.
- Firebase 연결 실패나 timeout이 있어도 게임 진입은 막지 않는다.
- 자동 클라우드 저장은 30초 단위로 합쳐진다.
- 수동 저장, 계정 화면 저장, 명시적 진입 저장은 즉시 시도한다.
- 랭킹 갱신은 불필요한 반복 write를 줄인다.

## 검증

- npm ci 통과
- npm run build 통과
- tsc --noEmit 통과
- vite build 통과
- npm audit --audit-level=high: 0 vulnerabilities
- 정적 import/export 경로 검사: missing 0

## 주의

서비스워커가 이전 버전을 잡고 있으면 Firebase Hosting 배포 후 첫 1회는 강력 새로고침이 필요할 수 있다.
