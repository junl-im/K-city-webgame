# 《거짓말의 방》 — 첫 심문실 프로토타입

곰같은여우의 AI 놀이터에 연계할 무료 웹 심리 추리 게임. 현재 `LR-001 사라진 은빛 가면` 사건 한 건을 처음부터 결말까지 플레이할 수 있다.

## 실행

- 웹 정적 파일: `dist/index.html`, `dist/style.css`, `dist/app.mjs`, `dist/core.mjs`.
- ES module이므로 로컬에서는 HTTP 정적 서버로 서빙해야 한다. GitHub Pages에서는 별도 패키지 설치 없이 실행된다.
- 테스트: `node LieRoom/tests/smoke.mjs` (저장소 루트 기준).
- 모든 경로는 상대 경로이므로 `/K-city-webgame/LieRoom/` 하위에 배치할 수 있다.

## 구현된 기능

- 심문할 인물 3명 선택, 총 7개 질문과 일관된 증언.
- 확보 증거 7개(초기 2개, 심문 후 5개), 증거 출처·시간·모순 설명.
- 최대 3개 증거 선택 및 범인 지목; 정확/근거 부족/오답 3가지 결과.
- 거짓말쟁이와 진범을 구분하는 확정 사건 진실.
- `localStorage` 이어하기 및 다른 탭 변경 반영, 저장 실패 알림.
- 모바일·PC 반응형, 내부 컨텐츠 스크롤, 키보드 Escape 모달 닫기, 움직임 축소 선호 처리.
- 외부 라이브러리/서버/API/로그인 불필요. SVG 자산·파일·데이터 URI 사용하지 않음.

## 아직 구현하지 않은 것

- 수상한 방문객, 사라진 메시지, 60초 미스터리, 배신자 게임은 예고 카드만 표시.
- 기존 기획 원화의 고해상도 캐릭터 스프라이트 및 증거 이미지 결합.
- 글로벌 랭킹/멀티플레이/정교한 AI 대화, 사건 다양화.
- 실제 휴대전화·PC 브라우저에서의 수동 레이아웃 점검.

## 저장소 통합 원칙

`K-city-webgame`의 기존 `MagicGarden`, `SixtySecondPlayground`, `FlowerMatgo`, `PhysicsPopbook` 소스를 수정하지 않는다. GitHub Pages 워크플로에 `LieRoom/dist/`를 별도 경로로 복사하는 단계만 추가해야 게시된다.

© 2026 곰같은여우. All rights reserved. `OWNERSHIP.md` 참조.
