# Soul Online alpha 1.04 - UI Quality Audit Pass

## 목표

1. UI를 더 얹는 방식이 아니라, 실제 화면에 보이는 중복 레이어와 대비 문제를 우선 점검한다.
2. 사냥터 HUD의 몬스터 정보, 퀘스트, 조이스틱, 물약, 스킬, 공격/메뉴 버튼을 세로모드 safe-area 안에 고정한다.
3. 밝은 패널은 진한 네이비 글자, 어두운 필드 HUD는 흰색/금색/아쿠아 글자 기준으로 분리한다.
4. 닫기 버튼과 주요 컨트롤에 1.04 전용 에셋을 적용한다.
5. 설정/계정 System Doctor에 `1.04 UI 품질` 진단을 추가한다.

## 변경 파일

- `src/ui/qualityPass104.ts`
- `src/styles/alpha104.css`
- `public/assets/ui/fantasy/104/*`
- `src/main.ts`
- `public/sw.js`
- `public/manifest.webmanifest`
- `index.html`

## QA 기준

- title: 원화 배경 + 단일 `TOUCH TO START` 버튼이 safe-area 안에 표시되어야 한다.
- login: 서버/캐릭터 선택 카드의 글자가 배경과 충돌하지 않아야 한다.
- town: 구형 0.70/0.72/0.74 레이어가 보이면 실패다.
- field: 몬스터 정보, 퀘스트, 미니맵, 조이스틱, 물약, 스킬, 공격 버튼이 화면 밖으로 나가면 실패다.
- common: 닫기 버튼은 1.04 gem 에셋 기반으로 표시되어야 한다.

## 남은 과제

- `styles.css` 본체가 아직 크다. 다음 패치에서는 실제 미사용 CSS 삭제가 필요하다.
- 대형 스프라이트 시트는 아직 2MB 이상 파일이 많다. 저해상도/고해상도 분리 로딩이 필요하다.
