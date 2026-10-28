# 🦊 곰같은여우와 함께하는 오늘의 60초 놀이터

마법정원과 **같은 GitHub 저장소** 안에서 각자 독립된 디렉터리와 공개 주소를 사용하는 경량 미니게임입니다.

- GitHub Pages: https://junl-im.github.io/K-city-webgame/SixtySecondPlayground/
- 마법정원: https://junl-im.github.io/K-city-webgame/
- 공식 브랜드명: **곰같은여우와 함께하는 오늘의 60초 놀이터**
- 메인 페이지의 짧은 제목: **오늘의 60초 놀이터**
- 7종 60초 게임 · 동물 친구 4명 · 모바일 반응형 · 로그인 없는 무료 플레이

## 구조

- `dist/index.html` — 시작 화면 및 7개 게임 선택 화면
- `dist/style.css` — UI/UX, 크기별 버튼 원화, 모바일 레이아웃
- `dist/app.js` — 게임 로직, 일일 도전, 기록
- `dist/assets/*.webp` — 실행에 필요한 압축 일러스트 원화
- `tests/smoke.cjs` — 오프라인 검증 (실행: `node SixtySecondPlayground/tests/smoke.cjs`)

`main` 브랜치의 이 폴더를 변경하면 `.github/workflows/magic-garden-pages.yml`에서 정적 파일을 검사한 뒤 마법정원 빌드 결과의 `SixtySecondPlayground/` 하위 경로에 합쳐 공개합니다. 마법정원 자체 코드는 변경하지 않습니다.

원본 고해상도 편집용 PNG는 기존 제작 프로젝트에 보존하며, 이 GitHub 폴더는 배포에 필요한 최적화 WebP를 관리합니다. 이 폴더와 기존 Sites 버전 사이에는 자동 양방향 동기화가 설정되어 있지 않습니다.

**원칙:** SVG 금지, 무료 운영, 기본 아이콘 대신 일러스트화된 UI, 화면 전체를 누르는 게임 선택, 작은 화면 배려.
