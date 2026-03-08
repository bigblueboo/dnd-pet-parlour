import React from 'react';
import { ChevronDown, ChevronRight, History, Home, Settings, Store, Swords } from 'lucide-react';
import type { GameView } from '../gameState';
import type { Pet } from '../types';
import MonsterPortrait from './MonsterPortrait';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/src/lib/utils';

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
  const [parlourExpanded, setParlourExpanded] = React.useState(true);
  const navItems: Array<{
    id: 'dashboard' | 'battle' | 'shop' | 'history';
    label: string;
    icon: typeof Home;
    onClick: () => void;
    disabled?: boolean;
  }> = [
    { id: 'dashboard', label: 'Parlour', icon: Home, onClick: () => setView('dashboard') },
    { id: 'battle', label: 'Battle Arena', icon: Swords, onClick: onOpenBattle, disabled: !hasPets },
    { id: 'shop', label: 'Marketplace', icon: Store, onClick: () => setView('shop') },
    { id: 'history', label: 'History', icon: History, onClick: () => setView('history') },
  ];

  return (
    <aside className="flex w-20 flex-col border-r border-stone-800 bg-stone-900 md:w-64">
      <div className="flex flex-1 flex-col p-3 md:p-6">
        <div className="mb-6 hidden items-center gap-3 md:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-700/50 bg-amber-900/30">
            <span className="text-2xl">🐉</span>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold text-amber-500">D&amp;D Pet Parlour</p>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Monster Management</p>
          </div>
        </div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center self-center rounded-xl border border-amber-700/50 bg-amber-900/30 md:hidden">
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
                {item.id === 'dashboard' ? (
                  <Collapsible open={parlourExpanded} onOpenChange={setParlourExpanded}>
                    <div
                      className={cn(
                        'flex items-center rounded-xl border transition-all duration-200',
                        isActive
                          ? 'border-amber-900/50 bg-amber-900/20 text-amber-500'
                          : 'border-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200',
                      )}
                    >
                      <Button
                        onClick={item.onClick}
                        variant="ghost"
                        className="h-auto min-w-0 flex-1 justify-start gap-3 rounded-r-none px-4 py-3 text-left hover:bg-transparent"
                      >
                        <Icon size={20} />
                        <span className="hidden font-medium md:inline">{item.label}</span>
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden rounded-l-none text-stone-500 hover:bg-transparent hover:text-stone-200 md:inline-flex"
                          aria-label={parlourExpanded ? 'Collapse parlour monsters' : 'Expand parlour monsters'}
                        >
                          {parlourExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      {pets.length > 0 ? (
                        <div className="mt-2 ml-6 hidden space-y-1 border-l border-stone-800/80 pl-4 md:block">
                          {pets.map((pet) => {
                            const isPetActive = currentView === 'pet' && selectedPetId === pet.id;

                            return (
                              <Button
                                key={pet.id}
                                onClick={() => onSelectPet(pet.id)}
                                variant="ghost"
                                className={cn(
                                  'h-auto w-full justify-start gap-3 rounded-xl border px-3 py-2 text-left',
                                  isPetActive
                                    ? 'border-indigo-900/60 bg-indigo-950/30 text-indigo-100 hover:bg-indigo-950/40'
                                    : 'border-transparent text-stone-400 hover:border-stone-800 hover:bg-stone-800 hover:text-stone-200',
                                )}
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
                              </Button>
                            );
                          })}
                        </div>
                      ) : null}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    variant="ghost"
                    className={cn(
                      'h-auto w-full justify-start gap-3 rounded-xl border px-4 py-3',
                      isActive
                        ? 'border-amber-900/50 bg-amber-900/20 text-amber-500 hover:bg-amber-900/25'
                        : 'border-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200',
                    )}
                  >
                    <Icon size={20} />
                    <span className="hidden font-medium md:inline">{item.label}</span>
                  </Button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 pt-6">
          <Button
            onClick={onOpenSettings}
            variant="outline"
            className="h-auto w-full justify-start gap-3 px-4 py-3 text-stone-300"
          >
            <Settings size={20} />
            <span className="hidden font-medium md:inline">Settings</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
