# 라디오 음원 배포 상태 (2026-10-29)

- 8집.zip (35곡) 및 9집.zip (20곡) 원본은 개발 작업 환경에 확보됨.
- GitHub: AI-Music-Radio/ 폴더에 정적 플레이어 배포 소스 저장. 음원 원본을 공개 저장소에 업로드하지 않음.
- Vercel: gomfox-ai-music-radio.vercel.app 정적 플레이어 배포 완료. 현재 tracks.json과 실제 MP3 서버 URL 미연결.
- Cloudflare R2: 사용자 계정/버킷 없음. 연결된 Cloudflare 관리 도구도 없음.
- Vercel Blob: 팀 team_ZHMfInB8bauh2oaAS27z5ZSl에서 `gomfox-radio-audio` Blob 저장소 생성 시도했으나 HTTP 403 forbidden (권한 부족). 생성되지 않음.
- 55곡은 공개 웹에서 아직 재생할 수 없음. 서버 저장소 접근 권한과 오디오 업로드 경로 확보 필요.

## 다음 단계
1. 음원 호스팅 계정 및 버킷/Blob 생성 권한 확보.
2. 원본 MP3 업로드 후 HTTPS 공개 오디오 URL/Range/CORS 확인.
3. 메타데이터 기반 tracks.json 생성 및 배포.
4. PC/모바일 실기기에서 재생·곡 전환·백그라운드 동작 검증.

음원 배포 권리 및 과금 확인 후 진행. 사용자 개인 실명 공개 금지. 표시 브랜드는 곰같은여우.
