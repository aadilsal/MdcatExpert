"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Save,
  Eye,
  AlertCircle,
  FileText,
} from "lucide-react";
import { formatUserError } from "@/lib/format-user-error";

export interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  status: "draft" | "published";
}

const emptyForm: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tags: "",
  metaTitle: "",
  metaDescription: "",
  status: "draft",
};

interface BlogEditorClientProps {
  postId?: string;
  initial?: Partial<BlogFormData>;
}

export default function BlogEditorClient({ postId, initial }: BlogEditorClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<BlogFormData>({
    ...emptyForm,
    ...initial,
    tags: initial?.tags ?? "",
  });
  const [subject, setSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<BlogFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleGenerate = async () => {
    if (!subject.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed.");
      const draft = json.draft;
      update({
        title: draft.title ?? "",
        slug: draft.slug ?? "",
        excerpt: draft.excerpt ?? "",
        content: draft.content ?? "",
        metaTitle: draft.metaTitle ?? "",
        metaDescription: draft.metaDescription ?? "",
        tags: Array.isArray(draft.tags) ? draft.tags.join(", ") : "",
      });
    } catch (e) {
      setError(formatUserError(e, "Failed to generate draft."));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setError("Title, excerpt, and content are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      excerpt: form.excerpt,
      content: form.content,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      status,
    };

    try {
      const url = postId ? `/api/admin/blog/${postId}` : "/api/admin/blog";
      const method = postId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed.");

      if (!postId && json.postId) {
        router.push(`/admin/blog/${json.postId}/edit`);
      } else {
        router.push("/admin/blog");
      }
      router.refresh();
    } catch (e) {
      setError(formatUserError(e, "Failed to save post."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 via-gray-800 to-primary-900 p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-black italic">
          {postId ? "Edit" : "New"} <span className="text-primary-400">Blog Post</span>
        </h1>
        <p className="text-gray-400 font-medium mt-2">
          Write manually or generate a draft with AI from a subject.
        </p>
      </div>

      {!postId && (
        <div className="p-6 rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/50 space-y-4">
          <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-black text-sm uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            AI Draft Generator
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. MDCAT Biology Cell Structure important topics"
              className="theme-input flex-1 px-4 py-3 rounded-xl border border-primary-200 dark:border-primary-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !subject.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-black text-sm rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Draft
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6 bg-surface rounded-2xl border border-surface-border p-6 sm:p-8 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</span>
            <input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => update({ slug: e.target.value })}
              placeholder="auto-from-title"
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tags (comma-separated)</span>
            <input
              value={form.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="biology, mdcat-2026, study-tips"
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Excerpt</span>
            <textarea
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              rows={2}
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40 resize-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">SEO Title</span>
            <input
              value={form.metaTitle}
              onChange={(e) => update({ metaTitle: e.target.value })}
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">SEO Description</span>
            <input
              value={form.metaDescription}
              onChange={(e) => update({ metaDescription: e.target.value })}
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Content (Markdown)
            </span>
            <textarea
              value={form.content}
              onChange={(e) => update({ content: e.target.value })}
              rows={20}
              className="theme-input w-full px-4 py-3 rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-900/40 resize-y min-h-[320px]"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 dark:text-gray-100 font-black text-sm rounded-xl hover:bg-gray-900 hover:text-white disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-black text-sm rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
