export type Stats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type Alignment = 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil' | 'Unaligned';

export type SpecialAbility = {
  name: string;
  description: string;
  cooldown: number;
  damageMultiplier: number;
};

export type Species = {
  id: string;
  name: string;
  description: string;
  baseStats: Stats;
  alignment: Alignment;
  diet: string;
  image: string;
  cost: number;
  specialAbility: SpecialAbility;
};

export type Pet = {
  id: string;
  speciesId: string;
  name: string;
  hp: number;
  maxHp: number;
  hunger: number;
  energy: number;
  happiness: number;
  stats: Stats;
  level: number;
  xp: number;
};

export type Hero = {
  id: string;
  name: string;
  description: string;
  level: number;
  hp: number;
  maxHp: number;
  stats: Stats;
  reward: number;
};

export type ItemType = 'heal' | 'social' | 'food' | 'buff';

export type Item = {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: ItemType;
  value: number;
  icon: string;
};
