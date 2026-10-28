# 🦊 곰같은여우의 마법정원

**이 저장소의 기본 프로젝트는 이제 《곰같은여우의 마법정원》입니다.**

2026-10-28 Soul Online 원본을 먼저 `archive/soul-online-20261028` 브랜치에 전체 백업한 뒤, 이전 게임 소스·빌드 파일·Firebase 설정·Soul Online 전용 자동화 파일을 `main` 작업 트리에서 정리했습니다.

## 현재 구조

| 브랜치 | 용도 |
|---|---|
| [`main`](https://github.com/junl-im/K-city-webgame/tree/main) | **마법정원 공식 소스**: [MagicGarden/](./MagicGarden), 원화, 테스트, Pages 자동 배포 |
| [`magic-garden-pages`](https://github.com/junl-im/K-city-webgame/tree/magic-garden-pages) | GitHub Pages 서비스용 **빌드 결과물** — 직접 수정하지 않음 |
| [`archive/soul-online-20261028`](https://github.com/junl-im/K-city-webgame/tree/archive/soul-online-20261028) | 2026-10-28 정리 전의 **Soul Online 전체 백업** (원본 SHA `3648a6854ebd972a6c3094aa67bf40b7b6f9753b`) |
| [`planning/magic-garden-20261027`](https://github.com/junl-im/K-city-webgame/tree/planning/magic-garden-20261027) | 마법정원 기존 개발 이력/전환 전 스냅샷 |

## 게임 확인

- 공식 게임 소스: [MagicGarden/](./MagicGarden)
- 비주얼 기준: [VISUAL_MASTER.md](./MagicGarden/VISUAL_MASTER.md)
- [실제 GitHub Pages 배포 안내](./MagicGarden/DEPLOY_PAGES.md)
- 예상 접속 주소: https://junl-im.github.io/K-city-webgame/

**실제 사이트 배포에는 저장소 관리자가 Pages의 Source를 `GitHub Actions`로 설정해야 한다.**  
파일을 `magic-garden-pages` 브랜치에 올린 것만으로 GitHub Pages가 열리지 않는 문제가 확인되어, `main` 자동화는 공식 `actions/deploy-pages` 방식으로 교체했다. 이전 브랜치는 보관 스냅샷이며 자동 사이트 게시를 수행하지 않는다.

## 보존한 원칙

- 전체 게임 무료 운영 및 모바일 최적화.
- 확정된 손그림 동화풍 WebP/PNG 원화, SVG 금지.
- 기존 12칸 텃밭·조합·부화·몬스터·JSON 백업 규칙.
- **Firebase 프로젝트/원격 Hosting 데이터를 삭제한 것은 아닙니다.** 이 GitHub `main` 트리에서 Soul Online 관련 설정·소스만 정리했습니다.
- Git 이력 자체의 전체 용량이 바로 줄어들지는 않습니다. 원본은 백업 브랜치에 남아 있으므로 복구 가능합니다.

## 함께 운영하는 오늘의 60초 놀이터

마법정원과 섞이지 않도록 [SixtySecondPlayground/](./SixtySecondPlayground/)에 독립 보관합니다.

- [마법정원](https://junl-im.github.io/K-city-webgame/) — 기존 기본 주소 유지
- [오늘의 60초 놀이터](https://junl-im.github.io/K-city-webgame/SixtySecondPlayground/) — 7개 반짝 미니게임
- `main`의 각 프로젝트를 따로 관리하고, 기존 공식 GitHub Pages 워크플로가 두 게임을 하나의 사이트에 서로 다른 경로로 게시합니다.
