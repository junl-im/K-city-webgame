# v6 — stable travel direction / sprite art staging

- The player's direction is selected from the actual movement vector, with 30% axis hysteresis to avoid diagonal flickering.
- A 2x2 WebP file at `public/assets/fox-four-directions-v1.webp` is supported: top left FRONT (down), top right RIGHT, bottom left BACK (up), bottom right LEFT.
- The image is now committed at `public/assets/fox-four-directions-v1.webp` (512x512). The previous fox artwork remains a safe fallback if the image fails to load. A successful GitHub build does NOT mean the separately hosted site has been republished.
- The new atlas must be exactly four equally sized cells, true transparency, consistent foot contact.
- Companion NPCs keep a small hysteresis around patrol turnaround.
- The saved-game key, 12 farm plots, alchemy, hatching, existing main branch and Firebase remain unchanged.
- The art asset is now in GitHub and also backed up on Google Drive. The account-only Sites preview is still v5 until explicitly rebuilt and redeployed.
