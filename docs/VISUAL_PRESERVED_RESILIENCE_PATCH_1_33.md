# Soul Online Alpha 1.33 - 비주얼 보존형 초대규모 개선/대안책 보완 패치

## 목표

1.27 타이틀 키비주얼과 2.5D 고해상도 그래픽은 유지하면서, 접속/저장/캐시/의존성/초기화 순서를 더 견고하게 보완한다.
Firebase 무료 플랜 환경에서는 불필요한 읽기/쓰기를 줄이고, 네트워크가 느리거나 실패해도 로컬 게스트 플레이로 우회한다.

## 주요 변경

- `src/ui/resiliencePlan133.ts` 추가
  - START/로그인/로컬 접속 버튼 disabled 장기 고착 방지
  - title/login/town/field route 상태 보정
  - 중복 Pixi canvas 정리
  - 구형 lite/quality/atlas 플래그 제거
  - 로컬 save roster backup mirror 생성
  - 서비스워커 구형 캐시 삭제 메시지 발송
  - 온라인/오프라인 상태 반영
- `src/styles/alpha133.css` 추가
  - 첫 화면 키비주얼 유지
  - 로그인/접속 버튼 터치 안정성 보강
  - 오프라인 로컬 접속 안내 보강
  - canvas 중복 시 최신 canvas만 보이도록 보정
- `src/game/SaveService.ts` 보강
  - 클라우드 read TTL 45초로 확대
  - read 실패 시 cached/local roster 우선
  - read/write 실패 누적 시 최대 120초 circuit breaker
  - 로컬 저장 우선 구조 유지
- `scripts/verifyProjectIntegrity.mjs` 추가
  - npm lockfile 내부 registry 오염 검사
  - 필수 파일/타이틀 키비주얼/2.5D 에셋 존재 검사
  - 서비스워커 캐시 버전 검사
- GitHub Actions 보강
  - lockfile registry 사전 검사
  - `npm ci` 실패 시 npm cache clean 후 1회 재시도
- `public/sw.js` 보강
  - `soul-online-alpha-v1-33` 캐시 갱신
  - HTML shell network-first 요청 timeout fallback 추가
  - 구형 캐시 삭제/skip waiting 메시지 처리

## 유지한 것

- 그래픽 품질 저하 없음
- 1.27 타이틀 키비주얼 유지
- 2.5D 고해상도 캐릭터/몬스터 유지
- lite atlas 자동 전환 없음
- Firebase 무료 플랜 대응 유지

## 검증

- `npm ci`
- `npm run build`
- `tsc --noEmit`
- `vite build`
- `npm audit --audit-level=high`
- lockfile internal registry 검색
- import/export/asset path 정적 검사
