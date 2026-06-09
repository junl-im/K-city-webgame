# 소울 온라인 Alpha 0.36 UI Polish Pass

모바일 2.5D 웹 MMORPG 프로토타입입니다. 0.36은 0.35 긴급 UI 복구 이후 마을/필드/드로어/슬롯 인터페이스를 더 작고 일관된 규격으로 정리한 UI 다듬기 패치입니다.

## 0.36 변경점

- 마을 상단 캐릭터 카드, 재화 카드, 사냥터/기능 패널 크기 재정리
- 마을 하단 메뉴와 더보기 메뉴의 높이/간격/활성 표시 통일
- 마을 드로어를 중앙 하단 패널로 안정화하고 열림 상태의 배경/레이어 정리
- 계정/가방/카드/스킬/상점/의뢰 리스트 내부 여백과 카드 크기 축소
- 인벤토리, 카드, 스킬 슬롯의 최소 크기와 이미지 표현 규칙 통일
- 필드 HUD, 몬스터 타겟, 퀘스트 트래커, 스킬/액션 도크를 더 컴팩트하게 조정
- 닫힌 시트와 드로어가 클릭을 가로막지 않도록 visibility/pointer-events 보강
- ESC 키로 더보기/마을 드로어/필드 시트를 닫을 수 있게 UX 보강
- 버전, PWA 캐시, 에셋팩 메타데이터를 0.36 기준으로 정리

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 주요 문서

- `docs/CRITICAL_UI_REPAIR_0_35.md`
- `docs/UI_POLISH_0_36.md`
- `docs/GRAPHIC_UI_SKIN_0_32.md`
- `docs/FIELD_GUIDE_INFERNUS_0_33.md`
- `docs/SOL_ONLINE_DESIGN.md`

## 현재 버전

- 앱 버전: `0.36.0`
- 저장 버전: `SAVE_VERSION = 27`
- PWA 캐시: `soul-online-alpha-v0-36`
