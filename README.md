# 소울 온라인 Alpha 0.22 Real Visual Replacement Pass

모바일 세로형 2.5D 웹 RPG 프로토타입입니다. 0.22에서는 마을 하단 메뉴 UX와 실제 리소스 교체 패스를 집중 적용했습니다.

## 0.22 변경점

- 마을 최하단 메뉴를 5개 고정 버튼으로 재배치
  - 사냥터
  - 장비
  - 스킬
  - 카드
  - 더보기
- 더보기 팝업 추가
  - 스토리
  - 의뢰
  - 상점
  - 보스
  - 사운드
  - 계정
- 모든 마을 메뉴는 다시 누르면 닫히는 토글 구조로 변경
- 마을 메뉴 활성 상태 표시 강화
- 기존 마을 기능 카드 영역은 모바일에서 숨기고 하단 메뉴 중심 UX로 정리
- 사냥터 선택도 하단 사냥터 버튼에서 드로어로 열리도록 추가
- 필드에서 카드/가방/스킬 창이 열리면 미니맵이 자동으로 사라지게 조정
- 미니맵이 닫기 버튼을 가리는 문제 보정
- 중복 MP 게이지 마크업 제거
- runtime soulpack 비주얼 리소스 갱신
  - 8방향 캐릭터 스프라이트 시트 갱신
  - 몬스터 스프라이트 시트 갱신
  - 등각 타일/프랍 PNG 갱신
- 실제 리소스 교체 경로 유지
  - `public/assets/soulpack/characters`
  - `public/assets/soulpack/monsters`
  - `public/assets/soulpack/tiles`
  - `public/assets/soulpack/props`

## 실행

```bash
npm ci
npm run dev
```

## 빌드

```bash
npm run build
```

## 버전

- 앱 버전: `0.22.0`
- 저장 버전: `SAVE_VERSION = 18`
- PWA 캐시: `soul-online-alpha-v0-22`
