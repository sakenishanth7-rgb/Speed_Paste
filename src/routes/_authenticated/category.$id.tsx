import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Pencil, Trash2, Pin, Star, Plus, Search, Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/category/$id")({
  head: () => ({
    meta: [
      { title: "Snippets — QuickCopy Vault" },
      { name: "description", content: "Open a category to copy your saved booking snippets in one tap." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CategoryPage,
});

type Snippet = {
  id: string;
  category_id: string;
  title: string;
  content: string;
  pinned: boolean;
  favorite: boolean;
  position: number;
  last_copied_at: string | null;
};

function CategoryPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState("");
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Snippet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: cat, error: catErr }, { data: snips, error: snErr }] = await Promise.all([
      supabase.from("categories").select("name").eq("id", id).maybeSingle(),
      supabase.from("snippets").select("*").eq("category_id", id)
        .order("pinned", { ascending: false })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (catErr) toast.error(catErr.message);
    if (snErr) toast.error(snErr.message);
    if (!cat) { navigate({ to: "/dashboard" }); return; }
    setCategoryName(cat.name);
    setSnippets(snips ?? []);
  };

  useEffect(() => { load(); }, [id]);

  const filtered = useMemo(() => {
    if (!snippets) return null;
    const q = query.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
  }, [snippets, query]);

  const copy = async (s: Snippet) => {
    try {
      await navigator.clipboard.writeText(s.content);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 1200);
      toast.success("Copied!", { description: s.title || "Snippet copied to clipboard" });
      supabase.from("snippets").update({ last_copied_at: new Date().toISOString() }).eq("id", s.id).then();
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  const addBlank = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("snippets")
      .insert({ user_id: user.id, category_id: id, title: "New snippet", content: "", position: (snippets?.length ?? 0) })
      .select("*").single();
    if (error) return toast.error(error.message);
    setSnippets((s) => [...(s ?? []), data]);
    setEditing(data);
  };

  const togglePin = async (s: Snippet) => {
    setSnippets((arr) => arr?.map((x) => x.id === s.id ? { ...x, pinned: !s.pinned } : x) ?? null);
    await supabase.from("snippets").update({ pinned: !s.pinned }).eq("id", s.id);
    load();
  };
  const toggleFav = async (s: Snippet) => {
    setSnippets((arr) => arr?.map((x) => x.id === s.id ? { ...x, favorite: !s.favorite } : x) ?? null);
    await supabase.from("snippets").update({ favorite: !s.favorite }).eq("id", s.id);
  };
  const remove = async (s: Snippet) => {
    if (!confirm("Delete this snippet?")) return;
    setSnippets((arr) => arr?.filter((x) => x.id !== s.id) ?? null);
    const { error } = await supabase.from("snippets").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else toast.success("Snippet deleted");
  };
  const duplicate = async (s: Snippet) => {
    if (!user) return;
    const { data, error } = await supabase.from("snippets").insert({
      user_id: user.id, category_id: id, title: `${s.title} (copy)`, content: s.content,
    }).select("*").single();
    if (error) return toast.error(error.message);
    setSnippets((arr) => [...(arr ?? []), data]);
    toast.success("Duplicated");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to vault
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{categoryName || "…"}</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="snippet-search" className="sr-only">Search snippets</label>
          <input
            id="snippet-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search snippets"
            placeholder="Search snippets…"
            className="w-full rounded-xl border border-input bg-background/50 py-2.5 pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
      </div>

      {filtered === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="glass h-44 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-strong mx-auto max-w-md rounded-3xl p-10 text-center">
          <h3 className="font-display text-xl font-bold">No snippets yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Tap the + button to add your first snippet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((s) => (
            <SnippetCard
              key={s.id}
              snippet={s}
              copied={copiedId === s.id}
              onCopy={() => copy(s)}
              onEdit={() => setEditing(s)}
              onDelete={() => remove(s)}
              onPin={() => togglePin(s)}
              onFav={() => toggleFav(s)}
              onDuplicate={() => duplicate(s)}
            />
          ))}
        </div>
      )}

      <button
        onClick={addBlank}
        aria-label="Add snippet"
        className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full gradient-bg shadow-glow transition hover:scale-110"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>

      {editing && (
        <EditDialog
          snippet={editing}
          onClose={() => setEditing(null)}
          onAutosave={(updated) => {
            setSnippets((arr) => arr?.map((x) => x.id === updated.id ? updated : x) ?? null);
          }}
          onSaved={(updated) => {
            setSnippets((arr) => arr?.map((x) => x.id === updated.id ? updated : x) ?? null);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SnippetCard({
  snippet, copied, onCopy, onEdit, onDelete, onPin, onFav, onDuplicate,
}: {
  snippet: Snippet; copied: boolean;
  onCopy: () => void; onEdit: () => void; onDelete: () => void;
  onPin: () => void; onFav: () => void; onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass flex flex-col rounded-2xl p-3 transition hover:shadow-glow">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left font-display text-base font-semibold leading-tight"
        >
          {snippet.pinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" aria-hidden="true" />}
          {snippet.favorite && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />}
          <span className="truncate">{snippet.title || "Untitled"}</span>
        </button>
        <button
          onClick={onCopy}
          disabled={!snippet.content}
          aria-label={`Copy ${snippet.title || "snippet"}`}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
            copied ? "bg-emerald-500 text-white" : "gradient-bg text-primary-foreground shadow-glow hover:scale-105"
          }`}
        >
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      {expanded && (
        <>
          <div className="mt-2 flex flex-wrap gap-0.5">
            <button onClick={onFav} aria-label={snippet.favorite ? "Remove favorite" : "Mark as favorite"} aria-pressed={snippet.favorite} className="rounded-md p-1.5 hover:bg-muted" title="Favorite">
              <Star className={`h-3.5 w-3.5 ${snippet.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <button onClick={onPin} aria-label={snippet.pinned ? "Unpin snippet" : "Pin snippet"} aria-pressed={snippet.pinned} className="rounded-md p-1.5 hover:bg-muted" title="Pin">
              <Pin className={`h-3.5 w-3.5 ${snippet.pinned ? "fill-primary text-primary" : ""}`} />
            </button>
            <button onClick={onDuplicate} aria-label="Duplicate snippet" className="rounded-md p-1.5 hover:bg-muted" title="Duplicate">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={onEdit} aria-label="Edit snippet" className="rounded-md p-1.5 hover:bg-muted" title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} aria-label="Delete snippet" className="rounded-md p-1.5 text-destructive hover:bg-destructive/10" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/40 p-2.5 font-sans text-xs text-muted-foreground">
            {snippet.content || <span className="italic opacity-60">Empty — click edit to add content</span>}
          </pre>
        </>
      )}
    </div>
  );
}

function EditDialog({
  snippet, onClose, onAutosave, onSaved,
}: { snippet: Snippet; onClose: () => void; onAutosave: (s: Snippet) => void; onSaved: (s: Snippet) => void }) {
  const [title, setTitle] = useState(snippet.title);
  const [content, setContent] = useState(snippet.content);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);

  // Autosave — updates the list silently without closing the dialog
  useEffect(() => {
    if (title === snippet.title && content === snippet.content) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const { data, error } = await supabase.from("snippets").update({ title, content }).eq("id", snippet.id).select("*").single();
      if (!error && data) { setAutoSaved(true); setTimeout(() => setAutoSaved(false), 1200); onAutosave(data); }
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [title, content]);

  const saveNow = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("snippets").update({ title, content }).eq("id", snippet.id).select("*").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    onSaved(data);
    toast.success("Saved");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong w-full max-w-2xl rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Edit snippet</h2>
          {autoSaved && <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><Check className="h-3 w-3" /> Saved</span>}
        </div>
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 font-display text-lg font-semibold outline-none ring-ring focus:ring-2"
            placeholder="Title (e.g. Aadhaar)"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full resize-y rounded-xl border border-input bg-background/50 px-4 py-3 font-mono text-sm outline-none ring-ring focus:ring-2"
            placeholder="Paste the content to copy…"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted">Close</button>
          <button onClick={saveNow} disabled={busy} className="inline-flex items-center gap-2 rounded-xl gradient-bg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
