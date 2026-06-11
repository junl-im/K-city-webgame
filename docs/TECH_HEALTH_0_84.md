# Alpha 0.84 Technical Health Pass

0.84는 Soul Online의 UI 다듬기 흐름을 유지하면서, 실제 모바일 웹게임 운영에 필요한 연결성/성능/기술 상태 확인 장치를 추가한 패치다.

## 추가된 안정화 장치

- `fantasy-ui-084` 스킨 레이어 추가
- `title/login/town` 0.84 클래스 추가
- PWA 캐시 `soul-online-alpha-v0-84` 갱신
- 마을/필드/드로어/시트/상세 모달 대상 overflow audit 추가
- `window.error`, `unhandledrejection` 기반 클라이언트 이슈 로그 수집
- requestAnimationFrame 기반 간단 FPS 측정
- 설정/계정 화면에서 기술 상태 패널 표시

## 점검 패널 표시 항목

- FPS: 현재 브라우저 렌더링 상태
- 저장 연결: 온라인, 로컬, 클라우드 보류 상태
- UI 안전: 주요 패널이 화면 밖으로 나가는지 확인
- 가방 압박도: 현재 64칸 기준 사용량
- 메모리: 지원 브라우저에서 JS heap 사용량
- 런타임 오류: 현재 세션에서 감지된 오류 5개까지 표시

## 현재 기술 부채

- `src/styles.css`가 약 2.5만 줄로 커져 CSS 우선순위 충돌 위험이 높다.
- `src/main.ts`가 약 4천 줄로 커져 화면별 분리가 필요하다.
- 필드 스프라이트 시트 일부가 2MB 이상이라 중저가 모바일에서 최초 로딩 부담이 크다.
- Firebase 무료 환경에서는 클라우드 저장 실패/지연 가능성이 있어 로컬 저장 우선 전략이 계속 필요하다.

## 다음 권장 작업

0.85부터는 기능 추가보다 `main.ts`와 `styles.css`를 실제 모듈로 분리하는 작업이 필요하다. 우선순위는 다음과 같다.

1. `src/ui/town/*` 분리
2. `src/ui/sheets/*` 분리
3. `src/styles/town.css`, `src/styles/field.css`, `src/styles/components.css` 분리
4. Pixi 스프라이트 시트 해상도/용량 단계별 최적화
5. Firebase 저장 실패 시 사용자에게 더 명확한 재시도 UI 제공
