# Soul Online Runtime Asset Pack 0.25

이 폴더는 게임 코드 수정 없이 교체 가능한 런타임 에셋팩입니다.

## 0.25 기준

- 이미지 기본 포맷: WebP
- 배경음악: OGG
- 효과음: WAV
- 캐릭터/몬스터 시트는 기존 8방향, 48컬럼 규격 유지
- PNG/JPG 원본은 외부 제작 파일로 보관하고, 게임에 넣을 때는 WebP로 변환하는 것을 권장

## 주요 경로

- `characters/` 캐릭터 스프라이트 시트
- `monsters/` 몬스터 스프라이트 시트
- `tiles/` 필드 바닥 타일
- `props/` 필드 오브젝트
- `buildings/` 마을 건물
- `ui/` 타이틀, 초상, 아이콘
- `cards/`, `souls/`, `weapons/` 수집/장비 이미지
- `audio/`, `sfx/` 사운드 리소스

같은 파일명으로 더 좋은 원본을 교체하면 런타임에서 우선 로드하고, 실패 시 번들 fallback 리소스를 사용합니다.
