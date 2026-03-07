import React from 'react';
import { Home, Settings, Store, Swords } from 'lucide-react';
import type { GameView } from '../gameState';
import type { Pet } from '../types';
import MonsterPortrait from './MonsterPortrait';

type Props = {
  currentView: GameView | 'pet';
  setView: (view: GameView) => void;
  onOpenBattle: () => void;
  onOpenSettings: () => void;
  onSelectPet: (petId: string) => void;
  selectedPetId: string | null;
  pets: Pet[];
  hasPets: boolean;
  battleOpen: boolean;
};

export default function Sidebar({
  currentView,
  setView,
  onOpenBattle,
  onOpenSettings,
  onSelectPet,
  selectedPetId,
  pets,
  hasPets,
  battleOpen,
}: Props) {
  const navItems: Array<{
    id: 'dashboard' | 'battle' | 'shop';
    label: string;
    icon: typeof Home;
    onClick: () => void;
    disabled?: boolean;
  }> = [
    { id: 'dashboard', label: 'Parlour', icon: Home, onClick: () => setView('dashboard') },
    { id: 'battle', label: 'Battle Arena', icon: Swords, onClick: onOpenBattle, disabled: !hasPets },
    { id: 'shop', label: 'Marketplace', icon: Store, onClick: () => setView('shop') },
  ];

  return (
    <aside className="flex w-20 flex-col border-r border-stone-800 bg-stone-900 md:w-64">
      <div className="flex flex-1 flex-col p-3 md:p-6">
        <div className="mb-6 flex h-12 w-12 items-center justify-center self-center rounded-xl border border-amber-700/50 bg-amber-900/30 md:self-start">
          <span className="text-2xl">🐉</span>
        </div>
        <nav className="space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              item.id === 'battle'
                ? battleOpen
                : currentView === item.id || (currentView === 'pet' && item.id === 'dashboard');
            return (
              <div key={item.id}>
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? 'border-amber-900/50 bg-amber-900/20 text-amber-500'
                      : 'border-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  } ${item.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <Icon size={20} />
                  <span className="hidden font-medium md:inline">{item.label}</span>
                </button>

                {item.id === 'dashboard' && pets.length > 0 ? (
                  <div className="mt-2 hidden space-y-1 md:block">
                    {pets.map((pet) => {
                      const isPetActive = currentView === 'pet' && selectedPetId === pet.id;

                      return (
                        <button
                          key={pet.id}
                          onClick={() => onSelectPet(pet.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                            isPetActive
                              ? 'border-indigo-900/60 bg-indigo-950/30 text-indigo-100'
                              : 'border-transparent text-stone-400 hover:border-stone-800 hover:bg-stone-800 hover:text-stone-200'
                          }`}
                        >
                          <MonsterPortrait
                            speciesId={pet.speciesId}
                            alt={pet.name}
                            className="h-9 w-9 shrink-0"
                            imageClassName="object-contain p-1.5"
                            fallbackClassName="text-base"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{pet.name}</p>
                            <p className="text-xs text-stone-500">Lvl {pet.level}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 pt-6">
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 rounded-xl border border-stone-800 px-4 py-3 text-stone-300 transition-colors hover:border-stone-700 hover:bg-stone-800"
          >
            <Settings size={20} />
            <span className="hidden font-medium md:inline">Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
