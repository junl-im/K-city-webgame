# Soul Online alpha 1.12 모바일 런타임/HUD 품질 패치

## 목표

1.11에서 추가한 K-city 팝업/가방/전투 연출 위에, 모바일 세로모드 실기에서 가장 자주 발생하는 주소창 높이 변화, 좁은 화면 HUD 이탈, 데이터 절약 모드, 저사양 단말의 과한 모션 문제를 최종 보정 레이어로 정리했다.

## 핵심 변경

- `src/ui/mobileRuntime112.ts` 추가
  - `visualViewport` 기준 `--vvw-112`, `--vvh-112` CSS 변수를 런타임 동기화한다.
  - `deviceMemory`, `navigator.connection.saveData`, DPR, 화면 크기로 `lite / balanced / quality` 런타임 등급을 계산한다.
  - DOM 이미지는 라우트와 런타임 등급에 맞춰 `decoding=async`, `loading=lazy`, `fetchpriority`를 보정한다.
  - System Doctor에서 1.12 모바일 런타임 상태를 확인할 수 있다.

- `src/ui/fieldHud112.ts` 추가
  - `hud-top`, `resource-strip`, `target-card`, `field-quest-tracker`, `field-minimap`, `combat-log`, `joystick`, `action-dock`, `skill-dock`을 safe-frame 대상으로 등록한다.
  - 화면 크기 변화/주소창 접힘/회전 이벤트마다 HUD safe 변수를 재계산한다.
  - 버튼 터치 피드백을 추가하되 저사양/감속 모드에서는 CSS로 과한 애니메이션을 줄인다.
  - System Doctor에서 HUD 이탈 개수와 터치 타깃 수를 확인할 수 있다.

- `src/styles/alpha112.css` 추가
  - 필드 HUD를 네온 블루/화이트 톤의 고대비 패널로 보정했다.
  - 340px급 초소형 화면에서는 퀘스트/로그 일부를 자동 축소 또는 숨김 처리해 화면 밖 이탈을 줄였다.
  - 팝업/가방 영역에 `content-visibility`와 safe max-height를 적용해 모바일 스크롤 비용을 낮췄다.
  - 씬 전환 중 전투/조이스틱/마을 버튼 입력을 잠깐 막아 중복 터치로 인한 UI 꼬임을 줄였다.

- `src/main.ts`
  - 버전 `1.12.0` 반영.
  - 1.12 런타임/HUD 모듈 install/sync/inspect 연결.
  - System Doctor와 기술 진단 패널에 1.12 항목 추가.

- `public/sw.js`
  - PWA 캐시 이름을 `soul-online-alpha-v1-12`로 갱신.

## 빌드 검증

- `npm run build` 통과
- `tsc --noEmit` 통과
- `vite build` 통과

## 다음 단계 제안

다음 패치에서는 CSS 누적량 자체를 줄이기 위해 `alpha098~alpha112`의 실제 사용 셀렉터를 기준으로 한 스타일 통합 작업이 필요하다. 이번 1.12는 기존 레이어를 지우지 않고 안전 보정 레이어를 얹는 방식이므로 회귀 위험이 낮다.
