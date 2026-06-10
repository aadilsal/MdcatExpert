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
import type * as blogPosts from "../blogPosts.js";
import type * as copilot from "../copilot.js";
import type * as copilotAccess from "../copilotAccess.js";
import type * as documentChunks from "../documentChunks.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as ingestDocument from "../ingestDocument.js";
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
import type * as seedLibrary from "../seedLibrary.js";
import type * as staging from "../staging.js";
import type * as studySources from "../studySources.js";
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
  blogPosts: typeof blogPosts;
  copilot: typeof copilot;
  copilotAccess: typeof copilotAccess;
  documentChunks: typeof documentChunks;
  files: typeof files;
  http: typeof http;
  ingestDocument: typeof ingestDocument;
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
  seedLibrary: typeof seedLibrary;
  staging: typeof staging;
  studySources: typeof studySources;
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
