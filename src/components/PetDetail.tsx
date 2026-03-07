import React from 'react';
import { Pet } from '../types';
import { SPECIES, ITEMS } from '../data';
import { ArrowLeft, Heart, Utensils, Zap, Activity, Package } from 'lucide-react';

type Props = {
  pet: Pet;
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  gold: number;
  setGold: (g: number) => void;
  onBack: () => void;
};

export default function PetDetail({ pet, setPets, inventory, setInventory, gold, setGold, onBack }: Props) {
  const species = SPECIES[pet.speciesId];

  const updatePet = (updates: Partial<Pet>) => {
    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, ...updates } : p));
  };

  const consumeItem = (itemId: string) => {
    setInventory(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const handleFeed = () => {
    if ((inventory['monster_chow'] || 0) >= 1 && pet.hunger < 100) {
      consumeItem('monster_chow');
      updatePet({
        hunger: Math.min(100, pet.hunger + 30),
        happiness: Math.min(100, pet.happiness + 10),
        hp: Math.min(pet.maxHp, pet.hp + 5)
      });
    }
  };

  const handleExercise = () => {
    if (pet.energy >= 20 && pet.hunger >= 10) {
      updatePet({
        energy: pet.energy - 20,
        hunger: pet.hunger - 10,
        happiness: Math.min(100, pet.happiness + 20),
        xp: pet.xp + 10
      });
    }
  };

  const handleRest = () => {
    updatePet({
      energy: Math.min(100, pet.energy + 40),
      hunger: Math.max(0, pet.hunger - 10),
      hp: Math.min(pet.maxHp, pet.hp + 10)
    });
  };

  const handleHeal = () => {
    if (gold >= 20 && pet.hp < pet.maxHp) {
      setGold(gold - 20);
      updatePet({
        hp: pet.maxHp
      });
    }
  };

  const useInventoryItem = (itemId: string) => {
    const item = ITEMS[itemId];
    if (!item || (inventory[itemId] || 0) <= 0) return;

    if (item.type === 'heal' && pet.hp < pet.maxHp) {
      consumeItem(itemId);
      updatePet({ hp: Math.min(pet.maxHp, pet.hp + item.value) });
    } else if (item.type === 'social' && pet.happiness < 100) {
      consumeItem(itemId);
      updatePet({ happiness: Math.min(100, pet.happiness + item.value) });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-8 transition-colors">
        <ArrowLeft size={20} />
        <span>Back to Parlour</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="text-8xl mb-6">{species.image}</div>
            <h2 className="text-3xl font-serif font-bold text-stone-100 mb-2">{pet.name}</h2>
            <p className="text-stone-400 mb-4">{species.name}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-xs font-mono text-stone-400">
              {species.alignment}
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Actions</h3>
            <div className="space-y-3">
              <ActionButton 
                icon={Utensils} 
                label="Feed" 
                cost={`${inventory['monster_chow'] || 0} left`} 
                onClick={handleFeed} 
                disabled={(inventory['monster_chow'] || 0) < 1 || pet.hunger >= 100} 
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
                cost="Free" 
                onClick={handleRest} 
                disabled={pet.energy >= 100} 
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
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8">
            <h3 className="text-xl font-serif font-bold text-stone-100 mb-6">Status</h3>
            <div className="space-y-6">
              <DetailBar label="Health" value={pet.hp} max={pet.maxHp} color="bg-red-500" />
              <DetailBar label="Hunger" value={pet.hunger} max={100} color="bg-emerald-500" />
              <DetailBar label="Energy" value={pet.energy} max={100} color="bg-amber-500" />
              <DetailBar label="Happiness" value={pet.happiness} max={100} color="bg-pink-500" />
            </div>
            <div className="mt-8 pt-8 border-t border-stone-800">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">Level {pet.level}</span>
                <span className="text-xs font-mono text-stone-500">{pet.xp} / {pet.level * 100} XP</span>
              </div>
              <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (pet.xp / (pet.level * 100)) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-stone-100">Inventory Items</h3>
              <Package className="text-stone-500" size={20} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(inventory).map(([itemId, count]) => {
                if (count <= 0) return null;
                const item = ITEMS[itemId];
                if (!item || (item.type !== 'heal' && item.type !== 'social')) return null;

                const disabled = (item.type === 'heal' && pet.hp >= pet.maxHp) || 
                                 (item.type === 'social' && pet.happiness >= 100);

                return (
                  <button
                    key={itemId}
                    onClick={() => useInventoryItem(itemId)}
                    disabled={disabled}
                    className={`flex items-center justify-between p-3 rounded-xl border border-stone-800 bg-stone-950 transition-all ${
                      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500/50 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="font-bold text-stone-200 text-sm">{item.name}</div>
                        <div className="text-xs text-stone-500">{item.description}</div>
                      </div>
                    </div>
                    <span className="font-mono text-stone-500 text-sm">x{count}</span>
                  </button>
                );
              })}
              {Object.entries(inventory).filter(([id, count]) => count > 0 && ITEMS[id] && (ITEMS[id].type === 'heal' || ITEMS[id].type === 'social')).length === 0 && (
                <div className="col-span-2 text-center text-stone-500 text-sm py-4">
                  No usable items in inventory. Visit the shop!
                </div>
              )}
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8">
            <h3 className="text-xl font-serif font-bold text-stone-100 mb-6">Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(pet.stats).map(([stat, value]) => (
                <div key={stat} className="bg-stone-950 rounded-xl p-4 border border-stone-800/50 text-center">
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">{stat}</div>
                  <div className="text-2xl font-mono text-stone-200">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-sm text-stone-400 bg-stone-950 p-4 rounded-xl border border-stone-800/50">
              <span className="font-bold text-stone-300">Diet:</span> {species.diet}
              <br/>
              <span className="font-bold text-stone-300">Description:</span> {species.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, cost, onClick, disabled, color }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-4 rounded-xl border border-stone-800 bg-stone-950 transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : color
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-xs font-mono text-stone-500">{cost}</span>
    </button>
  );
}

function DetailBar({ label, value, max, color }: any) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-stone-400">{label}</span>
        <span className="font-mono text-stone-500">{Math.ceil(value)} / {max}</span>
      </div>
      <div className="h-2 bg-stone-950 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
