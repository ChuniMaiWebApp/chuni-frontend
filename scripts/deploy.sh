#!/usr/bin/env bash
# =============================================================================
# Deploys the Nuxt app on the VPS.
#
#   ./scripts/deploy.sh              # normal deploy
#   ./scripts/deploy.sh --first-run  # `pm2 start` instead of reload
#
# Rolls back to the previous commit if the new build does not serve a page.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FIRST_RUN=false
[ "${1:-}" = "--first-run" ] && FIRST_RUN=true

APP="http://127.0.0.1:3100/"

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; }

build_and_reload() {
  log "Installing dependencies"
  npm ci

  log "Building"
  # Nuxt's build is the peak memory moment of a deploy. vps-setup.sh creates
  # swap for exactly this; without it the build is OOM-killed and the only
  # symptom is the word "Killed" with no stack trace.
  npm run build

  if [ "$FIRST_RUN" = true ]; then
    log "Starting PM2 process"
    pm2 start ecosystem.config.js
    pm2 save
  else
    log "Reloading PM2 process"
    pm2 startOrReload ecosystem.config.js --update-env
  fi
}

health_check() {
  log "Health check"

  for attempt in $(seq 1 20); do
    sleep 3

    code=$(curl -fsS --max-time 10 -o /dev/null -w '%{http_code}' "$APP" 2>/dev/null || echo 000)

    if [ "$code" = "200" ]; then
      # 200 alone only proves Nitro is answering. The home page is server
      # rendered, so its own name in the HTML proves the render ran rather than
      # erroring into an empty shell.
      if curl -fsS --max-time 10 "$APP" | grep -q "ChunithmQueue"; then
        echo "  web: 200, SSR content present"
        return 0
      fi

      fail "Served 200 but the HTML has no rendered content — SSR is failing."
      return 1
    fi

    echo "  attempt $attempt/20 — http $code"
  done

  fail "App did not become healthy within 60s."
  return 1
}

rollback() {
  local previous="$1"

  fail "Rolling back to $previous"
  git reset --hard "$previous"
  npm ci
  npm run build
  pm2 startOrReload ecosystem.config.js --update-env

  if health_check; then
    fail "Rolled back to $previous. The new commit is broken — do not redeploy it unchanged."
    exit 1
  fi

  fail "ROLLBACK ALSO FAILED. The site is down. Check: pm2 logs chuni-frontend --lines 100"
  exit 2
}

log "===== WEB DEPLOY $(date -u +%Y-%m-%dT%H:%M:%SZ) ====="

PREVIOUS_SHA=$(git rev-parse HEAD)
log "Current commit: $PREVIOUS_SHA"

log "Fetching latest code"
# Whatever branch the checkout is on. Hardcoding `main` breaks silently on a
# repo whose default is still `master`: the fetch succeeds, the reset fails,
# and `set -e` aborts the deploy with a message about an unknown revision.
BRANCH="${DEPLOY_BRANCH:-$(git symbolic-ref --short HEAD)}"
git fetch --prune origin
git reset --hard "origin/$BRANCH"
log "Deploying commit: $(git rev-parse HEAD) on $BRANCH"

build_and_reload

if health_check; then
  log "===== WEB DEPLOY OK — $(git rev-parse HEAD) ====="
  pm2 save
  exit 0
fi

rollback "$PREVIOUS_SHA"
