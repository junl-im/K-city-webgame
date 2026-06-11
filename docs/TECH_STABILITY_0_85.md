# Alpha 0.85 Technical Stability Pass

0.85는 Soul Online의 기술 안정화 패치다. 외형을 새로 덧칠하기보다, 누적 패치 과정에서 생길 수 있는 연결성/성능/UI 안전 문제를 게임 안에서 바로 확인할 수 있도록 진단 레이어를 추가했다.

## 추가 사항

- `ALPHA_VERSION = 0.85.0`
- PWA 캐시 `soul-online-alpha-v0-85`
- `fantasy-ui-085` / `title-screen-085` / `login-screen-085` / `town-screen-085`
- System Doctor 0.85
- Long Task API 기반 프레임 정체 감지
- `navigator.storage.estimate()` 기반 저장소 사용량 감지
- online/offline 이벤트 기록
- UI overflow 재검사 버튼
- 진단 로그 중복 기록 방지

## 확인한 기술 부채

- `src/styles.css`가 2.5만 줄 이상으로 커져 CSS 충돌 가능성이 높다.
- `src/main.ts`가 4천 줄 이상이라 UI 화면과 게임 상태 로직이 한 파일에 섞여 있다.
- 원화급 에셋은 좋지만, 일부 스프라이트 시트가 2MB 이상이라 모바일 첫 로딩 최적화가 계속 필요하다.

## 다음 권장 작업

0.86부터는 `src/ui/` 모듈을 만들고 마을 드로어, System Doctor, 가방, 스킬, 상점 렌더러를 분리하는 것이 좋다. CSS도 `styles.css`에 계속 누적하지 말고 `ui-fantasy.css`, `ui-town.css`, `ui-field.css` 단위로 분해해야 한다.
