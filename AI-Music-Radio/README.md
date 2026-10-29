# 곰같은여우 AI MUSIC RADIO

카드 등록 없는 Cloudflare Pages Free 직접 배포를 목표로 하는 55곡(8집 35곡 + 9집 20곡) 24시간 웹 라디오.

- 모든 저작권/브랜드 표시: **곰같은여우**. 개인 실명 공개 금지.
- 실제 음원은 GitHub에 올리지 않고 Cloudflare Pages Direct Upload로 **사이트 ZIP과 함께** 업로드.
- `build_cloudflare_pages.py`: 보유한 `8집.zip` 및 `9집.zip`을 읽어 MP3 55곡, 표지 55개, 편성표 `tracks.json`, 사이트 소스를 하나의 배포 ZIP으로 패키징.
- 소스 `index.html`은 개인 PC 폴더 선택 없이 MP3 주소에서 재생하고 동일한 기준 시각에 맞추어 곡/진행률/다음 곡을 표시.
- **2026-10-29 현재 배포 상태:** 카드 없는 통합 ZIP 제작 및 브라우저 로컬 재생 테스트 완료. Cloudflare Pages 계정에 최종 ZIP 직접 업로드는 아직 미완료. 기존 Vercel 사이트는 과거 테스트 버전으로 새 Pages 공개 사이트를 대체하지 않음.

## 최초 설정

Cloudflare 로그인 → Workers 및 Pages → 애플리케이션 만들기 → Direct Upload(직접 업로드) → ZIP 또는 전체 폴더 업로드. 프로젝트 이름은 `gomfox-ai-music-radio` 제안. 직접 업로드 프로젝트는 나중에 Git 자동 연동으로 변경할 수 없으므로, 자동 배포가 필요할 때는 새 프로젝트 생성 필요.

문서: [CLOUDFLARE_PAGES_NO_CARD.md](./CLOUDFLARE_PAGES_NO_CARD.md)

## 빌드

```bash
python -m pip install mutagen pillow
python build_cloudflare_pages.py
```

음악 ZIP 두 개를 스크립트와 같은 폴더에 둬야 함. 배포 ZIP과 오디오는 Git에 커밋하지 않음.

## 안전성과 한계

- Cloudflare Pages Free의 개별 파일 크기 제한은 25MiB. 현재 가장 큰 MP3는 약 9.39MiB.
- Cloudflare Pages는 요청한 오디오 파일 전체를 반환할 수 있어 중간 시점 재생시 버퍼링이 발생할 수 있음.
- 과도한 스트리밍 트래픽에는 적합하지 않을 수 있으므로 실 서비스 트래픽을 모니터링.
- AI 음원 및 원곡 커버의 공개 송출/배포 권리와 음악 플랫폼 라이선스를 사전 확인.
- 이 폴더 이외의 다른 웹게임은 변경하지 않음.
