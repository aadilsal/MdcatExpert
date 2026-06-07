"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { formatUserError } from "@/lib/format-user-error";
import type { Id } from "../../../../../convex/_generated/dataModel";

export function DeleteBlogButton({
  postId,
  title,
}: {
  postId: Id<"blogPosts">;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed.");
      router.refresh();
    } catch (e) {
      alert(formatUserError(e, "Failed to delete post."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
      title="Delete"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
