# Soul Online Alpha 0.96 대형 UI 복구/정리 패치

## 목표

0.90~0.95에서 기술 진단과 누적 CSS가 늘어나면서 실제 화면 품질이 흔들린 문제를 우선 해결한다. 이번 0.96은 작은 보정이 아니라 첫 화면, 로그인, 마을, 사냥터 HUD, 닫기 버튼, 색 대비, 모바일 안전 영역을 한 번에 다시 잡는 대형 안정화 패치다.

## 핵심 수정

- 첫 시작 화면을 원화 배경 + 실제 HTML `TOUCH TO START` 버튼 구조로 다시 고정했다.
- 기존 0.95 타이틀 배경에 가방 UI가 같이 들어가던 문제를 제거하고 `title-clean-096.webp`로 교체했다.
- 마을 배경에 흐릿한 UI 스크린샷이 깔리던 문제를 제거하고 `town-clean-096.webp` 원화 배경으로 교체했다.
- 화면 라우트 안정화 모듈 `visualStability096.ts`를 추가해 title/login/town/field 전환 시 hidden, aria, inert, body route class를 다시 동기화한다.
- 마을은 구형 `town-game-lobby-070`, `town-premium-lobby-072`, `town-layout`, `town-bottom-menu`가 보이지 않도록 하고 `town-master-lobby-074`만 모바일 허브로 사용한다.
- 사냥터 HUD, 퀘스트 트래커, 미니맵, 조이스틱, 물약, 스킬, 공격 버튼을 safe-area 안에 고정했다.
- 닫기 버튼은 `close-crystal-clean-096.webp`를 사용하도록 통일했다.
- 밝은 패널에는 진한 네이비 텍스트, 어두운 필드 HUD에는 흰색/금색 텍스트를 사용하도록 대비를 보강했다.

## 신규 파일

- `src/ui/visualStability096.ts`
- `src/styles/alpha096.css`
- `public/assets/ui/fantasy/096/title-clean-096.webp`
- `public/assets/ui/fantasy/096/town-clean-096.webp`
- `public/assets/ui/fantasy/096/button-blue-096.webp`
- `public/assets/ui/fantasy/096/button-gold-096.webp`
- `public/assets/ui/fantasy/096/panel-surface-096.webp`
- `public/assets/ui/fantasy/096/field-hud-glass-096.webp`
- `public/assets/ui/fantasy/096/close-crystal-clean-096.webp`

## 검증 기준

- `npm run build`가 성공해야 한다.
- 첫 화면은 원화 배경과 하나의 `TOUCH TO START` 버튼만 보여야 한다.
- 마을 배경에 UI 스크린샷이 깔리면 안 된다.
- 마을에서 한 화면 안에 구형 로비가 여러 개 겹쳐 보이면 안 된다.
- 사냥터에서 HUD/퀘스트/미니맵/조작 버튼이 화면 밖으로 나가면 안 된다.
- 설정/계정의 System Doctor에서 `시각 안정화` 항목이 확인 가능해야 한다.

## 남은 기술 부채

- `styles.css`는 여전히 매우 크다. 이번 패치는 실제 화면 복구가 우선이며, 다음 단계에서는 사용하지 않는 0.70~0.95 UI/CSS 제거가 필요하다.
- `main.ts`는 아직 화면 렌더링 책임이 크다. 0.97 이후에는 마을/필드/팝업 렌더러 분리를 더 진행해야 한다.
- 대형 스프라이트 시트는 모바일 첫 로딩 최적화가 더 필요하다.
