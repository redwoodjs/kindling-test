#!/bin/bash
set -e
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
nohup pnpm dev > /tmp/dev-server.log 2>&1 &
disown
exit 0
