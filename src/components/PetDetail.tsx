import React from 'react';
import { Pet } from '../types';
import { SPECIES } from '../data';
import { Activity, CircleHelp, Heart, Sparkles, Utensils, Zap } from 'lucide-react';
import MonsterPortrait from './MonsterPortrait';
import { applyXpGain, getAttackDamageRange, getSpecialCostText, getSpecialEffectText, getXpRemaining } from '../utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '@/src/lib/utils';

type Props = {
  pet: Pet;
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  gold: number;
  setGold: (g: number) => void;
  onBattleOpen: (petId: string) => void;
};

type MeterTone = 'red' | 'emerald' | 'amber' | 'pink';
type AttributeInfo = {
  title: string;
  description: string;
};

const ATTRIBUTE_INFO: Record<string, AttributeInfo> = {
  health: {
    title: 'Health',
    description:
      'Health determines whether a monster can fight. At 0 HP it is knocked out, cannot start battles, and must be healed to return.',
  },
  hunger: {
    title: 'Hunger',
    description:
      'Hunger is a need meter spent by exercise and battles, and some special abilities may consume it directly. Low hunger means the monster needs food soon.',
  },
  energy: {
    title: 'Energy',
    description:
      'Energy powers activity. Exercise, attacks, and some specials spend energy. A monster needs enough energy to enter battle and perform reliably.',
  },
  happiness: {
    title: 'Happiness',
    description:
      'Happiness tracks how well cared for the monster is. Feeding, exercise, and wins raise it; defeats lower it. Right now it does not directly change combat rolls or stats.',
  },
  attack: {
    title: 'Attack Damage',
    description:
      'This is the normal attack damage range for a basic hit. It uses the same d8 plus Strength modifier formula as battle attacks.',
  },
  str: {
    title: 'Strength',
    description:
      'Strength is used for normal attack rolls and damage in battle. Higher Strength means stronger and more accurate attacks.',
  },
  dex: {
    title: 'Dexterity',
    description:
      'Dexterity improves defense by raising armor class against enemy attacks. Higher Dexterity makes a monster harder to hit.',
  },
  con: {
    title: 'Constitution',
    description:
      'Constitution drives maximum HP growth. Monsters with better Constitution gain more survivability as they level.',
  },
  int: {
    title: 'Intelligence',
    description: 'Intelligence is tracked as part of the creature profile, but it does not yet have a direct gameplay effect.',
  },
  wis: {
    title: 'Wisdom',
    description: 'Wisdom is tracked as part of the creature profile, but it does not yet have a direct gameplay effect.',
  },
  cha: {
    title: 'Charisma',
    description: 'Charisma is tracked as part of the creature profile, but it does not yet have a direct gameplay effect.',
  },
};

export default function PetDetail({
  pet,
  setPets,
  inventory,
  setInventory,
  gold,
  setGold,
  onBattleOpen,
}: Props) {
  const species = SPECIES[pet.speciesId];
  const [activityMessage, setActivityMessage] = React.useState<string | null>(null);
  const [portraitOpen, setPortraitOpen] = React.useState(false);
  const [infoKey, setInfoKey] = React.useState<keyof typeof ATTRIBUTE_INFO | null>(null);
  const xpToNextLevel = getXpRemaining(pet.level, pet.xp);
  const isDowned = pet.hp <= 0;
  const specialEffectText = getSpecialEffectText(species.specialAbility);
  const attackDamage = getAttackDamageRange(pet.stats.str);
  const attackDamageText =
    attackDamage.min === attackDamage.max ? `${attackDamage.max}` : `${attackDamage.min}-${attackDamage.max}`;
  const statusMeters = [
    {
      infoKey: 'health' as const,
      icon: Heart,
      label: 'Health',
      value: pet.hp,
      max: pet.maxHp,
      tone: 'red' as const,
      detail: isDowned ? 'Needs healing to recover' : 'Stable',
    },
    {
      infoKey: 'hunger' as const,
      icon: Utensils,
      label: 'Hunger',
      value: pet.hunger,
      max: 100,
      tone: 'emerald' as const,
      detail: pet.hunger < 25 ? 'Needs feeding soon' : 'Well fed',
    },
    {
      infoKey: 'energy' as const,
      icon: Zap,
      label: 'Energy',
      value: pet.energy,
      max: 100,
      tone: 'amber' as const,
      detail: pet.energy < 25 ? 'Running low' : 'Charged',
    },
    {
      infoKey: 'happiness' as const,
      icon: Sparkles,
      label: 'Happiness',
      value: pet.happiness,
      max: 100,
      tone: 'pink' as const,
      detail: pet.happiness < 30 ? 'Needs attention' : 'Content',
    },
  ];

  const updatePet = (updates: Partial<Pet>) => {
    setPets((prev) => prev.map((candidate) => (candidate.id === pet.id ? { ...candidate, ...updates } : candidate)));
  };

  const consumeItem = (itemId: string) => {
    setInventory((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1),
    }));
  };

  const handleFeed = () => {
    if ((inventory.monster_chow || 0) >= 1 && pet.hunger < 100) {
      consumeItem('monster_chow');
      updatePet({
        hunger: Math.min(100, pet.hunger + 30),
        happiness: Math.min(100, pet.happiness + 10),
        hp: isDowned ? pet.hp : Math.min(pet.maxHp, pet.hp + 5),
      });
      setActivityMessage(
        isDowned
          ? `${pet.name} ate, but still needs healing before it can get back up.`
          : `${pet.name} devoured a meal and looks sturdier.`,
      );
    }
  };

  const handleExercise = () => {
    if (pet.energy >= 20 && pet.hunger >= 10) {
      const result = applyXpGain(
        {
          ...pet,
          energy: pet.energy - 20,
          hunger: pet.hunger - 10,
          happiness: Math.min(100, pet.happiness + 20),
        },
        10,
      );
      updatePet(result.pet);
      setActivityMessage(
        result.levelsGained > 0
          ? `${pet.name} reached level ${result.pet.level} and now needs ${result.xpToNextLevel} XP for the next level.`
          : `${pet.name} trained hard and needs ${result.xpToNextLevel} XP for level ${result.pet.level + 1}.`,
      );
    }
  };

  const handleRest = () => {
    if (isDowned) {
      setActivityMessage(`${pet.name} cannot rest back from 0 HP. Use healing to revive it.`);
      return;
    }

    updatePet({
      energy: Math.min(100, pet.energy + 40),
      hunger: Math.max(0, pet.hunger - 10),
      hp: Math.min(pet.maxHp, pet.hp + 10),
    });
    setActivityMessage(`${pet.name} rested and recovered some strength.`);
  };

  const handleHeal = () => {
    if (gold >= 20 && pet.hp < pet.maxHp) {
      setGold(gold - 20);
      updatePet({ hp: pet.maxHp });
      setActivityMessage(`${pet.name} was healed to full health for 20 gold.`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid items-start grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(120,53,15,0.2),transparent_38%),linear-gradient(180deg,#17110d_0%,#1c1917_100%)]">
          <CardContent className="flex flex-1 flex-col p-3 text-center xl:p-5">
            <button
              type="button"
              onClick={() => setPortraitOpen(true)}
              className="mb-3 w-full rounded-[1.75rem] transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 xl:mb-4"
              aria-label={`View ${pet.name} portrait`}
            >
              <MonsterPortrait
                speciesId={pet.speciesId}
                alt={pet.name}
                className="h-[8.5rem] w-full bg-stone-950/70 lg:h-[9rem] xl:h-56"
                imageClassName="object-contain p-3 scale-95 xl:p-4"
                fallbackClassName="text-7xl"
              />
            </button>
            <h2 className="mb-1 text-2xl font-serif font-bold text-stone-100 xl:text-3xl">{pet.name}</h2>
            <p className="text-stone-400">{species.name}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 xl:mt-3">
              <Badge>{species.alignment}</Badge>
              <Badge variant="accent">Level {pet.level}</Badge>
              <Badge variant="secondary">{xpToNextLevel} XP to next</Badge>
            </div>
            <div className="mt-3 w-full space-y-3 text-left xl:mt-5 xl:space-y-4">
              <div className="rounded-[1.5rem] border border-stone-800/70 bg-stone-950/60 p-2.5 xl:p-4">
                <p className="text-sm leading-5 text-stone-300 xl:leading-6">{species.description}</p>
                <p className="mt-2 text-sm leading-5 text-stone-400 xl:mt-3 xl:leading-6">
                  <span className="font-semibold uppercase tracking-[0.2em] text-stone-500">Diet</span>{' '}
                  {species.diet}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-amber-900/30 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(12,10,9,0.96))] p-2.5 xl:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-stone-100 xl:text-lg">{species.specialAbility.name}</h3>
                  </div>
                  <Badge variant="accent" className="shrink-0">
                    {species.specialAbility.cooldown} turns
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-5 text-stone-300 xl:mt-3 xl:leading-6">
                  {species.specialAbility.description}
                </p>
                <div className="mt-3 rounded-xl border border-amber-800/40 bg-stone-950/50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-500/80">Battle Effect</p>
                  <p className="mt-1 text-sm leading-5 text-stone-100">{specialEffectText}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 xl:mt-4">
                  <InfoTile label="Cost" value={getSpecialCostText(species.specialAbility)} />
                  <InfoTile label="Cooldown" value={`${species.specialAbility.cooldown} turns`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.10),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_32%),linear-gradient(180deg,#191614_0%,#1c1917_100%)]">
          <CardHeader className="space-y-1 p-4 pb-2 xl:p-6 xl:pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Status</CardTitle>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Vital meters and core stats
                </p>
              </div>
              <Badge variant={isDowned ? 'secondary' : 'accent'} className="shrink-0">
                {isDowned ? 'Knocked Out' : 'Battle Ready'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 pb-4 xl:space-y-4 xl:p-6 xl:pt-0 xl:pb-5">
            <div className="grid gap-3 md:grid-cols-2">
              {statusMeters.map((meter) => (
                <StatusMeter key={meter.label} {...meter} onInfo={setInfoKey} />
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-stone-800/70 bg-stone-950/70 p-3 xl:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">Core Stats</p>
                </div>
                <Badge variant="secondary">Lvl {pet.level}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatTile label="atk dmg" value={attackDamageText} highlight onInfo={() => setInfoKey('attack')} />
                {Object.entries(pet.stats).map(([stat, value], index) => (
                  <StatTile
                    key={stat}
                    label={stat}
                    value={value}
                    highlight={index < 2}
                    onInfo={() => setInfoKey(stat as keyof typeof ATTRIBUTE_INFO)}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-stone-800/70 bg-stone-950/70 p-3 xl:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">Actions</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <ActionButton
                  icon={Utensils}
                  label="Feed"
                  cost={`${inventory.monster_chow || 0} chow`}
                  onClick={handleFeed}
                  disabled={(inventory.monster_chow || 0) < 1 || pet.hunger >= 100}
                  color="hover:bg-emerald-900/30 hover:text-emerald-400 hover:border-emerald-800"
                />
                <ActionButton
                  icon={Activity}
                  label="Exercise"
                  cost="-20 Energy"
                  onClick={handleExercise}
                  disabled={pet.energy < 20 || pet.hunger < 10}
                  color="hover:bg-blue-900/30 hover:text-blue-400 hover:border-blue-800"
                />
                <ActionButton
                  icon={Zap}
                  label="Rest"
                  cost="+40 Energy"
                  onClick={handleRest}
                  disabled={pet.energy >= 100 || isDowned}
                  color="hover:bg-amber-900/30 hover:text-amber-400 hover:border-amber-800"
                />
                <ActionButton
                  icon={Heart}
                  label="Heal"
                  cost="20 Gold"
                  onClick={handleHeal}
                  disabled={gold < 20 || pet.hp >= pet.maxHp}
                  color="hover:bg-red-900/30 hover:text-red-400 hover:border-red-800"
                />
                <ActionButton
                  icon={Activity}
                  label="Battle"
                  cost="Open Scene"
                  onClick={() => onBattleOpen(pet.id)}
                  disabled={pet.hp <= 0}
                  color="hover:bg-violet-900/30 hover:text-violet-300 hover:border-violet-800"
                />
              </div>
              {activityMessage ? (
                <div className="mt-3 rounded-2xl border border-indigo-900/40 bg-indigo-950/20 p-4 text-sm text-indigo-100">
                  {activityMessage}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={portraitOpen} onOpenChange={setPortraitOpen}>
        <DialogContent className="max-w-6xl border-none bg-transparent p-0 shadow-none">
          <div className="overflow-hidden rounded-[2rem] border border-stone-800 bg-[radial-gradient(circle_at_top,#292524_0%,#0c0a09_72%)] p-6 md:p-10">
            <MonsterPortrait
              speciesId={pet.speciesId}
              alt={pet.name}
              className="h-[75vh] w-full border-none bg-transparent"
              imageClassName="object-contain p-4"
              fallbackClassName="text-9xl"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(infoKey)} onOpenChange={(open) => setInfoKey(open ? infoKey : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{infoKey ? ATTRIBUTE_INFO[infoKey].title : ''}</DialogTitle>
            <DialogDescription className="leading-6">
              {infoKey ? ATTRIBUTE_INFO[infoKey].description : ''}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionButton({ icon: Icon, label, cost, onClick, disabled, color }: any) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="secondary"
      className={`h-auto min-h-20 w-full flex-col items-start justify-between gap-1.5 p-2.5 text-left ${disabled ? 'cursor-not-allowed opacity-50' : color}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} />
        <span className="text-sm font-medium leading-tight">{label}</span>
      </div>
      <span className="text-[11px] font-mono leading-tight text-stone-500">{cost}</span>
    </Button>
  );
}

function StatusMeter({ icon: Icon, label, value, max, tone, detail, infoKey, onInfo }: any) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const indicatorClassName =
    tone === 'red'
      ? 'bg-red-500'
      : tone === 'emerald'
        ? 'bg-emerald-500'
        : tone === 'amber'
          ? 'bg-amber-500'
          : 'bg-pink-500';
  const surfaceClassName =
    tone === 'red'
      ? 'border-red-900/25 from-red-950/40 to-stone-950/60'
      : tone === 'emerald'
        ? 'border-emerald-900/25 from-emerald-950/35 to-stone-950/60'
        : tone === 'amber'
          ? 'border-amber-900/25 from-amber-950/35 to-stone-950/60'
          : 'border-pink-900/25 from-pink-950/35 to-stone-950/60';

  return (
    <div className={cn('rounded-[1.5rem] border bg-gradient-to-r p-3 xl:p-4', surfaceClassName)}>
      <div className="mb-2 flex items-start justify-between gap-3 xl:mb-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="rounded-full border border-stone-800 bg-stone-950 p-2 text-stone-300">
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-stone-100">{label}</p>
              <button
                type="button"
                onClick={() => onInfo?.(infoKey)}
                className="rounded-full border border-stone-700/80 bg-stone-950/70 p-1 text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-100"
                aria-label={`What does ${label} do?`}
              >
                <CircleHelp size={12} />
              </button>
            </div>
            <p className="text-xs text-stone-500">{detail}</p>
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-stone-800/80 bg-stone-950/90 px-2.5 py-1 text-right">
          <span className="font-mono text-sm text-stone-200">
            {Math.ceil(value)}
            <span className="text-stone-500">/{max}</span>
          </span>
        </div>
      </div>
      <Progress value={percentage} indicatorClassName={indicatorClassName} className="h-2 bg-stone-950/80 xl:h-2.5" />
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight = false,
  onInfo,
}: React.Attributes & { label: string; value: number | string; highlight?: boolean; onInfo: () => void }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5',
        highlight ? 'border-amber-900/30 bg-amber-950/20' : 'border-stone-800/60 bg-stone-900',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</div>
        <div className="font-mono text-lg leading-none text-stone-100">{value}</div>
        <button
          type="button"
          onClick={onInfo}
          className="rounded-full border border-stone-700/80 bg-stone-950/70 p-1 text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-100"
          aria-label={`What does ${label.toUpperCase()} do?`}
        >
          <CircleHelp size={12} />
        </button>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-sm leading-5 text-stone-200">{value}</p>
    </div>
  );
}
