import React, { useState, useRef, useEffect } from 'react';
import { Pet, Hero } from '../types';
import { HEROES, SPECIES, ITEMS } from '../data';
import { rollDice, getModifier, calculateMaxHp } from '../utils';
import { Swords, Shield, Zap, Package, Footprints } from 'lucide-react';

type Props = {
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

type BattlePhase = 'select' | 'player' | 'enemy' | 'end';

export default function Arena({ pets, setPets, setGold, inventory, setInventory }: Props) {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [selectedHeroId, setSelectedHeroId] = useState<string>(HEROES[0].id);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [currentPetHp, setCurrentPetHp] = useState(0);
  const [currentHeroHp, setCurrentHeroHp] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [hasteTurns, setHasteTurns] = useState(0);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  const pet = pets.find(p => p.id === selectedPetId);
  const heroDef = HEROES.find(h => h.id === selectedHeroId);
  const species = pet ? SPECIES[pet.speciesId] : null;

  const startBattle = () => {
    if (!pet || !heroDef || !species) return;
    if (pet.hp <= 0) {
      setBattleLog([`[System] ${pet.name} is too weak to fight!`]);
      return;
    }
    if (pet.energy < 20) {
      setBattleLog([`[System] ${pet.name} is too tired to fight!`]);
      return;
    }

    setPhase('player');
    setCurrentPetHp(pet.hp);
    setCurrentHeroHp(heroDef.hp);
    setCooldown(0);
    setHasteTurns(0);
    setBattleLog([`--- BATTLE START: ${pet.name} vs ${heroDef.name} ---`]);
  };

  const finishBattle = (won: boolean, ranAway: boolean = false) => {
    setPhase('end');
    if (!pet || !heroDef) return;

    if (ranAway) {
      setBattleLog(prev => [...prev, `--- RAN AWAY ---`, `${pet.name} fled from the battle! Lost 10 Happiness.`]);
      setPets(prev => prev.map(p => p.id === pet.id ? { 
        ...p, 
        hp: Math.max(0, currentPetHp), 
        energy: Math.max(0, p.energy - 10),
        happiness: Math.max(0, p.happiness - 10)
      } : p));
      setTimeout(() => setPhase('select'), 2000);
      return;
    }

    if (won) {
      const xpGain = heroDef.level * 25;
      setBattleLog(prev => [
        ...prev, 
        `--- VICTORY! ---`,
        `${pet.name} defeated ${heroDef.name}!`,
        `Gained ${heroDef.reward} gold and ${xpGain} XP!`
      ]);
      setGold(g => g + heroDef.reward);
      
      setPets(prev => prev.map(p => {
        if (p.id === pet.id) {
          let newXp = p.xp + xpGain;
          let newLevel = p.level;
          let newMaxHp = p.maxHp;
          let newStats = { ...p.stats };
          let leveledUp = false;

          while (newXp >= newLevel * 100) {
            newXp -= newLevel * 100;
            newLevel++;
            newStats.str += 1;
            newStats.con += 1;
            newMaxHp = calculateMaxHp(newStats.con, newLevel);
            leveledUp = true;
          }

          if (leveledUp) {
            setTimeout(() => {
              setBattleLog(l => [...l, `🌟 ${pet.name} leveled up to level ${newLevel}! 🌟`]);
            }, 500);
          }

          return {
            ...p,
            hp: Math.max(0, currentPetHp),
            energy: Math.max(0, p.energy - 20),
            xp: newXp,
            level: newLevel,
            maxHp: newMaxHp,
            stats: newStats
          };
        }
        return p;
      }));
    } else {
      setBattleLog(prev => [
        ...prev, 
        `--- DEFEAT ---`,
        `${pet.name} was defeated by ${heroDef.name}...`
      ]);
      setPets(prev => prev.map(p => p.id === pet.id ? { 
        ...p, 
        hp: 0, 
        energy: Math.max(0, p.energy - 20), 
        happiness: Math.max(0, p.happiness - 20) 
      } : p));
    }

    setTimeout(() => setPhase('select'), 3000);
  };

  const handlePlayerAction = (actionType: 'attack' | 'special' | 'item' | 'run', itemId?: string) => {
    if (phase !== 'player' || !pet || !heroDef || !species) return;

    let nextHeroHp = currentHeroHp;
    let nextPetHp = currentPetHp;
    let usedAction = true;
    let isHasted = hasteTurns > 0;

    if (actionType === 'attack') {
      const attacks = isHasted ? 2 : 1;
      for (let i = 0; i < attacks; i++) {
        if (nextHeroHp <= 0) break;
        const hit = rollDice(20) + getModifier(pet.stats.str);
        const ac = 10 + getModifier(heroDef.stats.dex);
        if (hit >= ac) {
          const dmg = Math.max(1, rollDice(8) + getModifier(pet.stats.str));
          nextHeroHp -= dmg;
          setBattleLog(prev => [...prev, `> ${pet.name} strikes ${heroDef.name} for ${dmg} damage!${isHasted ? ' (Hasted)' : ''}`]);
        } else {
          setBattleLog(prev => [...prev, `> ${pet.name} misses ${heroDef.name}.${isHasted ? ' (Hasted)' : ''}`]);
        }
      }
    } else if (actionType === 'special') {
      if (cooldown > 0) return;
      const attacks = isHasted ? 2 : 1;
      for (let i = 0; i < attacks; i++) {
        if (nextHeroHp <= 0) break;
        const hit = rollDice(20) + getModifier(pet.stats.str) + 2; // Special gets +2 to hit
        const ac = 10 + getModifier(heroDef.stats.dex);
        if (hit >= ac) {
          const baseDmg = Math.max(1, rollDice(8) + getModifier(pet.stats.str));
          const dmg = Math.floor(baseDmg * species.specialAbility.damageMultiplier);
          nextHeroHp -= dmg;
          setBattleLog(prev => [...prev, `> ${pet.name} uses ${species.specialAbility.name}! Hits for ${dmg} damage!${isHasted ? ' (Hasted)' : ''}`]);
        } else {
          setBattleLog(prev => [...prev, `> ${pet.name}'s ${species.specialAbility.name} misses!${isHasted ? ' (Hasted)' : ''}`]);
        }
      }
      setCooldown(species.specialAbility.cooldown);
    } else if (actionType === 'item' && itemId) {
      const item = ITEMS[itemId];
      if (!item || (inventory[itemId] || 0) <= 0) return;
      
      setInventory(prev => ({ ...prev, [itemId]: prev[itemId] - 1 }));
      
      if (item.type === 'heal') {
        nextPetHp = Math.min(pet.maxHp, currentPetHp + item.value);
        setBattleLog(prev => [...prev, `> ${pet.name} uses ${item.name}, recovering ${item.value} HP!`]);
      } else if (item.type === 'buff' && itemId === 'haste_potion') {
        setHasteTurns(item.value);
        setBattleLog(prev => [...prev, `> ${pet.name} drinks ${item.name}! They feel incredibly fast!`]);
      }
    } else if (actionType === 'run') {
      finishBattle(false, true);
      return;
    }

    setCurrentHeroHp(nextHeroHp);
    setCurrentPetHp(nextPetHp);

    if (nextHeroHp <= 0) {
      finishBattle(true);
    } else {
      if (cooldown > 0 && actionType !== 'special') setCooldown(c => c - 1);
      if (hasteTurns > 0) setHasteTurns(h => h - 1);
      setPhase('enemy');
    }
  };

  // Enemy Turn Effect
  useEffect(() => {
    if (phase === 'enemy' && pet && heroDef) {
      const timer = setTimeout(() => {
        let nextPetHp = currentPetHp;
        const hit = rollDice(20) + getModifier(heroDef.stats.str);
        const ac = 10 + getModifier(pet.stats.dex);
        
        if (hit >= ac) {
          const dmg = Math.max(1, rollDice(8) + getModifier(heroDef.stats.str));
          nextPetHp -= dmg;
          setBattleLog(prev => [...prev, `> ${heroDef.name} hits ${pet.name} for ${dmg} damage!`]);
        } else {
          setBattleLog(prev => [...prev, `> ${heroDef.name} misses ${pet.name}.`]);
        }

        setCurrentPetHp(nextPetHp);
        
        if (nextPetHp <= 0) {
          finishBattle(false);
        } else {
          setPhase('player');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (pets.length === 0) {
    return <div className="text-center text-stone-500 mt-20">You need a pet to battle!</div>;
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      {/* Selection Phase */}
      {phase === 'select' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
            <h3 className="text-xl font-serif font-bold text-stone-100 mb-4">Select Champion</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {pets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPetId(p.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedPetId === p.id 
                      ? 'bg-amber-900/20 border-amber-700/50 text-amber-100' 
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  } ${p.hp <= 0 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{SPECIES[p.speciesId].image}</span>
                    <div className="text-left">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs font-mono opacity-70">Lvl {p.level} • HP: {Math.ceil(p.hp)}/{p.maxHp}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
            <h3 className="text-xl font-serif font-bold text-stone-100 mb-4">Select Opponent</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {HEROES.map(hero => (
                <button
                  key={hero.id}
                  onClick={() => setSelectedHeroId(hero.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedHeroId === hero.id 
                      ? 'bg-red-900/20 border-red-700/50 text-red-100' 
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold">{hero.name}</div>
                    <div className="text-xs font-mono opacity-70">Lvl {hero.level} • HP: {hero.maxHp}</div>
                  </div>
                  <div className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                    Reward: {hero.reward}g
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Battle UI */}
      {phase !== 'select' && pet && heroDef && species && (
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Pet Status */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col items-center">
            <div className="text-6xl mb-4">{species.image}</div>
            <h3 className="text-2xl font-serif font-bold text-stone-100 mb-2">{pet.name}</h3>
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-400">HP</span>
                <span className="font-mono text-stone-300">{Math.ceil(currentPetHp)} / {pet.maxHp}</span>
              </div>
              <div className="h-4 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.max(0, (currentPetHp / pet.maxHp) * 100)}%` }} />
              </div>
            </div>
            {hasteTurns > 0 && (
              <div className="mt-4 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                ⚡ Hasted ({hasteTurns} turns)
              </div>
            )}
          </div>

          {/* Hero Status */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col items-center">
            <div className="text-6xl mb-4">🛡️</div>
            <h3 className="text-2xl font-serif font-bold text-stone-100 mb-2">{heroDef.name}</h3>
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-400">HP</span>
                <span className="font-mono text-stone-300">{Math.ceil(currentHeroHp)} / {heroDef.maxHp}</span>
              </div>
              <div className="h-4 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.max(0, (currentHeroHp / heroDef.maxHp) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Action & Log */}
      <div className="flex-1 bg-stone-950 border border-stone-800 rounded-3xl flex flex-col overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-stone-800 bg-stone-900 flex justify-between items-center">
          <h3 className="font-serif font-bold text-stone-100 flex items-center gap-2">
            <Swords size={20} className="text-amber-500" />
            Battle Log
          </h3>
          {phase === 'select' && (
            <button
              onClick={startBattle}
              disabled={!selectedPetId || !selectedHeroId}
              className="bg-amber-700 hover:bg-amber-600 text-amber-50 px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Battle
            </button>
          )}
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-2">
          {battleLog.length === 0 ? (
            <div className="text-stone-600 text-center mt-10">Select a champion and an opponent to begin.</div>
          ) : (
            battleLog.map((log, i) => (
              <div key={i} className={`${
                log.includes('VICTORY') ? 'text-emerald-400 font-bold text-base my-4' :
                log.includes('DEFEAT') ? 'text-red-400 font-bold text-base my-4' :
                log.includes('START') ? 'text-amber-400 font-bold text-base my-4' :
                log.includes('damage') ? 'text-stone-300' :
                log.includes('misses') ? 'text-stone-500' :
                log.includes('leveled up') ? 'text-indigo-400 font-bold' :
                'text-stone-400'
              }`}>
                {log}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        {/* Player Actions */}
        {phase === 'player' && species && (
          <div className="p-4 border-t border-stone-800 bg-stone-900">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handlePlayerAction('attack')}
                className="flex flex-col items-center justify-center p-3 bg-stone-950 border border-stone-800 rounded-xl hover:border-red-500/50 hover:bg-stone-800 transition-all text-stone-300"
              >
                <Swords size={20} className="mb-2 text-red-400" />
                <span className="font-bold text-sm">Attack</span>
              </button>
              
              <button
                onClick={() => handlePlayerAction('special')}
                disabled={cooldown > 0}
                className="flex flex-col items-center justify-center p-3 bg-stone-950 border border-stone-800 rounded-xl hover:border-indigo-500/50 hover:bg-stone-800 transition-all text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={20} className="mb-2 text-indigo-400" />
                <span className="font-bold text-sm">{species.specialAbility.name}</span>
                {cooldown > 0 && <span className="text-xs font-mono text-stone-500 mt-1">CD: {cooldown}</span>}
              </button>

              <div className="relative group">
                <button
                  className="w-full h-full flex flex-col items-center justify-center p-3 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 transition-all text-stone-300"
                >
                  <Package size={20} className="mb-2 text-emerald-400" />
                  <span className="font-bold text-sm">Items</span>
                </button>
                <div className="absolute bottom-full left-0 w-full mb-2 hidden group-hover:block bg-stone-900 border border-stone-800 rounded-xl p-2 shadow-xl z-10">
                  {Object.entries(inventory).map(([itemId, count]) => {
                    if (count <= 0) return null;
                    const item = ITEMS[itemId];
                    if (!item || (item.type !== 'heal' && item.type !== 'buff')) return null;
                    return (
                      <button
                        key={itemId}
                        onClick={() => handlePlayerAction('item', itemId)}
                        className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-lg flex justify-between items-center"
                      >
                        <span>{item.name}</span>
                        <span className="font-mono text-stone-500 text-xs">x{count}</span>
                      </button>
                    );
                  })}
                  {Object.entries(inventory).filter(([id, count]) => count > 0 && ITEMS[id] && (ITEMS[id].type === 'heal' || ITEMS[id].type === 'buff')).length === 0 && (
                    <div className="px-3 py-2 text-xs text-stone-500 text-center">No battle items</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handlePlayerAction('run')}
                className="flex flex-col items-center justify-center p-3 bg-stone-950 border border-stone-800 rounded-xl hover:border-stone-500/50 hover:bg-stone-800 transition-all text-stone-300"
              >
                <Footprints size={20} className="mb-2 text-stone-400" />
                <span className="font-bold text-sm">Run Away</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
