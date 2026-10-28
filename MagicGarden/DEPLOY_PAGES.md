# 《곰같은여우의 마법정원》 — GitHub Pages 전용 이식

> 2026-10-28. 마법정원 전용 자동 배포. Soul Online 원본은 `archive/soul-online-20261028` 브랜치에 전체 백업했고, `main`은 마법정원 전용으로 정리함. Firebase 원격 데이터는 삭제하지 않음.

## 저장소와 분리 구조

- 저장소: [junl-im/K-city-webgame](https://github.com/junl-im/K-city-webgame)
- 실제 게임 개발 소스: `main` 브랜치 → `MagicGarden/` 폴더
- **사이트 전용 배포 브랜치: `magic-garden-pages`** — 게임의 `dist/` 결과 파일만 수용
- 자동 배포 워크플로: `.github/workflows/magic-garden-pages.yml` (`main` 브랜치에서 자동 실행)
- 운영 사이트 후보: https://junl-im.github.io/K-city-webgame/

GitHub는 한 저장소 안에 또 다른 독립 '저장소'를 중첩해 만들 수 없으므로, 요청한 부모 저장소 안의 **별도 전용 브랜치**로 배포 구조를 격리한다. 이 브랜치(`magic-garden-pages`)를 `main`에 머지하지 않는다. 물리적으로 다른 저장소가 꼭 필요해지는 경우, 새로운 `junl-im/gomfox-magic-garden` 저장소를 GitHub에서 만든 뒤 이 소스를 별도로 이전해야 한다.

## 최초 1회 GitHub Pages 설정 (저장소 관리자)

1. [K-city-webgame → Settings → Pages](https://github.com/junl-im/K-city-webgame/settings/pages) 열기.
2. `Build and deployment`의 `Source`를 `Deploy from a branch`로 선택.
3. `Branch`를 `magic-garden-pages`, `Folder`를 `/(root)`로 선택하고 Save.
4. [마법정원 배포 Actions](https://github.com/junl-im/K-city-webgame/actions/workflows/magic-garden-pages.yml)에서 최근 실행의 성공을 확인하고, 배포 주소를 새로고침.

**중요:** GitHub Pages는 저장소당 기본 사이트가 하나이므로 기존 K-city-webgame Pages에 다른 사이트가 이미 연결되어 있다면 Pages 설정을 무단 교체해서는 안 된다. Soul Online 관련 구 소스는 백업 완료되어 Pages를 새 마법정원 서비스용으로 사용한다.

## 배포 품질 검사

1. `MagicGarden` 폴더만 Node.js 22에서 `npm install && npm run build` 실행.
2. TypeScript, Vite, 방향/카메라/충돌/원화 검사와 SVG 금지 검사 통과 필요.
3. `dist/index.html`, `town-scene-v1.webp`, `creek-shimmer-v1.webp`, `creek-cascade-v1.webp`, `fox-four-directions-v1.webp`가 실제로 있는지 확인.
4. `deployed-source-sha.txt`에 개발 소스 커밋 저장. 사이트와 GitHub가 서로 다른 버전인지 쉽게 확인.
5. `peaceiris/actions-gh-pages`로 **사이트 브랜치에 게임 dist만 게시**, 워크플로 파일/소설/다른 게임 파일 미게시.

### 저장과 브라우저 기기

- `gomfox.magic-garden.prototype.v1` 저장 키/12칸 농사/조합/부화/몬스터 스키마 변경 없음.
- 단, **호스트 도메인이 기존 ChatGPT Sites와 달라지므로 브라우저 localStorage는 자동으로 이전되지 않음**. 기존 사이트의 게임에서 JSON '저장파일 내보내기' → 새 사이트에서 '불러오기'를 사용.
- 게임은 계정·유료 결제·서버 DB 없이 무료 정적 사이트로 운영. Pages는 공개 웹사이트라는 점에 주의.
- 확정한 VISUAL MASTER 3장의 손그림 일러스트 기준, SVG 금지, 우클릭/드래그 제한 유지.

## 배포 실패 시 진단

- `remote: Permission denied`: Actions의 `GITHUB_TOKEN`에 Contents write가 적용되지 않았거나 브랜치 정책으로 푸시 거절. 저장소 Settings → Actions → General → Workflow permissions 확인.
- `404 on site`: Pages 미활성화 또는 Source 브랜치 미선택. 먼저 배포 Actions가 `magic-garden-pages`에 빌드를 올렸는지 확인.
- 디자인 이미지는 보이는데 물이 멈춰 있으면 마을로 이동 후 실제 WebP 요청과 브라우저 개발자 콘솔 확인. `prefers-reduced-motion: reduce`가 활성화되어 있으면 물 애니메이션은 의도적으로 꺼짐.
- 실제 Play/모바일 UI 검수는 별도이며 GitHub CI 통과만으로 완료 판정 금지.
