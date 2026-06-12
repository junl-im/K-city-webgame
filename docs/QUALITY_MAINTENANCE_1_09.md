# Soul Online alpha 1.09 Quality Maintenance

## 목표

1.08 이후의 방향은 새 기능 추가보다 장기 품질 유지다. 1.09는 화면 밖으로 나가는 UI, 구형 레이어 중복, 모바일 세로모드, 사냥터 HUD 배치, DOM/이미지 예산을 계속 점검하는 유지보수 패치다.

## 핵심 변경

- `src/ui/maintenance109.ts` 추가
- `src/styles/alpha109.css` 추가
- 사냥터 HUD safe-area 보정 강화
- 몬스터 정보, 퀘스트 카드, 미니맵, 조이스틱, 물약, 스킬, 공격 버튼 위치 재점검
- 구형 마을/타이틀 레이어 suppression 강화
- 밝은 패널과 어두운 HUD 글자 대비 분리
- 저사양/좁은 화면/데이터 절약 환경에서 blur, filter, shadow 부담을 줄임
- System Doctor / Technical Health에 1.09 품질 유지 항목 추가

## 남은 과제

- `src/styles.css` 본체가 여전히 큼
- 구형 CSS를 완전히 삭제하려면 실기기 캡처 기반 QA 후 점진 제거가 필요
- 대형 캐릭터/몬스터 WebP Atlas는 계속 가장 큰 용량 병목
