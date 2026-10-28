# 곰같은여우의 마법정원 — 작업 인계 규칙 (AGENTS.md)

이 파일은 개발 대화가 끊겨도 이어서 작업할 수 있게 하는 **프로젝트별 상시 규칙**이다. 프로젝트 소스 폴더 `MagicGarden/` 아래의 모든 새 코드·아트 작업에 적용한다.

## 0. 작업 시작 전에 반드시 읽기

- [PROJECT_SYNC.md](./PROJECT_SYNC.md): 최신 소스/배포/Notion/Google Drive 참조 위치와 변경 이력
- [VISUAL_MASTER.md](./VISUAL_MASTER.md): 사용자가 직접 승인한 원화 3장과 디자인 품질/하드 룰
- [VISUAL_IMPLEMENTATION_BOARD.md](./VISUAL_IMPLEMENTATION_BOARD.md): 실제 구현, QA 미완료, 작업 우선순위
- `src/button-art-v16.css`: 밝은 버튼 4가지 역할별 구현. `public/assets/ui-v16-*.png` 7종 현재 원화
- [README.md](./README.md), [DEPLOY_PAGES.md](./DEPLOY_PAGES.md): 게임 루프, 빌드/실제 배포 및 도메인

## 1. 가장 중요한 디자인 제약 — SVG 절대 금지

- **SVG 파일, 태그, CSS data URI, SVG 스프라이트, SVG 로고/아이콘, SVG를 PNG로 바꾼 기본 선형 아이콘 모두 최종 게임 그래픽 금지.**
- 새 이미지가 없으면 대신 SVG/도형/이모지를 넣지 말고 **동화풍 PNG/WebP 그림 자산을 먼저 제작**한 뒤 소스에 연결.
- 계곡·건물·흙·작물·캐릭터·마법 솥·알·둥지·몬스터·배경, 모든 기능/하위 탭/작은 스크롤바/버튼까지 하나의 그림책 화풍 유지.
- `npm run build`가 호출하는 `npm run guard`, `guard:dist`를 필수 통과. 검사만으로 'SVG처럼 보이는' 픽토그램을 잡을 수 없으므로 반드시 시각 검수도 수행.

## 2. 기존 소스와 사용자 데이터를 보호

- **공식 소스**: `junl-im/K-city-webgame` → **`main/MagicGarden/`**. 2026-10-28 현재 v16 원화 버튼 커밋 `dc9946bacb1ce0a7075fa025bea2baea946b62c6`에서 계속 진행.
- **배포**: `.github/workflows/magic-garden-pages.yml`의 GitHub 공식 `deploy-pages`. 운영 URL https://junl-im.github.io/K-city-webgame/ . 빌드 성공과 실제 배포 성공 및 화면 QA는 엄격히 구별한다.
- **다른 프로젝트 보호**: `SixtySecondPlayground/`는 별도 서브페이지로 Pages에 함께 포함되지만 독립 콘텐츠이며 함부로 수정하지 않는다.
- **Soul Online 보관**: `archive/soul-online-20261028` GitHub 브랜치. 무단 삭제/원본 복구/레거시 Firebase 변경 금지.
- **저장 데이터 불변**: `gomfox.magic-garden.prototype.v1`, 12칸 밭, 씨앗/열매/정수/알/몬스터, 부화 진행, JSON 내보내기/불러오기. 스키마 변경 시 명시적 마이그레이션과 하위 호환성 확인.

## 3. 개발 중 끊김을 방지하는 동기화 절차

1. 최신 `main` SHA, 지난 GitHub CI와 Pages 배포 상태, Notion/Drive 최신 기록을 먼저 읽는다. 커밋이 앞서 있으면 그 버전을 기준으로 한다.
2. 승인된 디자인 원화를 먼저 확인 → 필요한 새 PNG/WebP를 확보 → 구현과 최소한의 사용자 데이터 보호 테스트를 작성한다.
3. GitHub `main/MagicGarden/` 에 소스·자산·문서를 저장하고 **정확한 커밋 SHA를 기록**한다. 관련 없던 게임/배포 브랜치를 덮지 않는다.
4. CI가 통과하고 **실제 GitHub Pages 공식 배포 Job**이 성공했는지 확인한다. Pages의 원본 SHA와 실제 브라우저 가시성을 다른 단계로 기록한다.
5. [Notion MASTER GAME PLAN](https://app.notion.com/p/406fff243ec981739bfada13ffaad4ef)에 확정/실행/미완료 항목을 기록하고, [Google Docs MASTER GAME PLAN](https://docs.google.com/document/d/1-IeCgJppEqYLXUMu4aMXG1AFIrm2lp_ygXf5kQCKFv8/edit)에 동일한 커밋·변경 요약·원화 저장 위치·테스트 결과를 반영한다.
6. 두 외부 문서의 저장 결과를 **읽어 확인**한다. 세 서비스 간 *상시 자동 동기화는 지원되지 않으며*, 이 절차로 변경할 때마다 수동으로 교차 저장한다. 실패 시 실패한 저장소와 미완료 항목을 명시하고 '동기화 완료'라고 표현하지 않는다.
7. [VISUAL_IMPLEMENTATION_BOARD.md](./VISUAL_IMPLEMENTATION_BOARD.md)의 체크리스트/버전을 갱신한다. 자동화 도구의 권한 승인 창은 앱 자체가 요구할 수 있으므로 사용자가 이미 동의했다는 사실만으로 서비스 인증 프롬프트를 임의 우회하지 않는다.

## 4. 용량·디자인·경험 품질

- 무료 운영, 모바일 세로 320/360/390/430px 우선, 이어서 낮은 가로 화면과 PC, 터치 타깃 44px 이상, safe area/스크롤/키보드·접근성.
- 기존 PNG/WebP 원본은 보존하고 배포는 최적화 파일 우선, 불필요한 GitHub Actions 아티팩트 장기 보관하지 않는다.
- 우클릭/드래그 제한은 게임 영역에서만 적용. 실제 파일 업로드, 텍스트 입력·게임 팝업 스크롤 등 동작이 막히면 안 된다.
- User-approved art 3종 [원본1](https://drive.google.com/file/d/1x5zCG430ZlC6OODD-yanvB8GrH9k1tpg/view) · [원본2](https://drive.google.com/file/d/13nIhAG-PC9r9E1F5R8XPmjzrNm2bvPjq/view) · [원본3](https://drive.google.com/file/d/1CLOZJbvsh2c5NjzoE0S8f9giS4vnXZ_p/view). 수치/퀘스트/레벨/아이템은 시안에 있다고 실제 게임에 없는 기능을 임의로 만들지 않는다.
