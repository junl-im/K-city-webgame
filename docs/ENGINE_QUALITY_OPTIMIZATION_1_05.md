# Soul Online alpha 1.05 엔진/품질 최적화

## 목표

1. 모바일 세로모드 전용 흐름 유지
2. 사냥터 HUD와 조작 버튼이 화면 밖으로 나가지 않도록 재배치
3. 원화풍 UI 색감을 단순 투톤에서 파치먼트/아쿠아/바이올렛/로즈/골드 혼합 팔레트로 확장
4. PixiJS 8 필드 렌더링 비용을 기기 성능별로 줄임
5. UI 품질 검사와 성능 진단을 System Doctor에 연결

## 주요 변경

- `src/ui/engineQuality105.ts`
  - 기기 메모리, CPU 코어, 네트워크, 화면 크기, 데이터 절약 모드 기반으로 `lite / balanced / quality` 결정
  - route별 body class 동기화
  - 이미지 `lazy / async / fetchpriority` 정책 보강
  - UI overflow 검사 추가
  - System Doctor용 1.05 엔진 QA 리포트 제공

- `src/game/fieldEngineProfile105.ts`
  - PixiJS canvas resolution, FPS, texture concurrency, sort/emit/fx budget를 기기 성능별로 계산
  - 기존 1.01보다 저사양 기기에서 더 공격적으로 렌더 예산 감소

- `src/game/SolGame.ts`
  - 1.05 프로파일을 렌더 초기화, 텍스처 병렬 로딩, 정렬/스냅샷 emit, FX 생성량, 데미지 텍스트 크기에 연결

- `src/styles/alpha105.css`
  - 사냥터 HUD portrait layout 재배치
  - 몬스터 카드/퀘스트/미니맵/조이스틱/스킬/공격 버튼 safe-area 보정
  - 밝은 패널과 어두운 HUD의 글자 대비 분리
  - 단순 블루/골드 투톤 완화

- `public/assets/ui/fantasy/105/`
  - 1.05 전용 패널, 버튼, 공격 오브, 스킬 오브, 닫기 보석, HP/MP/EXP 바 에셋 추가

## 검증

- TypeScript 검사 통과
- Vite 빌드 통과
- ZIP 무결성 검사 통과

## 남은 과제

- 2MB 이상 대형 캐릭터/몬스터 스프라이트 시트를 저해상도/고해상도 2벌로 분리해야 실제 로딩/랙 개선 폭이 더 커진다.
- `styles.css` 본체가 아직 커서 1.06 이후에는 구형 CSS 삭제/분리가 필요하다.
