# Soul Online Alpha 1.32 - npm ci / GitHub Actions 복구 패치

## 목적

이번 패치는 게임 그래픽이나 2.5D 에셋을 낮추지 않고, GitHub Actions의 `npm ci` 단계에서 발생한 설치 실패를 복구하기 위한 패치다.

## 확인된 문제

`package-lock.json`의 `resolved` 주소가 외부 GitHub Actions에서 접근할 수 없는 내부 샌드박스 registry 주소로 기록되어 있었다.

예시:

```text
packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public
```

이 주소는 이 작업 환경 안에서는 동작할 수 있지만, GitHub Actions runner에서는 접근할 수 없다. 그 결과 `npm ci`가 의존성을 가져오지 못하고, npm 자체 오류처럼 `Exit handler never called!`로 종료될 수 있다.

## 수정 내용

- `package-lock.json`의 모든 내부 registry URL을 `https://registry.npmjs.org/`로 복구.
- `.npmrc` 추가.
- Node 버전을 `.nvmrc`에서 `22.16.0`으로 고정.
- GitHub Actions용 `.github/workflows/build.yml` 추가.
- GitHub Pages 배포를 쓰는 경우를 위한 `.github/workflows/pages.yml` 추가.
- PWA 캐시 버전 `soul-online-alpha-v1-32`로 갱신.

## 유지 사항

- 1.27 타이틀 키비주얼 유지.
- 2.5D 고해상도 캐릭터/몬스터 에셋 유지.
- lite atlas 전환 없음.
- 그래픽 품질 저하 없음.

## 적용 주의

기존 GitHub Actions workflow 파일이 따로 있다면, 기존 파일의 `Install dependencies` 단계도 다음처럼 바꿔야 한다.

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22.16.0'
    cache: 'npm'
    cache-dependency-path: package-lock.json

- name: Install dependencies
  run: npm ci --no-audit --no-fund --prefer-online
```

기존 workflow가 남아 있으면 새 workflow가 성공해도 기존 workflow가 계속 실패할 수 있다.
