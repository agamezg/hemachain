# @hemachain/mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes Foundry CLI controls and HemaChain traceability queries to LLMs (Claude via tool-use). Backs the "Ask HemaChain" agent and counts toward the `+5 %` MCP bonus on the TFM rubric. Implements SDD §10.3.

**Full documentation → [`../docs/MCP.md`](../docs/MCP.md)** (tools, run, Claude Code / Desktop registration).

## Tools

- `forge_test(matchTest?, matchContract?)` — runs the Foundry suite in `sc/`.
- `cast_call(to, sig, args?)` — read-only `eth_call`.
- `trace_query(id)` — Markdown lineage of a unit (`u<n>`) or component (`c<n>`).
- `recent_events(limit?)` — most recent on-chain traceability events.

## Run

```bash
npm install
npm start          # node src/index.js — MCP over stdio
```

## Stack

- Node.js ≥ 20 (ESM)
- `@modelcontextprotocol/sdk` (stdio transport)
- `ethers@^6`, `execa`, `zod`
