# 소울 온라인 Alpha 0.24 Sample Visual Integration Pass

업로드된 샘플 에셋의 어두운 판타지 2.5D 스타일을 기준으로 타이틀 화면, 캐릭터/몬스터 스프라이트 시트, 카드/초상 리소스를 실제 게임 런타임 규격에 맞춰 교체한 버전입니다.

## 0.24 변경점

- 샘플 에셋 기반 타이틀 배경/타이틀 캐릭터 이미지 적용
- 첫 시작 인터페이스를 포스터형 모바일 RPG 화면으로 재정리
- 검혼/영술사/성휘사 남녀 캐릭터 시트를 샘플 화풍 기반으로 재생성
- 몬스터 시트를 샘플 다방향 몬스터 이미지 기반으로 매핑
- 카드/초상 이미지 교체
- public/assets/soulpack/user-sample-manifest.json 추가
- 기존 런타임 시트 규격 유지: 8방향 x 48프레임 컬럼

## 실행

```bash
npm ci --no-audit --no-fund
npm run build
```

## 버전

- 앱 버전: `0.24.0`
- 저장 버전: `SAVE_VERSION = 20`
- PWA 캐시: `soul-online-alpha-v0-24`
