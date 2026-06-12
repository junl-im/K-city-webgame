# Soul Online alpha 1.08 - Mobile UI Quality & Performance Pass

## 목표

1. 모바일 세로모드에서 사냥터 HUD가 화면 밖으로 나가지 않도록 재배치한다.
2. 몬스터 정보, 퀘스트 카드, 미니맵, 조이스틱, 스킬/공격 버튼의 위치 우선순위를 정한다.
3. 밝은 UI와 어두운 사냥터 HUD의 글자 색 대비를 다시 분리한다.
4. 누적 구형 마을 레이어가 다시 보이지 않도록 런타임 suppression을 강화한다.
5. 저사양 모바일에서는 blur/filter/shadow/애니메이션 부담을 줄인다.

## 추가 파일

- `src/ui/mobileQuality108.ts`
- `src/styles/alpha108.css`
- `public/assets/ui/fantasy/108/*.webp`

## 주요 변경

- `fantasy-ui-108`, `mobile-quality-108` 런타임 클래스 추가
- `route-title-108`, `route-login-108`, `route-town-108`, `route-field-108` 라우트 클래스 추가
- `lite / balanced / quality` 품질 판정 유지 및 1.08 전용 UI 클래스 반영
- 사냥터 HUD safe-area 재배치
- 닫기 버튼/공격 오브/스킬 오브/조이스틱/몬스터 카드/퀘스트 카드에 1.08 에셋 적용
- System Doctor에 `1.08 모바일 품질` 항목 추가

## QA 기준

- 360px, 390px, 430px 폭에서 몬스터 정보 카드가 화면 밖으로 나가지 않아야 한다.
- 공격 버튼과 스킬 버튼은 오른쪽 하단 safe-area 안에 있어야 한다.
- 조이스틱과 물약 버튼은 겹치지 않아야 한다.
- 마을/타이틀/로그인 화면에서는 사냥터 HUD가 보이지 않아야 한다.
- landscape 상태에서는 orientation guard가 보여야 한다.
- 저사양 모드에서는 blur/filter 부담이 줄어야 한다.
