import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export default Password<DataModel>({
  profile(params) {
    const email = String(params.email ?? "").trim();
    if (!email) {
      throw new Error("Email is required.");
    }
    const name = String(params.name ?? "").trim() || undefined;

    return {
      email,
      name,
      role: "student" as const,
      subscriptionType: "free" as const,
      createdAt: Date.now(),
      isActive: true,
    };
  },
});

