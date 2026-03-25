#!/bin/bash
set -e

echo "Building new images..."
docker compose -f docker-compose.prod.yml build api frontend

echo "Restarting API..."
docker compose -f docker-compose.prod.yml up -d --no-deps api

echo "Restarting frontend..."
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

echo "Cleaning up old images..."
docker image prune -f

echo "Done."
