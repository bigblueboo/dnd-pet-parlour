import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { HistoryEvent, Pet } from './types';
import type { GameView } from './gameState';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PetDetail from './components/PetDetail';
import Shop from './components/Shop';
import BattleModal from './components/BattleModal';
import SettingsDialog from './components/SettingsDialog';
import HistoryPage from './components/HistoryPage';
import { clearPersistedGameState, createDefaultGameState, loadGameState, persistGameState } from './gameState';
import { SPECIES } from './data';
import { ChevronRight, Coins, Package } from 'lucide-react';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { generateId } from './utils';

const MAX_HISTORY_EVENTS = 200;

export default function App() {
  const initialStateRef = useRef(loadGameState());
  const [view, setView] = useState<GameView>(initialStateRef.current.view);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(initialStateRef.current.selectedPetId);
  const [gold, setGold] = useState(initialStateRef.current.gold);
  const [inventory, setInventory] = useState<Record<string, number>>(initialStateRef.current.inventory);
  const [pets, setPets] = useState<Pet[]>(initialStateRef.current.pets);
  const [highestDefeatedHeroIndex, setHighestDefeatedHeroIndex] = useState(initialStateRef.current.highestDefeatedHeroIndex);
  const [history, setHistory] = useState<HistoryEvent[]>(initialStateRef.current.history);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [battlePetId, setBattlePetId] = useState<string | null>(initialStateRef.current.selectedPetId);
  const previousPetsRef = useRef<Pet[]>(initialStateRef.current.pets);
  const historyReadyRef = useRef(false);

  const appendHistory = useCallback((event: Omit<HistoryEvent, 'id' | 'createdAt'>) => {
    setHistory((prev) => [
      {
        ...event,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, MAX_HISTORY_EVENTS));
  }, []);

  useEffect(() => {
    persistGameState({
      view,
      selectedPetId,
      gold,
      inventory,
      pets,
      highestDefeatedHeroIndex,
      history,
    });
  }, [view, selectedPetId, gold, inventory, pets, highestDefeatedHeroIndex, history]);

  useEffect(() => {
    if (!historyReadyRef.current) {
      historyReadyRef.current = true;
      previousPetsRef.current = pets;
      return;
    }

    const previousPetsById = new Map<string, Pet>(previousPetsRef.current.map((pet) => [pet.id, pet]));
    const events: Array<Omit<HistoryEvent, 'id' | 'createdAt'>> = [];

    for (const pet of pets) {
      const previousPet = previousPetsById.get(pet.id);

      if (!previousPet) {
        const species = SPECIES[pet.speciesId];
        events.push({
          type: 'monster-acquired',
          title: `${pet.name} joined the parlour`,
          description: `Adopted ${pet.name}, a level ${pet.level} ${species?.name ?? 'monster'}.`,
          petId: pet.id,
          petName: pet.name,
          speciesId: pet.speciesId,
          level: pet.level,
        });
        continue;
      }

      if (pet.level > previousPet.level) {
        events.push({
          type: 'level-up',
          title: `${pet.name} reached level ${pet.level}`,
          description: `${pet.name} advanced from level ${previousPet.level} to level ${pet.level}.`,
          petId: pet.id,
          petName: pet.name,
          speciesId: pet.speciesId,
          level: pet.level,
        });
      }
    }

    if (events.length > 0) {
      setHistory((prev) =>
        events
          .map((event) => ({
            ...event,
            id: generateId(),
            createdAt: new Date().toISOString(),
          }))
          .reverse()
          .concat(prev)
          .slice(0, MAX_HISTORY_EVENTS),
      );
    }

    previousPetsRef.current = pets;
  }, [pets]);

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
    setHistory(defaults.history);
    previousPetsRef.current = defaults.pets;
    setPets(defaults.pets);
    setHighestDefeatedHeroIndex(defaults.highestDefeatedHeroIndex);
    setBattlePetId(defaults.selectedPetId);
    setBattleOpen(false);
    setSettingsOpen(false);
  };

  const totalItems = (Object.values(inventory) as number[]).reduce((total, count) => total + count, 0);
  const selectedPet = selectedPetId ? pets.find((pet) => pet.id === selectedPetId) ?? null : null;
  const pageTitle =
    view === 'dashboard'
      ? 'Parlour'
      : view === 'shop'
        ? 'Marketplace'
        : view === 'history'
          ? 'History'
          : selectedPet?.name ?? 'Monster Sheet';
  const breadcrumb = view === 'pet' && selectedPet ? ['Parlour', selectedPet.name] : [pageTitle];

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
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-stone-500">
              {breadcrumb.map((part, index) => (
                <React.Fragment key={`${part}-${index}`}>
                  {index > 0 ? <ChevronRight size={12} className="text-stone-600" /> : null}
                  <span className="truncate">{part}</span>
                </React.Fragment>
              ))}
            </div>
            <h1 className="truncate font-serif text-xl font-bold text-stone-100">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <Badge variant="accent" className="gap-2 rounded-lg px-3 py-1.5 text-amber-400">
              <Coins size={18} />
              <span className="font-mono font-medium">{gold}</span>
            </Badge>
            <Separator orientation="vertical" className="hidden h-7 bg-stone-800 md:block" />
            <Badge variant="secondary" className="gap-2 rounded-lg px-3 py-1.5 text-indigo-300">
              <Package size={18} />
              <span className="font-mono font-medium">{totalItems}</span>
            </Badge>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-4 ${view === 'pet' ? 'md:px-6 md:py-4' : 'md:p-8'}`}>
          {view === 'dashboard' && <Dashboard pets={pets} onSelectPet={navigateToPet} />}
          {view === 'pet' && selectedPetId && (
            <PetDetail 
              pet={pets.find(p => p.id === selectedPetId)!} 
              setPets={setPets}
              inventory={inventory}
              setInventory={setInventory}
              gold={gold}
              setGold={setGold}
              onBattleOpen={openBattle}
            />
          )}
          {view === 'shop' && <Shop gold={gold} setGold={setGold} inventory={inventory} setInventory={setInventory} setPets={setPets} />}
          {view === 'history' && <HistoryPage history={history} />}
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
        onRecordBattleResult={appendHistory}
      />
    </div>
  );
}
