import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { BLOG_POSTS_SEED } from "./seedBlogPostsData";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Seeds published MDCAT blog posts (skips existing slugs).
 *
 * Run: pnpm convex:seed-blogs
 * Requires at least one admin user in the database.
 */
export const seedBlogPosts = internalMutation({
  args: {
    replaceExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, { replaceExisting }) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    if (!admin) {
      throw new Error(
        "No admin user found. Create an admin account first, then run: pnpm convex:seed-blogs",
      );
    }

    const created: string[] = [];
    const skipped: string[] = [];
    const replaced: string[] = [];
    const now = Date.now();

    for (const post of BLOG_POSTS_SEED) {
      const slug = slugify(post.slug || post.title);
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing) {
        if (replaceExisting) {
          await ctx.db.patch(existing._id, {
            title: post.title.trim(),
            excerpt: post.excerpt.trim(),
            content: post.content,
            tags: post.tags,
            metaTitle: post.metaTitle?.trim(),
            metaDescription: post.metaDescription?.trim(),
            status: "published",
            publishedAt: existing.publishedAt ?? now,
            updatedAt: now,
          });
          replaced.push(slug);
        } else {
          skipped.push(slug);
        }
        continue;
      }

      await ctx.db.insert("blogPosts", {
        title: post.title.trim(),
        slug,
        excerpt: post.excerpt.trim(),
        content: post.content,
        authorId: admin._id,
        status: "published",
        tags: post.tags,
        metaTitle: post.metaTitle?.trim(),
        metaDescription: post.metaDescription?.trim(),
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      created.push(slug);
    }

    return {
      total: BLOG_POSTS_SEED.length,
      created,
      skipped,
      replaced,
    };
  },
});
