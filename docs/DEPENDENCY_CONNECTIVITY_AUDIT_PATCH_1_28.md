# Soul Online Alpha 1.28 - 연결성/의존성 점검 패치

## 패치 목적

1.27에서 복구한 시작 화면과 2.5D 고해상도 에셋 품질은 유지한다. 이번 1.28은 그래픽을 낮추지 않고, 프로젝트 연결성·의존성·초기화 순서·서비스워커 캐시·장면 라우팅을 함께 점검하고 보강하는 패치다.

## 확인한 항목

- `npm ci` 실행 가능 여부
- `npm audit --audit-level=high` 결과
- TypeScript import/export 정합성
- `new URL(..., import.meta.url)` 에셋 경로 존재 여부
- 동적 import 경로 존재 여부
- `index.html` 중복 id 여부
- `title / login / town / field` 장면 표시 연결성
- Pixi canvas 중복 mount 위험
- 2.5D 텍스처 캐시 상태 연결
- 서비스워커 캐시 버전 충돌 가능성

## 실제 조치

- Vite dev dependency를 `^8.0.16`으로 갱신했다.
- `npm audit` 기준 high 이상 취약점 0개 상태로 정리했다.
- `src/ui/dependencyAudit128.ts`를 추가해 런타임 연결성 점검을 System Doctor에 연결했다.
- `src/styles/alpha128.css`를 추가해 구형 lite/회전/펫/고스트 레이어가 다시 붙어도 화면을 덮지 않게 했다.
- `main.ts`에 1.28 연결성 점검 커널을 연결했다.
- `public/sw.js` 캐시를 `soul-online-alpha-v1-28`로 갱신했다.

## 비주얼 정책

- 2.5D 고해상도 에셋 유지
- 원화풍 타이틀 키비주얼 유지
- 저화질/lite atlas 자동 전환 비활성 유지
- 그래픽 품질을 낮추는 방식의 경량화는 하지 않음

## 빌드 검증

- `npm run build` 통과
- `tsc --noEmit` 통과
- `vite build` 통과
- 정적 import/asset 경로 검사 결과 missing 0
- `index.html` 중복 id 0
- `npm audit --audit-level=high` 결과 0 vulnerabilities
