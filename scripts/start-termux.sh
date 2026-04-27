#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Starting app on http://localhost:3000 ..."
npm start -- -H 127.0.0.1 -p 3000
