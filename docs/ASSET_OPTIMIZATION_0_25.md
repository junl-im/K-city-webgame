# 0.25 Asset Optimization & Loading Pass

## 목표

0.24에서 비주얼 리소스가 크게 늘어나면서 모바일 첫 로딩과 사냥터 진입 시간이 길어질 수 있었다. 0.25는 고해상도 2.5D 비주얼을 유지하면서 웹게임에 맞게 리소스 전달 방식을 정리한 패스다.

## 적용 사항

- 런타임 리소스를 WebP 중심으로 교체
- 기존 PNG/JPG와 중복되는 WebP 대응 파일은 제거
- `public/assets/soulpack`은 외부 교체용 런타임 팩으로 유지
- `src/assets/2p5d`는 번들 fallback 팩으로 유지
- 사냥터 진입 시 전체 몬스터 시트를 모두 읽지 않고, 현재 사냥터에 필요한 몬스터 시트와 현재 캐릭터 시트 위주로 로딩
- SFX는 매번 새 `Audio` 객체를 만들지 않고 3개짜리 오디오 풀로 재사용

## 에셋 교체 규칙

실제 외주/AI 프리렌더 원본을 교체할 때는 다음 파일명과 크기 규격을 유지한다.

- 캐릭터: `public/assets/soulpack/characters/*.webp`
- 몬스터: `public/assets/soulpack/monsters/*.webp`
- 타일: `public/assets/soulpack/tiles/*.webp`
- 프랍/건물: `public/assets/soulpack/props/*.webp`, `public/assets/soulpack/buildings/*.webp`
- 카드/아이콘/영혼/무기: `public/assets/soulpack/cards|ui|souls|weapons/*.webp`

## 권장 압축

- 캐릭터/몬스터 시트: WebP quality 72~78
- 카드/초상/타이틀: WebP quality 80~86
- 타일/프랍: WebP quality 78~82
- UI 아이콘: WebP 또는 SVG

## 최적화 명령

```bash
python scripts/optimize_assets.py
python scripts/optimize_assets.py --delete-originals
```

`--delete-originals`는 코드의 참조 경로가 `.webp`로 바뀐 뒤에만 사용한다.
