import { Check, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Roadmap } from '@workspace/api-client-react';

type Phase = Roadmap['phases'][number];

function keyOf(phaseId: string, topic: string): string {
  return `${phaseId}:${topic}`;
}

/**
 * Visual path map: phases as stations on a vertical rail, topics as
 * quick-toggle nodes. Tapping a station opens it below; tapping a topic
 * node checks it off right here — fast to scan, fast to update.
 */
export function RoadmapMap({
  phases,
  doneKeys,
  openPhaseId,
  onSelectPhase,
  onToggleTopic,
}: {
  phases: Phase[];
  doneKeys: string[];
  openPhaseId: string | undefined;
  onSelectPhase: (phaseId: string) => void;
  onToggleTopic: (phaseId: string, topic: string) => void;
}) {
  const isDone = (phaseId: string, topic: string): boolean =>
    doneKeys.includes(keyOf(phaseId, topic));

  const phaseDoneCount = (phase: Phase): number =>
    phase.topics.filter((t) => isDone(phase.id, t)).length;

  const currentId = phases.find(
    (p) => phaseDoneCount(p) < p.topics.length,
  )?.id;

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute bottom-6 left-[13px] top-2 w-px bg-border"
      />
      <ol className="space-y-6">
        {phases.map((phase, i) => {
          const count = phaseDoneCount(phase);
          const total = phase.topics.length;
          const status =
            count === total && total > 0
              ? 'done'
              : phase.id === currentId
                ? 'current'
                : 'todo';
          const selected = openPhaseId === phase.id;
          return (
            <li key={phase.id} className="relative flex gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={() => onSelectPhase(phase.id)}
                aria-label={`Open phase ${i + 1}: ${phase.title}`}
                aria-pressed={selected}
                className="relative z-10 mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span
                  className={cn(
                    'tnum flex h-7 w-7 items-center justify-center rounded-full border text-[13px] font-bold transition-colors',
                    status === 'done' &&
                      'border-primary bg-primary text-primary-foreground',
                    status === 'current' &&
                      'border-primary bg-background text-primary',
                    status === 'todo' &&
                      'border-border bg-background text-muted-foreground',
                    selected && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-card',
                  )}
                >
                  {status === 'done' ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </span>
                {status === 'current' && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden="true" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onSelectPhase(phase.id)}
                  className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                >
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold leading-snug">
                      {phase.title}
                    </span>
                    {status === 'current' && (
                      <span className="micro !text-primary">You are here</span>
                    )}
                  </span>
                  <span className="tnum mt-0.5 block text-xs text-muted-foreground">
                    {phase.duration} · {count}/{total} topics
                  </span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {phase.topics.map((topic) => {
                    const checked = isDone(phase.id, topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => onToggleTopic(phase.id, topic)}
                        aria-pressed={checked}
                        title={checked ? `Mark "${topic}" as not done` : `Mark "${topic}" as done`}
                        className={cn(
                          'flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          checked
                            ? 'border-primary/50 bg-primary/10 text-foreground'
                            : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
                        )}
                      >
                        {checked && (
                          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                        )}
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}

        <li className="relative flex items-center gap-3.5 sm:gap-4" aria-hidden="true">
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground">
            <Flag className="h-3 w-3" />
          </span>
          <span className="micro">Finish line</span>
        </li>
      </ol>
    </div>
  );
}
