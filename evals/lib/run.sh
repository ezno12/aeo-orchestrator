#!/usr/bin/env bash
# Run one headless Claude Code session for an AEO eval.
# usage: run.sh <fixture-dir> <out-prefix> <model> <max-turns> <prompt> [extra claude args...]
# env:   CC (path to the claude binary; default: claude on PATH)
set -u
FIX="$1"; OUT="$2"; MODEL="$3"; TURNS="$4"; PROMPT="$5"; shift 5
CC="${CC:-claude}"
# Git Bash would otherwise rewrite a prompt like "/design" into a Windows path.
export MSYS_NO_PATHCONV=1
mkdir -p "$(dirname "$OUT")"
cd "$FIX" || exit 9
"$CC" -p "$PROMPT" --model "$MODEL" --output-format stream-json --verbose --max-turns "$TURNS" "$@" \
  < /dev/null > "$OUT.jsonl" 2> "$OUT.err"
echo "$(basename "$OUT") exit=$?"
