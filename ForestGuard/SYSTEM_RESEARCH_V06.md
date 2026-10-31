# 라니 수비대 — 상용 게임·오픈소스 전투 시스템 조사 v0.6
© 2026 곰같은여우 · 2026-10-31

> 적용 기준: GitHub `K-city-webgame/ForestGuard`. 게임 자체와 아트 자산은 자체 제작. 상용작의 원화·코드·사운드·UI 직접 복제 금지. 문서의 외부 링크는 비교 참고 및 라이선스 검토용.

## 1. 상용 게임 벤치마크 (공식·플랫폼 출처)

| 작품 | 확인한 시스템 | 라니 수비대의 독자적 적용 | 상태 |
|---|---|---|---|
| Kingdom Rush (Ironhide) | 지원군, 영웅 스킬, 전문화, 보스 공략 | 용병 역할·일제사격 저지·전술 시너지 | 보스 3종 기존, 수비 전술 추가 |
| Vampire Survivors (poncle) | 자동전투 + 로그라이트 누적 성장 | 스킬 조합과 복수의 진화 경로 | v0.6 두 갈래 진화 |
| Brotato (Blobfish) | 짧은 웨이브, 자동사격, 웨이브 사이 구매 | 3지선다 카드의 조합 유도와 리듬 | v0.6 조합 후보 노출 |
| Grow Castle (RAON) | 영웅 위치와 전문화, 성벽 방어 | 3전열 교대와 수호 능력 | v0.6 수호 카드 |
| The Battle Cats (PONOS) | 고유 적 특성, 유닛 상성 | 안개·수정 갑옷·증원 대응 | v0.6 전장 상성 |
| 20 Minutes Till Dawn (Flanne) | 조건부 시너지 업그레이드 | 덩굴+불꽃, 성벽+수호 조합 | v0.6 시너지 2종 |
| Survivor.io (HABBY) | 장비·패시브 연계의 진화 | 한 번의 진화로 플레이스타일 분화 | v0.6 햇살/달빛 |
| Lucky Defense (111%) | 랜덤 소환·합성·확률 전략 | 랜덤 제안은 유지, 과금형 뽑기 금지 | 직접 도입 보류 |
| Arknights (Hypergryph) | 적 정보·전장 경로·범위 대응 | 스테이지별 몬스터 정보와 지형 영향 | 일부 도입, 도감 후속 |

출처:
- https://www.kingdomrush.com/kingdom-rush-origins-presskit
- https://poncle.games/vampire-survivors.html
- https://store.steampowered.com/app/1942280/Brotato/
- https://play.google.com/store/apps/details?id=com.raongames.growcastle
- https://ponosgames.com/information/appli/battlecats/zukan/en/index.html
- https://steamcommunity.com/games/1966900/announcements/detail/3208263159382620137
- https://apps.apple.com/ca/iphone/story/id1641743438
- https://play.google.com/store/apps/details?id=com.percent.aos.luckydefense
- Arknights stage mechanisms (community-maintained secondary reference): https://arknights.wiki.gg/wiki/Operation

## 2. 개발용 오픈소스·아트 자료 (라이선스 분리)

| 후보 | 용도 | 라이선스와 사용 원칙 |
|---|---|---|
| Phaser 3 공식 애니메이션 API | 스프라이트 시트, 프레임 전환, 적/공격 처리 | 기존 게임에서 사용 중. https://docs.phaser.io/phaser/concepts/animations |
| rupertgermann/tower-defence | 웨이브·투사체·업그레이드 책임 분리 | MIT 확인. 기존 원본 구조 참고·출처 표기 유지. https://github.com/rupertgermann/tower-defence |
| pinkkis/phaser-tower-defence | 작은 화면의 경량 타워디펜스 구조 | 저장소 README MIT 표기. 코드 도입 전 개별 파일·종속성 확인. https://github.com/pinkkis/phaser-tower-defence |
| m-ko-de/open-td | 연구·레벨·타워 매니저와 웹/모바일 구조 | 라이선스 미확인: 소스 복사 보류, 개념 비교만. https://github.com/m-ko-de/open-td |
| Tiled Terrain/Wang Sets | 도로·절벽·풀 연결점 자동 처리 | 도구·기술 문서 참고. https://docs.mapeditor.org/en/latest/manual/terrain/ |
| Phaser TileSprite | 작은 텍스처 반복과 메모리 절감 | 큰 무한 스프라이트 남발 금지. https://docs.phaser.io/phaser/concepts/gameobjects/tile-sprite |
| Kenney Tower Defense Top-Down | 임시 테스트 장애물·지형 레퍼런스 | CC0 표기 확인, 최종 독자 원화 우선. https://kenney.nl/assets/tower-defense-top-down |

**금지**: 외부 작품 스프라이트를 라니 캐릭터로 바꿔 주장하기, 원본 시스템 이미지를 1:1 추출하기, SVG 파일·SVG DOM·SVG 아이콘, 출처 불명 사운드, 무단 상용 에셋.

## 3. v0.6 실제 구현 목록

- 진화(10 에너지): 햇살의 곰같은여우 / 달빛의 곰같은여우. 선택 취소 후 전투 복귀.
- 4 카드: 덩굴 덫, 관통 화살, 숲의 수호, 추적의 눈.
- 2 시너지: 불꽃 덩굴, 고목의 맹세. 기존 4 시너지 유지.
- 3지선다: 조합 짝 후보가 발견되면 85% 확률로 1개 제안, 나머지는 고유 랜덤. 무료 1회 새로고침 유지.
- 전장 반응: 안개 시야 10% 감소(추적으로 해제), 좁은 다리, 3공세 포자 급증, 바람 횡이동, 4공세 달빛 증원, 수정 갑옷 관통 대응.
- 저사양 정책: 본 패치 신규 대형 이미지 없음. Canvas 원형 효과만 추가, SVG 0개.

## 4. 다음 우선순위(제안, 아직 미구현)

1. P0 — 320px 안드로이드 실제 UI·진화 팝업·모달 뒤로가기·저장 반복 QA.
2. P0 — 스테이지 1-1·4·8·12 자동 시뮬레이션으로 승률, 스킬 사용률, 플레이 시간 기록(개인정보·원격 로그 전송 없음).
3. P1 — 3개 챕터 독자 전장 원화: 숲 / 안개 절벽 / 달빛 성. 전장 좌우의 식생·다리·수정 장애물을 별도 WebP 아틀라스로 구성.
4. P1 — 적 4종 이상 특성 도감: 속도/갑옷/잠복/원거리 위협 표시, 전투 직전 정보 카드.
5. P1 — 6~8프레임 실제 관절 원화/스프라이트 텍스처 아틀라스, 뼈대 흔들기만 반복하지 않기.
6. P2 — 사용한 빌드와 보스 저지 결과를 로컬 기록하는 플레이 리포트, 도전 과제/완료 배지. 과금·광고 없음.
7. P2 — 챕터별 고유 필살기 연출·화면 흔들림 강도 제한·진동 토글·효과음(직접 제작 또는 사용권 확보).

## 5. 밸런스 검증 규약

- 기준 1-1 성벽 HP 3000 / 여우+곰 시작 / 원래 8·10·12 공세 보존.
- 카드 14종이지만 2공세마다 3지선다이므로 조합 획득률·빈 전열 합류 확률을 점검.
- 덩굴 덫은 보스 무한 고정 금지: 수초 구속 후 재사용 지연, 중첩 상한 3.
- 수호의 공세당 방어 횟수 상한 3, 관통 비율 최대 100%, 추적 보스 피해 상한 30%.
- 보스 3종 예고 1.25초와 일제사격 저지 기회 유지.
- 빠른 2배속·뒤로가기·포커스 중단·모달 중 일시정지·새로고침 후 진행 기록 회귀 검증.

## 6. 끊김 방지용 재개 체크포인트

1. GitHub main 최신 커밋 및 Pages 배포 성공 확인.
2. `ForestGuard/DEV_HANDOFF.md` 마지막 항목 기준으로만 재개.
3. CI `node ForestGuard/tests/smoke.mjs`, WebP 구조 검사, 공개 브라우저 실제 표시 확인.
4. Notion MASTER/Google Drive 진행 기록에 확정된 배포 결과 반영.
5. ChatGPT 서비스 연결 중단은 GitHub/배포 장애와 구분. 서비스 내부 원인 해결로 단정하지 않음.
