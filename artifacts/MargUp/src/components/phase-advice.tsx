import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from './markdown';
import { useRoadmapAdvice } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Opt-in AI guidance for one roadmap phase. Nothing is fetched until the
 * learner explicitly asks — the AI stays out of the way otherwise.
 */
export function PhaseAdvice({
  slug,
  phaseId,
  phaseTitle,
}: {
  slug: string;
  phaseId: string;
  phaseTitle: string;
}) {
  const advice = useRoadmapAdvice();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');

  const ask = (followUp?: string): void => {
    advice.mutate(
      { slug, phaseId, question: followUp?.trim() || undefined },
      {
        onError: () =>
          toast.error('The mentor could not answer. Try again.'),
      },
    );
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-secondary/40">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            ask();
          }}
          className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-secondary/70"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold">
              Get AI guidance for this phase
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {phaseTitle} — asked only when you opt in
            </span>
          </span>
        </button>
      ) : (
        <div className="p-3.5">
          <AnimatePresence mode="wait">
            {advice.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 py-2 text-sm text-muted-foreground"
                role="status"
              >
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                  ))}
                </span>
                Mentor is thinking…
              </motion.div>
            ) : advice.data ? (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Markdown content={advice.data.advice} />
              </motion.div>
            ) : (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-1 text-sm"
              >
                <p className="font-medium">Could not reach the mentor.</p>
                <p className="mt-0.5 text-muted-foreground">
                  {advice.isError
                    ? 'The AI service may be unconfigured or busy.'
                    : 'Something went wrong.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5"
                  onClick={() => ask()}
                >
                  Try again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            className="mt-3 flex gap-2 border-t border-border pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) ask(question);
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a follow-up about this phase…"
              aria-label="Follow-up question for the mentor"
              maxLength={500}
              className="min-h-[40px] flex-1 rounded-lg border border-input bg-background px-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
            />
            <Button
              type="submit"
              size="sm"
              className="min-h-[40px]"
              disabled={advice.isPending || !question.trim()}
              aria-label="Send follow-up"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
