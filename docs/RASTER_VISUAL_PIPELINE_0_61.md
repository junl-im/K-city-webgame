# Alpha 0.61 Raster Visual Pipeline Pass

0.61은 0.60에서 시작한 키비주얼 리부트를 이어서, 활성 타이틀/마을/UI 표현을 WebP 중심으로 정리한 패치다.

## 원칙

- 신규 활성 비주얼은 SVG 장식이 아니라 WebP/PNG/JPG 기반으로 구성한다.
- 타이틀 화면은 고퀄리티 키비주얼 한 장을 중심으로 보여준다.
- 마을 화면은 배경 일러스트 안의 실제 건물/성/마을 포인트를 기준으로 핫스팟을 배치한다.
- UI는 CSS 색상 박스만 쓰지 않고 패널/버튼/슬롯 텍스처를 사용한다.
- 카카오톡 인앱 브라우저와 모바일 렌더링을 고려해 WebP 압축을 유지한다.

## 추가 에셋

- `title-keyvisual-061.webp`
- `title-keyvisual-061-blur.webp`
- `title-landscape-061.webp`
- `town-keyvisual-061.webp`
- `town-keyvisual-061-blur.webp`
- `ui-panel-glass-061.webp`
- `ui-button-sky-061.webp`
- `ui-slot-sky-061.webp`
- `ui-location-pin-061.webp`
- `ui-hotspot-*-061.webp`

## 적용 범위

- 시작 화면 배경/버튼
- 마을 배경/핫스팟
- 마을 패널/버튼
- 가방/상세/슬롯 계열 UI 텍스처

## 다음 과제

- 필드 바닥/소품 SVG도 장기적으로 WebP 스프라이트로 교체
- 마을 전용 신규 고퀄리티 배경 원화 확보
- 직업별 타이틀 키비주얼 분기
- 타격/스킬 이펙트 스프라이트 고품질화
