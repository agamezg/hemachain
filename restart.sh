#!/usr/bin/env bash
# restart.sh — start the full local HemaChain stack.
#
# Steps:
#   1. Stop any leftover processes (calls stop.sh)
#   2. Start Anvil on :8545
#   3. Deploy contracts to Anvil (if sc/ is scaffolded)
#   4. Copy ABIs into web/src/contracts/
#   5. Start Next.js dev server on :3000
#   6. Start the indexer (if present)
#   7. Record every PID to .pids so stop.sh can clean up
#
# Override defaults via env vars:
#   ANVIL_PORT=8545  WEB_PORT=3000  RPC_HOST=127.0.0.1
#
# Bypass with SKIP_DEPLOY=1 or SKIP_WEB=1 or SKIP_INDEXER=1.
#
# SEED=1 runs script/Seed.s.sol instead of Deploy.s.sol — deploys the contracts
# AND loads the demo scenario (look-back recall, cold-chain excursion, valid +
# revoked cert) at the same deterministic addresses, so one command brings up a
# data-rich stack. The indexer then backfills the seed cleanly (no toast flood).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

LOG_DIR="$REPO_ROOT/.logs"
PID_FILE="$REPO_ROOT/.pids"
mkdir -p "$LOG_DIR"

ANVIL_PORT="${ANVIL_PORT:-8545}"
WEB_PORT="${WEB_PORT:-3000}"
INDEXER_PORT="${INDEXER_PORT:-4000}"
RPC_HOST="${RPC_HOST:-127.0.0.1}"
RPC_URL="http://${RPC_HOST}:${ANVIL_PORT}"
# Well-known Anvil deployer key (first account, deterministic)
ANVIL_PK="${ANVIL_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

# ── 1. Clean previous state ──────────────────────────────────────────
echo "→ Cleaning previous processes..."
bash "$REPO_ROOT/stop.sh" >/dev/null 2>&1 || true
: > "$PID_FILE"

write_pid() { echo "$1=$2" >> "$PID_FILE"; }

# ── 2. Start Anvil ───────────────────────────────────────────────────
if ! command -v anvil &>/dev/null; then
  echo "✖ anvil not found. Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup"
  exit 1
fi

echo "→ Starting Anvil on ${RPC_URL}..."
anvil --host "$RPC_HOST" --port "$ANVIL_PORT" > "$LOG_DIR/anvil.log" 2>&1 &
ANVIL_PID=$!
write_pid anvil "$ANVIL_PID"

# Wait for RPC
for _ in $(seq 1 30); do
  if curl -sf -X POST -H "Content-Type: application/json" \
       --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
       "$RPC_URL" > /dev/null; then
    break
  fi
  sleep 0.3
done

if ! kill -0 "$ANVIL_PID" 2>/dev/null; then
  echo "✖ Anvil failed to start. See $LOG_DIR/anvil.log"
  exit 1
fi
echo "  ✓ Anvil up (pid $ANVIL_PID)"

# ── 3. Deploy (or seed) contracts ────────────────────────────────────
# SEED=1 swaps Deploy.s.sol → Seed.s.sol. Only one ever runs, so the
# deterministic addresses (account 0, nonces 0/1/2) stay stable either way.
if [ "${SEED:-0}" = "1" ]; then
  DEPLOY_SCRIPT="script/Seed.s.sol"
  DEPLOY_LABEL="Seeding contracts (deploy + demo data)"
else
  DEPLOY_SCRIPT="script/Deploy.s.sol"
  DEPLOY_LABEL="Deploying contracts"
fi

if [ "${SKIP_DEPLOY:-0}" != "1" ] && [ -f "$REPO_ROOT/sc/foundry.toml" ] && [ -f "$REPO_ROOT/sc/$DEPLOY_SCRIPT" ]; then
  echo "→ ${DEPLOY_LABEL} on Anvil..."
  if ! (cd "$REPO_ROOT/sc" && forge script "$DEPLOY_SCRIPT" --rpc-url "$RPC_URL" --private-key "$ANVIL_PK" --broadcast > "$LOG_DIR/deploy.log" 2>&1); then
    echo "✖ ${DEPLOY_LABEL} failed. See $LOG_DIR/deploy.log"
    exit 1
  fi

  # ── 4. Copy ABIs to web/ ───────────────────────────────────────────
  if [ -d "$REPO_ROOT/web/src" ]; then
    mkdir -p "$REPO_ROOT/web/src/contracts"
    for abi in HemaRegistry HemaTraceability HemaCertificate; do
      src="$REPO_ROOT/sc/out/${abi}.sol/${abi}.json"
      if [ -f "$src" ]; then
        cp "$src" "$REPO_ROOT/web/src/contracts/${abi}.json"
        echo "  ✓ ABI copied: ${abi}.json"
      fi
    done
  fi

  # ── 4b. Warp Anvil's clock (seed mode only) ─────────────────────────
  # The seed produces a 4th RBC component that stays in `Produced` state. By
  # advancing the chain ~41 days after the seed, that RBC's `expiresAt`
  # (producedAt + 42 d) falls inside the 48 h window the "Ask HemaChain"
  # agent queries in Beat 4 of the video demo. Existing terminal components
  # (Recalled/Transfused) and certificates (365 d shelf) are unaffected.
  if [ "${SEED:-0}" = "1" ]; then
    ADVANCE_SECONDS=$((41 * 86400))
    echo "→ Advancing Anvil clock by 41 days (so the demo RBC expires within 48 h)..."
    if command -v cast &>/dev/null; then
      if cast rpc --rpc-url "$RPC_URL" evm_increaseTime "$ADVANCE_SECONDS" > "$LOG_DIR/warp.log" 2>&1 \
         && cast rpc --rpc-url "$RPC_URL" evm_mine >> "$LOG_DIR/warp.log" 2>&1; then
        echo "  ✓ Chain time advanced — Beat 4 demo question will return matches"
      else
        echo "  ⚠ Time warp failed (see $LOG_DIR/warp.log); the AI Beat 4 demo question will return zero matches"
      fi
    else
      echo "  ⚠ cast not found — skipping time warp; AI Beat 4 demo will return zero matches"
    fi
  fi
else
  echo "ℹ sc/ not scaffolded yet — skipping contract deploy"
fi

# ── 5. Start Next.js dev server ──────────────────────────────────────
if [ "${SKIP_WEB:-0}" != "1" ] && [ -f "$REPO_ROOT/web/package.json" ]; then
  echo "→ Starting Next.js dev server on :${WEB_PORT}..."
  if [ ! -d "$REPO_ROOT/web/node_modules" ]; then
    echo "  → installing web/ dependencies (first run)..."
    (cd "$REPO_ROOT/web" && npm install --silent)
  fi
  (cd "$REPO_ROOT/web" && PORT="$WEB_PORT" npm run dev > "$LOG_DIR/web.log" 2>&1) &
  WEB_PID=$!
  write_pid web "$WEB_PID"
  echo "  ✓ Next.js starting (pid $WEB_PID, see $LOG_DIR/web.log)"
else
  echo "ℹ web/ not scaffolded yet — skipping dev server"
fi

# ── 6. Start indexer (optional) ──────────────────────────────────────
if [ "${SKIP_INDEXER:-0}" != "1" ] && [ -f "$REPO_ROOT/indexer/package.json" ]; then
  echo "→ Starting indexer..."
  if [ ! -d "$REPO_ROOT/indexer/node_modules" ]; then
    (cd "$REPO_ROOT/indexer" && npm install --silent)
  fi
  (cd "$REPO_ROOT/indexer" && INDEXER_PORT="$INDEXER_PORT" npm start > "$LOG_DIR/indexer.log" 2>&1) &
  INDEXER_PID=$!
  write_pid indexer "$INDEXER_PID"
  echo "  ✓ Indexer starting (pid $INDEXER_PID)"
fi

# ── 7. Summary ───────────────────────────────────────────────────────
echo ""
echo "✓ HemaChain local stack running:"
echo "   • Mode      : ${SEED:-0}" | sed 's/0$/Deploy (empty chain)/; s/1$/Seed (deploy + demo data)/'
echo "   • Anvil RPC : ${RPC_URL}  (chainId 31337)"
echo "   • Frontend  : http://localhost:${WEB_PORT}"
if [ "${SKIP_INDEXER:-0}" != "1" ] && [ -f "$REPO_ROOT/indexer/package.json" ]; then
  echo "   • Indexer   : http://localhost:${INDEXER_PORT}/health  (live SSE on /stream)"
fi
if [ "${SEED:-0}" = "1" ]; then
  echo "   • Demo      : http://localhost:${WEB_PORT}/verify/c1 (cold-chain + recall) · /verify/u1 · /es/certificates/2 (revoked)"
fi
echo "   • Logs      : ${LOG_DIR}/"
echo "   • PIDs      : ${PID_FILE}"
echo "   • Stop with : ./stop.sh"
