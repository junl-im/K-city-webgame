# 0.36 UI Polish Pass

0.35에서 응급 복구한 UI 레이어를 기준으로, 그래픽 UI 스킨의 분위기는 유지하면서 실제 플레이 화면의 크기와 간격을 다시 다듬은 패치입니다.

## 목표

- 마을 화면의 인터페이스를 더 작고 정돈된 카드형 배치로 정리
- 하단 메뉴, 더보기 메뉴, 마을 드로어의 기준 높이와 z-index를 통일
- 인벤토리/카드/스킬 슬롯 이미지가 잘리지 않도록 슬롯 규격을 재정의
- 필드 HUD와 도크를 더 컴팩트하게 조정해 전투 화면을 덜 가리게 개선
- 닫힌 패널이 클릭을 가로막지 않도록 visibility와 pointer-events를 보강

## 주요 수정

- `src/styles.css`
  - `Alpha 0.36: UI polish pass` 오버라이드 블록 추가
  - 마을 topbar, hero card, currency, zone card, content card, bottom menu, drawer 크기 재정리
  - slot grid를 auto-fill 기반으로 통일하고 slot cell 최소 크기/이미지 contain 규칙 보강
  - field HUD, resource strip, target card, quest tracker, skill dock, action dock을 compact profile로 조정
  - 작은 화면용 860px / 560px / 430px 반응형 규칙 추가
- `src/main.ts`
  - 마을 더보기 메뉴 바깥 클릭 시 닫기
  - ESC 키로 더보기 메뉴, 마을 드로어, 필드 시트를 순서대로 닫기
  - 마을 드로어 열림/닫힘 상태를 `body.town-drawer-open`으로 동기화
- `index.html`, `package.json`, `public/sw.js`, `asset-pack.json`
  - 버전/캐시를 0.36.0 기준으로 갱신

## 검증

```bash
npm run build
```

성공 확인 완료.
