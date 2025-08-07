#!/bin/bash
set -e

# Generate config.json from environment variables
cat > /opt/app-root/src/dist/config.json << EOF
{
  "apiBaseUrl": "${API_BASE_URL:-http://localhost:8080/api}",
  "appTitle": "${APP_TITLE:-SSVIRT Web UI}",
  "appVersion": "${APP_VERSION:-0.0.1}",
  "logoUrl": "${LOGO_URL:-/vite.svg}"
}
EOF

echo "Generated runtime configuration:"
cat /opt/app-root/src/dist/config.json

# Start the preview server
exec "$@"