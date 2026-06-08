# 소울 온라인 2.5D Asset Slots

Alpha 0.6 keeps the current SVG prototype assets running, but adds a stable folder contract for high-quality 2.5D replacements.

## Target export style

- Format: WebP or PNG with transparent background
- Camera: isometric / three-quarter 2.5D, top-front light
- Character base size: 512x512 per frame
- Monster base size: 512x512 per frame, boss 1024x1024
- Tile size: 256x128 diamond tile
- Prop size: variable, transparent background, anchor near bottom center

## Runtime replacement plan

Drop final files into these folders, then update `src/data/assetManifest.ts` to point `textureUrls` to the new files.

Recommended filenames:

- `characters/hero-warrior-idle.webp`
- `characters/hero-taoist-idle.webp`
- `characters/hero-cleric-idle.webp`
- `monsters/monster-slime-idle.webp`
- `monsters/monster-wolf-idle.webp`
- `monsters/monster-goblin-idle.webp`
- `monsters/monster-crystal-bear-idle.webp`
- `monsters/boss-dragon-idle.webp`
- `tiles/tile-grass.webp`
- `tiles/tile-stone.webp`
- `tiles/tile-water.webp`
- `tiles/tile-portal.webp`
- `props/prop-tree.webp`
- `props/prop-crystal.webp`

## Next art milestone

The next implementation step is atlas animation support:

- idle / walk / attack / hit / death
- 4-direction or 8-direction sprite sheets
- Pixi `AnimatedSprite` wrapper per actor
