import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Copy, Shield, Sparkles, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickCopy Vault — Instant snippets for fast bookings" },
      { name: "description", content: "Save name, Aadhaar, phone and address once. Copy them with one tap during fast TTD, IRCTC, and temple ticket bookings." },
      { property: "og:title", content: "QuickCopy Vault — Instant snippets for fast bookings" },
      { property: "og:description", content: "Save name, Aadhaar, phone and address once. Copy them with one tap during fast TTD, IRCTC, and temple ticket bookings." },
      { property: "og:url", content: "https://speedpaste-gems.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://speedpaste-gems.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-bg shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </span>
          QuickCopy Vault
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth" search={{ mode: "login" }} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted">
            Login
          </Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-xl gradient-bg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            Get Started
          </Link>
        </nav>
      </header>

      <main>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Built for the booking rush
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
          Save Time During <span className="gradient-text">Fast Ticket Bookings</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Store and instantly copy important details — name, Aadhaar, address, gotram — with one click. Built for TTD,
          IRCTC, and every other countdown that won&apos;t wait.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }} className="group inline-flex items-center gap-2 rounded-2xl gradient-bg px-7 py-4 text-base font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105">
            Get Started Free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/auth" search={{ mode: "login" }} className="inline-flex items-center gap-2 rounded-2xl glass px-7 py-4 text-base font-semibold hover:bg-muted">
            Login
          </Link>
        </div>

        <h2 className="sr-only">Why QuickCopy Vault</h2>
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Copy, title: "One-click copy", text: "Massive copy buttons sized for thumb-speed during quotas opening." },
            { icon: Clock, title: "Zero typing", text: "Saved blocks for every passenger, every booking, every category." },
            { icon: Shield, title: "Private by default", text: "End-to-end account isolation. Only you see your snippets." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 text-left">
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-bg">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        Built for pilgrims, travellers, and anyone tired of typing the same details again.
      </footer>
    </div>
  );
}
