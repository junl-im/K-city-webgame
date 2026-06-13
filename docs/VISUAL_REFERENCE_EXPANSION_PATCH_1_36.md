# Soul Online Alpha 1.36 - 레퍼런스 에셋 확장 적용 패치

## 목표

1.35에서 시작한 레퍼런스 이미지 기반 UI 개편을 더 넓게 확장한다.  
그래픽 품질은 낮추지 않고, 업로드된 두 장의 UI 보드에서 추가 조각 에셋을 잘라 타이틀, 로그인, 서버 선택, 마을, 퀘스트, 인벤토리, 채팅, 필드 HUD, 조이스틱, 버튼에 연결한다.

## 그래픽 원칙

- 1.27 타이틀 키비주얼 감성 유지
- 2.5D 고해상도 캐릭터/몬스터 유지
- lite/저화질 atlas 전환 없음
- Firebase 배포 용량은 품질 유지를 위해 감수
- 최적화는 이미지 품질을 낮추는 방식이 아니라 연결 순서, 캐시, 중복 실행 방지로 처리

## 추가된 에셋

`public/assets/ui/soul136/` 및 `src/assets/ui/soul136/`에 54개 WebP 조각을 추가했다.

대표 에셋:

- `title-card-polished-136.webp`
- `login-panel-soft-136.webp`
- `server-panel-soft-136.webp`
- `quest-panel-clean-136.webp`
- `inventory-panel-clean-136.webp`
- `town-hero-profile-clean-136.webp`
- `town-menu-grid-clean-136.webp`
- `town-quest-list-clean-136.webp`
- `town-banner-clean-136.webp`
- `town-chat-clean-136.webp`
- `town-action-ring-136.webp`
- `bottom-menu-icon-kit-136.webp`
- `button-kit-clean-136.webp`
- `currency-bar-136.webp`
- `right-rail-icon-kit-136.webp`
- 이벤트/랭킹/도감/제작/거래소/우편/채팅/알림 아이콘 조각

## 코드 변경

- `src/styles/alpha136.css` 추가
- `src/ui/visualAssetKit136.ts` 추가
- `src/main.ts`에 1.36 설치/동기화/진단 연결
- `scripts/verifyProjectIntegrity.mjs`에 1.36 핵심 에셋 검사 추가
- `public/sw.js` 캐시 버전 `soul-online-alpha-v1-36` 갱신
- `index.html` critical title image를 1.36 타이틀 카드로 보강

## 텍스트 보정

이미지 안에 박힌 문구는 장식 배경으로만 쓰고, 실제 UI 텍스트는 DOM 텍스트를 우선 유지한다.

- 로그인 안내 문구 보정
- 서버/캐릭터/마을 입장 버튼 문구 정리
- 버전 표기 `v1.36.0` 반영
- 아직 정식 펫 시스템이 아니므로 `펫` 직접 문구는 `동료` 계열로 보정

## 안정성

- START/로그인 fallback 기존 유지
- Firebase 무료 플랜 저장 큐 기존 유지
- Actions workflow 중복 방지 구조 유지
- 2.5D 에셋 유지
- 구형 lite/quality/atlas class 재등장 차단 유지
- System Doctor에 `1.36 레퍼런스 확장` 항목 추가
