# Soul Online 1.11 K-city Commercial RPG Refactor

## 목표
- 기존 웹 UI 느낌을 줄이고 현대적 K-city 네온 캐주얼 RPG 톤을 강화했습니다.
- 기존 데이터 구조와 이벤트 바인딩을 유지하면서 전투 손맛, 인벤토리 격자, 팝업 탄성 모션, 씬 페이드를 개선했습니다.

## 변경 파일
- `src/game/CombatSystem.ts`: PixiJS 8 전투 이펙트/Tween 헬퍼 추가
- `src/game/SolGame.ts`: 대시 공격, 크리티컬 카메라 셰이크, 백색 Hit Flash, Floating Damage Text 연동
- `src/ui/MenuWindow.ts`: 중앙 팝업 Bounce/Elastic 모션 및 safe-area 높이 보정
- `src/ui/InventoryUI.ts`: 4x4/5x5 모바일 네온 인벤토리 렌더러
- `src/main.ts`: 새 UI 모듈 통합, 씬 전환 phase 클래스 추가, 중복 스킬 변수 정리
- `src/styles.css`: 1.11 네온 패널/가방/전환/팝업 CSS 오버라이드 추가
- `public/sw.js`: PWA 캐시 `soul-online-alpha-v1-11` 갱신

## 성능 정책
- CombatSystem은 기존 `isFieldLite101()` 판단을 재사용해 저사양 모드에서 Tween 지속 시간과 Floating Text를 줄입니다.
- 인벤토리 아이콘은 `loading="lazy"`, `decoding="async"`를 사용합니다.
- 새 CSS는 기존 레이어를 삭제하지 않고 마지막 오버라이드로만 추가되어 회귀 시 롤백이 쉽습니다.
