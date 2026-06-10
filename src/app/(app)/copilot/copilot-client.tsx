"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  BookOpen,
  Upload,
  MessageSquare,
  Library,
  FileText,
  Trash2,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  COPILOT_MODE_LABELS,
  FREE_COPILOT_DAILY_MESSAGE_LIMIT,
  FREE_COPILOT_UPLOAD_LIMIT,
  getCopilotLimits,
  isCopilotModeLocked,
  type CopilotMode,
} from "@/lib/copilot-access";
import { formatUserError } from "@/lib/format-user-error";
import { LoadingButton } from "@/components/loading-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";

type StudySource = Doc<"studySources">;
type Session = Doc<"copilotSessions">;

const MODES: CopilotMode[] = ["explain", "exam", "quiz", "flashcards", "revise"];

function statusLabel(status: StudySource["status"]) {
  if (status === "ready") return "Ready";
  if (status === "processing") return "Processing…";
  return "Failed";
}

export default function CopilotClient({
  user,
  myUploads,
  library,
  sessions,
  usage,
}: {
  user: Doc<"users"> | null;
  myUploads: StudySource[];
  library: StudySource[];
  sessions: Session[];
  usage: {
    isPremium: boolean;
    uploadCount: number;
    messageCount: number;
    maxUploads: number | null;
    maxMessagesPerDay: number | null;
    allowedModes: CopilotMode[];
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"notes" | "library" | "chats">("notes");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<CopilotMode>("explain");
  const [deletingId, setDeletingId] = useState<Id<"studySources"> | null>(null);

  const limits = getCopilotLimits(user);
  const uploadAtLimit =
    !limits.isPremium && usage.uploadCount >= FREE_COPILOT_UPLOAD_LIMIT;
  const messageAtLimit =
    !limits.isPremium && usage.messageCount >= FREE_COPILOT_DAILY_MESSAGE_LIMIT;

  const toggleSource = (id: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpload = async () => {
    if (uploadAtLimit) {
      router.push("/upgrade?reason=copilot");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      if (pasteText.trim()) {
        const res = await fetch("/api/copilot/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || "Pasted notes",
            subject,
            rawText: pasteText,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      } else if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("title", title || file.name);
        form.append("subject", subject);
        const res = await fetch("/api/copilot/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      } else {
        throw new Error("Choose a file or paste text");
      }
      trackEvent(ANALYTICS_EVENTS.COPILOT_UPLOAD_COMPLETED);
      router.refresh();
      setFile(null);
      setPasteText("");
      setTitle("");
    } catch (e) {
      setError(formatUserError(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const startChat = () => {
    const readyIds = [...selectedSources].filter((id) => {
      const src = [...myUploads, ...library].find((s) => s._id === id);
      return src?.status === "ready";
    });
    if (readyIds.length === 0) {
      setError("Select at least one ready source");
      return;
    }
    if (isCopilotModeLocked(mode, user)) {
      router.push("/upgrade?reason=copilot");
      return;
    }
    if (messageAtLimit) {
      router.push("/upgrade?reason=copilot");
      return;
    }
    const params = new URLSearchParams({
      sources: readyIds.join(","),
      mode,
    });
    trackEvent(ANALYTICS_EVENTS.COPILOT_SESSION_STARTED);
    router.push(`/copilot/chat/new?${params.toString()}`);
  };

  const handleDelete = async (id: Id<"studySources">) => {
    if (!confirm("Delete this upload?")) return;
    if (deletingId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/copilot/source/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError(formatUserError(e, "Delete failed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Elite Study Copilot
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white italic tracking-tight">
            Study <span className="text-primary-500">Copilot.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">
            Chat with your notes and our MDCAT library — cited answers only.
          </p>
        </div>
        {!limits.isPremium && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm">
            <p className="font-bold text-amber-900">
              {usage.uploadCount}/{FREE_COPILOT_UPLOAD_LIMIT} uploads ·{" "}
              {usage.messageCount}/{FREE_COPILOT_DAILY_MESSAGE_LIMIT} messages today
            </p>
            <Link href="/upgrade?reason=copilot" className="text-amber-700 text-xs font-bold underline">
              Upgrade for unlimited
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["notes", "library", "chats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                tab === t
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
              }`}
          >
            {t === "notes" && <FileText className="w-3.5 h-3.5" />}
            {t === "library" && <Library className="w-3.5 h-3.5" />}
            {t === "chats" && <MessageSquare className="w-3.5 h-3.5" />}
            {t === "notes" ? "My Notes" : t === "library" ? "Library" : "Recent Chats"}
          </button>
        ))}
      </div>

      {tab === "notes" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-4xl border border-surface-border dark:border-slate-800 p-8 shadow-sm space-y-4">
            <h2 className="font-black text-gray-900 dark:text-white italic">Upload your notes</h2>
            {uploadAtLimit ? (
              <div className="p-4 bg-amber-50 rounded-2xl flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-bold text-amber-800">
                  Upload limit reached.{" "}
                  <Link href="/upgrade?reason=copilot" className="underline">
                    Upgrade to Elite
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-primary-50 dark:file:bg-primary-950/40 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/35 cursor-pointer"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/35"
                  />
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/35"
                  >
                    {["Biology", "Chemistry", "Physics", "English", "General"].map((s) => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Or paste text notes here…"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/35"
                />
                <LoadingButton
                  onClick={handleUpload}
                  loading={uploading}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </LoadingButton>
              </>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myUploads.map((s) => (
              <SourceCard
                key={s._id}
                source={s}
                selected={selectedSources.has(s._id)}
                onToggle={() => toggleSource(s._id)}
                onDelete={() => handleDelete(s._id)}
                isDeleting={deletingId === s._id}
                deleteDisabled={deletingId !== null}
                onChat={() => {
                  setSelectedSources(new Set([s._id]));
                  setTab("library");
                }}
              />
            ))}
            {myUploads.length === 0 && (
              <p className="col-span-full text-gray-400 font-medium py-8 text-center">
                No uploads yet. Add your academy notes to get started.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "library" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {library.map((s) => (
            <SourceCard
              key={s._id}
              source={s}
              selected={selectedSources.has(s._id)}
              onToggle={() => toggleSource(s._id)}
            />
          ))}
          {library.length === 0 && (
            <p className="col-span-full text-gray-400 font-medium py-8 text-center">
              Library is empty. Admins can add textbooks from Study Library.
            </p>
          )}
        </div>
      )}

      {tab === "chats" && (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Link
              key={s._id}
              href={`/copilot/chat/${s._id}`}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-surface-border dark:border-slate-800/80 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{s.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {COPILOT_MODE_LABELS[s.mode as CopilotMode]} ·{" "}
                  {new Date(s.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
          {sessions.length === 0 && (
            <p className="text-gray-400 font-medium py-8 text-center">No chats yet.</p>
          )}
        </div>
      )}

      <div className="sticky bottom-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-gray-200 dark:border-slate-800 rounded-3xl p-4 shadow-xl flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const locked = isCopilotModeLocked(m, user);
            return (
              <button
                key={m}
                onClick={() => (locked ? router.push("/upgrade?reason=copilot") : setMode(m))}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${
                  mode === m && !locked
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                {locked && <Lock className="w-3 h-3" />}
                {COPILOT_MODE_LABELS[m]}
              </button>
            );
          })}
        </div>
        <button
          onClick={startChat}
          disabled={messageAtLimit}
          className="ml-auto inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Start chat ({selectedSources.size} sources)
        </button>
      </div>
    </div>
  );
}

function SourceCard({
  source,
  selected,
  onToggle,
  onDelete,
  onChat,
  isDeleting = false,
  deleteDisabled = false,
}: {
  source: StudySource;
  selected: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onChat?: () => void;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
        selected
          ? "border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-950/20"
          : "border-surface-border dark:border-slate-800/80 bg-white dark:bg-slate-900"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-sm">{source.title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-505 mt-1">
            {source.subject ?? "General"} · {statusLabel(source.status)}
          </p>
        </div>
        <input type="checkbox" checked={selected} readOnly className="mt-1" />
      </div>
      {source.status === "ready" && onChat && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
          className="mt-3 text-xs font-black text-primary-600 uppercase tracking-widest"
        >
          Chat with this
        </button>
      )}
      {onDelete && (
        <LoadingButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          loading={isDeleting}
          disabled={deleteDisabled}
          loadingChildren=""
          className="mt-2 p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </LoadingButton>
      )}
    </div>
  );
}
