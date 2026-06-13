# Soul Online Alpha 1.38 - Runtime Sanity Audit Patch

## 목적

1.37 기준에서 남을 수 있는 첫 로그인 진입 실패, 인앱 브라우저 회전, 중복 canvas, 중복 workflow 잔존 문제를 추가 점검하고 보완한다.

## 원칙

- 그래픽 품질 저하 없음
- 1.27 타이틀 키비주얼 유지
- 1.35/1.36 레퍼런스 UI 유지
- 2.5D 고해상도 에셋 유지
- lite/저화질 전환 없음
- Firebase 무료 플랜 대응 유지

## 핵심 변경

- `src/core/RuntimeSanity138.ts` 추가
- `src/styles/alpha138.css` 추가
- 카카오톡/인앱 브라우저에서 CSS-only 세로 프레임을 한 단계 더 강하게 고정
- 인앱 환경에서는 fullscreen API를 조용히 무력화
- START/Login/Town/Field route를 1.38 단일 route 클래스로 최종 정리
- START/Login 버튼 disabled 고착 복구 watchdog 추가
- 중복 Pixi canvas는 최신 canvas 하나만 유지
- GitHub Actions 자동 workflow 정리 검증 강화

## 확인한 사항

- npm ci 통과
- npm run build 통과
- TypeScript 통과
- Vite build 통과
- package-lock 내부 사설 registry 오염 없음
- 자동 push workflow는 build.yml 하나만 허용

## 주의

소스 패치 ZIP만 덮어쓸 경우 기존 repo에 남아 있던 알 수 없는 workflow 파일은 삭제되지 않는다. `.github/workflows/`에 자동 실행 yml이 더 있으면 직접 삭제하거나 수동 실행 전용으로 바꿔야 한다.
