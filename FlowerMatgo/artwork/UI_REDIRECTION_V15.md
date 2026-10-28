# 꽃맞고 라니팡풍 디자인 갱신 방향

- 전통 화투패 48장 원판은 변경하지 않는다.
- 신규 시작 배경과 일러스트 버튼 자산을 사용한다.
- 곰·여우·고양이 한복 캐릭터는 기존 PNG를 재사용한다.
- 게임 보드 중앙은 카드 가독성을 최우선으로 유지한다.
- 모바일 세로 뷰포트에서 잘림이 없어야 한다.

## v15 연결된 원화

- 시작 및 상대 선택 배경: `public/assets/flower-playful-home-v15.webp` (원화 `artwork/concepts/flower-playful-home-v15.png`)
- 입체 초록 시작 버튼: `public/assets/flower-jewel-button-v15.webp` (원화 `artwork/concepts/flower-jewel-button-v15.png`)
- 기존 캐릭터 고정: `public/assets/mascots.png`
- 기존 화투패 고정: `public/assets/hwatu-strict90-labeled-atlas-v3.webp`

## 사용자 경험

- 첫 화면의 시선을 꽃맞고 큰 글자 → 캐릭터 → 전용 게임 시작 버튼 순서로 정리.
- 도움말과 도감은 별도 작은 버튼으로 분리.
- 상대 선택은 크림색 게임 메뉴 판에 색상별 캐릭터 카드와 점당 놀이머니 버튼을 배치.
- 플레이 화면은 기존 카드 좌표와 기능을 유지하며 HUD·패 수집 바·행동 버튼의 색감을 정돈.
- 중소형 화면용 규칙은 650px, 높이 710px, 530px 분기에 나누어 장식을 압축.
- SV​G 없이 PNG/WebP 래스터 원화로 구현.
