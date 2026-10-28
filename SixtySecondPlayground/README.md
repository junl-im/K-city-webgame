# 🦊 곰같은여우와 함께하는 오늘의 60초 놀이터

**이제 GitHub가 이 게임의 공식 소스·개발·배포 기준입니다.** ChatGPT Sites 배포본은 이전 자료로만 남겨 두며, 새 수정과 버전 배포는 GitHub에서만 진행합니다.

- 공식 GitHub Pages: https://junl-im.github.io/K-city-webgame/SixtySecondPlayground/
- 소스 위치: `K-city-webgame/SixtySecondPlayground/`
- 브랜드: **곰같은여우와 함께하는 오늘의 60초 놀이터**
- 화면 제목: **오늘의 60초 놀이터**
- 7종 60초 게임 · 동물 친구 4명 · 모바일 반응형 · 가입 없는 무료 플레이

## 파일 구성

- `dist/index.html` — 홈 및 7가지 게임 선택 화면
- `dist/style.css` — 원화 기반 UI와 모바일 대응
- `dist/app.js` — 60초 게임, 공식 도전, 브라우저 기록
- `dist/assets/*.webp` — 배포용 경량 일러스트
- `tests/smoke.cjs` — 오프라인 회귀 검사
- `source-assets/*.png` — 편집용 고화질 PNG 원본 21개(약 43.6MB), GitHub 이전 및 해시 검증 완료

## 개발 및 배포

1. 이 폴더에서 실행 파일과 원화를 수정합니다.
2. `node SixtySecondPlayground/tests/smoke.cjs`로 7개 게임과 에셋의 기본 검사를 실행합니다.
3. `main`에 반영하면 저장소 루트의 `.github/workflows/magic-garden-pages.yml`이 마법정원과 이 놀이터를 **서로 다른 경로로** 묶어서 GitHub Pages에 게시합니다.
4. 마법정원 공식 홈은 `/`, 60초 놀이터는 `/SixtySecondPlayground/`입니다. 놀이터 수정 시 마법정원 게임 소스는 건드리지 않습니다.

모든 이미지·CSS·JS는 상대 경로를 사용합니다. 게임 기록은 이용자 브라우저의 localStorage에 남고, 서버 계정이나 별도 API 키는 없습니다.

## 다음 개선 방향

- 실제 게임판의 남은 이모지 요소를 기존 원화 톤의 소품으로 순차 교체
- 7가지 게임의 반복 피로도와 난이도 곡선 조정
- 작은 스마트폰에서 60초 플레이 및 게임 선택 한 화면 검증
- 이미 이전한 고해상도 PNG 원본을 기반으로 게임판 전용 그래픽 추가 제작

**원칙:** SVG 자산 금지 · 원화 기반 시각 디자인 · 전체 게임 카드 클릭 가능 · 모바일 우선 · 무료 플레이.

## 작업 체크포인트와 복구 백업 (2026-10-28)

- [Notion MASTER 개발·동기화 허브](https://app.notion.com/p/407fff243ec98116a720e480a11e5d7d?pvs=204) — 고정 원칙, 마지막 작업, 다음 작업, 검증 이력
- [Google Drive 프로젝트 백업 폴더](https://drive.google.com/drive/folders/1FTqJxJa3FgBL1VfZHFOA6qvAQFGz-h15) — 실행본·원본 PNG·테스트가 들어간 스냅샷
- [2026-10-28 기준 tar 백업](https://drive.google.com/file/d/1cdN-1wENKsUokRh4LsYprACrAL8Dzn-A/view?usp=drivesdk) — `3277f7724acd97d9a33fc3c197b1ff38d48e55e9` 기준, 45,219,840바이트

**GitHub만 공식 수정·배포 기준**으로 사용합니다. Notion과 Drive는 체크포인트·백업이며 GitHub 소스를 자동으로 덮어쓰지 않습니다. **SVG는 파일·코드·인라인·데이터 URI 모두 금지**하고, 필요한 디자인 자산은 PNG/WebP로 제작·보존합니다.
