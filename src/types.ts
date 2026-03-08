export type Stats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type Alignment = 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil' | 'Unaligned';

export type SpecialResource = 'energy' | 'hunger' | 'hp';
export type PortraitMilestone = 1 | 5 | 10;
export type ThreatTier = 'trivial' | 'low' | 'standard' | 'elite' | 'boss';

export type SpecialAbility = {
  name: string;
  description: string;
  cooldown: number;
  damageMultiplier: number;
  resource: SpecialResource;
  cost: number;
  accuracyBonus: number;
};

export type EncounterAbility = {
  name: string;
  description: string;
  cooldown: number;
  damageMultiplier: number;
  accuracyBonus: number;
};

export type Species = {
  id: string;
  name: string;
  description: string;
  baseStats: Stats;
  growth: Stats;
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

export type Encounter = {
  id: string;
  name: string;
  description: string;
  level: number;
  hp: number;
  maxHp: number;
  stats: Stats;
  reward: number;
  icon: string;
  tier: ThreatTier;
  specialAbility: EncounterAbility;
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

export type HistoryEventType = 'battle-win' | 'battle-loss' | 'level-up' | 'monster-acquired';

export type HistoryEvent = {
  id: string;
  type: HistoryEventType;
  createdAt: string;
  title: string;
  description: string;
  petId?: string;
  petName?: string;
  speciesId?: string;
  heroId?: string;
  heroName?: string;
  level?: number;
  goldEarned?: number;
  xpEarned?: number;
};
