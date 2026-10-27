# v6 — stable travel direction / sprite art staging

- The player's direction is selected from the actual movement vector, with 30% axis hysteresis to avoid diagonal flickering.
- A 2x2 WebP file at `public/assets/fox-four-directions-v1.webp` is supported: top left FRONT (down), top right RIGHT, bottom left BACK (up), bottom right LEFT.
- The image is optional. Without the file the previous fox artwork is still playable and is mirrored for left/right. Do NOT claim the four-view art is live before the asset is uploaded and a new site build is published.
- The new atlas must be exactly four equally sized cells, true transparency, consistent foot contact.
- Companion NPCs keep a small hysteresis around patrol turnaround.
- The saved-game key, 12 farm plots, alchemy, hatching, existing main branch and Firebase remain unchanged.
- Art asset is available as a separate handoff file until GitHub binary upload and site redeployment have been confirmed.
