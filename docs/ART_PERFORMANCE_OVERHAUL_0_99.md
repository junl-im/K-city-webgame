# Soul Online alpha 0.99 - 원화풍 디자인/성능 대형 패치

## 목표

0.98의 안정화 레이어는 화면 겹침을 줄였지만 블루/골드 투톤이 강하고, 모바일 저사양 환경에서 필터/블러/대형 이미지 부담이 남아 있었다. 0.99는 아래 방향으로 크게 정리한다.

- 첫 화면/로그인/마을/사냥터 HUD에 더 풍부한 원화풍 팔레트 적용
- 버튼/패널/닫기/필드 HUD 에셋을 0.99 전용으로 보강
- 밝은 배경 UI와 어두운 필드 HUD의 글자 대비 재정리
- 저사양/데이터 절약/저메모리 기기에서 자동 라이트 렌더 모드 적용
- Pixi 필드 렌더 해상도와 텍스처 로딩 동시성을 모바일 기준으로 낮춰 랙 부담 완화

## 추가 에셋

`public/assets/ui/fantasy/099/`

- `title-artgrade-099.webp`
- `title-artgrade-lq-099.webp`
- `town-artgrade-099.webp`
- `town-artgrade-lq-099.webp`
- `panel-parchment-099.webp`
- `field-glass-prism-099.webp`
- `button-azure-099.webp`
- `button-ember-099.webp`
- `button-violet-099.webp`
- `close-gem-099.webp`
- `soul-medallion-099.webp`

## 기술 변경

- `src/styles/alpha099.css` 추가
- `src/ui/visualArtPerf099.ts` 추가
- `src/game/SolGame.ts` 렌더 프로필 0.99 추가
  - 저사양 기기: 낮은 resolution, antialias off, 45 FPS cap
  - 일반 기기: 과한 DPR 사용 제한
  - 텍스처 로딩 병렬 수 감소
- PWA 캐시 `soul-online-alpha-v0-99` 갱신

## 남은 과제

- `styles.css` 본체의 오래된 UI 규칙 삭제
- 마을 렌더러와 필드 HUD 렌더러 파일 분리
- 대형 캐릭터/몬스터 스프라이트 시트의 실제 저해상도 변형 생성
- 전투 타격감 VFX/SFX 별도 최적화
