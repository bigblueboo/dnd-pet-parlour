import type { HistoryEvent } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollText, Skull, Sparkles, Swords, UserPlus } from 'lucide-react';

type Props = {
  history: HistoryEvent[];
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function HistoryPage({ history }: Props) {
  const wins = history.filter((event) => event.type === 'battle-win').length;
  const losses = history.filter((event) => event.type === 'battle-loss').length;
  const levelUps = history.filter((event) => event.type === 'level-up').length;
  const acquisitions = history.filter((event) => event.type === 'monster-acquired').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Victories"
          value={wins}
          subtitle="Arena wins logged"
          icon={Swords}
          tone="emerald"
        />
        <SummaryCard
          title="Defeats"
          value={losses}
          subtitle="Arena losses logged"
          icon={Skull}
          tone="red"
        />
        <SummaryCard
          title="Level-Ups"
          value={levelUps}
          subtitle="Growth milestones"
          icon={Sparkles}
          tone="amber"
        />
        <SummaryCard
          title="Acquisitions"
          value={acquisitions}
          subtitle="Monsters adopted"
          icon={UserPlus}
          tone="indigo"
        />
      </section>

      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.09),transparent_28%),linear-gradient(180deg,#191614_0%,#1c1917_100%)]">
        <CardHeader className="border-b border-stone-800/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Parlour Chronicle</CardTitle>
              <p className="mt-1 text-sm text-stone-500">Wins, losses, level-ups, and monster acquisitions are saved locally.</p>
            </div>
            <Badge variant="secondary">{history.length} entries</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {history.length > 0 ? (
            <div className="divide-y divide-stone-800/80">
              {history.map((event) => (
                <article key={event.id} className="flex gap-4 px-5 py-4">
                  <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${getToneClasses(event.type)}`}>
                    {getIcon(event.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-stone-100">{event.title}</h3>
                      <Badge variant="default" className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                        {getLabel(event.type)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-stone-400">{event.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.18em] text-stone-500">
                      <span>{dateFormatter.format(new Date(event.createdAt))}</span>
                      {typeof event.goldEarned === 'number' ? <span>{event.goldEarned}g</span> : null}
                      {typeof event.xpEarned === 'number' ? <span>{event.xpEarned} XP</span> : null}
                      {typeof event.level === 'number' ? <span>Level {event.level}</span> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-stone-800 bg-stone-950/70 text-stone-400">
                <ScrollText size={28} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-stone-100">No history yet</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                Adopt monsters, win battles, lose battles, and level up your roster to build the parlour record.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Swords;
  tone: 'emerald' | 'red' | 'amber' | 'indigo';
}) {
  const toneClasses =
    tone === 'emerald'
      ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300'
      : tone === 'red'
        ? 'border-red-900/40 bg-red-950/20 text-red-300'
        : tone === 'amber'
          ? 'border-amber-900/40 bg-amber-950/20 text-amber-300'
          : 'border-indigo-900/40 bg-indigo-950/20 text-indigo-300';

  return (
    <Card className="bg-stone-900/90">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${toneClasses}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-100">{title}</p>
          <p className="mt-1 text-2xl font-bold text-stone-50">{value}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getLabel(type: HistoryEvent['type']) {
  if (type === 'battle-win') {
    return 'Victory';
  }
  if (type === 'battle-loss') {
    return 'Defeat';
  }
  if (type === 'level-up') {
    return 'Level-Up';
  }
  return 'Acquired';
}

function getIcon(type: HistoryEvent['type']) {
  if (type === 'battle-win') {
    return <Swords size={18} />;
  }
  if (type === 'battle-loss') {
    return <Skull size={18} />;
  }
  if (type === 'level-up') {
    return <Sparkles size={18} />;
  }
  return <UserPlus size={18} />;
}

function getToneClasses(type: HistoryEvent['type']) {
  if (type === 'battle-win') {
    return 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300';
  }
  if (type === 'battle-loss') {
    return 'border-red-900/40 bg-red-950/20 text-red-300';
  }
  if (type === 'level-up') {
    return 'border-amber-900/40 bg-amber-950/20 text-amber-300';
  }
  return 'border-indigo-900/40 bg-indigo-950/20 text-indigo-300';
}
