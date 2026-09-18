import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoadmaps } from '@/lib/api';
import type { RoadmapSummary } from '@workspace/api-client-react';

function searchRoadmaps(
  roadmaps: RoadmapSummary[],
  rawQuery: string,
): Array<{ roadmap: RoadmapSummary; matchedTopics: string[] }> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return roadmaps.map((roadmap) => ({ roadmap, matchedTopics: [] }));
  }
  const words = query.split(/\s+/);
  const hits: Array<{
    roadmap: RoadmapSummary;
    matchedTopics: string[];
    score: number;
  }> = [];
  for (const roadmap of roadmaps) {
    const haystack = `${roadmap.title} ${roadmap.description} ${roadmap.level}`.toLowerCase();
    const matchedTopics = roadmap.allTopics.filter((topic) =>
      words.every((word) => topic.toLowerCase().includes(word)),
    );
    const titleHit = words.every((word) => roadmap.title.toLowerCase().includes(word));
    const generalHit = words.every((word) => haystack.includes(word));
    if (!titleHit && !generalHit && matchedTopics.length === 0) continue;
    hits.push({
      roadmap,
      matchedTopics: matchedTopics.slice(0, 4),
      score: titleHit ? 0 : matchedTopics.length > 0 ? 1 : 2,
    });
  }
  return hits
    .sort((a, b) => a.score - b.score)
    .map(({ roadmap, matchedTopics }) => ({ roadmap, matchedTopics }));
}

export function RoadmapsIndexPage() {
  const { data: roadmaps, isLoading, isError, refetch } = useRoadmaps();
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => searchRoadmaps(roadmaps ?? [], query),
    [roadmaps, query],
  );
  const searching = query.trim().length > 0;

  return (
    <div className="mt-4 space-y-5 sm:mt-6">
      <div>
        <p className="micro">Learn</p>
        <h1 className="font-display mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
          Roadmap paths
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A full path for every kind of topic — pick one, work it phase by
          phase, and ask the AI mentor for guidance only when you want it.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search programmes or topics — try “hooks”, “SQL”, “interview”…"
          aria-label="Search roadmaps and topics"
          className="min-h-[44px] pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-semibold">Could not load roadmaps</p>
          <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && searching && (
        <p className="text-sm text-muted-foreground" role="status">
          <span className="tnum font-semibold text-foreground">{results.length}</span>{' '}
          {results.length === 1 ? 'path' : 'paths'} matching{' '}
          <span className="font-medium text-foreground">“{query.trim()}”</span>
        </p>
      )}

      {!isLoading && !isError && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-bold">No matches for “{query.trim()}”</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Try a programme (“React”, “DSA”) or a topic (“hooks”, “SQL”, “Graphs”).
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setQuery('')}>
            Clear search
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map(({ roadmap, matchedTopics }, i) => (
          <motion.div
            key={roadmap.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.35) }}
          >
            <Link
              href={
                matchedTopics.length > 0
                  ? `/roadmaps/${roadmap.slug}?topic=${encodeURIComponent(matchedTopics[0])}`
                  : `/roadmaps/${roadmap.slug}`
              }
            >
              <span className="group flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-muted-foreground/40 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{roadmap.level}</Badge>
                  <span className="tnum text-xs text-muted-foreground">
                    {roadmap.phaseCount} phases
                  </span>
                </div>
                <span className="font-display mt-3 text-lg font-bold leading-snug tracking-tight group-hover:text-primary">
                  {roadmap.title}
                </span>
                <span className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {roadmap.description}
                </span>
                {matchedTopics.length > 0 && (
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {matchedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </span>
                )}
                <span className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                  {matchedTopics.length > 0 ? 'Jump to matching topic' : 'Open full path'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6">
        <div>
          <p className="font-display text-base font-bold tracking-tight">
            Want visibility while you learn?
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pair any roadmap with a career playbook — LinkedIn, X, GitHub.
          </p>
        </div>
        <Link href="/playbooks">
          <Button variant="outline">
            Browse playbooks
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
