# 꽃맞고 개발 변경 기록

## 2026-10-29 · GitHub Pages 독립 배포 및 권리 고지

- 기존 Pages 워크플로에 꽃맞고 Vite 빌드·회귀 테스트·`FlowerMatgo/` 배포 경로를 추가해 다른 세 사이트를 그대로 보존
- 공식 v19 화투패 WebP와 v18 바닥 매트의 배포 포함 여부 및 Vite 절대 경로 변환을 검증
- `OWNERSHIP.md` 신설, 임현준(곰같은여우)의 자체 창작 소스와 기타 지식 자산 소유권 고지. 외부 MIT 코드의 별도 권리 유지
- 코드/게임 규칙/디자인 에셋의 실제 내용은 변경하지 않음. 배포 결과는 GitHub Actions에서 확인 필요

## 2026-10-29 · 모바일 특별패 접촉 연출

- 폭탄: 연속으로 내려놓는 패마다 실제 착지 지점에 짧은 손그림 꽃잎 도장 연출 추가
- 따닥: 짧은 간격으로 좌우 두 번 접촉하는 효과 추가
- 뻑: 한 번 내려갔다 튀어 오르는 반동 효과 추가
- 모든 효과는 기존 `flower-special-burst-v22.webp` 래스터 자산을 재사용하며, SVG/새 카드 디자인을 만들지 않음
- 효과는 각 턴 안에 사라지고, `prefers-reduced-motion`에서는 생략. 점수·패 분배·AI·자동모드 로직 변경 없음
- 37개 테스트 파일, 186개 테스트 전부 통과. Vite 빌드 성공

## 2026-10-28 · GitHub 이식 기준점

- 기존 사이트 소스 커밋 `14f967f0320ded0194334cefae12907e4a8209f4`를 `K-city-webgame/FlowerMatgo/`에 이식
- GitHub PR [#1](https://github.com/junl-im/K-city-webgame/pull/1) 병합, 이식 당시 183개 테스트 통과
- 공식 화투패는 `public/assets/hwatu-character-original-v19.webp`, 게임 UI는 손그림 PNG/WebP 자산 기준
- 기존 Sites 플레이 URL/접근 권한은 변경하지 않음. GitHub Pages 배포는 별도 단계
