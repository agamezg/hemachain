# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**HemaChain** — TFM (Máster en Blockchain, CodeCrypto Academy 2026). Trazabilidad de donaciones de sangre sobre Ethereum, anclada en la **Resolución 536/2026** del Ministerio de Salud argentino. Monorepo con cuatro sub-proyectos: `sc/` (Foundry), `web/` (Next.js 15), `indexer/` y `mcp-server/` (placeholders hasta Phase 7).

Project documentation is written in **Spanish**: `README.md` (14 secciones), `docs/SDD.md` (Software Design Document, 15 secciones), `docs/TRACK.md` (phase tracker — read this first to know what's done and what's next), `IA.md` (AI usage retrospective). Match that language when editing docs.

## Phase-gated delivery

Work is organized by phases tracked in `docs/TRACK.md`. **Always re-read TRACK.md at the start of a session** — it is the operational source of truth for where the project is. The summary as of last commit:

| Phase | Status |
|---|---|
| 0 — Setup, SDD, scaffolding | ✅ Complete |
| 1 — Smart contracts (Foundry, TDD) | ⬜ Next |
| 2–8 | Not started |

Implication: `sc/src/` still contains the default Foundry `Counter.sol` / `Counter.t.sol` / `Counter.s.sol`. Phase 1 replaces these with `HemaRegistry.sol`, `HemaTraceability.sol`, `HemaCertificate.sol` per `docs/SDD.md` §8. The `restart.sh` deploy step is conditional on `sc/script/Deploy.s.sol` existing, so it will gracefully skip until Phase 1 lands.

When you finish a chunk of phase work, mark the checkbox in `docs/TRACK.md` and append a session note at the bottom (see "Notas de retomada" pattern).

## Common commands

Run from repo root unless noted. The repo uses a **3-process local stack** (Anvil + Next.js dev + optional indexer); use the orchestrator instead of starting them by hand:

```bash
./restart.sh        # stop everything, anvil :8545, deploy, copy ABIs to web/, next dev :3000, indexer
./stop.sh           # three-layer cleanup: .pids file → pkill by pattern → port kill
SKIP_DEPLOY=1 ./restart.sh   # bypass forge deploy
SKIP_WEB=1 ./restart.sh      # anvil only
SKIP_INDEXER=1 ./restart.sh  # no indexer
```

`restart.sh` copies `sc/out/{HemaRegistry,HemaTraceability,HemaCertificate}.json` into `web/src/contracts/` after each deploy — that's how the frontend gets ABIs. Logs land in `.logs/`; PIDs in `.pids`.

Sub-project commands:

```bash
# Smart contracts (sc/)
cd sc && forge build
cd sc && forge test                          # full suite
cd sc && forge test --match-test testName    # single test
cd sc && forge test --match-contract Hema    # one contract
cd sc && forge test -vvv                     # traces on failure
cd sc && forge fmt                           # required by pre-commit
cd sc && forge snapshot                      # gas tracking (SDD §8 wants this)
cd sc && forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Frontend (web/) — Next.js 16.2.6 + React 19 + Tailwind v4 + Turbopack
cd web && npm run dev      # localhost:3000
cd web && npm run build    # production build (Turbopack)
cd web && npm run lint     # ESLint (eslint-config-next)
```

There is **no `npm test` yet** in `web/`; the pre-push hook detects it and runs it only if defined.

## Architecture

**Three smart contracts, one role per actor.** Designed in `docs/SDD.md` §8:

- `HemaRegistry` — `AccessControl`-based role request/approve flow. Roles: `BANCO_SANGRE`, `LABORATORIO`, `FRACCIONAMIENTO`, `MEDICINA_TRANSFUSIONAL`, `AUDITOR`, `CERTIFICADOR`, plus `DEFAULT_ADMIN_ROLE`. Admin has no operational write powers (separation of concerns).
- `HemaTraceability` — donation → test → component → custody → transfusion lifecycle. Includes look-back propagation (`reportAdverseEvent` recursively recalls all derived components) and cold-chain auto-recall (temperature outside range flips state to `Recalled` inside `transferCustody`).
- `HemaCertificate` — ERC-721 certificates. Each token stores `documentHash = keccak256(PDF)` + IPFS CID; the frontend recomputes the hash before rendering. Status transitions are monotonic: `Valid → Expired | Revoked`.

Seven invariants (`docs/SDD.md` §8.3) must be enforced by tests, not by client code: `INV_VolumeConserved`, `INV_RecallPropagates`, `INV_NoExpiredTransfusion`, `INV_ColdChainGate`, `INV_RoleScoping`, `INV_DonorHashImmutable`, `INV_CertificateMonotonic`.

**Privacy is structural, not optional.** Nothing personally-identifiable goes on-chain — donor and patient identifiers are always `keccak256(DNI + salt_institucional)`. The salt lives off-chain at the originating institution. This is the project's compliance story for Ley 25.326 (Argentina) and the abstract benchmark for GDPR. Never introduce a code path that writes DNI / name / clinical history to chain or to a server log.

**Chagas is mandatory** in `recordTestResult` (regional differentiator vs. EU/US screening panels). Don't remove it "to simplify the API".

**Frontend layout.** Next.js 15 App Router with `[locale]` segment (`es`/`pt`/`en` via `next-intl`). Per-role dashboards under `/[locale]/dashboard/<role>`. The `/verify/[id]` route is **locale-less and wallet-less** — that's the public verification surface that QR codes printed on blood units point to; don't wrap it in auth or locale routing.

**Innovation layer (Phase 7).** `indexer/` (Node + ethers WS + SQLite + SSE) feeds live toasts to dashboards. `mcp-server/` wraps Foundry CLI (anvil/cast/forge) so the in-dashboard "Ask HemaChain" agent can hit chain state via Claude tool-use. Both are currently package.json + README placeholders.

## Web sub-project — read `web/AGENTS.md` before editing

`web/CLAUDE.md` is a one-line `@AGENTS.md` import. **Read `web/AGENTS.md` before touching frontend code.** Its message: this repo runs Next.js **16.2.6** with React 19 — APIs, conventions, and file structure differ from what's in pretrained model knowledge. Consult `web/node_modules/next/dist/docs/` and current deprecation notices rather than reproducing patterns from memory. Tailwind is v4 (`@custom-variant`, no `tailwind.config.js`).

i18n: externalize **every** user-visible string from day 1 via `useTranslations()`, even when only `es.json` exists. The Phase 8 i18n closeout only adds translated JSON files — it should not have to chase hardcoded strings.

## Git workflow

**Dual remote, mirrored push.** Two remotes are configured: `origin` → GitHub (`agamezg/hemachain`, public), `gitlab` → CodeCrypto academia. The `pre-push` hook automatically mirrors any push to the counterpart remote (origin → gitlab and vice versa) using `--no-verify` on the mirror leg to avoid re-firing the hook. Don't `git push --force` to either remote — `main` must stay in sync between them. Recovery if mirror fails: `SKIP_MIRROR=1 git push origin && git push gitlab`.

**Hooks live in `scripts/hooks/`, not `.git/hooks/`** — installed via `git config core.hooksPath scripts/hooks` (run `scripts/install-hooks.sh` on a fresh clone). They run on every commit / push:

- `pre-commit` — `forge fmt --check` on staged `sc/**/*.sol`; `npm run lint` on staged `web/**/*.{ts,tsx,js,jsx,mjs,cjs}`.
- `commit-msg` — enforces **Conventional Commits**: `<type>(<scope>)!?: <subject>` (max 100 chars). Valid types: `feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert`. Scope convention in use: `sc`, `web`, `devx`, `scaffold`, `track`.
- `pre-push` — runs `forge test` if `sc/` changed; `npm run lint` (and `npm test` / Playwright if configured) if `web/` changed; then the mirror push.

Bypass with `SKIP_HOOKS=1`, `SKIP_TESTS=1`, or `SKIP_MIRROR=1`. **Do not use `--no-verify`** to dodge a hook failure — fix the underlying issue. The hook is the feedback signal.

## Local development accounts

The first six Anvil accounts map to roles in the demo seed (see `README.md` §5):

| Role | Anvil index |
|---|---|
| ADMIN | 0 (`0xf39Fd...266`) |
| BANCO_SANGRE | 1 |
| LABORATORIO | 2 |
| FRACCIONAMIENTO | 3 |
| MEDICINA_TRANSFUSIONAL | 4 |
| AUDITOR | 5 |
| CERTIFICADOR | 6 (`0x976EA740...0aa9`) |

MetaMask config for Anvil: RPC `http://localhost:8545`, Chain ID `31337`.

## Reference documents (auto-imported into every session)

- `docs/SDD.md` — architecture, contract signatures, invariants, threat mode
l, deployment topology.
- `docs/TRACK.md` — phase checklist + per-session notes. **Update this when
you finish work.**

The files below are pulled into context at session start via `@`-imports — you do **not** need to `Read` them. Treat them as authoritative; update them in place when work invalidates them.

@README.md
@docs/SDD.md
@docs/TRACK.md
@restart.sh
@stop.sh

Not auto-imported (read on demand):

- `IA.md` — AI usage retrospective for the TFM submission.
- The five `TFM N …md` files in the root are the academy's original briefs; TFM 3 is the chosen track.
