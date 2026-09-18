import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PhaseAdvice } from "@/components/phase-advice";
import { RoadmapMap } from "@/components/roadmap-map";
import { useRoadmap } from "@/lib/api";
import { cn } from "@/lib/utils";

const storeKey = (slug: string): string => `MargUp-roadmap-done-${slug}`;

function loadDone(slug: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(storeKey(slug)) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function RoadmapsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "frontend";
  const { data: roadmap, isLoading, isError, refetch } = useRoadmap(slug);
  const [done, setDone] = useState<string[]>(() => loadDone(slug));
  const [openPhase, setOpenPhase] = useState<string | null>(null);
  const [deepTopic, setDeepTopic] = useState<string | null>(null);

  useEffect(() => {
    setDone(loadDone(slug));
    setOpenPhase(null);
    // Deep link from roadmap search (?topic=…) opens the matching phase.
    setDeepTopic(new URLSearchParams(window.location.search).get("topic"));
  }, [slug]);

  const toggle = (phaseId: string, topic: string): void => {
    const key = `${phaseId}:${topic}`;
    setDone((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      localStorage.setItem(storeKey(slug), JSON.stringify(next));
      return next;
    });
  };

  if (isLoading || (!roadmap && !isError)) {
    return (
      <div className="mt-4 space-y-3 sm:mt-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (isError || !roadmap) {
    return (
      <div className="mt-4 space-y-4 sm:mt-6">
        <Link href="/roadmaps">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            All roadmaps
          </Button>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-semibold">Roadmap not found</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalTopics =
    roadmap.phases.reduce((a, p) => a + p.topics.length, 0) ?? 0;
  const doneCount =
    roadmap.phases.reduce(
      (a, p) =>
        a + p.topics.filter((t) => done.includes(`${p.id}:${t}`)).length,
      0,
    ) ?? 0;
  const pct =
    totalTopics === 0 ? 0 : Math.round((doneCount / totalTopics) * 100);

  // Search deep link (?topic=…) resolves to the phase containing that topic.
  const deepPhaseId = deepTopic
    ? roadmap.phases.find((p) =>
        p.topics.some((t) => t.toLowerCase() === deepTopic.toLowerCase()),
      )?.id
    : undefined;
  const effectivePhase = openPhase ?? deepPhaseId;

  return (
    <div className="mt-4 space-y-5 sm:mt-6">
      <Link href="/roadmaps">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" />
          All roadmaps
        </Button>
      </Link>

      <motion.div
        key={slug}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-border bg-card">
          <div className="border-b border-border p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{roadmap.level}</Badge>
              <Badge variant="secondary">{pct}% complete</Badge>
            </div>
            <h1 className="font-display mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {roadmap.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {roadmap.description}
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              For: {roadmap.audience}
            </p>
            <div className="mt-4">
              <p className="micro">You will be able to</p>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {roadmap.outcomes.map((outcome) => (
                  <li
                    key={outcome}
                    className="rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-[13px] font-medium leading-snug"
                  >
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
            <Progress
              value={pct}
              className="mt-4"
              aria-label={`${pct}% complete`}
            />
          </div>
          <CardContent className="p-4 sm:p-6">
            {deepTopic && deepPhaseId && (
              <p className="mb-3 rounded-xl border border-primary/30 bg-primary/[0.07] px-3.5 py-2.5 text-[13px]" role="status">
                Jumped to <span className="font-semibold">“{deepTopic}”</span> from
                your search.
              </p>
            )}
            <p className="micro">Path map</p>
            <div className="mt-3">
              <RoadmapMap
                phases={[...roadmap.phases]}
                doneKeys={done}
                openPhaseId={effectivePhase}
                onSelectPhase={(id) => setOpenPhase(id)}
                onToggleTopic={toggle}
              />
            </div>
            <div className="mb-1 mt-6 flex items-center justify-between">
              <p className="micro">Phase details</p>
            </div>
            <Accordion
              type="single"
              collapsible
              key={`${slug}-${effectivePhase ?? "default"}`}
              defaultValue={
                effectivePhase ??
                roadmap.phases.find((p) =>
                  p.topics.some((t) => !done.includes(`${p.id}:${t}`)),
                )?.id ??
                roadmap.phases[1]?.id ??
                roadmap.phases[0]?.id
              }
            >
              {roadmap.phases.map((phase, pi) => {
                const phaseDone = phase.topics.filter((t) =>
                  done.includes(`${phase.id}:${t}`),
                ).length;
                return (
                  <AccordionItem key={phase.id} value={phase.id}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-3 text-left">
                        <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                          {pi + 1}
                        </span>
                        <span>
                          <span className="block font-semibold">
                            {phase.title}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            {phase.duration} · {phaseDone}/{phase.topics.length}{" "}
                            done
                            {phase.completed && (
                              <Badge variant="secondary" className="ml-1">
                                Suggested complete
                              </Badge>
                            )}
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {phase.topics.map((t) => {
                          const key = `${phase.id}:${t}`;
                          const checked = done.includes(key);
                          return (
                            <li key={t}>
                              <button
                                type="button"
                                onClick={() => toggle(phase.id, t)}
                                aria-pressed={checked}
                                className={cn(
                                  "flex min-h-[44px] w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                                  checked
                                    ? "border-green-500/30 bg-green-500/10"
                                    : "border-border bg-card hover:border-muted-foreground/40",
                                )}
                              >
                                {checked ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                                ) : (
                                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                                )}
                                <span
                                  className={cn(
                                    checked &&
                                      "text-muted-foreground line-through",
                                  )}
                                >
                                  {t}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <PhaseAdvice
                        slug={roadmap.slug}
                        phaseId={phase.id}
                        phaseTitle={phase.title}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mt-4 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">How to use this path</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Work phases in order. For each topic: read one resource, build one
            tiny thing, then check it off. Stuck on a phase? Expand it and ask
            the mentor — AI guidance appears only when you request it. For
            deeper help, open a thread in{" "}
            <Link
              href="/topics"
              className="font-medium text-primary hover:underline"
            >
              AI Mentor →
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
