import { Link, useParams } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Markdown } from '@/components/markdown';
import { usePlaybooks } from '@/lib/api';
import { cn } from '@/lib/utils';

export function PlaybooksPage() {
  const params = useParams<{ slug: string }>();
  const { data: playbooks, isLoading, isError, refetch } = usePlaybooks();
  const slug = params.slug ?? playbooks?.[0]?.slug ?? 'linkedin';
  const playbook = playbooks?.find((p) => p.slug === slug) ?? playbooks?.[0];

  return (
    <div className="mt-4 space-y-5 sm:mt-6">
      <div>
        <p className="micro">Career</p>
        <h1 className="font-display mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
          Growth playbooks
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Separate from coding roadmaps: this is how you get seen. Posting systems for beginners — what to post, how to post, and the confidence to start today.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-semibold">Could not load playbooks</p>
          <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {playbooks && playbooks.length > 0 && (
        <>
          <div
            className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
            role="tablist"
            aria-label="Platforms"
          >
            {playbooks.map((p) => (
              <Link key={p.slug} href={`/playbooks/${p.slug}`}>
                <span
                  role="tab"
                  aria-selected={playbook?.slug === p.slug}
                  className={cn(
                    'block cursor-pointer whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    playbook?.slug === p.slug
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p.platform}
                </span>
              </Link>
            ))}
          </div>

          {playbook && (
            <motion.div
              key={playbook.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{playbook.platform}</Badge>
                  <Badge variant="secondary">{playbook.level}</Badge>
                </div>
                <h2 className="font-display mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                  {playbook.title}
                </h2>
                <p className="mt-1 text-[15px] font-medium text-primary">
                  {playbook.tagline}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {playbook.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  For: {playbook.audience}
                </p>
              </div>

              <ol className="mt-4 space-y-4">
                {playbook.sections.map((section, i) => (
                  <motion.li
                    key={section.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    className="rounded-2xl border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="tnum font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-[17px] font-bold tracking-tight">
                          {section.title}
                        </h3>
                        <div className="mt-2 text-muted-foreground [&_p]:text-foreground/90">
                          <Markdown content={section.body} />
                        </div>
                        {section.points.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {section.points.map((point) => (
                              <li
                                key={point}
                                className="flex items-start gap-2.5 text-sm leading-relaxed"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                                  <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                </span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ol>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6">
                <div>
                  <p className="font-display text-base font-bold tracking-tight">
                    Want this tailored to you?
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Tell the mentor your goal and level — it will build your personal posting plan.
                  </p>
                </div>
                <Link href="/topics">
                  <Button>
                    Ask the mentor
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
