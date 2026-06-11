# Soul Online Alpha 0.84 덮어쓰기 패치

게임명과 사용자 노출 브랜드는 **Soul Online / 소울 온라인** 기준입니다.

## 적용 순서

1. GitHub Desktop에서 현재 상태를 먼저 커밋합니다.
2. 이 ZIP의 내용을 프로젝트 루트에 그대로 덮어씁니다.
3. `npm install`
4. `npm run build`
5. Firebase 배포 시 `firebase deploy --only hosting`

## 0.84 핵심

- 프로젝트 버전을 `0.84.0`으로 갱신했습니다.
- PWA 캐시를 `soul-online-alpha-v0-84`로 갱신했습니다.
- 0.83 UI 키트 위에 `fantasy-ui-084` 안정화 레이어를 추가했습니다.
- 마을/필드/팝업 주요 UI에 실시간 overflow safety audit을 추가했습니다.
- 설정/계정 화면에 기술 상태 패널을 추가했습니다.
  - FPS 상태
  - Firebase/로컬 저장 상태
  - UI 화면 이탈 감지
  - 가방 압박도
  - 런타임 오류 로그
- 이전 마을 UI 레이어가 다시 화면/클릭 영역을 방해하지 않도록 숨김/차단을 강화했습니다.
- 작은 화면과 낮은 화면 높이에서 지갑, 드로어, 하단 HUD가 화면 밖으로 나가지 않도록 보정했습니다.

## 확인 완료

- `npm run build` 통과
- TypeScript 검사 통과
- Vite 빌드 통과
- ZIP 무결성 검사 통과

0.84는 겉모습보다 안정성/연결성/성능 상태를 확인하기 위한 기술 점검 패치입니다. 다음 단계는 CSS와 `main.ts`를 기능 단위로 분리해 장기 개발 속도를 회복하는 구조 정리 패치가 필요합니다.
