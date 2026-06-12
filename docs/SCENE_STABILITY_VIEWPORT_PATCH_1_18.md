# Soul Online Alpha 1.18 - Scene Stability & Fixed Frame Patch

## 배경
1.17에서 저화질/고화질 분기를 단일 표준 모드로 정리했지만, 오래된 화면 보정 모듈이 장면 전환 시점에 다시 class를 붙이거나, 타이틀/마을/필드 레이어가 짧게 겹쳐 보일 가능성이 남아 있었습니다.

## 핵심 변경

### 1. sceneStability118 추가
`src/ui/sceneStability118.ts`는 현재 route를 `title / login / town / field`로 판단하고, 현재 장면이 아닌 화면을 `data-scene-hidden118`로 숨깁니다. 이를 통해 화면 전환 순간에 다른 이미지가 잠깐 나타나는 현상을 줄입니다.

### 2. 실행 크기 프레임 보강
1.17의 locked viewport 값을 유지하면서 `#app`을 현재 브라우저 창 중앙에 고정합니다. 브라우저 주소창 접힘, 회전 이벤트, visualViewport resize가 들어와도 게임의 논리 크기는 다시 계산하지 않습니다.

### 3. 단일 표준 모드 재고정
구형 `lite / quality / atlas` class가 후속 모듈에서 다시 붙어도 1.18 sync 단계에서 제거합니다. System Doctor의 화면 모드도 단일 표준 기준으로 유지합니다.

### 4. 사냥터 컨트롤 충돌 자동 보정
조이스틱, 포션, 액션 버튼, 스킬 버튼, 마을 버튼, HUD, 퀘스트/타깃 카드의 겹침을 검사하고 충돌이 감지되면 `control-collision-118`, `control-short-118`, `control-narrow-118` class를 적용합니다. `alpha118.css`가 이 class를 기준으로 버튼 위치를 보정합니다.

## 수정 파일
- `src/ui/sceneStability118.ts`
- `src/styles/alpha118.css`
- `src/main.ts`
- `src/game/SolGame.ts`
- `src/ui/fieldLayout116.ts`
- `src/ui/singleVisualMode117.ts`
- `index.html`
- `public/sw.js`
- `package.json`
- `package-lock.json`

## 검증
- `npm run build` 통과
- PWA cache: `soul-online-alpha-v1-18`
- package: `1.18.0`
