export const textureUrls = {
  tileGrass: new URL('../assets/map/tile-grass.svg', import.meta.url).href,
  tileDirt: new URL('../assets/map/tile-dirt.svg', import.meta.url).href,
  tileMoss: new URL('../assets/map/tile-moss.svg', import.meta.url).href,
  tileStone: new URL('../assets/map/tile-stone.svg', import.meta.url).href,
  tileCrystal: new URL('../assets/map/tile-crystal.svg', import.meta.url).href,
  tileWater: new URL('../assets/map/tile-water.svg', import.meta.url).href,
  tileCliff: new URL('../assets/map/tile-cliff.svg', import.meta.url).href,
  tilePortal: new URL('../assets/map/tile-portal.svg', import.meta.url).href,
  propTree: new URL('../assets/map/prop-tree.svg', import.meta.url).href,
  propCrystal: new URL('../assets/map/prop-crystal.svg', import.meta.url).href,
  propRock: new URL('../assets/map/prop-rock.svg', import.meta.url).href,
  propRuin: new URL('../assets/map/prop-ruin.svg', import.meta.url).href,
  heroWarrior: new URL('../assets/sprites/hero-warrior.svg', import.meta.url).href,
  heroTaoist: new URL('../assets/sprites/hero-taoist.svg', import.meta.url).href,
  heroCleric: new URL('../assets/sprites/hero-cleric.svg', import.meta.url).href,
  monsterSlime: new URL('../assets/sprites/monster-slime.svg', import.meta.url).href,
  monsterWolf: new URL('../assets/sprites/monster-wolf.svg', import.meta.url).href,
  monsterGoblin: new URL('../assets/sprites/monster-goblin.svg', import.meta.url).href,
  monsterBear: new URL('../assets/sprites/monster-bear.svg', import.meta.url).href,
  bossDragon: new URL('../assets/sprites/boss-dragon.svg', import.meta.url).href
} as const;

export const cardArtUrls = {
  warrior: new URL('../assets/cards/card-warrior.jpg', import.meta.url).href,
  taoist: new URL('../assets/cards/card-taoist.jpg', import.meta.url).href,
  crystalBear: new URL('../assets/cards/card-crystal-bear.jpg', import.meta.url).href,
  crystalFox: new URL('../assets/cards/card-crystal-fox.jpg', import.meta.url).href,
  equipmentPack: new URL('../assets/cards/equipment-pack.jpg', import.meta.url).href,
  uiIcons: new URL('../assets/cards/ui-icons.jpg', import.meta.url).href
} as const;

export const highQualityAssetSlots = {
  basePath: 'src/assets/2p5d',
  characters: ['hero-warrior-idle.webp', 'hero-taoist-idle.webp', 'hero-cleric-idle.webp'],
  monsters: ['monster-slime-idle.webp', 'monster-wolf-idle.webp', 'monster-goblin-idle.webp', 'monster-crystal-bear-idle.webp', 'boss-dragon-idle.webp'],
  tiles: ['tile-grass.webp', 'tile-dirt.webp', 'tile-moss.webp', 'tile-stone.webp', 'tile-crystal.webp', 'tile-water.webp', 'tile-cliff.webp', 'tile-portal.webp'],
  props: ['prop-tree.webp', 'prop-crystal.webp', 'prop-rock.webp', 'prop-ruin.webp']
} as const;
