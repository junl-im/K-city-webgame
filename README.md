# K-시티 방범대

Firebase Auth와 Firestore를 붙인 한국형 도시 방범 웹게임 프로토타입입니다. GitHub Pages에 그대로 올릴 수 있도록 별도 빌드 없이 `index.html`, `styles.css`, `game.js`로 구성했습니다.

## 현재 포함된 기능

- 마을 지도와 건물 업그레이드
- 자동 생산, 오프라인 보상
- 알바천국 인재 모집
- 직원 편성, 훈련, 전투력 계산
- 사냥터 출동과 캔버스 전투 연출
- 보관함, 장비 드랍, 임무 보상
- Firebase 이메일/Google 로그인
- Firestore 개인 저장과 랭킹 저장
- Firebase 연결 실패 시 로컬 저장 모드

## 로컬 실행

정적 파일이라 서버 없이도 구조는 볼 수 있지만, Firebase Auth와 모듈 import는 로컬 서버로 보는 편이 안정적입니다.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

브라우저에서 엽니다.

```text
http://127.0.0.1:8765
```

## Firebase 콘솔 설정

1. Authentication에서 로그인 제공업체를 켭니다.
   - Email/Password
   - Google
2. Authentication의 승인된 도메인에 배포 주소를 추가합니다.
   - 로컬 테스트: `localhost`는 보통 기본 등록되어 있습니다.
   - GitHub Pages: `<github-id>.github.io`
3. Firestore Database를 생성합니다.
4. `firestore.rules` 내용을 Firestore Rules에 붙여 넣고 게시합니다.

## Firestore 데이터 구조

```text
players/{uid}
leaderboard/{uid}
```

`players/{uid}`는 개인 세이브 전체를 저장합니다. `leaderboard/{uid}`는 랭킹에 필요한 공개 요약만 저장합니다.

## 다음 개발 순서

1. 장비 장착 슬롯과 세트 효과
2. 지역 보스와 현상수배 주간 이벤트
3. 길드/연합 채팅 또는 공동 보스전
4. Cloud Functions 기반 전투 검증
5. Firebase App Check와 속도 제한

현재 버전은 클라이언트 중심 프로토타입이므로, 랭킹의 완전한 치트 방지는 아직 없습니다. 실제 경쟁 랭킹을 열려면 Cloud Functions에서 보상 계산을 검증하는 구조로 확장하는 것이 좋습니다.
