import React, { useEffect } from 'react';
import { RotateCcw, ShieldAlert, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onClearProgress: () => void;
  petCount: number;
  gold: number;
  totalItems: number;
};

export default function SettingsDialog({ open, onClose, onClearProgress, petCount, gold, totalItems }: Props) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-stone-800 bg-stone-900 shadow-2xl shadow-stone-950/60">
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-5 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-stone-500">Settings</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-stone-100">Local Save Data</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-stone-700 p-2 text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-200"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-8">
          <div className="rounded-[1.5rem] border border-emerald-900/40 bg-emerald-950/30 p-5">
            <p className="text-sm font-medium text-emerald-200">This parlour autosaves locally in this browser.</p>
            <p className="mt-2 text-sm text-stone-400">
              Current save: {petCount} creatures, {gold} gold, {totalItems} inventory items.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-amber-900/40 bg-amber-950/20 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 text-amber-400" size={18} />
              <div>
                <p className="text-sm font-semibold text-amber-200">Clear saved progress</p>
                <p className="mt-2 text-sm text-stone-400">
                  This resets pets, gold, inventory, and selected view back to the starter state on this device.
                </p>
              </div>
            </div>
            <button
              onClick={onClearProgress}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-700/50 bg-red-900/30 px-4 py-2.5 text-sm font-semibold text-red-100 transition-colors hover:bg-red-900/50"
            >
              <RotateCcw size={16} />
              Clear Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
