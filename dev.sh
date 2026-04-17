#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Cleanup on exit ───────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo "Shutting down..."
    kill "$NG_PID" "$DOTNET_PID" 2>/dev/null
    wait "$NG_PID" "$DOTNET_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── 1. Docker dev containers ──────────────────────────────────────────────────
echo "Starting Docker containers..."
docker compose -f "$BASE_DIR/docker-compose.dev.yml" up -d
echo "Docker containers started."
echo ""

echo ""
echo "All docker services running. Press d to stop."
wait
