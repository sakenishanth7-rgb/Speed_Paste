import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).catch("login") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or sign up — QuickCopy Vault" },
      { name: "description", content: "Log in to your QuickCopy Vault or create a free account to save snippets and copy booking details instantly." },
      { property: "og:title", content: "Sign in or sign up — QuickCopy Vault" },
      { property: "og:description", content: "Log in to your QuickCopy Vault or create a free account to save snippets and copy booking details instantly." },
      { property: "og:url", content: "https://speedpaste-gems.lovable.app/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://speedpaste-gems.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Welcome aboard! Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-bg shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </span>
          QuickCopy Vault
        </Link>

        <div className="glass-strong rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold">
            {mode === "signup" ? "Create your vault" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Save snippets once, copy them forever." : "Sign in to your snippets."}
          </p>

          <main>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background/50 px-4 py-3 outline-none ring-ring focus:ring-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background/50 px-4 py-3 outline-none ring-ring focus:ring-2"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-bg px-4 py-3 font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          </main>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <Link
              to="/auth"
              search={{ mode: mode === "signup" ? "login" : "signup" }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
