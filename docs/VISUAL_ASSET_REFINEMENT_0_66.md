# Soul Online Alpha 0.66 - Visual QA / Asset Refinement Pass

## 적용 기준

Alpha 0.66은 0.60 타이틀 키비주얼의 만족도를 유지하면서, 0.63~0.65에서 추가된 밝은 판타지 에셋과 UI가 충돌하지 않도록 재정리한 비주얼 QA 패치다.

## 핵심 개선

- 시작 화면은 `title-keyvisual-060.webp` 기반을 유지하고, `TOUCH TO START`를 모바일 중앙 라인으로 안정화했다.
- 0.66 전용 UI WebP 에셋을 추가했다.
  - `ui-panel-glass-066.webp`
  - `ui-button-sky-066.webp`
  - `ui-slot-sky-066.webp`
  - `ui-badge-glow-066.webp`
  - `ui-title-vignette-066.webp`
- 한글 가독성 기준으로 잉크 컬러, 강조색, 그림자, 줄간격, 숫자 정렬을 재보정했다.
- 로그인/서버/캐릭터/마을/시트/전투 HUD의 밝은 배경 대비를 통일했다.
- 장식 레이어, 배경 레이어, 핫스팟 레이어가 버튼 입력을 막지 않도록 pointer-events와 z-index를 재점검했다.
- 필드 렌더링에 `addAlpha066AssetRefinementFieldPass()`를 추가해 맵 타일 위 착지 그림자, 경로 리본, 사냥 포켓 마커를 보강했다.
- 플레이어 이름표와 몬스터 이름표/HP바 대비를 높였다.
- 소울 펫 동행 모션에 미세한 부유감과 스케일 펄스를 추가했다.

## 호환성 체크

- 직접 덮어쓰기 방식 기준으로 구성했다.
- `dist/`는 포함하지 않는다. 적용 후 로컬에서 `npm run build`를 실행한다.
- 기존 저장 데이터 구조는 변경하지 않았다.
- 신규 필드 패스는 Pixi 그래픽 레이어만 추가하므로 저장/전투 수치와 충돌하지 않는다.
- PWA 캐시는 `soul-online-alpha-v0-66`으로 갱신했다.

## 검증

- `npm run build` 통과.
- 새 WebP UI 에셋 로드 확인.
- 제목/로그인/마을/필드 class `066` 연결 확인.
