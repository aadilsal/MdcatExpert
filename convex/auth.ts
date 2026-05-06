import { convexAuth } from "@convex-dev/auth/server";
import Password from "./authPassword";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

