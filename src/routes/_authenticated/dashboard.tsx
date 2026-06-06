import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Folder, Landmark, Train, User, Heart, Briefcase, Home, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Vault — QuickCopy" },
      { name: "description", content: "Browse your snippet categories and jump in to copy booking details with one tap." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  position: number;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder, landmark: Landmark, train: Train, user: User, heart: Heart, briefcase: Briefcase, home: Home, star: Star,
};

function iconFor(name: string | null) {
  return ICONS[name ?? "folder"] ?? Folder;
}

function Dashboard() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Category | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return toast.error(error.message);
    setCats(data ?? []);
    const { data: snips } = await supabase.from("snippets").select("category_id");
    const c: Record<string, number> = {};
    (snips ?? []).forEach((s) => { c[s.category_id] = (c[s.category_id] ?? 0) + 1; });
    setCounts(c);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this category and all its snippets?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    load();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Your Vault</h1>
          <p className="mt-1 text-muted-foreground">Pick a category to copy snippets in one tap.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-3 font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      {cats === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass h-36 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : cats.length === 0 ? (
        <EmptyState onCreate={() => setShowNew(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => {
            const Icon = iconFor(c.icon);
            return (
              <div key={c.id} className="group glass relative rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-glow">
                <Link to="/category/$id" params={{ id: c.id }} className="block">
                  <span className="grid h-12 w-12 place-items-center rounded-xl gradient-bg shadow-glow">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold">{c.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {counts[c.id] ?? 0} {counts[c.id] === 1 ? "snippet" : "snippets"}
                  </p>
                </Link>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} className="rounded-lg p-2 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(c.id)} aria-label={`Delete ${c.name}`} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showNew || editing) && user && (
        <CategoryDialog
          userId={user.id}
          category={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass-strong mx-auto mt-10 max-w-md rounded-3xl p-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-bg shadow-glow">
        <Folder className="h-7 w-7 text-primary-foreground" />
      </span>
      <h3 className="mt-4 font-display text-xl font-bold">Your vault is empty</h3>
      <p className="mt-2 text-sm text-muted-foreground">Create your first category — TTD, IRCTC, anything you book often.</p>
      <button onClick={onCreate} className="mt-6 rounded-xl gradient-bg px-5 py-2.5 font-semibold text-primary-foreground shadow-glow">
        Create category
      </button>
    </div>
  );
}

const ICON_OPTIONS = ["folder", "landmark", "train", "user", "heart", "briefcase", "home", "star"];

function CategoryDialog({
  userId, category, onClose, onSaved,
}: {
  userId: string;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "folder");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setBusy(true);
    const payload = { name: name.trim(), icon };
    const { error } = category
      ? await supabase.from("categories").update(payload).eq("id", category.id)
      : await supabase.from("categories").insert({ ...payload, user_id: userId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(category ? "Category updated" : "Category created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold">{category ? "Edit category" : "New category"}</h2>
        <div className="mt-4">
          <label htmlFor="category-name" className="text-xs font-medium text-muted-foreground">Name</label>
          <input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-xl border border-input bg-background/50 px-4 py-3 outline-none ring-ring focus:ring-2"
            placeholder="e.g. TTD, IRCTC, Personal"
          />
        </div>
        <div className="mt-4">
          <span id="category-icon-label" className="text-xs font-medium text-muted-foreground">Icon</span>
          <div className="mt-2 grid grid-cols-8 gap-2" role="radiogroup" aria-labelledby="category-icon-label">
            {ICON_OPTIONS.map((key) => {
              const I = iconFor(key);
              return (
                <button
                  key={key}
                  onClick={() => setIcon(key)}
                  aria-label={`Choose ${key} icon`}
                  aria-pressed={icon === key}
                  className={`grid aspect-square place-items-center rounded-lg border ${icon === key ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:bg-muted"}`}
                >
                  <I className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl gradient-bg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
