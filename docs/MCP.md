# HemaChain MCP Server

> Model Context Protocol server that exposes Foundry CLI controls and HemaChain traceability queries to LLM clients (Claude via tool-use). Backs the "Ask HemaChain" agent and counts toward the `+5 %` MCP bonus on the TFM rubric. Implements SDD §10.3.

Lives in [`mcp-server/`](../mcp-server/). Speaks MCP over **stdio**, so any MCP client (Claude Code, Claude Desktop, the Inspector) can launch it as a child process.

## Tools

| Tool | Arguments | Description |
|---|---|---|
| `forge_test` | `matchTest?`, `matchContract?` | Runs the Foundry suite in `sc/`, optionally filtered. Returns the (tail of) the output. |
| `cast_call` | `to`, `sig`, `args?` | Read-only `eth_call` via `cast call`. E.g. `sig: "getUnit(uint256)"`. |
| `trace_query` | `id` (`u<n>` \| `c<n>` \| number) | Markdown lineage of a donation unit (status, volume, donor hash, screening, derived components) or a component (type, status, parent, cold-chain handoffs). |
| `recent_events` | `limit?` (1–100) | Most recent `HemaTraceability` events on-chain, newest first. |

## Prerequisites

- Foundry on `PATH` (`forge`, `cast`).
- A running chain for `trace_query` / `cast_call` / `recent_events` (`./restart.sh` or `anvil`). `forge_test` needs only `sc/`.

## Run standalone

```bash
cd mcp-server
npm install
npm start          # node src/index.js — serves MCP on stdio
```

Environment overrides:

| Var | Default |
|---|---|
| `MCP_RPC_URL` | `http://127.0.0.1:8545` |
| `MCP_TRACEABILITY_ADDRESS` | deterministic Deploy.s.sol address |

ABIs are read from `../web/src/contracts/`.

## Register with Claude Code

```bash
claude mcp add hemachain -- node /absolute/path/to/eth-pfm-chain-tracker/mcp-server/src/index.js
```

## Register with Claude Desktop

Add to `claude_desktop_config.json` (`mcpServers` block):

```json
{
  "mcpServers": {
    "hemachain": {
      "command": "node",
      "args": ["/absolute/path/to/eth-pfm-chain-tracker/mcp-server/src/index.js"],
      "env": { "MCP_RPC_URL": "http://127.0.0.1:8545" }
    }
  }
}
```

Then ask, e.g.:
- *"Usá trace_query para mostrarme el linaje de la unidad 1."*
- *"Corré forge_test sobre el contrato HemaTraceability."*
- *"¿Qué eventos recientes hubo en la cadena?"*

## Quick stdio sanity check (no client)

```bash
cd mcp-server
{ printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'; sleep 1; } | node src/index.js
```

## Stack

- Node.js ≥ 20 (ESM)
- `@modelcontextprotocol/sdk` (stdio transport, `registerTool`)
- `ethers@^6` (read-only chain queries)
- `execa` (spawns `forge` / `cast`)
- `zod` (tool input schemas)
