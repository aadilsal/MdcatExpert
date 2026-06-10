import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { redirect } from "next/navigation";
import CopilotClient from "./copilot-client";

export default async function CopilotPage() {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/login");

  const [me, myUploads, library, sessions, usage] = await Promise.all([
    fetchQuery(api.users.getCurrentUserProfile, {}, { token }),
    fetchQuery(api.studySources.listMyUploads, {}, { token }),
    fetchQuery(api.studySources.listPlatformLibrary, {}, { token }),
    fetchQuery(api.copilot.listSessions, {}, { token }),
    fetchQuery(api.studySources.getCopilotUsage, {}, { token }),
  ]);

  return (
    <CopilotClient
      user={me}
      myUploads={myUploads}
      library={library}
      sessions={sessions}
      usage={usage}
    />
  );
}
