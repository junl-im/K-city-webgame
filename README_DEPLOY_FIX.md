# GitHub Pages 빈 화면 수정 안내

현재 배포 URL이 `https://junl-im.github.io/K-city-webgame/` 이므로 Vite는 반드시 GitHub Pages용 build 과정을 거쳐야 합니다.

## 가장 쉬운 해결

1. 이 프로젝트 전체를 GitHub Desktop에서 기존 `K-city-webgame` 저장소에 덮어씁니다.
2. GitHub Desktop에서 Commit 후 Push 합니다.
3. GitHub 저장소 페이지로 이동합니다.
4. `Settings` → `Pages`로 갑니다.
5. `Build and deployment`의 Source를 `GitHub Actions`로 바꿉니다.
6. Actions 탭에서 `Deploy K-City Webgame to GitHub Pages`가 성공할 때까지 확인합니다.
7. `https://junl-im.github.io/K-city-webgame/` 접속 후 강력 새로고침합니다.

## 로컬에서 먼저 확인

```bash
npm install
npm run dev
```

GitHub Pages 빌드 확인:

```bash
npm run build:github
npm run preview
```

## 왜 빈 화면이 났나?

Vite 소스 파일을 그대로 GitHub Pages에 올리면 `/src/main.js`가 사이트 루트 기준으로 요청됩니다. 현재 사이트는 `/K-city-webgame/` 하위 경로라서 경로가 깨질 수 있습니다. 또한 `import "firebase/app"` 같은 npm 패키지 import는 빌드 없이 브라우저에서 직접 처리되지 않습니다.

그래서 `.github/workflows/deploy.yml`이 `npm run build:github`를 실행하고, 생성된 `dist` 폴더만 Pages에 배포하도록 수정했습니다.
