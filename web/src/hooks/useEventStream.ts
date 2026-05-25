"use client";

import { useEffect, useRef, useState } from "react";

export interface LiveEvent {
  contract: string;
  name: string;
  block: number;
  tx: string;
  logIndex: number;
  severity: "info" | "ok" | "warn" | "critical";
  args: Array<string | number | boolean | unknown>;
  ts: number;
}

const INDEXER_URL =
  process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:4000";

/**
 * Subscribes to the indexer's SSE stream and invokes `onEvent` for each live
 * event. Only events arriving after the connection opens are delivered — the
 * historical backlog (`GET /events`) is intentionally not replayed as toasts.
 */
export function useEventStream(onEvent?: (e: LiveEvent) => void) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onEvent);

  useEffect(() => {
    cbRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const source = new EventSource(`${INDEXER_URL}/stream`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (msg) => {
      try {
        cbRef.current?.(JSON.parse(msg.data) as LiveEvent);
      } catch {
        /* ignore malformed frame */
      }
    };
    return () => source.close();
  }, []);

  return { connected };
}
