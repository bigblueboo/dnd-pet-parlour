import { Species, Hero, Item } from './types';

export const SPECIES: Record<string, Species> = {
  gelatinous_cube: {
    id: 'gelatinous_cube',
    name: 'Gelatinous Cube',
    description: 'A transparent ooze that absorbs and digests organic matter. Very clean.',
    baseStats: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
    alignment: 'Unaligned',
    diet: 'Anything Organic',
    image: '🧊',
    cost: 50,
    specialAbility: { name: 'Engulf', description: 'Swallows the target whole.', cooldown: 3, damageMultiplier: 1.5 }
  },
  blink_dog: {
    id: 'blink_dog',
    name: 'Blink Dog',
    description: 'A fey canine that can teleport short distances. Very loyal.',
    baseStats: { str: 12, dex: 17, con: 12, int: 10, wis: 13, cha: 11 },
    alignment: 'Lawful Good',
    diet: 'Meat',
    image: '🐕',
    cost: 100,
    specialAbility: { name: 'Teleport Bite', description: 'Blinks behind the enemy for a surprise attack.', cooldown: 2, damageMultiplier: 1.4 }
  },
  mimic: {
    id: 'mimic',
    name: 'Mimic',
    description: 'A shape-shifting predator able to take on the form of inanimate objects. Usually a chest.',
    baseStats: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
    alignment: 'True Neutral',
    diet: 'Adventurers',
    image: '🧰',
    cost: 150,
    specialAbility: { name: 'Adhesive Strike', description: 'Traps the enemy with sticky pseudopods.', cooldown: 3, damageMultiplier: 1.8 }
  },
  owlbear: {
    id: 'owlbear',
    name: 'Owlbear',
    description: 'A monstrous cross between a giant owl and a bear. Aggressive and huggable.',
    baseStats: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    alignment: 'Unaligned',
    diet: 'Raw Meat',
    image: '🦉',
    cost: 200,
    specialAbility: { name: 'Bear Hug', description: 'A crushing embrace that shatters armor.', cooldown: 3, damageMultiplier: 2.0 }
  },
  displacer_beast: {
    id: 'displacer_beast',
    name: 'Displacer Beast',
    description: 'A feline menace with six legs and two tentacle whips. Hates blink dogs.',
    baseStats: { str: 18, dex: 15, con: 16, int: 6, wis: 12, cha: 8 },
    alignment: 'Lawful Evil',
    diet: 'Fresh Prey',
    image: '🐆',
    cost: 300,
    specialAbility: { name: 'Tentacle Whip', description: 'Lashes out with spiked tentacles.', cooldown: 2, damageMultiplier: 1.5 }
  },
  rust_monster: {
    id: 'rust_monster',
    name: 'Rust Monster',
    description: 'An insectoid creature that feeds on metal. Keep away from your coins.',
    baseStats: { str: 13, dex: 12, con: 13, int: 2, wis: 13, cha: 6 },
    alignment: 'Unaligned',
    diet: 'Metals',
    image: '🪲',
    cost: 400,
    specialAbility: { name: 'Antennae Touch', description: 'Corrodes the enemy\'s weapons and armor.', cooldown: 3, damageMultiplier: 1.6 }
  },
  mind_flayer: {
    id: 'mind_flayer',
    name: 'Mind Flayer',
    description: 'A psionic tyrant from the Underdark. Loves a good brain.',
    baseStats: { str: 11, dex: 12, con: 12, int: 19, wis: 17, cha: 17 },
    alignment: 'Lawful Evil',
    diet: 'Brains',
    image: '🦑',
    cost: 800,
    specialAbility: { name: 'Mind Blast', description: 'Emits psychic energy to crush the enemy\'s will.', cooldown: 4, damageMultiplier: 2.2 }
  },
  red_dragon_wyrmling: {
    id: 'red_dragon_wyrmling',
    name: 'Red Dragon Wyrmling',
    description: 'A young, arrogant, and fiery dragon. Thinks it owns your parlour.',
    baseStats: { str: 19, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
    alignment: 'Chaotic Evil',
    diet: 'Cooked Meat & Gold',
    image: '🐉',
    cost: 1500,
    specialAbility: { name: 'Fire Breath', description: 'Exhales a cone of destructive fire.', cooldown: 4, damageMultiplier: 2.5 }
  },
  beholder: {
    id: 'beholder',
    name: 'Beholder',
    description: 'A floating orb of flesh with a large mouth, single central eye, and many smaller eyestalks.',
    baseStats: { str: 10, dex: 14, con: 18, int: 17, wis: 15, cha: 17 },
    alignment: 'Lawful Evil',
    diet: 'Anything it wants',
    image: '👁️',
    cost: 3000,
    specialAbility: { name: 'Death Ray', description: 'Fires a necrotic beam from an eyestalk.', cooldown: 5, damageMultiplier: 3.0 }
  },
  tarrasque: {
    id: 'tarrasque',
    name: 'Tarrasque',
    description: 'The legendary engine of destruction. How did you even catch this?',
    baseStats: { str: 30, dex: 11, con: 30, int: 3, wis: 11, cha: 11 },
    alignment: 'Unaligned',
    diet: 'Everything',
    image: '🦖',
    cost: 10000,
    specialAbility: { name: 'Swallow Whole', description: 'Devours the enemy in a single bite.', cooldown: 6, damageMultiplier: 4.0 }
  }
};

export const HEROES: Hero[] = [
  {
    id: 'novice',
    name: 'Novice Adventurer',
    description: 'A fresh-faced youth with a rusty sword and big dreams.',
    level: 1,
    hp: 15,
    maxHp: 15,
    stats: { str: 12, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
    reward: 20,
  },
  {
    id: 'guard',
    name: 'Town Guard',
    description: 'Used to dealing with drunkards, not actual monsters.',
    level: 3,
    hp: 30,
    maxHp: 30,
    stats: { str: 14, dex: 12, con: 14, int: 10, wis: 11, cha: 10 },
    reward: 50,
  },
  {
    id: 'lancelot',
    name: 'Sir Lancelot',
    description: 'A brave knight in shining armor. Very shiny.',
    level: 5,
    hp: 60,
    maxHp: 60,
    stats: { str: 16, dex: 14, con: 16, int: 12, wis: 14, cha: 16 },
    reward: 150,
  },
  {
    id: 'hercules',
    name: 'Hercules',
    description: 'A legendary hero of immense strength. Good luck.',
    level: 10,
    hp: 150,
    maxHp: 150,
    stats: { str: 24, dex: 16, con: 20, int: 10, wis: 12, cha: 18 },
    reward: 500,
  },
  {
    id: 'dragon_slayer',
    name: 'Dragon Slayer',
    description: 'A master of combat seeking the ultimate challenge.',
    level: 15,
    hp: 300,
    maxHp: 300,
    stats: { str: 26, dex: 18, con: 22, int: 14, wis: 16, cha: 14 },
    reward: 1200,
  }
];

export const ITEMS: Record<string, Item> = {
  monster_chow: {
    id: 'monster_chow',
    name: 'Monster Chow',
    description: 'Restores 30 Hunger.',
    cost: 10,
    type: 'food',
    value: 30,
    icon: '🍖'
  },
  minor_potion: {
    id: 'minor_potion',
    name: 'Minor Potion of Healing',
    description: 'Restores 20 HP.',
    cost: 20,
    type: 'heal',
    value: 20,
    icon: '🧪'
  },
  major_potion: {
    id: 'major_potion',
    name: 'Major Potion of Healing',
    description: 'Restores 50 HP.',
    cost: 50,
    type: 'heal',
    value: 50,
    icon: '⚗️'
  },
  pet_brush: {
    id: 'pet_brush',
    name: 'Enchanted Brush',
    description: 'Restores 20 Happiness.',
    cost: 15,
    type: 'social',
    value: 20,
    icon: '🪮'
  },
  haste_potion: {
    id: 'haste_potion',
    name: 'Potion of Haste',
    description: 'Battle: Your pet attacks twice for the next 3 turns.',
    cost: 40,
    type: 'buff',
    value: 3,
    icon: '⚡'
  }
};
