# 0.33 Field Guide + Infernus Pass

## 목표

0.33은 0.32에서 그래픽 UI를 입힌 뒤 남아 있던 플레이 흐름 문제를 개선하는 패스입니다. 사용자가 마을에서 어떤 사냥터로 가야 하는지 더 쉽게 알 수 있게 하고, 고레벨 사냥터가 서로 비슷해 보이는 문제를 줄였습니다.

## 사냥터 추천 카드

마을 사냥터 패널 상단에 `AUTO GUIDE` 카드를 추가했습니다.

- 현재 진행 중인 스토리 퀘스트를 기준으로 추천 사냥터를 계산합니다.
- 특정 몬스터 처치 퀘스트는 해당 몬스터가 등장하는 해금 사냥터를 우선합니다.
- 특정 사냥터 해금 퀘스트는 해당 지역이 열렸을 때 바로 추천합니다.
- 스토리를 모두 밀었거나 명확한 목표가 없을 때는 현재 레벨과 해금 상태를 기준으로 추천합니다.
- 완료 대기 중인 일일 퀘스트가 있으면 카드에서 알려줍니다.

## Infernus 필드 에셋 적용

PVGames Infernus 무료 에셋 중 런타임에서 안정적으로 사용 가능한 PNG를 선별해 `src/assets/map/infernus`와 `public/assets/soulpack/infernus`에 배치했습니다.

적용 에셋:

- `tile-infernus.png`
- `ground.png`
- `rock-01.png`
- `altar-01.png`
- `brasero.png`
- `hell-rocks-01.png`
- `skull-01.png`
- `burner-column-01.png`
- `column-01.png`
- `pillar-01.png`

적용 지역:

- 잿불 능선
- 잠든 용의 둥지
- 수정 토벌대
- 혈석 광산
- 악마의 균열

## 구현 메모

- `SolGame.textureKeyForTile()`로 지역별 타일 선택을 분리했습니다.
- `SolGame.addInfernusDecorPass()`에서 고위험 사냥터 전용 오브젝트를 배치합니다.
- `SolGame.addInfernusHeatHaze()`에서 붉은 열기와 균열 분위기 레이어를 추가합니다.
- `renderHuntRecommendation()`에서 사냥터 패널 상단 추천 UI를 렌더링합니다.
- `asset-pack.json`에 Infernus 런타임 에셋 메타데이터를 추가했습니다.

## 검증

```bash
npm run build
```

TypeScript 컴파일과 Vite 프로덕션 빌드를 통과해야 합니다.
