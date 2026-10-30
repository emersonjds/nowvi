#!/bin/sh
# Fails under 90% of lines, functions or regions; main.rs only wires and stays out.
# Needs the test Postgres on 55432 (see .claude/CLAUDE.md) and llvm@22 from Homebrew,
# unless LLVM_COV and LLVM_PROFDATA already point at an llvm-tools pair.
set -eu
cd "$(dirname "$0")/.."
export LLVM_COV="${LLVM_COV:-$(brew --prefix llvm@22)/bin/llvm-cov}"
export LLVM_PROFDATA="${LLVM_PROFDATA:-$(brew --prefix llvm@22)/bin/llvm-profdata}"
exec cargo llvm-cov \
  --ignore-filename-regex '/main\.rs$' \
  --fail-under-lines 90 \
  --fail-under-functions 90 \
  --fail-under-regions 90
