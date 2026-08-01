/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as adminAnalytics from "../adminAnalytics.js";
import type * as analytics from "../analytics.js";
import type * as attempts from "../attempts.js";
import type * as auth from "../auth.js";
import type * as authPassword from "../authPassword.js";
import type * as blogData_post1_mdcat_2026_guide from "../blogData/post1_mdcat_2026_guide.js";
import type * as blogData_post2_mdcat_biology from "../blogData/post2_mdcat_biology.js";
import type * as blogData_post3_mdcat_chemistry from "../blogData/post3_mdcat_chemistry.js";
import type * as blogData_post4_mdcat_physics from "../blogData/post4_mdcat_physics.js";
import type * as blogData_post5_mdcat_past_papers from "../blogData/post5_mdcat_past_papers.js";
import type * as blogData_post6_mdcat_merit from "../blogData/post6_mdcat_merit.js";
import type * as blogData_types from "../blogData/types.js";
import type * as blogPosts from "../blogPosts.js";
import type * as copilot from "../copilot.js";
import type * as copilotAccess from "../copilotAccess.js";
import type * as crons from "../crons.js";
import type * as documentChunks from "../documentChunks.js";
import type * as files from "../files.js";
import type * as gatewayPayments from "../gatewayPayments.js";
import type * as http from "../http.js";
import type * as ingestDocument from "../ingestDocument.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_chunker from "../lib/chunker.js";
import type * as lib_ocrClient from "../lib/ocrClient.js";
import type * as lib_passwordValidation from "../lib/passwordValidation.js";
import type * as lib_retrieval from "../lib/retrieval.js";
import type * as lib_userErrors from "../lib/userErrors.js";
import type * as notifications from "../notifications.js";
import type * as ocrPageTexts from "../ocrPageTexts.js";
import type * as passwordChange from "../passwordChange.js";
import type * as payments from "../payments.js";
import type * as questionReports from "../questionReports.js";
import type * as quizAccess from "../quizAccess.js";
import type * as quizzes from "../quizzes.js";
import type * as seed from "../seed.js";
import type * as seedBlog from "../seedBlog.js";
import type * as seedBlogPostsData from "../seedBlogPostsData.js";
import type * as seedLibrary from "../seedLibrary.js";
import type * as staging from "../staging.js";
import type * as studySources from "../studySources.js";
import type * as subscriptionReminders from "../subscriptionReminders.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  adminAnalytics: typeof adminAnalytics;
  analytics: typeof analytics;
  attempts: typeof attempts;
  auth: typeof auth;
  authPassword: typeof authPassword;
  "blogData/post1_mdcat_2026_guide": typeof blogData_post1_mdcat_2026_guide;
  "blogData/post2_mdcat_biology": typeof blogData_post2_mdcat_biology;
  "blogData/post3_mdcat_chemistry": typeof blogData_post3_mdcat_chemistry;
  "blogData/post4_mdcat_physics": typeof blogData_post4_mdcat_physics;
  "blogData/post5_mdcat_past_papers": typeof blogData_post5_mdcat_past_papers;
  "blogData/post6_mdcat_merit": typeof blogData_post6_mdcat_merit;
  "blogData/types": typeof blogData_types;
  blogPosts: typeof blogPosts;
  copilot: typeof copilot;
  copilotAccess: typeof copilotAccess;
  crons: typeof crons;
  documentChunks: typeof documentChunks;
  files: typeof files;
  gatewayPayments: typeof gatewayPayments;
  http: typeof http;
  ingestDocument: typeof ingestDocument;
  leaderboard: typeof leaderboard;
  "lib/auth": typeof lib_auth;
  "lib/chunker": typeof lib_chunker;
  "lib/ocrClient": typeof lib_ocrClient;
  "lib/passwordValidation": typeof lib_passwordValidation;
  "lib/retrieval": typeof lib_retrieval;
  "lib/userErrors": typeof lib_userErrors;
  notifications: typeof notifications;
  ocrPageTexts: typeof ocrPageTexts;
  passwordChange: typeof passwordChange;
  payments: typeof payments;
  questionReports: typeof questionReports;
  quizAccess: typeof quizAccess;
  quizzes: typeof quizzes;
  seed: typeof seed;
  seedBlog: typeof seedBlog;
  seedBlogPostsData: typeof seedBlogPostsData;
  seedLibrary: typeof seedLibrary;
  staging: typeof staging;
  studySources: typeof studySources;
  subscriptionReminders: typeof subscriptionReminders;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
