import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Convex Auth uses the `users` table. We extend it with app-specific fields.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    role: v.optional(v.union(v.literal("student"), v.literal("admin"))),
    subscriptionType: v.optional(v.union(v.literal("free"), v.literal("premium"))),
    premiumUntil: v.optional(v.number()),
    // Which one-time pass is currently active (both plans grant the same
    // entitlements today — see convex/quizAccess.ts isActivePremiumUser —
    // this is for display/reminder-copy/reporting only, not gating).
    activePlanId: v.optional(v.union(v.literal("elite_annual"), v.literal("monthly_pass"))),
    emailNotificationsEnabled: v.optional(v.boolean()),
    promoCode: v.optional(v.string()),
    promoSource: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    otpCode: v.optional(v.string()),
    otpExpiry: v.optional(v.number()),
    lastClaimedTopperWeek: v.optional(v.string()),

    // Forced first-time feature tour. Undefined/false = show the tour.
    // Existing users are backfilled to true so only new signups see it —
    // see convex/onboarding.ts backfillExistingUsers.
    onboardingCompleted: v.optional(v.boolean()),

    // Subscription renewal reminders (no auto-renewal — one-time Safepay
    // payments only). Both fields store the `premiumUntil` value the email
    // was sent for, so a renewal (new premiumUntil) naturally re-arms both
    // reminders for the next cycle without any extra reset logic.
    renewalRemindersEnabled: v.optional(v.boolean()),
    premiumReminderSentForExpiry: v.optional(v.number()),
    premiumExpiredNoticeSentForExpiry: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_subscriptionType", ["subscriptionType"]),

  quizzes: defineTable({
    title: v.string(),
    year: v.number(),
    subject: v.union(
      v.literal("Biology"),
      v.literal("Chemistry"),
      v.literal("Physics"),
      v.literal("English"),
      v.literal("General")
    ),
    totalQuestions: v.number(),
    isPremium: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_year", ["year"]),

  questions: defineTable({
    quizId: v.id("quizzes"),
    questionText: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    correctOption: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    subject: v.union(
      v.literal("Biology"),
      v.literal("Chemistry"),
      v.literal("Physics"),
      v.literal("English"),
      v.literal("General")
    ),
    explanation: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_quizId", ["quizId"])
    .index("by_subject", ["subject"]),

  quizQuestions: defineTable({
    quizId: v.id("quizzes"),
    questionId: v.id("questions"),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_quizId", ["quizId"])
    .index("by_questionId", ["questionId"]),

  attempts: defineTable({
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    score: v.number(),
    correctAnswers: v.number(),
    wrongAnswers: v.number(),
    timeTaken: v.number(),
    completedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_quizId", ["quizId"]),

  userAnswers: defineTable({
    attemptId: v.id("attempts"),
    questionId: v.id("questions"),
    selectedOption: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    isCorrect: v.boolean(),
    aiAnalysis: v.optional(
      v.object({
        reasoning: v.string(),
        misconception: v.string(),
        recommendation: v.string(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_attemptId", ["attemptId"])
    .index("by_questionId", ["questionId"]),

  stagingQuestions: defineTable({
    batchId: v.string(),
    questionText: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    correctOption: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    subject: v.union(
      v.literal("Biology"),
      v.literal("Chemistry"),
      v.literal("Physics"),
      v.literal("English"),
      v.literal("General")
    ),
    explanation: v.optional(v.string()),
    year: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_batchId", ["batchId"])
    .index("by_status", ["status"]),

  paymentRequests: defineTable({
    userId: v.id("users"),
    userEmail: v.string(),
    transactionId: v.string(),
    screenshotUrl: v.string(),
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    verifiedBy: v.optional(v.id("users")),
    reviewReason: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    archiveTitle: v.optional(v.string()),
    archiveYear: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // Automated Safepay checkout sessions. One row per attempted payment.
  // Replaces the manual screenshot-review flow (paymentRequests, above,
  // is kept for the legacy/fallback bank-transfer option and historical
  // records) with instant, gateway-confirmed activation.
  gatewayOrders: defineTable({
    userId: v.id("users"),
    // "payfast" is reserved for when the merchant-review process confirms
    // a hosted-checkout integration mode — see docs/PAYFAST_INTEGRATION_PLAN.md.
    // Not live yet; src/app/api/checkout/create/route.ts only creates "safepay" orders today.
    provider: v.union(v.literal("safepay"), v.literal("payfast")),
    trackerToken: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    premiumDays: v.number(),
    // Optional so existing rows (created before plans existed) stay valid.
    planId: v.optional(v.union(v.literal("elite_annual"), v.literal("monthly_pass"))),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_trackerToken", ["trackerToken"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  files: defineTable({
    storageId: v.id("_storage"),
    userId: v.id("users"),
    fileType: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
    url: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_fileType", ["fileType"]),

  promoCodes: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    maxUses: v.number(),
    usedCount: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  questionReports: defineTable({
    userId: v.id("users"),
    userEmail: v.string(),
    quizId: v.id("quizzes"),
    quizTitle: v.string(),
    questionId: v.id("questions"),
    questionOrder: v.number(),
    category: v.union(
      v.literal("wrong_answer"),
      v.literal("ambiguous"),
      v.literal("typo"),
      v.literal("image_issue"),
      v.literal("other"),
    ),
    comment: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("resolved"),
      v.literal("dismissed"),
    ),
    adminNote: v.optional(v.string()),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_quizId", ["quizId"])
    .index("by_questionId", ["questionId"])
    .index("by_userId_questionId", ["userId", "questionId"]),

  analyticsEvents: defineTable({
    eventName: v.string(),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    properties: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
  })
    .index("by_eventName", ["eventName"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId", ["userId"]),

  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    authorId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.array(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  studySources: defineTable({
    ownerType: v.union(v.literal("platform"), v.literal("user")),
    userId: v.optional(v.id("users")),
    storageId: v.optional(v.id("_storage")),
    rawText: v.optional(v.string()),
    title: v.string(),
    subject: v.optional(
      v.union(
        v.literal("Biology"),
        v.literal("Chemistry"),
        v.literal("Physics"),
        v.literal("English"),
        v.literal("General"),
      ),
    ),
    classLevel: v.optional(v.string()),
    chapter: v.optional(v.string()),
    topic: v.optional(v.string()),
    sourceKind: v.union(
      v.literal("pctb_textbook"),
      v.literal("openstax_textbook"),
      v.literal("admin_upload"),
      v.literal("student_upload"),
      v.literal("ai_summary"),
    ),
    status: v.union(v.literal("processing"), v.literal("ready"), v.literal("failed")),
    chunkCount: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    isPremiumOnly: v.boolean(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerType", ["ownerType"])
    .index("by_userId", ["userId"])
    .index("by_subject", ["subject"])
    .index("by_status", ["status"])
    .index("by_sourceKind", ["sourceKind"]),

  ocrPageTexts: defineTable({
    sourceId: v.id("studySources"),
    pageNumber: v.number(),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_sourceId", ["sourceId"])
    .index("by_sourceId_pageNumber", ["sourceId", "pageNumber"]),

  documentChunks: defineTable({
    sourceId: v.id("studySources"),
    chunkIndex: v.number(),
    text: v.string(),
    tokenCount: v.number(),
    pageNumber: v.optional(v.number()),
    sectionTitle: v.optional(v.string()),
    subject: v.optional(v.string()),
    ownerType: v.union(v.literal("platform"), v.literal("user")),
    createdAt: v.number(),
  })
    .index("by_sourceId", ["sourceId"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["sourceId"],
    }),

  copilotSessions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    sourceIds: v.array(v.id("studySources")),
    mode: v.union(
      v.literal("explain"),
      v.literal("exam"),
      v.literal("quiz"),
      v.literal("flashcards"),
      v.literal("revise"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  copilotMessages: defineTable({
    sessionId: v.id("copilotSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(
      v.array(
        v.object({
          chunkId: v.id("documentChunks"),
          excerpt: v.string(),
          pageNumber: v.optional(v.number()),
          sourceTitle: v.string(),
          sourceKind: v.string(),
        }),
      ),
    ),
    createdAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"]),

  copilotDailyUsage: defineTable({
    userId: v.id("users"),
    dateKey: v.string(),
    messageCount: v.number(),
  })
    .index("by_userId_dateKey", ["userId", "dateKey"]),
});
