import { and, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateTopicBody,
  CreateTopicResponse,
  GetDashboardResponse,
  GetRoadmapParams,
  GetRoadmapResponse,
  HeartbeatStreakResponse,
  ListMessagesParams,
  ListMessagesResponse,
  ListResourcesQueryParams,
  ListResourcesResponse,
  ListTopicsResponse,
  SendMessageBody,
  SendMessageParams,
  SendMessageResponse,
} from "@workspace/api-zod";
import {
  db,
  messagesTable,
  topicsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

const SYSTEM_INSTRUCTION = `You are DevMentor, an expert career guide for Indian college students learning technology.
Help students learn programming, web development, AI/ML, and software engineering.
Keep answers concise unless asked for detail. Be encouraging but honest. Give runnable examples for coding questions.
When a student asks for a learning path, ground the answer in a practical sequence of fundamentals, projects, and review.
Sound like a friendly senior developer, not a corporate bot. Use Markdown.`;

const roadmapData = {
  frontend: {
    slug: "frontend",
    title: "Frontend Developer",
    description: "Build interfaces people trust, from browser fundamentals to production React.",
    phases: [
      { id: "web", title: "Web foundations", duration: "3–4 weeks", topics: ["HTML semantics", "CSS layout", "JavaScript essentials"], completed: true },
      { id: "react", title: "React & product UI", duration: "4–6 weeks", topics: ["Components", "State & effects", "Forms and accessibility"], completed: false },
      { id: "ship", title: "Ship with confidence", duration: "3–4 weeks", topics: ["Testing", "Performance", "Deployment"], completed: false },
    ],
  },
  backend: {
    slug: "backend",
    title: "Backend Developer",
    description: "Design dependable services, data models, and APIs that scale with your ideas.",
    phases: [
      { id: "core", title: "Programming core", duration: "3–4 weeks", topics: ["Data structures", "HTTP", "Error handling"], completed: false },
      { id: "services", title: "Services & data", duration: "4–6 weeks", topics: ["REST APIs", "SQL", "Authentication"], completed: false },
      { id: "reliable", title: "Reliable systems", duration: "3–4 weeks", topics: ["Observability", "Caching", "Deployment"], completed: false },
    ],
  },
  devops: {
    slug: "devops",
    title: "DevOps Engineer",
    description: "Make software delivery repeatable, observable, and safe.",
    phases: [
      { id: "linux", title: "Systems & Linux", duration: "3–4 weeks", topics: ["Shell", "Processes", "Networking"], completed: false },
      { id: "delivery", title: "Delivery pipelines", duration: "4–6 weeks", topics: ["Git", "CI/CD", "Containers"], completed: false },
      { id: "operate", title: "Operate at scale", duration: "3–4 weeks", topics: ["Cloud primitives", "Monitoring", "Incident response"], completed: false },
    ],
  },
} as const;

const resourceData = [
  { id: "mdn", title: "MDN Web Docs", description: "The reference desk for HTML, CSS, and JavaScript fundamentals.", type: "Reference", duration: "Self-paced", url: "https://developer.mozilla.org/en-US/docs/Learn", accent: "blue" },
  { id: "javascript-info", title: "The Modern JavaScript Tutorial", description: "A clear path from language basics to asynchronous JavaScript.", type: "Course", duration: "Self-paced", url: "https://javascript.info/", accent: "amber" },
  { id: "roadmap", title: "Developer Roadmaps", description: "Community-built paths for frontend, backend, DevOps, and more.", type: "Roadmap", duration: "Browse paths", url: "https://roadmap.sh/", accent: "violet" },
  { id: "web-dev", title: "Web.dev Learn", description: "Practical guides for building fast, accessible web experiences.", type: "Articles", duration: "Self-paced", url: "https://web.dev/learn", accent: "green" },
];

async function ensureUser(userId: string) {
  await db
    .insert(usersTable)
    .values({ id: userId })
    .onConflictDoNothing();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

router.use(requireAuth);

router.get("/dashboard", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const user = await ensureUser(userId);
  const [{ value: topicCount }] = await db
    .select({ value: count() })
    .from(topicsTable)
    .where(eq(topicsTable.userId, userId));
  const [{ value: messageCount }] = await db
    .select({ value: count() })
    .from(messagesTable)
    .where(eq(messagesTable.role, "assistant"));
  const activity = await db
    .select({
      id: messagesTable.id,
      topicTitle: topicsTable.title,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .innerJoin(topicsTable, eq(messagesTable.topicId, topicsTable.id))
    .where(eq(topicsTable.userId, userId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(4);

  const response = {
    firstName: user?.firstName ?? "Learner",
    currentGoal: user?.currentGoal ?? "Build a strong foundation in modern web development",
    streak: {
      count: user?.streakCount ?? 0,
      lastActive: user?.lastActive ?? "",
      message: user?.streakCount ? "Keep the momentum going" : "Start your first learning streak",
    },
    topicCount: Number(topicCount),
    resourceCount: resourceData.length,
    recentActivity: activity.map((item) => ({
      id: item.id,
      label: item.topicTitle,
      detail: item.content.slice(0, 96),
      time: item.createdAt.toISOString(),
    })),
  };

  res.json(GetDashboardResponse.parse(response));
});

router.get("/topics", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  await ensureUser(userId);
  const topics = await db
    .select()
    .from(topicsTable)
    .where(eq(topicsTable.userId, userId))
    .orderBy(desc(topicsTable.createdAt));
  const shaped = await Promise.all(
    topics.map(async (topic) => {
      const [{ value: messageCount }] = await db
        .select({ value: count() })
        .from(messagesTable)
        .where(eq(messagesTable.topicId, topic.id));
      const [lastMessage] = await db
        .select({ createdAt: messagesTable.createdAt })
        .from(messagesTable)
        .where(eq(messagesTable.topicId, topic.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      return {
        id: topic.id,
        title: topic.title,
        techStack: topic.techStack,
        roadmapRef: topic.roadmapRef,
        messageCount: Number(messageCount),
        lastMessageAt: iso(lastMessage?.createdAt ?? null),
        createdAt: topic.createdAt.toISOString(),
      };
    }),
  );
  res.json(ListTopicsResponse.parse(shaped));
});

router.post("/topics", async (req, res): Promise<void> => {
  const parsed = CreateTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  await ensureUser(userId);
  const [topic] = await db
    .insert(topicsTable)
    .values({
      userId,
      title: parsed.data.title.trim(),
      techStack: parsed.data.techStack ?? [],
      roadmapRef: parsed.data.techStack?.[0] === "React" ? "frontend" : null,
    })
    .returning();
  res.status(201).json(
    CreateTopicResponse.parse({
      id: topic.id,
      title: topic.title,
      techStack: topic.techStack,
      roadmapRef: topic.roadmapRef,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: topic.createdAt.toISOString(),
    }),
  );
});

router.get("/topics/:topicId/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [topic] = await db
    .select({ id: topicsTable.id })
    .from(topicsTable)
    .where(and(eq(topicsTable.id, params.data.topicId), eq(topicsTable.userId, userId)));
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.topicId, params.data.topicId))
    .orderBy(messagesTable.createdAt);
  res.json(
    ListMessagesResponse.parse(
      messages.map((message) => ({
        id: message.id,
        topicId: message.topicId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/topics/:topicId/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  const body = SendMessageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const error = !params.success
      ? params.error.message
      : body.success
        ? "Invalid request"
        : body.error.message;
    res.status(400).json({ error });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [topic] = await db
    .select()
    .from(topicsTable)
    .where(and(eq(topicsTable.id, params.data.topicId), eq(topicsTable.userId, userId)));
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({ topicId: topic.id, role: "user", content: body.data.content.trim() })
    .returning();
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.topicId, topic.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(12);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "The AI mentor is not configured yet." });
    return;
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: history.reverse().map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      },
    );
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      req.log.error({ status: geminiResponse.status, errorText }, "Gemini request failed");
      res.status(502).json({ error: "The AI mentor could not answer right now." });
      return;
    }
    const payload = (await geminiResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const reply = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")?.trim();
    if (!reply) {
      res.status(502).json({ error: "The AI mentor returned an empty answer." });
      return;
    }
    const [assistantMessage] = await db
      .insert(messagesTable)
      .values({ topicId: topic.id, role: "assistant", content: reply })
      .returning();
    res.status(201).json(
      SendMessageResponse.parse({
        userMessage: {
          id: userMessage.id,
          topicId: userMessage.topicId,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        assistantMessage: {
          id: assistantMessage.id,
          topicId: assistantMessage.topicId,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
      }),
    );
  } catch (error) {
    req.log.error({ error }, "Gemini request failed");
    res.status(502).json({ error: "The AI mentor could not answer right now." });
  }
});

router.post("/streak/heartbeat", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const user = await ensureUser(userId);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  let streak = user?.streakCount ?? 0;
  if (user?.lastActive === today) {
    streak = user.streakCount;
  } else if (user?.lastActive === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }
  await db
    .update(usersTable)
    .set({ streakCount: streak, lastActive: today })
    .where(eq(usersTable.id, userId));
  res.json(
    HeartbeatStreakResponse.parse({
      count: streak,
      lastActive: today,
      message: streak === 1 ? "Your learning streak has started" : "Your learning streak is alive",
    }),
  );
});

router.get("/roadmaps/:slug", async (req, res): Promise<void> => {
  const params = GetRoadmapParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const roadmap = roadmapData[params.data.slug as keyof typeof roadmapData];
  if (!roadmap) {
    res.status(404).json({ error: "Roadmap not found" });
    return;
  }
  res.json(GetRoadmapResponse.parse(roadmap));
});

router.get("/resources", async (req, res): Promise<void> => {
  const params = ListResourcesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const topic = params.data.topic?.toLowerCase();
  const resources = topic
    ? resourceData.filter((resource) =>
        `${resource.title} ${resource.description}`.toLowerCase().includes(topic),
      )
    : resourceData;
  res.json(ListResourcesResponse.parse(resources));
});

export default router;