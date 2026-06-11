# Soul Online Alpha 0.97

모바일 2.5D 웹 MMORPG 프로토타입입니다. 0.97은 첫 화면/로그인/마을/사냥터 인터페이스를 한 번에 다시 정리하는 대형 시각 안정화 패치입니다.

## 적용 방법

```bash
npm install
npm run build
```

Firebase Hosting 배포 시:

```bash
firebase deploy --only hosting
```

## 0.97 핵심

- 첫 화면: 원화 배경 + 중앙 `TOUCH TO START` 버튼으로 고정
- 로그인: 서버/캐릭터 선택 플로우를 카드형 모바일 레이아웃으로 재정리
- 마을: 구형 로비 레이어 차단, 0.74 마스터 로비 기준으로 통합
- 사냥터: HUD/퀘스트/미니맵/조이스틱/스킬/공격 버튼 safe-area 재배치
- 닫기 버튼: 크리스탈 이미지 에셋 적용
- 색 대비: 밝은 UI는 네이비, 어두운 필드 HUD는 흰색/금색 기준
- PWA 캐시: `soul-online-alpha-v0-97`

## 주의

이 패치는 구형 UI를 완전히 삭제한 것이 아니라, 실제 화면에서 보이지 않게 강하게 정리한 대형 복구 패치입니다. 다음 단계는 CSS/HTML의 구형 레이어를 실제로 제거하는 구조 정리입니다.


## Alpha 0.97
대형 UI 구조 정리, 첫 화면/마을/사냥터 HUD 모바일 안전영역 복구, 097 에셋 추가.

- 0.97 신규 시각 안정화 모듈: `src/ui/visualMass097.ts`
- 0.97 신규 UI 레이어: `src/styles/alpha097.css`
- 0.97 신규 에셋: `public/assets/ui/fantasy/097/`
