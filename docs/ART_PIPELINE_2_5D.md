# 2.5D Graphics Pipeline

This build introduces the folder structure for replacing prototype SVGs with high-quality 2.5D assets without rewriting gameplay code.

Current runtime still uses `src/data/assetManifest.ts` as the single source of truth. To replace graphics, update one key at a time in `textureUrls` and keep the same logical names used by `SolGame`:

- `heroWarrior`, `heroTaoist`, `heroCleric`
- `monsterSlime`, `monsterWolf`, `monsterGoblin`, `monsterBear`, `bossDragon`
- `tileGrass`, `tileStone`, `tileWater`, `tilePortal`
- `propTree`, `propCrystal`

The recommended art direction is high-saturation fantasy 2.5D with consistent rim lighting and readable silhouettes at mobile scale.
