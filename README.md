# Soul Online Alpha 1.08

모바일 세로형 웹 MMORPG 프로토타입입니다.

## 1.08 핵심
- 사냥터 HUD 모바일 safe-area 재배치
- 몬스터 정보 / 퀘스트 카드 / 미니맵 / 조이스틱 / 물약 / 스킬 / 공격 버튼 위치 보정
- 밝은 UI와 어두운 전투 HUD의 글자 색 대비 재정리
- 1.08 원화풍 UI 보조 에셋 추가
- 저사양/데이터 절약/좁은 화면에서 라이트 UI 자동 적용
- 구형 마을 레이어 suppression 강화
- System Doctor에 `1.08 모바일 품질` 진단 추가
- PWA 캐시 `soul-online-alpha-v1-08`

## 적용
```bash
npm install
npm run build
firebase deploy --only hosting
```
