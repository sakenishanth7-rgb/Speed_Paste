import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Upload, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — QuickCopy Vault" },
      { name: "description", content: "Manage your account, export your snippets to JSON, or import a previous backup." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setBusy(true);
    const [{ data: categories }, { data: snippets }] = await Promise.all([
      supabase.from("categories").select("*"),
      supabase.from("snippets").select("*"),
    ]);
    const blob = new Blob([JSON.stringify({ categories, snippets }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quickcopy-vault-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    toast.success("Exported");
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setBusy(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as { categories?: any[]; snippets?: any[] };
      const catMap: Record<string, string> = {};
      for (const c of json.categories ?? []) {
        const { data, error } = await supabase.from("categories").insert({
          user_id: user.id, name: c.name, icon: c.icon ?? "folder", color: c.color,
        }).select("id").single();
        if (error) throw error;
        catMap[c.id] = data.id;
      }
      for (const s of json.snippets ?? []) {
        const newCatId = catMap[s.category_id];
        if (!newCatId) continue;
        await supabase.from("snippets").insert({
          user_id: user.id, category_id: newCatId, title: s.title, content: s.content,
          pinned: !!s.pinned, favorite: !!s.favorite,
        });
      }
      toast.success("Imported successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your account and snippets.</p>

      <div className="mt-8 space-y-4">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{user?.email}</span></p>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold">Backup & restore</h2>
          <p className="mt-1 text-sm text-muted-foreground">Export your snippets to JSON or import a previous backup.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={exportData}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl gradient-bg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export JSON
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl glass px-4 py-2 text-sm font-semibold hover:bg-muted">
              <Upload className="h-4 w-4" /> Import JSON
              <input type="file" accept="application/json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
