import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import BlogEditorClient from "../blog-editor-client";

export const dynamic = "force-dynamic";

export default async function AdminNewBlogPage() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return <div className="p-10 text-center text-gray-500">Unauthorized</div>;
  }

  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") {
    return <div className="p-10 text-center text-gray-500">Forbidden</div>;
  }

  return <BlogEditorClient />;
}
