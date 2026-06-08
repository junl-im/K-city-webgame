# Soul Online Runtime Asset Pack 0.19

이 폴더는 빌드 없이 교체 가능한 실제 에셋 슬롯입니다.
GitHub Pages 배포 후에도 같은 경로의 파일만 바꾸면 게임이 우선 로드합니다.
파일이 없거나 손상되면 `src/assets`의 번들 fallback을 사용합니다.

## 캐릭터 시트

경로: `characters/*.png`

- 프레임 크기: 128x192
- 총 크기: 6144x1536
- 방향 행: S, SW, W, NW, N, NE, E, SE
- 모션 열:
  - 0~3 idle
  - 4~11 walk
  - 12~19 run
  - 20~27 attack
  - 28~31 hit
  - 32~39 death
  - 40~47 skill

## 몬스터 시트

경로: `monsters/*.png`

- 프레임 크기: 128x160
- 총 크기: 6144x1280
- 방향/모션 구조는 캐릭터와 동일합니다.

## 타일

경로: `tiles/*.png`

- 프레임 크기: 128x70
- 투명 배경의 아이소메트릭 다이아몬드 타일입니다.
- `tile-grass.png`, `tile-dirt.png`, `tile-moss.png`, `tile-stone.png`, `tile-crystal.png`, `tile-water.png`, `tile-cliff.png`, `tile-portal.png`

## BGM

경로: `audio/*.ogg`

- `title-theme.ogg`
- `town-lumina.ogg`
- `field-forest.ogg`
- `boss-crystal.ogg`

권장: 44.1kHz, stereo, loop 가능한 OGG Vorbis.
