import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Zap, LayoutGrid, Settings, LogOut, Loader2, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login" } });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const links = [
    { to: "/dashboard", label: "Vault", icon: LayoutGrid },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/40 p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-bg shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </span>
          QuickCopy
        </Link>
        <nav className="flex-1 space-y-1">
          {links.map((l) => {
            const active = path === l.to || (l.to === "/dashboard" && path.startsWith("/category"));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "gradient-bg text-primary-foreground shadow-glow" : "hover:bg-muted"
                }`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-border/40 pt-3">
          <button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          <p className="px-3 pt-2 text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 glass-strong flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-bg">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </span>
          QuickCopy
        </Link>
        <div className="flex gap-1">
          <button onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="rounded-lg p-2 hover:bg-muted">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/settings" aria-label="Settings" className="rounded-lg p-2 hover:bg-muted"><Settings className="h-4 w-4" /></Link>
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} aria-label="Sign out" className="rounded-lg p-2 hover:bg-muted text-destructive">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 pt-20 pb-10 md:px-10 md:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
