"use client";

import { useState } from "react";
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

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(category, comment.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment("");
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
              Report Q{questionNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <p className="text-emerald-600 font-bold">Thanks! We&apos;ll review this question.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <p className="text-sm text-gray-500">
              Tell us what&apos;s wrong. Your report includes this quiz and your account email automatically.
            </p>

            <fieldset className="space-y-2">
              <legend className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Issue type
              </legend>
              {CATEGORIES.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    category === c.value
                      ? "border-rose-300 bg-rose-50 text-rose-900"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    checked={category === c.value}
                    onChange={() => setCategory(c.value)}
                    className="text-rose-500"
                  />
                  <span className="text-sm font-medium">{c.label}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Details (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Describe the issue..."
                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
