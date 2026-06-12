# Soul Online Alpha 1.21 다듬기/복구 안정 패치

1.21은 새 기능보다 첫 실행 안정과 누적 패치 흔적 정리에 초점을 둔 패치다.

## 핵심 원인 정리

1.20 이전까지는 구형 시각 보정 class가 `index.html`의 body에 초기값으로 많이 남아 있었다. 메인 CSS 또는 지연 CSS가 뒤늦게 로드되면 이 class들이 다시 살아나면서 타이틀/마을/필드 이미지가 순간적으로 겹칠 수 있었다.

또한 1.20에서 START를 먼저 살렸지만, START 직후 `styles.css` 전체를 지연 로드하고 있어서 모바일에서는 로그인 전환 직후 다시 랙이 생길 수 있었다.

## 1.21 조치

- `index.html`의 초기 body class를 복구/표준 모드용 최소 class로 축소했다.
- START 이후 자동 로드 CSS에서 대형 `styles.css`를 제외했다.
- 구형 전체 CSS는 개발 확인이 필요할 때만 `?legacyCss=1` 또는 `localStorage.setItem('soul-online-allow-legacy-css','1')`로 켤 수 있다.
- `src/ui/polishKernel121.ts`를 추가해 현재 장면만 표시하고, pet/companion/rune/orientation 가드류 고스트 레이어를 숨긴다.
- 필드 진입 후 버튼/조이스틱 충돌을 검사해 `field-collision-risk-121` class로 보정한다.

## 검증

- `npm run build` 기준으로 TypeScript/Vite 빌드를 통과해야 한다.
- Firebase Hosting 배포 후 구형 서비스워커가 남아 있으면 1회 강력 새로고침이 필요할 수 있다.
