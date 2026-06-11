# Soul Online Alpha 0.79 프로젝트 진단

## 확인된 상태

- 프로젝트 버전은 `package.json` 기준 0.78.0이었고 이번 패치에서 0.79.0으로 올렸습니다.
- ZIP은 처음 풀었을 때 `src/`가 없는 것처럼 보였지만 `.git` 히스토리가 포함되어 있어 `HEAD` 기준 소스를 복구할 수 있었습니다.
- 핵심 소스는 `src/main.ts` 약 4천 줄, `src/game/SolGame.ts` 약 4.5천 줄, `src/styles.css` 약 2.18만 줄입니다.
- HTML에는 `title-screen-044`부터 `title-screen-078`, `town-screen-049`부터 `town-screen-078`처럼 이전 패치 클래스가 계속 누적되어 있습니다.
- CSS에는 `!important`가 6천 회 이상 존재합니다. 즉, 현재 UI 문제는 단순 색상 조정이 아니라 누적 오버라이드 경쟁입니다.

## 가장 큰 리스크

1. **UI 레이어 누적**  
   마을 화면에 old topbar/layout, premium lobby, master lobby가 함께 존재하고 CSS로 숨기는 방식입니다. 한 줄만 깨져도 예전 UI가 다시 보이거나 클릭 영역이 겹칠 수 있습니다.

2. **단일 대형 main.ts**  
   로그인, 서버, 캐릭터, 마을, 필드, 시트, 아이템 상세, 계정, 오디오, 라우팅이 한 파일에 섞여 있습니다. 기능 추가가 빨라지는 대신 회귀 버그가 생기기 쉽습니다.

3. **단일 대형 styles.css**  
   과거 버전별 CSS 블록이 계속 누적되어 최신 디자인 의도가 흐려졌습니다. 이번 0.79는 삭제 대신 마지막 오버라이드로 안정화했지만, 다음 단계에서는 정리가 필요합니다.

4. **빌드 검증 조건**  
   업로드된 ZIP에는 `node_modules`가 없어서 이 환경에서는 의존성 타입을 읽지 못했습니다. 로컬에서는 `npm install` 후 `npm run build`로 반드시 확인해야 합니다.

5. **배포 경로 혼재**  
   Firebase Hosting 설정은 `dist`를 바라보고, GitHub Actions는 GitHub Pages 배포 워크플로입니다. 무료 Firebase를 계속 쓸 계획이면 `npm run build` 뒤 Firebase deploy를 기준으로 삼는 편이 명확합니다.

## 이번 0.79 패치가 한 일

- 최신 화면에 `*-079` 클래스를 추가했습니다.
- CSS 마지막에 0.79 전용 모바일 안정화 레이어를 추가했습니다.
- 마을에서는 `town-master-lobby-074`만 실사용 레이어로 고정했습니다.
- 드로어, 시트, 아이템 상세, 필드 HUD, 하단 액션 독의 safe-area와 크기 충돌을 줄였습니다.
- PWA service worker 캐시명을 올려 구버전 캐시 잔존 가능성을 낮췄습니다.
- 캐릭터 생성 기본 세이브의 중복 좌표 필드를 정리했습니다.

## 다음 개발 우선순위

1. **UI 컴포넌트 분리**  
   `src/ui/` 아래에 `renderButton`, `renderPanel`, `renderSlot`, `renderDrawer` 같은 공통 렌더러를 만들고 중복 HTML 문자열을 줄입니다.

2. **마을 UI 단일화**  
   HTML에서 예전 `town-topbar`, `town-layout`, `town-premium-lobby-072` 계층을 제거하고, master lobby와 town drawer만 남기는 대청소가 필요합니다.

3. **CSS 리빌드**  
   최신 UI 기준으로 `base.css`, `title.css`, `login.css`, `town.css`, `field.css`, `sheet.css`로 나누는 것이 좋습니다.

4. **전투 타격감 패스**  
   UI 안정화 후에 히트스톱, 카메라 쉐이크, 피격 플래시, 데미지 숫자 레이어, 스킬별 잔상 효과를 분리 적용합니다.

5. **무료 Firebase 범위 유지**  
   세이브/랭킹 문서 수를 적게 유지하고, 잦은 자동 저장은 로컬 우선 + 클라우드 쓰기 제한 방식으로 계속 가야 합니다.
