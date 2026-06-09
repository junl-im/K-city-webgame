# 0.32 Graphic UI Skin Pass

0.32는 기존 CSS 기반 박스 UI를 이미지 프레임 기반 UI로 전환하는 첫 번째 그래픽 스킨 패스입니다.

## 사용한 에셋 범위

- `UIDifferentFree03Wenrexa.zip`
  - 버튼 프레임
  - 슬롯 셀
  - 대형/소형 패널 배경
- `Wenrexa Interface UI KIT #4.zip`
  - 원형 아이콘 프레임
  - 닫기 아이콘
  - 프로그레스 바 프레임
- `PVGames_Infernus_Free.zip`
  - 필드/오브젝트 쪽 확장 후보로 일부 소스만 보관

## 런타임 반영 위치

- `src/assets/ui/wenrexa/*`
- `src/styles.css` 하단 `Alpha 0.32: Wenrexa graphic UI skin pass`
- `src/main.ts`의 스킬 단축창 렌더링

## 개선된 UI 영역

- 필드 HUD
- 몬스터 타겟 카드
- 진행중 퀘스트 트래커
- HP/MP/EXP 바
- 액션/스킬 도크
- 마을 패널 및 하단 메뉴
- 인벤토리/카드/스킬/영혼 슬롯
- 상세 정보 팝업
- 토스트/전리품 팝업

## 다음 패스 후보

- 버튼 눌림/활성 상태를 에셋 스프라이트 단위로 세분화
- PVGames 오브젝트를 실제 필드 장식으로 교체
- 카드/장비 희귀도별 슬롯 프레임 색상 분리
- 모바일 저사양을 위한 UI 이미지 압축 및 WebP 변환
