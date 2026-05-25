import { createServer } from "node:http";
import { eventCount, recentEvents } from "./db.js";

const clients = new Set();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Push a normalized event record to every connected SSE client. */
export function broadcast(rec) {
  const frame = `data: ${JSON.stringify(rec)}\n\n`;
  for (const res of clients) {
    try {
      res.write(frame);
    } catch {
      clients.delete(res);
    }
  }
}

export function clientCount() {
  return clients.size;
}

export function startServer(port) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS);
      res.end();
      return;
    }

    if (url.pathname === "/stream") {
      res.writeHead(200, {
        ...CORS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(": connected\n\n");
      clients.add(res);
      // Comment pings keep proxies from closing an idle event stream.
      const ping = setInterval(() => {
        try {
          res.write(": ping\n\n");
        } catch {
          clearInterval(ping);
        }
      }, 25_000);
      req.on("close", () => {
        clearInterval(ping);
        clients.delete(res);
      });
      return;
    }

    if (url.pathname === "/events") {
      const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 500);
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify(recentEvents(limit)));
      return;
    }

    if (url.pathname === "/health") {
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ ok: true, events: eventCount(), clients: clients.size }),
      );
      return;
    }

    res.writeHead(404, CORS);
    res.end();
  });

  server.listen(port, () => {
    console.log(`[indexer] SSE + REST on http://localhost:${port}`);
  });
  return server;
}
