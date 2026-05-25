"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEventStream, type LiveEvent } from "@/hooks/useEventStream";

const TOASTER = {
  critical: toast.error,
  warn: toast.warning,
  ok: toast.success,
  info: toast.info,
} as const;

/**
 * Mounted once in the dashboard layout: turns the indexer's live SSE events
 * into sonner toasts (tone by severity) and shows a small "en vivo" pill while
 * the stream is connected. Renders no page content beyond that indicator.
 */
export function LiveActivity() {
  const t = useTranslations("live");

  const onEvent = useCallback(
    (e: LiveEvent) => {
      const title = t(`events.${e.name}`);
      let description = "";
      if (e.name === "ExpiryWarning") {
        description = t("expiryDetail", {
          id: String(e.args[0]),
          hours: String(e.args[1]),
        });
      } else if (typeof e.args[0] === "string" && /^\d+$/.test(e.args[0])) {
        description = `#${e.args[0]}`;
      }
      const fire = TOASTER[e.severity] ?? toast.info;
      fire(title, description ? { description } : undefined);
    },
    [t],
  );

  const { connected } = useEventStream(onEvent);

  if (!connected) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs text-[var(--color-fg-muted)] shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-ok)] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-ok)]" />
      </span>
      {t("connected")}
    </div>
  );
}
