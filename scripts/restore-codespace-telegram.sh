#!/usr/bin/env bash
set -euo pipefail

docker compose up -d

if [ -z "${CODESPACE_NAME:-}" ]; then
  echo "CODESPACE_NAME is not set."
  exit 1
fi

set -a
source .env
set +a

FRONTEND_PUBLIC_URL="https://${CODESPACE_NAME}-5173.app.github.dev/"
BACKEND_PUBLIC_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
WEBHOOK_URL="$BACKEND_PUBLIC_URL/api/telegram/webhook"

gh codespace ports visibility 3000:public -c "$CODESPACE_NAME"
gh codespace ports visibility 5173:public -c "$CODESPACE_NAME"

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}" | jq

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"Open App\",\"web_app\":{\"url\":\"${FRONTEND_PUBLIC_URL}\"}}}" | jq

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq

docker compose ps
