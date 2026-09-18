import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/react';
import {
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  MessagesSquare,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard, useRoadmaps, useTopics } from '@/lib/api';
import { ActivityCalendar } from '@/components/activity-calendar';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function dateLabel(): string {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

export function DashboardPage() {
  const dash = useDashboard();
  const topicsQ = useTopics();
  const roadmapsQ = useRoadmaps();
  const { user } = useUser();
  const data = dash.data;
  const topics = topicsQ.data;
  const loading = dash.isLoading || topicsQ.isLoading;
  const name = user?.firstName ?? data?.firstName ?? 'Learner';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (dash.isError || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-xl font-bold">
          Could not load your dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something hiccuped on the server. Try again.
        </p>
        <Button className="mt-4" onClick={() => void dash.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const current = topics?.[0];
  const stats: Array<{ label: string; value: string }> = [
    { label: 'Active topics', value: String(data.topicCount) },
    { label: 'Roadmap paths', value: String(roadmapsQ.data?.length ?? 0) },
    { label: 'Resources', value: String(data.resourceCount) },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <motion.header {...rise(0)}>
        <p className="micro">{dateLabel()}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">
              {greeting()}, {name}.
            </h1>
            <p className="mt-1.5 flex max-w-xl items-start gap-1.5 text-sm text-muted-foreground">
              <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {data.currentGoal}
            </p>
          </div>
          <div className="flex gap-2">
            {current && (
              <Link href={`/topics/${current.id}`}>
                <Button>
                  Resume learning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/topics">
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                New topic
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── Stats strip ────────────────────────────────── */}
      <motion.section
        {...rise(0.06)}
        className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card"
        aria-label="Stats"
      >
        {stats.map((s) => (
          <div key={s.label} className="px-3 py-4 sm:px-5">
            <p className="micro">{s.label}</p>
            <p className="tnum font-display mt-1 text-[26px] font-bold leading-none">
              {s.value}
            </p>
          </div>
        ))}
      </motion.section>

      {/* ── Bento ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section
          {...rise(0.12)}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <p className="micro">Continue learning</p>
            <Link
              href="/topics"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              All topics →
            </Link>
          </div>
          {current ? (
            <div className="mt-3">
              <Link href={`/topics/${current.id}`}>
                <span className="font-display cursor-pointer text-xl font-bold tracking-tight hover:text-primary sm:text-2xl">
                  {current.title}
                </span>
              </Link>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {current.techStack.length === 0 && (
                  <Badge variant="secondary">General</Badge>
                )}
                {current.techStack.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
              {data.recentActivity[0] && (
                <p className="mt-3 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed text-muted-foreground">
                  “{data.recentActivity[0].detail}”
                </p>
              )}
              <div className="mt-4 flex items-center gap-3 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessagesSquare className="h-3.5 w-3.5" />
                  <span className="tnum">
                    {current.messageCount} messages
                  </span>
                </span>
                {current.lastMessageAt && (
                  <span>
                    Updated{' '}
                    {new Date(current.lastMessageAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No topics yet — create one to start.
            </p>
          )}
        </motion.section>

        <motion.section
          {...rise(0.18)}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <p className="micro">Explore</p>
          <div className="mt-3 space-y-1">
            {[
              { href: '/roadmaps', title: 'Find your path', desc: '9 roadmaps, pick one' },
              { href: '/playbooks', title: 'Get visible', desc: 'LinkedIn · X · GitHub' },
              { href: '/topics', title: 'Ask the mentor', desc: 'Guided, step by step' },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <span className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {a.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.desc}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </span>
              </Link>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.div {...rise(0.24)}>
        <ActivityCalendar activity={data.recentActivity} />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Activity timeline ─────────────────────────── */}
        <motion.section
          {...rise(0.3)}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <p className="micro">Recent activity</p>
            <Link
              href="/topics"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              View topics →
            </Link>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No activity yet — send your first message to the mentor.
            </p>
          ) : (
            <ol className="mt-4 space-y-0">
              {data.recentActivity.map((a, i) => (
                <li key={a.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < data.recentActivity.length - 1 && (
                    <span
                      className="absolute left-[5px] top-4 h-full w-px bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <span className="mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-[2.5px] border-primary bg-background" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold">
                        {a.label}
                      </p>
                      <span className="tnum shrink-0 text-xs text-muted-foreground">
                        {new Date(a.time).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {a.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </motion.section>

        {/* ── Paths ─────────────────────────────────────── */}
        <motion.section
          {...rise(0.36)}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <p className="micro">Roadmap paths</p>
            <Link
              href="/roadmaps"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {(roadmapsQ.data ?? []).slice(0, 4).map((p) => (
              <Link key={p.slug} href={`/roadmaps/${p.slug}`}>
                <span className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {p.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.level} · {p.phaseCount} phases
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </span>
              </Link>
            ))}
            {roadmapsQ.isLoading && (
              <p className="px-2 py-2 text-sm text-muted-foreground">Loading paths…</p>
            )}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <Link href="/playbooks">
              <span className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    Career playbooks
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    LinkedIn · X · GitHub
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </span>
            </Link>
          </div>
          <div className="border-t border-border pt-3">
            <Link href="/resources">
              <span className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    Curated resources
                  </span>
                  <span className="tnum block text-xs text-muted-foreground">
                    {data.resourceCount} saved
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </span>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
