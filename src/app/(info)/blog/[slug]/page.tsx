import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import BlogContent from "@/components/blog-content";
import { getSiteUrl } from "@/lib/site-url";
import { Calendar, ArrowLeft, Tag } from "lucide-react";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

function formatDate(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug });
  if (!post) return { title: "Article Not Found" };

  const siteUrl = getSiteUrl();
  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${siteUrl}/blog/${post.slug}`,
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug });
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    url: `${siteUrl}/blog/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "MdcatXpert",
      url: siteUrl,
    },
    keywords: post.tags.join(", "),
  };

  return (
    <article className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <header className="space-y-6 border-b border-gray-100 dark:border-slate-800 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/35 text-primary-700 dark:text-primary-300 text-[10px] font-black uppercase tracking-widest"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{post.excerpt}</p>
        <time
          dateTime={
            post.publishedAt
              ? new Date(post.publishedAt).toISOString()
              : new Date(post.createdAt).toISOString()
          }
          className="flex items-center gap-2 text-sm text-gray-400 font-bold"
        >
          <Calendar className="w-4 h-4" />
          {formatDate(post.publishedAt ?? post.createdAt)}
        </time>
      </header>

      <BlogContent content={post.content} />

      <footer className="pt-10 border-t border-gray-100 dark:border-slate-800">
        <div className="rounded-3xl bg-primary-600 p-8 sm:p-12 text-white text-center space-y-4">
          <h2 className="text-2xl font-black">Ready to practice?</h2>
          <p className="text-primary-100 font-medium max-w-md mx-auto">
            Apply what you learned with interactive MDCAT quizzes and AI-powered analytics on MdcatXpert.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-black rounded-2xl hover:bg-primary-50 transition-all"
          >
            Start For Free
          </Link>
        </div>
      </footer>
    </article>
  );
}
