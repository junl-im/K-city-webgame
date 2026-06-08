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
  bossDragon: new URL('../assets/sprites/boss-dragon.svg', import.meta.url).href,
  heroWarriorMaleSheet: new URL('../assets/2p5d/characters/hero-warrior-male-sheet.png', import.meta.url).href,
  heroWarriorFemaleSheet: new URL('../assets/2p5d/characters/hero-warrior-female-sheet.png', import.meta.url).href,
  heroTaoistMaleSheet: new URL('../assets/2p5d/characters/hero-taoist-male-sheet.png', import.meta.url).href,
  heroTaoistFemaleSheet: new URL('../assets/2p5d/characters/hero-taoist-female-sheet.png', import.meta.url).href,
  heroClericMaleSheet: new URL('../assets/2p5d/characters/hero-cleric-male-sheet.png', import.meta.url).href,
  heroClericFemaleSheet: new URL('../assets/2p5d/characters/hero-cleric-female-sheet.png', import.meta.url).href,
  monsterSlimeSheet: new URL('../assets/2p5d/monsters/monster-slime-sheet.png', import.meta.url).href,
  monsterWolfSheet: new URL('../assets/2p5d/monsters/monster-wolf-sheet.png', import.meta.url).href,
  monsterGoblinSheet: new URL('../assets/2p5d/monsters/monster-goblin-sheet.png', import.meta.url).href,
  monsterBearSheet: new URL('../assets/2p5d/monsters/monster-bear-sheet.png', import.meta.url).href,
  bossDragonSheet: new URL('../assets/2p5d/monsters/boss-dragon-sheet.png', import.meta.url).href
} as const;

export const runtimeTextureUrls: Partial<Record<keyof typeof textureUrls, string>> = {
  tileGrass: './assets/soulpack/tiles/tile-grass.png',
  tileDirt: './assets/soulpack/tiles/tile-dirt.png',
  tileMoss: './assets/soulpack/tiles/tile-moss.png',
  tileStone: './assets/soulpack/tiles/tile-stone.png',
  tileCrystal: './assets/soulpack/tiles/tile-crystal.png',
  tileWater: './assets/soulpack/tiles/tile-water.png',
  tileCliff: './assets/soulpack/tiles/tile-cliff.png',
  tilePortal: './assets/soulpack/tiles/tile-portal.png',
  propTree: './assets/soulpack/props/prop-tree.png',
  propCrystal: './assets/soulpack/props/prop-crystal.png',
  propRock: './assets/soulpack/props/prop-rock.png',
  propRuin: './assets/soulpack/props/prop-ruin.png',
  heroWarriorMaleSheet: './assets/soulpack/characters/hero-warrior-male-sheet.png',
  heroWarriorFemaleSheet: './assets/soulpack/characters/hero-warrior-female-sheet.png',
  heroTaoistMaleSheet: './assets/soulpack/characters/hero-taoist-male-sheet.png',
  heroTaoistFemaleSheet: './assets/soulpack/characters/hero-taoist-female-sheet.png',
  heroClericMaleSheet: './assets/soulpack/characters/hero-cleric-male-sheet.png',
  heroClericFemaleSheet: './assets/soulpack/characters/hero-cleric-female-sheet.png',
  monsterSlimeSheet: './assets/soulpack/monsters/monster-slime-sheet.png',
  monsterWolfSheet: './assets/soulpack/monsters/monster-wolf-sheet.png',
  monsterGoblinSheet: './assets/soulpack/monsters/monster-goblin-sheet.png',
  monsterBearSheet: './assets/soulpack/monsters/monster-bear-sheet.png',
  bossDragonSheet: './assets/soulpack/monsters/boss-dragon-sheet.png'
} as const;

export const audioTrackUrls = {
  title: './assets/soulpack/audio/title-theme.ogg',
  town: './assets/soulpack/audio/town-lumina.ogg',
  field: './assets/soulpack/audio/field-forest.ogg',
  boss: './assets/soulpack/audio/boss-crystal.ogg'
} as const;


export const sfxTrackUrls = {
  ui: './assets/soulpack/sfx/ui.wav',
  attack: './assets/soulpack/sfx/attack.wav',
  hit: './assets/soulpack/sfx/hit.wav',
  skill: './assets/soulpack/sfx/skill.wav',
  heal: './assets/soulpack/sfx/heal.wav',
  reward: './assets/soulpack/sfx/reward.wav',
  enhance: './assets/soulpack/sfx/enhance.wav',
  level: './assets/soulpack/sfx/level.wav',
  error: './assets/soulpack/sfx/error.wav'
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
  basePath: 'public/assets/soulpack',
  bundledFallbackPath: 'src/assets/2p5d',
  characters: [
    'characters/hero-warrior-male-sheet.png', 'characters/hero-warrior-female-sheet.png',
    'characters/hero-taoist-male-sheet.png', 'characters/hero-taoist-female-sheet.png',
    'characters/hero-cleric-male-sheet.png', 'characters/hero-cleric-female-sheet.png'
  ],
  monsters: [
    'monsters/monster-slime-sheet.png', 'monsters/monster-wolf-sheet.png', 'monsters/monster-goblin-sheet.png',
    'monsters/monster-bear-sheet.png', 'monsters/boss-dragon-sheet.png'
  ],
  tiles: [
    'tiles/tile-grass.png', 'tiles/tile-dirt.png', 'tiles/tile-moss.png', 'tiles/tile-stone.png',
    'tiles/tile-crystal.png', 'tiles/tile-water.png', 'tiles/tile-cliff.png', 'tiles/tile-portal.png'
  ],
  props: ['props/prop-tree.png', 'props/prop-crystal.png', 'props/prop-rock.png', 'props/prop-ruin.png', 'props/prop-gate.png'],
  audio: ['audio/title-theme.ogg', 'audio/town-lumina.ogg', 'audio/field-forest.ogg', 'audio/boss-crystal.ogg'],
  sfx: ['sfx/ui.wav', 'sfx/attack.wav', 'sfx/hit.wav', 'sfx/skill.wav', 'sfx/heal.wav', 'sfx/reward.wav', 'sfx/enhance.wav', 'sfx/level.wav', 'sfx/error.wav']
} as const;
