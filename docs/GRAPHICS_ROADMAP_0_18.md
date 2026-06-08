# Soul Online 0.18 Graphics Roadmap

0.18 improves the built-in procedural placeholder sheets so the prototype no longer looks like the earliest flat SVG pass. It is still not a commercial AAA/UE-quality asset pack.

To reach the target visual tier inspired by Lineage/MIR/Odin/Night Crows style mobile MMORPGs, the project needs real production assets:

- 8-direction 2.5D pre-rendered character sheets for each class/gender.
- Separate weapon/armor cosmetic layers or baked class costumes.
- 8-direction monster sheets with idle, walk, run, attack, hit, death, and skill actions.
- Field tile atlas with grass, dirt, stone, water, cliffs, edge blends, decals, shadows, and props.
- Actual BGM files in OGG/MP3, not synthetic Web Audio placeholder tones.

Current runtime replacement paths:

```txt
src/assets/2p5d/characters/*.png
src/assets/2p5d/monsters/*.png
src/assets/2p5d/tiles/*.webp
src/assets/2p5d/props/*.webp
public/audio/title-theme.ogg
public/audio/town-lumina.ogg
public/audio/field-forest.ogg
public/audio/boss-crystal.ogg
```

Recommended production target for the next real art pass:

- Character frame: 256x384 or 320x480 source, downscaled in runtime if needed.
- Current placeholder runtime frame: 128x192.
- Rows: S, SW, W, NW, N, NE, E, SE.
- Columns: 48 total.
- Actions: idle 4, walk 8, run 8, attack 8, hit 4, death 8, skill 8.
