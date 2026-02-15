#!/bin/bash
# nuke.sh — Wipe all clawkaka containers, volumes, and DB clean
# Usage: ./infra/nuke.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Clawkaka Nuke ===${NC}"
echo ""

# 1. Stop and remove all sandbox containers
echo -e "${YELLOW}[1/5] Stopping sandbox containers...${NC}"
SANDBOX_CONTAINERS=$(docker ps -a --filter "ancestor=clawkaka-sandbox" --format "{{.ID}}" 2>/dev/null || true)
if [ -n "$SANDBOX_CONTAINERS" ]; then
  echo "$SANDBOX_CONTAINERS" | xargs docker rm -f
  echo -e "${GREEN}  Removed sandbox containers${NC}"
else
  echo "  No sandbox containers found"
fi

# Also catch any named clawkaka-sandbox-* containers
NAMED_CONTAINERS=$(docker ps -a --filter "name=clawkaka-sandbox" --format "{{.ID}}" 2>/dev/null || true)
if [ -n "$NAMED_CONTAINERS" ]; then
  echo "$NAMED_CONTAINERS" | xargs docker rm -f 2>/dev/null || true
  echo -e "${GREEN}  Removed named sandbox containers${NC}"
fi

# 2. Stop infra compose stack (postgres)
echo -e "${YELLOW}[2/5] Stopping docker-compose stack...${NC}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
  docker compose -f "$SCRIPT_DIR/docker-compose.yml" down -v 2>/dev/null || true
  echo -e "${GREEN}  Compose stack down${NC}"
else
  echo "  No docker-compose.yml found in infra/"
fi

# 3. Remove orphan volumes
echo -e "${YELLOW}[3/5] Cleaning volumes...${NC}"
for vol in $(docker volume ls --format "{{.Name}}" | grep -i "clawkaka\|backend_postgres" 2>/dev/null || true); do
  docker volume rm "$vol" 2>/dev/null && echo -e "${GREEN}  Removed volume: $vol${NC}" || true
done

# 4. Remove prisma migrations lock / local DB state
echo -e "${YELLOW}[4/5] Cleaning local Prisma state...${NC}"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../backend" && pwd)"
if [ -d "$BACKEND_DIR/prisma/migrations" ]; then
  rm -rf "$BACKEND_DIR/prisma/migrations"
  echo -e "${GREEN}  Removed prisma/migrations${NC}"
fi
# Remove generated client
if [ -d "$BACKEND_DIR/node_modules/.prisma" ]; then
  rm -rf "$BACKEND_DIR/node_modules/.prisma"
  echo -e "${GREEN}  Removed generated Prisma client${NC}"
fi

# 5. Prune dangling images
echo -e "${YELLOW}[5/5] Pruning dangling images...${NC}"
docker image prune -f --filter "label=clawkaka" 2>/dev/null || true
# Also remove the sandbox image if it exists
docker rmi clawkaka-sandbox 2>/dev/null && echo -e "${GREEN}  Removed clawkaka-sandbox image${NC}" || true

echo ""
echo -e "${GREEN}=== Nuke complete ===${NC}"
echo ""
echo "Next steps:"
echo "  cd infra && docker compose up -d        # Start fresh postgres"
echo "  cd backend && npx prisma migrate dev     # Create tables"
echo "  cd backend && npm run dev                # Start backend"
