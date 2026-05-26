"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, SendHorizontal, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskResponse {
  mode?: "live" | "hint";
  answer?: string;
  error?: string;
}

/**
 * "Ask HemaChain" — a floating agent that answers traceability questions in
 * natural language by calling read-only chain tools server-side (`/api/ask`).
 * Mounted in the dashboard layout (next to LiveActivity). Works in dual mode:
 * the route returns `{mode:"hint"}` when ANTHROPIC_API_KEY is unset, and this
 * component renders a localized configuration hint instead of a live answer.
 */
export function AskHemaChain() {
  const t = useTranslations("ai");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as AskResponse;
      const answer =
        data.mode === "hint"
          ? t("hintMessage")
          : (data.answer?.trim() || data.error || t("error"));
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("error") }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-lg transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none"
      >
        <Sparkles className="h-6 w-6" aria-hidden />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[min(34rem,calc(100vh-3rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-xl">
      {/* Header */}
      <header className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]">
            <Bot className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--color-fg)]">
              {t("title")}
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="rounded-md p-1 text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-fg)]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-[var(--color-fg)]">
              {t("emptyTitle")}
            </p>
            <p className="max-w-[18rem] text-xs text-[var(--color-fg-muted)]">
              {t("emptyHint")}
            </p>
            <button
              type="button"
              onClick={() => void send(t("example"))}
              className="mt-1 max-w-full rounded-[var(--radius-input)] border border-[var(--color-border-strong)] px-3 py-2 text-left text-xs text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg)]"
            >
              <span className="block font-medium text-[var(--color-fg-muted)]">
                {t("exampleLabel")}
              </span>
              {t("example")}
            </button>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user"
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                    : "bg-[var(--color-bg)] text-[var(--color-fg)] border border-[var(--color-border)]",
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2 text-sm text-[var(--color-fg-muted)]">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)]"
              />
              {t("thinking")}
            </div>
          </div>
        ) : null}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-[var(--color-border)] px-3 py-3"
      >
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="h-10 flex-1 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-primary)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            aria-label={t("send")}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-[0.7rem] text-[var(--color-fg-subtle)]">
          {t("disclaimer")}
        </p>
      </form>
    </div>
  );
}
