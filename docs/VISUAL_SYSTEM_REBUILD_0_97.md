# Soul Online Alpha 0.97 - 대형 UI 구조 정리 패치

## 목표

0.97은 작은 진단 패치를 더 얹는 방식이 아니라, 실제 유저가 처음 보는 흐름을 기준으로 시각/배치/연결성 문제를 크게 정리하는 패치다.

우선순위는 다음과 같다.

1. 첫 시작 화면을 원화 배경 + 단일 `TOUCH TO START` 버튼으로 고정
2. 로그인/서버/캐릭터 선택 화면을 모바일 카드형 UI로 안정화
3. 마을 화면에서 구형 0.70/0.72/일반 town 레이어가 겹쳐 보이지 않도록 차단
4. 마을은 `town-master-lobby-074` 하나를 기준으로 safe-frame 안에서 작동
5. 사냥터 HUD, 미니맵, 퀘스트, 조이스틱, 물약, 스킬, 공격 버튼의 화면 이탈 방지
6. 닫기 버튼에 0.97 크리스탈 에셋 적용
7. 밝은 UI/어두운 HUD의 글자 대비를 분리
8. 0.97 런타임 검사로 route와 overflow를 계속 감시

## 추가 파일

- `src/ui/visualMass097.ts`
- `src/styles/alpha097.css`
- `public/assets/ui/fantasy/097/title-mobile-clean-097.webp`
- `public/assets/ui/fantasy/097/town-hub-clean-097.webp`
- `public/assets/ui/fantasy/097/button-blue-097.webp`
- `public/assets/ui/fantasy/097/button-gold-097.webp`
- `public/assets/ui/fantasy/097/panel-glass-097.webp`
- `public/assets/ui/fantasy/097/close-crystal-097.webp`
- `public/assets/ui/fantasy/097/soul-spark-097.webp`

## 체크 결과

- 빌드 통과
- TypeScript 검사 통과
- 첫 화면 버튼은 런타임에서 `.entry-frame-097`로 재배치됨
- body route class는 `route-title-097`, `route-login-097`, `route-town-097`, `route-field-097` 중 하나로 고정됨
- title/login/town 상태에서는 필드 HUD가 보이지 않도록 차단됨
- field 상태에서는 주요 HUD가 safe-area 기준 fixed 배치됨

## 다음 대형 과제

0.98에서는 여전히 남아 있는 큰 기술 부채를 정리해야 한다.

- 구형 0.70~0.96 CSS 실제 삭제
- `index.html`의 구형 town DOM 실제 제거
- `main.ts`의 마을/필드 렌더링 코드 분리
- CSS 번들 900KB대 다이어트
- 대형 스프라이트 lazy loading 2차
