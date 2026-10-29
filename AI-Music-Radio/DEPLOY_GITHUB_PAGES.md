# GitHub Pages + Cloudflare R2 전환

**목표:** GitHub에 사이트 코드만, R2에 55곡 MP3, GitHub Pages에서 공개 재생.

1. Cloudflare 계정을 생성하고 R2 버킷을 생성한다. R2 API 토큰 및 공개 HTTPS 주소를 준비한다.
2. 로컬에서 `pip install boto3 mutagen` 실행. 8집.zip, 9집.zip과 upload_r2.py를 같은 디렉터리에 두고 R2 환경변수 5개를 설정한다.
3. `python upload_r2.py`를 실행하면 음원 55곡 업로드 및 tracks.json이 생성된다.
4. 생성된 tracks.json을 `AI-Music-Radio/tracks.json`에 배포한다. GitHub에는 **오디오 파일, 토큰, 비밀번호를 넣지 않는다**.
5. **주의: 기존 K-city-webgame 저장소에서 Pages가 이미 사용 중이라면 새 Pages 워크플로는 기존 사이트를 대체할 수 있다.** Pages 설정을 먼저 확인하고 전용 저장소로 분리하거나 기존 Pages의 하위 경로에 합치는 방법을 선택한다.
6. GitHub Pages 설정의 Source와 배포 URL을 확인한 후 실제 재생, CORS, HTTP Range, 모바일 동작을 테스트한다.

**현재:** Cloudflare 계정/버킷 생성은 미완료. 연결된 Cloudflare 관리 도구가 없어 사용자 계정 생성은 대행할 수 없음. 공개 음원 권리와 R2 과금 조건 확인 필요.
