# Soul Online Alpha 1.23 - 2.5D 고해상도 에셋 복구 패치

## 목적

1.15 이후 Firebase 배포 용량을 줄이기 위해 `public/assets/soulpack-lite` 중심으로 전환했던 캐릭터/몬스터 시트를 다시 기존 `src/assets/2p5d` 고해상도 시트로 복구했습니다.

이번 패치의 기준은 성능 자동 등급이 아니라 **단일 2.5D 표준 비주얼**입니다.

## 핵심 변경

- `src/data/assetManifest.ts`의 캐릭터/몬스터 Sheet 경로를 `soulpack-lite`에서 `src/assets/2p5d` 고해상도 WebP로 복구
- 저화질/고화질 자동 전환은 계속 제거
- Pixi 필드 엔진 진입 전에는 2.5D 시트를 다운로드하지 않도록 기존 lazy field import 구조 유지
- 필드 진입 시 필요한 플레이어 직업/성별 시트와 해당 사냥터 몬스터 시트만 Pixi에서 순차 로드
- System Doctor의 에셋 배포 진단을 “2.5D 고해상도 atlas”로 표시
- 필드 렌더링은 단일 표준 프로필 유지, antialias와 DPR 1.0 기준으로 2.5D 선명도 보정
- PWA 캐시 `soul-online-alpha-v1-23` 갱신

## 주의

고해상도 2.5D 시트는 lite 시트보다 파일 크기가 큽니다. 따라서 사냥터 최초 입장 시 에셋 로딩 시간이 1.22보다 길어질 수 있습니다. 대신 첫 로그인/START 경로는 1.20~1.22 복구 커널을 유지해서 처음 화면이 무거운 시트를 즉시 받지 않도록 했습니다.

## 검증

- `tsc --noEmit` 통과
- `vite build` 통과
- 빌드 후 `dist`에 2.5D 고해상도 sheet asset 포함 확인
