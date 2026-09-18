import { and, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateTopicBody,
  CreateTopicResponse,
  DeleteTopicParams,
  GetDashboardResponse,
  GetRoadmapParams,
  GetRoadmapResponse,
  ListMessagesParams,
  ListMessagesResponse,
  ListPlaybooksResponse,
  ListResourcesQueryParams,
  ListResourcesResponse,
  ListRoadmapsResponse,
  ListTopicsResponse,
  RequestRoadmapAdviceBody,
  RequestRoadmapAdviceParams,
  RequestRoadmapAdviceResponse,
  SendMessageBody,
  SendMessageParams,
  SendMessageResponse,
} from "@workspace/api-zod";
import { db, messagesTable, topicsTable, usersTable } from "@workspace/db";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

const SYSTEM_INSTRUCTION = `You are MargUp, a personal learning mentor for Indian college students studying technology.
You NEVER output code snippets, programs, sample code, or code blocks. Not even short ones. If a learner explicitly asks for code, decline kindly in one line and convert the request into a guided exercise instead.

Your job:
1. Understand the student first. If you do not know their goal, current level, and available time, ask ONE short question before anything else. Remember what they tell you and tailor everything after it.
2. Tell them what to learn and what to learn next. Every answer is a small ordered path: what to do now, what comes after, what to skip for later. Name the single first action.
3. Ground guidance in learning paths. When a topic belongs to a roadmap lane (frontend, backend, JavaScript, React, Python, DSA, AI/ML, DevOps, placements), say so by name and place the learner on it: what they already have, what this step unlocks next.
4. Teach through questions and exercises, never lectures. Explain ideas in plain words with analogies, then give one small task that proves understanding — for example, ask them to explain it back in 3 sentences, predict an outcome, or find real examples. No code, ever.
5. When they claim progress, verify with one small recall question before moving on.
6. End every reply with exactly one thing: the next step or one question. Never a list of questions.

Career and social growth (LinkedIn, X/Twitter, GitHub, portfolios) is part of mentoring: build confidence first, especially for beginners. Be concrete and copy-pasteable about what to post, opening hooks, and timing in IST. Never suggest fake engagement, pods, exaggeration, or dishonest claims.

Style: warm senior developer, concise, honest. Short Markdown sections. No code fences, ever.`;

const roadmapData = {
  frontend: {
    slug: "frontend",
    title: "Frontend Developer",
    description:
      "Build interfaces people trust, from browser fundamentals to production React.",
    level: "Beginner-friendly",
    audience: "Students starting with HTML, CSS, JavaScript, or React",
    outcomes: [
      "Build responsive pages from scratch",
      "Ship a React app with forms and routing",
      "Debug layout and state issues independently",
    ],
    phases: [
      {
        id: "web",
        title: "Web foundations",
        duration: "3–4 weeks",
        topics: ["HTML semantics", "CSS layout", "JavaScript essentials"],
        completed: true,
      },
      {
        id: "react",
        title: "React & product UI",
        duration: "4–6 weeks",
        topics: ["Components", "State & effects", "Forms and accessibility"],
        completed: false,
      },
      {
        id: "ship",
        title: "Ship with confidence",
        duration: "3–4 weeks",
        topics: ["Testing", "Performance", "Deployment"],
        completed: false,
      },
    ],
  },
  backend: {
    slug: "backend",
    title: "Backend Developer",
    description:
      "Design dependable services, data models, and APIs that scale with your ideas.",
    level: "Beginner-friendly",
    audience: "Students who know basic programming and want to build APIs",
    outcomes: [
      "Design REST endpoints with validation and errors",
      "Model data in SQL and wire up auth",
      "Deploy an observable service",
    ],
    phases: [
      {
        id: "core",
        title: "Programming core",
        duration: "3–4 weeks",
        topics: ["Data structures", "HTTP", "Error handling"],
        completed: false,
      },
      {
        id: "services",
        title: "Services & data",
        duration: "4–6 weeks",
        topics: ["REST APIs", "SQL", "Authentication"],
        completed: false,
      },
      {
        id: "reliable",
        title: "Reliable systems",
        duration: "3–4 weeks",
        topics: ["Observability", "Caching", "Deployment"],
        completed: false,
      },
    ],
  },
  devops: {
    slug: "devops",
    title: "DevOps Engineer",
    description: "Make software delivery repeatable, observable, and safe.",
    level: "Intermediate",
    audience: "Students comfortable with Git and one programming language",
    outcomes: [
      "Navigate Linux and debug a live server",
      "Build a CI pipeline that tests and deploys",
      "Monitor an app and respond to incidents",
    ],
    phases: [
      {
        id: "linux",
        title: "Systems & Linux",
        duration: "3–4 weeks",
        topics: ["Shell", "Processes", "Networking"],
        completed: false,
      },
      {
        id: "delivery",
        title: "Delivery pipelines",
        duration: "4–6 weeks",
        topics: ["Git", "CI/CD", "Containers"],
        completed: false,
      },
      {
        id: "operate",
        title: "Operate at scale",
        duration: "3–4 weeks",
        topics: ["Cloud primitives", "Monitoring", "Incident response"],
        completed: false,
      },
    ],
  },
  javascript: {
    slug: "javascript",
    title: "JavaScript Mastery",
    description:
      "Go from syntax to fluency — the one language every web path depends on.",
    level: "Beginner-friendly",
    audience: "Students who know basic HTML/CSS or are starting fresh",
    outcomes: [
      "Write modern ES6+ fluently",
      "Master async code without fear",
      "Debug any script with devtools",
    ],
    phases: [
      {
        id: "core",
        title: "Language core",
        duration: "3–4 weeks",
        topics: [
          "Syntax and types",
          "Functions and scope",
          "Arrays and objects",
        ],
        completed: false,
      },
      {
        id: "async-dom",
        title: "Async and the DOM",
        duration: "3–4 weeks",
        topics: ["Promises and fetch", "DOM manipulation", "Events and forms"],
        completed: false,
      },
      {
        id: "pro",
        title: "Pro habits",
        duration: "2–3 weeks",
        topics: ["Modules and tooling", "Testing basics", "Mini-projects"],
        completed: false,
      },
    ],
  },
  react: {
    slug: "react",
    title: "React Developer",
    description:
      "Think in components and ship single-page apps people enjoy using.",
    level: "Beginner-friendly",
    audience: "Students comfortable with JavaScript fundamentals",
    outcomes: [
      "Build SPAs with hooks and routing",
      "Manage state without prop-drilling",
      "Ship a deployed React app",
    ],
    phases: [
      {
        id: "components",
        title: "Thinking in components",
        duration: "3 weeks",
        topics: [
          "JSX and props",
          "State and events",
          "Lists and conditional UI",
        ],
        completed: false,
      },
      {
        id: "data",
        title: "Data and effects",
        duration: "4 weeks",
        topics: [
          "useEffect done right",
          "Fetching and loading states",
          "Forms and validation",
        ],
        completed: false,
      },
      {
        id: "production",
        title: "Production React",
        duration: "3–4 weeks",
        topics: ["Routing", "Context and state libraries", "Build and deploy"],
        completed: false,
      },
    ],
  },
  python: {
    slug: "python",
    title: "Python Programmer",
    description:
      "The friendliest first language — from scripts to automation to backends.",
    level: "Beginner-friendly",
    audience: "Absolute beginners or anyone picking a first language",
    outcomes: [
      "Write clean scripts and solve problems",
      "Work with files, APIs, and data",
      "Automate one boring task",
    ],
    phases: [
      {
        id: "core",
        title: "Core language",
        duration: "3–4 weeks",
        topics: [
          "Syntax and control flow",
          "Functions",
          "Lists, dicts, and sets",
        ],
        completed: false,
      },
      {
        id: "practical",
        title: "Practical Python",
        duration: "3–4 weeks",
        topics: [
          "Files and error handling",
          "Requests and JSON",
          "Virtualenv and pip",
        ],
        completed: false,
      },
      {
        id: "build",
        title: "Build and show",
        duration: "2–3 weeks",
        topics: ["Mini-projects", "Testing intro", "Portfolio polish"],
        completed: false,
      },
    ],
  },
  dsa: {
    slug: "dsa",
    title: "DSA for Placements",
    description:
      "Patterns, not memorization — walk into coding rounds calm and ready.",
    level: "Intermediate",
    audience:
      "Students who know one language and target placements in 3–6 months",
    outcomes: [
      "Solve easy and medium problems consistently",
      "Recognize patterns instead of memorizing solutions",
      "Clear timed coding rounds calmly",
    ],
    phases: [
      {
        id: "foundations",
        title: "Foundations",
        duration: "3–4 weeks",
        topics: ["Time and space complexity", "Arrays and strings", "Hashing"],
        completed: false,
      },
      {
        id: "patterns",
        title: "Core patterns",
        duration: "5–6 weeks",
        topics: [
          "Two pointers and sliding window",
          "Recursion and trees",
          "Graphs intro",
        ],
        completed: false,
      },
      {
        id: "interview",
        title: "Interview mode",
        duration: "4 weeks",
        topics: ["Timed problem sets", "Mock interviews", "Revision system"],
        completed: false,
      },
    ],
  },
  aiml: {
    slug: "aiml",
    title: "AI/ML Foundations",
    description:
      "From Python and math intuition to training your first models.",
    level: "Intermediate",
    audience: "Students comfortable with Python and basic math",
    outcomes: [
      "Train and evaluate scikit-learn models",
      "Understand neural networks intuitively",
      "Ship a working ML demo",
    ],
    phases: [
      {
        id: "refresh",
        title: "Math and Python refresh",
        duration: "3 weeks",
        topics: [
          "NumPy and pandas",
          "Statistics intuition",
          "Data visualization",
        ],
        completed: false,
      },
      {
        id: "classical",
        title: "Classical ML",
        duration: "4–5 weeks",
        topics: [
          "Regression and classification",
          "Trees and forests",
          "Evaluation and tuning",
        ],
        completed: false,
      },
      {
        id: "deep",
        title: "Deep learning start",
        duration: "4 weeks",
        topics: ["Neural net intuition", "PyTorch basics", "Capstone demo"],
        completed: false,
      },
    ],
  },
  placements: {
    slug: "placements",
    title: "Placement Sprint",
    description:
      "Resume, fundamentals, and interviews — the final-year battle plan.",
    level: "All levels",
    audience: "Pre-final and final-year students preparing for campus season",
    outcomes: [
      "Resume that passes screening",
      "Aptitude and CS fundamentals ready",
      "Confident technical and HR interviews",
    ],
    phases: [
      {
        id: "profile",
        title: "Profile sprint",
        duration: "2–3 weeks",
        topics: [
          "Resume that screens",
          "LinkedIn and GitHub via playbooks",
          "Two portfolio projects",
        ],
        completed: false,
      },
      {
        id: "fundamentals",
        title: "Fundamentals block",
        duration: "4–5 weeks",
        topics: [
          "DSA patterns",
          "DBMS, OS, and CN one-pagers",
          "Daily aptitude",
        ],
        completed: false,
      },
      {
        id: "season",
        title: "Interview season",
        duration: "Ongoing",
        topics: [
          "Mock HR and tech rounds",
          "Company question sheets",
          "Offer and negotiation basics",
        ],
        completed: false,
      },
    ],
  },
} as const;

const resourceData = [
  {
    id: "mdn",
    title: "MDN Web Docs",
    description:
      "The reference desk for HTML, CSS, and JavaScript fundamentals.",
    type: "Reference",
    duration: "Self-paced",
    url: "https://developer.mozilla.org/en-US/docs/Learn",
    accent: "blue",
  },
  {
    id: "javascript-info",
    title: "The Modern JavaScript Tutorial",
    description:
      "A clear path from language basics to asynchronous JavaScript.",
    type: "Course",
    duration: "Self-paced",
    url: "https://javascript.info/",
    accent: "amber",
  },
  {
    id: "roadmap",
    title: "Developer Roadmaps",
    description:
      "Community-built paths for frontend, backend, DevOps, and more.",
    type: "Roadmap",
    duration: "Browse paths",
    url: "https://roadmap.sh/",
    accent: "violet",
  },
  {
    id: "web-dev",
    title: "Web.dev Learn",
    description:
      "Practical guides for building fast, accessible web experiences.",
    type: "Articles",
    duration: "Self-paced",
    url: "https://web.dev/learn",
    accent: "green",
  },
];

const playbookData = [
  {
    slug: "linkedin",
    title: "Get Noticed on LinkedIn",
    platform: "LinkedIn",
    tagline: "From invisible student to hireable junior in 4 weeks",
    description:
      "A beginner-safe posting system: profile fixes, content pillars, plug-and-play templates, and a posting rhythm that fits around classes.",
    audience: "Students with 0–200 connections who have never posted",
    level: "Beginner-friendly",
    sections: [
      {
        id: "permission",
        title: "Start before you feel ready",
        body: "You do not need expertise to post — you need evidence of learning. Recruiters search for juniors who **document**, not juniors who perform. Your first 10 posts are practice reps; expect single-digit likes and post anyway.",
        points: [
          "Document, don't perform: share what you learned this week, not what you mastered",
          "Nobody expects a student to be an expert — they expect curiosity and consistency",
          "One honest post beats ten days of lurking",
          "Imposter syndrome is the entry fee; every poster you admire paid it too",
        ],
      },
      {
        id: "profile",
        title: "Fix your profile in one evening",
        body: "Before your first post, make your profile pass the **5-second recruiter scan**: photo, headline, about, featured. Do it once, then leave it alone for a month.",
        points: [
          "Photo: clear face, plain background — phone photo in daylight is fine",
          "Headline formula: Aspiring [role] | [2 skills] | [proof, e.g. 'Built 3 projects']",
          "About: 3 lines — who you are, what you're learning, what you're looking for",
          "Featured: pin your best project, certificate, or even a good post",
          "Skills: add your top 5 and request 2 endorsements from classmates",
        ],
      },
      {
        id: "pillars",
        title: "What to post: 4 pillars",
        body: "Rotate these so you never stare at a blank box. **70%** of posts should be pillars 1–2.",
        points: [
          "Learn in public: 'Today I finally understood X. Here's the 3-line version…'",
          "Build logs: screenshots + what broke + what fixed it",
          "Mistakes: 'I wasted 2 hours because…' — these outperform wins",
          "Curiosity: ask the network one sharp question per week",
        ],
      },
      {
        id: "plan",
        title: "Your first 4 weeks",
        body: "Two posts a week. That is the whole commitment — roughly one hour weekly.",
        points: [
          "Week 1: finish profile + intro post ('I'm X, learning Y, will post weekly')",
          "Week 2: two learn-in-public posts from whatever you're studying",
          "Week 3: one build-log post with a screenshot + comment on 5 posts daily",
          "Week 4: repeat week 3, then review which post got replies and do more of that",
        ],
      },
      {
        id: "mechanics",
        title: "How to post so people read",
        body: "LinkedIn shows the first **2 lines** before '…see more' — the hook is everything. Write for skimmers, post when India is online.",
        points: [
          "Line 1–2: the result or the pain ('I failed 3 interviews before learning this')",
          "One idea per post, short lines, blank line between every 1–2 sentences",
          "End with one question to invite comments",
          "3–5 hashtags max, mix big (#webdevelopment) and niche (#learninpublic)",
          "Post Tue–Thu, 9–11am IST; reply to every comment in the first hour",
        ],
      },
      {
        id: "templates",
        title: "Copy-paste templates",
        body: "Fill the brackets. Post it. Done.\n\n**Template 1 — Learn in public:**\n```\nI spent [N] hours confused by [concept].\n\nHere's the 3-line version I wish someone gave me:\n\n1. [point]\n2. [point]\n3. [point]\n\nWhat concept confused you the longest?\n```\n\n**Template 2 — Build log:**\n```\nShipped: [project/feature] ✅\n\nWhat broke: [bug]\nWhat fixed it: [insight]\n\nTry it: [link] — feedback welcome 🙏\n```\n\n**Template 3 — Mistake:**\n```\nMistake that cost me [time]: [mistake].\n\nLesson: [one line].\n\nSave this post so you don't pay the same fee. What's a mistake that taught you the most?\n```",
        points: [],
      },
      {
        id: "mistakes",
        title: "Mistakes that kill reach",
        body: "Avoid these and you are already ahead of most beginners.",
        points: [
          "Engagement pods and 'support train' comments — the algorithm discounts them",
          "Posting daily for a week then vanishing for a month",
          "Only reposting certificates with no personal takeaway",
          "Hot takes on topics you can't defend in an interview",
        ],
      },
    ],
  },
  {
    slug: "x-twitter",
    title: "Grow on X (Twitter)",
    platform: "X",
    tagline: "0 followers is fine — replies are the algorithm",
    description:
      "A reply-first growth system for small accounts: how to get seen without an audience, what to post daily, and a 0→200 follower plan.",
    audience: "Students starting from zero followers",
    level: "Beginner-friendly",
    sections: [
      {
        id: "permission",
        title: "Small accounts have an edge",
        body: "On X, **replies get more reach than posts** for beginners. You don't need followers — you need 5 thoughtful replies a day under bigger accounts in your niche. Do that for 30 days and the followers come as a side effect.",
        points: [
          "0 followers is a feature: you can experiment with zero reputation risk",
          "One great reply can outperform a month of original posts",
          "Pick 10 accounts in your niche and turn on notifications",
          "Lurk for a week, then reply daily — never pitch, only add",
        ],
      },
      {
        id: "replies",
        title: "How to write replies that get followed",
        body: "A good reply is a **micro-post**: it must stand alone and make the reader smarter. 'Great post 🔥' earns nothing.",
        points: [
          "Add: an example, a counterpoint, a number, or a question",
          "Format: 1–3 short lines, no threads in replies",
          "Reply within the first hour of the original post",
          "If the author likes or replies back, follow them and say thanks once",
        ],
      },
      {
        id: "pillars",
        title: "What to post daily",
        body: "One short post a day plus replies. Keep a notes file of everything you learn — that file is your content calendar.",
        points: [
          "Build in public: what you shipped, with a screenshot",
          "One thing learned: compress today's study into 3 lines",
          "Progress numbers: 'Day 12 of DSA: solved 2 mediums'",
          "Resource drops: the exact tutorial/video that unblocked you",
          "Weekly: turn your best-performing post into a 5-post thread",
        ],
      },
      {
        id: "plan",
        title: "0 → 200 followers in 4 weeks",
        body: "Boring, repeatable, works.",
        points: [
          "Week 1: optimize bio (who you help + what you're learning + one proof link), reply 5x daily",
          "Week 2: add 1 original post daily + keep replying",
          "Week 3: publish your first thread from a reply that did well; pin it",
          "Week 4: double down on the format with the most profile clicks",
        ],
      },
      {
        id: "mechanics",
        title: "Mechanics that matter",
        body: "X rewards **dwell + interaction**. Write to stop the scroll, post when your audience is awake.",
        points: [
          "First line = hook: result, pain, or bold claim under 10 words",
          "Threads: 4–7 posts, each self-contained, last one has the CTA",
          "Post 8–10pm IST for Indian tech audience; mornings for US overlap",
          "Quote-post with your take instead of plain reposts",
          "Pin your best thread to your profile",
        ],
      },
      {
        id: "mistakes",
        title: "Mistakes beginners make",
        body: "All of these burn trust faster than they build reach.",
        points: [
          "Link-dumping without context — always add your takeaway",
          "Follow/unfollow games — people notice, and it never compounds",
          "Only promoting, never replying or helping",
          "Buying followers or engagement — obvious to recruiters",
        ],
      },
    ],
  },
  {
    slug: "github",
    title: "GitHub That Gets Interviews",
    platform: "GitHub",
    tagline: "Turn coursework into proof of work",
    description:
      "Profile README, pinned repos, and README anatomy that make recruiters click through — sized for students with class projects, not startups.",
    audience: "Students whose repos are mostly assignments and tutorials",
    level: "Beginner-friendly",
    sections: [
      {
        id: "why",
        title: "Why this matters for placements",
        body: "When a recruiter opens your resume, GitHub is the **verify** button. They spend ~60 seconds: profile → pinned repos → one README. This playbook optimizes exactly that path.",
        points: [
          "A polished tutorial project beats an abandoned 'original idea'",
          "Green squares matter less than 2–3 repos someone can actually run",
          "Your profile is read on mobile — keep it scannable",
        ],
      },
      {
        id: "profile",
        title: "Profile README in 20 minutes",
        body: "Create a repo named exactly like your username, add a README. Keep it to one screen.",
        points: [
          "Line 1: who you are + what you're aiming for ('Aspiring backend dev')",
          "Currently learning + currently building (2 bullets, update monthly)",
          "Tech badges or a simple skills line — no giant icon walls",
          "Contact: LinkedIn + email, nothing else",
        ],
      },
      {
        id: "pins",
        title: "Pin 2–3 repos, archive the rest",
        body: "Pin your **most runnable** work. Unpin half-finished forks and empty tutorial clones — they dilute the signal.",
        points: [
          "Best pin: a complete mini-project with a live demo link",
          "Second pin: your best-written code, even if small",
          "Third pin: something collaborative (PRs, hackathon, open source docs)",
          "Write a one-line repo description on every pinned repo",
        ],
      },
      {
        id: "readme",
        title: "README anatomy that converts",
        body: "Recruiters read the README, not the code. Follow this order every time.",
        points: [
          "Title + one-line what/why + demo link or screenshot at the top",
          "Run instructions: clone, install, start — 3 commands max",
          "'What I learned' section: 3 bullets of real lessons",
          "Tech stack line + future improvements (shows judgment)",
        ],
      },
      {
        id: "confidence",
        title: "Your coursework counts",
        body: "You don't need a startup to have proof. A **polished** assignment beats a messy original idea. Polish = README, demo, clean commits.",
        points: [
          "Rename 'assignment-3' to what it actually is ('expense-tracker-api')",
          "Squash 'fix', 'final', 'final2' commits before pinning",
          "Docs contributions (typos, translations, examples) are real open source",
          "Post each polished repo on LinkedIn using the build-log template",
        ],
      },
    ],
  },
];

async function ensureUser(userId: string) {
  await db.insert(usersTable).values({ id: userId }).onConflictDoNothing();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
}

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

type GeminiContent = Array<{
  role: string;
  parts: Array<{ text: string }>;
}>;

type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; status: number; errorText: string };

// Gemini's free tier often answers 429/503 under load. Retry transient
// failures with backoff instead of failing the learner's first attempt.
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

async function callGemini(options: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: GeminiContent;
  maxOutputTokens: number;
}): Promise<GeminiResult> {
  let last: GeminiResult = { ok: false, status: 0, errorText: "no attempt" };
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: options.systemInstruction }] },
            contents: options.contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: options.maxOutputTokens,
            },
          }),
        },
      );
      if (!response.ok) {
        last = {
          ok: false,
          status: response.status,
          errorText: await response.text(),
        };
        if (!TRANSIENT_STATUS.has(response.status)) break;
        continue;
      }
      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        ?.trim();
      if (!text) {
        return { ok: false, status: 502, errorText: "empty answer" };
      }
      return { ok: true, text };
    } catch (error) {
      last = { ok: false, status: 0, errorText: String(error) };
    }
  }
  return last;
}

const AUTO_TITLE = "New conversation";

/** Turn the first user message into a short, readable chat title. */
function makeAutoTitle(content: string): string {
  const firstLine = content.split("\n")[0] ?? "";
  const cleaned = firstLine
    .replace(/[*_~`>#\[\](){}|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return AUTO_TITLE;
  if (cleaned.length <= 60) return cleaned;
  const cut = cleaned.slice(0, 60);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 20 ? cut.slice(0, lastSpace) : cut}…`;
}

/** Guess a roadmap lane from what the learner asked about. */
function inferRoadmapRef(content: string): string | null {
  const text = content.toLowerCase();
  if (
    /(react|vue|angular|frontend|html|css|tailwind|next\.?js|ui\b|responsive)/.test(
      text,
    )
  ) {
    return "frontend";
  }
  if (
    /(node|express|api|rest|sql|postgres|database|auth|jwt|django|flask|spring)/.test(
      text,
    )
  ) {
    return "backend";
  }
  if (
    /(docker|kubernetes|ci\/?cd|jenkins|linux|aws|deploy|nginx|terraform|devops)/.test(
      text,
    )
  ) {
    return "devops";
  }
  return null;
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
    currentGoal:
      user?.currentGoal ??
      "Build a strong foundation in modern web development",
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
      title: parsed.data.title?.trim() || AUTO_TITLE,
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

router.delete("/topics/:topicId", async (req, res): Promise<void> => {
  const params = DeleteTopicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [topic] = await db
    .select({ id: topicsTable.id })
    .from(topicsTable)
    .where(
      and(
        eq(topicsTable.id, params.data.topicId),
        eq(topicsTable.userId, userId),
      ),
    );
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  // Messages fall off via ON DELETE CASCADE on devmentor_messages.topic_id.
  await db.delete(topicsTable).where(eq(topicsTable.id, topic.id));
  res.status(204).end();
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
    .where(
      and(
        eq(topicsTable.id, params.data.topicId),
        eq(topicsTable.userId, userId),
      ),
    );
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
    .where(
      and(
        eq(topicsTable.id, params.data.topicId),
        eq(topicsTable.userId, userId),
      ),
    );
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({
      topicId: topic.id,
      role: "user",
      content: body.data.content.trim(),
    })
    .returning();
  // First message in an untitled chat names it automatically.
  if (topic.title === AUTO_TITLE) {
    await db
      .update(topicsTable)
      .set({
        title: makeAutoTitle(body.data.content),
        roadmapRef: topic.roadmapRef ?? inferRoadmapRef(body.data.content),
      })
      .where(eq(topicsTable.id, topic.id));
  }
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
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

  const gemini = await callGemini({
    apiKey,
    model,
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: history.reverse().map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    maxOutputTokens: 8192,
  });
  if (!gemini.ok) {
    req.log.error(
      { status: gemini.status, errorText: gemini.errorText },
      "Gemini request failed",
    );
    res
      .status(502)
      .json({ error: "The AI mentor could not answer right now." });
    return;
  }
  const reply = gemini.text;
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
});

router.get("/roadmaps", (_req, res): void => {
  res.json(
    ListRoadmapsResponse.parse(
      Object.values(roadmapData).map((roadmap) => ({
        slug: roadmap.slug,
        title: roadmap.title,
        description: roadmap.description,
        level: roadmap.level,
        audience: roadmap.audience,
        phaseCount: roadmap.phases.length,
        allTopics: roadmap.phases.flatMap((phase) => [...phase.topics]),
      })),
    ),
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

// Opt-in AI guidance for a roadmap. The mentor is called ONLY here (and in
// topic chats) — never automatically. Scope to one phase, plus an optional
// follow-up question from the learner.
router.post("/roadmaps/:slug/advice", async (req, res): Promise<void> => {
  const params = RequestRoadmapAdviceParams.safeParse(req.params);
  const body = RequestRoadmapAdviceBody.safeParse(req.body ?? {});
  if (!params.success || !body.success) {
    const error = !params.success
      ? params.error.message
      : body.success
        ? "Invalid request"
        : body.error.message;
    res.status(400).json({ error });
    return;
  }
  const roadmap = roadmapData[params.data.slug as keyof typeof roadmapData];
  if (!roadmap) {
    res.status(404).json({ error: "Roadmap not found" });
    return;
  }
  const phase = body.data.phaseId
    ? roadmap.phases.find((item) => item.id === body.data.phaseId)
    : undefined;
  if (body.data.phaseId && !phase) {
    res.status(400).json({ error: "Unknown phase for this roadmap" });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "The AI mentor is not configured yet." });
    return;
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

  const scope = phase
    ? `Phase "${phase.title}" (${phase.duration}): ${phase.topics.join(", ")}.`
    : `Full path — phases: ${roadmap.phases.map((item) => item.title).join("; ")}.`;
  const question = body.data.question?.trim();
  const prompt = [
    `The learner is viewing the "${roadmap.title}" roadmap. ${scope}`,
    `Roadmap goal: ${roadmap.description}`,
    question
      ? `Their follow-up question: ${question}`
      : "Give focused guidance for this scope.",
    "Coach, don't lecture: what matters most, the common mistakes, one small no-code exercise, and what to do this week. Never output code snippets or code blocks — describe ideas in plain words. Concise Markdown. End with exactly one next step.",
  ].join("\n\n");

  const gemini = await callGemini({
    apiKey,
    model,
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    maxOutputTokens: 2048,
  });
  if (!gemini.ok) {
    req.log.error(
      { status: gemini.status, errorText: gemini.errorText },
      "Gemini roadmap advice failed",
    );
    res
      .status(502)
      .json({ error: "The AI mentor could not answer right now." });
    return;
  }
  res.json(
    RequestRoadmapAdviceResponse.parse({
      advice: gemini.text,
      phaseId: phase?.id ?? null,
    }),
  );
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
        `${resource.title} ${resource.description}`
          .toLowerCase()
          .includes(topic),
      )
    : resourceData;
  res.json(ListResourcesResponse.parse(resources));
});

router.get("/playbooks", (_req, res): void => {
  res.json(ListPlaybooksResponse.parse(playbookData));
});

export default router;
