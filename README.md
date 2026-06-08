# SOL Online Alpha 0.2

모바일 웹에서 바로 접속하는 2.5D MMORPG + 카드 수집 RPG 알파 프로토타입입니다.

## 들어간 기능

- 모바일 MMORPG식 접속 플로우: 로그인 → 서버 선택 → 캐릭터 생성 → 월드 입장
- 첫 시작 위치를 마을 포탈 앞으로 변경
- 직업별 전투 정체성 강화
  - 전사: 근접, 높은 체력/방어, 반월참 광역 베기
  - 술사: 원거리, 높은 공격력/치명타, 수정 탄환 투사체
  - 성직자: 중거리, 낮은 화력, 타격 회복
- 걷기 보빙, 시전 자세, 근접 돌진, 몬스터 피격 반동
- 베기/투사체/성광/회복/폭발/리스폰 이펙트
- 공격 시 화면 흔들림
- 자동사냥 중 수동 이동해도 자동사냥 유지
- PixiJS 8 기반 등각 타일 필드
- 모바일 조이스틱 이동
- 탭 이동
- 자동사냥 토글
- Mir식 전투 흐름: 거리 체크, 명중, 방어 감산, 크리티컬, 사망 판정
- 몬스터 리스폰
- 골드, 소울젬, 장비, 카드 드랍
- 카드 장착 4슬롯
- 중복 카드 자동 합성
- 몬스터 처치 기반 영혼 링크
- 로컬 저장
- Firebase Auth + Firestore 클라우드 저장
- GitHub Pages/Firebase Hosting 배포용 Vite 설정

## 실행

```bash
npm install
npm run dev
```

개발 서버 기본 주소는 `http://127.0.0.1:8765` 입니다.

## 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다. GitHub Pages에는 `dist` 내용을 배포하거나, Firebase Hosting에는 아래 명령을 사용합니다.

```bash
firebase deploy
```

## Firebase

현재 설정은 사용자가 제공한 `k-city-webgame` Firebase 프로젝트를 사용합니다.

Firestore Rules:

- `users/{uid}`: 본인만 읽기/쓰기
- `rankings/{uid}`: 누구나 읽기, 본인만 쓰기
- `worldboss/{id}`: 읽기 전용

알파 0.1은 클라이언트 전투 계산으로 동작합니다. 실제 서비스 단계에서는 Cloud Functions에서 전투 결과, 드랍, 경험치, 골드 지급을 검증해야 합니다.

## 다음 개발 순서

1. Cloud Functions 전투 검증
2. 서버 시간 기반 월드보스
3. 파티/길드 기본 구조
4. 카드 합성 UI
5. 맵 에디터 JSON 로더
6. 스프라이트 시트 기반 8방향 애니메이션
7. 장비 장착 슬롯
8. Firestore 랭킹 화면
