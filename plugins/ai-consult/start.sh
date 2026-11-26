#!/bin/sh
set -eu
cd "$(dirname "$0")"

for runtime in /Applications/ChatGPT.app/Contents/Resources/node /Applications/Codex.app/Contents/Resources/node; do
  if [ -x "$runtime" ]; then
    exec "$runtime" ./dist/server.cjs
  fi
done
exec node ./dist/server.cjs
