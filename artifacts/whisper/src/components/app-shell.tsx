import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { LogOut } from "lucide-react";
import { Wordmark } from "./brand";

export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [loc] = useLocation();
  const tab = (href: string, label: string) => (
    <Link
      href={href}
      data-testid={`link-nav-${label.toLowerCase()}`}
      className={`relative px-3 py-1.5 text-sm rounded-full transition-colors ${
        loc === href ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-20 backdrop-blur bg-background/80 border-b">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-5 h-16">
          <Wordmark />
          <nav className="flex items-center gap-1">
            {tab("/", "Inbox")}
            {tab("/settings", "Settings")}
            <button
              onClick={logout}
              data-testid="button-logout"
              className="ml-2 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
