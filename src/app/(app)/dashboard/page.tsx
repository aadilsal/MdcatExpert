import { redirect } from "next/navigation";
import Link from "next/link";
import SubscriptionStatusBanner from "@/components/subscription-status-banner";
import { Target, TrendingUp, Award, AlertTriangle, ArrowRight } from "lucide-react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export const dynamic = "force-dynamic";

type Attempt = {
  _id: string;
  score: number;
  timeTaken: number;
  createdAt: number;
  quizId: string;
};

type SubjectPerformance = {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
};

export default async function StudentDashboardPage() {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/login");

  const user = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!user) redirect("/login");

  const attemptsRaw = await fetchQuery(
    api.attempts.getUserAttempts,
    { userId: user._id },
    { token },
  );
  const subjectStatsRaw = await fetchQuery(
    api.attempts.getSubjectPerformance,
    { userId: user._id },
    { token },
  );

  const attempts = (attemptsRaw ?? []) as unknown as Attempt[];
  const subjectStats = (subjectStatsRaw ?? []) as unknown as SubjectPerformance[];

  const totalAttempts = attempts.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts)
      : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;

  const weakest = [...subjectStats].sort((a, b) => a.accuracy - b.accuracy)[0];
  const weakestSubject = weakest?.subject || "—";
  const weakestPct = weakest?.accuracy || 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const subscriptionType = (user.subscriptionType ?? "free") as "free" | "premium";
  const premiumUntilIso =
    typeof user.premiumUntil === "number" ? new Date(user.premiumUntil).toISOString() : null;

  return (
    <div className="animate-fade-in space-y-8">
      <SubscriptionStatusBanner
        subscriptionType={subscriptionType}
        premiumUntil={premiumUntilIso}
        hasPendingPayment={false}
        paymentRequestId={undefined}
      />

      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-700 to-blue-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {user.name || "Student"}!
            </h1>
            <p className="mt-2 text-primary-100 max-w-lg">
              {totalAttempts > 0
                ? `You've completed ${totalAttempts} quiz${totalAttempts !== 1 ? "zes" : ""} so far. Keep it up!`
                : "Start practicing to see your performance stats here."}
            </p>
          </div>
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/25 transition-all border border-white/20"
          >
            Browse Quizzes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Attempts",
            value: totalAttempts.toString(),
            subtitle: "quizzes taken",
            icon: Target,
            bgLight: "bg-blue-50",
            textColor: "text-blue-700",
          },
          {
            label: "Average Score",
            value: totalAttempts > 0 ? `${avgScore}%` : "—",
            subtitle: "overall accuracy",
            icon: TrendingUp,
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-700",
          },
          {
            label: "Best Score",
            value: totalAttempts > 0 ? `${bestScore}%` : "—",
            subtitle: "highest accuracy",
            icon: Award,
            bgLight: "bg-purple-50",
            textColor: "text-purple-700",
          },
          {
            label: "Weakest Subject",
            value: weakestSubject,
            subtitle: totalAttempts > 0 ? `${Math.round(weakestPct)}% accuracy` : "needs data",
            icon: AlertTriangle,
            bgLight: "bg-amber-50",
            textColor: "text-amber-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div
                className={`w-10 h-10 rounded-xl ${stat.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {attempts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Attempts</h2>
          <div className="space-y-3">
            {attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Quiz {attempt.quizId.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary-600">{attempt.score}%</p>
                    <p className="text-xs text-gray-500">{formatTime(attempt.timeTaken)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
