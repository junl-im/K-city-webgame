# 소울 온라인 Alpha - Dark Fantasy UI Kit

**스타일**: 다크 네이비 + 골드 베벨 (Black Desert Mobile 스타일)  
**해상도**: 32x32 아이콘 중심 + 다양한 크기 버튼/패널/HUD  
**용도**: HTML5 Canvas / Web Game UI 즉시 적용 가능

## 폴더 구조

```
soul_online_ui_kit/
├── icons_32x32/          ← 83개 게임 전용 아이콘 + spritesheet
│   ├── ui_icon_*.png
│   ├── spritesheet_256x192.png
│   └── README_ICONS.txt
├── buttons/              ← 15개 한글 라벨 버튼 (normal / gold / confirm / danger)
│   ├── btn_사냥_시작_normal.png
│   └── ...
├── panels/               ← 8개 창/패널 프레임 (인벤토리, 의뢰, 상점 등)
│   ├── panel_인벤토리.png
│   └── ...
├── hud/                  ← HP/MP/EXP/Combo 바 (배경 + 필 예시)
│   ├── hud_hp_180x16.png
│   └── ...
└── README_SOUL_ONLINE_UI_KIT.md
```

## 포함 내용 요약

### 1. Icons (83개)
- 마을 시설: 필드 게이트, 대장간, 의뢰소, 소울 성소, 여관, 감시탑 등
- 핵심 시스템: 영혼, 카드, 카드팩, 균열 봉인, 루미나
- 전투/진행: 사냥, 자동사냥, 콤보, 보스, 일일/메인 퀘스트, 장비 강화
- 기존 MMORPG 아이콘 전체 (무기, 스킬, 자원, UI 등)

### 2. Buttons (15개)
한글 라벨 포함, bevel 스타일, 4가지 variant:
- normal (기본 골드)
- gold (강조)
- confirm (초록 - 확인/긍정)
- danger (빨강 - 취소/위험)

라벨 예시: 사냥 시작, 의뢰, 스토리 진행, 장비, 스킬, 카드, 혈맹, 상점, 확인, 취소, 닫기, 자동 사냥, 레벨 업!, 필드 이동, 영혼 각성

### 3. Panels & Windows (31개 + 자투리)
다양한 크기와 용도의 창 프레임 (타이틀바 + 닫기 버튼 포함):
- **인벤토리/아이템**: 인벤토리, 아이템 상세, 장비 슬롯, 아이템 강화
- **카드/몬스터**: 카드 코덱스, 카드 상세 정보, 몬스터 도감, 몬스터 카드 상세, 카드 컬렉션
- **스킬**: 스킬 창, 스킬 트리, 스킬 상세, 스킬 북
- **퀘스트/스토리**: 의뢰 목록, 퀘스트 상세, 메인 스토리, 일일 의뢰
- **상점/거래**: 상점, 판매 창
- **기타**: 캐릭터 정보, 스테이터스, 혈맹 창, 설정, 채팅 창, 미니맵 패널, 길드 기여도, 확인, 알림, 로딩

**자투리 Misc UI Pieces**:
- item_slot_empty, item_slot_large, card_slot_empty
- tooltip 프레임 (120x50, 160x60, 100x40)
- divider

### 4. HUD Bars (6개)
HP, MP, EXP, Combo 바 (필(fill) 예시 포함)
- 웹게임에서 fill 비율을 동적으로 조절해서 사용 추천

## 사용 방법 (Web Game)

```html
<!-- 예시: 버튼 -->
<img src="buttons/btn_사냥_시작_normal.png" onclick="startHunt()">

<!-- 예시: 패널 (canvas에 그릴 때) -->
const panelImg = new Image();
panelImg.src = 'panels/panel_인벤토리.png';

<!-- HUD 바 -->
// fill 부분은 별도 이미지 또는 canvas에서 동적 그리기 추천
```

모든 에셋은 **RGBA 투명 배경**이며, 웹에 최적화되어 있습니다.

## 추가 제작 원하시면
- 더 많은 버튼 라벨 / 사이즈
- 더 큰 패널 (전체 화면 크기)
- 9-slice용 모서리/엣지 분리 파일
- 특정 아이콘 추가 (예: 특정 몬스터, 특정 카드 종류)
- 다른 색상 테마 (라이트 버전 등)

언제든 말씀해주세요!

**제작일**: 2026-06-11  
**스타일 기반**: 이전 32x32 아이콘 키트와 완전 일치
