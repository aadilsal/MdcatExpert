import Link from "next/link";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Plus, Pencil, ExternalLink, FileText } from "lucide-react";
import { DeleteBlogButton } from "./delete-blog-button";

export const dynamic = "force-dynamic";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminBlogPage() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return <div className="p-10 text-center text-gray-500">Unauthorized</div>;
  }

  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") {
    return <div className="p-10 text-center text-gray-500">Forbidden</div>;
  }

  const posts = await fetchQuery(api.blogPosts.listAllForAdmin, {}, { token });

  return (
    <div className="animate-fade-in space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 via-gray-800 to-primary-900 p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic">
            Blog <span className="text-primary-400">CMS</span>
          </h1>
          <p className="text-gray-400 font-medium mt-2">
            Create SEO articles for MDCAT preparation — write manually or generate with AI.
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-black text-sm rounded-xl hover:bg-primary-500 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-gray-50 border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-6">No blog posts yet.</p>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-black text-sm rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Updated</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">/blog/{post.slug}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        post.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium hidden md:table-cell">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === "published" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all"
                          title="View live"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${post._id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteBlogButton postId={post._id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
