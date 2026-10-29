# 곰같은여우 AI MUSIC RADIO — 카드 없는 무료 호스팅

## 결정 (2026-10-29)
- **사이트와 55곡 오디오 호스팅:** Cloudflare Pages Free, Direct Upload (ZIP/폴더 업로드).
- **버전 관리:** GitHub `junl-im/K-city-webgame/AI-Music-Radio`. 다른 웹게임과 분리.
- **R2/카드:** 사용하지 않음. Vercel 신규 배포도 필요 없음.
- **배포 파일:** `곰같은여우-AI-MUSIC-RADIO-55곡-Cloudflare-Pages.zip` (오디오 55 + 곡별 표지 55 + `index.html` + `tracks.json` + `_headers` + `404.html`).
- **공개 URL:** 사용자가 Pages 프로젝트를 생성한 뒤 표시되는 `*.pages.dev` 주소. 아직 배포 전.
- **확인한 파일 수:** 55곡(8집 35 + 9집 20), 표지 55, 총 재생시간 12050.8초, MP3 최대 약 9.39MiB < Pages 25MiB 파일 제한.

## 사용자에게 필요한 단 한 번의 배포
1. Cloudflare 로그인 → Workers 및 Pages → 애플리케이션 만들기.
2. Git 연결이 아닌 **직접 업로드 / 드래그 앤 드롭** 선택. 프로젝트 이름 `gomfox-ai-music-radio`.
3. 전달한 **통합 ZIP** 파일을 그대로 업로드 → 사이트 배포. ZIP이 업로드 오류를 내면 압축을 풀어 폴더 전체를 업로드.
4. 생성된 `*.pages.dev` 주소에서 ▶ 라디오 듣기 테스트.

Git 연동형 Pages 프로젝트와 Direct Upload 프로젝트는 별개의 배포 방식이다. **Direct Upload로 생성한 프로젝트는 나중에 Git 연동으로 변경할 수 없으므로** 자동 배포가 필요하면 새 프로젝트를 생성한다.

## 제한 및 주의
- Cloudflare Pages는 정적 사이트용 서비스다. 대규모 음악 스트리밍 또는 과도한 전송량의 영구 무제한 무료 제공을 보장하지 않는다.
- Cloudflare Pages는 현재 HTTP Range 요청에 부분 콘텐츠(206) 대신 200으로 응답할 수 있어 곡 중간부터 시작하는 동기식 재생에서 버퍼링이 발생할 수 있다.
- 무료 배포 전에는 음원 공개 배포 권리 확인 필요.
- 카드/토큰/개인 실명은 소스나 README, 공개 사이트에 저장하지 않는다.
- MP3와 ZIP 원본은 Git에 커밋하지 않는다. 음원은 개별 배포 ZIP으로 관리한다.

공식 자료:
https://developers.cloudflare.com/pages/get-started/direct-upload/
https://developers.cloudflare.com/pages/platform/limits/
https://developers.cloudflare.com/pages/configuration/serving-pages/


## Cloudflare 오류: Invalid manifest: Manifest path must be URI encoded (2026-10-29)

Cloudflare의 자산 배포 과정에서 경로 URI 인코딩 오류가 발생할 수 있음. 업로드 원본 ZIP의 경로 114개는 영문/숫자/기호(안전한 문자)만 포함함을 검사했고, 파일 무결성도 검증. 원인 확정 전이므로 한글 ZIP **외부 파일명** 또는 올바르지 않은 업로드 화면(Workers 자산 업로드 대신 Pages 직접 업로드), 대용량 업로드 오류를 각각 분리해 점검해야 함.

1. ZIP 이름을 `gomfox-radio-pages-55tracks-v3.zip`처럼 **영문**으로 변경해서 시도. ZIP 내부 폴더가 아닌 `index.html`이 최상단에 있어야 함.
2. 먼저 `gomfox-radio-pages-2tracks-test.zip` (2곡, 약 9.3MB)으로 같은 Cloudflare Pages 업로드 화면에서 테스트. 정상적이라면 55곡 본편으로 업데이트.
3. 반복 실패하면 Windows에서 ZIP 압축을 풀고, **압축 해제한 전체 폴더**를 Pages의 직접 업로드 영역에 끌어 넣어 ZIP 업로드 단계 우회.
4. 화면 경로를 확인: Cloudflare의 **Workers 및 Pages → Pages → 직접 업로드(드래그 앤 드롭)**. Workers의 일반 정적 자산 업로드와 혼동 주의.
5. 그래도 같은 오류면 Cloudflare의 배포 API 문제일 수 있음. Wrangler CLI의 `pages deploy <folder> --project-name <project>`를 대안으로 검토하고, 배포 ID/화면 오류를 수집.

참조: [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) 및 [Cloudflare workers-sdk Issue #14461](https://github.com/cloudflare/workers-sdk/issues/14461). 지원 측의 최종 원인 확인 없이 특정 단일 원인으로 단정하지 말 것.
