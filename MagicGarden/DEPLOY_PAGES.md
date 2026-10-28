# 《곰같은여우의 마법정원》 — GitHub Pages 실제 사이트 배포

> 마지막 구조 변경: 2026-10-28. **GitHub에 파일 게시 성공**과 **GitHub Pages 웹사이트 배포 성공**은 다르다. 실제 성공은 `actions/deploy-pages@v4`의 성공과 사이트 접속 확인으로만 판정한다.

## 최초 1회 — 관리자 설정

1. [K-city-webgame → Settings → Pages](https://github.com/junl-im/K-city-webgame/settings/pages) 방문.
2. **Build and deployment → Source → GitHub Actions** 선택. **Deploy from a branch를 선택하지 않는다.**
3. 저장소가 공개 상태인지 확인한다. 현재 GitHub 커넥터에서 `visibility: public` 확인.
4. [마법정원 실제 Pages 배포 워크플로](https://github.com/junl-im/K-city-webgame/actions/workflows/magic-garden-pages.yml)에서 `Run workflow` 실행(Branch: `main`). 또는 `main/MagicGarden/` 수정으로 자동 실행.
5. 실행의 **Publish actual GitHub Pages website** 작업이 성공했을 때 사이트 주소를 열어 확인한다.

예상 주소: https://junl-im.github.io/K-city-webgame/

**주의:** 이 대화의 GitHub 도구에는 Pages 사이트 설정 변경 기능이 없다. 따라서 관리자 UI에서 위 설정을 선택하기 전에는 접속 성공으로 주장하지 않는다.

## 실제 배포 방식

- 게임 공식 소스: [`main/MagicGarden/`](https://github.com/junl-im/K-city-webgame/tree/main/MagicGarden).
- 워크플로: [`.github/workflows/magic-garden-pages.yml`](https://github.com/junl-im/K-city-webgame/blob/main/.github/workflows/magic-garden-pages.yml).
- 절차: Node.js 22 → 이미지/방향/충돌/저장 관련 검사 + TypeScript/Vite 빌드 → `dist/` WebP/물결 자산 검증 → `actions/upload-pages-artifact@v4` → `actions/configure-pages@v5` → `actions/deploy-pages@v4`.
- 배포용 Actions 아티팩트는 필수이므로 **1일 보관 후 자동 만료**. 일반 빌드 아티팩트는 만들지 않음.
- `dist/deployed-source-sha.txt`에 원본 `main` SHA 포함.
- 기존 `magic-garden-pages` 브랜치는 **과거 빌드 결과 스냅샷/복구용**으로 남기며, 이제 실제 사이트 자동 게시 대상이 아니다. 이 브랜치의 성공 상태를 웹사이트 게시 성공으로 해석하지 않는다.
- `archive/soul-online-20261028`는 기존 Soul Online의 전체 백업으로 보존. Firebase 원격 데이터는 변경하지 않는다.

## 화면이나 원화가 보이지 않을 때

- **404 / 사이트가 전혀 열리지 않음:** Pages Source를 `GitHub Actions`로 설정하지 않았거나 `deploy` 작업이 성공하지 않은 상태. Publish job 로그 확인.
- **문서는 뜨나 이미지/동작이 깨짐:** 브라우저 개발자 콘솔의 경로/404를 확인하고 `vite.config.ts`의 `base: './'` 유지 여부 확인.
- **계곡 물이 안 움직임:** 마을 → 오른쪽 아래 `계곡 산책`, 도움말의 계곡 상태 확인. OS에서 움직임 줄이기를 켰다면 정지하도록 설계됨.
- **다른 도메인으로 진행내용을 옮김:** 브라우저 localStorage는 도메인을 공유하지 않으므로 기존 게임에서 JSON 저장파일 내보내기 → 신규 사이트에서 불러오기.

실제 브라우저 Chrome/Whale/Android/iOS 접속과 그림 정렬 QA는 별도로 확인해야 한다.
