#!/bin/bash
# Run the app with saving on a local machine (Docker Desktop must be installed).
# Usage from the repo root: sh scripts/dev-local.sh   then open http://localhost:5173
set -e
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/pyramid
export MSYS_NO_PATHCONV=1 # stop Git Bash rewriting BASE_PATH=/ into a Windows path

docker start pyramid-db >/dev/null 2>&1 || docker run -d --name pyramid-db --restart unless-stopped \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pyramid -p 5432:5432 \
  -v pyramid-db-data:/var/lib/postgresql/data postgres:16 >/dev/null
until docker exec pyramid-db pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
pnpm --filter @workspace/db run push

pnpm --filter @workspace/api-server run build
NODE_ENV=development PORT=5000 pnpm --filter @workspace/api-server run start &
trap 'kill $! 2>/dev/null' EXIT

PORT=5173 BASE_PATH=/ API_PROXY_TARGET=http://localhost:5000 \
  pnpm --filter @workspace/manufacturing-data-pyramid run dev
