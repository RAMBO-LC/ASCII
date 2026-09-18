import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Activity } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

/** Bucket real activity timestamps into a weeks × days grid (levels 0–3). */
function buildWeeks(
  activity: Activity[],
  weeks = 16,
): { grid: number[][]; total: number } {
  const days = weeks * 7;
  const counts = new Array<number>(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const item of activity) {
    const t = new Date(item.time);
    if (Number.isNaN(t.getTime())) continue;
    t.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - t.getTime()) / 86_400_000);
    if (diff >= 0 && diff < days) counts[days - 1 - diff] += 1;
  }
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) week.push(Math.min(3, counts[w * 7 + d]));
    grid.push(week);
  }
  return { grid, total: activity.length };
}

function intensityClass(level: number): string {
  if (level >= 3) return 'bg-primary';
  if (level === 2) return 'bg-primary/50';
  if (level === 1) return 'bg-primary/25';
  return 'bg-white/[0.06]';
}

/** Activity calendar driven entirely by real dashboard activity. */
export function ActivityCalendar({ activity }: { activity: Activity[] }) {
  const { grid: weeks, total } = useMemo(
    () => buildWeeks(activity),
    [activity],
  );
  const weekTotals = useMemo(
    () => weeks.map((w) => w.reduce((a, b) => a + b, 0)),
    [weeks],
  );
  const max = Math.max(1, ...weekTotals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <p className="micro">Consistency</p>
            <CardTitle className="font-display mt-1.5 text-lg tracking-tight">
              Activity calendar
            </CardTitle>
          </div>
          <div className="text-right">
            <p className="tnum font-display text-3xl font-bold leading-none">
              {total}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">recent actions</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {total === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing here yet — your mentor chats will fill this calendar automatically.
            </p>
          ) : (
            <>
              <div
                className="flex gap-1 overflow-x-auto pb-1"
                role="img"
                aria-label={`Activity calendar, ${total} recent learning actions`}
              >
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex shrink-0 flex-col gap-1">
                    {week.map((level, di) => (
                      <span
                        key={di}
                        title={`Week ${wi + 1}, day ${di + 1}: ${level} actions`}
                        className={cn(
                          'h-3.5 w-3.5 rounded-[4px]',
                          intensityClass(level),
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <span className="tnum">{total}</span> recent actions
                </span>
                <span className="flex items-center gap-1">
                  Less
                  {[0, 1, 2, 3].map((l) => (
                    <span
                      key={l}
                      className={cn('h-3 w-3 rounded-[4px]', intensityClass(l))}
                    />
                  ))}
                  More
                </span>
              </div>
              <div
                className="flex h-16 items-end gap-1"
                aria-hidden="true"
              >
                {weekTotals.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-primary/70"
                    style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
                    title={`Week ${i + 1}: ${v} actions`}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
