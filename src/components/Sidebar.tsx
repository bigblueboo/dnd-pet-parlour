import React from 'react';
import { Home, Swords, Store } from 'lucide-react';

type Props = {
  currentView: string;
  setView: (view: 'dashboard' | 'arena' | 'shop') => void;
};

export default function Sidebar({ currentView, setView }: Props) {
  const navItems = [
    { id: 'dashboard', label: 'Parlour', icon: Home },
    { id: 'arena', label: 'Battle Arena', icon: Swords },
    { id: 'shop', label: 'Marketplace', icon: Store },
  ] as const;

  return (
    <aside className="w-64 bg-stone-900 border-r border-stone-800 flex flex-col">
      <div className="p-6">
        <div className="w-12 h-12 bg-amber-900/30 rounded-xl flex items-center justify-center border border-amber-700/50 mb-6">
          <span className="text-2xl">🐉</span>
        </div>
        <nav className="space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'pet' && item.id === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-amber-900/20 text-amber-500 border border-amber-900/50' 
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-transparent'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
