# 곰같은여우의 꽃맞고 · GitHub 기준 소스

귀여운 동물 친구들이 등장하는 무료 싱글 맞고 웹게임입니다. 모바일 우선으로 제작하며, 게임머니는 실제 현금과 교환되지 않습니다.

**자체 창작 소스·캐릭터·일러스트·UI/UX 및 지식 자산의 권리자: 곰같은여우.** 공개 저장소는 무단 사용 허가가 아닙니다. 세부 범위와 외부 MIT 코드 예외는 [저작권 및 지식 자산 소유권 고지](./OWNERSHIP.md)를 확인하세요.

## 관리 원칙

- 이 폴더 `FlowerMatgo/`가 앞으로 **개발 기준본**입니다. `MagicGarden/` 및 `SixtySecondPlayground/`와 코드를 공유하거나 덮어쓰지 않습니다.
- 2026-10-28 기준 GitHub 이식 원본은 기존 꽃맞고 Sites 소스 커밋 `14f967f0320ded0194334cefae12907e4a8209f4`입니다.
- 게임 화면의 공식 화투 그림은 `public/assets/hwatu-character-original-v19.webp` 하나입니다. 과거 비교용 `hwatu-strict90-labeled-atlas-v3.webp`는 **표시용으로 연결하지 않습니다**. 새로운 그림도 별도의 사용자 승인 전에는 기본 화투를 바꾸지 않습니다.
- 재제작에 필요한 원본은 `artwork/concepts/hwatu-rectified-*-v19.png` 네 장만 이식했습니다. 오래된 시안과 임시 이미지는 GitHub 용량과 오적용 위험을 줄이기 위해 가져오지 않았습니다.
- SVG 자산을 사용하지 않으며, 게임판과 버튼은 손그림 래스터(WebP/PNG) 디자인을 유지합니다. 상용 맞고의 이미지·음원을 복제하지 않습니다.
- 첫 패 섞기, 선 정하기, 매칭 패 착지 후 뒤집기·획득, 20초 턴 제한, 자동모드, 폭탄·뻑·따닥 등 게임 규칙을 기존대로 유지합니다.

## 개발 및 검증

Node.js 22 권장:

```bash
cd FlowerMatgo
npm ci
npm test
npm run build
npm run dev
```

`dist/`와 `node_modules/`는 Git에 넣지 않습니다. `npm run build`로 빌드된 정적 파일을 배포에 사용합니다.

## 운영 및 배포

- 기존 Sites 플레이 주소: https://gomfox-flower-matgo.x7x8.chatgpt.site
- **GitHub Pages 공개 주소:** https://junl-im.github.io/K-city-webgame/FlowerMatgo/ (Pages 워크플로 배포 성공 후 사용 가능)
- `main`의 `.github/workflows/magic-garden-pages.yml`이 꽃맞고를 테스트하고 전용 경로에 함께 배포합니다. 마법정원·60초 놀이터·물리도감의 기존 주소는 그대로 유지됩니다.
- 기존 비공개 Sites 운영 주소 및 접근 권한은 변경하지 않습니다. GitHub는 이제 개발·배포 기준본입니다.
- 기존 노션 MASTER GAME PLAN과 구글드라이브 개발일지는 계속 유지합니다. 확정 설계/개발 기록은 그곳에도 동기화합니다.

## 코드 및 자산 출처

게임 규칙/AI에는 [itsent-lab/hwatu](https://github.com/itsent-lab/hwatu) MIT 코드가 포함됩니다. 해당 저작권 및 허가문은 `VENDOR-HWATU-LICENSE.txt`에 보존했습니다. 캐릭터 카드와 배경은 프로젝트용 래스터 원화입니다.
