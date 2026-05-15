#!/usr/bin/env bash
# stop.sh — terminate every background process started by restart.sh.
#
# Three-layer cleanup:
#   1. Kill PIDs recorded in .pids
#   2. pkill processes by command pattern (belt-and-suspenders)
#   3. Kill anything still bound to the well-known ports

set -uo pipefail   # do NOT exit on first error; we want all layers to run

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$REPO_ROOT/.pids"

ANVIL_PORT="${ANVIL_PORT:-8545}"
WEB_PORT="${WEB_PORT:-3000}"
INDEXER_PORT="${INDEXER_PORT:-4000}"

graceful_kill() {
  local pid="$1"
  local label="$2"
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then return; fi
  echo "→ killing ${label} (pid ${pid})"
  kill "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then return; fi
    sleep 0.2
  done
  kill -9 "$pid" 2>/dev/null || true
}

# ── 1. PID file ───────────────────────────────────────────────────────
if [ -f "$PID_FILE" ]; then
  while IFS='=' read -r name pid; do
    [ -z "$name" ] && continue
    graceful_kill "$pid" "$name"
  done < "$PID_FILE"
  rm -f "$PID_FILE"
fi

# ── 2. pkill by command pattern ──────────────────────────────────────
pkill -f "^anvil " 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "indexer.*node" 2>/dev/null || true

# ── 3. Port-based fallback ───────────────────────────────────────────
for port in "$ANVIL_PORT" "$WEB_PORT" "$INDEXER_PORT"; do
  if command -v lsof &>/dev/null; then
    pid="$(lsof -ti:"$port" 2>/dev/null || true)"
  elif command -v fuser &>/dev/null; then
    pid="$(fuser "${port}/tcp" 2>/dev/null | tr -d ' ' || true)"
  else
    pid=""
  fi
  if [ -n "$pid" ]; then
    graceful_kill "$pid" "port-${port}"
  fi
done

echo "✓ HemaChain local stack stopped"
