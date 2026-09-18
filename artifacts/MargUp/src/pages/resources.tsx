import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useResources } from '@/lib/api';
import { cn } from '@/lib/utils';

const ACCENTS: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  green: 'bg-green-500/10 text-green-300 border-green-500/20',
};

export function ResourcesPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data: resources, isLoading } = useResources(
    debounced || undefined,
  );

  return (
    <div className="mt-4 space-y-5 sm:mt-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Curated resources
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Same list the API serves — filter by keyword, open in a new tab.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter: javascript, roadmap, docs…"
          aria-label="Filter resources"
          className="min-h-[44px] pl-10"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && resources?.length === 0 && (
        <div className="glass rounded-3xl border-dashed p-12 text-center">
          <h2 className="text-lg font-bold">No matches for “{debounced}”</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try “javascript”, “roadmap”, or clear the search.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {resources?.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.3) }}
          >
            <Card className="glass group h-full transition-colors hover:border-white/20">
              <CardContent className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(ACCENTS[r.accent] ?? ACCENTS.blue)}
                  >
                    {r.type}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {r.duration}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug">
                  {r.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Open resource
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
