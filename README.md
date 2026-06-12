# Soul Online Alpha 1.09

모바일 세로형 웹 MMORPG 프로토타입입니다.

## 1.09 핵심
- 장기 품질 유지용 `maintenance109` 런타임 점검 추가
- 사냥터 HUD safe-area 재배치 보강
- 몬스터 정보 / 퀘스트 카드 / 미니맵 / 조이스틱 / 물약 / 스킬 / 공격 버튼 화면 이탈 재점검
- 밝은 패널과 어두운 전투 HUD의 글자 대비 추가 보정
- 구형 마을/타이틀 레이어 suppression 강화
- 저사양/좁은 화면/데이터 절약 환경에서 blur, filter, shadow 부담 감소
- System Doctor와 Technical Health에 `1.09 품질 유지` 진단 추가
- PWA 캐시 `soul-online-alpha-v1-09`

## 적용
```bash
npm install
npm run build
firebase deploy --only hosting
```
