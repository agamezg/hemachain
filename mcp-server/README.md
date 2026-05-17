# @hemachain/mcp-server

> **Status:** placeholder. Implementation scheduled for **Phase 7 — Innovation Layer** (see `../docs/TRACK.md`).

A [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes Foundry CLI controls and HemaChain traceability queries to LLMs (Claude via tool-use). Backs the "Ask HemaChain" agent in the frontend and counts toward the `+5 %` MCP bonus on the TFM rubric.

## Planned tools (per `../docs/SDD.md` §10.3)

- `mcp_anvil_start(port?)`, `mcp_anvil_reset()`
- `mcp_forge_test(matchTest?, verbosity?)`
- `mcp_forge_deploy(network)` — anvil | sepolia
- `mcp_forge_script(scriptPath, args)`
- `mcp_cast_call(target, function, args)`
- `mcp_trace_query(unitOrComponentId)` — returns a Markdown summary of the full lineage (unit → tests → components → custody → certificates)

## Planned stack

- Node.js ≥ 20 (ESM, TypeScript)
- `@modelcontextprotocol/sdk`
- `ethers@^6` (for cast-equivalent on-chain reads)
- `execa` (for spawning anvil/forge processes)

## Why a placeholder now?

Same reason as `../indexer/`: monorepo shape visible from day one. Will be `npm init`'d during Phase 7.
