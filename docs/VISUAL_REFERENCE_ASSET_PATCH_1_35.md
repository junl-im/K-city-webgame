# Soul Online Alpha 1.35 - 레퍼런스 UI 에셋 개편 패치

## 목표

사용자가 제공한 두 장의 고품질 UI 레퍼런스 이미지를 기준으로, 그래픽 품질을 낮추지 않고 타이틀/로그인/마을/필드 HUD의 비주얼 방향을 통일했다.

## 적용 원칙

- 1.27 시작 키비주얼과 2.5D 고해상도 에셋 방향 유지
- lite / 저화질 atlas 전환 없음
- 접속 안정성, Firebase 무료 플랜 대응, npm ci 안정성 유지
- 업로드된 레퍼런스 이미지를 잘라 `public/assets/ui/soul135/` 에셋 키트로 등록
- 레퍼런스 이미지 안에 포함된 글자는 직접 UI 텍스트와 겹치지 않도록 낮은 불투명도 장식 또는 배경 질감 위주로 사용

## 추가 에셋

`public/assets/ui/soul135/` 및 `src/assets/ui/soul135/`에 다음 계열의 WebP 에셋을 추가했다.

- title-keyart-reference-135.webp
- login-ready-panel.webp
- server-select-panel.webp
- town-showcase-blur-bg.webp
- town-paint-bg.webp
- town-player-card.webp
- town-quest-panel.webp
- inventory-window.webp
- reward-modal.webp
- levelup-modal.webp
- action-dock.webp
- bottom-icon-menu.webp
- 기타 버튼/게이지/채팅/아이콘 레퍼런스 조각

## 코드 변경

- `src/ui/visualAssetKit135.ts` 추가
- `src/styles/alpha135.css` 추가
- `src/main.ts`에 1.35 키트 설치/동기화/진단 연결
- `index.html` critical title background를 1.35 레퍼런스 키아트로 변경
- `public/sw.js` 캐시를 `soul-online-alpha-v1-35`로 갱신
- `scripts/verifyProjectIntegrity.mjs`에 1.35 핵심 UI 에셋 검사 추가

## 주의

이번 패치는 용량 경량화 패치가 아니다. 고품질 비주얼 방향을 유지하면서 CSS/로딩/중복 레이어/접속 fallback을 유지하는 디자인 개편 패치다.
