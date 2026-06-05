# K-시티 이너월드

모바일 웹용 카드형 도시 방범 RPG 스타터입니다. 기존 `K-city-webgame` 방향을 유지하면서, 초반 게스트 플레이, Lv.2 로그인 게이트, Firebase Auth/Firestore 저장, 비동기 PvP, 랭킹, 카드 모집 확률/천장, 시설 성장, 전투 로그를 넣었습니다.

## 핵심 구조

```txt
k-city-innerworld/
├─ index.html
├─ package.json
├─ vite.config.js
├─ firebase.json
├─ firestore.rules
├─ firestore.indexes.json
├─ .env.example
├─ public/
│  ├─ icon.svg
│  └─ manifest.webmanifest
└─ src/
   ├─ main.js
   ├─ styles.css
   ├─ data/
   │  ├─ cards.js          # 카드 원본, 등급, 속성, 스킬
   │  ├─ chapters.js       # 스토리 스테이지, 일일 임무
   │  └─ gacha.js          # 모집 확률, 천장, 픽업
   ├─ game/
   │  ├─ battle.js         # 전투 계산, 공명 보너스, 로그
   │  ├─ economy.js        # 뽑기, 카드 훈련, 팀 편성
   │  ├─ progression.js    # 임무, 시설 업그레이드
   │  ├─ pvp.js            # Firestore 비동기 매칭/PvP/랭킹
   │  └─ state.js          # 로컬 저장, 레벨업, 로그인 게이트
   ├─ lib/
   │  ├─ firebase.js       # Firebase 초기화
   │  └─ storage.js        # localStorage 래퍼
   └─ ui/
      ├─ app.js            # SPA 액션/렌더링/로그인/저장
      └─ components.js     # 화면 컴포넌트
```

## 설치

```bash
npm install
npm run dev
```

## Firebase 환경값

`.env.example`을 복사해서 `.env.local`을 만들고, Firebase 콘솔의 웹 앱 설정값을 넣으세요.

```bash
cp .env.example .env.local
```

예시:

```env
VITE_FIREBASE_API_KEY=Firebase_콘솔_apiKey
VITE_FIREBASE_AUTH_DOMAIN=k-city-webgame.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=k-city-webgame
VITE_FIREBASE_STORAGE_BUCKET=k-city-webgame.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=764165707172
VITE_FIREBASE_APP_ID=1:764165707172:web:77cea6d091cd39803b5d31
VITE_FIREBASE_MEASUREMENT_ID=G-W202YGQDF3
VITE_BASE_PATH=/
```

GitHub Pages에 올릴 때는 `VITE_BASE_PATH=/K-city-webgame/`로 바꿔 빌드하세요. Firebase Hosting이면 `/` 그대로 두면 됩니다.

## Firebase 콘솔에서 켜야 하는 것

1. Authentication → Sign-in method → Email/Password 활성화
2. Authentication → Sign-in method → Google 활성화
3. Firestore Database 생성
4. `firestore.rules` 배포
5. `firestore.indexes.json` 배포

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc
firebase deploy --only firestore:rules,firestore:indexes
npm run deploy:firebase
```

## 게임 흐름

- 첫 화면에서 `게임 시작`을 누르면 로그인 없이 로컬 진행이 시작됩니다.
- Lv.1 구간은 localStorage에 저장됩니다.
- Lv.2 달성 후부터 전투/모집/PvP는 로그인을 요구합니다.
- 로그인하면 기존 로컬 진행이 Firestore `profiles/{uid}`로 이전됩니다.
- PvP는 `pvpRooms` 컬렉션에서 대기방을 찾거나 생성하는 비동기 결투입니다.
- 랭킹은 `leaderboards/{uid}`에 저장됩니다.

## 현재 들어간 게임성

- 등급: R / SR / SSR
- 속성: 광휘 / 그림자 / 전류 / 맹세
- 진영: 방범대 / 시민망 / 네온공학 / 이면계
- 스킬 타입: 단일 폭딜, 연격, 광역 약화, 회복, 보호막, 처형
- 공명 보너스: 같은 진영 2~3명, 서로 다른 속성 3개 이상
- 모집 확률: SSR 3%, SR 17%, R 80%, 70회 SSR 천장
- 시설 성장: 발전소는 스태미나, 훈련소는 전투력 성장에 영향
- PvP: 유저 팀 스냅샷끼리 자동 전투 후 점수 반영

## 중요한 보안 메모

Firebase 웹 `apiKey` 자체는 서버 비밀번호가 아니지만, 공개 저장소에서는 `.env.local`을 커밋하지 않는 방식을 추천합니다. 더 중요한 것은 Firestore Security Rules입니다. 이 스타터의 규칙은 기본적인 소유자 검증과 컬렉션 제한을 넣었지만, 실제 상용 PvP/뽑기는 Cloud Functions 기반 서버 검증으로 옮기는 것이 좋습니다.

## 다음 단계 추천

1. 카드 일러스트를 직접 제작하거나 AI/외주로 만든 뒤 `glyph` 영역을 이미지로 교체
2. Cloud Functions로 뽑기 RNG, PvP 결과, 보상 지급 서버 검증
3. App Check 적용으로 비정상 호출 감소
4. 장비/스킬 강화/스토리 컷신 추가
5. 시즌제 아레나와 길드 보스 추가
