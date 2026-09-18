import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateTopic, useDeleteTopic, useTopics } from '@/lib/api';
import { toast } from 'sonner';

export function TopicsPage() {
  const [, navigate] = useLocation();
  const { data: topics, isLoading, isError, refetch } = useTopics();
  const createTopic = useCreateTopic();
  const deleteTopic = useDeleteTopic();

  const create = (): void => {
    createTopic.mutate(
      {},
      {
        onSuccess: (topic) => navigate(`/topics/${topic.id}`),
        onError: () => toast.error('Could not start a new chat'),
      },
    );
  };

  return (
    <div className="mt-4 space-y-5 sm:mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            AI Mentor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One thread per concept. Your coach guides — titles appear automatically.
          </p>
        </div>
        <Button onClick={create} disabled={createTopic.isPending}>
          <Plus className="h-4 w-4" />
          {createTopic.isPending ? 'Starting…' : 'New chat'}
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-semibold">Could not load chats</p>
          <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {topics && topics.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="font-display mt-3 text-lg font-bold">No chats yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Start a chat and say what you want to learn — the title takes care of itself.
          </p>
          <Button className="mt-4" onClick={create} disabled={createTopic.isPending}>
            <Plus className="h-4 w-4" />
            Start your first chat
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics?.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.3) }}
          >
            <Card className="h-full border-border bg-card transition-colors hover:border-muted-foreground/40">
              <CardContent className="flex h-full flex-col p-5">
                <Link href={`/topics/${t.id}`}>
                  <span className="font-display cursor-pointer text-[17px] font-bold leading-snug tracking-tight hover:text-primary">
                    {t.title}
                  </span>
                </Link>
                <div className="mt-2.5 flex min-h-[26px] flex-wrap gap-1.5">
                  {t.techStack.length === 0 && t.messageCount === 0 ? (
                    <Badge variant="outline">Fresh chat</Badge>
                  ) : (
                    t.techStack.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))
                  )}
                  {t.roadmapRef && (
                    <Badge variant="outline">→ {t.roadmapRef}</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="tnum">
                    {t.messageCount} messages
                  </span>
                  {t.lastMessageAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(t.lastMessageAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/topics/${t.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Open chat
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${t.title}`}
                    onClick={() =>
                      deleteTopic.mutate(t.id, {
                        onSuccess: () => toast.success('Chat deleted'),
                        onError: () => toast.error('Could not delete chat'),
                      })
                    }
                    className="shrink-0 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
