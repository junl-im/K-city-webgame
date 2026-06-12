# Soul Online Alpha 1.19 긴급 부팅 복구 패치

## 목적
사이트가 열리지 않거나 첫 시작 버튼이 늦게 살아나는 문제를 우선 해결한다. 1.19는 UI 미세 조정보다 부팅 안정성을 최우선으로 두며, 무거운 보정 레이어를 첫 화면 이후로 지연한다.

## 핵심 변경
- 첫 화면에 필요한 최소 CSS만 즉시 로드한다.
- 기존 800KB 이상 메인 CSS는 START 버튼과 로컬 세이브 준비 이후 동적 로드한다.
- PixiJS/필드 엔진 modulepreload를 끄고 사냥터 입장 시점에 로드한다.
- Firebase SDK를 정적 import에서 동적 import로 변경한다.
- Firebase Auth 상태 확인이 지연되면 로컬 저장 모드로 먼저 부팅한다.
- 오래된 PWA 캐시가 JS/CSS를 붙잡지 않도록 서비스워커를 network-first/no-store 정책으로 교체한다.
- 기존 0.93~1.18 visual install/sync 호출을 idle batch로 분산한다.
- 첫 START 버튼 바인딩을 무거운 보정 모듈보다 먼저 실행한다.

## 기대 효과
- 초기 CSS 차단: 약 860KB → 약 4KB 수준으로 감소
- 초기 modulepreload: Pixi/field preload 제거
- Firebase SDK: 초기 평가 경로에서 제외
- START 버튼: boot 초반 즉시 바인딩
- 구형 캐시: 1.19 서비스워커 활성화 시 1.18 이하 캐시 삭제

## 주의
브라우저에 1.18 이하 서비스워커가 강하게 남아 있는 경우 첫 1회 새로고침이 필요할 수 있다. 1.19가 한 번 로드되면 이후부터 새 network-first 정책이 적용된다.
