import { type ReactNode, useEffect } from "react";
import { ClerkProvider, SignInButton, useAuth, useUser } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { TopicsPage } from "@/pages/topics";
import { ChatPage } from "@/pages/chat";
import { RoadmapsPage } from "@/pages/roadmaps";
import { RoadmapsIndexPage } from "@/pages/roadmaps-index";
import { PlaybooksPage } from "@/pages/playbooks";
import { ResourcesPage } from "@/pages/resources";
import NotFound from "@/pages/not-found";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { Map, MessagesSquare, Sparkles, Megaphone } from "lucide-react";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  string | undefined;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Pipes the Clerk session token into every API call as a Bearer header. */
function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function Router() {
  return (
    // Keep the shell outside the boundary so nav survives a page crash.
    <AppShell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/topics" component={TopicsPage} />
          <Route path="/topics/:id" component={ChatPage} />
          <Route path="/roadmaps/:slug" component={RoadmapsPage} />
          <Route path="/roadmaps" component={RoadmapsIndexPage} />
          <Route path="/playbooks/:slug" component={PlaybooksPage} />
          <Route path="/playbooks" component={PlaybooksPage} />
          <Route path="/resources" component={ResourcesPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Shell() {
  const { isLoaded, isSignedIn } = useUser();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthTokenBridge />
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {!isLoaded ? (
            <div className="dark flex min-h-dvh items-center justify-center bg-background text-foreground">
              <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              </span>
            </div>
          ) : isSignedIn ? (
            <Router />
          ) : (
            <SignInScreen />
          )}
        </WouterRouter>
        <Toaster richColors position="top-right" theme="dark" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function SignInScreen() {
  return (
    <div className="dark flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <h1 className="font-display mt-5 text-[26px] font-bold leading-tight tracking-tight">
          Learn faster with your AI mentor.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Topic-based mentoring, structured roadmaps, and curated
          resources — in one workspace.
        </p>
        <ul className="mt-6 space-y-2.5 text-left">
          {[
            {
              icon: MessagesSquare,
              text: "Ask anything, get guided step by step",
            },
            { icon: Map, text: "Follow structured roadmaps" },
            { icon: Megaphone, text: "Grow on LinkedIn, X, and GitHub" },
          ].map((row) => (
            <li
              key={row.text}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm"
            >
              <row.icon className="h-4 w-4 shrink-0 text-primary" />
              {row.text}
            </li>
          ))}
        </ul>
        <SignInButton mode="modal">
          <Button className="mt-6 min-h-[44px] w-full" size="lg">
            Sign in to continue
          </Button>
        </SignInButton>
        <p className="mt-3 text-xs text-muted-foreground">
          Secured by Clerk · Free for learners
        </p>
      </div>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8">
        <h1 className="font-display text-xl font-bold tracking-tight">
          Almost there — one key missing
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          MargUp signs users in with Clerk. Add your publishable key and reload:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>
            Grab a key at{" "}
            <span className="font-mono text-[13px]">dashboard.clerk.com</span> →
            API keys
          </li>
          <li>
            Create{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px]">
              .env
            </code>{" "}
            at the repo root from{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px]">
              .env.example
            </code>{" "}
            with:
          </li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-black/60 p-3 font-mono text-[12.5px]">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          All secrets (including the API server keys) live in that one file —
          see{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px]">
            .env.example
          </code>{" "}
          for the full list.
        </p>
      </div>
    </div>
  );
}

function App() {
  if (!CLERK_KEY) return <SetupScreen />;
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <Shell />
    </ClerkProvider>
  );
}

export default App;
