# Soul Online Alpha 0.80 UI/UX 안정화 기록

## 목적

0.79가 무너진 모바일 화면을 다시 보이게 만드는 응급 안정화였다면, 0.80은 실제 플레이 중 가장 자주 쓰는 흐름을 빠르게 정리하는 패치입니다.

## 변경 내용

- `ALPHA_VERSION`, `package.json`, 타이틀 표시 버전을 `0.80.0`으로 갱신했습니다.
- `index.html`의 title/login/town 루트에 `*-080` 클래스를 추가했습니다.
- `townContentMeta`, `townDrawerOrder`, `renderTownDrawerNav()`를 추가해 마을 드로어 안에서도 주요 콘텐츠를 바로 이동할 수 있게 했습니다.
- `renderTownContent()`는 if 연쇄 대신 콘텐츠 렌더러 맵을 사용하도록 정리했습니다.
- `syncTownMenuState()`가 `body.dataset.townContent`와 `townScreen.dataset.townContent`를 갱신하도록 했습니다.
- `routeTownZoneEnter()`에 `townRouteBusy` guard를 추가했습니다.
- `updateTownLobby070()`의 스토리/일일/추천 사냥터 카드에 ready/recommended 상태를 넣었습니다.
- CSS 마지막에 0.80 오버라이드 레이어를 추가해 드로어 탭, 활성 메뉴, 필드 HUD 겹침, 작은 화면 대응을 보강했습니다.

## 검증

- `npx tsc --noEmit` 통과
- `npm run build` 통과

## 다음 우선순위

1. `src/ui/town/` 분리: drawer, lobby, quest summary, hunt gate renderer를 main.ts에서 떼어내기
2. `src/ui/field/` 분리: HUD 위치/상태 렌더러와 필드 이벤트 바인딩 분리
3. legacy town DOM 제거: `town-game-lobby-070`, `town-premium-lobby-072`, old `town-topbar`, old `town-layout` 정리
4. CSS 파일 분리: base/title/login/town/field/sheet 순서로 빌드 입력 정리
