import { ConvexError } from "convex/values";

export function validatePasswordRequirements(password: string) {
  if (!password || password.length < 6) {
    throw new ConvexError("Password must be at least 6 characters.");
  }
}
