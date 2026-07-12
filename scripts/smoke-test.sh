#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo "----- backend health -----"
curl -fsS "$BACKEND_URL/health"
echo

echo "----- frontend health -----"
curl -fsSI "$FRONTEND_URL" >/dev/null
echo "frontend ok"

echo "----- markets api -----"
curl -fsS "$BACKEND_URL/api/markets"
echo

echo "----- price update api -----"
curl -fsS -X POST "$BACKEND_URL/api/prices/update" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "XAUUSD",
    "price": "2400"
  }'
echo

echo "smoke test passed"
