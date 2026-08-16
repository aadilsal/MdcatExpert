import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { Scrypt } from "lucia";
import { DataModel } from "./_generated/dataModel";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { validatePasswordRequirements } from "./lib/passwordValidation";

const scrypt = new Scrypt();

export default Password<DataModel>({
  profile(params) {
    const email = String(params.email ?? "").trim();
    if (!email) {
      throw new ConvexError("Please enter your email address.");
    }
    const name = String(params.name ?? "").trim() || undefined;

    return {
      email,
      name,
      role: "student" as const,
      subscriptionType: "free" as const,
      createdAt: Date.now(),
      isActive: true,
      // New signups get the forced feature tour; existing users are
      // backfilled to true — see convex/onboarding.ts.
      onboardingCompleted: false,
    };
  },
  validatePasswordRequirements,
  reset: ResendOTPPasswordReset,
  crypto: {
    async hashSecret(password: string) {
      return await scrypt.hash(password);
    },
    async verifySecret(password: string, hash: string) {
      const valid = await scrypt.verify(hash, password);
      if (!valid) {
        throw new ConvexError("Incorrect email or password.");
      }
      return valid;
    },
  },
});
