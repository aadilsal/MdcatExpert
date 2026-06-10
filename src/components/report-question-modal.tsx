"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Flag } from "lucide-react";
import type { ReportCategory } from "@/app/(app)/quiz/report-actions";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "wrong_answer", label: "Wrong answer" },
  { value: "ambiguous", label: "Ambiguous wording" },
  { value: "typo", label: "Typo or grammar" },
  { value: "image_issue", label: "Image problem" },
  { value: "other", label: "Other" },
];

export default function ReportQuestionModal({
  open,
  onClose,
  onSubmit,
  questionNumber,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (category: ReportCategory, comment: string) => Promise<void>;
  questionNumber: number;
}) {
  const [category, setCategory] = useState<ReportCategory>("ambiguous");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setSubmitting(false);
        setError(null);
        setSuccess(false);
      }, 0);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || success) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(category, comment.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment("");
        setSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden={submitting}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-surface-border dark:border-slate-800 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
              Report Q{questionNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:text-gray-300 dark:hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold">Thanks! We&apos;ll review this question.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`p-6 space-y-5 bg-white dark:bg-slate-900 ${submitting ? "pointer-events-none opacity-70" : ""}`}
            aria-busy={submitting}
          >
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Tell us what&apos;s wrong. Your report includes this quiz and your account email automatically.
            </p>

            <fieldset className="space-y-2" disabled={submitting}>
              <legend className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                Issue type
              </legend>
              {CATEGORIES.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors ${
                    submitting ? "cursor-not-allowed" : "cursor-pointer"
                  } ${
                    category === c.value
                      ? "border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300"
                      : "border-surface-border dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-700 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    checked={category === c.value}
                    onChange={() => setCategory(c.value)}
                    disabled={submitting}
                    className="text-rose-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium">{c.label}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Details (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Describe the issue..."
                disabled={submitting}
                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:bg-gray-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  "Submit report"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
