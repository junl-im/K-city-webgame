# Soul Online Alpha 1.40 - 첫 화면 응답/터치 복구 패치

## 목적

1.39 클린 교체 후 GitHub Actions는 정상화되었지만, 첫 화면에서 페이지 응답 없음, 화면 위쪽 쏠림, TOUCH TO START 중복 표시, START 터치 불능 증상이 발생할 수 있었다.

## 원인

- `/src/main.ts`가 첫 페인트 직후 바로 로드되면서 다량의 CSS/런타임 보정 모듈이 동시에 실행되었다.
- 1.35/1.36 레퍼런스 타이틀 이미지 안에 이미 START 버튼이 있는데 HTML 버튼이 다시 그려져 2겹처럼 보였다.
- `#game-root` 또는 구형 route 레이어가 title 위쪽에서 포인터 이벤트를 가로챌 수 있었다.
- 1.37/1.38 portrait frame 보정이 상하 중앙 스케일을 반복 적용하면서 일부 브라우저에서 화면이 위로 쏠린 것처럼 보일 수 있었다.

## 수정

- 새 경량 진입점 `src/boot.ts` 추가.
- `index.html`의 모듈 진입점을 `/src/main.ts`에서 `/src/boot.ts`로 변경.
- 메인 게임 번들은 START 터치 후 로그인 화면을 먼저 보여준 다음 동적 import로 로드한다.
- START 버튼은 투명 hit zone으로 바꾸고, 시각 버튼은 키아트에 포함된 버튼을 사용한다.
- `#app`은 portrait 상태에서 `top: 0 + left center`로 고정해서 위/아래 스케일 튐을 줄였다.
- title/login/town/field route를 1.40 기준으로 다시 한번 정리한다.
- 인앱/카카오톡 브라우저에서 fullscreen/orientation API를 쓰지 않는 기존 정책을 유지한다.

## 그래픽 정책

- 1.27 타이틀 키비주얼 유지.
- 1.35/1.36 레퍼런스 UI 유지.
- 2.5D 고해상도 캐릭터/몬스터 유지.
- lite/저화질 전환 없음.
