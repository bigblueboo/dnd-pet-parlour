import React, { startTransition, useEffect, useRef, useState } from 'react';
import type { Pet } from './types';
import type { GameView } from './gameState';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PetDetail from './components/PetDetail';
import Shop from './components/Shop';
import BattleModal from './components/BattleModal';
import SettingsDialog from './components/SettingsDialog';
import { clearPersistedGameState, createDefaultGameState, loadGameState, persistGameState } from './gameState';
import { Coins, Package } from 'lucide-react';

export default function App() {
  const initialStateRef = useRef(loadGameState());
  const [view, setView] = useState<GameView>(initialStateRef.current.view);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(initialStateRef.current.selectedPetId);
  const [gold, setGold] = useState(initialStateRef.current.gold);
  const [inventory, setInventory] = useState<Record<string, number>>(initialStateRef.current.inventory);
  const [pets, setPets] = useState<Pet[]>(initialStateRef.current.pets);
  const [highestDefeatedHeroIndex, setHighestDefeatedHeroIndex] = useState(initialStateRef.current.highestDefeatedHeroIndex);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [battlePetId, setBattlePetId] = useState<string | null>(initialStateRef.current.selectedPetId);

  useEffect(() => {
    persistGameState({
      view,
      selectedPetId,
      gold,
      inventory,
      pets,
      highestDefeatedHeroIndex,
    });
  }, [view, selectedPetId, gold, inventory, pets, highestDefeatedHeroIndex]);

  useEffect(() => {
    if (selectedPetId && pets.some((pet) => pet.id === selectedPetId)) {
      return;
    }

    const fallbackPetId = pets[0]?.id ?? null;
    setSelectedPetId(fallbackPetId);
    if (view === 'pet' && !fallbackPetId) {
      setView('dashboard');
    }
  }, [pets, selectedPetId, view]);

  const navigateToPet = (id: string) => {
    setSelectedPetId(id);
    startTransition(() => setView('pet'));
  };

  const openBattle = (petId?: string | null) => {
    setBattlePetId(petId ?? selectedPetId ?? pets[0]?.id ?? null);
    setBattleOpen(true);
  };

  const clearProgress = () => {
    if (!window.confirm('Clear local progress for D&D Pet Parlour on this device?')) {
      return;
    }

    const defaults = createDefaultGameState();
    clearPersistedGameState();
    setView(defaults.view);
    setSelectedPetId(defaults.selectedPetId);
    setGold(defaults.gold);
    setInventory(defaults.inventory);
    setPets(defaults.pets);
    setHighestDefeatedHeroIndex(defaults.highestDefeatedHeroIndex);
    setBattlePetId(defaults.selectedPetId);
    setBattleOpen(false);
    setSettingsOpen(false);
  };

  const totalItems = (Object.values(inventory) as number[]).reduce((total, count) => total + count, 0);

  return (
    <div className="flex h-screen bg-stone-950 text-stone-300 font-sans selection:bg-amber-900/50">
      <Sidebar
        currentView={view}
        setView={setView}
        onOpenBattle={() => openBattle()}
        onOpenSettings={() => setSettingsOpen(true)}
        onSelectPet={navigateToPet}
        selectedPetId={selectedPetId}
        pets={pets}
        hasPets={pets.length > 0}
        battleOpen={battleOpen}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-stone-800 bg-stone-900/50 px-4 md:px-8">
          <h1 className="text-lg font-serif font-bold tracking-wide text-amber-500 md:text-xl">D&D Pet Parlour</h1>
          <div className="flex items-center gap-3 md:gap-6">
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

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
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
              onBattleOpen={openBattle}
            />
          )}
          {view === 'shop' && <Shop gold={gold} setGold={setGold} inventory={inventory} setInventory={setInventory} setPets={setPets} />}
        </div>
      </main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearProgress={clearProgress}
        petCount={pets.length}
        gold={gold}
        totalItems={totalItems}
      />

      <BattleModal
        open={battleOpen}
        onClose={() => setBattleOpen(false)}
        initialPetId={battlePetId}
        pets={pets}
        setPets={setPets}
        setGold={setGold}
        highestDefeatedHeroIndex={highestDefeatedHeroIndex}
        setHighestDefeatedHeroIndex={setHighestDefeatedHeroIndex}
        inventory={inventory}
        setInventory={setInventory}
      />
    </div>
  );
}
