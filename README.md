# 소울 온라인 Alpha 0.19 Real Asset Pipeline

모바일 세로형 2.5D 웹 MMORPG 프로토타입입니다. 0.19에서는 이제부터 실제 상용급 에셋을 꽂아 넣을 수 있도록 `public/assets/soulpack` 런타임 에셋 팩 구조를 추가했습니다.

## 실행

```bash
npm ci
npm run dev
```

## 빌드

```bash
npm run build
```

## 0.19 변경점

- 실제 에셋 교체용 런타임 팩 추가
  - `public/assets/soulpack/characters`
  - `public/assets/soulpack/monsters`
  - `public/assets/soulpack/tiles`
  - `public/assets/soulpack/props`
  - `public/assets/soulpack/audio`
- 게임 로더 변경
  - 런타임 에셋을 먼저 로드
  - 실패하면 기존 번들 fallback 에셋으로 자동 복구
- 파일 기반 BGM 로더 추가
  - `title-theme.ogg`
  - `town-lumina.ogg`
  - `field-forest.ogg`
  - `boss-crystal.ogg`
- Web Audio 기계음 BGM은 fallback으로만 사용
- PNG 아이소메트릭 타일 샘플 팩 추가
  - 잔디, 흙길, 수정 이끼, 석재, 흑수정, 물, 절벽, 포탈
- PNG 프랍 샘플 추가
  - 나무, 수정, 바위, 폐허
- 에셋 팩 규격 문서 추가
  - `public/assets/soulpack/README.md`
  - `public/assets/soulpack/asset-pack.json`
  - `docs/REAL_ASSET_PIPELINE_0_19.md`

## 에셋 교체 방식

같은 파일명으로 `public/assets/soulpack` 안의 파일을 교체하면 됩니다.
코드 수정 없이 다음 실행/배포부터 새 에셋을 우선 로드합니다.

예시:

```txt
public/assets/soulpack/characters/hero-warrior-male-sheet.png
public/assets/soulpack/monsters/monster-wolf-sheet.png
public/assets/soulpack/tiles/tile-grass.png
public/assets/soulpack/audio/town-lumina.ogg
```

## 버전

- 앱 버전: `0.19.0`
- `SAVE_VERSION = 15`
- PWA 캐시: `soul-online-alpha-v0-19`

## 주의

현재 캐릭터/몬스터 시트는 아직 샘플입니다. 리니지/MIR/오딘/나이트크로우급 비주얼은 원화 기반 2.5D 프리렌더 시트가 실제로 필요합니다. 0.19는 그 에셋을 바로 꽂을 수 있는 첫 번째 실전 구조입니다.
