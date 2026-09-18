#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

wait_for_url() {
  local name="$1"
  local url="$2"
  local command="$3"

  for attempt in {1..20}; do
    if eval "$command" >/dev/null 2>&1; then
      echo "$name ok"
      return 0
    fi

    echo "$name not ready yet, retrying... ($attempt/20)"
    sleep 2
  done

  echo "$name failed to become ready"
  eval "$command"
}

echo "----- backend health -----"
wait_for_url "backend" "$BACKEND_URL/health" "curl -fsS '$BACKEND_URL/health'"
curl -fsS "$BACKEND_URL/health"
echo

echo "----- frontend health -----"
wait_for_url "frontend" "$FRONTEND_URL" "curl -fsSI '$FRONTEND_URL'"

echo "----- markets api -----"
curl -fsS "$BACKEND_URL/api/markets"
echo

echo "----- protected price update api -----"
status_code="$(curl -sS -o /tmp/ramofinance-price-update-response.json -w '%{http_code}' -X POST "$BACKEND_URL/api/prices/update" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "XAUUSD",
    "price": "2400"
  }')"

if [[ "$status_code" != "401" ]]; then
  echo "expected unauthenticated price update to return 401, received $status_code"
  cat /tmp/ramofinance-price-update-response.json
  exit 1
fi

echo "protected endpoint correctly returned 401"

echo "smoke test passed"
