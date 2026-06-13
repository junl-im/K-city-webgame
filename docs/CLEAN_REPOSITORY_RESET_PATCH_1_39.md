# Soul Online 1.39 Clean Repository Reset

이번 패치는 GitHub Actions 중복 실행과 `deploy.yml` 잔존 문제를 끊기 위한 클린 전체본이다.

## 핵심 원칙

- 그래픽 품질은 낮추지 않는다.
- 1.27 타이틀 키비주얼을 유지한다.
- 1.35/1.36 레퍼런스 UI 에셋을 유지한다.
- 2.5D 고해상도 캐릭터/몬스터 에셋을 유지한다.
- Firebase 무료 플랜 기준으로 GitHub Actions 자동 실행은 하나만 유지한다.

## Actions 정리

`.github/workflows` 안에는 `build.yml` 하나만 남긴다.

삭제 대상 예시:

- `deploy.yml`
- `pages.yml`
- `firebase-hosting-merge.yml`
- `firebase-hosting-pull-request.yml`
- 기타 push/pull_request 자동 실행 workflow

1.39의 `verifyProjectIntegrity`는 `build.yml` 외 workflow가 있으면 실패한다. 이것은 의도된 안전장치다.

## GitHub Node 20 경고 대응

- `actions/checkout@v6` 사용
- `actions/setup-node@v5` 사용
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` 설정
- 앱 빌드 Node 버전은 `.nvmrc`의 `22.16.0` 유지

## 교체 방법

가장 안전한 방식은 GitHub Desktop에서 기존 프로젝트 폴더 내용을 통째로 비우고, 1.39 전체 덮어쓰기 ZIP 내용을 넣는 것이다.

단, `.git` 폴더는 삭제하지 않는다.

1. 기존 프로젝트 폴더 열기
2. `.git` 폴더만 남기고 모든 파일/폴더 삭제
3. `SoulOnline-alpha139-full-overwrite.zip` 압축 해제 내용 전체 복사
4. GitHub Desktop에서 변경사항 확인
5. commit & push

이 방식으로 `deploy.yml` 잔존 문제를 제거한다.
