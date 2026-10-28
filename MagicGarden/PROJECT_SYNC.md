# MagicGarden 개발 지속성·3곳 동기화 기준 (2026-10-28)

이 문서는 **GitHub + Notion + Google Drive**의 연결 기준과 최신 검증 상태를 담는 중단 복구용 시작점이다. 외부 앱의 실시간 자동 복제를 주장하지 않는다.

## 현재 기준과 링크

| 구분 | 기준 |
| --- | --- |
| 공식 코드 저장소 | [junl-im/K-city-webgame](https://github.com/junl-im/K-city-webgame) |
| 게임 소스 | `main/MagicGarden/` — 마지막 확인된 게임 v16 커밋 `dc9946bacb1ce0a7075fa025bea2baea946b62c6` (2026-10-28 18:11 KST) |
| 실제 서비스 | [GitHub Pages](https://junl-im.github.io/K-city-webgame/) — `actions/deploy-pages` 공식 게시 방식 |
| 마지막 확인된 v16 CI | [GitHub Actions #40662266213](https://github.com/junl-im/K-city-webgame/actions/runs/40662266213) 성공 |
| 마지막 확인된 v16 Pages | [GitHub Actions #40662266260](https://github.com/junl-im/K-city-webgame/actions/runs/40662266260) 성공 |
| 확정 디자인 | [VISUAL_MASTER.md](./VISUAL_MASTER.md) · 사용자 확정 일러스트 원본 3장 |
| 원화/UI 소스 | `public/assets/`, `src/button-art-v16.css`; v16의 PNG 버튼 7종, 다른 WebP 원화 아틀라스 |
| 구현·미완성 상태 | [VISUAL_IMPLEMENTATION_BOARD.md](./VISUAL_IMPLEMENTATION_BOARD.md) |
| Notion 기획·설정 기준 | [《곰같은여우의 마법정원》 MASTER GAME PLAN](https://app.notion.com/p/406fff243ec981739bfada13ffaad4ef) |
| Google Drive 기획/개발 로그 | [《곰같은여우의 마법정원》 MASTER GAME PLAN](https://docs.google.com/document/d/1-IeCgJppEqYLXUMu4aMXG1AFIrm2lp_ygXf5kQCKFv8/edit) |
| 원본 일러스트 3장 | [종합 UI/마을](https://drive.google.com/file/d/1x5zCG430ZlC6OODD-yanvB8GrH9k1tpg/view) · [4지역](https://drive.google.com/file/d/13nIhAG-PC9r9E1F5R8XPmjzrNm2bvPjq/view) · [아이콘/버튼](https://drive.google.com/file/d/1CLOZJbvsh2c5NjzoE0S8f9giS4vnXZ_p/view) |
| 이전 Soul Online | `archive/soul-online-20261028` — 복구용; 현재 `main` 프로젝트 아님 |
| 함께 배포하는 독립 게임 | `SixtySecondPlayground/` (독립 서브페이지, 덮어쓰기 금지) |

## 우선순위가 고정된 규칙

- **SVG 절대 금지**: 파일·태그·데이터 URI·벡터 아이콘/로고와 기본 SVG처럼 보이는 선형 픽토그램까지 디자인에서 사용하지 않는다. 새 아이콘·버튼·배경은 원화를 확보해 PNG/WebP로 구현한다.
- 캐릭터·소품·농장·솥·알·둥지/몬스터까지 원본 그림 3장의 2.5D 동화풍을 실제 게임 안에서도 유지.
- 기존 `gomfox.magic-garden.prototype.v1` 저장 키와 12칸 텃밭, 조합, 부화, 몬스터 수량, JSON 내보내기/불러오기 보존.
- 빌드/검사 통과, Pages 실제 게시 완료, PC/모바일 실제 화면 QA **세 가지는 서로 다른 완료 상태**. 미검수는 미검수라고 표기한다.
- 서비스가 자체 요구하는 OAuth/권한 팝업은 시스템이 강제할 수 있다. 이미 제공된 사용자의 작업 동의를 자꾸 재확인하지 않지만 인증·접근 승인 절차를 우회할 수는 없다.

## 변경 하나가 완료되는 기준 (매 작업 적용)

1. GitHub `main` 최신 상태 및 Notion/Drive 최신 기록을 읽고 이전 결정과 충돌이 없는지 대조.
2. 새 자산이 필요하면 PNG/WebP 제작/검증/원본 보관 → 코드·CSS 반영.
3. `npm run build` → 라스터 자산·SVG 금지·게임 테스트·Vite 빌드.
4. GitHub 커밋 SHA 확인 → 공식 Pages 자동 배포 결과 확인. UI를 보지 않았다면 '육안 검수' 완료로 표시하지 않음.
5. `VISUAL_IMPLEMENTATION_BOARD.md`와 Notion MASTER/Google Docs MASTER에 동일한 날짜·커밋·변경·아트 자산·검증 결과·미완료 항목 반영.
6. Notion/Drive 내용 읽어 기록 반영 검증. 한곳이 실패하면 GitHub에는 성공/미완료 상태를 남기고 사용자에게 정직하게 전달.

## 다음 개발 우선순위

1. 사용자가 어색하다고 지적한 **실제 v16 버튼/테두리**를 PC/모바일 화면에서 비교 검수. 화풍이 안 맞는 원화·눌림/중복배경/잘림·가독성 다시 수정.
2. 마을·농장·조합실·몬스터 연구소의 고유 소품/캐릭터·작물·알/솥/둥지·몬스터 실게임 원화 완성도 향상.
3. 계곡 물 마스크의 실제 원화 위치·다리 가림과 모바일 동선 검수.
4. 실기기 검증 기록을 기준으로 디자인 문제를 우선순위 순서대로 제거.

**참고:** 이 문서의 SHA와 검사 결과는 2026-10-28 당시 v16 **기준점**이다. 이후 커밋이 생기면 반드시 GitHub 최신 main/Actions 확인 결과를 우선한다.

## v17 진행 체크포인트 — 2026-10-28

- **최신 기능 커밋:** [715d654](https://github.com/junl-im/K-city-webgame/commit/715d654cba15020acb28cdb8b93d34973460ed6a) — `src/button-proportions-v17.css`, `scripts/check-button-proportions.mjs`; v16 PNG 7종 원화는 변형·교체하지 않고 사용.
- **직접 확인된 자동화:** [소스 CI #40665522246](https://github.com/junl-im/K-city-webgame/actions/runs/40665522246) **성공**, [공식 Pages #40665522270](https://github.com/junl-im/K-city-webgame/actions/runs/40665522270) **성공**.
- **실제 개선:** 크림 지역 표지판, 작은 양피지 탭, 분홍/연두/금빛 행동 버튼, 가방/연구소 모달 제목판, 계곡 산책 버튼의 **배경 강제 가로세로 확대를 차단**하고 PNG `border-image` 9분할로 전환. 원형 하단 배지는 1:1 그림 비율 유지. 모바일 좁은 화면 테두리 두께와 터치 44px 이상 유지.
- **남은 점검:** 실제 Android/iOS/PC 화면에서 원화 보임·모서리 선명도·팝업 탭 글씨/공간·눌림/비활성 상태 시각 확인 미완료. CSS 계약 검사와 실제 기기 육안 QA를 혼동하지 않는다.
- **정책:** SVG 및 SVG처럼 보이는 기본 아이콘 금지 유지. 실제 새 자산이 필요해지면 승인된 동화풍 PNG/WebP 원화를 확보한 뒤 적용. 기존 12칸 농사·조합·부화·몬스터 JSON, Soul Online archive, 60초 놀이터 독립 파일 불변.

위 문단은 아래의 최초 v16 기록을 **역사적 기준점으로 유지한 채 추가한 최신 상태**다. 다음 작업은 이 체크포인트부터 이어 가며 Notion/Google Drive에도 동일한 커밋을 기록한다.

## v18 실게임 아이템·몬스터 전용 원화 체크포인트 — 2026-10-28

- 기능 커밋: [27ba8c2](https://github.com/junl-im/K-city-webgame/commit/27ba8c2b7ed3376e061798cbee4d8cf1440f7e0e). `public/assets/illustrated-items-v18.webp` 신규 720×360 투명 아틀라스 8종. 실제 가방/조합/알 연구소/몬스터 도감에 연결.
- 원본 제작/재사용: 사용자 승인 동화풍에 맞춰 제작한 일러스트 콘셉트에서 씨앗·딸기·분홍 정수·알 둥지·잎새콩·방울몽·반짝몽·꽃을 분리하고 주변 종이 배경을 제거. **[Google Drive 보관된 WebP 원본](https://drive.google.com/file/d/1utuMe5wCOrrqh0bA_wwz5tnUHLbiPAsd/view)**, GitHub 배포용 25,316B로 동일 파일. SVG/기본 벡터 아이콘 자산 신규 0.
- 자동 검증: [소스 CI #40667749953](https://github.com/junl-im/K-city-webgame/actions/runs/40667749953) 성공, [공식 Pages #40667749976](https://github.com/junl-im/K-city-webgame/actions/runs/40667749976) 성공. `scripts/check-illustrated-items-v18.mjs`에서 WebP 파일 헤더/720x360/크기/게임 실제 아이템 연동·3종 몬스터 그림 구분 검사.
- 보존: `gomfox.magic-garden.prototype.v1`, 농사 12칸/조합/부화 타이머·몬스터 JSON·Soul Online 백업 및 60초 놀이터 독립 경로 보존.
- 다음 QA: 기기 브라우저에서 도감/연구소의 투명 아트 경계·아이콘 사이즈, 가방·조합 탭 터치와 패널 스크롤, 세계 배경의 실제 오클루전/계곡 물길 위치/지역별 오브젝트 원화 보강.
- **완료 구분**: GitHub 코드·CI·배포 성공이 확인되었고, 실제 iPhone/Android/Whale/Chrome 육안 플레이 스크린샷 QA는 아직 미완료. 3곳 로그를 같은 커밋으로 기록하며 동기화는 업데이트 시 수동 교차 저장.

## v19 세계가 살아 움직이는 라스터 환경·반응 효과 — 2026-10-28

- **실제 구현 커밋:** [6b05128](https://github.com/junl-im/K-city-webgame/commit/6b051284899c0bd65f4c8d647f701a60bd2bad31). `src/painted-environment.ts` 신규, `src/main.ts` 환경/효과를 기존 라스터 원화 위주로 교체.
- **원화 소스:** v18에 제작하고 Google Drive에 보관한 투명 [8종 WebP](https://drive.google.com/file/d/1utuMe5wCOrrqh0bA_wwz5tnUHLbiPAsd/view). 시드·딸기·정수·알·잎새콩/방울몽/반짝몽·꽃. 신규 이미지/SVG/기본 선형 아이콘 **0개**.
- **지역별 환경**: 마을 꽃/마법빛 5개, 큰 텃밭 꽃/새싹/딸기 5개, 조합실 정수/꽃 4개, 연구소 알/꽃 4개. 원화 컷아웃이 은은히 이동·명도 호흡하며 다른 지역은 숨김. 그림은 캐릭터 아래 레이어에 표시되고 포인터 이벤트를 가로채지 않음.
- **플레이 반응**: 씨앗 심기·수확·마법 정수·알 제작·부화 효과도 이전 PixiJS Graphics의 원형 벡터풍 파티클 대신 손그림 WebP 조각 스프라이트 사용. 파티클 60개 상한, 지역 이동 때 남은 효과 해제, 보조 원화 로딩이 안 되면 게임 진행 자체는 가능.
- **모바일**: 환경 좌표 갱신 최대 20fps, 현재 지역만 갱신, `prefers-reduced-motion`에서 환경은 정지 삽화로 표시·보상 움직임 중단. 저장 데이터 키 `gomfox.magic-garden.prototype.v1`, 12칸 농사/조합/부화/몬스터/JSON 스키마 변경 없음. Soul Online/60초 놀이터 별도 영역도 보존.
- **자동 검증:** [v19 소스 CI #40677134127](https://github.com/junl-im/K-city-webgame/actions/runs/40677134127) 성공, [공식 Pages #40677134149](https://github.com/junl-im/K-city-webgame/actions/runs/40677134149) 성공. `scripts/check-painted-environment-v19.mjs`가 라스터 공유/지역별 앵커/기하학 아이콘 제거/모션·터치/상한 조건 검사.
- **남은 QA**: 환경 삽화 위치가 원화 속 실제 정원길/건물/다리·캐릭터와 겹치지 않는지 Chrome/Whale/iOS/Android 스크린샷 직접 비교. 계곡 수면/다리 가림과 솥·둥지 자체 애니메이션/환경 물리 충돌은 별도 작업으로 남아 있음. **CI와 배포 성공만으로 실화면 검수 완료라고 말하지 않는다.**
- **3곳 동기화:** 최신 v19 구현 SHA와 위 검사/원화 보관 링크/QA 미완료를 이 파일, Notion MASTER, Google Docs MASTER에 같은 날짜로 기록.

## v20 손그림 전경 화단·안내판 Y-깊이 개선 — 2026-10-28

- 기능 커밋: https://github.com/junl-im/K-city-webgame/commit/032bce4f4431118209a17ba5e20cbc78fe05badc ; TypeScript import 교정: https://github.com/junl-im/K-city-webgame/commit/ae5312ca17b0e841d70bd61b60a6171c4537da95 .
- v19 환경 꽃이 캐릭터 뒤에 고정되고 안내판 gate/station은 zIndex 10000/10001로 무조건 앞에 떠 있던 문제 개선.
- src/garden-depth.ts : 네 지역 실제 손그림 전경 꽃/새싹/열매 총 10개 앵커, 캐릭터의 발 위치와 동일한 Y 기준 깊이 정렬. 마을/농장/실험실/연구소에 각각 고유 장식. 길 안내판과 조합/부화 안내판도 접지 좌표 기준으로 깊이 보정.
- 신규 그림이나 SVG 없음. 기존 v18 WebP 8컷 아틀라스(Drive https://drive.google.com/file/d/1utuMe5wCOrrqh0bA_wwz5tnUHLbiPAsd/view ) 재사용. 그림의 터치 투과, 지역별 표시/숨김, 저속 20fps 갱신 공유, OS 움직임 줄이기 지원.
- 저장키 gomfox.magic-garden.prototype.v1, 12칸 텃밭, 조합/알/부화/몬스터, JSON, Soul Online 백업 브랜치 및 60초 놀이터 독립 소스 변경 없음.
- 최초 v20 CI #40692086727에서 footDepth import가 누락되어 TypeScript 실패 후 수정. 최종 소스 CI https://github.com/junl-im/K-city-webgame/actions/runs/40692214924 성공, Pages https://github.com/junl-im/K-city-webgame/actions/runs/40692214936 성공. check-garden-depth-v20.mjs 회귀검사 73건 통과.
- 미완료: 전체가 하나의 배경 이미지인 건물/큰 나무/다리 난간의 픽셀 단위 가림은 미구현. 분리된 전경 원화를 확보한 뒤 마스크를 정합해야 함. 실제 Chrome/Whale/Android/iPhone의 그림 위치·캐릭터 겹침 실기기 스크린샷 검수도 미실시. 배포 성공과 육안 QA를 구분.

## v21 팝업 키보드 초점 안정화 — 2026-10-28

- 문제: 가방/도감/조합/연구소 모달의 `aria-modal`과 달리 키보드 초점이 원래 지역/하단 게임 버튼에 남거나 Tab으로 모달 밖으로 빠질 수 있었음. 모달 내부 액션으로 화면 재구성 시 초점이 사라지는 경우도 있었음.
- 구현: `src/main.ts`의 모달 열기에서 닫기 버튼으로 초기 초점 이동, Tab/Shift+Tab의 팝업 내부 순환, Escape·닫기·배경 클릭 시 호출 버튼 초점 복귀, 모달 안에서 동일 액션 재그리기 시 해당 액션 초점 유지. 새 아트 및 SVG 없음.
- GitHub 변경: [기능 `7d42dd0`](https://github.com/junl-im/K-city-webgame/commit/7d42dd0325d1cfe0699cc1dff08118e25e8c1e2b), [계약검사 `270abc6`](https://github.com/junl-im/K-city-webgame/commit/270abc6b7ab6515832788850df6b64a9fb57b74b), [빌드 연결 `e5fe4da`](https://github.com/junl-im/K-city-webgame/commit/e5fe4da2059e10483be45c3d8747b5cfc7dacbf2).
- 검증: GitHub 소스 읽기 재확인 및 11개 정적 계약 항목 통과. 실행 환경 이용 불가로 로컬 `npm run build` 미실행, GitHub Actions 실행/결과는 확인 도구에서 결과가 비어 있어 **CI·Pages 성공 미확인**, PC/Android/iOS 실제 Tab/Shift+Tab·화면 QA 미실시.
- 기존 저장 키 `gomfox.magic-garden.prototype.v1`, 12칸 밭·조합·부화·몬스터·JSON 저장 형식, 라스터 원화, Soul Online 백업 및 60초 놀이터/꽃맞고 독립 코드는 변경하지 않음.
- 다음 단계: 실제 Actions/Pages 성공 확인, 키보드 탭순서·패널 스크롤 및 작은 모바일 화면 확인, 배경 원화의 다리·건물·큰 나무 전경 분리/오클루전 원화 QA.

## v22 손그림 버튼 테두리 최소화 — 2026-10-29

- 사용자 지적: 이전 버튼의 테두리가 크고 투박하며 마법정원 원화와 어울리지 않음. `src/button-proportions-v17.css`의 좁은 버튼에도 두꺼운 PNG 9분할 `border-image`가 적용되던 것이 직접적인 코드 원인.
- 수정: [기능 커밋 `6b02d4c`](https://github.com/junl-im/K-city-webgame/commit/6b02d4c86db5572eaa209cb353df36e523b5f72d) — v17 호환 스타일시트를 v22의 조용한 원화 프레임 디자인으로 정리. `border-image` 9분할 및 100%×100% 원화 왜곡 제거, 승인된 v16 크림/양피지/분홍·초록·금빛/원형 배지 PNG 7종을 `background-size:cover`로 비율 보존하며 중앙 질감만 잘라 사용. 얇은 1px 반투명 선, 부드러운 그림자·모서리, 용도별 버튼 구분. 하단 이름표와 컨테이너의 이중 장식 제거. 한국어 HTML과 기존 원화 아이콘 보존.
- 검사: [정적 계약 수정 `1c05968`](https://github.com/junl-im/K-city-webgame/commit/1c059688f86444b66426261e3be4afc8cd50fb12). GitHub 원격 소스 재읽기 결과 9분할/강제 왜곡/SVG 참조 없음, 기존 7종 PNG 참조 유지, 모바일 44px 최소 높이와 reduced-motion 처리 확인.
- **미확인:** 실행 환경 사용 불가로 로컬 `npm run build` 및 브라우저 화면 캡처 미실시, GitHub Actions 실행 결과 조회가 빈 목록이라 CI·Pages 자동 게시 성공 여부 미확인. CSS 소스 수정과 실제 화면 품질 승인/배포를 동일시하지 않음.
- 보호: 저장 키 `gomfox.magic-garden.prototype.v1`, 12칸 농사·조합·부화·몬스터·JSON 데이터, 기존 원화 원본 및 Soul Online 보관/60초 놀이터/꽃맞고 전혀 변경하지 않음.
- 다음: Actions/Pages 성공 확인 → 사용자의 PC Whale/Android/iPhone 실제 가방·지역·도감/실험실·연구소 팝업 버튼 테두리와 텍스트/터치 스크린샷 비교. 필요하면 그림 자체를 기준 3장에 맞춰 전용 PNG/WebP로 재제작.


## v23 원화 전면 개별화 및 렌더러 제한 환경 보완 — 2026-10-29

- 소유권: 마법정원 소스, 기획, 원화와 파생 디자인 등 이 프로젝트의 지식·창작 자산은 **곰같은여우 사용자**에게 귀속된다. GitHub, Notion, Google Drive는 작업·백업·동기화를 위한 위치이지 소유권 이전이 아니다.
- 사용자 지적: 마을·텃밭·실험실·연구소, 하단 메뉴, 상단 띠, 모달 제목과 닫기 등에서 같은 그림을 늘리거나 재사용하면 그림책 게임의 질감이 망가진다. **SVG 파일/태그/데이터 URI·SVG풍 임시 아이콘 절대 사용 금지.**
- 구현: 최종 로드 src/unique-surfaces-v23.css로 과거 border-image 중복과 과한 목재 테두리를 덮어쓰고, 각 컨트롤의 배경·실루엣·색을 분리. public/assets/ui-v23-*.png의 서로 다른 손그림 원화 **15개**를 버튼 역할별로 1:1 연결한다. 4지역, 가방·지도·도감·도움말 4개, 게임 제목·씨앗·열매·안내 4개, 계곡·모달 제목·닫기 3개다.
- QA: 실제 GitHub Pages 1366px 데스크톱 스크린샷에서 4지역과 하단 PNG가 분리돼 보이고 border-image 계산값이 none인 것을 확인했다. 게임 제목이 작은 집 그림에 겹치던 부분은 330591f에서 패딩·너비 조정. 통합 검증 scripts/check-unique-surfaces-v23.mjs가 15개 PNG 실파일·서로 다른 해시·각 CSS 참조·늘림 금지 규칙을 보조 확인한다. 85e220f 기준 Magic Garden CI와 GitHub Pages 배포가 **둘 다 성공**했다.
- 환경 제한: 테스트용 클라우드 Chrome은 PixiJS GPU 렌더러를 지원하지 않아 CanvasRenderer is not yet implemented 오류로 풍경이 빈 화면이었고, 이는 사용자 Whale 환경의 동일한 오류를 입증하지 않는다. 14c82ed/14264b1에서 원본 4지역 WebP를 보여 주는 **시각 미리보기만** 추가(게임 플레이 대체 아님). 이 후속 변경의 Actions·배포·스크린샷 검증 상태는 별도 추적한다.
- **미완료:** 작은 모바일 실기기 검수, 모든 팝업 액션/탭 개별 원화 추가 제작, PNG 용량 최적화와 구형 브라우저/WebGL 실사용 QA. 원화 생성/소스 적용/배포 성공과 최종 디자인 승인을 혼동하지 않는다.
- 보호: 저장 키 gomfox.magic-garden.prototype.v1, 12칸 농사·재료·연금·부화·JSON 내보내기/불러오기, SixtySecondPlayground/, FlowerMatgo/, archive/soul-online-20261028은 건드리지 않았다.


## v24 팝업 버튼 전용 원화 확장 — 2026-10-29

- v23의 화면 원화 15종에 이어 **추가로 서로 다른 18개 PNG**를 제작하여 총 **33개 고유 PNG**로 확장. 조합(brew), 알 만들기(craft-egg), 부화(hatch), 품기(incubate), 내보내기·불러오기·확정·취소, 모달 내 4구역 이동, 도감 열기, 계곡 물결 켜기/끄기, 가방 분류(전체·작물·마법·친구) 등.
- CSS는 src/unique-surfaces-v23.css 최종 로드 순서에서 각 data-game-action에 고유 파일을 연결하고 종횡비를 지키며 표시한다. SVG 제작·참조·대체 아이콘 없음. 기존 고유 재료 원화는 그대로 보존하며 새 버튼 테두리 반복을 제거한다.
- scripts/check-unique-surfaces-v23.mjs는 33개 물리 PNG 실재·SHA-256 해시 중복 부재·CSS 참조·최종 스타일 우선순위·늘림 금지를 빌드에서 검사한다. 전체 MagicGarden 물리 SVG 파일 0개.
- 실제 모달 열기/키보드·320px 모바일 시각 QA는 **미완료**. 클라우드 Chrome은 WebGL 미지원이라 정적 풍경 미리보기만 가능하다. 각 팝업에서 버튼 원화/글자 겹침 확인 전에는 디자인 최종 승인이라 하지 않는다.
- 원화 33장의 용량 최적화(파생 WebP)도 후속 과제. 원본 PNG·사용자 저작권·기존 게임 데이터/별도 게임 소스 보존.


## v24.1 전용 버튼 원화 WebP 경량화·실배포 확인 — 2026-10-29

- **33개 고유 PNG 원본은 삭제하지 않고 보존**했다. 투명 여백을 잘라 각 원화를 1:1 대응하는 **33개 독립 투명 WebP 파생 이미지**로 변환했다. 코드가 사용하는 UI 이미지만 WebP로 전환했으며 원화 하나를 여러 버튼에 확대 재사용하거나 가로·세로 100% 강제 늘림하지 않았다.
- 전용 UI 원화 전체 다운로드 원본 약 **53.2 MiB → WebP 약 1.1 MiB**(약 98% 감소). 품질 82, 720×360 이내. 원본 PNG 저작권과 보관 유지. [WebP 파일 커밋](https://github.com/junl-im/K-city-webgame/commit/214a68255a5275e5bd2d1ae89a7227814f109bd8), [CSS 로딩 전환](https://github.com/junl-im/K-city-webgame/commit/76b06e20da3da8211be6090f2dfe486d6c8dd82d).
- [검증 커밋 ca6f02e](https://github.com/junl-im/K-city-webgame/commit/ca6f02e0fa107d664d8a12c9fdb4af0640cec222): 33 원본 PNG·33 고유 WebP·리소스 해시 중복 부재·압축률·CSS 참조·border-image 무효화·100%×100% 비율 왜곡 금지 자동 검증. **Magic Garden CI 및 GitHub Pages 둘 다 성공** 확인.
- **배포 브라우저 실측:** 4지역/하단 메뉴 8개 버튼의 computed style 이미지 URL이 .webp, borderImageSource=none, backgroundSize=contain, auto. 게임 장면·구역 버튼 색/종류를 육안 확인했고 GPU 미지원 환경의 정적 장면 미리보기에서 텃밭 전환 확인.
- **여전히 미확인:** 실제 WebGL을 쓰는 PC Whale 게임 조작, 모달 안 실제 버튼·탭, 320/390px 휴대전화 레이아웃과 긴 글자 잘림. GPU 미지원 브라우저의 정적 미리보기는 플레이·기능 QA가 아니다. 기획·소스·33개 PNG 원본 및 파생 WebP 지식 자산의 권리는 **임현준 사용자**에게 귀속된다.
