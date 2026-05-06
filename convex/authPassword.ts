import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export default Password<DataModel>({
  profile(params) {
    const email = params.email as string | undefined;
    const name = (params.name as string | undefined) ?? undefined;

    return {
      email,
      name,
      role: "student",
      subscriptionType: "free",
      createdAt: Date.now(),
      isActive: true,
    };
  },
});

