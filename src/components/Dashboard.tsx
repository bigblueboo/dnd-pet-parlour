import React from 'react';
import { Pet } from '../types';
import { SPECIES } from '../data';
import { Heart, Zap, Utensils } from 'lucide-react';

type Props = {
  pets: Pet[];
  onSelectPet: (id: string) => void;
};

export default function Dashboard({ pets, onSelectPet }: Props) {
  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500">
        <p className="text-xl mb-4">Your parlour is empty.</p>
        <p>Visit the Marketplace to adopt your first creature!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map(pet => {
        const species = SPECIES[pet.speciesId];
        const nextLevelXp = pet.level * 100;
        const xpPercentage = Math.min(100, (pet.xp / nextLevelXp) * 100);

        return (
          <button
            key={pet.id}
            onClick={() => onSelectPet(pet.id)}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-left hover:border-amber-700/50 hover:bg-stone-800/50 transition-all group flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl bg-stone-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-800 group-hover:scale-110 transition-transform">
                {species.image}
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Lvl {pet.level}</div>
                <div className="text-xs font-mono text-stone-500">{species.alignment}</div>
              </div>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-100 mb-1">{pet.name}</h3>
            <p className="text-sm text-stone-400 mb-4 flex-1">{species.name}</p>
            
            <div className="space-y-3 mb-4">
              <StatusBar icon={Heart} value={pet.hp} max={pet.maxHp} color="bg-red-500" />
              <StatusBar icon={Utensils} value={pet.hunger} max={100} color="bg-emerald-500" />
              <StatusBar icon={Zap} value={pet.energy} max={100} color="bg-amber-500" />
            </div>

            <div className="pt-4 border-t border-stone-800/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">XP</span>
                <span className="text-xs font-mono text-stone-500">{pet.xp} / {nextLevelXp}</span>
              </div>
              <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${xpPercentage}%` }} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StatusBar({ icon: Icon, value, max, color }: { icon: any, value: number, max: number, color: string }) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-stone-500" />
      <div className="flex-1 h-2 bg-stone-950 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="w-10 text-right text-xs font-mono text-stone-500">
        {Math.ceil(value)}/{max}
      </div>
    </div>
  );
}
