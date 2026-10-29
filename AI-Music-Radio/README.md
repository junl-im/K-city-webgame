# 곰같은여우 AI MUSIC RADIO

카드 등록 없는 Cloudflare Workers 정적 자산 직접 배포를 목표로 하는 55곡(8집 35곡 + 9집 20곡) 24시간 웹 라디오.

- 모든 저작권/브랜드 표시: **곰같은여우**. 개인 실명 공개 금지.
- 실제 음원은 GitHub에 올리지 않고 Cloudflare Pages Direct Upload로 **사이트 ZIP과 함께** 업로드.
- `build_cloudflare_pages.py`: 보유한 `8집.zip` 및 `9집.zip`을 읽어 MP3 55곡, 표지 55개, 편성표 `tracks.json`, 사이트 소스를 하나의 배포 ZIP으로 패키징.
- 소스 `index.html`은 개인 PC 폴더 선택 없이 MP3 주소에서 재생하고 동일한 기준 시각에 맞추어 곡/진행률/다음 곡을 표시.
- **2026-10-29 현재 배포 상태:** 카드 없는 통합 ZIP 제작 및 브라우저 로컬 재생 테스트 완료. Cloudflare Pages 계정에 최종 ZIP 직접 업로드는 아직 미완료. 기존 Vercel 사이트는 과거 테스트 버전으로 새 Pages 공개 사이트를 대체하지 않음.

## v4 안정화 패치 (2026-10-29)

- 버전 v3에서 1초마다 방송 시각과 오디오 위치를 비교하여 `audio.currentTime`을 반복적으로 이동시킨 것이 끊김을 유발할 수 있어 해당 자동 seek/동기화 동작 삭제.
- 새 재생은 시간상 현재 편성된 **곡을 처음부터** 들으며, 한 곡이 끝나면 다음 곡으로 자연스럽게 이동함. 즉, 모든 청취자가 정확히 같은 초 단위 재생 위치를 듣는 방식은 아님.
- 55곡을 128kbps MP3로 인코딩하여 원본 배포 패키지 약 262MiB에서 **약 184.6MiB**로 줄임. 총 음악 길이 3시간 20분 51초 유지.
- 음원 URL에 `-v4` 접미사를 달아 이전 브라우저 오디오 캐시와 충돌 방지.
- PC Chromium에서 실제 MP3 9초 재생, 기기 시각 150초 이동 시 오디오 재생 유지, 일시정지/재개 및 2초 테스트곡의 자연스러운 자동 곡 전환 검증.
- **새 ZIP은 작성했지만 Cloudflare 계정에 자동 배포하지는 않았음.** 기존 `gomfox-ai-music-radio.mcwoogi.workers.dev`의 Workers 프로젝트에서 새 배포를 눌러 ZIP을 교체해야 함.
- Cloudflare Workers는 실시간 방송 서버가 아니라 정적 MP3 호스팅이므로, 고동시접속/실시간 동일 위치 송출/전용 스트리밍을 보장하지 않음.

## 최초 설정

신규 계정의 경우 Cloudflare 로그인 → Workers 및 Pages → Workers 정적 자산 직접 업로드. 이미 생성된 `gomfox-ai-music-radio` 프로젝트에서는 상단 **새 배포**를 눌러 v4 ZIP을 업로드하면 됨. 기존 프로젝트 및 workers.dev 주소 유지. 직접 업로드 프로젝트는 나중에 Git 자동 연동으로 변경할 수 없으므로, 자동 배포가 필요할 때는 새 프로젝트 생성 필요.

문서: [CLOUDFLARE_PAGES_NO_CARD.md](./CLOUDFLARE_PAGES_NO_CARD.md)

## 빌드

```bash
python -m pip install mutagen pillow
# ffmpeg 설치 후
python build_cloudflare_pages.py
```

음악 ZIP 두 개를 스크립트와 같은 폴더에 둬야 함. 배포 ZIP과 오디오는 Git에 커밋하지 않음.

## 안전성과 한계

- Cloudflare Pages Free의 개별 파일 크기 제한은 25MiB. 현재 가장 큰 MP3는 약 9.39MiB.
- Cloudflare Pages는 요청한 오디오 파일 전체를 반환할 수 있어 중간 시점 재생시 버퍼링이 발생할 수 있음.
- 과도한 스트리밍 트래픽에는 적합하지 않을 수 있으므로 실 서비스 트래픽을 모니터링.
- AI 음원 및 원곡 커버의 공개 송출/배포 권리와 음악 플랫폼 라이선스를 사전 확인.
- 이 폴더 이외의 다른 웹게임은 변경하지 않음.
