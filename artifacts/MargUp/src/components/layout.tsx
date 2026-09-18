import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { UserButton, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  LibraryBig,
  Map,
  Megaphone,
  MessagesSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/api";

const NAV = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "roadmaps", label: "Roadmaps", href: "/roadmaps", icon: Map },
  { id: "playbooks", label: "Playbooks", href: "/playbooks", icon: Megaphone },
  { id: "mentor", label: "Mentor", href: "/topics", icon: MessagesSquare },
  { id: "resources", label: "Resources", href: "/resources", icon: LibraryBig },
];

function activeTab(path: string): string {
  if (path === "/") return "dashboard";
  if (path.startsWith("/topics")) return "mentor";
  if (path.startsWith("/roadmaps")) return "roadmaps";
  if (path.startsWith("/playbooks")) return "playbooks";
  if (path.startsWith("/resources")) return "resources";
  return "dashboard";
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const active = activeTab(location);
  const { user } = useUser();
  const { data } = useDashboard();
  const displayName = user?.firstName ?? data?.firstName ?? "Learner";
  const displayEmail =
    user?.primaryEmailAddress?.emailAddress ?? "Signed in";

  return (
    <div className="dark min-h-dvh bg-background text-foreground lg:flex">
      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-5 pb-5 pt-6"
          aria-label="MargUp home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight">
            MargUp
          </span>
          <span className="ml-auto rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            MVP
          </span>
        </Link>

        <nav className="flex flex-col gap-0.5 px-3" aria-label="Primary">
          <p className="micro px-2 pb-1.5 pt-1">Workspace</p>
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <Link key={item.id} href={item.href} aria-label={item.label}>
                <span
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navIndicator"
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-[17px] w-[17px]",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  {item.label}
                  {item.id === "mentor" && (
                    <Plus className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 ring-1 ring-border",
                },
              }}
            />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {displayEmail}
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" aria-label="MargUp home">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </Link>
          <nav className="flex flex-1 items-center gap-1" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.id} href={item.href} aria-label={item.label}>
                <span
                  className={cn(
                    "flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium",
                    active === item.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-1 ring-border",
              },
            }}
          />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
