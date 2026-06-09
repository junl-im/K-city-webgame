# 0.30 External Asset Integration Pass

## 적용 목적

0.30은 기존 절차형 샘플 리소스에서 한 단계 넘어가, 사용자가 제공한 무료/샘플 에셋팩을 실제 게임 런타임 구조에 맞춰 정리한 패스입니다.

## 사용/참고한 에셋팩

- PVGames Infernus Free: 지형 질감, 오브젝트, 상자, 횃불, 마법 소품 계열
- LOOT PIXELS Adventure Pack: 장비/아이템 아이콘 계열
- Elven Forest: 마을 건물, 자연물, 카드 배경 계열
- Basic Dungeon Pack Free: 석재/던전 바닥 질감 계열
- 사용자가 제공한 지형 시트 이미지: 눈/바위/겨울 지형 방향성 참고

## 런타임 반영 위치

- `public/assets/soulpack/tiles/*.webp`
- `public/assets/soulpack/props/*.webp`
- `public/assets/soulpack/buildings/*.webp`
- `public/assets/soulpack/items/*.webp`
- `public/assets/soulpack/skills/*.webp`
- `public/assets/soulpack/souls/*.webp`
- `src/assets/cards/*.webp`
- `src/assets/ui/title-bg.webp`
- `src/assets/ui/title-hero.webp`

## 라이선스 주의

PVGames 문서에는 프로젝트 내 사용은 가능하지만 리소스 자체를 독립적으로 재배포하거나 판매하는 것은 금지된다는 취지의 안내가 포함되어 있습니다. LOOT PIXELS는 permissive license 문서가 포함되어 있습니다. 일부 에셋팩은 별도 라이선스 문서가 없거나 상업 이용 전 문의 문구가 있으므로, 공개 배포 전 권리 확인이 필요합니다.

이번 ZIP은 개발용 통합본이며, 최종 공개 저장소에 원본 에셋을 그대로 재배포하는 방식은 피하는 것이 좋습니다.

## 다음 권장 작업

- 에셋 출처별 활성화/비활성화 스위치
- 지역별 타일셋 분리 로딩
- 캐릭터/몬스터 시트를 외주 원화 기준으로 교체
- 아이템 아이콘 프레임을 등급별 아틀라스로 통합
