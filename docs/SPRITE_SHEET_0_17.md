# Soul Online Alpha 0.17 Sprite Sheet Pass

0.17 adds a real sprite-sheet runtime contract for tall 2.5D MMORPG-style characters and monsters.

## Character target

- Body proportion: tall 8-head fantasy silhouette
- Variants: male / female for each class
- Classes: warrior, taoist, cleric
- Runtime sheet files:
  - `src/assets/2p5d/characters/hero-warrior-male-sheet.png`
  - `src/assets/2p5d/characters/hero-warrior-female-sheet.png`
  - `src/assets/2p5d/characters/hero-taoist-male-sheet.png`
  - `src/assets/2p5d/characters/hero-taoist-female-sheet.png`
  - `src/assets/2p5d/characters/hero-cleric-male-sheet.png`
  - `src/assets/2p5d/characters/hero-cleric-female-sheet.png`

## Monster target

- Runtime sheet files:
  - `src/assets/2p5d/monsters/monster-slime-sheet.png`
  - `src/assets/2p5d/monsters/monster-wolf-sheet.png`
  - `src/assets/2p5d/monsters/monster-goblin-sheet.png`
  - `src/assets/2p5d/monsters/monster-bear-sheet.png`
  - `src/assets/2p5d/monsters/boss-dragon-sheet.png`

## Sheet layout

Character sheets:

- Frame size: `128 x 192`
- Columns: `48`
- Rows: `8`
- Row order: `S, SW, W, NW, N, NE, E, SE`

Monster sheets:

- Frame size: `128 x 160`
- Columns: `48`
- Rows: `8`
- Row order: `S, SW, W, NW, N, NE, E, SE`

Column ranges:

| Motion | Start | Frames | Loop |
| --- | ---: | ---: | --- |
| idle | 0 | 4 | yes |
| walk | 4 | 8 | yes |
| run | 12 | 8 | yes |
| attack | 20 | 8 | no |
| hit | 28 | 4 | no |
| death | 32 | 8 | no |
| skill | 40 | 8 | no |

## Runtime behavior

- Movement direction maps to 8-direction rows.
- Manual movement uses `walk`.
- Auto-hunt movement uses `run`.
- Basic attacks play `attack`.
- Active skills play `skill`.
- Damage plays `hit`.
- Knockout/death plays `death`.

## Real art replacement

The included sheets are runtime-ready prototype sheets, not final commercial art. Replace them with real 2.5D prerendered WebP/PNG sheets that follow the same layout. The runtime will pick them up without changing combat logic.
