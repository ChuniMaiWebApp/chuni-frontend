#!/usr/bin/env bash
# =============================================================================
# Deploys the Nuxt app on the VPS.
#
#   ./scripts/deploy.sh
#
# Rolls back to the previous image if the new build does not serve a rendered
# page.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

APP="http://127.0.0.1:3100/"
ROLLBACK_TAG="chunimai/web:rollback"

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; }

if ! docker network inspect chunimai >/dev/null 2>&1; then
  fail "The 'chunimai' network does not exist. Create it once:"
  fail "  docker network create chunimai"
  exit 1
fi

log "===== WEB DEPLOY $(date -u +%Y-%m-%dT%H:%M:%SZ) ====="

log "Fetching latest code"
BRANCH="${DEPLOY_BRANCH:-$(git symbolic-ref --short HEAD)}"
git fetch --prune origin
git reset --hard "origin/$BRANCH"
log "Deploying commit: $(git rev-parse --short HEAD) on $BRANCH"

if docker image inspect chunimai/web:latest >/dev/null 2>&1; then
  docker tag chunimai/web:latest "$ROLLBACK_TAG"
  HAVE_ROLLBACK=true
else
  HAVE_ROLLBACK=false
fi

log "Building image"
# Nuxt's build is the peak memory moment of a deploy. vps-setup.sh creates swap
# for exactly this; without it the build is OOM-killed and the only symptom is
# the word "Killed" with no stack trace.
docker compose build

log "Starting container"
docker compose up -d

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

if health_check; then
  log "===== WEB DEPLOY OK — $(git rev-parse --short HEAD) ====="
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

fail "Deploy failed. Container logs:"
docker compose logs --tail 40 web || true

if [ "$HAVE_ROLLBACK" = true ]; then
  fail "Rolling back to the previous image"
  docker tag "$ROLLBACK_TAG" chunimai/web:latest
  docker compose up -d --no-build

  if health_check; then
    fail "Rolled back. The new commit is broken — do not redeploy it unchanged."
    exit 1
  fi

  fail "ROLLBACK ALSO FAILED. Check: docker compose logs web"
  exit 2
fi

fail "No previous image to roll back to (first deploy)."
exit 1
