"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Loader2,
  Send,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  COPILOT_MODE_LABELS,
  FREE_COPILOT_DAILY_MESSAGE_LIMIT,
  getCopilotLimits,
  type CopilotMode,
} from "@/lib/copilot-access";
import { formatUserError } from "@/lib/format-user-error";
import { LoadingButton } from "@/components/loading-button";
import {
  getCopilotChatStarters,
  getCopilotFollowUpSuggestions,
} from "@/lib/copilot-chat-starters";
import { CopilotMessageContent } from "@/components/copilot-message-content";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";

type ChatMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Doc<"copilotMessages">["citations"];
  createdAt: number;
};

type Session = Doc<"copilotSessions">;

const generateTempId = () => `temp-${Date.now()}`;
const generateAssistantTempId = () => `assistant-${Date.now()}`;
const getTimestamp = () => Date.now();

export default function ChatClient({
  user,
  usage,
  sessionId,
  session,
  initialMessages,
  initialSourceIds,
  initialMode,
  prefilledQuestion = "",
}: {
  user: Doc<"users"> | null;
  usage: {
    isPremium: boolean;
    messageCount: number;
    maxMessagesPerDay: number | null;
  };
  sessionId: string | null;
  session?: Session;
  initialMessages: ChatMessage[];
  initialSourceIds: string[];
  initialMode: string;
  prefilledQuestion?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({
      _id: String(m._id),
      role: m.role,
      content: m.content,
      citations: m.citations,
      createdAt: m.createdAt,
    })),
  );
  const [input, setInput] = useState(prefilledQuestion);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState(sessionId);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>(() => {
    const last = initialMessages[initialMessages.length - 1];
    return last?.role === "assistant" ? getCopilotFollowUpSuggestions(initialMode) : [];
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const limits = getCopilotLimits(user);
  const messageAtLimit =
    !limits.isPremium && usage.messageCount >= FREE_COPILOT_DAILY_MESSAGE_LIMIT;
  const mode = initialMode as CopilotMode;
  const { welcomeMessage, suggestions } = getCopilotChatStarters(mode);
  const showStarters = messages.length === 0 && !sending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessageWithText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (messageAtLimit) {
      router.push("/upgrade?reason=copilot");
      return;
    }

    setSending(true);
    setError(null);
    setInput("");
    setFollowUpSuggestions([]);

    const userMsg: ChatMessage = {
      _id: generateTempId(),
      role: "user",
      content: trimmed,
      createdAt: getTimestamp(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId && activeSessionId !== "new" ? activeSessionId : undefined,
          message: trimmed,
          sourceIds: initialSourceIds,
          mode: initialMode,
          title: trimmed.slice(0, 60),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      trackEvent(ANALYTICS_EVENTS.COPILOT_MESSAGE_SENT);

      if (!activeSessionId || activeSessionId === "new") {
        setActiveSessionId(json.sessionId);
        router.replace(`/copilot/chat/${json.sessionId}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          _id: generateAssistantTempId(),
          role: "assistant" as const,
          content: json.answer,
          citations: json.citations,
          createdAt: getTimestamp(),
        },
      ]);

      const fromApi = Array.isArray(json.suggestions)
        ? json.suggestions.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
        : [];
      setFollowUpSuggestions(
        fromApi.length > 0 ? fromApi.slice(0, 4) : getCopilotFollowUpSuggestions(initialMode),
      );
    } catch (e) {
      setError(formatUserError(e, "Failed to send message"));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = () => sendMessageWithText(input);

  const handleSuggestion = (question: string) => {
    setInput(question);
    void sendMessageWithText(question);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] pb-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/copilot" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-gray-900 dark:text-white italic">
            {session?.title ?? "New chat"}
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {COPILOT_MODE_LABELS[initialMode as CopilotMode] ?? initialMode} ·{" "}
            {initialSourceIds.length} sources
          </p>
        </div>
        {!limits.isPremium && (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            {usage.messageCount}/{FREE_COPILOT_DAILY_MESSAGE_LIMIT} today
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {showStarters && (
          <div className="space-y-4">
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-3xl px-5 py-4 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800/60 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400">
                  <Sparkles className="w-3 h-3" />
                  Copilot
                </div>
                <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-300">
                  {welcomeMessage}
                </p>
              </div>
            </div>
            <div className="pl-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleSuggestion(question)}
                    disabled={sending || messageAtLimit}
                    className="text-left px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-800 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m._id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl px-5 py-4 ${
                m.role === "user"
                  ? "bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-100"
                  : "bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800/60 text-gray-900 dark:text-white shadow-sm"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400">
                  <Sparkles className="w-3 h-3" />
                  Copilot
                </div>
              )}
              {m.role === "assistant" ? (
                <CopilotMessageContent content={m.content} />
              ) : (
                <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </div>
              )}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-surface-border dark:border-slate-800/60 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    Sources
                  </p>
                  {m.citations.map((c, i) => (
                    <div key={i} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950 rounded-xl p-3 border border-transparent dark:border-slate-800/50">
                      <p className="font-bold text-gray-700 dark:text-gray-300">
                        {c.sourceTitle}
                        {c.pageNumber ? ` · p.${c.pageNumber}` : ""}
                      </p>
                      <p className="mt-1 italic line-clamp-2 dark:text-gray-400">{c.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-primary-500 text-xs font-black uppercase tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {messageAtLimit ? (
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-bold text-amber-800">
            Daily message limit reached.{" "}
            <Link href="/upgrade?reason=copilot" className="underline">
              Upgrade to Elite
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {followUpSuggestions.length > 0 && !sending && messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {followUpSuggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSuggestion(question)}
                  disabled={sending}
                  className="px-4 py-2 rounded-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-gray-700 dark:text-slate-300 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-800 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about your notes or textbooks…"
            className="flex-1 px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/30"
            disabled={sending}
          />
          <LoadingButton
            onClick={sendMessage}
            loading={sending}
            disabled={!input.trim()}
            loadingChildren=""
            className="px-5 py-4 bg-primary-600 text-white rounded-2xl disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
