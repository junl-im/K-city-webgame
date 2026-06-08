# Soul Online 0.16 Real Asset Pass

0.16부터 코드는 실제 2.5D 프리렌더 에셋으로 교체하기 쉬운 구조를 목표로 유지한다.
현재 포함된 SVG/절차형 그래픽은 임시 고급 목업이며, 상용 웹게임급 품질을 내려면 아래 자산을 같은 이름 또는 `assetManifest.ts` 경로 수정 방식으로 교체한다.

## 권장 필드 자산

- `tile-grass.webp` 512x256 isometric diamond, seamless variant 3종
- `tile-dirt.webp` 512x256, 흙길 중앙/좌우 경계/잔디 전환 5종
- `tile-stone.webp` 512x256, 폐허 균열/계단/광장 4종
- `tile-crystal.webp` 512x256, 흑수정/푸른 광맥/보스 제단 4종
- `tile-water.webp` 512x256, 반사 포함 3프레임 애니메이션
- `tile-cliff.webp` 512x320, 상단/벽면/그림자 분리

## 권장 캐릭터 자산

직업별 8방향 또는 최소 4방향 스프라이트 시트를 권장한다.

- idle: 6프레임
- walk: 8프레임
- attack_01: 8프레임
- skill_01~03: 10~14프레임
- hit: 4프레임
- death: 8프레임

현재 코드의 유닛 스케일은 0.16 기준으로 작게 잡혀 있으므로, 원본은 384~512px 높이로 제작하고 게임 내에서 축소 렌더링하는 방식이 좋다.

## 권장 몬스터 자산

- 슬라임: 256px 높이
- 늑대/고블린: 320px 높이
- 흑수정 곰: 420px 높이
- 드래곤: 640px 높이

## BGM 교체

현재 BGM은 저작권 없는 Web Audio 절차형 임시 MR이다. 실제 음원을 넣을 경우 `AudioService`에 HTMLAudioElement 기반 레이어를 추가하고, 아래 파일명을 권장한다.

- `public/audio/title-theme.ogg`
- `public/audio/town-lumina.ogg`
- `public/audio/field-forest.ogg`
- `public/audio/boss-crystal.ogg`

루프용 OGG 44.1kHz, -14 LUFS 근처, 60~90초 seamless loop 권장.
