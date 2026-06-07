import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";
import { normalizeBlogContent } from "@/lib/normalize-blog-content";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const posts = await fetchQuery(api.blogPosts.listAllForAdmin, {}, { token: auth.token });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("admin blog GET:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load blog posts.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      coverImageUrl?: string;
      tags?: string[];
      metaTitle?: string;
      metaDescription?: string;
      status?: "draft" | "published";
    };

    if (!body.title?.trim() || !body.excerpt?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { error: "Title, excerpt, and content are required." },
        { status: 400 },
      );
    }

    const postId = await fetchMutation(
      api.blogPosts.createPost,
      {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: normalizeBlogContent(body.content),
        coverImageUrl: body.coverImageUrl,
        tags: body.tags,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        status: body.status,
      },
      { token: auth.token },
    );

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error("admin blog POST:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to create blog post.") },
      { status: 500 },
    );
  }
}
