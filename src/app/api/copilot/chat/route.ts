import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";
import { generateCopilotResponse, type RetrievedChunk } from "@/lib/ai/copilot";
import type { CopilotMode } from "@/lib/copilot-access";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      sessionId?: string;
      message?: string;
      sourceIds?: string[];
      mode?: CopilotMode;
      title?: string;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let sessionId = body.sessionId as Id<"copilotSessions"> | undefined;
    const mode = (body.mode ?? "explain") as CopilotMode;
    let sourceIds = (body.sourceIds ?? []) as Id<"studySources">[];

    if (!sessionId) {
      if (sourceIds.length === 0) {
        const [myUploads, library] = await Promise.all([
          fetchQuery(api.studySources.listMyUploads, {}, { token }),
          fetchQuery(api.studySources.listPlatformLibrary, {}, { token }),
        ]);
        const ready = [
          ...myUploads.filter((s) => s.status === "ready"),
          ...library.filter((s) => s.status === "ready"),
        ];
        sourceIds = ready.map((s) => s._id);
      }

      if (sourceIds.length === 0) {
        return NextResponse.json(
          { error: "No study materials available. Upload notes or wait for library indexing." },
          { status: 400 },
        );
      }

      sessionId = await fetchMutation(
        api.copilot.createSession,
        {
          title: body.title ?? message.slice(0, 60),
          sourceIds,
          mode,
        },
        { token },
      );
    }

    await fetchMutation(
      api.copilot.addMessage,
      { sessionId, role: "user", content: message, incrementUsage: true },
      { token },
    );

    const sessionData = await fetchQuery(api.copilot.getSession, { sessionId }, { token });
    const activeSourceIds = sessionData.session.sourceIds;

    const searchResults = await fetchQuery(
      api.copilot.searchChunks,
      { sourceIds: activeSourceIds, query: message, limit: 8 },
      { token },
    );

    const sourceMap = new Map<string, { title: string; sourceKind: string }>();
    for (const sid of activeSourceIds) {
      const src = await fetchQuery(api.studySources.getSourceById, { sourceId: sid }, { token });
      if (src) {
        sourceMap.set(sid, { title: src.title, sourceKind: src.sourceKind });
      }
    }

    const chunks: RetrievedChunk[] = searchResults.map(
      (r: {
        _id: Id<"documentChunks">;
        _score: number;
        text: string;
        pageNumber?: number;
        sectionTitle?: string;
        sourceId: Id<"studySources">;
      }) => {
        const meta = sourceMap.get(r.sourceId);
        return {
          chunkId: r._id,
          text: r.text,
          pageNumber: r.pageNumber,
          sectionTitle: r.sectionTitle,
          sourceTitle: meta?.title ?? "Unknown",
          sourceKind: meta?.sourceKind ?? "unknown",
          score: r._score,
        };
      },
    );

    const response = await generateCopilotResponse(
      sessionData.session.mode as CopilotMode,
      message,
      chunks,
    );

    await fetchMutation(
      api.copilot.addMessage,
      {
        sessionId,
        role: "assistant",
        content: response.answer,
        citations: response.citations.map((c) => ({
          chunkId: c.chunkId as Id<"documentChunks">,
          excerpt: c.excerpt,
          pageNumber: c.pageNumber,
          sourceTitle: c.sourceTitle,
          sourceKind: c.sourceKind,
        })),
      },
      { token },
    );

    return NextResponse.json({
      sessionId,
      answer: response.answer,
      citations: response.citations,
      suggestions: response.followUpSuggestions,
    });
  } catch (error) {
    console.error("Copilot chat error", error);
    const message = formatUserError(error, "Chat failed.");
    const status =
      message.includes("limit") || message.includes("Premium") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
