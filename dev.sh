#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ensure_docker_running() {
    if docker info >/dev/null 2>&1; then
        return 0
    fi

    echo "Docker daemon is not running. Starting Docker..."

    case "$(uname -s)" in
        Darwin)
            open -a Docker
            ;;
        *)
            echo "Please start Docker daemon and re-run this script."
            exit 1
            ;;
    esac

    echo "Waiting for Docker daemon to become ready..."
    local retries=60
    local delay=2

    for ((i=1; i<=retries; i++)); do
        if docker info >/dev/null 2>&1; then
            echo "Docker is ready."
            return 0
        fi
        sleep "$delay"
    done

    echo "Docker did not become ready in time."
    exit 1
}

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
ensure_docker_running

echo "Starting Docker containers..."
docker-compose -f "$BASE_DIR/docker-compose.dev.yml" up 
echo "Docker containers started."
echo ""

echo ""
echo "All docker services running. Press d to stop."
wait
