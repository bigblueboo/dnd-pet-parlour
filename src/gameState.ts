import { SPECIES } from './data';
import type { HistoryEvent, Pet } from './types';
import { calculateMaxHp, generateId } from './utils';

export type GameView = 'dashboard' | 'pet' | 'shop' | 'history';

export type GameState = {
  view: GameView;
  selectedPetId: string | null;
  gold: number;
  inventory: Record<string, number>;
  pets: Pet[];
  highestDefeatedHeroIndex: number;
  history: HistoryEvent[];
};

const STORAGE_VERSION = 1;
export const GAME_STATE_STORAGE_KEY = `dnd-pet-parlour:v${STORAGE_VERSION}`;

function createStarterPet(): Pet {
  const baseStats = SPECIES.gelatinous_cube.baseStats;
  const maxHp = calculateMaxHp(baseStats.con, 1);

  return {
    id: generateId(),
    speciesId: 'gelatinous_cube',
    name: 'Wobbles',
    hp: maxHp,
    maxHp,
    hunger: 80,
    energy: 100,
    happiness: 50,
    stats: { ...baseStats },
    level: 1,
    xp: 0,
  };
}

export function createDefaultGameState(): GameState {
  const starterPet = createStarterPet();

  return {
    view: 'dashboard',
    selectedPetId: starterPet.id,
    gold: 300,
    highestDefeatedHeroIndex: -1,
    inventory: {
      monster_chow: 20,
      minor_potion: 3,
      pet_brush: 1,
    },
    pets: [starterPet],
    history: [],
  };
}

function isPet(candidate: unknown): candidate is Pet {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const pet = candidate as Pet;
  return typeof pet.id === 'string' && typeof pet.speciesId === 'string' && typeof pet.name === 'string';
}

function isHistoryEvent(candidate: unknown): candidate is HistoryEvent {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const event = candidate as HistoryEvent;
  return (
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    typeof event.createdAt === 'string' &&
    typeof event.title === 'string' &&
    typeof event.description === 'string'
  );
}

export function loadGameState(): GameState {
  if (typeof window === 'undefined') {
    return createDefaultGameState();
  }

  try {
    const raw = window.localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!raw) {
      return createDefaultGameState();
    }

    const parsed = JSON.parse(raw) as { version?: number; data?: Partial<GameState> };
    if (parsed.version !== STORAGE_VERSION || !parsed.data) {
      return createDefaultGameState();
    }

    const defaults = createDefaultGameState();
    const pets = Array.isArray(parsed.data.pets) ? parsed.data.pets.filter(isPet) : defaults.pets;
    const selectedPetId =
      typeof parsed.data.selectedPetId === 'string' && pets.some((pet) => pet.id === parsed.data.selectedPetId)
        ? parsed.data.selectedPetId
        : pets[0]?.id ?? null;
    const view = parsed.data.view === 'pet' && !selectedPetId ? 'dashboard' : parsed.data.view ?? defaults.view;

    return {
      view: view === 'pet' || view === 'shop' || view === 'history' ? view : 'dashboard',
      selectedPetId,
      gold: typeof parsed.data.gold === 'number' ? parsed.data.gold : defaults.gold,
      highestDefeatedHeroIndex:
        typeof parsed.data.highestDefeatedHeroIndex === 'number'
          ? parsed.data.highestDefeatedHeroIndex
          : defaults.highestDefeatedHeroIndex,
      inventory:
        parsed.data.inventory && typeof parsed.data.inventory === 'object'
          ? { ...defaults.inventory, ...parsed.data.inventory }
          : defaults.inventory,
      pets,
      history: Array.isArray(parsed.data.history) ? parsed.data.history.filter(isHistoryEvent) : defaults.history,
    };
  } catch {
    return createDefaultGameState();
  }
}

export function persistGameState(state: GameState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    GAME_STATE_STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      data: state,
    }),
  );
}

export function clearPersistedGameState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(GAME_STATE_STORAGE_KEY);
}
