import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";
import { isActivePremiumUser } from "./quizAccess";

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function weekStartKey(ts: number): string {
  const d = new Date(ts);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return dayKey(d.getTime());
}

function buildDayBuckets(periodDays: number, now: number): string[] {
  const keys: string[] = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    keys.push(dayKey(now - i * MS_DAY));
  }
  return keys;
}

function countByDay(items: { ts: number }[], periodDays: number, now: number) {
  const keys = buildDayBuckets(periodDays, now);
  const map = new Map(keys.map((k) => [k, 0]));
  const cutoff = now - periodDays * MS_DAY;
  for (const item of items) {
    if (item.ts < cutoff) continue;
    const k = dayKey(item.ts);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return keys.map((date) => ({ date, count: map.get(date) ?? 0 }));
}

function distinctUsersInRange(
  userIds: Iterable<Id<"users"> | undefined>,
  _start: number,
  _end: number,
): number {
  const set = new Set<string>();
  for (const id of userIds) {
    if (id) set.add(String(id));
  }
  return set.size;
}

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function isStudent(u: Doc<"users">): boolean {
  return (u.role ?? "student") === "student";
}

export const getAdminDashboard = query({
  args: {
    periodDays: v.optional(v.number()),
  },
  handler: async (ctx, { periodDays: rawPeriod }) => {
    await requireAdmin(ctx);

    const periodDays = Math.min(Math.max(rawPeriod ?? 30, 7), 90);
    const now = Date.now();
    const ms7 = 7 * MS_DAY;
    const ms30 = 30 * MS_DAY;
    const ms14 = 14 * MS_DAY;
    const ms48h = 48 * 60 * 60 * 1000;
    const periodStart = now - periodDays * MS_DAY;

    const [allUsers, allAttempts, allPayments, allQuizzes, allEvents, allPromos, allUserAnswers] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("attempts").collect(),
        ctx.db.query("paymentRequests").collect(),
        ctx.db.query("quizzes").collect(),
        ctx.db.query("analyticsEvents").collect(),
        ctx.db.query("promoCodes").collect(),
        ctx.db.query("userAnswers").collect(),
      ]);

    const students = allUsers.filter(isStudent);
    const totalStudents = students.length;

    const newSignups7d = students.filter((u) => (u.createdAt ?? 0) > now - ms7).length;
    const newSignups30d = students.filter((u) => (u.createdAt ?? 0) > now - ms30).length;
    const signupsLast30 = newSignups30d;
    const signupsPrior30 = students.filter((u) => {
      const t = u.createdAt ?? 0;
      return t <= now - ms30 && t > now - 2 * ms30;
    }).length;
    let signupGrowth30dPct: number | null = null;
    if (signupsPrior30 > 0) {
      signupGrowth30dPct = Math.round(((signupsLast30 - signupsPrior30) / signupsPrior30) * 1000) / 10;
    }

    const activePremium = students.filter((u) => isActivePremiumUser(u)).length;
    const premiumPenetration = pct(activePremium, totalStudents);
    const freeStudents = totalStudents - activePremium;

    const studentIds = new Set(students.map((s) => s._id));

    const mauByLogin = distinctUsersInRange(
      students
        .filter((u) => (u.lastLoginAt ?? 0) >= now - ms30)
        .map((u) => u._id),
      now - ms30,
      now,
    );

    const attemptUserIds30d = new Set<string>();
    for (const a of allAttempts) {
      if (a.completedAt >= now - ms30 && studentIds.has(a.userId)) {
        attemptUserIds30d.add(String(a.userId));
      }
    }
    const mauByAttempts = attemptUserIds30d.size;

    const dauCounts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = now - (i + 1) * MS_DAY;
      const dayEnd = now - i * MS_DAY;
      const dau = new Set<string>();
      for (const a of allAttempts) {
        if (a.completedAt >= dayStart && a.completedAt < dayEnd && studentIds.has(a.userId)) {
          dau.add(String(a.userId));
        }
      }
      dauCounts.push(dau.size);
    }
    const dau7dAvg = dauCounts.length > 0 ? Math.round(dauCounts.reduce((s, n) => s + n, 0) / dauCounts.length) : 0;

    const studentAttempts = allAttempts.filter((a) => studentIds.has(a.userId));
    const totalAttempts = studentAttempts.length;
    const attempts30d = studentAttempts.filter((a) => a.completedAt >= now - ms30).length;
    const attemptsPerMau = mauByAttempts > 0 ? Math.round((attempts30d / mauByAttempts) * 10) / 10 : 0;

    const approvedPayments = allPayments.filter((p) => p.status === "approved");
    const revenue30d = approvedPayments
      .filter((p) => (p.processedAt ?? p.createdAt) >= now - ms30)
      .reduce((s, p) => s + p.amount, 0);
    const revenueAllTime = approvedPayments.reduce((s, p) => s + p.amount, 0);
    const pendingPayments = allPayments.filter((p) => p.status === "pending").length;

    const approvalTimes = approvedPayments
      .filter((p) => p.processedAt != null)
      .map((p) => (p.processedAt! - p.createdAt) / (60 * 60 * 1000));
    const avgApprovalHours =
      approvalTimes.length > 0
        ? Math.round((approvalTimes.reduce((s, h) => s + h, 0) / approvalTimes.length) * 10) / 10
        : 0;

    const firstAttemptByUser = new Map<string, number>();
    for (const a of studentAttempts) {
      const key = String(a.userId);
      const prev = firstAttemptByUser.get(key);
      if (prev === undefined || a.createdAt < prev) {
        firstAttemptByUser.set(key, a.createdAt);
      }
    }

    const signupCohort7d = students.filter((u) => (u.createdAt ?? 0) > now - ms30);
    let activated7d = 0;
    for (const u of signupCohort7d) {
      const first = firstAttemptByUser.get(String(u._id));
      if (first != null && first - (u.createdAt ?? 0) <= ms7) activated7d++;
    }
    const activationRate7d = pct(activated7d, signupCohort7d.length);

    const conversionCohort = students.filter((u) => {
      const t = u.createdAt ?? 0;
      return t >= now - 2 * ms30 && t < now - ms30;
    });
    let convertedIn30d = 0;
    for (const u of conversionCohort) {
      const signup = u.createdAt ?? 0;
      const becamePremium =
        u.subscriptionType === "premium" &&
        (u.premiumUntil == null || u.premiumUntil > signup) &&
        (u.promoCode != null ||
          approvedPayments.some(
            (p) => p.userId === u._id && (p.processedAt ?? p.createdAt) <= signup + ms30,
          ));
      if (becamePremium) convertedIn30d++;
    }
    const conversionRate30d = pct(convertedIn30d, conversionCohort.length);

    const activePrior30 = new Set<string>();
    const activeLast30 = new Set<string>();
    for (const u of students) {
      const uid = String(u._id);
      const login = u.lastLoginAt ?? 0;
      if (login >= now - 2 * ms30 && login < now - ms30) activePrior30.add(uid);
      if (login >= now - ms30) activeLast30.add(uid);
    }
    for (const a of studentAttempts) {
      const uid = String(a.userId);
      if (a.completedAt >= now - 2 * ms30 && a.completedAt < now - ms30) activePrior30.add(uid);
      if (a.completedAt >= now - ms30) activeLast30.add(uid);
    }
    let activityChurn30d = 0;
    for (const uid of activePrior30) {
      if (!activeLast30.has(uid)) activityChurn30d++;
    }
    const activityChurnRate30d = pct(activityChurn30d, activePrior30.size);

    const monthStart = new Date(now);
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartTs = monthStart.getTime();
    let premiumAtMonthStart = 0;
    let premiumChurned = 0;
    for (const u of students) {
      const wasPremium =
        u.subscriptionType === "premium" &&
        (u.premiumUntil == null || u.premiumUntil > monthStartTs);
      if (wasPremium) {
        premiumAtMonthStart++;
        if (!isActivePremiumUser(u)) premiumChurned++;
      }
    }
    const premiumChurnRate30d = pct(premiumChurned, premiumAtMonthStart);

    const signupsByDay = countByDay(
      students.map((u) => ({ ts: u.createdAt ?? 0 })).filter((x) => x.ts > 0),
      periodDays,
      now,
    );
    const attemptsByDay = countByDay(
      studentAttempts.map((a) => ({ ts: a.completedAt })),
      periodDays,
      now,
    );
    const revenueByDay = (() => {
      const keys = buildDayBuckets(periodDays, now);
      const map = new Map(keys.map((k) => [k, 0]));
      for (const p of approvedPayments) {
        const ts = p.processedAt ?? p.createdAt;
        if (ts < periodStart) continue;
        const k = dayKey(ts);
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + p.amount);
      }
      return keys.map((date) => ({ date, amount: map.get(date) ?? 0 }));
    })();

    const activeUsersByDay = (() => {
      const keys = buildDayBuckets(periodDays, now);
      return keys.map((date) => {
        const dayStart = new Date(`${date}T00:00:00.000Z`).getTime();
        const dayEnd = dayStart + MS_DAY;
        const users = new Set<string>();
        for (const a of studentAttempts) {
          if (a.completedAt >= dayStart && a.completedAt < dayEnd) {
            users.add(String(a.userId));
          }
        }
        return { date, count: users.size };
      });
    })();

    const periodEvents = allEvents.filter((e) => e.createdAt >= periodStart);

    const distinctEventUsers = (name: string) => {
      const set = new Set<string>();
      for (const e of periodEvents) {
        if (e.eventName === name && e.userId) set.add(String(e.userId));
      }
      return set.size;
    };

    const studentsWithAttempt = new Set(studentAttempts.map((a) => String(a.userId))).size;
    const funnel = {
      registered: totalStudents,
      firstAttempt: studentsWithAttempt,
      upgradeView: distinctEventUsers("upgrade_page_view"),
      paymentSubmitted: distinctEventUsers("payment_submitted"),
      paymentApproved: new Set(
        approvedPayments.filter((p) => (p.processedAt ?? p.createdAt) >= periodStart).map((p) => String(p.userId)),
      ).size,
      stillPremium30d: activePremium,
    };

    const quizById = new Map(allQuizzes.map((q) => [String(q._id), q]));
    const attemptsBySubjectMap = new Map<string, number>();
    const attemptsByYearMap = new Map<number, number>();
    const attemptsByQuizMap = new Map<string, number>();

    for (const a of studentAttempts) {
      const quiz = quizById.get(String(a.quizId));
      if (!quiz) continue;
      attemptsBySubjectMap.set(quiz.subject, (attemptsBySubjectMap.get(quiz.subject) ?? 0) + 1);
      attemptsByYearMap.set(quiz.year, (attemptsByYearMap.get(quiz.year) ?? 0) + 1);
      const qid = String(a.quizId);
      attemptsByQuizMap.set(qid, (attemptsByQuizMap.get(qid) ?? 0) + 1);
    }

    const attemptsBySubject = [...attemptsBySubjectMap.entries()]
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    const attemptsByYear = [...attemptsByYearMap.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);

    const topQuizzes = [...attemptsByQuizMap.entries()]
      .map(([quizId, count]) => {
        const q = quizById.get(quizId);
        return {
          quizId,
          title: q?.title ?? "Unknown",
          year: q?.year ?? 0,
          subject: q?.subject ?? "General",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const quizzesWithZeroAttempts = allQuizzes
      .filter((q) => !attemptsByQuizMap.has(String(q._id)))
      .map((q) => ({ quizId: String(q._id), title: q.title, year: q.year, subject: q.subject }))
      .slice(0, 20);

    const processedPayments = allPayments.filter((p) => p.status !== "pending");
    const approvedCount = processedPayments.filter((p) => p.status === "approved").length;
    const rejectedCount = processedPayments.filter((p) => p.status === "rejected").length;
    const approvalRate = pct(approvedCount, processedPayments.length);
    const rejectionRate = pct(rejectedCount, processedPayments.length);
    const pendingOlderThan48h = allPayments.filter(
      (p) => p.status === "pending" && now - p.createdAt > ms48h,
    ).length;

    const promos = allPromos.map((p) => ({
      code: p.code,
      usedCount: p.usedCount,
      maxUses: p.maxUses,
      utilizationPct: pct(p.usedCount, p.maxUses),
      isActive: p.isActive,
    }));

    const retentionCohorts: {
      week: string;
      signups: number;
      week0: number;
      week1: number;
      week2: number;
      week3: number;
    }[] = [];

    for (let w = 7; w >= 0; w--) {
      const weekEnd = now - w * MS_WEEK;
      const weekStart = weekEnd - MS_WEEK;
      const cohort = students.filter((u) => {
        const t = u.createdAt ?? 0;
        return t >= weekStart && t < weekEnd;
      });
      if (cohort.length === 0 && w > 0) continue;

      const cohortAttemptWeeks = (userId: Id<"users">, weekOffset: number) => {
        const start = weekStart + weekOffset * MS_WEEK;
        const end = start + MS_WEEK;
        return studentAttempts.some(
          (a) => a.userId === userId && a.completedAt >= start && a.completedAt < end,
        );
      };

      let w0 = 0,
        w1 = 0,
        w2 = 0,
        w3 = 0;
      for (const u of cohort) {
        if (cohortAttemptWeeks(u._id, 0)) w0++;
        if (cohortAttemptWeeks(u._id, 1)) w1++;
        if (cohortAttemptWeeks(u._id, 2)) w2++;
        if (cohortAttemptWeeks(u._id, 3)) w3++;
      }

      retentionCohorts.push({
        week: weekStartKey(weekStart),
        signups: cohort.length,
        week0: pct(w0, cohort.length),
        week1: pct(w1, cohort.length),
        week2: pct(w2, cohort.length),
        week3: pct(w3, cohort.length),
      });
    }

    const answerStats = new Map<string, { correct: number; total: number }>();
    for (const ua of allUserAnswers) {
      const key = String(ua.questionId);
      const prev = answerStats.get(key) ?? { correct: 0, total: 0 };
      prev.total++;
      if (ua.isCorrect) prev.correct++;
      answerStats.set(key, prev);
    }

    const hardestCandidates = [...answerStats.entries()]
      .filter(([, s]) => s.total >= 20)
      .map(([questionId, s]) => ({
        questionId,
        correctPct: pct(s.correct, s.total),
        totalAnswers: s.total,
      }))
      .sort((a, b) => a.correctPct - b.correctPct)
      .slice(0, 10);

    const questionIds = hardestCandidates.map((h) => h.questionId as Id<"questions">);
    const questions = await Promise.all(questionIds.map((id) => ctx.db.get(id)));
    const hardestQuestions = hardestCandidates.map((h, i) => {
      const q = questions[i];
      return {
        questionId: h.questionId,
        questionText: q?.questionText?.slice(0, 120) ?? "—",
        subject: q?.subject ?? "General",
        correctPct: h.correctPct,
        totalAnswers: h.totalAnswers,
      };
    });

    const expiringPremium7d = students.filter(
      (u) =>
        u.premiumUntil != null &&
        u.premiumUntil > now &&
        u.premiumUntil <= now + ms7,
    ).length;

    const inactiveStudents14d = students.filter((u) => {
      const uid = String(u._id);
      const lastLogin = u.lastLoginAt ?? 0;
      const lastAttempt = firstAttemptByUser.get(uid);
      const lastActive = Math.max(lastLogin, lastAttempt ?? 0);
      if (lastActive === 0) return (u.createdAt ?? 0) < now - ms14;
      return lastActive < now - ms14;
    }).length;

    return {
      periodDays,
      overview: {
        totalStudents,
        newSignups7d,
        newSignups30d,
        signupGrowth30dPct,
        activePremium,
        premiumPenetration,
        freeStudents,
        mauByLogin,
        mauByAttempts,
        dau7dAvg,
        totalAttempts,
        attempts30d,
        attemptsPerMau,
        revenue30d,
        revenueAllTime,
        pendingPayments,
        avgApprovalHours,
        activationRate7d,
        conversionRate30d,
        activityChurn30d,
        activityChurnRate30d,
        premiumChurn30d: premiumChurned,
        premiumChurnRate30d,
      },
      timeSeries: {
        signupsByDay,
        attemptsByDay,
        revenueByDay,
        activeUsersByDay,
      },
      funnel,
      engagement: {
        attemptsBySubject,
        attemptsByYear,
        topQuizzes,
        quizzesWithZeroAttempts,
      },
      payments: {
        approvalRate,
        rejectionRate,
        pendingOlderThan48h,
      },
      promos,
      retentionCohorts,
      content: {
        hardestQuestions,
      },
      alerts: {
        expiringPremium7d,
        pendingPaymentsStale: pendingOlderThan48h,
        inactiveStudents14d,
      },
    };
  },
});
