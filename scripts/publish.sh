#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

repo="${1:?Usage: bash scripts/publish.sh owner/repo [--create]}"
if [[ ! "$repo" =~ ^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$ ]]; then
  echo 'Expected owner/repo.' >&2
  exit 1
fi

gh auth status
protocol="$(gh config get git_protocol --host github.com)"
case "$protocol" in
  ssh) remote_url="git@github.com:$repo.git" ;;
  https) remote_url="https://github.com/$repo.git" ;;
  *) echo "Unsupported Git protocol: $protocol" >&2; exit 1 ;;
esac
actor="$(gh api user --jq .login)"
if [[ "${repo%%/*}" != "$actor" ]]; then
  echo "Use a repository in your own account ($actor)." >&2
  exit 1
fi

# Build and verify the deliverables before changing GitHub.
npm install --no-audit --no-fund
node scripts/prepare-issues.mjs
npm run build

if [[ "${2:-}" == '--create' ]]; then
  if ! gh repo view "$repo" --json name >/dev/null 2>&1; then
    gh repo create "$repo" --public --description 'MEGA.dev S01E03: support ticket 4471 review and rendered knowledge base'
  fi
fi
visibility="$(gh repo view "$repo" --json visibility --jq .visibility)"
if [[ "$visibility" != 'PUBLIC' ]]; then
  echo 'The selected repository must already be public.' >&2
  exit 1
fi

# Reuse this challenge's exact titles on a repeat run; never create duplicate tickets.
gh issue list --repo "$repo" --state all --limit 100 --json number,title,url > /tmp/mega-s01e03-existing-issues.json
node scripts/publish-issues.mjs "$repo" /tmp/mega-s01e03-existing-issues.json
npm run build

if [[ ! -d .git ]]; then
  git init -b main
fi
if git remote get-url origin >/dev/null 2>&1; then
  origin="$(git remote get-url origin)"
  if [[ "$origin" != "https://github.com/$repo.git" && "$origin" != "git@github.com:$repo.git" ]]; then
    echo 'Existing origin differs from selected repo; stopping without changing it.' >&2
    exit 1
  fi
  git remote set-url origin "$remote_url"
else
  git remote add origin "$remote_url"
fi
git add README.md .gitignore package.json package-lock.json svelte.config.js vite.config.js src scripts evidence deliverables rendered
if ! git diff --cached --quiet; then
  actor_id="$(gh api user --jq .id)"
  git -c "user.name=$actor" -c "user.email=$actor_id+$actor@users.noreply.github.com" commit -m 'Review ticket 4471 by cause and render signed kb pages'
fi
git push --set-upstream origin HEAD
echo "Published https://github.com/$repo"
echo 'Return to the harness to submit the repository to the course.'
