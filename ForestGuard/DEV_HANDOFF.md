# 라니 수비대 / ForestGuard — 개발 인계 메모
© 2026 곰같은여우

## 코드의 기준본
- GitHub: https://github.com/junl-im/K-city-webgame/tree/main/ForestGuard
- 원본 엔트리: ForestGuard/index.html
- 엔진/진행: ForestGuard/game.js
- 동작별 4프레임 × 대기·달리기·공격·피격·승리: ForestGuard/visuals.js
- 독자 원화: ForestGuard/art/forest-characters.png · rani-evolution.png
- UI: ForestGuard/style.css
- 기본 자동 검사: node ForestGuard/tests/smoke.mjs
- 기존 브라우저 세이브 키: gomfox.forestguard.v1 (호환 유지)

## 2026-10-31 v0.3 작업
1. 여우·곰·토끼·고양이·진화 여우와 몬스터 4종에 5상태 모션 프레임 생성. 단순 흔들림만 있던 이전 버전에서 공격·피격 상태를 구분.
2. UI 이모지 제거. 원화 초상과 Canvas 생성 PNG 모험·전투·강화 문양 사용. SVG 금지 유지.
3. 1장 보스 돌진, 2장 보스 잠복 이동, 3장 보스 광역 성벽 파동. 1.25초 경고 후 발동, 일제사격으로 저지.
4. 번개 카드 추가, 화염폭풍·빙뢰연쇄·폭풍 화살·불굴의 성벽 조합.
5. 안개·달빛 전장 색조 및 수정 갑옷 도입.
6. 기존 12스테이지와 브라우저 저장 데이터 호환.

## 후속 과제
- 임시 변형 모션이 아닌 파츠별/프레임별 신규 캐릭터 원화. 상태별 6~8프레임 권장.
- 저성능 안드로이드에서 생성 텍스처 180장의 메모리·초기 로딩 확인.
- 사운드(원본 효과음)·진동·보스 전용 초상·스테이지별 장애물.
- 난이도 계측: 1-1 자동 방어 성공률, 보스 저지 성공률, 빌드별 클리어율.
- 320px 너비·짧은 화면, 뒤로가기, 중단·복귀, 메뉴·모달, 1x/2x, 저장 테스트.
- AI 놀이터 링크 연동 전 실제 배포 URL과 브라우저 확인.

## 반드시 유지
- 타 프로젝트 폴더·아트·개인 실명 수정 금지.
- SVG·이모지·우클릭·드래그 필수 조작·강제 광고 금지.
- 모바일 세로 한 화면, 3개 중 선택 카드, 수동 스킬, 진화.
- 루트와 ForestGuard/AGENTS.md의 뒤로가기/QA 규칙.
