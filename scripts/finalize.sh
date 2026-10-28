#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
repo="${1:-mtjako/mega-s01e03}"
bash scripts/publish.sh "$repo"
node scripts/close-issues.mjs "$repo"
