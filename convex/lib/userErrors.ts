import { ConvexError } from "convex/values";

/** Throw a user-visible error from Convex functions (surfaced as ConvexError.data on clients). */
export function throwUserError(message: string): never {
  throw new ConvexError(message);
}
