import { ConvexError } from "convex/values";

/** Maps technical error codes / raw messages to user-facing copy. */
const ERROR_MESSAGES: Record<string, string> = {
  // Convex Auth / credentials
  InvalidSecret: "Incorrect email or password.",
  InvalidCredentials: "Incorrect email or password.",
  CredentialsSignin: "Incorrect email or password.",
  "Incorrect email or password": "Incorrect email or password.",
  "Incorrect email or password.": "Incorrect email or password.",
  "Invalid credentials": "Incorrect email or password.",
  "Invalid code": "That code is invalid or expired. Try again or request a new code.",
  "Password reset is not enabled for password":
    "Password reset is unavailable. Please contact support.",
  "Could not send password reset email.":
    "Could not send reset email. Please try again later.",
  "Password reset email is not configured.":
    "Password reset is unavailable. Please contact support.",
  "Current password is incorrect.": "Current password is incorrect.",
  "We could not find an email for your account.":
    "We could not find an email for your account.",
  AccountNotFound: "No account found with this email. Try signing up instead.",
  UserAlreadyExists: "An account with this email already exists. Try logging in instead.",
  "User already exists": "An account with this email already exists. Try logging in instead.",

  // Auth validation
  "Email is required.": "Please enter your email address.",
  "Please enter your email address.": "Please enter your email address.",
  "Password must be at least 6 characters.": "Password must be at least 6 characters.",
  "Password must be at least 6 characters": "Password must be at least 6 characters.",

  // Access
  Unauthorized: "Please sign in to continue.",
  "Unauthorized: You must be logged in to submit a quiz.":
    "Please sign in to continue.",
  Forbidden: "You don't have permission to do this.",
  "Forbidden: Admin only": "You don't have permission to do this.",
  "Premium required": "Upgrade to Elite to access this quiz.",
  "Premium required: upgrade to Elite to access this quiz.":
    "Upgrade to Elite to access this quiz.",

  // Promo codes
  "Promo code not found": "This promo code doesn't exist. Check the code and try again.",
  "Promo code is inactive": "This promo code is no longer active.",
  "Promo code has reached maximum uses":
    "This promo code has already been used the maximum number of times.",
  "Promo code already exists": "A promo code with this name already exists.",

  // Quizzes & content
  "Quiz not found.": "This quiz could not be found.",
  "Quiz not found": "This quiz could not be found.",
  "Answer not found": "We couldn't find this answer. Try refreshing the page.",
  "Question data not found": "We couldn't load this question. Try refreshing the page.",
  "Staging question not found": "This draft question could not be found.",
  "No questions to publish. Approve questions or remove rejections.":
    "No questions to publish. Un-reject questions or add more before committing.",
  "Not found": "The requested item could not be found.",

  // Payments
  "Payment request not found": "This payment request could not be found.",

  // Profile
  "Password change is not available yet. Use password reset from login.":
    "Password change isn't available yet. Use the forgot-password option on the login page.",
};

const MESSAGE_KEYS_BY_LENGTH = Object.keys(ERROR_MESSAGES).sort(
  (a, b) => b.length - a.length,
);

const TECHNICAL_PATTERNS = [
  /\[Request ID:/i,
  /Server Error/i,
  /Uncaught\s+ConvexError/i,
  /\bConvexError\b/i,
  /Uncaught Error:/i,
  /at\s+\w+\s+\(/,
  /^\s*at\s+/m,
  /^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/, // PascalCase code with no spaces
];

function stripTechnicalWrappers(message: string): string {
  let current = message.trim();
  let previous = "";

  while (current !== previous) {
    previous = current;
    current = current
      .replace(/\[Request ID: [^\]]+\]\s*/g, "")
      .replace(/Server Error\s*/gi, "")
      .replace(/(?:Uncaught\s+)?ConvexError:\s*/gi, "")
      .replace(/Uncaught Error:\s*/gi, "")
      .replace(/^Error:\s*/gi, "")
      .trim();
  }

  return current;
}

function collectErrorStrings(error: unknown, seen = new Set<unknown>()): string[] {
  if (error == null || seen.has(error)) return [];
  seen.add(error);

  const parts: string[] = [];

  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === "string" && data.trim()) {
      parts.push(data);
    } else if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
    ) {
      parts.push((data as { message: string }).message);
    }
  }

  if (error instanceof Error) {
    if (error.message.trim()) parts.push(error.message);
    if (error.cause) parts.push(...collectErrorStrings(error.cause, seen));
  } else if (typeof error === "string" && error.trim()) {
    parts.push(error);
  }

  return parts;
}

function resolveMessage(cleaned: string): string | undefined {
  if (ERROR_MESSAGES[cleaned]) return ERROR_MESSAGES[cleaned];

  const withoutTrailingPeriod = cleaned.replace(/\.+$/, "").trim();
  if (ERROR_MESSAGES[withoutTrailingPeriod]) {
    return ERROR_MESSAGES[withoutTrailingPeriod];
  }

  const lower = cleaned.toLowerCase();
  for (const key of MESSAGE_KEYS_BY_LENGTH) {
    const keyLower = key.toLowerCase();
    if (lower === keyLower || lower.includes(keyLower)) {
      return ERROR_MESSAGES[key];
    }
  }

  return undefined;
}

function looksTechnical(message: string): boolean {
  return TECHNICAL_PATTERNS.some((p) => p.test(message));
}

/**
 * Turns thrown errors (including Convex / auth wrappers) into copy safe to show users.
 */
export function formatUserError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const candidates = collectErrorStrings(error);
  if (candidates.length === 0) return fallback;

  for (const raw of candidates) {
    const cleaned = stripTechnicalWrappers(raw);
    if (!cleaned) continue;

    const mapped = resolveMessage(cleaned);
    if (mapped) return mapped;

    if (!looksTechnical(cleaned)) return cleaned;
  }

  return fallback;
}
