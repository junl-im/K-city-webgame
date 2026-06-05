# K-City Innerworld Static Hotfix

GitHub Pages에서 빈 화면이 나는 상황을 피하기 위한 무빌드 정적 버전입니다.

## 업로드

이 폴더의 파일을 GitHub 저장소 루트에 그대로 올립니다.

필수 파일:

- index.html
- src/main.js
- src/styles.css
- assets/icon.svg
- firestore.rules
- firestore.indexes.json
- firebase.json

GitHub Pages 설정:

- Settings → Pages
- Source: Deploy from a branch
- Branch: main
- Folder: /root

주소:

https://junl-im.github.io/K-city-webgame/

## Firebase

Firestore Rules 배포:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project k-city-webgame
```

Authentication에서 Email/Password, Google 로그인 제공업체를 켜야 로그인 기능이 동작합니다.
