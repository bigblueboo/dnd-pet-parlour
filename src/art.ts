export const BATTLE_BACKGROUND_PATH = '/generated/backgrounds/battle-sanctum.png';

export function getMonsterArtPath(speciesId: string): string {
  return `/generated/monsters/${speciesId}.png`;
}

export function getHeroArtPath(heroId: string): string {
  return `/generated/heroes/${heroId}.png`;
}
