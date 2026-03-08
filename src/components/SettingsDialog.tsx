import React from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Separator } from './ui/separator';

type Props = {
  open: boolean;
  onClose: () => void;
  onClearProgress: () => void;
  petCount: number;
  gold: number;
  totalItems: number;
};

export default function SettingsDialog({ open, onClose, onClearProgress, petCount, gold, totalItems }: Props) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <Badge className="w-fit uppercase tracking-[0.3em] text-stone-500">Settings</Badge>
          <DialogTitle>Local Save Data</DialogTitle>
          <DialogDescription>This parlour autosaves locally in this browser.</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-6">
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
            <Button
              onClick={onClearProgress}
              variant="destructive"
              className="mt-4"
            >
              <RotateCcw size={16} />
              Clear Progress
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
