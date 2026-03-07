import React, { useEffect, useRef, useState } from 'react';
import { BATTLE_BACKGROUND_PATH } from '../art';
import { HEROES, ITEMS, SPECIES } from '../data';
import type { Pet } from '../types';
import { applyXpGain, getModifier, rollDice } from '../utils';
import MonsterPortrait from './MonsterPortrait';
import HeroPortrait from './HeroPortrait';
import { Package, Shield, Swords, X, Zap } from 'lucide-react';

type BattlePhase = 'select' | 'player' | 'enemy' | 'end';

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
};

function getResourceLabel(resource: 'energy' | 'hunger' | 'hp') {
  if (resource === 'hp') {
    return 'Health';
  }
  if (resource === 'hunger') {
    return 'Hunger';
  }
  return 'Energy';
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
}: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId ?? pets[0]?.id ?? '');
  const [selectedHeroId, setSelectedHeroId] = useState(HEROES[0].id);
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [currentPetHp, setCurrentPetHp] = useState(0);
  const [currentPetEnergy, setCurrentPetEnergy] = useState(0);
  const [currentPetHunger, setCurrentPetHunger] = useState(0);
  const [currentHeroHp, setCurrentHeroHp] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [hasteTurns, setHasteTurns] = useState(0);
  const [surrenderPromptOpen, setSurrenderPromptOpen] = useState(false);
  const maxVisibleHeroIndex = Math.min(HEROES.length - 1, Math.max(3, highestDefeatedHeroIndex + 3));
  const visibleHeroes = HEROES.slice(0, maxVisibleHeroIndex + 1);

  const pet = pets.find((candidate) => candidate.id === selectedPetId);
  const heroDef = HEROES.find((hero) => hero.id === selectedHeroId);
  const species = pet ? SPECIES[pet.speciesId] : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedPetId(initialPetId ?? pets[0]?.id ?? '');
    setSelectedHeroId(HEROES[0].id);
    setPhase('select');
    setBattleLog([]);
    setCooldown(0);
    setHasteTurns(0);
    setSurrenderPromptOpen(false);
  }, [open, initialPetId, pets]);

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
    if (phase !== 'enemy' || !pet || !heroDef) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const hit = rollDice(20) + getModifier(heroDef.stats.str);
      const armorClass = 10 + getModifier(pet.stats.dex);
      let nextPetHp = currentPetHp;

      if (hit >= armorClass) {
        const damage = Math.max(1, rollDice(8) + getModifier(heroDef.stats.str));
        nextPetHp -= damage;
        setBattleLog((prev) => [...prev, `> ${heroDef.name} hits ${pet.name} for ${damage} damage.`]);
      } else {
        setBattleLog((prev) => [...prev, `> ${heroDef.name} misses ${pet.name}.`]);
      }

      setCurrentPetHp(nextPetHp);
      if (nextPetHp <= 0) {
        finishBattle('defeat', nextPetHp, currentPetEnergy, currentPetHunger);
      } else {
        setPhase('player');
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [phase, pet, heroDef, currentPetHp, currentPetEnergy, currentPetHunger]);

  if (!open) {
    return null;
  }

  const resetBattle = () => {
    setPhase('select');
    setBattleLog([]);
    setCooldown(0);
    setHasteTurns(0);
    setSurrenderPromptOpen(false);
  };

  const attemptClose = () => {
    if (phase === 'player' || phase === 'enemy') {
      setSurrenderPromptOpen(true);
      return;
    }

    onClose();
  };

  const surrenderBattle = () => {
    if (!pet) {
      onClose();
      return;
    }

    setPets((prev) =>
      prev.map((candidate) =>
        candidate.id === pet.id
          ? {
              ...candidate,
              hp: 0,
              energy: Math.max(0, currentPetEnergy),
              hunger: Math.max(0, currentPetHunger),
              happiness: Math.max(0, candidate.happiness - 20),
            }
          : candidate,
      ),
    );
    setSurrenderPromptOpen(false);
    onClose();
  };

  const startBattle = () => {
    if (!pet || !heroDef || !species) {
      return;
    }

    if (pet.hp <= 0) {
      setBattleLog([`[System] ${pet.name} is too weak to fight.`]);
      return;
    }

    if (pet.energy < 20) {
      setBattleLog([`[System] ${pet.name} needs at least 20 energy to enter battle.`]);
      return;
    }

    setCurrentPetHp(pet.hp);
    setCurrentPetEnergy(pet.energy);
    setCurrentPetHunger(pet.hunger);
    setCurrentHeroHp(heroDef.hp);
    setCooldown(0);
    setHasteTurns(0);
    setBattleLog([
      `--- BATTLE START: ${pet.name} vs ${heroDef.name} ---`,
      `${species.specialAbility.name} costs ${species.specialAbility.cost} ${getResourceLabel(species.specialAbility.resource).toLowerCase()}.`,
    ]);
    setPhase('player');
  };

  const finishBattle = (
    outcome: 'victory' | 'defeat',
    nextPetHp = currentPetHp,
    nextPetEnergy = currentPetEnergy,
    nextPetHunger = currentPetHunger,
  ) => {
    if (!pet || !heroDef) {
      return;
    }

    setPhase('end');

    if (outcome === 'victory') {
      const defeatedHeroIndex = HEROES.findIndex((hero) => hero.id === heroDef.id);
      const xpGain = heroDef.level * 25;
      const xpResult = applyXpGain(
        {
          ...pet,
          hp: Math.max(1, nextPetHp),
          energy: Math.max(0, nextPetEnergy),
          hunger: Math.max(0, nextPetHunger),
        },
        xpGain,
      );

      setGold((prev) => prev + heroDef.reward);
      setHighestDefeatedHeroIndex((prev) => Math.max(prev, defeatedHeroIndex));
      setPets((prev) =>
        prev.map((candidate) =>
          candidate.id === pet.id
            ? {
                ...xpResult.pet,
                happiness: Math.min(100, candidate.happiness + 8),
              }
            : candidate,
        ),
      );
      setBattleLog((prev) => [
        ...prev,
        '--- VICTORY ---',
        `${pet.name} defeated ${heroDef.name}.`,
        `Gained ${heroDef.reward} gold and ${xpGain} XP.`,
        `${xpResult.xpToNextLevel} XP until level ${xpResult.pet.level + 1}.`,
        ...(xpResult.levelsGained > 0 ? [`${pet.name} reached level ${xpResult.pet.level}.`] : []),
      ]);
      return;
    }

    setPets((prev) =>
      prev.map((candidate) =>
        candidate.id === pet.id
          ? {
              ...candidate,
              hp: 0,
              energy: Math.max(0, nextPetEnergy),
              hunger: Math.max(0, nextPetHunger),
              happiness: Math.max(0, candidate.happiness - 20),
            }
          : candidate,
      ),
    );
    setBattleLog((prev) => [...prev, '--- DEFEAT ---', `${pet.name} was defeated by ${heroDef.name}.`]);
  };

  const handlePlayerAction = (actionType: 'attack' | 'special' | 'item' | 'run', itemId?: string) => {
    if (phase !== 'player' || !pet || !heroDef || !species) {
      return;
    }

    let nextHeroHp = currentHeroHp;
    let nextPetHp = currentPetHp;
    let nextPetEnergy = currentPetEnergy;
    let nextPetHunger = currentPetHunger;
    let nextCooldown = cooldown;
    let nextHasteTurns = hasteTurns > 0 ? hasteTurns - 1 : 0;
    const isHasted = hasteTurns > 0;

    if (actionType === 'attack') {
      const attacks = isHasted ? 2 : 1;
      nextPetEnergy = Math.max(0, nextPetEnergy - 6);
      nextPetHunger = Math.max(0, nextPetHunger - 2);

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
        resourceName === 'energy' ? nextPetEnergy : resourceName === 'hunger' ? nextPetHunger : nextPetHp;

      if (nextCooldown > 0 || availableResource < species.specialAbility.cost) {
        return;
      }

      if (resourceName === 'energy') {
        nextPetEnergy -= species.specialAbility.cost;
      } else if (resourceName === 'hunger') {
        nextPetHunger -= species.specialAbility.cost;
      } else {
        nextPetHp -= species.specialAbility.cost;
      }

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
      nextCooldown = species.specialAbility.cooldown;
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
        nextPetHp = Math.min(pet.maxHp, nextPetHp + item.value);
        setBattleLog((prev) => [...prev, `> ${pet.name} uses ${item.name} and restores ${item.value} HP.`]);
      } else {
        nextHasteTurns = item.value;
        setBattleLog((prev) => [...prev, `> ${pet.name} drinks ${item.name} and gains haste.`]);
      }
    }

    if (actionType !== 'special' && nextCooldown > 0) {
      nextCooldown -= 1;
    }

    setCurrentHeroHp(nextHeroHp);
    setCurrentPetHp(nextPetHp);
    setCurrentPetEnergy(nextPetEnergy);
    setCurrentPetHunger(nextPetHunger);
    setCooldown(nextCooldown);
    setHasteTurns(nextHasteTurns);

    if (nextHeroHp <= 0) {
      finishBattle('victory', nextPetHp, nextPetEnergy, nextPetHunger);
      return;
    }

    if (nextPetHp <= 0) {
      finishBattle('defeat', nextPetHp, nextPetEnergy, nextPetHunger);
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

          <div className="relative flex-1 overflow-y-auto p-4 md:p-6">
            {phase === 'select' ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
                <section className="rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-100">Select Champion</h3>
                    <span className="text-xs font-mono uppercase tracking-[0.25em] text-stone-500">{pets.length} pets</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {pets.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => setSelectedPetId(candidate.id)}
                        className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-3 text-left transition-all ${
                          selectedPetId === candidate.id
                            ? 'border-amber-600/60 bg-amber-950/30'
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
                            <p className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                              Lvl {candidate.level}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-stone-400">{SPECIES[candidate.speciesId].name}</p>
                          <p className="mt-3 text-xs font-mono text-stone-500">
                            HP {Math.ceil(candidate.hp)}/{candidate.maxHp} | Energy {candidate.energy} | Hunger {candidate.hunger}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-100">Choose Opponent</h3>
                    <span className="text-xs font-mono uppercase tracking-[0.25em] text-stone-500">
                      {visibleHeroes.length} available
                    </span>
                  </div>
                  <div className="mt-5 space-y-3">
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
                          </div>
                          <div className="rounded-xl border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-right">
                            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400">Reward</p>
                            <p className="mt-1 font-mono text-sm text-amber-200">{hero.reward}g</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {visibleHeroes.length < HEROES.length ? (
                    <p className="mt-4 text-sm text-stone-500">
                      Defeat {visibleHeroes[visibleHeroes.length - 1].name} or stronger to reveal up to three more heroes.
                    </p>
                  ) : null}
                </section>

                <section className="rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                  <h3 className="font-serif text-xl font-bold text-stone-100">Preview</h3>
                  {pet && species && heroDef ? (
                    <div className="mt-5 space-y-4">
                      <MonsterPortrait
                        speciesId={pet.speciesId}
                        alt={pet.name}
                        className="h-60 w-full bg-stone-950/60"
                        imageClassName="object-contain object-center p-8 scale-90"
                      />
                      <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4">
                        <p className="text-lg font-bold text-stone-100">{pet.name}</p>
                        <p className="mt-1 text-sm text-stone-400">
                          {species.specialAbility.name} costs {species.specialAbility.cost}{' '}
                          {getResourceLabel(species.specialAbility.resource).toLowerCase()}.
                        </p>
                        <p className="mt-3 text-sm text-stone-500">
                          Facing {heroDef.name}. Reward: {heroDef.reward} gold, {heroDef.level * 25} XP.
                        </p>
                      </div>
                      <button
                        onClick={startBattle}
                        className="battle-start-shimmer w-full rounded-[1.25rem] border border-amber-500/60 bg-[linear-gradient(135deg,#b45309,#d97706,#f59e0b)] px-4 py-3 font-semibold text-amber-50 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.01] hover:brightness-110"
                      >
                        <span className="relative z-10">Start Battle</span>
                      </button>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-stone-500">Pick a pet and a hero to begin.</p>
                  )}
                </section>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {pet && species ? (
                      <div className="rounded-[1.75rem] border border-stone-800 bg-stone-900/70 p-5">
                        <div className="flex items-start gap-4">
                          <MonsterPortrait
                            speciesId={pet.speciesId}
                            alt={pet.name}
                            className="h-28 w-28 shrink-0"
                            imageClassName="object-contain p-3"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xl font-bold text-stone-100">{pet.name}</p>
                            <p className="mt-1 text-sm text-stone-400">{species.name}</p>
                            <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                              Special: {species.specialAbility.name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <StatTile label="HP" value={`${Math.max(0, Math.ceil(currentPetHp))}/${pet.maxHp}`} color="red" />
                          <StatTile label="Energy" value={`${Math.max(0, Math.ceil(currentPetEnergy))}`} color="amber" />
                          <StatTile label="Hunger" value={`${Math.max(0, Math.ceil(currentPetHunger))}`} color="emerald" />
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
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[1.75rem] border border-stone-800 bg-stone-950/80">
                    <div className="flex items-center justify-between border-b border-stone-800 px-5 py-4">
                      <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-stone-100">
                        <Swords size={20} className="text-amber-500" />
                        Battle Log
                      </h3>
                      <span className="text-xs font-mono uppercase tracking-[0.25em] text-stone-500">
                        {phase === 'player' ? 'Your turn' : phase === 'enemy' ? 'Enemy turn' : 'Resolved'}
                      </span>
                    </div>
                    <div className="max-h-[26rem] space-y-2 overflow-y-auto p-5 font-mono text-sm">
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

                <aside className="rounded-[1.75rem] border border-stone-800 bg-stone-900/75 p-5">
                  {pet && species ? (
                    <>
                      <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4">
                        <p className="text-sm font-semibold text-stone-200">{species.specialAbility.name}</p>
                        <p className="mt-2 text-sm text-stone-400">{species.specialAbility.description}</p>
                        <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
                          Cooldown {cooldown} | Cost {species.specialAbility.cost}{' '}
                          {getResourceLabel(species.specialAbility.resource).toLowerCase()}
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
                            description={`Costs ${species.specialAbility.cost} ${getResourceLabel(species.specialAbility.resource).toLowerCase()}.`}
                            badge={cooldown > 0 ? `${cooldown} turn${cooldown === 1 ? '' : 's'}` : 'Ready'}
                            onClick={() => handlePlayerAction('special')}
                            disabled={
                              cooldown > 0 ||
                              (species.specialAbility.resource === 'energy' && currentPetEnergy < species.specialAbility.cost) ||
                              (species.specialAbility.resource === 'hunger' && currentPetHunger < species.specialAbility.cost) ||
                              (species.specialAbility.resource === 'hp' && currentPetHp <= species.specialAbility.cost)
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
                        <div className="mt-5 space-y-3">
                          <button
                            onClick={resetBattle}
                            className="w-full rounded-[1.25rem] border border-stone-700 bg-stone-950/80 px-4 py-3 font-semibold text-stone-200 transition-colors hover:border-stone-500"
                          >
                            Fight Again
                          </button>
                          <button
                            onClick={onClose}
                            className="w-full rounded-[1.25rem] bg-amber-700 px-4 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-600"
                          >
                            Return To Parlour
                          </button>
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
