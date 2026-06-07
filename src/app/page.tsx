import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import LandingClient, { type RecentBlogPost } from "./landing-client";

export default async function HomePage() {
  let recentPosts: RecentBlogPost[] = [];
  try {
    recentPosts = (await fetchQuery(api.blogPosts.listPublished, { limit: 3 })) as RecentBlogPost[];
  } catch {
    // Convex may be unavailable during build; landing still renders
  }
  return <LandingClient recentPosts={recentPosts} />;
}
