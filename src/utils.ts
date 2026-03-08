import type { EncounterAbility, Pet, SpecialAbility, SpecialResource } from './types';

export const rollDice = (sides: number) => Math.floor(Math.random() * sides) + 1;
export const getModifier = (stat: number) => Math.floor((stat - 10) / 2);
export const calculateMaxHp = (con: number, level: number) => {
  const conMod = getModifier(con);
  return 8 + conMod + (level - 1) * (5 + conMod); // Assuming d8 hit dice for monsters generally
};
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getXpForNextLevel = (level: number) => level * 100;

export const getXpRemaining = (level: number, xp: number) => Math.max(0, getXpForNextLevel(level) - xp);

export function getAttackDamageRange(strength: number): { min: number; max: number } {
  const modifier = getModifier(strength);
  return {
    min: Math.max(1, 1 + modifier),
    max: Math.max(1, 8 + modifier),
  };
}

export function getResourceLabel(resource: SpecialResource): string {
  if (resource === 'hp') {
    return 'Health';
  }

  if (resource === 'hunger') {
    return 'Hunger';
  }

  return 'Energy';
}

export function getSpecialEffectText(specialAbility: Pick<SpecialAbility | EncounterAbility, 'damageMultiplier' | 'accuracyBonus'>): string {
  const damagePercent = Math.round(specialAbility.damageMultiplier * 100);
  const accuracyText =
    specialAbility.accuracyBonus > 0 ? ` with +${specialAbility.accuracyBonus} accuracy` : '';

  return `Deals ${damagePercent}% of normal attack damage${accuracyText}.`;
}

export function getSpecialCostText(specialAbility: SpecialAbility): string {
  return `${specialAbility.cost} ${getResourceLabel(specialAbility.resource)}`;
}

export function applyXpGain(pet: Pet, xpGain: number): {
  pet: Pet;
  levelsGained: number;
  xpToNextLevel: number;
} {
  if (xpGain <= 0) {
    return {
      pet,
      levelsGained: 0,
      xpToNextLevel: getXpRemaining(pet.level, pet.xp),
    };
  }

  let nextXp = pet.xp + xpGain;
  let nextLevel = pet.level;
  let nextHp = pet.hp;
  let nextMaxHp = pet.maxHp;
  const nextStats = { ...pet.stats };
  let levelsGained = 0;

  while (nextXp >= getXpForNextLevel(nextLevel)) {
    nextXp -= getXpForNextLevel(nextLevel);
    nextLevel += 1;
    nextStats.str += 1;
    nextStats.con += 1;

    const previousMaxHp = nextMaxHp;
    nextMaxHp = calculateMaxHp(nextStats.con, nextLevel);
    nextHp = Math.min(nextMaxHp, nextHp + (nextMaxHp - previousMaxHp));
    levelsGained += 1;
  }

  return {
    pet: {
      ...pet,
      hp: nextHp,
      maxHp: nextMaxHp,
      level: nextLevel,
      xp: nextXp,
      stats: nextStats,
    },
    levelsGained,
    xpToNextLevel: getXpRemaining(nextLevel, nextXp),
  };
}
