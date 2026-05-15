#!/usr/bin/env bash
# install-hooks.sh — activate the versioned git hooks under scripts/hooks/.
#
# Modern git supports `core.hooksPath` so hooks can live anywhere in the tree.
# We point it at scripts/hooks/ which means:
#   • hooks are versioned and shared with every clone
#   • no symlinks needed
#   • running this once per clone is enough
#
# Bypass any single invocation with SKIP_HOOKS=1.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

HOOKS_DIR="scripts/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "✖ $HOOKS_DIR not found (run from repo root)"
  exit 1
fi

chmod +x "$HOOKS_DIR"/* 2>/dev/null || true

git config core.hooksPath "$HOOKS_DIR"

echo "✓ git hooks activated (core.hooksPath = $HOOKS_DIR)"
echo ""
echo "Active hooks:"
for h in "$HOOKS_DIR"/*; do
  name=$(basename "$h")
  case "$name" in
    pre-commit|commit-msg|pre-push|post-commit|post-merge|post-checkout)
      echo "  • $name"
      ;;
  esac
done
echo ""
echo "Bypass envs:"
echo "  SKIP_HOOKS=1   — skip everything"
echo "  SKIP_TESTS=1   — skip pre-push tests (still mirrors)"
echo "  SKIP_MIRROR=1  — skip cross-remote mirror push"
