import React, { useState, useEffect } from 'react';
import { Pet } from './types';
import { SPECIES } from './data';
import { calculateMaxHp, generateId } from './utils';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PetDetail from './components/PetDetail';
import Arena from './components/Arena';
import Shop from './components/Shop';
import { Coins, Package } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'pet' | 'arena' | 'shop'>('dashboard');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [gold, setGold] = useState(300);
  const [inventory, setInventory] = useState<Record<string, number>>({
    monster_chow: 20,
    minor_potion: 3,
    pet_brush: 1
  });
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    const initialPet: Pet = {
      id: generateId(),
      speciesId: 'gelatinous_cube',
      name: 'Wobbles',
      hp: calculateMaxHp(SPECIES['gelatinous_cube'].baseStats.con, 1),
      maxHp: calculateMaxHp(SPECIES['gelatinous_cube'].baseStats.con, 1),
      hunger: 80,
      energy: 100,
      happiness: 50,
      stats: { ...SPECIES['gelatinous_cube'].baseStats },
      level: 1,
      xp: 0,
    };
    setPets([initialPet]);
  }, []);

  const navigateToPet = (id: string) => {
    setSelectedPetId(id);
    setView('pet');
  };

  const totalItems = Object.values(inventory).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="flex h-screen bg-stone-950 text-stone-300 font-sans selection:bg-amber-900/50">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between px-8">
          <h1 className="text-xl font-serif font-bold text-amber-500 tracking-wide">D&D Pet Parlour</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg">
              <Coins size={18} />
              <span className="font-mono font-medium">{gold}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg">
              <Package size={18} />
              <span className="font-mono font-medium">{totalItems}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {view === 'dashboard' && <Dashboard pets={pets} onSelectPet={navigateToPet} />}
          {view === 'pet' && selectedPetId && (
            <PetDetail 
              pet={pets.find(p => p.id === selectedPetId)!} 
              setPets={setPets}
              inventory={inventory}
              setInventory={setInventory}
              gold={gold}
              setGold={setGold}
              onBack={() => setView('dashboard')}
            />
          )}
          {view === 'arena' && <Arena pets={pets} setPets={setPets} setGold={setGold} inventory={inventory} setInventory={setInventory} />}
          {view === 'shop' && <Shop gold={gold} setGold={setGold} inventory={inventory} setInventory={setInventory} pets={pets} setPets={setPets} />}
        </div>
      </main>
    </div>
  );
}
