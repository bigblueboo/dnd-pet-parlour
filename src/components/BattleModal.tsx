import React, { useEffect, useRef, useState } from 'react';
import { BATTLE_BACKGROUND_PATH } from '../art';
import { HEROES, ITEMS, SPECIES } from '../data';
import type { HistoryEvent, Pet } from '../types';
import {
  applyXpGain,
  getModifier,
  getResourceLabel,
  getSpecialCostText,
  getSpecialEffectText,
  getXpRemaining,
  rollDice,
} from '../utils';
import MonsterPortrait from './MonsterPortrait';
import HeroPortrait from './HeroPortrait';
import { Package, Shield, Swords, X, Zap } from 'lucide-react';

type BattlePhase = 'select' | 'player' | 'enemy' | 'end';
type BattleOutcome = 'victory' | 'defeat';
type BattlePetState = {
  petId: string;
  hp: number;
  maxHp: number;
  energy: number;
  hunger: number;
  cooldown: number;
  hasteTurns: number;
};

type BattleResolution = {
  outcome: BattleOutcome;
  title: string;
  description: string;
  goldEarned: number;
  xpEarned: number;
  xpTotalEarned: number;
  participantCount: number;
  levelUps: string[];
  nextLevelSummary: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialPetId: string | null;
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  highestDefeatedHeroIndex: number;
  setHighestDefeatedHeroIndex: React.Dispatch<React.SetStateAction<number>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onRecordBattleResult: (event: Omit<HistoryEvent, 'id' | 'createdAt'>) => void;
};

function getBattleReward(baseReward: number) {
  return Math.ceil(baseReward * 1.5);
}

function getBattleXp(level: number) {
  return level * 25;
}

function buildBattlePetState(pet: Pet): BattlePetState {
  return {
    petId: pet.id,
    hp: pet.hp,
    maxHp: pet.maxHp,
    energy: pet.energy,
    hunger: pet.hunger,
    cooldown: 0,
    hasteTurns: 0,
  };
}

function getLivingBattlePets(team: BattlePetState[]) {
  return team.filter((member) => member.hp > 0);
}

function getNextActivePetId(team: BattlePetState[], currentPetId: string | null) {
  const living = getLivingBattlePets(team);
  if (living.length === 0) {
    return null;
  }

  if (!currentPetId) {
    return living[0].petId;
  }

  const currentIndex = living.findIndex((member) => member.petId === currentPetId);
  if (currentIndex === -1) {
    return living[0].petId;
  }

  return living[(currentIndex + 1) % living.length].petId;
}

export default function BattleModal({
  open,
  onClose,
  initialPetId,
  pets,
  setPets,
  setGold,
  highestDefeatedHeroIndex,
  setHighestDefeatedHeroIndex,
  inventory,
  setInventory,
  onRecordBattleResult,
}: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState(HEROES[0].id);
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battlePets, setBattlePets] = useState<BattlePetState[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [currentHeroHp, setCurrentHeroHp] = useState(0);
  const [currentHeroCooldown, setCurrentHeroCooldown] = useState(0);
  const [surrenderPromptOpen, setSurrenderPromptOpen] = useState(false);
  const [blockedStartMessage, setBlockedStartMessage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<BattleResolution | null>(null);
  const maxVisibleHeroIndex = Math.min(HEROES.length - 1, Math.max(3, highestDefeatedHeroIndex + 3));
  const visibleHeroes = HEROES.slice(0, maxVisibleHeroIndex + 1);

  const selectedPets = selectedPetIds
    .map((petId) => pets.find((candidate) => candidate.id === petId))
    .filter(Boolean) as Pet[];
  const pet = activePetId ? pets.find((candidate) => candidate.id === activePetId) ?? null : null;
  const heroDef = HEROES.find((hero) => hero.id === selectedHeroId);
  const species = pet ? SPECIES[pet.speciesId] : null;
  const activeBattlePet = activePetId ? battlePets.find((member) => member.petId === activePetId) ?? null : null;
  const activeTeamPets = battlePets
    .map((member) => {
      const basePet = pets.find((candidate) => candidate.id === member.petId);
      if (!basePet) {
        return null;
      }

      return {
        member,
        pet: basePet,
        species: SPECIES[basePet.speciesId],
      };
    })
    .filter(Boolean) as Array<{ member: BattlePetState; pet: Pet; species: (typeof SPECIES)[string] }>;
  useEffect(() => {
    if (!open) {
      return;
    }

    const initialPet =
      (initialPetId ? pets.find((candidate) => candidate.id === initialPetId && candidate.hp > 0) : null) ??
      pets.find((candidate) => candidate.hp > 0) ??
      null;
    setSelectedPetIds(initialPet ? [initialPet.id] : []);
    setSelectedHeroId(HEROES[0].id);
    setPhase('select');
    setBattleLog([]);
    setBattlePets([]);
    setActivePetId(initialPet?.id ?? null);
    setCurrentHeroCooldown(0);
    setSurrenderPromptOpen(false);
    setBlockedStartMessage(null);
    setResolution(null);
  }, [open, initialPetId, pets]);

  useEffect(() => {
    if (!open || phase !== 'select') {
      return;
    }

    const nextSelected = selectedPetIds.filter((petId) => pets.some((candidate) => candidate.id === petId && candidate.hp > 0));
    if (nextSelected.length !== selectedPetIds.length) {
      setSelectedPetIds(nextSelected);
    }
  }, [open, phase, pets, selectedPetIds]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        attemptClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, phase]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  useEffect(() => {
    if (!visibleHeroes.some((hero) => hero.id === selectedHeroId)) {
      setSelectedHeroId(visibleHeroes[0]?.id ?? HEROES[0].id);
    }
  }, [selectedHeroId, visibleHeroes]);

  useEffect(() => {
    if (phase !== 'enemy' || !heroDef || battlePets.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const livingMembers = getLivingBattlePets(battlePets);
      if (livingMembers.length === 0) {
        finishBattle('defeat', battlePets);
        return;
      }

      const target = livingMembers[Math.floor(Math.random() * livingMembers.length)];
      const targetPet = pets.find((candidate) => candidate.id === target.petId);
      if (!targetPet) {
        return;
      }

      const armorClass = 10 + getModifier(targetPet.stats.dex);
      let nextBattlePets = battlePets;
      const usesSpecial = currentHeroCooldown <= 0 && Math.random() < 0.42;
      const attackBonus = getModifier(heroDef.stats.str) + (usesSpecial ? heroDef.specialAbility.accuracyBonus : 0);
      const hit = rollDice(20) + attackBonus;
      let nextHeroAbilityCooldown = usesSpecial
        ? heroDef.specialAbility.cooldown
        : Math.max(0, currentHeroCooldown - 1);

      if (hit >= armorClass) {
        const baseDamage = Math.max(1, rollDice(8) + getModifier(heroDef.stats.str));
        const damage = usesSpecial
          ? Math.max(1, Math.floor(baseDamage * heroDef.specialAbility.damageMultiplier))
          : baseDamage;
        nextBattlePets = battlePets.map((member) =>
          member.petId === target.petId ? { ...member, hp: member.hp - damage } : member,
        );
        setBattleLog((prev) => [
          ...prev,
          usesSpecial
            ? `> ${heroDef.name} uses ${heroDef.specialAbility.name} on ${targetPet.name} for ${damage} damage.`
            : `> ${heroDef.name} hits ${targetPet.name} for ${damage} damage.`,
        ]);
      } else {
        setBattleLog((prev) => [
          ...prev,
          usesSpecial
            ? `> ${heroDef.name}'s ${heroDef.specialAbility.name} misses ${targetPet.name}.`
            : `> ${heroDef.name} misses ${targetPet.name}.`,
        ]);
      }

      setBattlePets(nextBattlePets);
      setCurrentHeroCooldown(nextHeroAbilityCooldown);
      if (getLivingBattlePets(nextBattlePets).length === 0) {
        finishBattle('defeat', nextBattlePets);
      } else {
        setActivePetId(getNextActivePetId(nextBattlePets, activePetId));
        setPhase('player');
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [phase, heroDef, battlePets, pets, activePetId, currentHeroCooldown]);

  if (!open) {
    return null;
  }

  const resetBattle = () => {
    setPhase('select');
    setBattleLog([]);
    setBattlePets([]);
    setActivePetId(selectedPetIds[0] ?? null);
    setCurrentHeroCooldown(0);
    setSurrenderPromptOpen(false);
    setBlockedStartMessage(null);
    setResolution(null);
  };

  const attemptClose = () => {
    if (phase === 'player' || phase === 'enemy') {
      setSurrenderPromptOpen(true);
      return;
    }

    onClose();
  };

  const surrenderBattle = () => {
    if (battlePets.length === 0) {
      onClose();
      return;
    }

    setPets((prev) =>
      prev.map((candidate) =>
        battlePets.some((member) => member.petId === candidate.id)
          ? {
              ...candidate,
              hp: 0,
              energy: Math.max(
                0,
                battlePets.find((member) => member.petId === candidate.id)?.energy ?? candidate.energy,
              ),
              hunger: Math.max(
                0,
                battlePets.find((member) => member.petId === candidate.id)?.hunger ?? candidate.hunger,
              ),
              happiness: Math.max(0, candidate.happiness - 20),
            }
          : candidate,
      ),
    );
    setSurrenderPromptOpen(false);
    onClose();
  };

  const toggleSelectedPet = (petId: string) => {
    const candidate = pets.find((petEntry) => petEntry.id === petId);
    if (!candidate || candidate.hp <= 0) {
      return;
    }

    setSelectedPetIds((prev) => {
      if (prev.includes(petId)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((id) => id !== petId);
      }

      if (prev.length >= 3) {
        setBlockedStartMessage('You can bring at most three living monsters into a battle at once.');
        return prev;
      }

      return [...prev, petId];
    });
  };

  const startBattle = () => {
    if (!heroDef) {
      return;
    }

    const team = selectedPetIds
      .map((petId) => pets.find((candidate) => candidate.id === petId))
      .filter(Boolean) as Pet[];

    if (team.length === 0) {
      setBlockedStartMessage('Select at least one living monster before starting a battle.');
      return;
    }

    const downedPet = team.find((candidate) => candidate.hp <= 0);
    if (downedPet) {
      setBlockedStartMessage(`${downedPet.name} is at 0 HP and cannot enter battle. Heal this monster first, then try again.`);
      return;
    }

    const exhaustedPet = team.find((candidate) => candidate.energy < 20);
    if (exhaustedPet) {
      setBattleLog([`[System] ${exhaustedPet.name} needs at least 20 energy to enter battle.`]);
      return;
    }

    const nextBattlePets = team.map(buildBattlePetState);
    setBattlePets(nextBattlePets);
    setActivePetId(nextBattlePets[0]?.petId ?? null);
    setCurrentHeroHp(heroDef.hp);
    setCurrentHeroCooldown(0);
    setResolution(null);
    setBattleLog([
      `--- BATTLE START: ${team.map((candidate) => candidate.name).join(', ')} vs ${heroDef.name} ---`,
      `${team.length} monsters entered the arena. XP will be split evenly if they win.`,
    ]);
    setPhase('player');
  };

  const finishBattle = (
    outcome: BattleOutcome,
    nextBattlePets = battlePets,
  ) => {
    if (!heroDef || nextBattlePets.length === 0) {
      return;
    }

    setPhase('end');

    if (outcome === 'victory') {
      const defeatedHeroIndex = HEROES.findIndex((hero) => hero.id === heroDef.id);
      const totalXpGain = getBattleXp(heroDef.level);
      const xpGain = Math.floor(totalXpGain / nextBattlePets.length);
      const goldEarned = getBattleReward(heroDef.reward);
      const updatedPetsById = new Map<string, Pet>();
      const levelUps: string[] = [];
      const nextLevelParts: string[] = [];

      for (const candidate of pets) {
        const battleMember = nextBattlePets.find((member) => member.petId === candidate.id);
        if (!battleMember) {
          continue;
        }

        const xpResult = applyXpGain(
          {
            ...candidate,
            hp: Math.max(1, battleMember.hp),
            energy: Math.max(0, battleMember.energy),
            hunger: Math.max(0, battleMember.hunger),
          },
          xpGain,
        );

        if (xpResult.levelsGained > 0) {
          levelUps.push(`${candidate.name} reached level ${xpResult.pet.level}`);
        }
        nextLevelParts.push(`${candidate.name}: ${xpResult.xpToNextLevel} XP to next`);
        updatedPetsById.set(candidate.id, {
          ...xpResult.pet,
          happiness: Math.min(100, candidate.happiness + 8),
        });
      }

      setGold((prev) => prev + goldEarned);
      setHighestDefeatedHeroIndex((prev) => Math.max(prev, defeatedHeroIndex));
      setPets((prev) => prev.map((candidate) => updatedPetsById.get(candidate.id) ?? candidate));
      setBattleLog((prev) => [
        ...prev,
        '--- VICTORY ---',
        `${nextBattlePets.map((member) => pets.find((candidate) => candidate.id === member.petId)?.name ?? member.petId).join(', ')} defeated ${heroDef.name}.`,
        `Gained ${goldEarned} gold and ${xpGain} XP each (${totalXpGain} total).`,
        ...nextLevelParts,
        ...levelUps,
      ]);
      setResolution({
        outcome: 'victory',
        title: 'Victory',
        description: `${nextBattlePets.length} monsters defeated ${heroDef.name}.`,
        goldEarned,
        xpEarned: xpGain,
        xpTotalEarned: totalXpGain,
        participantCount: nextBattlePets.length,
        levelUps,
        nextLevelSummary: nextLevelParts.join(' | '),
      });
      onRecordBattleResult({
        type: 'battle-win',
        title: `${heroDef.name} was defeated`,
        description: `${nextBattlePets.map((member) => pets.find((candidate) => candidate.id === member.petId)?.name ?? member.petId).join(', ')} defeated ${heroDef.name} and earned ${goldEarned} gold plus ${xpGain} XP each.`,
        heroId: heroDef.id,
        heroName: heroDef.name,
        goldEarned,
        xpEarned: xpGain,
      });
      return;
    }

    setPets((prev) =>
      prev.map((candidate) =>
        nextBattlePets.some((member) => member.petId === candidate.id)
          ? {
              ...candidate,
              hp: Math.max(0, nextBattlePets.find((member) => member.petId === candidate.id)?.hp ?? 0),
              energy: Math.max(
                0,
                nextBattlePets.find((member) => member.petId === candidate.id)?.energy ?? candidate.energy,
              ),
              hunger: Math.max(
                0,
                nextBattlePets.find((member) => member.petId === candidate.id)?.hunger ?? candidate.hunger,
              ),
              happiness: Math.max(0, candidate.happiness - 20),
            }
          : candidate,
      ),
    );
    setBattleLog((prev) => [
      ...prev,
      '--- DEFEAT ---',
      `${nextBattlePets.map((member) => pets.find((candidate) => candidate.id === member.petId)?.name ?? member.petId).join(', ')} were defeated by ${heroDef.name}.`,
    ]);
    setResolution({
      outcome: 'defeat',
      title: 'Defeat',
      description: `${heroDef.name} defeated your selected team.`,
      goldEarned: 0,
      xpEarned: 0,
      xpTotalEarned: 0,
      participantCount: nextBattlePets.length,
      levelUps: [],
      nextLevelSummary: nextBattlePets
        .map((member) => {
          const candidate = pets.find((petEntry) => petEntry.id === member.petId);
          return candidate ? `${candidate.name}: ${getXpRemaining(candidate.level, candidate.xp)} XP to next` : null;
        })
        .filter(Boolean)
        .join(' | '),
    });
    onRecordBattleResult({
      type: 'battle-loss',
      title: `${heroDef.name} won the battle`,
      description: `${nextBattlePets.map((member) => pets.find((candidate) => candidate.id === member.petId)?.name ?? member.petId).join(', ')} were defeated by ${heroDef.name}.`,
      heroId: heroDef.id,
      heroName: heroDef.name,
      goldEarned: 0,
      xpEarned: 0,
    });
  };

  const handlePlayerAction = (actionType: 'attack' | 'special' | 'item' | 'run', itemId?: string) => {
    if (phase !== 'player' || !pet || !heroDef || !species || !activeBattlePet) {
      return;
    }

    let nextHeroHp = currentHeroHp;
    let nextBattlePets = battlePets.map((member) =>
      member.petId === activeBattlePet.petId
        ? { ...member, hasteTurns: member.hasteTurns > 0 ? member.hasteTurns - 1 : 0 }
        : member,
    );
    let actingMember = nextBattlePets.find((member) => member.petId === activeBattlePet.petId) ?? activeBattlePet;
    const isHasted = activeBattlePet.hasteTurns > 0;

    if (actionType === 'attack') {
      const attacks = isHasted ? 2 : 1;
      nextBattlePets = nextBattlePets.map((member) =>
        member.petId === actingMember.petId
          ? {
              ...member,
              energy: Math.max(0, member.energy - 6),
              hunger: Math.max(0, member.hunger - 2),
            }
          : member,
      );
      actingMember = nextBattlePets.find((member) => member.petId === actingMember.petId) ?? actingMember;

      for (let attempt = 0; attempt < attacks; attempt += 1) {
        if (nextHeroHp <= 0) {
          break;
        }

        const hit = rollDice(20) + getModifier(pet.stats.str);
        const armorClass = 10 + getModifier(heroDef.stats.dex);
        if (hit >= armorClass) {
          const damage = Math.max(1, rollDice(8) + getModifier(pet.stats.str));
          nextHeroHp -= damage;
          setBattleLog((prev) => [...prev, `> ${pet.name} strikes for ${damage} damage.${isHasted ? ' (Hasted)' : ''}`]);
        } else {
          setBattleLog((prev) => [...prev, `> ${pet.name} misses.${isHasted ? ' (Hasted)' : ''}`]);
        }
      }
    }

    if (actionType === 'special') {
      const resourceName = species.specialAbility.resource;
      const availableResource =
        resourceName === 'energy' ? actingMember.energy : resourceName === 'hunger' ? actingMember.hunger : actingMember.hp;

      if (actingMember.cooldown > 0 || availableResource < species.specialAbility.cost) {
        return;
      }

      nextBattlePets = nextBattlePets.map((member) => {
        if (member.petId !== actingMember.petId) {
          return member;
        }

        if (resourceName === 'energy') {
          return { ...member, energy: member.energy - species.specialAbility.cost };
        }
        if (resourceName === 'hunger') {
          return { ...member, hunger: member.hunger - species.specialAbility.cost };
        }
        return { ...member, hp: member.hp - species.specialAbility.cost };
      });
      actingMember = nextBattlePets.find((member) => member.petId === actingMember.petId) ?? actingMember;

      const hit = rollDice(20) + getModifier(pet.stats.str) + species.specialAbility.accuracyBonus;
      const armorClass = 10 + getModifier(heroDef.stats.dex);
      if (hit >= armorClass) {
        const baseDamage = Math.max(1, rollDice(8) + getModifier(pet.stats.str));
        const damage = Math.floor(baseDamage * species.specialAbility.damageMultiplier);
        nextHeroHp -= damage;
        setBattleLog((prev) => [
          ...prev,
          `> ${pet.name} uses ${species.specialAbility.name} for ${damage} damage. (${species.specialAbility.cost} ${getResourceLabel(resourceName).toLowerCase()})`,
        ]);
      } else {
        setBattleLog((prev) => [
          ...prev,
          `> ${pet.name}'s ${species.specialAbility.name} misses. (${species.specialAbility.cost} ${getResourceLabel(resourceName).toLowerCase()})`,
        ]);
      }
      nextBattlePets = nextBattlePets.map((member) =>
        member.petId === actingMember.petId ? { ...member, cooldown: species.specialAbility.cooldown } : member,
      );
      actingMember = nextBattlePets.find((member) => member.petId === actingMember.petId) ?? actingMember;
    }

    if (actionType === 'item' && itemId) {
      const item = ITEMS[itemId];
      if (!item || (inventory[itemId] || 0) <= 0) {
        return;
      }

      if (item.type !== 'heal' && item.type !== 'buff') {
        return;
      }

      setInventory((prev) => ({
        ...prev,
        [itemId]: prev[itemId] - 1,
      }));

      if (item.type === 'heal') {
        nextBattlePets = nextBattlePets.map((member) =>
          member.petId === actingMember.petId ? { ...member, hp: Math.min(pet.maxHp, member.hp + item.value) } : member,
        );
        setBattleLog((prev) => [...prev, `> ${pet.name} uses ${item.name} and restores ${item.value} HP.`]);
      } else {
        nextBattlePets = nextBattlePets.map((member) =>
          member.petId === actingMember.petId ? { ...member, hasteTurns: item.value } : member,
        );
        setBattleLog((prev) => [...prev, `> ${pet.name} drinks ${item.name} and gains haste.`]);
      }
      actingMember = nextBattlePets.find((member) => member.petId === actingMember.petId) ?? actingMember;
    }

    if (actionType !== 'special' && actingMember.cooldown > 0) {
      nextBattlePets = nextBattlePets.map((member) =>
        member.petId === actingMember.petId ? { ...member, cooldown: member.cooldown - 1 } : member,
      );
    }

    setCurrentHeroHp(nextHeroHp);
    setBattlePets(nextBattlePets);

    if (nextHeroHp <= 0) {
      finishBattle('victory', nextBattlePets);
      return;
    }

    if (getLivingBattlePets(nextBattlePets).length === 0) {
      finishBattle('defeat', nextBattlePets);
      return;
    }

    setPhase('enemy');
  };

  const battleItems = Object.entries(inventory).filter(([itemId, count]) => {
    if (count <= 0) {
      return false;
    }

    const item = ITEMS[itemId];
    return Boolean(item && (item.type === 'heal' || item.type === 'buff'));
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm">
      <div className="flex h-full items-stretch justify-center p-3 md:p-6">
        <div className="relative flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 shadow-2xl shadow-stone-950/80">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${BATTLE_BACKGROUND_PATH})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0.75),rgba(12,10,9,0.92))]" />

          <div className="relative flex items-center justify-between border-b border-stone-800 px-4 py-4 md:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-stone-500">Battle Scene</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-stone-100">Arena Above The Parlour</h2>
            </div>
            <button
              onClick={attemptClose}
              className="rounded-full border border-stone-700 p-2 text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-200"
              aria-label="Close battle scene"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden p-4 md:p-6">
            {phase === 'select' ? (
              <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
                <section className="flex min-h-0 flex-col rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-100">Select Champions</h3>
                    <span className="text-xs font-mono uppercase tracking-[0.25em] text-stone-500">
                      {selectedPetIds.length}/3 selected
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">Choose up to three living monsters. Knocked out monsters cannot join.</p>
                  <div className="mt-5 min-h-0 space-y-3 overflow-y-auto pr-1">
                    {pets.map((candidate) => {
                      const selectedIndex = selectedPetIds.indexOf(candidate.id);
                      const isSelected = selectedIndex !== -1;
                      const isDown = candidate.hp <= 0;

                      return (
                        <button
                          key={candidate.id}
                          onClick={() => toggleSelectedPet(candidate.id)}
                          disabled={isDown}
                          className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-amber-600/60 bg-amber-950/30'
                              : isDown
                                ? 'border-stone-800 bg-stone-950/50 opacity-45'
                                : 'border-stone-800 bg-stone-950/80 hover:border-stone-700'
                          }`}
                        >
                        <MonsterPortrait
                          speciesId={candidate.speciesId}
                          alt={candidate.name}
                          className="h-20 w-20 shrink-0"
                          imageClassName="object-contain p-2"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-lg font-bold text-stone-100">{candidate.name}</p>
                            <div className="text-right">
                              <p className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500">Lvl {candidate.level}</p>
                              <p className={`mt-1 text-[11px] font-mono uppercase tracking-[0.2em] ${isSelected ? 'text-amber-300' : 'text-stone-600'}`}>
                                {isDown ? 'Knocked Out' : isSelected ? `Selected • Slot ${selectedIndex + 1}` : 'Available'}
                              </p>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-stone-400">{SPECIES[candidate.speciesId].name}</p>
                          <p className="mt-3 text-xs font-mono text-stone-500">
                            HP {Math.ceil(candidate.hp)}/{candidate.maxHp} | Energy {candidate.energy} | Hunger {candidate.hunger}
                          </p>
                        </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="flex min-h-0 flex-col rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-100">Choose Opponent</h3>
                    <span className="text-xs font-mono uppercase tracking-[0.25em] text-stone-500">
                      {visibleHeroes.length} available
                    </span>
                  </div>
                  <div className="mt-5 min-h-0 space-y-3 overflow-y-auto pr-1">
                    {visibleHeroes.map((hero) => (
                      <button
                        key={hero.id}
                        onClick={() => setSelectedHeroId(hero.id)}
                        className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                          selectedHeroId === hero.id
                            ? 'border-red-600/60 bg-red-950/30'
                            : 'border-stone-800 bg-stone-950/80 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <HeroPortrait
                                heroId={hero.id}
                                alt={hero.name}
                                className="h-14 w-14 shrink-0"
                                imageClassName="object-contain p-1.5"
                                fallbackClassName="text-2xl"
                              />
                              <div>
                                <p className="text-lg font-bold text-stone-100">{hero.name}</p>
                                <p className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                                  Level {hero.level}
                                </p>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-stone-400">{hero.description}</p>
                            <div className="mt-3 rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-2">
                              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500">
                                Special • {hero.specialAbility.name}
                              </p>
                              <p className="mt-1 text-sm text-stone-300">{hero.specialAbility.description}</p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-right">
                            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400">Rewards</p>
                            <p className="mt-1 font-mono text-sm text-amber-200">{getBattleReward(hero.reward)}g</p>
                            <p className="mt-1 text-xs font-mono text-stone-300">{getBattleXp(hero.level)} XP</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {visibleHeroes.length < HEROES.length ? (
                    <p className="mt-4 shrink-0 text-sm text-stone-500">
                      Defeat {visibleHeroes[visibleHeroes.length - 1].name} or stronger to reveal up to three more heroes.
                    </p>
                  ) : null}
                </section>

                <section className="flex min-h-0 flex-col rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                  <h3 className="font-serif text-xl font-bold text-stone-100">Preview</h3>
                  {selectedPets.length > 0 && heroDef ? (
                    <div className="mt-5 flex min-h-0 flex-1 flex-col space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
                        <p className="text-xs font-mono uppercase tracking-[0.24em] text-stone-500">Selected Team</p>
                        <div className="mt-4 grid gap-3">
                          {selectedPets.map((candidate, index) => {
                            const candidateSpecies = SPECIES[candidate.speciesId];

                            return (
                              <div key={candidate.id} className="flex items-center gap-3 rounded-[1.25rem] border border-stone-800 bg-stone-900/70 p-3">
                                <MonsterPortrait
                                  speciesId={candidate.speciesId}
                                  alt={candidate.name}
                                  className="h-14 w-14 shrink-0"
                                  imageClassName="object-contain p-1.5"
                                  fallbackClassName="text-2xl"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-stone-100">{candidate.name}</p>
                                  <p className="text-sm text-stone-400">{candidateSpecies.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-300">
                                    {index === 0 ? 'Slot 1 • Lead' : `Slot ${index + 1}`}
                                  </p>
                                  <p className="mt-1 text-xs font-mono text-stone-500">Lvl {candidate.level}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4">
                        <p className="text-lg font-bold text-stone-100">Battle Plan</p>
                        <p className="mt-1 text-sm text-stone-400">
                          {selectedPets.length === 1
                            ? `${selectedPets[0].name} enters alone.`
                            : `${selectedPets.length} monsters will rotate turns against ${heroDef.name}.`}
                        </p>
                        <div className="mt-3 rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-3">
                          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500">
                            Opponent Special • {heroDef.specialAbility.name}
                          </p>
                          <p className="mt-1 text-sm text-stone-300">{heroDef.specialAbility.description}</p>
                          <p className="mt-2 text-xs text-stone-400">
                            {getSpecialEffectText(heroDef.specialAbility)} Cooldown {heroDef.specialAbility.cooldown} turns.
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-stone-500">
                          Facing {heroDef.name}. Reward: {getBattleReward(heroDef.reward)} gold,{' '}
                          {selectedPets.length > 1
                            ? `${Math.floor(getBattleXp(heroDef.level) / selectedPets.length)} XP each`
                            : `${getBattleXp(heroDef.level)} XP`}
                          .
                        </p>
                      </div>
                      <button
                        onClick={startBattle}
                        disabled={selectedPets.length === 0}
                        className="battle-start-shimmer mt-auto w-full rounded-[1.25rem] border border-amber-500/60 bg-[linear-gradient(135deg,#b45309,#d97706,#f59e0b)] px-4 py-3 font-semibold text-amber-50 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.01] hover:brightness-110"
                      >
                        <span className="relative z-10">Start Battle</span>
                      </button>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-stone-500">Pick one to three living monsters and an opponent to begin.</p>
                  )}
                </section>
              </div>
            ) : (
              <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-h-0 flex-col gap-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {activeTeamPets.length > 0 ? (
                      <div className="rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-2xl font-bold text-stone-100">Your Team</p>
                            <p className="mt-1 text-sm text-stone-400">
                              {pet ? `${pet.name} acts now.` : 'Waiting for the next living monster.'}
                            </p>
                          </div>
                          <p className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                            {getLivingBattlePets(battlePets).length} living
                          </p>
                        </div>
                        <div className="mt-5 grid gap-3">
                          {activeTeamPets.map(({ member, pet: teamPet, species: teamSpecies }) => (
                            <div
                              key={teamPet.id}
                              className={`rounded-[1.25rem] border p-3 ${
                                activePetId === teamPet.id
                                  ? 'border-amber-600/60 bg-amber-950/20'
                                  : 'border-stone-800 bg-stone-950/70'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <MonsterPortrait
                                  speciesId={teamPet.speciesId}
                                  alt={teamPet.name}
                                  className="h-16 w-16 shrink-0"
                                  imageClassName="object-contain p-2"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate font-semibold text-stone-100">{teamPet.name}</p>
                                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                                      {member.hp > 0 ? activePetId === teamPet.id ? 'Active' : 'Ready' : 'Down'}
                                    </p>
                                  </div>
                                  <p className="text-sm text-stone-400">{teamSpecies.name}</p>
                                  <div className="mt-2 grid grid-cols-3 gap-2">
                                    <StatTile label="HP" value={`${Math.max(0, Math.ceil(member.hp))}/${member.maxHp}`} color="red" />
                                    <StatTile label="Energy" value={`${Math.max(0, Math.ceil(member.energy))}`} color="amber" />
                                    <StatTile label="Hunger" value={`${Math.max(0, Math.ceil(member.hunger))}`} color="emerald" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {heroDef ? (
                      <div className="rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                        <div className="flex items-start gap-4">
                          <HeroPortrait
                            heroId={heroDef.id}
                            alt={heroDef.name}
                            className="h-28 w-28 shrink-0"
                            imageClassName="object-contain p-2"
                            fallbackClassName="text-5xl"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xl font-bold text-stone-100">{heroDef.name}</p>
                            <p className="mt-1 text-sm text-stone-400">{heroDef.description}</p>
                            <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                              Level {heroDef.level}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5">
                          <div className="flex justify-between text-sm text-stone-400">
                            <span>Hero HP</span>
                            <span className="font-mono text-stone-300">
                              {Math.max(0, Math.ceil(currentHeroHp))}/{heroDef.maxHp}
                            </span>
                          </div>
                          <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-950">
                            <div
                              className="h-full bg-red-500 transition-all duration-300"
                              style={{ width: `${Math.max(0, (currentHeroHp / heroDef.maxHp) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 rounded-[1.25rem] border border-stone-800 bg-stone-950/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-stone-200">{heroDef.specialAbility.name}</p>
                            <p className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                              {(currentHeroCooldown ?? 0) > 0
                                ? `${currentHeroCooldown} turn${currentHeroCooldown === 1 ? '' : 's'}`
                                : 'Ready'}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-stone-400">{heroDef.specialAbility.description}</p>
                          <p className="mt-2 text-sm text-stone-200">{getSpecialEffectText(heroDef.specialAbility)}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-stone-800 bg-stone-950/80">
                    <div className="flex items-center justify-between border-b border-stone-800 px-5 py-4">
                      <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-stone-100">
                        <Swords size={20} className="text-amber-500" />
                        Battle Log
                      </h3>
                      <span className="text-xs font-mono uppercase tracking-[0.25em] text-stone-500">
                        {phase === 'player' ? 'Your turn' : phase === 'enemy' ? 'Enemy turn' : 'Resolved'}
                      </span>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-5 font-mono text-sm">
                      {battleLog.length === 0 ? <p className="text-stone-500">Choose your action.</p> : null}
                      {battleLog.map((entry, index) => (
                        <p
                          key={`${entry}-${index}`}
                          className={
                            entry.includes('VICTORY')
                              ? 'font-bold text-emerald-400'
                              : entry.includes('DEFEAT')
                                ? 'font-bold text-red-400'
                                : entry.includes('START')
                                  ? 'font-bold text-amber-400'
                                  : 'text-stone-300'
                          }
                        >
                          {entry}
                        </p>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                </div>

                <aside className="flex min-h-0 flex-col rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
                  {pet && species ? (
                    <>
                      <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4">
                        <p className="text-xs font-mono uppercase tracking-[0.22em] text-stone-500">Active Monster</p>
                        <p className="text-sm font-semibold text-stone-200">{species.specialAbility.name}</p>
                        <p className="mt-2 text-sm text-stone-400">{species.specialAbility.description}</p>
                        <p className="mt-2 text-sm text-stone-200">{getSpecialEffectText(species.specialAbility)}</p>
                        <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                          Cooldown {activeBattlePet?.cooldown ?? 0} | Cost {getSpecialCostText(species.specialAbility).toLowerCase()}
                        </p>
                      </div>

                      {phase === 'player' ? (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <ActionButton
                            icon={<Swords size={18} className="text-red-400" />}
                            title="Attack"
                            description="Reliable melee strike."
                            onClick={() => handlePlayerAction('attack')}
                          />
                          <ActionButton
                            icon={<Zap size={18} className="text-indigo-400" />}
                            title={species.specialAbility.name}
                            description={`${getSpecialEffectText(species.specialAbility)} Costs ${getSpecialCostText(species.specialAbility).toLowerCase()}.`}
                            badge={
                              (activeBattlePet?.cooldown ?? 0) > 0
                                ? `${activeBattlePet?.cooldown} turn${activeBattlePet?.cooldown === 1 ? '' : 's'}`
                                : 'Ready'
                            }
                            onClick={() => handlePlayerAction('special')}
                            disabled={
                              (activeBattlePet?.cooldown ?? 0) > 0 ||
                              (species.specialAbility.resource === 'energy' && (activeBattlePet?.energy ?? 0) < species.specialAbility.cost) ||
                              (species.specialAbility.resource === 'hunger' && (activeBattlePet?.hunger ?? 0) < species.specialAbility.cost) ||
                              (species.specialAbility.resource === 'hp' && (activeBattlePet?.hp ?? 0) <= species.specialAbility.cost)
                            }
                          />
                          <div className="rounded-[1.25rem] border border-stone-800 bg-stone-950/80 p-3">
                            <div className="mb-3 flex items-center gap-2 text-stone-200">
                              <Package size={16} className="text-emerald-400" />
                              <span className="font-semibold">Use Item</span>
                            </div>
                            <div className="space-y-2">
                              {battleItems.length > 0 ? (
                                battleItems.map(([itemId, count]) => (
                                  <button
                                    key={itemId}
                                    onClick={() => handlePlayerAction('item', itemId)}
                                    className="flex w-full items-center justify-between rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-left transition-colors hover:border-stone-700"
                                  >
                                    <span className="text-sm text-stone-200">{ITEMS[itemId].name}</span>
                                    <span className="text-xs font-mono text-stone-500">x{count}</span>
                                  </button>
                                ))
                              ) : (
                                <p className="text-sm text-stone-500">No battle items available.</p>
                              )}
                            </div>
                          </div>
                          <ActionButton
                            icon={<Shield size={18} className="text-stone-300" />}
                            title="Surrender"
                            description="Leave battle and your monster is knocked out."
                            onClick={() => setSurrenderPromptOpen(true)}
                          />
                        </div>
                      ) : null}

                      {phase === 'end' ? (
                        <div className="mt-5 rounded-[1.25rem] border border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-400">
                          Battle resolved. Choose your next step in the result panel.
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </aside>
              </div>
            )}
          </div>
          {surrenderPromptOpen ? (
            <ConfirmationDialog
              title="Surrender Battle?"
              description={`${pet?.name ?? 'Your monster'} will be knocked out immediately if you leave this fight now.`}
              confirmLabel="Surrender"
              onConfirm={surrenderBattle}
              onCancel={() => setSurrenderPromptOpen(false)}
            />
          ) : null}
          {blockedStartMessage ? (
            <NoticeDialog
              title="Battle Not Allowed"
              description={blockedStartMessage}
              confirmLabel="Understood"
              onConfirm={() => setBlockedStartMessage(null)}
            />
          ) : null}
          {resolution ? (
            <BattleResolutionDialog
              resolution={resolution}
              onReplay={resetBattle}
              onReturn={() => {
                setResolution(null);
                onClose();
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-stone-800 bg-stone-900 p-6 shadow-2xl shadow-stone-950/70">
        <h3 className="font-serif text-2xl font-bold text-stone-100">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-[1rem] border border-stone-700 bg-stone-950/80 px-4 py-3 font-semibold text-stone-200 transition-colors hover:border-stone-500"
          >
            Stay In Battle
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-[1rem] border border-red-900/60 bg-red-950/50 px-4 py-3 font-semibold text-red-100 transition-colors hover:bg-red-950/70"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoticeDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-stone-800 bg-stone-900 p-6 shadow-2xl shadow-stone-950/70">
        <h3 className="font-serif text-2xl font-bold text-stone-100">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
        <div className="mt-6">
          <button
            onClick={onConfirm}
            className="w-full rounded-[1rem] bg-amber-700 px-4 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function BattleResolutionDialog({
  resolution,
  onReplay,
  onReturn,
}: {
  resolution: BattleResolution;
  onReplay: () => void;
  onReturn: () => void;
}) {
  const accentClass =
    resolution.outcome === 'victory'
      ? 'border-emerald-800/70 bg-emerald-950/35 text-emerald-100'
      : 'border-red-900/70 bg-red-950/35 text-red-100';

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-[1.9rem] border p-6 shadow-2xl shadow-stone-950/70 ${accentClass}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-stone-400">
              {resolution.outcome === 'victory' ? 'Battle Won' : 'Battle Lost'}
            </p>
            <h3 className="mt-2 font-serif text-3xl font-bold">{resolution.title}</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-stone-950/50 px-4 py-2 text-sm font-semibold text-stone-100">
            {resolution.outcome === 'victory' ? 'Celebration' : 'Recovery'}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-stone-300">{resolution.description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ResultTile label="Gold Earned" value={`${resolution.goldEarned}g`} tone={resolution.outcome} />
          <ResultTile
            label={resolution.participantCount > 1 ? 'XP Each' : 'XP Earned'}
            value={`${resolution.xpEarned} XP`}
            tone={resolution.outcome}
          />
        </div>

        {resolution.participantCount > 1 ? (
          <div className="mt-3 rounded-[1.25rem] border border-stone-800/80 bg-stone-950/60 p-4 text-sm text-stone-300">
            {resolution.xpTotalEarned} total XP was split across {resolution.participantCount} monsters.
          </div>
        ) : null}

        <div className="mt-4 rounded-[1.25rem] border border-stone-800/80 bg-stone-950/60 p-4 text-sm text-stone-300">
          {resolution.levelUps.length > 0 ? (
            <p>
              {resolution.levelUps.join(' | ')}. {resolution.nextLevelSummary}
            </p>
          ) : (
            <p>
              {resolution.nextLevelSummary}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onReplay}
            className="flex-1 rounded-[1rem] border border-stone-700 bg-stone-950/80 px-4 py-3 font-semibold text-stone-100 transition-colors hover:border-stone-500"
          >
            Fight Again
          </button>
          <button
            onClick={onReturn}
            className="flex-1 rounded-[1rem] bg-amber-700 px-4 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-600"
          >
            Return To Parlour
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: BattleOutcome;
}) {
  const toneClass =
    tone === 'victory'
      ? 'border-emerald-800/60 bg-emerald-950/30'
      : 'border-red-900/60 bg-red-950/30';

  return (
    <div className={`rounded-[1.25rem] border p-4 ${toneClass}`}>
      <p className="text-xs font-mono uppercase tracking-[0.22em] text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-stone-100">{value}</p>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: 'red' | 'amber' | 'emerald' }) {
  const colorClass =
    color === 'red'
      ? 'text-red-300 bg-red-950/30 border-red-900/30'
      : color === 'amber'
        ? 'text-amber-300 bg-amber-950/30 border-amber-900/30'
        : 'text-emerald-300 bg-emerald-950/30 border-emerald-900/30';

  return (
    <div className={`rounded-[1.25rem] border p-3 ${colorClass}`}>
      <p className="text-xs font-mono uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-stone-100">{value}</p>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  description,
  badge,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-[1.25rem] border border-stone-800 bg-stone-950/80 p-4 text-left transition-colors hover:border-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-900">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-stone-100">{title}</p>
            {badge ? (
              <span className="rounded-full border border-stone-700 bg-stone-900 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>
      </div>
    </button>
  );
}
