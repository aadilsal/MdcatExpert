import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { redirect } from "next/navigation";
import ChatClient from "./chat-client";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default async function CopilotChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ sources?: string; mode?: string; q?: string }>;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/login");

  const { sessionId } = await params;
  const sp = await searchParams;

  const [me, usage] = await Promise.all([
    fetchQuery(api.users.getCurrentUserProfile, {}, { token }),
    fetchQuery(api.studySources.getCopilotUsage, {}, { token }),
  ]);

  if (sessionId === "new") {
    return (
      <ChatClient
        user={me}
        usage={usage}
        sessionId={null}
        initialMessages={[]}
        initialSourceIds={(sp.sources ?? "").split(",").filter(Boolean)}
        initialMode={(sp.mode as "explain") ?? "explain"}
        prefilledQuestion={sp.q ?? ""}
      />
    );
  }

  const data = await fetchQuery(
    api.copilot.getSession,
    { sessionId: sessionId as Id<"copilotSessions"> },
    { token },
  );

  return (
    <ChatClient
      user={me}
      usage={usage}
      sessionId={sessionId}
      initialMessages={data.messages}
      session={data.session}
      initialSourceIds={data.session.sourceIds.map(String)}
      initialMode={data.session.mode}
      prefilledQuestion={sp.q ?? ""}
    />
  );
}
