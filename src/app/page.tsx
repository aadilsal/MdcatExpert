import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import LandingClient, { type RecentBlogPost } from "./landing-client";
import type { SampleQuestion } from "@/components/landing/mini-quiz";

export default async function HomePage() {
  let recentPosts: RecentBlogPost[] = [];
  let dbQuestions: SampleQuestion[] = [];
  let stats = { totalQuizzes: 0, totalStudents: 0 };

  try {
    const [posts, questions, publicStats] = await Promise.all([
      fetchQuery(api.blogPosts.listPublished, { limit: 3 }),
      fetchQuery(api.quizzes.getLandingQuestions, {}),
      fetchQuery(api.quizzes.getPublicStats, {}),
    ]);
    recentPosts = posts as RecentBlogPost[];
    dbQuestions = questions as SampleQuestion[];
    stats = publicStats;
  } catch {
    // Convex may be unavailable during build; landing still renders with fallbacks
  }

  return <LandingClient recentPosts={recentPosts} dbQuestions={dbQuestions} stats={stats} />;
}

