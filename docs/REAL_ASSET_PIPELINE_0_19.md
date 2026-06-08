# Soul Online 0.19 Real Asset Pipeline

0.19부터 게임은 `public/assets/soulpack`의 런타임 에셋을 먼저 로드하고, 실패하면 `src/assets`에 포함된 번들 fallback으로 되돌아갑니다.

## 왜 public 런타임 에셋인가

Vite 번들에 직접 묶인 이미지는 코드 빌드가 필요합니다. 반면 `public/assets/soulpack`은 배포 후에도 파일명만 유지하면 에셋을 교체할 수 있습니다. 실제 상용급 2.5D 에셋을 붙일 때 가장 안전한 방식입니다.

## 교체 우선순위

1. 캐릭터 6종 시트
2. 몬스터 5종 시트
3. 필드 타일 8종
4. 프랍 4종 이상
5. BGM 4곡
6. SFX 샘플 팩

## 현재 포함된 샘플

- 타일/프랍은 PNG 기반 샘플 팩으로 교체되었습니다.
- BGM은 OGG 루프 파일로 포함되었습니다.
- 캐릭터/몬스터는 0.18 시트를 public 런타임 팩에도 복사해두었습니다. 다음 단계에서 이 파일들을 원화 기반 프리렌더 시트로 교체하면 됩니다.

## 필요한 실제 제작물

캐릭터 1종당 최소 작업:

- 남/여 분리
- 8방향
- idle, walk, run, attack, hit, death, skill
- 128x192 프레임 기준 48열 x 8행
- PNG 또는 WebP atlas

몬스터 1종당 최소 작업:

- 8방향
- idle, walk, run, attack, hit, death, skill
- 128x160 프레임 기준 48열 x 8행

## 다음 패치 권장

0.20은 `SFX Pack + Combat Feel Pass`가 적합합니다. 실제 공격음, 피격음, 스킬 폭발음, UI 클릭음, 아이템 획득음을 파일 기반으로 바꾸고, 전투 카메라 흔들림/히트스톱/스킬 충돌 연출을 더 정리합니다.
