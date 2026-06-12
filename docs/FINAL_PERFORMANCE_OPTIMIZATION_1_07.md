# Soul Online Alpha 1.07 - Final Performance and Compact Build Pass

## 목표

1.06의 Lite Atlas 구조 위에 1.07 최종 성능 게이트를 추가했다. 이번 패치는 기능 추가보다 다음 문제를 줄이는 데 집중한다.

- 모바일 세로 화면에서 사냥터 HUD가 밀리는 문제
- 저사양 기기에서 PixiJS 렌더링, FX, HUD DOM 갱신이 동시에 부담되는 문제
- 대형 WebP Atlas와 장식 프롭이 한 번에 로딩되는 문제
- 배포/보관용 전체 파일이 너무 커지는 문제

## 핵심 변경

- `src/ui/finalOptimization107.ts` 추가
  - 기기 성능을 `lite / balanced / quality`로 최종 판정
  - route, tier, 세로/좁은 화면 상태를 body class와 dataset으로 동기화
  - UI 화면 이탈 개수, DOM 수, 이미지 수, 패널 수를 점검
  - 이미지 lazy/eager/fetchPriority 정책을 다시 적용

- `src/styles/alpha107.css` 추가
  - 사냥터 HUD safe-area 재배치
  - 몬스터 정보 카드 화면 이탈 방지
  - 퀘스트 카드/미니맵/조이스틱/스킬/공격 버튼 재배치
  - 어두운 전투 HUD와 밝은 패널 글자 대비 보정
  - 저사양 모드에서 blur/filter/shadow를 줄임

- `src/game/fieldEngineProfile105.ts` 조정
  - 모바일 라이트/밸런스 렌더 예산을 더 보수적으로 조정
  - 과한 DPR, FX, HUD 갱신 빈도를 줄임

- `src/game/SolGame.ts` 조정
  - lite/balanced 기기에서 일부 장식 프롭 텍스처를 로딩하지 않음
  - 누락된 장식 텍스처는 기본 프롭 텍스처로 안전하게 대체
  - 필수 캐릭터/현재 사냥터 몬스터/핵심 타일은 유지

## 파일 관리

1.07부터는 패치 ZIP 외에 `final compact project` ZIP을 별도로 만든다.
이 ZIP은 최신 프로젝트를 다시 시작하기 위한 기준 파일이며, 불필요한 과거 작업 폴더와 대량 스크린샷을 제외한다.

## 남은 과제

- `styles.css` 본체가 여전히 크다.
- 오래된 alpha CSS를 완전히 삭제하려면 실제 화면별 회귀 테스트가 필요하다.
- 고품질 Atlas와 Lite Atlas를 배포 단에서 완전히 분리하면 전송량을 더 줄일 수 있다.
