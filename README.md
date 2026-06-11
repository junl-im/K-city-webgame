# Soul Online Alpha 1.01

Mobile-first 2.5D web MMORPG prototype. Alpha 1.01 focuses on field performance, render budget control, and mobile combat polish.

## Apply

```bash
npm install
npm run build
firebase deploy --only hosting
```

## Alpha 1.02

- User-provided dark fantasy UI/icon kit integrated once under `public/assets/ui/fantasy/102/`.
- Added runtime UI asset bridge `src/ui/soulAssetKit102.ts`.
- Added `src/styles/alpha102.css` for icon/button/panel/field HUD polish.
- Version bumped to `1.02.0`; PWA cache bumped to `soul-online-alpha-v1-02`.
