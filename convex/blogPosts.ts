import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function assertUniqueSlug(
  ctx: { db: import("./_generated/server").QueryCtx["db"] },
  slug: string,
  excludeId?: Id<"blogPosts">,
) {
  const existing = await ctx.db
    .query("blogPosts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
  if (existing && existing._id !== excludeId) {
    throw new Error("A post with this slug already exists.");
  }
}

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    return posts
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
      .slice(0, limit ?? 50)
      .map(({ content: _content, ...rest }) => rest);
  },
});

export const listAllForAdmin = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const posts = await ctx.db.query("blogPosts").collect();
    return posts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!post || post.status !== "published") return null;
    return post;
  },
});

export const getById = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, { postId }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(postId);
  },
});

export const listPublishedSlugs = query({
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return posts.map((p) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
    }));
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    excerpt: v.string(),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const now = Date.now();
    const slug = slugify(args.slug?.trim() || args.title);
    if (!slug) throw new Error("Invalid slug.");
    await assertUniqueSlug(ctx, slug);

    const status = args.status ?? "draft";
    return await ctx.db.insert("blogPosts", {
      title: args.title.trim(),
      slug,
      excerpt: args.excerpt.trim(),
      content: args.content,
      coverImageUrl: args.coverImageUrl,
      authorId: userId,
      status,
      tags: args.tags ?? [],
      metaTitle: args.metaTitle?.trim(),
      metaDescription: args.metaDescription?.trim(),
      publishedAt: status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, { postId, ...updates }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(postId);
    if (!existing) throw new Error("Post not found.");

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (updates.title !== undefined) patch.title = updates.title.trim();
    if (updates.excerpt !== undefined) patch.excerpt = updates.excerpt.trim();
    if (updates.content !== undefined) patch.content = updates.content;
    if (updates.coverImageUrl !== undefined) patch.coverImageUrl = updates.coverImageUrl;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.metaTitle !== undefined) patch.metaTitle = updates.metaTitle?.trim();
    if (updates.metaDescription !== undefined) {
      patch.metaDescription = updates.metaDescription?.trim();
    }

    if (updates.slug !== undefined) {
      const slug = slugify(updates.slug);
      if (!slug) throw new Error("Invalid slug.");
      await assertUniqueSlug(ctx, slug, postId);
      patch.slug = slug;
    }

    if (updates.status !== undefined) {
      patch.status = updates.status;
      if (updates.status === "published" && !existing.publishedAt) {
        patch.publishedAt = now;
      }
    }

    await ctx.db.patch(postId, patch);
    return postId;
  },
});

export const deletePost = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, { postId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(postId);
  },
});
