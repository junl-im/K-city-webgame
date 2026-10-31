# 라니 수비대 v1.0 디자인·게임 UX 자료 조사 (2026-10-31)
© 곰같은여우

## 프로젝트 원화 기준
- 사용자 제공 원화: 2636.png/2642.png (수공 느낌 숲·금속·수정 아이콘); 2637.png (방어 성벽과 단일 숲길 전장); 2640.png (경계 없는 연속 세계지도).
- 현재 GitHub: ForestGuard/art/rani-ui-icons-v04.webp, forest-battleground-v04.webp, forest-worldmap-v05.webp 및 3지역 독자 PNG.
- 새 외부 작품의 그림을 복제·도용하거나 상용 게임 이미지를 그대로 가져오지 않는다.

## 검증한 기술·자산 출처
1. Phaser 3 공식 텍스처 문서: https://docs.phaser.io/phaser/concepts/textures
   - CanvasTexture로 작은 무기 모양을 일회 제작·재활용. 모든 발사에 텍스처 신규 생성하지 않음.
2. Phaser 3 공식 Graphics 성능 가이드: https://docs.phaser.io/phaser/concepts/gameobjects/graphics
   - 복잡한 동적 Graphics 남발 주의, 고정 오브젝트는 텍스처로 굳히는 방식 권장.
3. Phaser 3.88.2 카메라: https://docs.phaser.io/api-documentation/3.88.2/class/cameras-scene2d-camera
   - 화면 흔들림·플래시 기반 피격 피드백. 이동·줌 조작 강제 없음.
4. Kenney Fantasy UI Borders (CC0): https://kenney.nl/assets/fantasy-ui-borders
   - 140개 2D 판넬·데코 원칙 참고. 스타일 분석만; 이번 패치에 외부 파일 복사 없음.
5. Kenney UI Pack Adventure (CC0): https://kenney.nl/assets/ui-pack-adventure
   - 버튼·패널·슬라이더 간 계층감 참고. 이번 패치에 외부 파일 복사 없음.
6. MIT Phaser Tower Defense 사례: https://github.com/Zizzs/phaser-tower-defense
   - 게임 화폐·피격 반응·스테이지 조작 사례 구조 비교. 이번 패치 코드 복사 없음.
7. MDN prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
   - 애니메이션 절제 선택권 유지.

## 적용 설계 매핑
| 영역 | 시각 언어 | 조작/가독성 |
| --- | --- | --- |
| 이야기 패널 | 따뜻한 양피지, 나뭇잎 색 정보 버튼 | 짧은 문장과 명확한 정찰 CTA |
| 지도 | 원화 한 장, 짙은 목간판과 고유 핀 | 클릭 12개 순서·잠금 상태 유지 |
| 전투 HUD | 어두운 목재·청동·금빛 | 귀환/속도/일시정지 개별 형태·색 대비 |
| 성벽 | 석재 판재·수평 체력 바 | 숫자와 상태, 30% 이하 경고 |
| 용병/스킬 | 목재 초상판, 진화=새싹, 스킬=금속 | 선택 상태/쿨타임 식별 |
| 카드/모달 | 일반=양피지, 희귀=자수정, 조합=황동 | 모바일 3지선다·닫기/복귀 유지 |
| 투사체 | 화살/창/수정/폭탄/진화 빛화살 | 식별 가능한 궤적과 충돌 원 |

## 다음 우선순위 (아직 미구현)
1. 실제 관절/파츠로 분리한 6~8프레임 공격·달리기·피격·승리 캐릭터 시트.
2. 스테이지별 몬스터 진입 출구·도개교·포자·석벽 균열 등 배경과 연동되는 지역 기믹.
3. 보스 체력바와 개별 보스 초상·예고 반경·경고 사운드, 모바일 진동 옵션.
4. 320px Android 및 저성능 렌더 성능 계측, 보스 3종 전체 완주와 저장 복귀.
5. HUD/스킬 사운드 자산은 사용자 소유 원음 또는 라이선스 명확한 자산만 신규 확보.
