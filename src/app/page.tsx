import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import LandingClient, { type RecentBlogPost } from "./landing-client";
import type { SampleQuestion } from "@/components/landing/mini-quiz";

export default async function HomePage() {
  let recentPosts: RecentBlogPost[] = [];
  let dbQuestions: SampleQuestion[] = [];
  
  try {
    const [posts, questions] = await Promise.all([
      fetchQuery(api.blogPosts.listPublished, { limit: 3 }),
      fetchQuery(api.quizzes.getLandingQuestions, {}),
    ]);
    recentPosts = posts as RecentBlogPost[];
    dbQuestions = questions as SampleQuestion[];
  } catch {
    // Convex may be unavailable during build; landing still renders with fallbacks
  }
  
  return <LandingClient recentPosts={recentPosts} dbQuestions={dbQuestions} />;
}

