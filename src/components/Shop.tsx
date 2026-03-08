import React, { useState } from 'react';
import { Pet } from '../types';
import { SPECIES, ITEMS } from '../data';
import { calculateMaxHp, generateId } from '../utils';
import { Package, Plus } from 'lucide-react';
import MonsterPortrait from './MonsterPortrait';

const EXCLUDED_ADOPTION_SPECIES_IDS = new Set(['angry_sheep', 'pet_rat']);

type Props = {
  gold: number;
  setGold: (g: number) => void;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
};

export default function Shop({ gold, setGold, inventory, setInventory, setPets }: Props) {
  const [namingSpecies, setNamingSpecies] = useState<string | null>(null);
  const [petName, setPetName] = useState('');

  const buyItem = (itemId: string) => {
    const item = ITEMS[itemId];
    if (gold >= item.cost) {
      setGold(gold - item.cost);
      setInventory(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1
      }));
    }
  };

  const handleAdopt = (speciesId: string) => {
    const species = SPECIES[speciesId];
    if (gold >= species.cost) {
      setNamingSpecies(speciesId);
      setPetName('');
    }
  };

  const confirmAdopt = () => {
    if (!namingSpecies || !petName.trim()) return;
    const species = SPECIES[namingSpecies];
    
    if (gold >= species.cost) {
      setGold(gold - species.cost);
      const newPet: Pet = {
        id: generateId(),
        speciesId: namingSpecies,
        name: petName.trim(),
        hp: calculateMaxHp(species.baseStats.con, 1),
        maxHp: calculateMaxHp(species.baseStats.con, 1),
        hunger: 50,
        energy: 100,
        happiness: 50,
        stats: { ...species.baseStats },
        level: 1,
        xp: 0,
      };
      setPets(prev => [...prev, newPet]);
      setNamingSpecies(null);
    }
  };

  // Filter logic for species
  const allSpecies = Object.values(SPECIES)
    .filter((species) => !EXCLUDED_ADOPTION_SPECIES_IDS.has(species.id))
    .sort((a, b) => a.cost - b.cost);
  const affordableSpecies = allSpecies.filter(s => gold >= s.cost);
  const unaffordableSpecies = allSpecies.filter(s => gold < s.cost).slice(0, 3);
  const displaySpecies = [...affordableSpecies, ...unaffordableSpecies];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Supplies */}
      <section>
        <h2 className="text-2xl font-serif font-bold text-stone-100 mb-6 flex items-center gap-3">
          <Package className="text-emerald-500" />
          Supplies & Items
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(ITEMS).map(item => (
            <div key={item.id} className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl bg-stone-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-800">
                  {item.icon}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs font-mono text-stone-500 uppercase tracking-wider bg-stone-950 px-2 py-1 rounded border border-stone-800">
                    {item.type}
                  </div>
                  <div className="text-xs font-mono text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/40">
                    Owned: {inventory[item.id] || 0}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-stone-200 mb-1">{item.name}</h3>
              <p className="text-stone-400 text-sm mb-6 flex-1">{item.description}</p>
              
              <button
                onClick={() => buyItem(item.id)}
                disabled={gold < item.cost}
                className="w-full flex items-center justify-center gap-2 bg-stone-950 border border-stone-800 hover:border-emerald-700/50 hover:bg-stone-800 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-bold text-stone-300">Buy</span>
                <span className="text-stone-600">|</span>
                <span className="font-mono text-amber-500">{item.cost}g</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Adoption */}
      <section>
        <h2 className="text-2xl font-serif font-bold text-stone-100 mb-6 flex items-center gap-3">
          <Plus className="text-indigo-500" />
          Adopt a Creature
        </h2>
        
        {namingSpecies && (
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-indigo-500/30 bg-indigo-900/20 p-6 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">
                Name your new {SPECIES[namingSpecies].name}
              </label>
              <input
                type="text"
                value={petName}
                onChange={e => setPetName(e.target.value)}
                placeholder="e.g. Fluffy, Destroyer of Worlds..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={confirmAdopt}
              disabled={!petName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Adoption
            </button>
            <button
              onClick={() => setNamingSpecies(null)}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySpecies.map(species => {
            const isAffordable = gold >= species.cost;
            return (
              <div key={species.id} className={`bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col ${!isAffordable ? 'opacity-70' : ''}`}>
                <MonsterPortrait
                  speciesId={species.id}
                  alt={species.name}
                  className="mb-4 h-32 w-full"
                  imageClassName="object-contain p-3"
                  fallbackClassName="text-5xl"
                />
                <h3 className="text-xl font-serif font-bold text-stone-100 mb-2">{species.name}</h3>
                <p className="text-sm text-stone-400 mb-6 flex-1">{species.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-6 text-xs font-mono text-stone-500">
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800/50">STR: {species.baseStats.str}</div>
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800/50">DEX: {species.baseStats.dex}</div>
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800/50">CON: {species.baseStats.con}</div>
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800/50">INT: {species.baseStats.int}</div>
                </div>

                <button
                  onClick={() => handleAdopt(species.id)}
                  disabled={!isAffordable || namingSpecies !== null}
                  className="w-full flex items-center justify-center gap-2 bg-stone-950 border border-stone-800 hover:border-amber-700/50 hover:bg-stone-800 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-bold text-stone-300">{isAffordable ? 'Adopt' : 'Too Expensive'}</span>
                  <span className="text-stone-600">|</span>
                  <span className={`font-mono ${isAffordable ? 'text-amber-500' : 'text-red-500'}`}>{species.cost}g</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
