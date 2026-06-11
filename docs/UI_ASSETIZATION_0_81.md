# Alpha 0.81 UI Assetization Notes

## 목표

0.81의 목표는 사용자가 제공한 AI 원화급 UI 레퍼런스를 실제 프로젝트 자산 구조로 편입하고, 동시에 모바일 웹게임에서 UI가 화면 밖으로 넘어가지 않도록 safe-frame 레이아웃을 강화하는 것이다.

## 추가된 에셋

`public/assets/ui/fantasy/` 아래에 다음 폴더가 추가되었다.

- `reference/`: 전체 레퍼런스 보관용 압축 WebP
- `backgrounds/`: 타이틀 키아트와 블러 처리된 분위기 배경
- `frames/`: 퀘스트 패널, 아이콘 보드, 배너, 채팅/컨트롤 레퍼런스 조각
- `buttons/`: 버튼 형태 레퍼런스 조각
- `icons/`: 메뉴 아이콘 레퍼런스 조각
- `tokens/`: 팔레트 스와치

## 실제 UI 적용 방식

스크린샷 전체를 그대로 버튼/패널로 쓰는 것은 피했다. 그 이유는 다음과 같다.

- 텍스트가 이미지에 박히면 게임 데이터와 연결하기 어렵다.
- 화면 비율이 바뀔 때 깨지거나 잘린다.
- 활성/비활성/잠금/알림 상태를 만들기 어렵다.
- 모바일 접근성과 터치 영역을 안정적으로 유지하기 어렵다.

따라서 0.81에서는 다음 방식으로 적용했다.

- 타이틀/로그인: `title-keyart-081.webp`를 분위기 레이어로 사용
- 마을: `lobby-mood-blur-081.webp`를 블러 배경으로 사용
- UI: 블루/골드/화이트 글래스 토큰을 CSS 변수로 정의
- 버튼/패널: HTML 버튼과 카드에 CSS로 프레임/광택/그림자 재현

## 주요 CSS 토큰

- `--soul-081-safe-t/r/b/l`
- `--soul-081-ink`
- `--soul-081-blue`
- `--soul-081-sky`
- `--soul-081-gold`
- `--soul-081-panel`
- `--soul-081-line`
- `--soul-081-shadow`

## 안전영역 정책

0.81 UI는 다음 제약을 강하게 둔다.

- 전체 화면은 `100vw`와 `100dvh`를 넘지 않는다.
- 주요 UI는 `env(safe-area-inset-*)` 안쪽에 둔다.
- 마을 드로어는 bottom sheet처럼 동작하며 `max-height`를 제한한다.
- 430px 이하 폭에서는 설명 텍스트와 일부 보조 정보를 숨긴다.
- 370px 이하 또는 660px 이하 높이에서는 전투 로그/일부 보조 UI를 숨겨 충돌을 피한다.

## 다음 단계

0.82에서 권장되는 작업은 다음과 같다.

1. `styles.css` 분해: `styles/base.css`, `styles/fantasy-ui.css`, `styles/town.css`, `styles/field.css`
2. town legacy DOM 제거
3. 가방/스킬/퀘스트/상점/보상 팝업을 0.81 UI 토큰으로 통일
4. 터치 타격감: 히트스톱, 버튼 충격파, 데미지 숫자, 피격 플래시 순서로 적용
