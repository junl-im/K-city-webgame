# Soul Online Alpha 1.30 로그인 연결 복구 패치

이번 패치는 그래픽을 낮추지 않고 첫 로그인/접속 불능 문제를 우선 복구한다.

## 핵심 원칙

- 1.27 타이틀 키비주얼 유지
- 2.5D 고해상도 캐릭터/몬스터 유지
- lite/저화질 전환 없음
- 접속 문제는 초기화 순서, Firebase timeout, fallback 라우팅, 중복 버튼 상태로 해결

## 수정 사항

- `src/ui/loginConnection130.ts` 추가
  - START 이후 로그인 화면 강제 복구
  - 로그인 버튼 disabled watchdog
  - guest/local/server 단계 fallback
  - title/login/town/field route 보정
- `src/game/SaveService.ts`
  - 게스트 로그인은 Firebase 지연 시 로컬 게스트로 계속 진행
  - Google 로그인 timeout 추가
  - Cloud read/write timeout 추가
- `index.html`
  - preboot 단계 로그인 flow fallback 추가
  - 버전 1.30.0 표시
- `src/styles/alpha130.css`
  - 로그인 화면 glass UI 개선
  - 버튼 터치 영역 및 route visibility 보정
- `public/sw.js`
  - PWA 캐시 `soul-online-alpha-v1-30`으로 갱신

## 확인 포인트

- 사이트 첫 접속 후 START 버튼 반응
- 게스트 접속이 네트워크 지연에도 server 단계로 넘어가는지
- 로컬 저장 버튼 즉시 server 단계 이동
- 캐릭터 선택/생성 후 마을 입장
- 기존 2.5D 에셋 및 타이틀 키비주얼 유지
