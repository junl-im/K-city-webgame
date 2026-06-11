# Soul Online Alpha 0.95 - Visual Overhaul / Mobile UI Rescue

0.95는 작은 진단 패치가 아니라, 누적된 0.8x~0.94 UI 레이어를 한 번 더 덮는 대형 화면 정상화 패치입니다.

## 목표

- 첫 시작 화면을 원화 배경 + 단일 `TOUCH TO START` 버튼으로 고정합니다.
- 로그인/서버/캐릭터 선택을 하나의 안전한 카드 레이아웃으로 정리합니다.
- 마을은 0.74 마스터 로비 하나만 실제 화면으로 사용하고, 0.70/0.72/구형 레이아웃이 같이 보이지 않게 막습니다.
- 사냥터 HUD, 퀘스트, 미니맵, 조이스틱, 스킬/공격/물약 독이 모바일 화면 밖으로 나가지 않도록 재배치합니다.
- 닫기 버튼에 실제 크리스탈 이미지 에셋을 적용합니다.
- 밝은 UI에는 네이비 텍스트, 어두운 필드 HUD에는 흰색/금색 텍스트를 사용하도록 대비를 보정합니다.

## 추가/변경 파일

- `src/styles/alpha095.css`
- `src/ui/visualOverhaul095.ts`
- `public/assets/ui/fantasy/095/*`
- `docs/VISUAL_OVERHAUL_0_95.md`

## 기술 메모

- 기존 `fantasy-ui-081` ~ `fantasy-ui-094` body 클래스를 런타임에서 제거하고 `fantasy-ui-095`, `visual-overhaul-095`만 남깁니다.
- `title-screen-*`, `login-screen-*`, `town-screen-*`도 최신 `*-095` 클래스로 정리합니다.
- `MutationObserver`와 viewport flags로 화면 전환 후에도 route class를 재동기화합니다.
- 필드 UI는 `route-field-095`일 때만 표시됩니다. 타이틀/로그인/마을에 HUD가 섞이는 문제를 차단합니다.

## 아직 남은 과제

- `styles.css`와 과거 alpha CSS가 여전히 번들에 포함되어 CSS 용량이 큽니다.
- 0.96부터는 실제 구형 CSS 삭제/분리 다이어트가 필요합니다.
- 대형 스프라이트 시트는 여전히 2MB 이상이 많아 첫 전투 진입 최적화가 필요합니다.
