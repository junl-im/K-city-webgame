# 소울 온라인 Alpha 0.25 Asset Optimization & Loading Pass

0.24에서 적용한 샘플 기반 2.5D 비주얼 리소스를 모바일 웹게임 기준으로 더 가볍게 로딩하도록 정리한 버전입니다.

## 0.25 변경점

- PNG/JPG 기반 샘플 리소스를 WebP 중심으로 변환
- 캐릭터/몬스터/카드/초상/필드 프랍/타일/건물 리소스 경로를 WebP로 교체
- 원본 PNG/JPG 중 WebP 대응 파일이 있는 항목은 제거하여 소스/배포 용량 절감
- 사냥터 진입 시 현재 직업과 현재 사냥터 몬스터에 필요한 시트만 우선 로딩
- 사냥터 로딩 전환 문구에 에셋 로딩 진행도 표시
- SFX를 매번 새로 생성하지 않고 작은 오디오 풀로 재사용
- 에셋 최적화 스크립트 추가: `scripts/optimize_assets.py`
- 에셋 최적화 문서 추가: `docs/ASSET_OPTIMIZATION_0_25.md`

## 실행

```bash
npm ci --no-audit --no-fund
npm run build
```

## 버전

- 앱 버전: `0.25.0`
- 저장 버전: `SAVE_VERSION = 21`
- PWA 캐시: `soul-online-alpha-v0-25`
