# Soul Online Alpha 1.29 - 비주얼 보존형 연결성/안정화 패치

## 원칙

1. 그래픽 품질을 낮추지 않는다.
2. 2.5D 고해상도 캐릭터/몬스터/필드 에셋을 유지한다.
3. 렉과 접속 문제는 로딩 순서, 중복 실행, 캐시, DOM 연결성 문제로 해결한다.
4. 구형 lite/quality/atlas 전환 class나 localStorage 플래그가 다시 살아나면 즉시 제거한다.

## 주요 변경

- `src/ui/connectionIntegrity129.ts` 추가
- `src/styles/alpha129.css` 추가
- System Doctor에 `1.29 연결 보존` 항목 추가
- `fieldEngineProfile105`를 표준 2.5D quality 프로필로 고정
- `SolGame.shouldSkipTextureKey107()`의 장식 프롭 스킵을 중단하여 필드 비주얼 누락 방지
- `dependencyAudit128`의 중복 문제 집계 라인을 정리
- `title/login/town/field` route 동기화에 1.29 보정 추가
- 중복 canvas 제거, 필수 DOM 확인, START 상태 확인, 타이틀 키비주얼 확인 유지

## 검증

- `npm ci`
- `npm run build`
- `npm audit --audit-level=high`
- 정적 import/export 경로 검사
- `new URL(..., import.meta.url)` 에셋 경로 검사

## 비고

이번 패치에서는 Firebase 배포 용량을 줄이지 않았습니다. 1.27 타이틀 키비주얼과 1.23 이후 2.5D 고해상도 에셋을 유지합니다.
