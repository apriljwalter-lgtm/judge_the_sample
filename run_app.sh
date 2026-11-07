#!/usr/bin/env bash
# Start the Judge the Sample app on this computer.
# Run from a Bash terminal (Git Bash on Windows):  bash run_app.sh
set -e
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Install Node.js 20 or newer (it includes npm), then try again."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run: installing dependencies (this can take a minute)..."
  npm install
fi

echo ""
echo "Starting the app. Open http://localhost:5173/ in your browser"
echo "(if Vite prints a different address below, open that one instead)."
echo "Press Ctrl+C in this terminal to stop the app."
echo ""
npm run dev
