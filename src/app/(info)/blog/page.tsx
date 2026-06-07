import type { Metadata } from "next";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "MDCAT Blog — Study Guides & Preparation Tips",
  description:
    "Expert MDCAT preparation guides, subject tips, and study strategies for Pakistani medical aspirants. Biology, Chemistry, Physics, English, and more.",
  alternates: { canonical: `${getSiteUrl()}/blog` },
};

function formatDate(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await fetchQuery(api.blogPosts.listPublished, {});

  return (
    <div className="space-y-16">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest mb-2">
          <BookOpen className="w-4 h-4" />
          MDCAT Blog
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight">
          Study smarter for <span className="text-primary-600">MDCAT</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
          Guides, tips, and strategies to help you prepare for Pakistan&apos;s medical entrance exam.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-gray-50 border border-gray-100">
          <p className="text-gray-500 font-medium">New articles coming soon. Check back shortly!</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article
              key={post._id}
              className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-600/5 transition-all"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest"
                  >
                    {tag}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-6">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-sm font-black text-primary-600 uppercase tracking-widest hover:gap-3 transition-all"
              >
                Read article
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
