# @hemachain/indexer

Event-driven indexer that subscribes to HemaChain contract events on Anvil/Sepolia, persists them to SQLite, and streams them to the dashboards over Server-Sent Events. Implements SDD §10.2.

## Responsibilities

- Subscribes (ethers `WebSocketProvider`) to events from `HemaTraceability`, `HemaCertificate`, and `HemaRegistry`. Backfills historical events on startup, then listens live.
- Persists every event to `indexer.db` (SQLite, gitignored), de-duplicated by `(tx, log_index)`.
- Exposes an HTTP API:
  - `GET /stream` — Server-Sent Events; one `data:` frame per new event.
  - `GET /events?limit=N` — most recent events as JSON (initial dashboard load).
  - `GET /health` — `{ ok, events, clients }`.
- Runs an **alert daemon**: tags each event with a `severity` (`info|ok|warn|critical`) for dashboard toasts, and raises a synthetic `ExpiryWarning` once per component as it crosses into the 48h-to-expiry window (skipping transfused/recalled ones).

## Run

```bash
npm install
npm start          # node src/index.js → SSE on http://localhost:4000
```

`restart.sh` starts it automatically as part of the local stack. Reads the deterministic Anvil addresses by default; override per env:

| Var | Default |
|---|---|
| `INDEXER_RPC_WS` | `ws://127.0.0.1:8545` |
| `INDEXER_PORT` | `4000` |
| `INDEXER_TRACEABILITY_ADDRESS` / `INDEXER_CERTIFICATE_ADDRESS` / `INDEXER_REGISTRY_ADDRESS` | deterministic Deploy.s.sol addresses |

ABIs are read from `../web/src/contracts/` so the indexer never drifts from what the frontend decodes.

## Stack

- Node.js ≥ 20 (ESM)
- `ethers@^6` (`WebSocketProvider`)
- `better-sqlite3`
- Node's built-in `http` for the SSE/REST surface (no framework)
