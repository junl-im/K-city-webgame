# Soul Online alpha 1.02 - Asset Kit Integration & UI Polish

## Goal
Alpha 1.02 imports the user-provided dark fantasy UI kit and integrates the usable assets into the live UI without increasing runtime request pressure too much.

## Imported assets
- Source archives inspected: 6 zip files.
- Extracted images found: 690.
- Exact duplicate image files: 554 duplicate entries.
- Unique usable images: 136.
- Integrated complete kit once under `public/assets/ui/fantasy/102/ui-kit/`.
- Added shortcut aliases under `public/assets/ui/fantasy/102/shortcuts/` for CSS/runtime use.

## Applied in game
- Global asset skin class: `fantasy-ui-102`, `asset-kit-102`.
- Runtime bridge: `src/ui/soulAssetKit102.ts`.
- Visual CSS layer: `src/styles/alpha102.css`.
- Menu/buttons receive icon styling by inferred label/class.
- Common panels receive dark fantasy frame treatment.
- Field HUD/control positions receive another mobile safe-area pass.
- Close buttons are unified with the provided dark fantasy close button asset.
- Inventory/card/skill slots receive the imported slot frame style.

## Performance choices
- Icons are primarily handled through the uploaded `spritesheet_256x192.png` instead of loading dozens of individual icons.
- Only critical UI assets are preloaded.
- Non-critical images receive `loading="lazy"` and `decoding="async"`.
- `asset-lite-102` is applied automatically on narrow, low-memory, or data-saver devices.
- Heavy field sprites remain the largest cost and should be split into low/high quality atlases in the next pass.

## QA checklist
1. Title screen should still show one start button only.
2. Town menu buttons should show consistent fantasy icon/button styling.
3. Field HUD, skill dock, potion dock, attack button, and joystick should remain inside safe-area.
4. Close buttons should no longer look like plain text/buttons.
5. Low-end device mode should reduce shadows/filters without breaking controls.
