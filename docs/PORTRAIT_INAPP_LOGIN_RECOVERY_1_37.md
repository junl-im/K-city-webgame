# Soul Online Alpha 1.37 - 카카오톡 인앱/첫 로그인/Actions 복구 패치

## 목표

1. GitHub Actions가 2번 이상 자동 실행되는 구조 제거
2. 카카오톡/인앱 브라우저에서 fullscreen/orientation API 호출 없이 세로 게임 프레임 유지
3. 첫 시작 화면에서 배경만 보이고 로그인으로 진입하지 못하는 상황 방지
4. 1.27 이후 타이틀 키비주얼과 2.5D 고해상도 에셋 유지

## 핵심 변경

- `src/core/PortraitGuard.ts` 추가
- `src/styles/alpha137.css` 추가
- `index.html`에 preboot portrait cage 추가
- 인앱 브라우저 탐지 시 `requestFullscreen()` / `screen.orientation.lock()` 호출 경로 차단
- `recoveryKernel120`과 `viewportLock117`이 1.37 세로 프레임 값을 우선 사용하도록 연결
- `build.yml`만 자동 실행하도록 정리
- `pull_request` trigger 제거
- `pages.yml` 제거
- `manifest.webmanifest`에 `orientation: portrait-primary` 추가

## 카카오톡 인앱 브라우저 대응

카카오톡 인앱 브라우저에서는 방향 잠금 API가 무시되거나, 버튼/메뉴 터치 시 viewport가 다시 계산될 수 있다. 1.37부터는 인앱 브라우저에서 API를 쓰지 않고 다음 모드로만 동작한다.

```text
inapp-css-only portrait cage
```

가로 viewport가 되더라도 게임은 회전하지 않고, 현재 브라우저 창 안에 세로 게임 프레임을 중앙 고정한다. 회전 안내 메시지나 팝업은 표시하지 않는다.

## Actions 정리

Firebase Hosting 기준으로 자동 workflow는 하나만 남긴다.

- `.github/workflows/build.yml`

기존 repo에 아래 파일이 남아 있으면 삭제한다.

- `.github/workflows/pages.yml`
- `firebase-hosting-*.yml`
- `deploy.yml`
- `pages-build-deployment.yml`

## 그래픽 정책

- 그래픽 경량화 없음
- 1.27 타이틀 키비주얼 유지
- 1.35/1.36 레퍼런스 UI 유지
- 2.5D 고해상도 캐릭터/몬스터 유지
- lite/저화질 atlas 전환 없음
