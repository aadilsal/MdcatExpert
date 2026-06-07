import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";
import { normalizeBlogContent } from "@/lib/normalize-blog-content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const post = await fetchQuery(
      api.blogPosts.getById,
      { postId: id as Id<"blogPosts"> },
      { token: auth.token },
    );

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("admin blog GET id:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load blog post.") },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
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

    await fetchMutation(
      api.blogPosts.updatePost,
      {
        postId: id as Id<"blogPosts">,
        ...body,
        ...(body.content !== undefined
          ? { content: normalizeBlogContent(body.content) }
          : {}),
      },
      { token: auth.token },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin blog PATCH:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to update blog post.") },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    await fetchMutation(
      api.blogPosts.deletePost,
      { postId: id as Id<"blogPosts"> },
      { token: auth.token },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin blog DELETE:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to delete blog post.") },
      { status: 500 },
    );
  }
}
