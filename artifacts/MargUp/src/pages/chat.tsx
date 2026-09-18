import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/message-bubble";
import {
  useMessages,
  useSendMessage,
  useTopics,
} from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatPage() {
  const params = useParams<{ id: string }>();
  const topicId = params.id ?? "";
  const { data: topics } = useTopics();
  const topic = topics?.find((t) => t.id === topicId);
  const { data: messages, isLoading, isError } = useMessages(topicId);
  const send = useSendMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length, send.isPending]);

  const submit = (): void => {
    const content = input.trim();
    if (!content || send.isPending) return;
    setInput("");
    send.mutate(
      { topicId, content },
      {
        onError: () => {
          // Keep the message in the box so a retry is one tap.
          setInput(content);
          toast.error("The mentor is busy. Your message is kept — try again.");
        },
      },
    );
  };

  return (
    <div className="mt-4 space-y-4 sm:mt-6">
      <div className="flex items-center gap-3">
        <Link href="/topics">
          <Button variant="outline" size="icon" aria-label="Back to topics">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">
            {topic?.title ?? "Mentor chat"}
          </h1>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {(topic?.techStack ?? []).join(" · ") || "General"}
          </p>
        </div>
      </div>

      <div className="glass flex min-h-[55vh] flex-col overflow-hidden rounded-3xl">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "h-20 max-w-[75%] rounded-2xl",
                    i % 2 === 0 ? "" : "ml-auto",
                  )}
                />
              ))}
            </div>
          )}
          {isError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm">
              Could not load messages for this topic.
            </p>
          )}
          {messages?.length === 0 && (
            <div className="flex flex-col items-center p-8 text-center sm:p-12">
              <Sparkles className="h-10 w-10 text-primary" />
              <h2 className="font-display mt-3 text-lg font-bold tracking-tight">
                Start with your goal
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Tell me what you are learning and where you stand — I will map
                the path and guide you there, step by step. I will not just hand
                over answers.
              </p>
              <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                {[
                  "What should I learn next?",
                  "Make me a 2-week plan for React hooks",
                  "Quiz me on JavaScript closures",
                  "Guide me on posting on LinkedIn as a beginner",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="min-h-[40px] rounded-full border border-border bg-secondary/60 px-4 py-2 text-[13px] font-medium transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages?.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {send.isPending && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 sm:p-4">
          <div className="flex gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="What do you want to learn next?…"
              aria-label="Message the mentor"
              maxLength={2000}
              className="min-h-[44px] flex-1 rounded-xl border border-input bg-secondary/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
            />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={submit}
                disabled={send.isPending || !input.trim()}
                className="min-h-[44px] px-4 sm:px-6"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </motion.div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            MargUp can make mistakes — always test important code yourself.
          </p>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      className="flex items-center gap-2.5 text-sm text-muted-foreground"
      role="status"
      aria-label="Mentor is typing"
    >
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          />
        ))}
      </span>
      AI is thinking…
    </div>
  );
}
