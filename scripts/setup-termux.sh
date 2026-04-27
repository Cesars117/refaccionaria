#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "[1/7] Updating Termux packages..."
pkg update -y
pkg upgrade -y

echo "[2/7] Installing Node.js..."
pkg install -y nodejs

echo "[3/7] Installing npm dependencies..."
npm install

echo "[4/7] Generating Prisma client..."
npx prisma generate

echo "[5/7] Running Prisma migrations..."
npx prisma migrate deploy

echo "[6/7] Restoring SQLite backup..."
node scripts/restore-to-sqlite.js

echo "[7/7] Building production app..."
npm run build

echo "Setup finished. Run: bash scripts/start-termux.sh"
