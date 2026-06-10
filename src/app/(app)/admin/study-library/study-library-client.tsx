"use client";

import { useState } from "react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";
import { LoadingButton } from "@/components/loading-button";
import {
  BookOpen,
  Upload,
  RefreshCw,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

type StudySource = Doc<"studySources">;

const SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "General"] as const;

function StatusBadge({ status }: { status: StudySource["status"] }) {
  if (status === "ready")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
        <CheckCircle className="w-3.5 h-3.5" /> Ready
      </span>
    );
  if (status === "processing")
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold">
        <Clock className="w-3.5 h-3.5" /> Processing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
      <AlertCircle className="w-3.5 h-3.5" /> Failed
    </span>
  );
}

export default function StudyLibraryClient({
  initialSources,
}: {
  initialSources: StudySource[];
}) {
  const [sources, setSources] = useState(initialSources);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<string>("Biology");
  const [classLevel, setClassLevel] = useState("");
  const [chapter, setChapter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [summarySubject, setSummarySubject] = useState("Biology");
  const [summaryChapter, setSummaryChapter] = useState("");
  const [summaryTopic, setSummaryTopic] = useState("");
  const [summaryDraft, setSummaryDraft] = useState("");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upload" | "summary">("upload");
  const [reindexingId, setReindexingId] = useState<Id<"studySources"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"studySources"> | null>(null);

  const handleUpload = async () => {
    if (!file && !summaryDraft) return;
    setUploading(true);
    setError(null);
    try {
      if (tab === "summary" && summaryDraft) {
        const res = await fetch("/api/admin/study-library/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: summaryTitle || `${summarySubject} — ${summaryChapter}`,
            subject: summarySubject,
            classLevel: "",
            chapter: summaryChapter,
            rawText: summaryDraft,
            sourceKind: "ai_summary",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      } else if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("title", title || file.name);
        form.append("subject", subject);
        if (classLevel) form.append("classLevel", classLevel);
        if (chapter) form.append("chapter", chapter);
        form.append("sourceKind", "admin_upload");
        const res = await fetch("/api/admin/study-library/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      }
      window.location.reload();
    } catch (e) {
      setError(formatUserError(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/study-library/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: summarySubject,
          chapter: summaryChapter,
          topic: summaryTopic,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSummaryDraft(json.content);
      setSummaryTitle(`${summarySubject} — ${summaryChapter || summaryTopic}`);
    } catch (e) {
      setError(formatUserError(e, "Generation failed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: Id<"studySources">) => {
    if (!confirm("Delete this source and all chunks?")) return;
    if (deletingId || reindexingId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/copilot/source/${id}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      setError(formatUserError(e, "Delete failed"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleReindex = async (id: Id<"studySources">) => {
    if (reindexingId || deletingId) return;
    setReindexingId(id);
    try {
      await fetch(`/api/copilot/source/${id}`, { method: "POST" });
      window.location.reload();
    } catch (e) {
      setError(formatUserError(e, "Re-index failed"));
      setReindexingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          Study Library
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 italic tracking-tight">
          MDCAT <span className="text-primary-500">Library.</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">
          Upload textbooks, notes, and AI summaries for the Study Copilot RAG pipeline.
        </p>
      </div>

      <div className="flex gap-2">
        {(["upload", "summary"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
              tab === t ? "bg-gray-900 dark:bg-primary-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            {t === "upload" ? "Upload PDF" : "AI Summary"}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-4xl border border-surface-border p-8 shadow-sm space-y-6">
        {tab === "upload" ? (
          <>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                placeholder="Class (e.g. 12)"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              />
              <input
                placeholder="Chapter"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={summarySubject}
                onChange={(e) => setSummarySubject(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                placeholder="Chapter"
                value={summaryChapter}
                onChange={(e) => setSummaryChapter(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              />
              <input
                placeholder="Topic"
                value={summaryTopic}
                onChange={(e) => setSummaryTopic(e.target.value)}
                className="theme-input px-4 py-3 rounded-xl text-sm font-medium"
              />
            </div>
            <LoadingButton
              onClick={handleGenerateSummary}
              loading={generating}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Generate draft
            </LoadingButton>
            {summaryDraft && (
              <textarea
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                rows={12}
                className="theme-input w-full px-4 py-3 rounded-xl text-sm font-mono"
              />
            )}
            <input
              placeholder="Published title"
              value={summaryTitle}
              onChange={(e) => setSummaryTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium"
            />
          </>
        )}

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <LoadingButton
          onClick={handleUpload}
          loading={uploading}
          disabled={tab === "upload" ? !file : !summaryDraft}
          className="inline-flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Publish to library
        </LoadingButton>
      </div>

      <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Kind</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Chunks</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s._id} className="border-t border-gray-50 dark:border-slate-800 dark:border-slate-800">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{s.title}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.subject ?? "—"}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.sourceKind}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={s.status} />
                  {s.errorMessage && (
                    <p className="text-xs text-red-500 mt-1 max-w-xs truncate">{s.errorMessage}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{s.chunkCount ?? "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <LoadingButton
                      onClick={() => handleReindex(s._id)}
                      loading={reindexingId === s._id}
                      disabled={Boolean(reindexingId || deletingId)}
                      loadingChildren=""
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 dark:text-gray-400 disabled:opacity-50"
                      title="Re-index"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => handleDelete(s._id)}
                      loading={deletingId === s._id}
                      disabled={Boolean(reindexingId || deletingId)}
                      loadingChildren=""
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </LoadingButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sources.length === 0 && (
          <p className="px-6 py-12 text-center text-gray-400 font-medium">No sources yet.</p>
        )}
      </div>
    </div>
  );
}
