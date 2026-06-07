import { notFound } from "next/navigation";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import BlogEditorClient from "../../blog-editor-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditBlogPage({ params }: Props) {
  const { id } = await params;
  const token = await convexAuthNextjsToken();
  if (!token) {
    return <div className="p-10 text-center text-gray-500">Unauthorized</div>;
  }

  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") {
    return <div className="p-10 text-center text-gray-500">Forbidden</div>;
  }

  const post = await fetchQuery(
    api.blogPosts.getById,
    { postId: id as Id<"blogPosts"> },
    { token },
  );
  if (!post) notFound();

  return (
    <BlogEditorClient
      postId={id}
      initial={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags.join(", "),
        metaTitle: post.metaTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        status: post.status,
      }}
    />
  );
}
