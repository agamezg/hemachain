# @hemachain/indexer

> **Status:** placeholder. Implementation scheduled for **Phase 7 — Innovation Layer** (see `../docs/TRACK.md`).

Event-driven indexer that subscribes to HemaChain contract events on Anvil/Sepolia and feeds the frontend with live updates.

## Planned responsibilities (per `../docs/SDD.md` §10.2)

- Subscribe to all events emitted by `HemaRegistry`, `HemaTraceability`, and `HemaCertificate` via an `ethers` WebSocketProvider.
- Persist events to a local SQLite database (`indexer.db`, gitignored).
- Expose a Server-Sent Events endpoint (`GET /stream`) that dashboards consume for real-time toasts.
- Drive the cold-chain alert daemon and the expiry-reminder cron.

## Planned stack

- Node.js ≥ 20 (ESM)
- `ethers@^6`
- `better-sqlite3`
- An HTTP server (`fastify` or `hono`)

## Why a placeholder now?

Keeps the monorepo shape visible from day one and lets `restart.sh` / the pre-push hook treat the directory uniformly without special-casing. Will be `npm init`'d and filled in when Phase 7 starts.
