import { ConvexError } from "convex/values";

/** Maps technical error codes / raw messages to user-facing copy. */
const ERROR_MESSAGES: Record<string, string> = {
  // Convex Auth / credentials
  InvalidSecret: "Incorrect email or password.",
  InvalidCredentials: "Incorrect email or password.",
  CredentialsSignin: "Incorrect email or password.",
  AccountNotFound: "No account found with this email. Try signing up instead.",
  UserAlreadyExists: "An account with this email already exists. Try logging in instead.",
  "User already exists": "An account with this email already exists. Try logging in instead.",

  // Auth validation
  "Email is required.": "Please enter your email address.",

  // Access
  Unauthorized: "Please sign in to continue.",
  "Unauthorized: You must be logged in to submit a quiz.":
    "Please sign in to continue.",
  Forbidden: "You don't have permission to do this.",
  "Forbidden: Admin only": "You don't have permission to do this.",

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

const TECHNICAL_PATTERNS = [
  /\[Request ID:/i,
  /Server Error/i,
  /Uncaught Error:/i,
  /at\s+\w+\s+\(/,
  /^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/, // PascalCase code with no spaces
];

function stripConvexWrapper(message: string): string {
  return message
    .replace(/\[Request ID: [^\]]+\]\s*/g, "")
    .replace(/Server Error\s*/gi, "")
    .replace(/Uncaught Error:\s*/gi, "")
    .trim();
}

function extractErrorCode(message: string): string | null {
  const codeMatch = message.match(/(?:Error:\s*)?([A-Z][a-zA-Z]+)\s*$/);
  return codeMatch?.[1] ?? null;
}

function looksTechnical(message: string): boolean {
  return TECHNICAL_PATTERNS.some((p) => p.test(message));
}

function resolveMessage(cleaned: string): string | undefined {
  if (ERROR_MESSAGES[cleaned]) return ERROR_MESSAGES[cleaned];

  const code = extractErrorCode(cleaned);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  return undefined;
}

/**
 * Turns thrown errors (including Convex / auth wrappers) into copy safe to show users.
 */
export function formatUserError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === "string" && data.trim()) {
      return formatUserError(data, fallback);
    }
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
    ) {
      return formatUserError((data as { message: string }).message, fallback);
    }
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!raw.trim()) return fallback;

  const cleaned = stripConvexWrapper(raw);
  const mapped = resolveMessage(cleaned);
  if (mapped) return mapped;

  if (!looksTechnical(cleaned)) return cleaned;

  return fallback;
}
