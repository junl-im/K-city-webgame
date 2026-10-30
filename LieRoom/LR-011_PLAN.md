# LieRoom LR-011 — evidence art and progressive hints

Status: implementation plan; production code unchanged.

- Preserve LR-010 and existing cases, character art and local saves.
- SVG prohibited for all UI assets, icons and backgrounds.
- Author credit: 곰같은여우.
- Export original nine-object evidence atlas as optimized PNG/WebP, validate 3x3 slicing and object identity.
- Integrate case-specific evidence art with safe fallbacks.
- Implement optional three-stage progressive hints without revealing the culprit or changing evidence/verdict state.
- Verify desktop and mobile layout, focus, toggles, overflow, right-click and drag suppression.
- Run smoke tests and manually verify both cases before merging.
- GitHub is code source of truth; Notion specifications and Drive backup should be synced after verification.
