# CannonTale v1.3 — 포격 기술·캐릭터·스킬 조사 및 흡수 계획
작성일: 2026-11-03

## 적용 원칙
- 현행 Matter.js 0.20.0, Canvas 2D, HTML5, 정적 GitHub Pages 유지
- SVG 이미지·아이콘·테두리 사용 금지; 기존 PNG/WebP 수작업 일러스트 우선
- 모바일 한 화면 우선, 세로/가로 각기 다른 레이아웃, PC 조작 하위호환
- 신규 외부 라이브러리는 실측 성능·용량·유지보수·라이선스 검수 전 채택 금지
- 외부 게임의 캐릭터, 스프라이트, UI 원화, 저작권 표현을 복제하지 않음

## v1.3 현재 실제 적용 및 검수
1. 플레이어 방향 원본 기준: fox / rabbit = 원화상 오른쪽(+1), bear / cat = 왼쪽(-1). 게임 렌더링 시 필요한 경우 수평 반전해 아군은 오른쪽, AI 곰은 왼쪽을 향하도록 수정
2. 원화 무기: fox 새총, bear 대포, rabbit 석궁형 발사기, cat 마법 지팡이. 캐릭터 이미지 위에 모든 영웅 공통 새총을 중복 그리지 않음. 다만 결투 모드 독립 전용 캐릭터 원화는 미제작
3. 모험·결투에서 피해 숫자를 타격 대상 머리 근처에 생성. 파괴·격파 숫자는 따로 표시하며 겹침 개선은 후속
4. 포격 후 전장·파편 보존, 중앙에 숫자만 나타나는 전환 카운트(모험 7초 / 결투 4초). 플레이어는 확인 버튼으로 조기 진행 가능
5. 전장 위·아래 드래그 = 각도 조절, 수평 드래그 = 카메라 이동
6. 각도 조절 + 예상 수평 거리 표시 + 발사 버튼 길게 누르고 손 떼는 파워 게이지
7. 발사 버튼 대기/누름·충전/발사 후 시각 상태 분리. 구형 클릭·키보드 발사는 사용성 하위호환
8. 자동 회귀 테스트: Matter.js 원본 엔진에서 두 번째 포탄, 위아래 조절, 충전 발사 한 번만 발생, 결과 숫자와 조준 궤적 등 검사. 안드로이드 실기기 시각 검수와 Pages 배포 결과는 별개

## 비교 자료와 채택 우선순위
| 우선 | 자료 | 실제 배울 점 | 주의 |
|---|---|---|---|
| P0 | [lettfeti/artillery](https://github.com/lettfeti/artillery) | 모바일 위/아래 조준, FIRE 길게 누르고 놓기, 무기별 발사 UX | 원본 구현·저작물 복붙 금지, 라이선스 확인 |
| P0 | [dslord/Angry-Birds](https://github.com/dslord/Angry-Birds) | 새총 당기기/충돌/실패 후 재발사, 제한 탄약 및 구조물 물리 | 현재 엔진에 있는 Matter.js 중복 도입 금지 |
| P0 | [Matter.js Engine](https://brm.io/matter-js/docs/classes/Engine.html), [Body](https://brm.io/matter-js/docs/classes/Body.html) | collisionStart/Active, velocity, impulse·재료별 질량·마찰·토크 | 중복 충돌 판정과 이중 데미지 방지 |
| P0 | [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) | 포인터 캡처·손가락 스크롤 충돌·pointercancel 대응 | 이벤트 한 번에 포탄 2발 나가는 문제 회귀 테스트 |
| P1 | [monteslu/angry-tirds](https://github.com/monteslu/angry-tirds) | 충격 속도 기반 누적 피해, 탄도 프레임 독립 처리, 시각 피격 단계 | Box2D WASM 교체보다 알고리즘 참고 우선 |
| P1 | [whorn76/scorched-tanks](https://github.com/whorn76/scorched-tanks) | 회전 포각·바람·지형 붕괴·무기 상점·AI 성향 | 지나친 콘텐츠 확장보다 현재 손맛 QA 먼저 |
| P1 | [NirDiamant/worms-world-party](https://github.com/NirDiamant/worms-world-party) | 지형 효과와 연쇄 폭발, 피격/파괴 통계와 AI 전술 | 무기·캐릭터·음악 등 IP 복사 금지 |
| P1 | [PixiJS AnimatedSprite 가이드](https://github.com/pixijs/pixijs-skills/blob/main/skills/pixijs-scene-sprite/references/animated-sprite.md) | 상태별 프레임 길이, loop/one-shot, 공격·피격·사망 완료 이벤트 | PixiJS 전체 이전 없이 상태 머신만 참고 가능 |
| P1 | [dioveath/particle-system-js](https://github.com/dioveath/particle-system-js) | 파편/폭발용 오브젝트 풀 재사용, 물체 생명주기 | 저사양 메모리 제한 및 과한 파티클 방지 |
| P2 | [Boom Tactics](https://github.com/eidorian-richi/boom-tactics) | 명확한 조준/이동 모드, 폭발 거리별 피해, 전술 UI | Phaser 교체 대신 UI 구조만 분석 |
| P2 | [modular ability system](https://github.com/PedronsaDev/modular-ability-system) | 스킬 메타데이터, 타깃 방식, 시전 중 상태, 쿨다운, 효과 객체 분리 | Unity C# 코드 직접 사용보다 데이터 설계 참고 |
| P2 | [Kenney UI pack](https://kenney.nl/assets/ui-pack) | CC0 소재 및 아이콘 크기·간격·터치 표준 벤치마크 | 원화 일체감 깨는 기본 UI 팩 직접 혼합은 피함 |

## 다음 개발 구현 단위
- **손맛 P0:** 캐릭터의 공격 포즈와 포탄 스폰 위치를 무기마다 분리, 맞은 타깃에 붙어 움직이는 피해 숫자, 차징 완충 미세 진동과 발사 후 반동. 단, 실기기 FPS 측정 선행
- **데미지 모델 P1:** 충격 속도 + 접촉 물체 질량 + 재료 계수 + 폭발 반경 + 적 저항을 합성. 일격으로 여러 타격이 중복 누적되지 않게 ID를 부여
- **피격 P1:** 목재 파열과 파편, 돌 하중 붕괴, 철 찌그러짐·나사 이탈. 카메라는 착탄 후 중심에 유지하고 흔들림 상한 및 멀미 저감 설정
- **스프라이트 P1:** 각 캐릭터별 [대기, 장전, 조준, 공격, 피격, 사망] 키포즈/프레임 명세화. 원화 방향/facing, 손·무기 좌표/소켓, 충돌점 별도 관리
- **스킬 P1:** fox 탄도 보정/유도, bear 관통·쇄석, rabbit 5발 분열·시한 폭발, cat 바람 반전·기류 장벽. 입력 가능 상태, 사용 횟수, 대상, 타격, 연출, 쿨다운을 데이터 기반으로 관리
- **결투 AI P2:** 상대가 바람·탄약·지형·우리 체력·남은 턴을 고려한 무기 선택. 동일 전술 반복 방지 및 쉬움/보통/어려움별 오차 제어
- **오디오 P2:** 물질별 나무/돌/금속 짧은 충돌음, 파괴, 명중과 장전 소리. 직접 만든 오디오 또는 허용 라이선스만

## QA 필수 게이트
1. 첫 화면 360x640, 390x844, 844x390, 1280x720에서 모든 버튼 눌림 영역 및 안전 여백 확인 (정적 규칙/실기기 분리)
2. 캐릭터 4명 x 모험/결투 각각 무기 방향과 투사체 발생 지점 확인
3. 몬스터 4종 키 포즈 × 피격 숫자 위치, 다중·관통·분열탄 시 숫자 중첩
4. 파워 길게 누르기/놓기/취소/회전 중 화면전환, 키보드 Space, 첫발 후 다음 발 검사
5. 착탄 -> 7초(모험)/4초(결투) 숫자 카운트 -> 다음 턴/승패 -> 기록 유지
6. 보정된 원화 및 독립 애니메이션 60fps 목표, 저사양에서는 이펙트 수량 자동 감소
7. GitHub SHA 확인과 배포 성공 여부를 분리 보고; Notion/Drive는 대상 문서 확인 전 임의 생성 금지

> 본 문서는 설계 및 자료 조사 기록입니다. 외부 코드나 에셋을 실제로 편입하지 않았으며 외부 링크의 라이선스는 편입 시점마다 재검증해야 합니다.
