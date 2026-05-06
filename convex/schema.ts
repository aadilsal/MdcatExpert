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
    emailNotificationsEnabled: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

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
});
